// ============================================
// Stock screener data layer — Finnhub quote + basic financials,
// cached in localStorage for 24 hours.
//
// Finnhub's free tier allows 60 calls/min. A full scan makes
// 2 calls per symbol and paces itself at ~54 calls/min, so a cold
// scan of the ~120-symbol universe takes a few minutes and never
// trips the rate limit. After that the cache keeps the page instant
// for every member for the rest of the day.
// ============================================

import { UNIVERSE } from './screenerUniverse'

const FINNHUB_KEY = import.meta.env.VITE_FINNHUB_KEY
const CACHE_KEY = 'vcf_screener_cache_v1'
const CACHE_TTL_MS = 24 * 60 * 60 * 1000
const SYMBOL_DELAY_MS = 2250 // 2 calls per symbol → ~53 calls/min
const RATE_LIMIT_BACKOFF_MS = 30 * 1000
const ERROR_RETRY_MS = 30 * 60 * 1000 // failed symbols retry after 30 min

let cache = null // { [symbol]: { fetchedAt, error?, ...fields } }
let scanning = false
const subscribers = new Set()

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function loadCache() {
  if (cache) return
  cache = {}
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (raw) cache = JSON.parse(raw) || {}
  } catch {
    // ignore
  }
}

function persistCache() {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch {
    // ignore quota / privacy mode
  }
}

function isStale(entry) {
  if (!entry) return true
  const age = Date.now() - (entry.fetchedAt || 0)
  return entry.error ? age > ERROR_RETRY_MS : age > CACHE_TTL_MS
}

async function fetchFinnhub(path, retried = false) {
  const res = await fetch(
    `https://finnhub.io/api/v1/${path}&token=${FINNHUB_KEY}`
  )
  if (res.status === 429 && !retried) {
    await delay(RATE_LIMIT_BACKOFF_MS)
    return fetchFinnhub(path, true)
  }
  if (!res.ok) return null
  return res.json()
}

function metricNum(metrics, ...keys) {
  for (const key of keys) {
    const v = metrics?.[key]
    if (typeof v === 'number' && Number.isFinite(v)) return v
  }
  return null
}

async function fetchSymbolData(symbol) {
  const [quote, financials] = await Promise.all([
    fetchFinnhub(`quote?symbol=${symbol}`),
    fetchFinnhub(`stock/metric?symbol=${symbol}&metric=all`),
  ])
  const m = financials?.metric
  const price = typeof quote?.c === 'number' && quote.c > 0 ? quote.c : null
  if (!price && !m) return { error: true, fetchedAt: Date.now() }

  return {
    fetchedAt: Date.now(),
    price,
    prevClose: typeof quote?.pc === 'number' && quote.pc > 0 ? quote.pc : null,
    pe: metricNum(m, 'peTTM', 'peBasicExclExtraTTM', 'peAnnual'),
    pb: metricNum(m, 'pbQuarterly', 'pbAnnual'),
    ps: metricNum(m, 'psTTM', 'psAnnual'),
    divYield: metricNum(
      m,
      'dividendYieldIndicatedAnnual',
      'currentDividendYieldTTM'
    ),
    roe: metricNum(m, 'roeTTM', 'roeRfy'),
    netMargin: metricNum(m, 'netProfitMarginTTM', 'netProfitMarginAnnual'),
    revGrowth: metricNum(m, 'revenueGrowthTTMYoy', 'revenueGrowthQuarterlyYoy'),
    epsGrowth: metricNum(m, 'epsGrowthTTMYoy', 'epsGrowthQuarterlyYoy'),
    debtEquity: metricNum(
      m,
      'totalDebt/totalEquityQuarterly',
      'totalDebt/totalEquityAnnual'
    ),
    currentRatio: metricNum(m, 'currentRatioQuarterly', 'currentRatioAnnual'),
    beta: metricNum(m, 'beta'),
    high52: metricNum(m, '52WeekHigh'),
    low52: metricNum(m, '52WeekLow'),
    marketCap: metricNum(m, 'marketCapitalization'), // millions USD
  }
}

// Composite "opportunity" score (0–10) from a fundamental-value lens:
// cheap relative to earnings/book, pulled back from highs, and backed by
// quality (returns, margins, balance sheet) and growth. Each signal that
// fires also contributes a human-readable reason for the UI.
function computeScore(d) {
  if (!d || d.error) return { score: null, reasons: [] }
  let score = 0
  const reasons = []
  const MAX = 10.5

  // Value
  if (d.pe !== null && d.pe > 0 && d.pe < 18) {
    score += 2
    reasons.push(`Attractive P/E of ${d.pe.toFixed(1)}`)
  } else if (d.pe !== null && d.pe > 0 && d.pe < 25) {
    score += 1
  }
  if (d.pb !== null && d.pb > 0 && d.pb < 2.5) {
    score += 1
    reasons.push(`Low price-to-book (${d.pb.toFixed(1)}x)`)
  }
  if (d.price && d.high52 && d.high52 > 0) {
    const belowHigh = 1 - d.price / d.high52
    if (belowHigh > 0.2) {
      score += 1.5
      reasons.push(`${Math.round(belowHigh * 100)}% below 52-week high`)
    } else if (belowHigh > 0.1) {
      score += 0.75
    }
  }

  // Quality
  if (d.roe !== null && d.roe > 15) {
    score += 1.5
    reasons.push(`Strong ROE (${d.roe.toFixed(0)}%)`)
  }
  if (d.netMargin !== null && d.netMargin > 15) {
    score += 1
    reasons.push(`Healthy net margin (${d.netMargin.toFixed(0)}%)`)
  }
  if (d.debtEquity !== null && d.debtEquity >= 0 && d.debtEquity < 1) {
    score += 1
    reasons.push('Conservative debt load')
  }
  if (d.currentRatio !== null && d.currentRatio > 1.5) {
    score += 0.5
  }

  // Growth
  if (d.revGrowth !== null && d.revGrowth > 10) {
    score += 1
    reasons.push(`Revenue growing ${d.revGrowth.toFixed(0)}% YoY`)
  }
  if (d.epsGrowth !== null && d.epsGrowth > 10) {
    score += 1
    reasons.push(`EPS growing ${d.epsGrowth.toFixed(0)}% YoY`)
  }

  // Income
  if (d.divYield !== null && d.divYield > 2.5) {
    score += 0.5
    reasons.push(`${d.divYield.toFixed(1)}% dividend yield`)
  }

  return { score: Math.min(10, (score / MAX) * 10), reasons }
}

export function getRows() {
  loadCache()
  return UNIVERSE.map((u) => {
    const d = cache[u.symbol]
    if (!d || d.error) {
      return { ...u, loaded: false, score: null, reasons: [] }
    }
    const dayChangePct =
      d.price && d.prevClose ? (d.price - d.prevClose) / d.prevClose : null
    const vsHigh52 =
      d.price && d.high52 ? (d.price - d.high52) / d.high52 : null
    const { score, reasons } = computeScore(d)
    return { ...u, ...d, loaded: true, dayChangePct, vsHigh52, score, reasons }
  })
}

export function getScanMeta() {
  loadCache()
  const entries = UNIVERSE.map((u) => cache[u.symbol]).filter(
    (e) => e && !e.error
  )
  const oldest = entries.length
    ? Math.min(...entries.map((e) => e.fetchedAt || 0))
    : null
  return {
    scanning,
    loadedCount: entries.length,
    total: UNIVERSE.length,
    oldestFetchedAt: oldest,
    ageHours: oldest
      ? Math.round((Date.now() - oldest) / (60 * 60 * 1000))
      : null,
  }
}

export function isScanning() {
  return scanning
}

export function subscribe(cb) {
  subscribers.add(cb)
  return () => subscribers.delete(cb)
}

function notify() {
  for (const cb of subscribers) {
    try {
      cb()
    } catch {
      // ignore subscriber errors
    }
  }
}

// Idempotent: repeated calls (e.g. StrictMode double-effects, page
// re-entry) while a scan is running are no-ops. The loop keeps going
// even if the user navigates away; results land in the shared cache.
export async function startScan({ force = false } = {}) {
  if (scanning) return
  if (!FINNHUB_KEY) {
    console.warn('VITE_FINNHUB_KEY missing, skipping screener scan.')
    return
  }
  loadCache()

  const queue = UNIVERSE.filter(
    (u) => force || isStale(cache[u.symbol])
  ).map((u) => u.symbol)
  if (queue.length === 0) return

  scanning = true
  notify()
  try {
    for (let i = 0; i < queue.length; i++) {
      const symbol = queue[i]
      try {
        cache[symbol] = await fetchSymbolData(symbol)
      } catch {
        cache[symbol] = { error: true, fetchedAt: Date.now() }
      }
      if (i % 5 === 0 || i === queue.length - 1) persistCache()
      notify()
      if (i < queue.length - 1) await delay(SYMBOL_DELAY_MS)
    }
  } finally {
    persistCache()
    scanning = false
    notify()
  }
}
