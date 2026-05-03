import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Plus, ExternalLink, MoreHorizontal, Folder } from 'lucide-react'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'
import Modal from '../components/Modal'
import { useData } from '../context/DataContext'
import { supabase } from '../lib/supabase'

export default function Resources() {
  const { resources, role, refresh } = useData()
  const isAdmin = role === 'admin'

  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({
    title: '',
    url: '',
    category: '',
    description: '',
  })
  const [saving, setSaving] = useState(false)
  const [openMenuId, setOpenMenuId] = useState(null)

  const startEdit = (resource) => {
    if (resource) {
      setForm({
        title: resource.title || '',
        url: resource.url || '',
        category: resource.category || '',
        description: resource.description || '',
      })
      setEditing(resource)
    } else {
      setForm({ title: '', url: '', category: '', description: '' })
      setEditing({})
    }
    setOpenMenuId(null)
  }

  const handleSave = async () => {
    setSaving(true)
    if (editing?.id) {
      await supabase.from('resources').update(form).eq('id', editing.id)
    } else {
      await supabase.from('resources').insert(form)
    }
    setEditing(null)
    setSaving(false)
    await refresh()
  }

  const handleDelete = async (id) => {
    setOpenMenuId(null)
    if (!window.confirm('Delete this resource?')) return
    await supabase.from('resources').delete().eq('id', id)
    await refresh()
  }

  // Group by category
  const grouped = resources.reduce((acc, r) => {
    const k = r.category || 'Other'
    if (!acc[k]) acc[k] = []
    acc[k].push(r)
    return acc
  }, {})
  const categoryNames = [...new Set(resources.map((r) => r.category).filter(Boolean))]

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
            Educational Resources
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Curated articles, frameworks, and guides organized by category.
          </p>
        </div>
        {isAdmin && (
          <button onClick={() => startEdit(null)} className="vcf-btn-primary">
            <Plus size={16} />
            Add resource
          </button>
        )}
      </div>

      {resources.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No resources available yet"
          description="Once admins publish learning materials, they'll appear here grouped by category."
        />
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([category, items], catIdx) => (
            <Card delay={catIdx * 0.05} key={category} className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-vcf-50 text-vcf-700 ring-1 ring-vcf-100 flex items-center justify-center">
                  <Folder size={16} />
                </div>
                <h2 className="text-base font-semibold text-slate-900">
                  {category}
                </h2>
                <span className="text-xs text-slate-400 ml-auto">
                  {items.length} item{items.length === 1 ? '' : 's'}
                </span>
              </div>
              <div className="divide-y divide-slate-100">
                {items.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center gap-3 py-3 group"
                  >
                    <div className="flex-1 min-w-0">
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-slate-900 hover:text-vcf-700 transition-colors"
                      >
                        {r.title}
                      </a>
                      {r.description && (
                        <div className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                          {r.description}
                        </div>
                      )}
                    </div>
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="vcf-btn-secondary !px-2.5 !py-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Open"
                    >
                      <ExternalLink size={14} />
                    </a>
                    {isAdmin && (
                      <div className="relative">
                        <button
                          onClick={() =>
                            setOpenMenuId(openMenuId === r.id ? null : r.id)
                          }
                          className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        >
                          <MoreHorizontal size={16} />
                        </button>
                        <AnimatePresence>
                          {openMenuId === r.id && (
                            <motion.div
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -4 }}
                              transition={{ duration: 0.12 }}
                              className="absolute right-0 top-full mt-1 z-30 w-32 vcf-card p-1"
                            >
                              <button
                                onClick={() => startEdit(r)}
                                className="w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-slate-100"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(r.id)}
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
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? 'Edit resource' : 'Add resource'}
      >
        <div className="space-y-4">
          <div>
            <label className="vcf-label">Title</label>
            <input
              className="vcf-input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div>
            <label className="vcf-label">URL</label>
            <input
              type="url"
              className="vcf-input"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="vcf-label">Category</label>
            <input
              className="vcf-input"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="e.g. Valuation, Technical Analysis"
              list="resource-categories"
            />
            <datalist id="resource-categories">
              {categoryNames.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="vcf-label">Description</label>
            <textarea
              rows={2}
              className="vcf-input"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setEditing(null)} className="vcf-btn-ghost">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.title || !form.url || !form.category}
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
