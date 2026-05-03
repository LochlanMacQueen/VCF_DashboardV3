// ============================================
// Formatters & utility helpers (ported from V2)
// ============================================

export function getInitials(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function stringToColor(str) {
  if (!str) return '#002952'
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = hash % 360
  return `hsl(${hue}, 50%, 45%)`
}

export function formatDate(dateStr) {
  if (!dateStr) return ''
  const [year, month, day] = dateStr.split('-').map(Number)
  if (!year || !month || !day) return ''
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatCurrency(amount) {
  const num = Number(amount)
  if (Number.isNaN(num)) return '$0.00'
  return '$' + num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

export function formatPercent(value, decimals = 2) {
  const num = Number(value)
  if (Number.isNaN(num)) return '0.00%'
  return (num * 100).toFixed(decimals) + '%'
}

export function formatChatTimestamp(createdAt) {
  const date = new Date(createdAt)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const msgDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = (today - msgDay) / (1000 * 60 * 60 * 24)

  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  if (diffDays < 1) return 'Today at ' + timeStr
  if (diffDays < 2) return 'Yesterday at ' + timeStr
  return (
    date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }) +
    ' at ' +
    timeStr
  )
}

// Voting eligibility (balance >= $300 OR units >= 290) AND member/admin role
export function isVotingEligible(account, nav) {
  if (!account) return false
  const role = account.role || 'investor'
  if (role !== 'member' && role !== 'admin') return false
  const units = Number(account.units) || 0
  const balance = units * (Number(nav) || 0)
  return balance >= 300 || units >= 290
}

export function getYahooFinanceUrl(ticker) {
  return `https://finance.yahoo.com/quote/${encodeURIComponent(ticker)}/`
}
