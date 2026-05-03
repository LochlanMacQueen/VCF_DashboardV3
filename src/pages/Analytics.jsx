import { Line } from 'react-chartjs-2'
import { TrendingDown, TrendingUp, Layers } from 'lucide-react'
import '../lib/charts'
import { useData } from '../context/DataContext'
import { formatCurrency, formatDate, formatPercent } from '../lib/format'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'

export default function Analytics() {
  const { enrichedHoldings, fundValue, prevFundValue, benchmarkData } = useData()

  const totalCost = enrichedHoldings.reduce((s, h) => s + h.costValue, 0)
  const totalPnL = fundValue - totalCost
  const totalReturn = totalCost > 0 ? totalPnL / totalCost : 0
  const dayChange = fundValue - prevFundValue
  const dayPct = prevFundValue > 0 ? dayChange / prevFundValue : 0

  const topPerformers = [...enrichedHoldings]
    .filter((h) => h.symbol !== 'CASH')
    .sort((a, b) => (b.pnl / (b.costValue || 1)) - (a.pnl / (a.costValue || 1)))
    .slice(0, 5)

  let benchmarkChartData = null
  if (benchmarkData.length > 0) {
    const firstSP = benchmarkData[0]?.sp500_close || 1
    const firstNAV = benchmarkData[0]?.fund_nav || 1
    benchmarkChartData = {
      labels: benchmarkData.map((d) => formatDate(d.date)),
      datasets: [
        {
          label: 'Fund NAV',
          data: benchmarkData.map((d) => (d.fund_nav / firstNAV) * 100),
          borderColor: '#002952',
          backgroundColor: 'rgba(0, 41, 82, 0.12)',
          fill: true,
          tension: 0.35,
          borderWidth: 2.5,
          pointRadius: 0,
          pointHoverRadius: 5,
        },
        {
          label: 'S&P 500',
          data: benchmarkData.map((d) => (d.sp500_close / firstSP) * 100),
          borderColor: '#94a3b8',
          backgroundColor: 'transparent',
          borderDash: [6, 4],
          tension: 0.35,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 5,
        },
      ],
    }
  }

  const benchmarkOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'bottom' },
    },
    scales: {
      y: {
        title: { display: true, text: 'Indexed (Start = 100)' },
        grid: { color: 'rgba(148, 163, 184, 0.15)' },
      },
      x: { grid: { display: false } },
    },
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
          Analytics
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Performance and benchmarking against the broader market.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card
          className="p-5 bg-gradient-to-br from-vcf-700 to-vcf-900 text-white !border-0"
          delay={0}
        >
          <div className="text-xs uppercase tracking-wider text-white/60 mb-1">
            Total fund value
          </div>
          <div className="text-3xl font-semibold">
            {formatCurrency(fundValue)}
          </div>
        </Card>

        <Card delay={0.05} className="p-5">
          <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">
            Total P/L
          </div>
          <div
            className={`text-3xl font-semibold ${
              totalPnL >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {totalPnL >= 0 ? '+' : ''}
            {formatCurrency(totalPnL)}
          </div>
          <div
            className={`text-xs font-medium mt-1 ${
              totalReturn >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {totalReturn >= 0 ? '+' : ''}
            {formatPercent(totalReturn)}
          </div>
        </Card>

        <Card delay={0.1} className="p-5">
          <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">
            Day change
          </div>
          <div
            className={`text-3xl font-semibold ${
              dayChange >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {dayChange >= 0 ? '+' : ''}
            {formatCurrency(dayChange)}
          </div>
          <div
            className={`mt-1 inline-flex items-center gap-1 text-xs font-medium ${
              dayChange >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {dayChange >= 0 ? (
              <TrendingUp size={14} />
            ) : (
              <TrendingDown size={14} />
            )}
            {dayChange >= 0 ? '+' : ''}
            {formatPercent(dayPct)}
          </div>
        </Card>

        <Card delay={0.15} className="p-5">
          <div className="flex items-center justify-between mb-1">
            <div className="text-xs uppercase tracking-wider text-slate-500">
              Positions
            </div>
            <Layers size={16} className="text-slate-400" />
          </div>
          <div className="text-3xl font-semibold text-slate-900">
            {enrichedHoldings.length}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {enrichedHoldings.filter((h) => h.symbol !== 'CASH').length} stocks +
            cash
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Performers */}
        <Card delay={0.05} className="p-5">
          <h2 className="text-base font-semibold text-slate-900 mb-4">
            Top performers
          </h2>
          {topPerformers.length === 0 ? (
            <div className="text-sm text-slate-500 py-8 text-center">
              No positions to rank yet.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {topPerformers.map((h) => {
                const r = h.costValue > 0 ? h.pnl / h.costValue : 0
                return (
                  <li
                    key={h.id}
                    className="flex items-center justify-between py-3"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">
                        {h.symbol}
                      </div>
                      <div className="text-xs text-slate-400">
                        {h.sector || '—'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`font-semibold tabular-nums ${
                          r >= 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {r >= 0 ? '+' : ''}
                        {formatPercent(r)}
                      </div>
                      <div
                        className={`text-xs tabular-nums ${
                          h.pnl >= 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {h.pnl >= 0 ? '+' : ''}
                        {formatCurrency(h.pnl)}
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        {/* Benchmark */}
        <Card delay={0.1} className="p-5">
          <h2 className="text-base font-semibold text-slate-900 mb-4">
            Fund vs S&P 500
          </h2>
          <div className="relative h-72">
            {benchmarkChartData ? (
              <Line data={benchmarkChartData} options={benchmarkOptions} />
            ) : (
              <EmptyState
                icon={TrendingUp}
                title="No benchmark data yet"
                description="Add benchmark data points from Data Tools to see your fund track vs. the S&P 500."
              />
            )}
          </div>
        </Card>
      </div>

      {/* Position details */}
      <Card delay={0.15} className="p-5">
        <h2 className="text-base font-semibold text-slate-900 mb-4">
          Position details
        </h2>
        <div className="overflow-x-auto -mx-1">
          <table className="vcf-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Sector</th>
                <th className="text-right">Shares</th>
                <th className="text-right">Avg cost</th>
                <th className="text-right">Current</th>
                <th className="text-right">Cost basis</th>
                <th className="text-right">Market value</th>
                <th className="text-right">Return</th>
                <th className="text-right">Weight</th>
              </tr>
            </thead>
            <tbody>
              {enrichedHoldings.map((h) => {
                const r = h.costValue > 0 ? h.pnl / h.costValue : 0
                const w = fundValue > 0 ? h.marketValue / fundValue : 0
                return (
                  <tr key={h.id}>
                    <td className="font-semibold">{h.symbol}</td>
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
                    <td className="text-right tabular-nums">
                      {formatCurrency(h.costValue)}
                    </td>
                    <td className="text-right tabular-nums font-medium">
                      {formatCurrency(h.marketValue)}
                    </td>
                    <td
                      className={`text-right tabular-nums font-medium ${
                        r >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {r >= 0 ? '+' : ''}
                      {formatPercent(r)}
                    </td>
                    <td className="text-right tabular-nums text-slate-500">
                      {formatPercent(w)}
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
