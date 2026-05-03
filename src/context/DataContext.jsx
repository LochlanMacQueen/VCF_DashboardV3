import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { supabase } from '../lib/supabase'
import { fetchPrices, getAllCachedPrices } from '../lib/prices'
import { useAuth } from './AuthContext'

const DataContext = createContext(null)

const REFRESH_INTERVAL_MS = 120_000 // 2 minutes

export function DataProvider({ children }) {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState([])
  const [holdings, setHoldings] = useState([])
  const [meetings, setMeetings] = useState([])
  const [pitches, setPitches] = useState([])
  const [votes, setVotes] = useState([])
  const [resources, setResources] = useState([])
  const [benchmarkData, setBenchmarkData] = useState([])
  const [channels, setChannels] = useState([])
  const [watchlist, setWatchlist] = useState([])
  const [priceCache, setPriceCache] = useState(() => getAllCachedPrices())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Track whether a modal is open so the auto-refresh doesn't blow it up
  const modalOpenRef = useRef(0)
  const setModalOpen = (open) => {
    modalOpenRef.current = Math.max(0, modalOpenRef.current + (open ? 1 : -1))
  }

  const refresh = useCallback(async () => {
    try {
      const [
        { data: accountsData },
        { data: holdingsData },
        { data: meetingsData },
        { data: pitchesData },
        { data: votesData },
        { data: resourcesData },
        { data: benchmarkRaw },
        { data: channelsData },
        { data: watchlistData },
      ] = await Promise.all([
        supabase.from('accounts').select('*'),
        supabase.from('holdings').select('*'),
        supabase
          .from('meetings')
          .select('*')
          .order('date', { ascending: false }),
        supabase
          .from('pitches')
          .select('*')
          .order('pitch_date', { ascending: false }),
        supabase.from('votes').select('*'),
        supabase.from('resources').select('*').order('category'),
        supabase.from('benchmark_data').select('*').order('date'),
        supabase.from('channels').select('*').order('created_at'),
        supabase
          .from('watchlist')
          .select('*')
          .order('created_at', { ascending: false }),
      ])

      const acc = accountsData || []
      const hold = holdingsData || []
      const wl = watchlistData || []

      setAccounts(acc)
      setHoldings(hold)
      setMeetings(meetingsData || [])
      setPitches(pitchesData || [])
      setVotes(votesData || [])
      setResources(resourcesData || [])
      setBenchmarkData(benchmarkRaw || [])
      setChannels(channelsData || [])
      setWatchlist(wl)

      // Pull live prices for everything we'll need
      const symbols = [
        ...new Set([
          ...hold.map((h) => h.symbol),
          ...wl.map((w) => w.ticker),
        ]),
      ]
      if (symbols.length > 0) {
        const prices = await fetchPrices(symbols)
        setPriceCache(prices)
      }

      setError(null)
    } catch (e) {
      console.error('Failed to load data', e)
      setError(e)
    }
  }, [])

  // Initial load whenever a user appears
  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    let active = true
    setLoading(true)
    refresh().finally(() => {
      if (active) setLoading(false)
    })
    return () => {
      active = false
    }
  }, [user, refresh])

  // Auto-refresh every 2 minutes (skip if a modal is open)
  useEffect(() => {
    if (!user) return
    const id = setInterval(() => {
      if (modalOpenRef.current > 0) return
      refresh()
    }, REFRESH_INTERVAL_MS)
    return () => clearInterval(id)
  }, [user, refresh])

  // Derived: enriched holdings, fund metrics, NAV
  const enrichedHoldings = useMemo(() => {
    return holdings.map((h) => {
      const priceObj = priceCache[h.symbol] ?? { price: 0, prevClose: 0 }
      const price = Number(priceObj.price) || 0
      const prevClose =
        Number(priceObj.prevClose) > 0 ? Number(priceObj.prevClose) : price
      const shares = Number(h.shares) || 0
      const costBasis = Number(h.cost_basis) || 0
      const marketValue = shares * price
      const prevValue = shares * prevClose
      const costValue = shares * costBasis
      const pnl = marketValue - costValue
      return {
        ...h,
        shares,
        cost_basis: costBasis,
        price,
        prevClose,
        marketValue: Number.isNaN(marketValue) ? 0 : marketValue,
        prevValue: Number.isNaN(prevValue) ? 0 : prevValue,
        costValue: Number.isNaN(costValue) ? 0 : costValue,
        pnl: Number.isNaN(pnl) ? 0 : pnl,
      }
    })
  }, [holdings, priceCache])

  const fundValue = useMemo(
    () => enrichedHoldings.reduce((s, h) => s + (h.marketValue || 0), 0),
    [enrichedHoldings]
  )
  const prevFundValue = useMemo(
    () => enrichedHoldings.reduce((s, h) => s + (h.prevValue || 0), 0),
    [enrichedHoldings]
  )
  const totalUnits = useMemo(
    () => accounts.reduce((s, a) => s + (Number(a.units) || 0), 0),
    [accounts]
  )
  const nav = totalUnits > 0 ? fundValue / totalUnits : 0

  const myAccount = useMemo(
    () => accounts.find((a) => a.owner_user_id === user?.id) || null,
    [accounts, user]
  )
  const role = myAccount?.role || 'investor'
  const myBalance = (Number(myAccount?.units) || 0) * (nav || 0)

  const value = {
    // raw
    accounts,
    holdings,
    meetings,
    pitches,
    votes,
    resources,
    benchmarkData,
    channels,
    watchlist,
    priceCache,
    // derived
    enrichedHoldings,
    fundValue,
    prevFundValue,
    totalUnits,
    nav,
    myAccount,
    role,
    myBalance,
    // status
    loading,
    error,
    // actions
    refresh,
    setModalOpen,
    setPriceCache,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
