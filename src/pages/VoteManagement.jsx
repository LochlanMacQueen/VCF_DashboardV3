import { useState } from 'react'
import { motion } from 'framer-motion'
import { Inbox, Lightbulb, UserCheck, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'
import { useData } from '../context/DataContext'
import { supabase } from '../lib/supabase'
import {
  formatCurrency,
  formatDate,
  isVotingEligible,
} from '../lib/format'

export default function VoteManagement() {
  const { pitches, votes, accounts, nav, refresh } = useData()
  const [selectedId, setSelectedId] = useState('')

  const votingPitches = pitches.filter(
    (p) => p.voting_open || votes.some((v) => v.pitch_id === p.id)
  )
  const eligibleVoters = accounts.filter((a) => isVotingEligible(a, nav))

  const selected = pitches.find((p) => p.id === selectedId) || null
  const selectedVotes = selectedId
    ? votes.filter((v) => v.pitch_id === selectedId)
    : []
  const yes = selectedVotes.filter((v) => v.vote_type === 'yes').length
  const no = selectedVotes.filter((v) => v.vote_type === 'no').length
  const abstain = selectedVotes.filter((v) => v.vote_type === 'abstain').length
  const total = selectedVotes.length || 1
  const voterIds = selectedVotes.map((v) => v.voter_user_id)
  const notVoted = eligibleVoters.filter(
    (a) => !voterIds.includes(a.owner_user_id)
  )

  const setVoting = async (open) => {
    if (!selected) return
    await supabase.from('pitches').update({ voting_open: open }).eq('id', selected.id)
    await refresh()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
          Vote Management
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Open or close voting on pitches and review tallies in real time.
        </p>
      </div>

      {votingPitches.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No pitches with votes yet"
          description="Once a pitch has voting opened or any votes recorded, it'll appear here."
          action={
            <Link to="/pitches" className="vcf-btn-primary">
              <Lightbulb size={14} />
              Go to pitches
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <Card delay={0} className="p-5">
              <label className="vcf-label">Select pitch</label>
              <select
                className="vcf-input"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
              >
                <option value="">Choose a pitch…</option>
                {votingPitches.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.ticker} – {p.pitched_by} ({formatDate(p.pitch_date)})
                  </option>
                ))}
              </select>
            </Card>

            {selected && (
              <Card delay={0.05} className="p-5">
                <div className="flex items-start justify-between mb-5 gap-4 flex-wrap">
                  <div>
                    <div className="text-2xl font-semibold text-slate-900">
                      {selected.ticker}
                    </div>
                    <div className="text-sm text-slate-500">
                      Pitched by {selected.pitched_by} · {formatDate(selected.pitch_date)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {selected.voting_open ? (
                      <>
                        <span className="vcf-badge bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                          Voting open
                        </span>
                        <button
                          onClick={() => setVoting(false)}
                          className="vcf-btn-secondary"
                        >
                          Close voting
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="vcf-badge bg-slate-100 text-slate-700">
                          Voting closed
                        </span>
                        <button
                          onClick={() => setVoting(true)}
                          className="vcf-btn-secondary"
                        >
                          Reopen voting
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-5">
                  <Tally label="Yes" count={yes} color="emerald" />
                  <Tally label="No" count={no} color="rose" />
                  <Tally label="Abstain" count={abstain} color="slate" />
                </div>

                <div className="vcf-progress mb-6 h-3">
                  <div className="flex h-full">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(yes / total) * 100}%` }}
                      transition={{ duration: 0.5 }}
                      className="bg-emerald-500"
                    />
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(no / total) * 100}%` }}
                      transition={{ duration: 0.5 }}
                      className="bg-rose-500"
                    />
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(abstain / total) * 100}%` }}
                      transition={{ duration: 0.5 }}
                      className="bg-slate-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                      <UserCheck size={14} /> Votes cast ({selectedVotes.length})
                    </h3>
                    <ul className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                      {selectedVotes.length === 0 && (
                        <li className="px-3 py-2 text-sm text-slate-400">
                          None yet
                        </li>
                      )}
                      {selectedVotes.map((v) => (
                        <li
                          key={v.id}
                          className="px-3 py-2 flex items-center justify-between text-sm"
                        >
                          <span>{v.voter_name}</span>
                          <span
                            className={`vcf-badge capitalize ${
                              v.vote_type === 'yes'
                                ? 'bg-emerald-50 text-emerald-700'
                                : v.vote_type === 'no'
                                ? 'bg-rose-50 text-rose-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {v.vote_type}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                      <Clock size={14} /> Not yet voted ({notVoted.length})
                    </h3>
                    <ul className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                      {notVoted.length === 0 && (
                        <li className="px-3 py-2 text-sm text-slate-400">
                          Everyone eligible has voted
                        </li>
                      )}
                      {notVoted.map((a) => (
                        <li
                          key={a.id}
                          className="px-3 py-2 text-sm text-slate-500"
                        >
                          {a.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            )}
          </div>

          <Card delay={0.1} className="p-5 h-fit">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 font-mono">
              Eligible voters · {eligibleVoters.length}
            </h3>
            <ul className="space-y-2 text-sm">
              {eligibleVoters.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between text-slate-600"
                >
                  <span>{a.name}</span>
                  <span className="text-xs text-slate-400 tabular-nums">
                    {formatCurrency((Number(a.units) || 0) * (nav || 0))}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </div>
  )
}

function Tally({ label, count, color }) {
  const map = {
    emerald: 'bg-emerald-50 text-emerald-700',
    rose: 'bg-rose-50 text-rose-700',
    slate: 'bg-slate-100 text-slate-700',
  }
  return (
    <div className={`rounded-xl p-4 text-center ${map[color]}`}>
      <div className="text-3xl font-semibold">{count}</div>
      <div className="text-xs uppercase tracking-wider mt-1">{label}</div>
    </div>
  )
}
