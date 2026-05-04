import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Pencil, AlertCircle, CheckCircle2 } from 'lucide-react'
import Card from '../components/Card'
import Modal from '../components/Modal'
import ProfilePicture from '../components/ProfilePicture'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { formatCurrency } from '../lib/format'

const MAX_BYTES = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
]

function extFromType(type) {
  // Normalize content-type → filename extension.
  const map = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
  }
  return map[type] || 'jpg'
}

export default function Account() {
  const { user } = useAuth()
  const { myAccount, accounts, role, myBalance, refresh } = useData()
  const isAdmin = role === 'admin'
  const fileInputRef = useRef(null)

  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState(null) // { type, text }
  const [editing, setEditing] = useState(null) // account being edited
  const [form, setForm] = useState({ name: '', role: 'investor', units: 0 })
  const [saving, setSaving] = useState(false)

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    // Always reset the input so re-selecting the same file still triggers change
    if (e.target) e.target.value = ''
    if (!file) return

    setUploadMsg(null)

    if (file.size > MAX_BYTES) {
      setUploadMsg({ type: 'error', text: 'File must be under 5 MB.' })
      return
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadMsg({
        type: 'error',
        text: 'Use a JPG, PNG, WebP, or GIF image.',
      })
      return
    }
    if (!user?.id || !myAccount?.id) {
      setUploadMsg({
        type: 'error',
        text: 'Account not loaded yet — try again in a moment.',
      })
      return
    }

    setUploading(true)
    try {
      // Per-user folder + timestamped filename. Two wins: it kills stale CDN
      // cache, and the storage RLS policy can use foldername(name) = auth.uid()
      // to scope writes to each user's own directory.
      const ext = extFromType(file.type)
      const path = `${user.id}/avatar-${Date.now()}.${ext}`

      const { error: upErr } = await supabase.storage
        .from('profile-pictures')
        .upload(path, file, {
          upsert: false,
          contentType: file.type,
          cacheControl: '3600',
        })
      if (upErr) throw upErr

      const {
        data: { publicUrl },
      } = supabase.storage.from('profile-pictures').getPublicUrl(path)
      if (!publicUrl) {
        throw new Error('Could not generate a public URL for the upload.')
      }

      const { error: dbErr } = await supabase
        .from('accounts')
        .update({ profile_picture_url: publicUrl })
        .eq('id', myAccount.id)
      if (dbErr) throw dbErr

      // Best-effort cleanup of any older avatars for this user.
      try {
        const { data: existing } = await supabase.storage
          .from('profile-pictures')
          .list(user.id, { limit: 100 })
        const stale = (existing || [])
          .map((f) => `${user.id}/${f.name}`)
          .filter((p) => p !== path)
        if (stale.length > 0) {
          await supabase.storage.from('profile-pictures').remove(stale)
        }
      } catch {
        // Cleanup failure is non-fatal.
      }

      setUploadMsg({ type: 'success', text: 'Profile picture updated.' })
      await refresh()
    } catch (err) {
      // Most common cause: bucket missing or RLS doesn't allow inserts.
      console.error('Profile pic upload failed:', err)
      const msg = err?.message || String(err)
      const friendly =
        /not.*found|does not exist/i.test(msg)
          ? 'The "profile-pictures" storage bucket is missing. Create it in Supabase and make it public.'
          : /policy|permission|denied|unauthor/i.test(msg)
          ? 'Storage rejected the upload. Make sure the bucket has an INSERT policy that allows authenticated users.'
          : `Upload failed: ${msg}`
      setUploadMsg({ type: 'error', text: friendly })
    } finally {
      setUploading(false)
    }
  }

  const startEdit = (account) => {
    setForm({
      name: account.name || '',
      role: account.role || 'investor',
      units: account.units || 0,
    })
    setEditing(account)
  }

  const handleSave = async () => {
    setSaving(true)
    await supabase
      .from('accounts')
      .update({
        name: form.name,
        role: form.role,
        units: parseFloat(form.units) || 0,
      })
      .eq('id', editing.id)
    setEditing(null)
    setSaving(false)
    await refresh()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
          Account Management
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your profile and (if you're an admin) other fund participants.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card delay={0} className="p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-6">
            My profile
          </h2>
          <div className="flex flex-col items-center text-center mb-6">
            <div className="relative">
              <ProfilePicture account={myAccount} size="xl" />
              {uploading && (
                <div className="absolute inset-0 rounded-full bg-white/70 backdrop-blur-sm flex items-center justify-center">
                  <div className="h-6 w-6 rounded-full border-2 border-vcf-100 border-t-vcf-700 animate-spin" />
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="vcf-btn-secondary mt-4"
              disabled={uploading}
            >
              <Camera size={14} />
              {uploading ? 'Uploading…' : 'Change photo'}
            </button>
            <div className="text-[11px] text-slate-400 mt-1.5">
              JPG, PNG, WebP or GIF · up to 5 MB
            </div>

            <AnimatePresence>
              {uploadMsg && (
                <motion.div
                  key={uploadMsg.text}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className={`mt-3 inline-flex items-start gap-2 rounded-xl px-3 py-2 text-xs text-left max-w-xs ${
                    uploadMsg.type === 'error'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  {uploadMsg.type === 'error' ? (
                    <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  ) : (
                    <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
                  )}
                  <span>{uploadMsg.text}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <Field label="Name" value={myAccount?.name || '—'} />
            <Field label="Email" value={user?.email || '—'} />
            <Field
              label="Role"
              value={
                <span className="capitalize">{myAccount?.role || 'investor'}</span>
              }
            />
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Units"
                value={(Number(myAccount?.units) || 0).toFixed(2)}
              />
              <Field label="Balance" value={formatCurrency(myBalance)} />
            </div>
          </div>
        </Card>

        {isAdmin && (
          <Card delay={0.05} className="p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-4">
              All accounts
            </h2>
            <div className="overflow-x-auto -mx-1">
              <table className="vcf-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Role</th>
                    <th className="text-right">Units</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <ProfilePicture account={a} size="sm" />
                          <span className="font-medium">{a.name}</span>
                        </div>
                      </td>
                      <td className="capitalize text-slate-500">
                        {a.role || 'investor'}
                      </td>
                      <td className="text-right tabular-nums">
                        {(Number(a.units) || 0).toFixed(2)}
                      </td>
                      <td className="text-right">
                        <button
                          onClick={() => startEdit(a)}
                          className="rounded-lg p-1.5 text-slate-400 hover:text-vcf-700 hover:bg-vcf-50 transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Edit account"
      >
        <div className="space-y-4">
          <div>
            <label className="vcf-label">Name</label>
            <input
              className="vcf-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="vcf-label">Role</label>
            <select
              className="vcf-input"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="investor">Investor</option>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="vcf-label">Units</label>
            <input
              type="number"
              step="0.01"
              className="vcf-input"
              value={form.units}
              onChange={(e) => setForm({ ...form, units: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setEditing(null)} className="vcf-btn-ghost">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
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

function Field({ label, value }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-slate-500 mb-0.5">
        {label}
      </div>
      <div className="font-semibold text-slate-900 break-words">{value}</div>
    </div>
  )
}
