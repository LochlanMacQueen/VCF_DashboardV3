-- Migration: backfill watchlist with all existing rejected pitches
-- Tickers already present in the watchlist (e.g. MU, ETN) are automatically
-- skipped by the NOT EXISTS guard.  added_price is left NULL so the watchlist
-- entry still appears correctly while showing "—" for the entry price.

INSERT INTO watchlist (ticker, added_by_user_id, added_by_name, added_price, notes, created_at)
SELECT
  p.ticker,
  p.created_by,
  p.pitched_by,
  NULL::numeric,
  'Rejected pitch – originally presented by ' || p.pitched_by || ' on ' || p.pitch_date::text,
  p.created_at
FROM pitches p
WHERE p.status = 'rejected'
  AND NOT EXISTS (
    SELECT 1 FROM watchlist w WHERE w.ticker = p.ticker
  );
