import { motion } from 'framer-motion'
import { ShieldAlert, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function NoAccount() {
  const { signOut } = useAuth()

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="vcf-card glass-panel max-w-md w-full p-8 text-center"
      >
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-200">
          <ShieldAlert size={26} />
        </div>
        <h2 className="text-xl font-semibold text-slate-900 mb-2">
          Account not linked
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          Your login exists, but you haven't been assigned an account yet. Reach
          out to the fund administrator to get connected.
        </p>
        <button onClick={signOut} className="vcf-btn-primary mx-auto">
          <LogOut size={14} />
          Sign out
        </button>
      </motion.div>
    </div>
  )
}
