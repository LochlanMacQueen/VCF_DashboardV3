import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Mail, Lock, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [mode, setMode] = useState('login') // 'login' | 'create' | 'forgot'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null) // { text, type }
  const { signIn, signUp, resetPassword } = useAuth()

  const showMsg = (text, type = 'info') => setMsg({ text, type })

  const handleSubmit = async (e) => {
    e?.preventDefault?.()
    setBusy(true)
    setMsg(null)

    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password)
        if (error) showMsg(error.message, 'error')
      } else if (mode === 'create') {
        if (password !== confirmPassword) {
          showMsg('Passwords do not match.', 'error')
          return
        }
        const { error } = await signUp(email, password)
        if (error) showMsg(error.message, 'error')
        else showMsg('Account created. Check your email for confirmation.', 'success')
      } else if (mode === 'forgot') {
        if (!email) {
          showMsg('Enter your email first.', 'error')
          return
        }
        const { error } = await resetPassword(email)
        if (error) showMsg(error.message, 'error')
        else showMsg('Password reset email sent.', 'success')
      }
    } finally {
      setBusy(false)
    }
  }

  const titles = {
    login: 'Sign in',
    create: 'Create account',
    forgot: 'Reset password',
  }
  const subtitles = {
    login: 'Welcome back to your fund dashboard.',
    create: 'Set up your fund dashboard credentials.',
    forgot: "We'll email you a reset link.",
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-vcf-500/20 blur-3xl float-soft" />
        <div className="absolute -bottom-40 -right-40 h-[28rem] w-[28rem] rounded-full bg-vcf-700/20 blur-3xl float-soft" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="vcf-card glass-panel w-full max-w-md p-8"
      >
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-vcf-700 to-vcf-900 flex items-center justify-center text-white font-bold shadow-lg">
              V
            </div>
            <div>
              <div className="text-base font-semibold text-slate-900">
                Varsity Capital
              </div>
              <div className="text-[10px] uppercase tracking-widest text-slate-500">
                Fund Dashboard
              </div>
            </div>
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
            {titles[mode]}
          </h1>
          <p className="text-sm text-slate-500 mt-1">{subtitles[mode]}</p>
        </div>

        <AnimatePresence mode="wait">
          {msg && (
            <motion.div
              key={msg.text}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`mb-4 rounded-xl px-3 py-2 text-sm ${
                msg.type === 'error'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : msg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-vcf-50 text-vcf-700 border border-vcf-200/60'
              }`}
            >
              {msg.text}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="vcf-input pl-10"
            />
          </div>

          {mode !== 'forgot' && (
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="password"
                required
                autoComplete={mode === 'create' ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="vcf-input pl-10"
              />
            </div>
          )}

          {mode === 'create' && (
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="vcf-input pl-10"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="vcf-btn-primary w-full py-2.5"
          >
            {busy ? (
              <Loader2 size={16} className="spin-fast" />
            ) : (
              <>
                {mode === 'login' && 'Sign in'}
                {mode === 'create' && 'Create account'}
                {mode === 'forgot' && 'Send reset link'}
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between text-sm">
          {mode === 'login' && (
            <>
              <button
                onClick={() => {
                  setMsg(null)
                  setMode('forgot')
                }}
                className="text-slate-500 hover:text-vcf-700 transition-colors"
              >
                Forgot password?
              </button>
              <button
                onClick={() => {
                  setMsg(null)
                  setMode('create')
                }}
                className="font-medium text-vcf-700 hover:text-vcf-900 transition-colors"
              >
                Create account
              </button>
            </>
          )}
          {mode !== 'login' && (
            <button
              onClick={() => {
                setMsg(null)
                setMode('login')
              }}
              className="text-slate-500 hover:text-vcf-700 transition-colors"
            >
              ← Back to sign in
            </button>
          )}
        </div>
      </motion.div>
    </div>
  )
}
