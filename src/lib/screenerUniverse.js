// ============================================
// Screener universe — curated list of liquid US large/mid caps.
// Sectors are hardcoded here so the scan never needs the Finnhub
// /stock/profile2 endpoint (halves the API calls per symbol).
// Add or remove tickers freely; the scanner picks up changes on
// its next pass.
// ============================================

export const SECTORS = [
  'Technology',
  'Communication Services',
  'Consumer Discretionary',
  'Consumer Staples',
  'Healthcare',
  'Financials',
  'Industrials',
  'Energy',
  'Utilities',
  'Materials',
  'Real Estate',
]

export const UNIVERSE = [
  // Technology
  { symbol: 'AAPL', name: 'Apple', sector: 'Technology' },
  { symbol: 'MSFT', name: 'Microsoft', sector: 'Technology' },
  { symbol: 'NVDA', name: 'NVIDIA', sector: 'Technology' },
  { symbol: 'AVGO', name: 'Broadcom', sector: 'Technology' },
  { symbol: 'AMD', name: 'Advanced Micro Devices', sector: 'Technology' },
  { symbol: 'CRM', name: 'Salesforce', sector: 'Technology' },
  { symbol: 'ORCL', name: 'Oracle', sector: 'Technology' },
  { symbol: 'ADBE', name: 'Adobe', sector: 'Technology' },
  { symbol: 'CSCO', name: 'Cisco Systems', sector: 'Technology' },
  { symbol: 'INTC', name: 'Intel', sector: 'Technology' },
  { symbol: 'QCOM', name: 'Qualcomm', sector: 'Technology' },
  { symbol: 'TXN', name: 'Texas Instruments', sector: 'Technology' },
  { symbol: 'IBM', name: 'IBM', sector: 'Technology' },
  { symbol: 'NOW', name: 'ServiceNow', sector: 'Technology' },
  { symbol: 'INTU', name: 'Intuit', sector: 'Technology' },
  { symbol: 'MU', name: 'Micron Technology', sector: 'Technology' },
  { symbol: 'AMAT', name: 'Applied Materials', sector: 'Technology' },
  { symbol: 'PANW', name: 'Palo Alto Networks', sector: 'Technology' },
  { symbol: 'SNOW', name: 'Snowflake', sector: 'Technology' },
  { symbol: 'PLTR', name: 'Palantir', sector: 'Technology' },

  // Communication Services
  { symbol: 'GOOGL', name: 'Alphabet', sector: 'Communication Services' },
  { symbol: 'META', name: 'Meta Platforms', sector: 'Communication Services' },
  { symbol: 'NFLX', name: 'Netflix', sector: 'Communication Services' },
  { symbol: 'DIS', name: 'Walt Disney', sector: 'Communication Services' },
  { symbol: 'CMCSA', name: 'Comcast', sector: 'Communication Services' },
  { symbol: 'T', name: 'AT&T', sector: 'Communication Services' },
  { symbol: 'VZ', name: 'Verizon', sector: 'Communication Services' },
  { symbol: 'TMUS', name: 'T-Mobile US', sector: 'Communication Services' },
  { symbol: 'SPOT', name: 'Spotify', sector: 'Communication Services' },

  // Consumer Discretionary
  { symbol: 'AMZN', name: 'Amazon', sector: 'Consumer Discretionary' },
  { symbol: 'TSLA', name: 'Tesla', sector: 'Consumer Discretionary' },
  { symbol: 'HD', name: 'Home Depot', sector: 'Consumer Discretionary' },
  { symbol: 'MCD', name: "McDonald's", sector: 'Consumer Discretionary' },
  { symbol: 'NKE', name: 'Nike', sector: 'Consumer Discretionary' },
  { symbol: 'SBUX', name: 'Starbucks', sector: 'Consumer Discretionary' },
  { symbol: 'LOW', name: "Lowe's", sector: 'Consumer Discretionary' },
  { symbol: 'TGT', name: 'Target', sector: 'Consumer Discretionary' },
  { symbol: 'BKNG', name: 'Booking Holdings', sector: 'Consumer Discretionary' },
  { symbol: 'LULU', name: 'Lululemon', sector: 'Consumer Discretionary' },
  { symbol: 'CMG', name: 'Chipotle', sector: 'Consumer Discretionary' },
  { symbol: 'F', name: 'Ford Motor', sector: 'Consumer Discretionary' },
  { symbol: 'GM', name: 'General Motors', sector: 'Consumer Discretionary' },

  // Consumer Staples
  { symbol: 'PG', name: 'Procter & Gamble', sector: 'Consumer Staples' },
  { symbol: 'KO', name: 'Coca-Cola', sector: 'Consumer Staples' },
  { symbol: 'PEP', name: 'PepsiCo', sector: 'Consumer Staples' },
  { symbol: 'COST', name: 'Costco', sector: 'Consumer Staples' },
  { symbol: 'WMT', name: 'Walmart', sector: 'Consumer Staples' },
  { symbol: 'MDLZ', name: 'Mondelez', sector: 'Consumer Staples' },
  { symbol: 'CL', name: 'Colgate-Palmolive', sector: 'Consumer Staples' },
  { symbol: 'KMB', name: 'Kimberly-Clark', sector: 'Consumer Staples' },
  { symbol: 'GIS', name: 'General Mills', sector: 'Consumer Staples' },
  { symbol: 'HSY', name: 'Hershey', sector: 'Consumer Staples' },
  { symbol: 'KHC', name: 'Kraft Heinz', sector: 'Consumer Staples' },

  // Healthcare
  { symbol: 'UNH', name: 'UnitedHealth Group', sector: 'Healthcare' },
  { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare' },
  { symbol: 'LLY', name: 'Eli Lilly', sector: 'Healthcare' },
  { symbol: 'PFE', name: 'Pfizer', sector: 'Healthcare' },
  { symbol: 'MRK', name: 'Merck', sector: 'Healthcare' },
  { symbol: 'ABBV', name: 'AbbVie', sector: 'Healthcare' },
  { symbol: 'TMO', name: 'Thermo Fisher', sector: 'Healthcare' },
  { symbol: 'ABT', name: 'Abbott Laboratories', sector: 'Healthcare' },
  { symbol: 'DHR', name: 'Danaher', sector: 'Healthcare' },
  { symbol: 'BMY', name: 'Bristol-Myers Squibb', sector: 'Healthcare' },
  { symbol: 'AMGN', name: 'Amgen', sector: 'Healthcare' },
  { symbol: 'GILD', name: 'Gilead Sciences', sector: 'Healthcare' },
  { symbol: 'CVS', name: 'CVS Health', sector: 'Healthcare' },
  { symbol: 'MDT', name: 'Medtronic', sector: 'Healthcare' },
  { symbol: 'ISRG', name: 'Intuitive Surgical', sector: 'Healthcare' },
  { symbol: 'VRTX', name: 'Vertex Pharmaceuticals', sector: 'Healthcare' },

  // Financials
  { symbol: 'JPM', name: 'JPMorgan Chase', sector: 'Financials' },
  { symbol: 'BAC', name: 'Bank of America', sector: 'Financials' },
  { symbol: 'WFC', name: 'Wells Fargo', sector: 'Financials' },
  { symbol: 'GS', name: 'Goldman Sachs', sector: 'Financials' },
  { symbol: 'MS', name: 'Morgan Stanley', sector: 'Financials' },
  { symbol: 'C', name: 'Citigroup', sector: 'Financials' },
  { symbol: 'BLK', name: 'BlackRock', sector: 'Financials' },
  { symbol: 'SCHW', name: 'Charles Schwab', sector: 'Financials' },
  { symbol: 'AXP', name: 'American Express', sector: 'Financials' },
  { symbol: 'V', name: 'Visa', sector: 'Financials' },
  { symbol: 'MA', name: 'Mastercard', sector: 'Financials' },
  { symbol: 'PYPL', name: 'PayPal', sector: 'Financials' },
  { symbol: 'COF', name: 'Capital One', sector: 'Financials' },
  { symbol: 'USB', name: 'U.S. Bancorp', sector: 'Financials' },

  // Industrials
  { symbol: 'CAT', name: 'Caterpillar', sector: 'Industrials' },
  { symbol: 'DE', name: 'Deere & Co', sector: 'Industrials' },
  { symbol: 'BA', name: 'Boeing', sector: 'Industrials' },
  { symbol: 'HON', name: 'Honeywell', sector: 'Industrials' },
  { symbol: 'UPS', name: 'United Parcel Service', sector: 'Industrials' },
  { symbol: 'UNP', name: 'Union Pacific', sector: 'Industrials' },
  { symbol: 'GE', name: 'GE Aerospace', sector: 'Industrials' },
  { symbol: 'LMT', name: 'Lockheed Martin', sector: 'Industrials' },
  { symbol: 'RTX', name: 'RTX', sector: 'Industrials' },
  { symbol: 'MMM', name: '3M', sector: 'Industrials' },
  { symbol: 'FDX', name: 'FedEx', sector: 'Industrials' },
  { symbol: 'EMR', name: 'Emerson Electric', sector: 'Industrials' },
  { symbol: 'ETN', name: 'Eaton', sector: 'Industrials' },

  // Energy
  { symbol: 'XOM', name: 'Exxon Mobil', sector: 'Energy' },
  { symbol: 'CVX', name: 'Chevron', sector: 'Energy' },
  { symbol: 'COP', name: 'ConocoPhillips', sector: 'Energy' },
  { symbol: 'SLB', name: 'SLB', sector: 'Energy' },
  { symbol: 'EOG', name: 'EOG Resources', sector: 'Energy' },
  { symbol: 'OXY', name: 'Occidental Petroleum', sector: 'Energy' },
  { symbol: 'PSX', name: 'Phillips 66', sector: 'Energy' },
  { symbol: 'MPC', name: 'Marathon Petroleum', sector: 'Energy' },

  // Utilities
  { symbol: 'NEE', name: 'NextEra Energy', sector: 'Utilities' },
  { symbol: 'DUK', name: 'Duke Energy', sector: 'Utilities' },
  { symbol: 'SO', name: 'Southern Company', sector: 'Utilities' },
  { symbol: 'D', name: 'Dominion Energy', sector: 'Utilities' },
  { symbol: 'AEP', name: 'American Electric Power', sector: 'Utilities' },
  { symbol: 'EXC', name: 'Exelon', sector: 'Utilities' },

  // Materials
  { symbol: 'LIN', name: 'Linde', sector: 'Materials' },
  { symbol: 'APD', name: 'Air Products', sector: 'Materials' },
  { symbol: 'SHW', name: 'Sherwin-Williams', sector: 'Materials' },
  { symbol: 'FCX', name: 'Freeport-McMoRan', sector: 'Materials' },
  { symbol: 'NUE', name: 'Nucor', sector: 'Materials' },
  { symbol: 'DOW', name: 'Dow', sector: 'Materials' },

  // Real Estate
  { symbol: 'PLD', name: 'Prologis', sector: 'Real Estate' },
  { symbol: 'AMT', name: 'American Tower', sector: 'Real Estate' },
  { symbol: 'O', name: 'Realty Income', sector: 'Real Estate' },
  { symbol: 'SPG', name: 'Simon Property Group', sector: 'Real Estate' },
  { symbol: 'EQIX', name: 'Equinix', sector: 'Real Estate' },
]
