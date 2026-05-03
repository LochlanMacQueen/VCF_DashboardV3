import { motion } from 'framer-motion'
import { Doughnut } from 'react-chartjs-2'
import { ArrowDownRight, ArrowUpRight, Wallet } from 'lucide-react'
import '../lib/charts'
import { SECTOR_PALETTE } from '../lib/charts'
import { useData } from '../context/DataContext'
import { formatCurrency, formatPercent } from '../lib/format'
import Card from '../components/Card'
import ProfilePicture from '../components/ProfilePicture'
import AnimatedNumber from '../components/AnimatedNumber'

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
}
const rowVariant = {
  hidden: { opacity: 0, x: -8 },
  show: { opacity: 1, x: 0 },
}

export default function Overview() {
  const {
    myAccount,
    fundValue,
    prevFundValue,
    totalUnits,
    nav,
    myBalance,
    enrichedHoldings,
    accounts,
    role,
  } = useData()

  const dayPLDollar = fundValue - prevFundValue
  const dayPLPct = prevFundValue > 0 ? (fundValue - prevFundValue) / prevFundValue : 0
  const isUp = dayPLPct >= 0

  // Sector breakdown
  const sectorTotals = enrichedHoldings.reduce((acc, h) => {
    const sector = h.sector || 'Other'
    if (h.marketValue > 0) acc[sector] = (acc[sector] || 0) + h.marketValue
    return acc
  }, {})
  const sectorLabels = Object.keys(sectorTotals)
  const sectorValues = Object.values(sectorTotals)

  const sectorChartData = {
    labels: sectorLabels,
    datasets: [
      {
        data: sectorValues,
        backgroundColor: SECTOR_PALETTE,
        borderColor: '#fff',
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  }

  const sectorChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '62%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: { padding: 12, boxWidth: 8, boxHeight: 8 },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const total = ctx.dataset.data.reduce((a, b) => a + b, 0)
            const value = ctx.raw
            const pct = total > 0 ? (value / total) * 100 : 0
            return `${ctx.label}: ${formatCurrency(value)} (${pct.toFixed(1)}%)`
          },
        },
      },
    },
  }

  const accountsWithBalances = accounts
    .map((a) => {
      const units = Number(a.units) || 0
      const balance = units * (nav || 0)
      const pct = fundValue > 0 ? balance / fundValue : 0
      return { ...a, units, balance, pct }
    })
    .sort((a, b) => b.balance - a.balance)

  const isAdmin = role === 'admin'

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
            Welcome back, {myAccount?.name?.split(' ')[0] || 'investor'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Here's how the fund is performing today.
          </p>
        </div>
      </div>

      {/* Top stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* My Account */}
        <Card delay={0} className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <ProfilePicture account={myAccount} size="md" />
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-wider text-slate-500">
                Your account
              </div>
              <div className="text-base font-semibold text-slate-900 truncate">
                {myAccount?.name || 'User'}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-slate-400">
                Units
              </div>
              <div className="text-lg font-semibold text-slate-900">
                {(Number(myAccount?.units) || 0).toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-slate-400">
                Balance
              </div>
              <div className="text-lg font-semibold text-vcf-700">
                <AnimatedNumber value={myBalance} format={formatCurrency} />
              </div>
            </div>
          </div>
        </Card>

        {/* Fund value */}
        <Card delay={0.05} className="p-5 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-vcf-500/10 blur-2xl pointer-events-none" />
          <div className="relative">
            <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">
              Fund value
            </div>
            <div className="text-3xl font-semibold gradient-text">
              <AnimatedNumber value={fundValue} format={formatCurrency} />
            </div>
            <div className="text-xs text-slate-400 mt-2">
              {totalUnits.toFixed(2)} units · NAV {formatCurrency(nav)}
            </div>
          </div>
        </Card>

        {/* Day P/L */}
        <Card delay={0.1} className="p-5">
          <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">
            Day P/L
          </div>
          <div
            className={`text-3xl font-semibold ${
              isUp ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            <AnimatedNumber
              value={dayPLDollar}
              format={(v) => (v >= 0 ? '+' : '') + formatCurrency(v)}
            />
          </div>
          <div
            className={`mt-1 inline-flex items-center gap-1 text-xs font-medium ${
              isUp ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {isUp ? '+' : ''}
            {formatPercent(dayPLPct)}
          </div>
        </Card>

        {/* Positions */}
        <Card delay={0.15} className="p-5">
          <div className="flex items-center justify-between mb-1">
            <div className="text-xs uppercase tracking-wider text-slate-500">
              Positions
            </div>
            <Wallet size={16} className="text-slate-400" />
          </div>
          <div className="text-3xl font-semibold text-slate-900">
            {enrichedHoldings.length}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            {enrichedHoldings.filter((h) => h.symbol !== 'CASH').length} stocks
            + cash
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Holdings table */}
        <Card delay={0.05} className="p-5 xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900">Holdings</h2>
            <span className="text-xs text-slate-400">
              {enrichedHoldings.length} positions
            </span>
          </div>
          <div className="overflow-x-auto -mx-1">
            <motion.table
              className="vcf-table"
              variants={stagger}
              initial="hidden"
              animate="show"
            >
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Sector</th>
                  <th className="text-right">Shares</th>
                  <th className="text-right">Cost</th>
                  <th className="text-right">Price</th>
                  <th className="text-right">Value</th>
                  <th className="text-right">P/L</th>
                </tr>
              </thead>
              <tbody>
                {enrichedHoldings.map((h) => (
                  <motion.tr key={h.id} variants={rowVariant}>
                    <td className="font-semibold text-slate-900">{h.symbol}</td>
                    <td>
                      <span className="vcf-tag">{h.sector || '—'}</span>
                    </td>
                    <td className="text-right tabular-nums">{h.shares}</td>
                    <td className="text-right tabular-nums text-slate-500">
                      {formatCurrency(h.cost_basis)}
                    </td>
                    <td className="text-right tabular-nums">
                      {formatCurrency(h.price)}
                    </td>
                    <td className="text-right tabular-nums font-medium text-slate-900">
                      {formatCurrency(h.marketValue)}
                    </td>
                    <td
                      className={`text-right tabular-nums font-medium ${
                        h.pnl >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {h.pnl >= 0 ? '+' : ''}
                      {formatCurrency(h.pnl)}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </motion.table>
          </div>
        </Card>

        {/* Sector chart */}
        <Card delay={0.1} className="p-5">
          <h2 className="text-base font-semibold text-slate-900 mb-4">
            Sector allocation
          </h2>
          <div className="relative h-72">
            {sectorLabels.length > 0 ? (
              <Doughnut data={sectorChartData} options={sectorChartOptions} />
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-slate-400">
                No sector data available
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Fund Participants */}
      <Card delay={0.15} className="p-5">
        <h2 className="text-base font-semibold text-slate-900 mb-4">
          Fund participants
        </h2>
        <div className="overflow-x-auto -mx-1">
          <table className="vcf-table">
            <thead>
              <tr>
                <th>Account</th>
                <th className="text-right">Units</th>
                <th className="text-right">Balance</th>
                <th className="text-right">% of fund</th>
              </tr>
            </thead>
            <tbody>
              {accountsWithBalances.map((a, i) => {
                const label = isAdmin
                  ? a.name
                  : `Account ${String.fromCharCode(65 + i)}`
                const isMe = a.owner_user_id === myAccount?.owner_user_id
                return (
                  <tr
                    key={a.id}
                    className={isMe ? 'bg-vcf-50/40' : ''}
                  >
                    <td>
                      <div className="flex items-center gap-2">
                        {isAdmin && <ProfilePicture account={a} size="sm" />}
                        <span
                          className={`${isMe ? 'font-semibold text-vcf-700' : ''}`}
                        >
                          {label}
                        </span>
                        {isMe && (
                          <span className="vcf-badge bg-vcf-700 text-white">
                            You
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="text-right tabular-nums">
                      {a.units.toFixed(2)}
                    </td>
                    <td className="text-right tabular-nums">
                      {formatCurrency(a.balance)}
                    </td>
                    <td className="text-right tabular-nums text-slate-500">
                      {formatPercent(a.pct)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
