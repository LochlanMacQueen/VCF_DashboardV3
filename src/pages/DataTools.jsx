import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Download, Trash2, Database } from 'lucide-react'
import Card from '../components/Card'
import { useData } from '../context/DataContext'
import { supabase } from '../lib/supabase'
import { formatCurrency } from '../lib/format'

function downloadCSV(rows, filename) {
  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function DataTools() {
  const { holdings, accounts, enrichedHoldings, fundValue, nav, refresh } =
    useData()

  const [posForm, setPosForm] = useState({
    symbol: '',
    sector: '',
    shares: '',
    cost_basis: '',
    purchase_date: '',
  })
  const [posMsg, setPosMsg] = useState(null)
  const [posSaving, setPosSaving] = useState(false)

  const [bForm, setBForm] = useState({
    date: '',
    sp500: '',
    nav: nav.toFixed(4),
  })
  const [bMsg, setBMsg] = useState(null)
  const [bSaving, setBSaving] = useState(false)

  const sectors = [...new Set(holdings.map((h) => h.sector).filter(Boolean))]

  const addPosition = async () => {
    setPosMsg(null)
    const symbol = posForm.symbol.trim().toUpperCase()
    const sector = posForm.sector.trim()
    const shares = parseFloat(posForm.shares)
    const cost = parseFloat(posForm.cost_basis)
    const purchase_date = posForm.purchase_date || null

    if (!symbol || !shares || !cost) {
      setPosMsg({ text: 'Symbol, shares and cost basis are required.', type: 'error' })
      return
    }
    setPosSaving(true)

    const existing = holdings.find((h) => h.symbol === symbol)
    if (existing) {
      const totalShares = Number(existing.shares) + shares
      const totalCost =
        Number(existing.shares) * Number(existing.cost_basis) + shares * cost
      const newCostBasis = totalCost / totalShares
      await supabase
        .from('holdings')
        .update({
          shares: totalShares,
          cost_basis: newCostBasis,
          sector: sector || existing.sector,
        })
        .eq('id', existing.id)
      setPosMsg({
        text: `Updated ${symbol}: ${totalShares} shares @ ${formatCurrency(newCostBasis)} avg`,
        type: 'success',
      })
    } else {
      await supabase.from('holdings').insert({
        symbol,
        shares,
        cost_basis: cost,
        sector: sector || null,
        purchase_date,
      })
      setPosMsg({
        text: `Added ${symbol}: ${shares} shares @ ${formatCurrency(cost)}`,
        type: 'success',
      })
    }

    setPosForm({
      symbol: '',
      sector: '',
      shares: '',
      cost_basis: '',
      purchase_date: '',
    })
    setPosSaving(false)
    await refresh()
  }

  const deleteHolding = async (id) => {
    if (!window.confirm('Delete this position?')) return
    await supabase.from('holdings').delete().eq('id', id)
    await refresh()
  }

  const exportHoldings = () => {
    const headers = [
      'Symbol',
      'Sector',
      'Shares',
      'Cost Basis',
      'Price',
      'Market Value',
      'P/L',
    ]
    const rows = enrichedHoldings.map((h) => [
      h.symbol,
      h.sector || '',
      h.shares || 0,
      h.cost_basis || 0,
      h.price || 0,
      (h.marketValue || 0).toFixed(2),
      (h.pnl || 0).toFixed(2),
    ])
    downloadCSV([headers, ...rows], 'holdings.csv')
  }

  const exportAccounts = () => {
    const headers = ['Name', 'Role', 'Units', 'Balance', '% of Fund']
    const rows = accounts.map((a) => {
      const units = Number(a.units) || 0
      const balance = units * (nav || 0)
      const pct = fundValue > 0 ? (balance / fundValue) * 100 : 0
      return [
        a.name,
        a.role || 'investor',
        units,
        (balance || 0).toFixed(2),
        (pct || 0).toFixed(2) + '%',
      ]
    })
    downloadCSV([headers, ...rows], 'accounts.csv')
  }

  const addBenchmark = async () => {
    setBMsg(null)
    const date = bForm.date
    const sp500 = parseFloat(bForm.sp500)
    const navVal = parseFloat(bForm.nav)
    if (!date || !sp500 || !navVal) {
      setBMsg({ text: 'Please fill in all fields.', type: 'error' })
      return
    }
    setBSaving(true)
    const { error } = await supabase
      .from('benchmark_data')
      .upsert(
        { date, sp500_close: sp500, fund_nav: navVal },
        { onConflict: 'date' }
      )
    if (error) {
      setBMsg({ text: 'Error: ' + error.message, type: 'error' })
    } else {
      setBMsg({ text: 'Benchmark data saved.', type: 'success' })
      setBForm({ date: '', sp500: '', nav: nav.toFixed(4) })
    }
    setBSaving(false)
    await refresh()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight inline-flex items-center gap-2">
          <Database size={22} className="text-vcf-700" /> Data Tools
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage holdings, benchmark data, and CSV exports.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Add Position */}
        <Card delay={0} className="p-5">
          <h2 className="text-base font-semibold text-slate-900 mb-4">
            Add position
          </h2>
          <FormMessage msg={posMsg} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="vcf-label">Symbol</label>
              <input
                className="vcf-input uppercase"
                value={posForm.symbol}
                onChange={(e) =>
                  setPosForm({
                    ...posForm,
                    symbol: e.target.value.toUpperCase(),
                  })
                }
                placeholder="AAPL"
              />
            </div>
            <div>
              <label className="vcf-label">Sector</label>
              <input
                className="vcf-input"
                value={posForm.sector}
                onChange={(e) =>
                  setPosForm({ ...posForm, sector: e.target.value })
                }
                placeholder="Technology"
                list="sector-list"
              />
              <datalist id="sector-list">
                {sectors.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="vcf-label">Shares</label>
              <input
                type="number"
                step="0.01"
                className="vcf-input"
                value={posForm.shares}
                onChange={(e) =>
                  setPosForm({ ...posForm, shares: e.target.value })
                }
              />
            </div>
            <div>
              <label className="vcf-label">Cost basis (per share)</label>
              <input
                type="number"
                step="0.01"
                className="vcf-input"
                value={posForm.cost_basis}
                onChange={(e) =>
                  setPosForm({ ...posForm, cost_basis: e.target.value })
                }
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="vcf-label">Purchase date (optional)</label>
            <input
              type="date"
              className="vcf-input"
              value={posForm.purchase_date}
              onChange={(e) =>
                setPosForm({ ...posForm, purchase_date: e.target.value })
              }
            />
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Adding to an existing position weighted-averages the cost basis automatically.
          </p>
          <button
            onClick={addPosition}
            disabled={posSaving}
            className="vcf-btn-primary"
          >
            <Plus size={14} />
            {posSaving ? 'Saving…' : 'Add position'}
          </button>
        </Card>

        {/* Export Data */}
        <Card delay={0.05} className="p-5">
          <h2 className="text-base font-semibold text-slate-900 mb-4">
            Export & current holdings
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
            <button onClick={exportHoldings} className="vcf-btn-secondary">
              <Download size={14} /> Holdings CSV
            </button>
            <button onClick={exportAccounts} className="vcf-btn-secondary">
              <Download size={14} /> Accounts CSV
            </button>
          </div>
          <hr className="border-slate-100 my-4" />
          <h3 className="text-sm font-semibold text-slate-700 mb-2">
            Current holdings
          </h3>
          <div
            className="overflow-y-auto rounded-xl border border-slate-100"
            style={{ maxHeight: 280 }}
          >
            <table className="vcf-table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th className="text-right">Shares</th>
                  <th className="text-right">Cost</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((h) => (
                  <tr key={h.id}>
                    <td className="font-semibold">{h.symbol}</td>
                    <td className="text-right tabular-nums">{h.shares}</td>
                    <td className="text-right tabular-nums">
                      {formatCurrency(h.cost_basis)}
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => deleteHolding(h.id)}
                        className="rounded-lg p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {holdings.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center text-sm text-slate-400 py-6">
                      No holdings yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Benchmark */}
        <Card delay={0.1} className="p-5 lg:col-span-2">
          <h2 className="text-base font-semibold text-slate-900 mb-4">
            Add benchmark data point
          </h2>
          <FormMessage msg={bMsg} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div>
              <label className="vcf-label">Date</label>
              <input
                type="date"
                className="vcf-input"
                value={bForm.date}
                onChange={(e) => setBForm({ ...bForm, date: e.target.value })}
              />
            </div>
            <div>
              <label className="vcf-label">S&P 500 close</label>
              <input
                type="number"
                step="0.01"
                className="vcf-input"
                value={bForm.sp500}
                onChange={(e) => setBForm({ ...bForm, sp500: e.target.value })}
              />
            </div>
            <div>
              <label className="vcf-label">Fund NAV</label>
              <input
                type="number"
                step="0.0001"
                className="vcf-input"
                value={bForm.nav}
                onChange={(e) => setBForm({ ...bForm, nav: e.target.value })}
              />
            </div>
          </div>
          <button
            onClick={addBenchmark}
            disabled={bSaving}
            className="vcf-btn-primary"
          >
            <Plus size={14} />
            {bSaving ? 'Saving…' : 'Add data point'}
          </button>
        </Card>
      </div>
    </div>
  )
}

function FormMessage({ msg }) {
  return (
    <AnimatePresence>
      {msg && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className={`mb-3 rounded-xl px-3 py-2 text-sm ${
            msg.type === 'error'
              ? 'bg-rose-50 text-rose-700 border border-rose-200'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}
        >
          {msg.text}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
