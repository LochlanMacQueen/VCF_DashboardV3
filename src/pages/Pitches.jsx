import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Lightbulb,
  Plus,
  MoreVertical,
  ThumbsUp,
  ThumbsDown,
  CircleSlash,
  FileSliders,
  Info,
  CheckCircle2,
} from 'lucide-react'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'
import Modal from '../components/Modal'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { fetchSinglePrice } from '../lib/prices'
import { formatDate, isVotingEligible } from '../lib/format'

const statusColors = {
  approved: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  rejected: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
  pending: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
}

const emptyForm = {
  ticker: '',
  pitched_by: '',
  pitch_date: '',
  sector: '',
  summary: '',
  thesis: '',
  slideshow_url: '',
  status: 'pending',
  voting_open: false,
}

export default function Pitches() {
  const { user } = useAuth()
  const { pitches, votes, watchlist, role, myAccount, nav, refresh } = useData()
  const isAdmin = role === 'admin'
  const canVote = isVotingEligible(myAccount, nav)

  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [openMenuId, setOpenMenuId] = useState(null)

  const startEdit = (pitch) => {
    if (pitch) {
      setForm({
        ticker: pitch.ticker || '',
        pitched_by: pitch.pitched_by || '',
        pitch_date: pitch.pitch_date || '',
        sector: pitch.sector || '',
        summary: pitch.summary || '',
        thesis: pitch.thesis || '',
        slideshow_url: pitch.slideshow_url || '',
        status: pitch.status || 'pending',
        voting_open: !!pitch.voting_open,
      })
      setEditing(pitch)
    } else {
      setForm({ ...emptyForm })
      setEditing({})
    }
    setOpenMenuId(null)
  }

  const handleSave = async () => {
    setSaving(true)
    const data = {
      ...form,
      ticker: form.ticker.toUpperCase(),
      slideshow_url: form.slideshow_url || null,
    }

    const wasAlreadyRejected = editing?.status === 'rejected'
    const isNowRejected = data.status === 'rejected'

    if (editing?.id) {
      await supabase.from('pitches').update(data).eq('id', editing.id)
    } else {
      data.created_by = user.id
      await supabase.from('pitches').insert(data)
    }

    if (isNowRejected && !wasAlreadyRejected) {
      const ticker = data.ticker
      const alreadyWatched = watchlist.some((w) => w.ticker === ticker)
      if (!alreadyWatched) {
        const live = await fetchSinglePrice(ticker)
        await supabase.from('watchlist').insert({
          ticker,
          added_by_user_id: user.id,
          added_by_name: myAccount?.name || user.email || 'Unknown',
          added_price: live?.price ?? null,
          notes: `Rejected pitch – pitched by ${data.pitched_by}`,
        })
      }
    }

    setEditing(null)
    setSaving(false)
    await refresh()
  }

  const handleDelete = async (id) => {
    setOpenMenuId(null)
    if (!window.confirm('Delete this pitch? All votes will also be removed.'))
      return
    await supabase.from('pitches').delete().eq('id', id)
    await refresh()
  }

  const toggleVoting = async (id, open) => {
    setOpenMenuId(null)
    await supabase.from('pitches').update({ voting_open: open }).eq('id', id)
    await refresh()
  }

  const castVote = async (pitchId, voteType) => {
    const { error } = await supabase.from('votes').insert({
      pitch_id: pitchId,
      voter_user_id: user.id,
      voter_name: myAccount.name,
      vote_type: voteType,
    })
    if (error) {
      window.alert('Error casting vote: ' + error.message)
      return
    }
    await refresh()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
            Stock Pitches
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Member-submitted ideas, with voting tallies for active proposals.
          </p>
        </div>
        {isAdmin && (
          <button onClick={() => startEdit(null)} className="vcf-btn-primary">
            <Plus size={16} />
            Add pitch
          </button>
        )}
      </div>

      {!canVote && (
        <div className="vcf-card p-4 flex items-start gap-3 bg-vcf-50/50">
          <Info size={18} className="text-vcf-700 mt-0.5 shrink-0" />
          <div className="text-sm text-slate-700">
            You must be a member or admin with a balance of $300+ or 290+ units
            to vote on pitches.
          </div>
        </div>
      )}

      {pitches.length === 0 ? (
        <EmptyState
          icon={Lightbulb}
          title="No stock pitches yet"
          description="Once members submit pitches, they'll appear here for review and voting."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {pitches.map((p, i) => {
            const pitchVotes = votes.filter((v) => v.pitch_id === p.id)
            const yes = pitchVotes.filter((v) => v.vote_type === 'yes').length
            const no = pitchVotes.filter((v) => v.vote_type === 'no').length
            const abstain = pitchVotes.filter(
              (v) => v.vote_type === 'abstain'
            ).length
            const total = pitchVotes.length || 1
            const myVote = pitchVotes.find((v) => v.voter_user_id === user?.id)

            return (
              <Card
                key={p.id}
                delay={Math.min(i, 6) * 0.04}
                interactive
                className="p-5 flex flex-col"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900">
                      {p.ticker}
                    </h3>
                    <div className="text-xs text-slate-500">
                      Pitched by {p.pitched_by}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {p.voting_open && (
                      <span className="vcf-badge bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                        Voting open
                      </span>
                    )}
                    <span
                      className={`vcf-badge ${statusColors[p.status] || statusColors.pending} capitalize`}
                    >
                      {p.status}
                    </span>
                    {isAdmin && (
                      <div className="relative">
                        <button
                          onClick={() =>
                            setOpenMenuId(openMenuId === p.id ? null : p.id)
                          }
                          className="rounded-lg p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        >
                          <MoreVertical size={16} />
                        </button>
                        <AnimatePresence>
                          {openMenuId === p.id && (
                            <motion.div
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -4 }}
                              transition={{ duration: 0.12 }}
                              className="absolute right-0 top-full mt-1 z-20 w-40 vcf-card p-1"
                            >
                              <button
                                onClick={() => startEdit(p)}
                                className="w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-slate-100"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() =>
                                  toggleVoting(p.id, !p.voting_open)
                                }
                                className="w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-slate-100"
                              >
                                {p.voting_open ? 'Close voting' : 'Open voting'}
                              </button>
                              <hr className="my-1 border-slate-100" />
                              <button
                                onClick={() => handleDelete(p.id)}
                                className="w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-rose-50 text-rose-600"
                              >
                                Delete
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-xs text-slate-500 mb-3">
                  {formatDate(p.pitch_date)} · {p.sector || 'No sector'}
                </div>

                <p className="text-sm text-slate-600 mb-4 line-clamp-3">
                  {p.summary || 'No summary provided.'}
                </p>

                {p.slideshow_url && (
                  <a
                    href={p.slideshow_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="vcf-btn-secondary self-start mb-4"
                  >
                    <FileSliders size={14} />
                    View presentation
                  </a>
                )}

                {(p.voting_open || pitchVotes.length > 0) && (
                  <div className="mt-auto pt-4 border-t border-slate-100">
                    <div className="flex justify-between text-xs text-slate-500 mb-2">
                      <span>Yes · {yes}</span>
                      <span>No · {no}</span>
                      <span>Abstain · {abstain}</span>
                    </div>
                    <div className="vcf-progress mb-3">
                      <div className="flex h-full">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(yes / total) * 100}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                          className="bg-emerald-500"
                        />
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(no / total) * 100}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                          className="bg-rose-500"
                        />
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(abstain / total) * 100}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                          className="bg-slate-400"
                        />
                      </div>
                    </div>

                    {myVote ? (
                      <div className="text-xs text-center text-slate-500 inline-flex items-center gap-1.5 justify-center w-full">
                        <CheckCircle2 size={14} className="text-emerald-500" />
                        You voted: <strong className="capitalize">{myVote.vote_type}</strong>
                      </div>
                    ) : p.voting_open && canVote ? (
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => castVote(p.id, 'yes')}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 text-emerald-700 px-3 py-1.5 text-xs font-medium hover:bg-emerald-100 transition-colors"
                        >
                          <ThumbsUp size={12} /> Yes
                        </button>
                        <button
                          onClick={() => castVote(p.id, 'no')}
                          className="inline-flex items-center gap-1 rounded-lg bg-rose-50 text-rose-700 px-3 py-1.5 text-xs font-medium hover:bg-rose-100 transition-colors"
                        >
                          <ThumbsDown size={12} /> No
                        </button>
                        <button
                          onClick={() => castVote(p.id, 'abstain')}
                          className="inline-flex items-center gap-1 rounded-lg bg-slate-100 text-slate-700 px-3 py-1.5 text-xs font-medium hover:bg-slate-200 transition-colors"
                        >
                          <CircleSlash size={12} /> Abstain
                        </button>
                      </div>
                    ) : null}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? 'Edit pitch' : 'Add pitch'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="vcf-label">Ticker</label>
              <input
                className="vcf-input uppercase"
                value={form.ticker}
                onChange={(e) =>
                  setForm({ ...form, ticker: e.target.value.toUpperCase() })
                }
                placeholder="AAPL"
              />
            </div>
            <div>
              <label className="vcf-label">Pitched by</label>
              <input
                className="vcf-input"
                value={form.pitched_by}
                onChange={(e) =>
                  setForm({ ...form, pitched_by: e.target.value })
                }
              />
            </div>
            <div>
              <label className="vcf-label">Pitch date</label>
              <input
                type="date"
                className="vcf-input"
                value={form.pitch_date}
                onChange={(e) =>
                  setForm({ ...form, pitch_date: e.target.value })
                }
              />
            </div>
            <div>
              <label className="vcf-label">Sector</label>
              <input
                className="vcf-input"
                value={form.sector}
                onChange={(e) => setForm({ ...form, sector: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="vcf-label">Summary</label>
            <textarea
              rows={2}
              className="vcf-input"
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
            />
          </div>
          <div>
            <label className="vcf-label">Thesis</label>
            <textarea
              rows={4}
              className="vcf-input"
              value={form.thesis}
              onChange={(e) => setForm({ ...form, thesis: e.target.value })}
            />
          </div>
          <div>
            <label className="vcf-label">Slideshow URL</label>
            <input
              type="url"
              className="vcf-input"
              value={form.slideshow_url}
              onChange={(e) =>
                setForm({ ...form, slideshow_url: e.target.value })
              }
              placeholder="https://..."
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="vcf-label">Status</label>
              <select
                className="vcf-input"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label className="vcf-label">Voting</label>
              <select
                className="vcf-input"
                value={form.voting_open ? 'true' : 'false'}
                onChange={(e) =>
                  setForm({ ...form, voting_open: e.target.value === 'true' })
                }
              >
                <option value="false">Closed</option>
                <option value="true">Open</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setEditing(null)} className="vcf-btn-ghost">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.ticker || !form.pitched_by || !form.pitch_date}
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
