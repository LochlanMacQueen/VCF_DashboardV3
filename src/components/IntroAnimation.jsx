import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

/**
 * Premium login → dashboard intro:
 *   1. White screen, /favicon.png blooms in with a soft halo
 *   2. Favicon dissolves into a stroke-drawn "VC" wordmark
 *   3. The V and C spiral outward, scaling down + rotating
 *   4. They reform as a clean gradient ring spinner
 *   5. Tagline fades in below
 *   6. Whole panel cross-fades out, revealing the app
 *
 * The intro will not finish until BOTH the minimum runtime has elapsed AND
 * the parent has signaled (via the `ready` prop) that data is loaded.
 * That way it doubles as a premium loading state.
 */
export default function IntroAnimation({ onComplete, ready = true }) {
  const [stage, setStage] = useState('logo') // logo | letters | spiral | loader | exit
  const minDoneRef = useRef(false)
  const completedRef = useRef(false)

  // Stage timeline (ms from mount)
  useEffect(() => {
    const timers = [
      setTimeout(() => setStage('letters'), 750),
      setTimeout(() => setStage('spiral'), 1300),
      setTimeout(() => setStage('loader'), 2050),
      setTimeout(() => {
        minDoneRef.current = true
        if (ready && !completedRef.current) {
          completedRef.current = true
          setStage('exit')
        }
      }, 2900),
    ]
    return () => timers.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // If `ready` flips after min runtime, transition to exit
  useEffect(() => {
    if (ready && minDoneRef.current && !completedRef.current) {
      completedRef.current = true
      setStage('exit')
    }
  }, [ready])

  // Once exit fade completes, signal parent
  useEffect(() => {
    if (stage !== 'exit') return
    const t = setTimeout(() => onComplete?.(), 650)
    return () => clearTimeout(t)
  }, [stage, onComplete])

  return (
    <AnimatePresence>
      {stage !== 'done' && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{
            opacity: stage === 'exit' ? 0 : 1,
            scale: stage === 'exit' ? 1.04 : 1,
          }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden bg-white"
        >
          {/* Subtle radial gradient backdrop */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(31,78,121,0.06), transparent 60%)',
            }}
          />

          {/* Stage container */}
          <div className="relative h-44 w-44 flex items-center justify-center">
            {/* Pulsing halo behind the logo */}
            <motion.div
              className="absolute rounded-full bg-vcf-500/10 blur-3xl"
              initial={{ opacity: 0, scale: 0.4, width: 160, height: 160 }}
              animate={{
                opacity: stage === 'exit' ? 0 : 0.9,
                scale:
                  stage === 'logo'
                    ? 1
                    : stage === 'letters'
                    ? 1.15
                    : stage === 'spiral'
                    ? 1.6
                    : 1.2,
              }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              style={{ width: 160, height: 160 }}
            />

            {/* === Phase 1: PNG favicon === */}
            <AnimatePresence>
              {stage === 'logo' && (
                <motion.img
                  key="favicon"
                  src="/favicon.png"
                  alt=""
                  draggable={false}
                  initial={{ opacity: 0, scale: 0.55, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, scale: 1.45, filter: 'blur(6px)' }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute h-24 w-24 object-contain"
                />
              )}
            </AnimatePresence>

            {/* === Phase 2/3: VC letters (drawn, then spiral) === */}
            <AnimatePresence>
              {(stage === 'letters' || stage === 'spiral') && (
                <motion.svg
                  key="vc"
                  viewBox="-100 -80 200 160"
                  className="absolute h-32 w-32"
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={
                    stage === 'letters'
                      ? { opacity: 1, scale: 1, rotate: 0 }
                      : {
                          opacity: [1, 1, 0],
                          scale: [1, 1.15, 0.35],
                          rotate: [0, 90, 540],
                        }
                  }
                  exit={{ opacity: 0 }}
                  transition={
                    stage === 'letters'
                      ? { duration: 0.45, ease: [0.22, 1, 0.36, 1] }
                      : {
                          duration: 0.85,
                          ease: [0.65, 0, 0.35, 1],
                          times: [0, 0.55, 1],
                        }
                  }
                  style={{ transformOrigin: 'center' }}
                >
                  <defs>
                    <linearGradient
                      id="vcStroke"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#1f4e79" />
                      <stop offset="100%" stopColor="#002952" />
                    </linearGradient>
                  </defs>

                  {/* The letter "V": slants down to center, then up */}
                  <motion.path
                    d="M -65 -55 L -20 55 L 25 -55"
                    fill="none"
                    stroke="url(#vcStroke)"
                    strokeWidth="14"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{
                      pathLength: {
                        duration: 0.55,
                        ease: [0.22, 1, 0.36, 1],
                      },
                      opacity: { duration: 0.2 },
                    }}
                  />

                  {/* The letter "C": ¾ circle opening to the right */}
                  <motion.path
                    d="M 75 -45 A 50 50 0 1 0 75 45"
                    fill="none"
                    stroke="url(#vcStroke)"
                    strokeWidth="14"
                    strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{
                      pathLength: {
                        duration: 0.6,
                        ease: [0.22, 1, 0.36, 1],
                        delay: 0.15,
                      },
                      opacity: { duration: 0.2, delay: 0.15 },
                    }}
                  />
                </motion.svg>
              )}
            </AnimatePresence>

            {/* === Phase 4: Loader spinner === */}
            <AnimatePresence>
              {(stage === 'loader' || stage === 'exit') && (
                <motion.div
                  key="spinner"
                  initial={{ opacity: 0, scale: 0.55 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute h-20 w-20"
                >
                  <svg viewBox="0 0 50 50" className="h-full w-full">
                    <defs>
                      <linearGradient
                        id="ringGrad"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                      >
                        <stop offset="0%" stopColor="#1f4e79" stopOpacity="0" />
                        <stop offset="60%" stopColor="#1f4e79" stopOpacity="0.85" />
                        <stop offset="100%" stopColor="#002952" />
                      </linearGradient>
                    </defs>
                    <circle
                      cx="25"
                      cy="25"
                      r="20"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="3"
                    />
                    <motion.g
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                      style={{ transformOrigin: '25px 25px' }}
                    >
                      <circle
                        cx="25"
                        cy="25"
                        r="20"
                        fill="none"
                        stroke="url(#ringGrad)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray="62 64"
                      />
                    </motion.g>
                  </svg>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Brand label fades in with the spinner */}
          <motion.div
            initial={{ opacity: 0, y: 12, letterSpacing: '0.15em' }}
            animate={{
              opacity:
                stage === 'loader' || stage === 'exit' ? 1 : 0,
              y: stage === 'loader' || stage === 'exit' ? 0 : 12,
              letterSpacing:
                stage === 'loader' || stage === 'exit' ? '0.4em' : '0.15em',
            }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mt-10 text-[11px] font-semibold uppercase text-slate-500"
          >
            Varsity Capital · Fund Dashboard
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
