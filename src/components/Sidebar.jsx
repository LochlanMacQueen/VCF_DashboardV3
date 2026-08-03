import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Gauge,
  TrendingUp,
  CalendarCheck2,
  Lightbulb,
  Bookmark,
  MessageCircle,
  BookOpen,
  UserRound,
  Radar,
  CheckSquare,
  Database,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { useState } from 'react'
import ProfilePicture from './ProfilePicture'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'

function SidebarLinks({ role, onClick }) {
  const isAdmin = role === 'admin'
  const isMember = role === 'member' || isAdmin

  const items = [
    { to: '/overview', icon: Gauge, label: 'Overview', show: true },
    { to: '/analytics', icon: TrendingUp, label: 'Analytics', show: isMember },
    {
      to: '/meetings',
      icon: CalendarCheck2,
      label: 'Meeting History',
      show: isMember,
    },
    { to: '/pitches', icon: Lightbulb, label: 'Stock Pitches', show: isMember },
    { to: '/watchlist', icon: Bookmark, label: 'Watchlist', show: isMember },
    { to: '/screener', icon: Radar, label: 'Stock Screener', show: isMember },
    { to: '/chat', icon: MessageCircle, label: 'Chat', show: isMember },
    {
      to: '/resources',
      icon: BookOpen,
      label: 'Educational Resources',
      show: isMember,
    },
    {
      to: '/account',
      icon: UserRound,
      label: 'Account Management',
      show: isMember,
    },
  ]

  const adminItems = [
    {
      to: '/votes',
      icon: CheckSquare,
      label: 'Vote Management',
      show: isAdmin,
    },
    { to: '/data-tools', icon: Database, label: 'Data Tools', show: isAdmin },
  ]

  return (
    <nav className="flex flex-col gap-1 px-3 py-3 flex-1">
      {items
        .filter((i) => i.show)
        .map((item) => (
          <SidebarLink key={item.to} {...item} onClick={onClick} />
        ))}
      {!isMember && (
        <div className="mt-2 space-y-1 px-2">
          {['Performance', 'Holdings', 'Fund Structure', 'Your Account'].map(
            (label) => (
              <div
                key={label}
                className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-white/40"
              >
                <span>{label}</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider rounded-md bg-white/10 px-2 py-0.5">
                  Soon
                </span>
              </div>
            )
          )}
        </div>
      )}
      {isAdmin && (
        <>
          <div className="my-2 mx-2 h-px bg-white/15" />
          {adminItems
            .filter((i) => i.show)
            .map((item) => (
              <SidebarLink key={item.to} {...item} onClick={onClick} />
            ))}
        </>
      )}
    </nav>
  )
}

function SidebarLink({ to, icon: Icon, label, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
          isActive
            ? 'text-white bg-white/12'
            : 'text-white/70 hover:text-white hover:bg-white/8'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId="active-pill"
              className="absolute inset-0 rounded-xl bg-white/12"
              transition={{ type: 'spring', stiffness: 360, damping: 30 }}
            />
          )}
          <Icon size={18} className="relative shrink-0" />
          <span className="relative truncate">{label}</span>
        </>
      )}
    </NavLink>
  )
}

function SidebarFooter({ account, onSignOut }) {
  return (
    <div className="mt-auto p-4 border-t border-white/10">
      <div className="flex items-center gap-3 mb-3">
        <ProfilePicture account={account} size="sm" />
        <div className="min-w-0">
          <div className="text-sm text-white truncate font-medium">
            {account?.name || 'User'}
          </div>
          <div className="text-xs text-white/50 capitalize">
            {account?.role || 'investor'}
          </div>
        </div>
      </div>
      <button
        onClick={onSignOut}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 px-3 py-2 text-sm font-medium text-white/90 transition-all hover:bg-white/10 hover:border-white/40"
      >
        <LogOut size={16} />
        Sign out
      </button>
    </div>
  )
}

export default function Sidebar() {
  const { signOut } = useAuth()
  const { myAccount, role } = useData()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-64 bg-gradient-to-b from-vcf-700 to-vcf-900 text-white shadow-xl z-30">
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-white/30 to-white/10 ring-1 ring-white/20 flex items-center justify-center font-bold text-white">
              V
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight text-white">
                Varsity Capital
              </div>
              <div className="text-[10px] uppercase tracking-widest text-white/50">
                Fund Dashboard
              </div>
            </div>
          </div>
        </div>
        <SidebarLinks role={role} />
        <SidebarFooter account={myAccount} onSignOut={signOut} />
      </aside>

      {/* Mobile top bar */}
      <header className="lg:hidden fixed inset-x-0 top-0 z-30 bg-gradient-to-r from-vcf-700 to-vcf-800 text-white shadow-md">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-white/15 ring-1 ring-white/20 flex items-center justify-center font-bold text-sm">
              V
            </div>
            <span className="text-sm font-semibold">Varsity Capital</span>
          </div>
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 hover:bg-white/10 transition-colors"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 360, damping: 32 }}
              className="lg:hidden fixed inset-y-0 left-0 z-50 w-[min(18rem,calc(100vw-2rem))] bg-gradient-to-b from-vcf-700 to-vcf-900 text-white flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                <span className="text-sm font-semibold">Varsity Capital</span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg p-1.5 hover:bg-white/10 transition-colors"
                  aria-label="Close menu"
                >
                  <X size={18} />
                </button>
              </div>
              <SidebarLinks
                role={role}
                onClick={() => setMobileOpen(false)}
              />
              <SidebarFooter account={myAccount} onSignOut={signOut} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
