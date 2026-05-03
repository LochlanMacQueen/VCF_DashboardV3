// ============================================
// Finnhub price fetching with localStorage cache
// (Ported from V2 with the same 5-min cache + top-up behaviour)
// ============================================

const FINNHUB_KEY = import.meta.env.VITE_FINNHUB_KEY
const CACHE_KEY = 'vcf_price_cache'
const CACHE_TIME_KEY = 'vcf_price_cache_time'
const CACHE_TTL_MS = 5 * 60 * 1000

// In-memory mirror of the cache so successive calls don't hit localStorage repeatedly.
let memCache = null
let memCacheTime = 0

function loadFromStorage() {
  if (memCache) return
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    const cachedTime = localStorage.getItem(CACHE_TIME_KEY)
    if (cached && cachedTime) {
      memCache = JSON.parse(cached)
      memCacheTime = parseInt(cachedTime, 10) || 0
    }
  } catch {
    // ignore
  }
}

function persist(results, fetchTime) {
  memCache = results
  memCacheTime = fetchTime
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(results))
    localStorage.setItem(CACHE_TIME_KEY, String(fetchTime))
  } catch {
    // ignore quota / privacy mode
  }
}

export async function fetchSinglePrice(symbol) {
  if (symbol === 'CASH') return { price: 1, prevClose: 1 }

  if (!FINNHUB_KEY) {
    console.warn('VITE_FINNHUB_KEY missing, skipping price fetch.')
    return null
  }

  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_KEY}`
    )
    if (!res.ok) return null
    const data = await res.json()
    if (data && typeof data.c === 'number' && data.c > 0) {
      return { price: data.c, prevClose: data.pc || data.c }
    }
    return null
  } catch (e) {
    console.error(`Error fetching price for ${symbol}:`, e)
    return null
  }
}

export async function fetchPrices(symbols) {
  loadFromStorage()
  const now = Date.now()
  const cacheFresh = memCache && now - memCacheTime < CACHE_TTL_MS

  if (cacheFresh) {
    const missing = symbols.filter((s) => !memCache[s])
    if (missing.length === 0) return memCache

    const results = { ...memCache }
    const fetched = await Promise.all(
      missing.map(async (sym) => {
        const data = await fetchSinglePrice(sym)
        return { sym, ...(data || { price: null, prevClose: null }) }
      })
    )
    for (const { sym, price, prevClose } of fetched) {
      if (price !== null && price > 0) {
        results[sym] = { price, prevClose }
      } else if (!results[sym]) {
        results[sym] = { price: 0, prevClose: 0 }
      }
    }
    persist(results, memCacheTime) // preserve original cache age
    return results
  }

  const results = { ...(memCache || {}) }
  const fetchResults = await Promise.all(
    symbols.map(async (sym) => {
      const data = await fetchSinglePrice(sym)
      return { sym, ...(data || { price: null, prevClose: null }) }
    })
  )

  for (const { sym, price, prevClose } of fetchResults) {
    if (price !== null && price > 0) {
      results[sym] = { price, prevClose }
    } else if (!results[sym]) {
      results[sym] = { price: 0, prevClose: 0 }
    }
  }

  persist(results, now)
  return results
}

export function seedCache(symbol, data) {
  loadFromStorage()
  if (!memCache) memCache = {}
  memCache[symbol] = data
  persist(memCache, memCacheTime || Date.now())
}

export function getCachedPrice(symbol) {
  loadFromStorage()
  return (memCache || {})[symbol] || null
}

export function getAllCachedPrices() {
  loadFromStorage()
  return memCache || {}
}
