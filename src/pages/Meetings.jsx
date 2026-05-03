import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CalendarX,
  CalendarPlus,
  FileSliders,
  MoreVertical,
  Plus,
  ArrowRight,
} from 'lucide-react'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'
import Modal from '../components/Modal'
import { useData } from '../context/DataContext'
import { supabase } from '../lib/supabase'
import { formatDate } from '../lib/format'

export default function Meetings() {
  const { meetings, role, refresh } = useData()
  const isAdmin = role === 'admin'

  const [editing, setEditing] = useState(null) // null = closed, {} = new, {meeting} = edit
  const [detail, setDetail] = useState(null)
  const [openMenuId, setOpenMenuId] = useState(null)

  const [form, setForm] = useState({
    date: '',
    title: '',
    notes: '',
    presentation_links: '',
  })
  const [saving, setSaving] = useState(false)

  const startEdit = (meeting) => {
    if (meeting) {
      setForm({
        date: meeting.date || '',
        title: meeting.title || '',
        notes: meeting.notes || '',
        presentation_links: (meeting.presentation_links || []).join('\n'),
      })
      setEditing(meeting)
    } else {
      setForm({ date: '', title: '', notes: '', presentation_links: '' })
      setEditing({})
    }
    setOpenMenuId(null)
  }

  const handleSave = async () => {
    setSaving(true)
    const data = {
      date: form.date,
      title: form.title,
      notes: form.notes,
      presentation_links: form.presentation_links
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
    }
    if (editing?.id) {
      await supabase.from('meetings').update(data).eq('id', editing.id)
    } else {
      await supabase.from('meetings').insert(data)
    }
    setEditing(null)
    setSaving(false)
    await refresh()
  }

  const handleDelete = async (id) => {
    setOpenMenuId(null)
    if (!window.confirm('Delete this meeting?')) return
    await supabase.from('meetings').delete().eq('id', id)
    await refresh()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
            Meeting History
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Recorded notes and presentations from past sessions.
          </p>
        </div>
        {isAdmin && (
          <button onClick={() => startEdit(null)} className="vcf-btn-primary">
            <Plus size={16} />
            Add meeting
          </button>
        )}
      </div>

      {meetings.length === 0 ? (
        <EmptyState
          icon={CalendarX}
          title="No meetings recorded yet"
          description="Once meetings start being logged, they'll appear here."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {meetings.map((m, i) => (
            <Card
              key={m.id}
              delay={Math.min(i, 6) * 0.04}
              interactive
              className="p-5 flex flex-col"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="vcf-badge bg-vcf-50 text-vcf-700 ring-1 ring-vcf-100">
                  <CalendarPlus size={12} />
                  {formatDate(m.date)}
                </span>
                {isAdmin && (
                  <div className="relative">
                    <button
                      onClick={() =>
                        setOpenMenuId(openMenuId === m.id ? null : m.id)
                      }
                      className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      <MoreVertical size={16} />
                    </button>
                    <AnimatePresence>
                      {openMenuId === m.id && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.12 }}
                          className="absolute right-0 top-full mt-1 z-20 w-32 vcf-card p-1"
                        >
                          <button
                            onClick={() => startEdit(m)}
                            className="w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-slate-100"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(m.id)}
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

              <h3 className="font-semibold text-slate-900 mb-2 line-clamp-2">
                {m.title}
              </h3>
              <p className="text-sm text-slate-500 line-clamp-3 mb-4">
                {m.notes ? m.notes : 'No notes recorded.'}
              </p>

              {m.presentation_links?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {m.presentation_links.map((link, idx) => (
                    <a
                      key={idx}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-vcf-50 hover:text-vcf-700 transition-colors"
                    >
                      <FileSliders size={12} />
                      Slides{m.presentation_links.length > 1 ? ` ${idx + 1}` : ''}
                    </a>
                  ))}
                </div>
              )}

              <button
                onClick={() => setDetail(m)}
                className="mt-auto inline-flex items-center gap-1.5 text-sm font-medium text-vcf-700 hover:text-vcf-900 transition-colors"
              >
                View details <ArrowRight size={14} />
              </button>
            </Card>
          ))}
        </div>
      )}

      {/* Detail modal */}
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail?.title || 'Meeting details'}
        size="lg"
      >
        {detail && (
          <div className="space-y-4">
            <div className="text-sm text-slate-500">
              <span className="font-medium text-slate-700">Date:</span>{' '}
              {formatDate(detail.date)}
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-1">
                Notes
              </h4>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">
                {detail.notes || 'No notes recorded.'}
              </p>
            </div>
            {detail.presentation_links?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2">
                  Presentations
                </h4>
                <div className="flex flex-wrap gap-2">
                  {detail.presentation_links.map((link, i) => (
                    <a
                      key={i}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="vcf-btn-secondary"
                    >
                      <FileSliders size={14} />
                      View presentation
                      {detail.presentation_links.length > 1 ? ` ${i + 1}` : ''}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Edit/create modal */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? 'Edit meeting' : 'Add meeting'}
      >
        <div className="space-y-4">
          <div>
            <label className="vcf-label">Date</label>
            <input
              type="date"
              className="vcf-input"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>
          <div>
            <label className="vcf-label">Title</label>
            <input
              type="text"
              className="vcf-input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Quarterly review"
            />
          </div>
          <div>
            <label className="vcf-label">Notes</label>
            <textarea
              className="vcf-input"
              rows={4}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          <div>
            <label className="vcf-label">Presentation links (one per line)</label>
            <textarea
              className="vcf-input font-mono text-xs"
              rows={2}
              value={form.presentation_links}
              onChange={(e) =>
                setForm({ ...form, presentation_links: e.target.value })
              }
              placeholder="https://..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setEditing(null)} className="vcf-btn-ghost">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.date || !form.title}
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
