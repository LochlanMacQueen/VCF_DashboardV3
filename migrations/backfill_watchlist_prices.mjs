// One-off script: set added_price on watchlist entries that have NULL prices.
// Safe to run multiple times — skips anything that already has a price.
//
// Run from the project root:
//   node --env-file=.env migrations/backfill_watchlist_prices.mjs

import { createClient } from '@supabase/supabase-js'

const { VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_FINNHUB_KEY } = process.env

if (!VITE_SUPABASE_URL || !VITE_SUPABASE_ANON_KEY || !VITE_FINNHUB_KEY) {
  console.error('Missing env vars. Make sure .env has VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_FINNHUB_KEY.')
  process.exit(1)
}

const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)

async function fetchPrice(symbol) {
  const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${VITE_FINNHUB_KEY}`)
  const data = await res.json()
  return (typeof data?.c === 'number' && data.c > 0) ? data.c : null
}

const { data: entries, error } = await supabase
  .from('watchlist')
  .select('id, ticker')
  .is('added_price', null)

if (error) { console.error('Supabase error:', error.message); process.exit(1) }
if (!entries.length) { console.log('Nothing to update — all entries already have a price.'); process.exit(0) }

console.log(`Found ${entries.length} entries with no price. Fetching from Finnhub…\n`)

for (const entry of entries) {
  const price = await fetchPrice(entry.ticker)
  if (price) {
    await supabase.from('watchlist').update({ added_price: price }).eq('id', entry.id)
    console.log(`  ${entry.ticker.padEnd(6)} → $${price}`)
  } else {
    console.warn(`  ${entry.ticker.padEnd(6)} → could not fetch price, skipped`)
  }
}

console.log('\nDone.')
