import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bookmark,
  Plus,
  ExternalLink,
  MoreVertical,
  Pencil,
  Trash2,
} from 'lucide-react'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'
import Modal from '../components/Modal'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { fetchSinglePrice, seedCache } from '../lib/prices'
import {
  formatCurrency,
  formatDate,
  formatPercent,
  getYahooFinanceUrl,
} from '../lib/format'

export default function Watchlist() {
  const { user } = useAuth()
  const { watchlist, role, myAccount, priceCache, refresh, setPriceCache } =
    useData()
  const isAdmin = role === 'admin'
  const myUserId = user?.id

  const [editing, setEditing] = useState(null) // null | {} new | {entry} edit
  const [detail, setDetail] = useState(null)
  const [form, setForm] = useState({ ticker: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const [openMenuId, setOpenMenuId] = useState(null)

  const startEdit = (entry) => {
    if (entry) {
      setForm({ ticker: entry.ticker, notes: entry.notes || '' })
      setEditing(entry)
    } else {
      setForm({ ticker: '', notes: '' })
      setEditing({})
    }
    setOpenMenuId(null)
    setDetail(null)
  }

  const handleSave = async () => {
    setSaving(true)
    if (editing?.id) {
      // Editing — only notes can change
      const { error } = await supabase
        .from('watchlist')
        .update({ notes: form.notes || null })
        .eq('id', editing.id)
      if (error) {
        window.alert('Error saving entry: ' + error.message)
      } else {
        setEditing(null)
      }
    } else {
      const ticker = form.ticker.trim().toUpperCase()
      if (!ticker) {
        window.alert('Ticker is required.')
        setSaving(false)
        return
      }
      const live = await fetchSinglePrice(ticker)
      if (!live) {
        window.alert(`Could not fetch a live price for "${ticker}".`)
        setSaving(false)
        return
      }
      seedCache(ticker, live)
      setPriceCache((prev) => ({ ...(prev || {}), [ticker]: live }))

      const { error } = await supabase.from('watchlist').insert({
        ticker,
        added_by_user_id: user.id,
        added_by_name: myAccount?.name || user.email || 'Unknown',
        added_price: live.price,
        notes: form.notes || null,
      })
      if (error) {
        window.alert('Error adding ticker: ' + error.message)
      } else {
        setEditing(null)
      }
    }
    setSaving(false)
    await refresh()
  }

  const handleDelete = async (id) => {
    setOpenMenuId(null)
    if (!window.confirm('Remove this ticker from the watchlist?')) return
    const { error } = await supabase.from('watchlist').delete().eq('id', id)
    if (error) {
      window.alert('Error deleting entry: ' + error.message)
      return
    }
    setDetail(null)
    await refresh()
  }

  const enriched = watchlist.map((w) => {
    const priceObj = priceCache[w.ticker] || { price: 0 }
    const currentPrice = Number(priceObj.price) || 0
    const addedPrice = Number(w.added_price) || 0
    const changeDollar =
      currentPrice && addedPrice ? currentPrice - addedPrice : 0
    const changePct = addedPrice > 0 ? changeDollar / addedPrice : 0
    const canEdit = isAdmin || w.added_by_user_id === myUserId
    return { ...w, currentPrice, addedPrice, changeDollar, changePct, canEdit }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
            Watchlist
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Tickers tracked by members of the fund.
          </p>
        </div>
        <button onClick={() => startEdit(null)} className="vcf-btn-primary">
          <Plus size={16} />
          Add ticker
        </button>
      </div>

      {enriched.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="Nothing on the watchlist yet"
          description="Add a ticker to start tracking entry vs. current price along with shared notes."
        />
      ) : (
        <Card delay={0} className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="vcf-table">
              <thead>
                <tr>
                  <th>Ticker</th>
                  <th>Added by</th>
                  <th>Date</th>
                  <th className="text-right">Entry</th>
                  <th className="text-right">Current</th>
                  <th className="text-right">Change</th>
                  <th>Notes</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {enriched.map((w) => {
                  const colorCls =
                    w.changeDollar > 0
                      ? 'text-emerald-600'
                      : w.changeDollar < 0
                      ? 'text-rose-600'
                      : 'text-slate-400'
                  const sign = w.changeDollar > 0 ? '+' : ''
                  return (
                    <tr key={w.id}>
                      <td>
                        <a
                          href={getYahooFinanceUrl(w.ticker)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-slate-900 inline-flex items-center gap-1 hover:text-vcf-700 transition-colors"
                        >
                          {w.ticker}
                          <ExternalLink size={12} />
                        </a>
                      </td>
                      <td className="text-slate-600">{w.added_by_name}</td>
                      <td className="text-slate-500 text-xs">
                        {formatDate(w.created_at?.slice(0, 10))}
                      </td>
                      <td className="text-right tabular-nums">
                        {w.addedPrice > 0
                          ? formatCurrency(w.addedPrice)
                          : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="text-right tabular-nums">
                        {w.currentPrice > 0
                          ? formatCurrency(w.currentPrice)
                          : <span className="text-slate-400">—</span>}
                      </td>
                      <td className={`text-right tabular-nums ${colorCls}`}>
                        {w.addedPrice > 0 && w.currentPrice > 0 ? (
                          <>
                            <div className="font-semibold">
                              {sign}
                              {formatCurrency(w.changeDollar)}
                            </div>
                            <div className="text-xs">
                              {sign}
                              {formatPercent(w.changePct)}
                            </div>
                          </>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td>
                        <button
                          onClick={() => setDetail(w)}
                          className="text-left text-xs text-slate-500 hover:text-vcf-700 transition-colors max-w-[18ch] truncate"
                        >
                          {w.notes ? w.notes : <em>No notes</em>}
                        </button>
                      </td>
                      <td className="text-right">
                        <div className="relative inline-block">
                          <button
                            onClick={() =>
                              setOpenMenuId(openMenuId === w.id ? null : w.id)
                            }
                            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          >
                            <MoreVertical size={16} />
                          </button>
                          <AnimatePresence>
                            {openMenuId === w.id && (
                              <motion.div
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.12 }}
                                className="absolute right-0 top-full mt-1 z-30 w-44 vcf-card p-1"
                              >
                                <a
                                  href={getYahooFinanceUrl(w.ticker)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block px-3 py-1.5 text-sm rounded-lg hover:bg-slate-100"
                                  onClick={() => setOpenMenuId(null)}
                                >
                                  Open in Yahoo Finance
                                </a>
                                <button
                                  onClick={() => {
                                    setOpenMenuId(null)
                                    setDetail(w)
                                  }}
                                  className="w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-slate-100"
                                >
                                  View notes
                                </button>
                                {w.canEdit && (
                                  <>
                                    <hr className="my-1 border-slate-100" />
                                    <button
                                      onClick={() => startEdit(w)}
                                      className="w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-slate-100"
                                    >
                                      Edit notes
                                    </button>
                                    <button
                                      onClick={() => handleDelete(w.id)}
                                      className="w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-rose-50 text-rose-600"
                                    >
                                      Delete
                                    </button>
                                  </>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Detail modal */}
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={
          detail ? (
            <a
              href={getYahooFinanceUrl(detail.ticker)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-vcf-700 transition-colors"
            >
              {detail.ticker}
              <ExternalLink size={14} />
            </a>
          ) : (
            'Watchlist entry'
          )
        }
        size="lg"
      >
        {detail && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Stat label="Added by" value={detail.added_by_name} />
              <Stat
                label="Date added"
                value={formatDate(detail.created_at?.slice(0, 10))}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Stat
                label="Entry price"
                value={
                  detail.added_price > 0
                    ? formatCurrency(Number(detail.added_price))
                    : '—'
                }
              />
              <Stat
                label="Current price"
                value={
                  priceCache[detail.ticker]?.price > 0
                    ? formatCurrency(Number(priceCache[detail.ticker].price))
                    : '—'
                }
              />
              <Stat
                label="Change since added"
                value={(() => {
                  const cur = Number(priceCache[detail.ticker]?.price) || 0
                  const added = Number(detail.added_price) || 0
                  if (cur > 0 && added > 0) {
                    const cd = cur - added
                    const cp = cd / added
                    const sign = cd > 0 ? '+' : ''
                    return `${sign}${formatCurrency(cd)} (${sign}${formatPercent(cp)})`
                  }
                  return '—'
                })()}
              />
            </div>
            <hr className="border-slate-100" />
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-500 mb-1.5">
                Notes
              </div>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">
                {detail.notes || <em className="text-slate-400">No notes yet.</em>}
              </p>
            </div>
            {(isAdmin || detail.added_by_user_id === myUserId) && (
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => startEdit(detail)}
                  className="vcf-btn-secondary"
                >
                  <Pencil size={14} /> Edit notes
                </button>
                <button
                  onClick={() => handleDelete(detail.id)}
                  className="vcf-btn-danger"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Edit/add modal */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? 'Edit watchlist entry' : 'Add to watchlist'}
      >
        <div className="space-y-4">
          <div>
            <label className="vcf-label">Ticker</label>
            <input
              type="text"
              className="vcf-input uppercase"
              value={form.ticker}
              onChange={(e) =>
                setForm({ ...form, ticker: e.target.value.toUpperCase() })
              }
              disabled={!!editing?.id}
              placeholder="AAPL"
            />
            {!editing?.id && (
              <p className="text-xs text-slate-400 mt-1.5">
                Symbol can't be changed after adding.
              </p>
            )}
          </div>
          <div>
            <label className="vcf-label">Notes</label>
            <textarea
              rows={5}
              className="vcf-input"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Why are you tracking this stock?"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setEditing(null)} className="vcf-btn-ghost">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || (!editing?.id && !form.ticker)}
              className="vcf-btn-primary"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">
        {label}
      </div>
      <div className="font-semibold text-slate-900">{value}</div>
    </div>
  )
}
