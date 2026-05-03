import { AnimatePresence, motion } from 'framer-motion'
import { useLocation, Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function Layout() {
  const location = useLocation()

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 lg:pl-64 pt-14 lg:pt-0 min-h-screen">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-[1500px] mx-auto"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
