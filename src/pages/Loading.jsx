import { motion } from 'framer-motion'

export default function Loading({ label = 'Loading fund data…' }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-vcf-300/15 blur-3xl float-soft" />
        <div className="absolute bottom-1/4 right-1/4 h-[26rem] w-[26rem] rounded-full bg-vcf-700/10 blur-3xl float-soft" />
      </div>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center"
      >
        <div className="relative h-14 w-14 mb-5">
          <div className="absolute inset-0 rounded-full border-4 border-vcf-100" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-vcf-700 spin-fast" />
        </div>
        <div className="text-sm font-medium text-slate-600">{label}</div>
      </motion.div>
    </div>
  )
}
