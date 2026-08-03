import { useEffect, useMemo, useState } from 'react'
import {
  Radar,
  RefreshCw,
  ExternalLink,
  BookmarkPlus,
  Sparkles,
  SlidersHorizontal,
  Check,
} from 'lucide-react'
import Card from '../components/Card'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { fetchSinglePrice, seedCache } from '../lib/prices'
import { formatCurrency, formatPercent, getYahooFinanceUrl } from '../lib/format'
import {
  getRows,
  getScanMeta,
  startScan,
  subscribe,
} from '../lib/screener'
import { SECTORS } from '../lib/screenerUniverse'

const YAHOO_SCREENERS = [
  { label: 'Undervalued large caps', id: 'undervalued_large_caps' },
  { label: 'Undervalued growth stocks', id: 'undervalued_growth_stocks' },
  { label: 'Growth technology stocks', id: 'growth_technology_stocks' },
  { label: 'Day gainers', id: 'day_gainers' },
  { label: 'Most active', id: 'most_actives' },
  { label: 'Small cap gainers', id: 'small_cap_gainers' },
]

const CAP_FILTERS = [
  { value: 'all', label: 'Any size' },
  { value: 'mega', label: 'Mega ($200B+)', min: 200_000 },
  { value: 'large', label: 'Large ($10B+)', min: 10_000 },
  { value: 'mid', label: 'Mid (under $10B)', max: 10_000 },
]

const SORTS = [
  { value: 'score', label: 'Opportunity score' },
  { value: 'pe', label: 'P/E (low first)' },
  { value: 'divYield', label: 'Dividend yield' },
  { value: 'revGrowth', label: 'Revenue growth' },
  { value: 'dayChangePct', label: "Today's move" },
  { value: 'marketCap', label: 'Market cap' },
]

function formatMarketCap(millions) {
  if (!millions) return '—'
  if (millions >= 1_000_000) return `$${(millions / 1_000_000).toFixed(2)}T`
  if (millions >= 1_000) return `$${(millions / 1_000).toFixed(1)}B`
  return `$${millions.toFixed(0)}M`
}

function fmt(value, digits = 1, suffix = '') {
  if (value === null || value === undefined) return '—'
  return value.toFixed(digits) + suffix
}

function scoreColor(score) {
  if (score >= 6.5) return 'bg-emerald-100 text-emerald-700'
  if (score >= 4.5) return 'bg-amber-100 text-amber-700'
  return 'bg-slate-100 text-slate-500'
}

function ScoreBadge({ score }) {
  if (score === null || score === undefined)
    return <span className="text-slate-400">—</span>
  return (
    <span
      className={`inline-flex items-center justify-center rounded-lg px-2 py-0.5 text-xs font-semibold tabular-nums ${scoreColor(score)}`}
    >
      {score.toFixed(1)}
    </span>
  )
}

function DayChange({ value }) {
  if (value === null || value === undefined)
    return <span className="text-slate-400">—</span>
  const cls =
    value > 0
      ? 'text-emerald-600'
      : value < 0
        ? 'text-rose-600'
        : 'text-slate-400'
  return (
    <span className={`${cls} tabular-nums`}>
      {value > 0 ? '+' : ''}
      {formatPercent(value)}
    </span>
  )
}

function OpportunityCard({ row, delay, onAdd, added, adding }) {
  return (
    <Card delay={delay} className="p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold text-slate-900">
              {row.symbol}
            </span>
            <ScoreBadge score={row.score} />
          </div>
          <div className="text-xs text-slate-500 truncate">{row.name}</div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-sm font-semibold text-slate-900 tabular-nums">
            {row.price ? formatCurrency(row.price) : '—'}
          </div>
          <div className="text-xs">
            <DayChange value={row.dayChangePct} />
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {row.reasons.slice(0, 3).map((reason) => (
          <span key={reason} className="vcf-tag">
            {reason}
          </span>
        ))}
      </div>
      <div className="mt-auto flex items-center gap-2 pt-1">
        <a
          href={getYahooFinanceUrl(row.symbol)}
          target="_blank"
          rel="noopener noreferrer"
          className="vcf-btn-secondary flex-1 !py-1.5 text-xs inline-flex items-center justify-center gap-1.5"
        >
          <ExternalLink size={13} />
          Yahoo Finance
        </a>
        <button
          onClick={() => onAdd(row)}
          disabled={added || adding}
          className="vcf-btn-ghost flex-1 !py-1.5 text-xs inline-flex items-center justify-center gap-1.5 disabled:opacity-60"
        >
          {added ? <Check size={13} /> : <BookmarkPlus size={13} />}
          {added ? 'On watchlist' : adding ? 'Adding…' : 'Watchlist'}
        </button>
      </div>
    </Card>
  )
}

export default function Screener() {
  const { user } = useAuth()
  const { watchlist, myAccount, refresh, setPriceCache } = useData()

  const [rows, setRows] = useState(() => getRows())
  const [meta, setMeta] = useState(() => getScanMeta())
  const [addingTicker, setAddingTicker] = useState(null)
  const [filters, setFilters] = useState({
    search: '',
    sector: 'all',
    maxPe: '',
    minYield: '',
    minRoe: '',
    cap: 'all',
    sort: 'score',
  })

  useEffect(() => {
    const unsub = subscribe(() => {
      setRows(getRows())
      setMeta(getScanMeta())
    })
    startScan()
    return unsub
  }, [])

  const watchlistTickers = useMemo(
    () => new Set(watchlist.map((w) => w.ticker)),
    [watchlist]
  )

  const setFilter = (key) => (e) =>
    setFilters((f) => ({ ...f, [key]: e.target.value }))

  const filtered = useMemo(() => {
    const search = filters.search.trim().toLowerCase()
    const maxPe = parseFloat(filters.maxPe)
    const minYield = parseFloat(filters.minYield)
    const minRoe = parseFloat(filters.minRoe)
    const capFilter = CAP_FILTERS.find((c) => c.value === filters.cap)

    const result = rows.filter((r) => {
      if (
        search &&
        !r.symbol.toLowerCase().includes(search) &&
        !r.name.toLowerCase().includes(search)
      )
        return false
      if (filters.sector !== 'all' && r.sector !== filters.sector) return false
      if (!Number.isNaN(maxPe) && !(r.pe !== null && r.pe > 0 && r.pe <= maxPe))
        return false
      if (!Number.isNaN(minYield) && !(r.divYield !== null && r.divYield >= minYield))
        return false
      if (!Number.isNaN(minRoe) && !(r.roe !== null && r.roe >= minRoe))
        return false
      if (capFilter?.min && !(r.marketCap && r.marketCap >= capFilter.min))
        return false
      if (capFilter?.max && !(r.marketCap && r.marketCap < capFilter.max))
        return false
      return true
    })

    const key = filters.sort
    const asc = key === 'pe'
    result.sort((a, b) => {
      const av = a[key]
      const bv = b[key]
      if (av === null || av === undefined) return 1
      if (bv === null || bv === undefined) return -1
      return asc ? av - bv : bv - av
    })
    return result
  }, [rows, filters])

  const topOpportunities = useMemo(
    () =>
      rows
        .filter((r) => r.score !== null && r.reasons.length >= 2)
        .sort((a, b) => b.score - a.score)
        .slice(0, 6),
    [rows]
  )

  const handleAddToWatchlist = async (row) => {
    if (watchlistTickers.has(row.symbol)) return
    setAddingTicker(row.symbol)
    try {
      const live = await fetchSinglePrice(row.symbol)
      const price = live?.price ?? row.price
      if (!price) {
        window.alert(`Could not fetch a live price for "${row.symbol}".`)
        return
      }
      if (live) {
        seedCache(row.symbol, live)
        setPriceCache((prev) => ({ ...(prev || {}), [row.symbol]: live }))
      }
      const { error } = await supabase.from('watchlist').insert({
        ticker: row.symbol,
        added_by_user_id: user.id,
        added_by_name: myAccount?.name || user.email || 'Unknown',
        added_price: price,
        notes: `Added from screener${row.reasons.length ? ': ' + row.reasons.slice(0, 2).join('; ') : ''}`,
      })
      if (error) {
        window.alert('Error adding ticker: ' + error.message)
        return
      }
      await refresh()
    } finally {
      setAddingTicker(null)
    }
  }

  const dataAge = meta.ageHours

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight flex items-center gap-2">
            <Radar size={22} className="text-vcf-700" />
            Stock Screener
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Automated fundamental scan of {meta.total} large and mid caps —
            spot opportunities, then dig in on Yahoo Finance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {dataAge !== null && !meta.scanning && (
            <span className="text-xs text-slate-400">
              Data {dataAge < 1 ? 'under an hour' : `~${dataAge}h`} old
            </span>
          )}
          <button
            onClick={() => startScan({ force: true })}
            disabled={meta.scanning}
            className="vcf-btn-secondary inline-flex items-center gap-2 disabled:opacity-60"
          >
            <RefreshCw
              size={15}
              className={meta.scanning ? 'animate-spin' : ''}
            />
            {meta.scanning ? 'Scanning…' : 'Refresh data'}
          </button>
        </div>
      </div>

      {meta.scanning && (
        <Card className="p-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-slate-600">
              Scanning universe… fundamentals load as they arrive.
            </span>
            <span className="text-slate-500 tabular-nums">
              {meta.loadedCount}/{meta.total}
            </span>
          </div>
          <div className="vcf-progress">
            <div
              className="h-full rounded-full bg-vcf-600 transition-all duration-500"
              style={{ width: `${(meta.loadedCount / meta.total) * 100}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Requests are paced to stay under Finnhub's free rate limit — a
            full refresh takes a few minutes and is then cached for 24 hours.
          </p>
        </Card>
      )}

      {/* Top opportunities */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <Sparkles size={15} className="text-vcf-700" />
          Top opportunities right now
        </h2>
        {topOpportunities.length === 0 ? (
          <Card className="p-6 text-sm text-slate-500">
            {meta.scanning
              ? 'Crunching fundamentals — top picks will appear here shortly.'
              : 'No scan data yet. Hit "Refresh data" to run the first scan.'}
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {topOpportunities.map((row, i) => (
              <OpportunityCard
                key={row.symbol}
                row={row}
                delay={i * 0.05}
                onAdd={handleAddToWatchlist}
                added={watchlistTickers.has(row.symbol)}
                adding={addingTicker === row.symbol}
              />
            ))}
          </div>
        )}
        <p className="text-xs text-slate-400">
          Scores blend valuation (P/E, P/B, distance from 52-week high),
          quality (ROE, margins, debt) and growth. A starting point for
          research — not a recommendation.
        </p>
      </section>

      {/* Screener */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <SlidersHorizontal size={15} className="text-vcf-700" />
          Screen the universe
        </h2>
        <Card className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
            <div className="col-span-2 sm:col-span-3 lg:col-span-2">
              <label className="vcf-label">Search</label>
              <input
                className="vcf-input"
                placeholder="Ticker or name"
                value={filters.search}
                onChange={setFilter('search')}
              />
            </div>
            <div>
              <label className="vcf-label">Sector</label>
              <select
                className="vcf-input"
                value={filters.sector}
                onChange={setFilter('sector')}
              >
                <option value="all">All sectors</option>
                {SECTORS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="vcf-label">Max P/E</label>
              <input
                className="vcf-input"
                type="number"
                placeholder="Any"
                value={filters.maxPe}
                onChange={setFilter('maxPe')}
              />
            </div>
            <div>
              <label className="vcf-label">Min div %</label>
              <input
                className="vcf-input"
                type="number"
                placeholder="Any"
                value={filters.minYield}
                onChange={setFilter('minYield')}
              />
            </div>
            <div>
              <label className="vcf-label">Min ROE %</label>
              <input
                className="vcf-input"
                type="number"
                placeholder="Any"
                value={filters.minRoe}
                onChange={setFilter('minRoe')}
              />
            </div>
            <div>
              <label className="vcf-label">Market cap</label>
              <select
                className="vcf-input"
                value={filters.cap}
                onChange={setFilter('cap')}
              >
                {CAP_FILTERS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
            <span className="text-xs text-slate-400">
              {filtered.length} of {rows.length} stocks match
            </span>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500">Sort by</label>
              <select
                className="vcf-input !w-auto !py-1.5 text-xs"
                value={filters.sort}
                onChange={setFilter('sort')}
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="vcf-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Sector</th>
                  <th className="text-right">Price</th>
                  <th className="text-right">Today</th>
                  <th className="text-right">P/E</th>
                  <th className="text-right">P/B</th>
                  <th className="text-right">Div %</th>
                  <th className="text-right">ROE %</th>
                  <th className="text-right">Rev Δ%</th>
                  <th className="text-right">vs 52w high</th>
                  <th className="text-right">Mkt cap</th>
                  <th className="text-right">Score</th>
                  <th className="text-right"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.symbol}>
                    <td>
                      <div className="font-medium text-slate-900">
                        {row.symbol}
                      </div>
                      <div className="text-xs text-slate-400 truncate max-w-[160px]">
                        {row.name}
                      </div>
                    </td>
                    <td>
                      <span className="text-xs text-slate-500">
                        {row.sector}
                      </span>
                    </td>
                    <td className="text-right tabular-nums">
                      {row.price ? formatCurrency(row.price) : '—'}
                    </td>
                    <td className="text-right">
                      <DayChange value={row.dayChangePct} />
                    </td>
                    <td className="text-right tabular-nums">
                      {row.pe !== null && row.pe > 0 ? fmt(row.pe) : '—'}
                    </td>
                    <td className="text-right tabular-nums">{fmt(row.pb)}</td>
                    <td className="text-right tabular-nums">
                      {fmt(row.divYield)}
                    </td>
                    <td className="text-right tabular-nums">
                      {fmt(row.roe, 0)}
                    </td>
                    <td className="text-right tabular-nums">
                      {fmt(row.revGrowth, 0)}
                    </td>
                    <td className="text-right tabular-nums">
                      {row.vsHigh52 !== null && row.vsHigh52 !== undefined ? (
                        <span
                          className={
                            row.vsHigh52 < -0.15
                              ? 'text-amber-600'
                              : 'text-slate-500'
                          }
                        >
                          {formatPercent(row.vsHigh52, 0)}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="text-right tabular-nums">
                      {formatMarketCap(row.marketCap)}
                    </td>
                    <td className="text-right">
                      <ScoreBadge score={row.score} />
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleAddToWatchlist(row)}
                          disabled={
                            watchlistTickers.has(row.symbol) ||
                            addingTicker === row.symbol
                          }
                          title={
                            watchlistTickers.has(row.symbol)
                              ? 'Already on watchlist'
                              : 'Add to watchlist'
                          }
                          className="rounded-lg p-1.5 text-slate-400 hover:text-vcf-700 hover:bg-slate-100 transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
                        >
                          {watchlistTickers.has(row.symbol) ? (
                            <Check size={15} />
                          ) : (
                            <BookmarkPlus size={15} />
                          )}
                        </button>
                        <a
                          href={getYahooFinanceUrl(row.symbol)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open on Yahoo Finance"
                          className="rounded-lg p-1.5 text-slate-400 hover:text-vcf-700 hover:bg-slate-100 transition-colors"
                        >
                          <ExternalLink size={15} />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={13}
                      className="text-center text-sm text-slate-400 py-8"
                    >
                      No stocks match these filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      {/* Yahoo Finance popouts */}
      <Card className="p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-sm font-semibold text-slate-700">
              Want a wider net?
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Yahoo Finance's pre-built screeners cover the whole market —
              great for ideas beyond our curated universe.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {YAHOO_SCREENERS.map((s) => (
            <a
              key={s.id}
              href={`https://finance.yahoo.com/screener/predefined/${s.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="vcf-btn-secondary !py-1.5 text-xs inline-flex items-center gap-1.5"
            >
              <ExternalLink size={12} />
              {s.label}
            </a>
          ))}
        </div>
      </Card>
    </div>
  )
}
