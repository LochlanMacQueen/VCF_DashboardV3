import { useRef, useState } from 'react'
import { Camera, Pencil } from 'lucide-react'
import Card from '../components/Card'
import Modal from '../components/Modal'
import ProfilePicture from '../components/ProfilePicture'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { formatCurrency } from '../lib/format'

export default function Account() {
  const { user } = useAuth()
  const { myAccount, accounts, role, myBalance, refresh } = useData()
  const isAdmin = role === 'admin'
  const fileInputRef = useRef(null)

  const [uploading, setUploading] = useState(false)
  const [editing, setEditing] = useState(null) // account being edited
  const [form, setForm] = useState({ name: '', role: 'investor', units: 0 })
  const [saving, setSaving] = useState(false)

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      window.alert('File must be under 2MB')
      return
    }
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!['jpg', 'jpeg', 'png'].includes(ext)) {
      window.alert('Only JPG and PNG files are allowed')
      return
    }
    setUploading(true)
    const filePath = `${user.id}.${ext}`

    const { error: uploadErr } = await supabase.storage
      .from('profile-pictures')
      .upload(filePath, file, { upsert: true })
    if (uploadErr) {
      window.alert('Upload failed: ' + uploadErr.message)
      setUploading(false)
      return
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('profile-pictures').getPublicUrl(filePath)

    await supabase
      .from('accounts')
      .update({ profile_picture_url: publicUrl + '?t=' + Date.now() })
      .eq('id', myAccount.id)

    setUploading(false)
    await refresh()
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
            <ProfilePicture account={myAccount} size="xl" />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png"
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
