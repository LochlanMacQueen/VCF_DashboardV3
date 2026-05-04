import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

/**
 * Premium login → dashboard intro (~3s, hard-capped):
 *   1. Stroke-drawn "VC" wordmark appears
 *   2. Letters spiral outward (rotate + shrink)
 *   3. They reform as a clean gradient ring spinner
 *   4. Tagline fades in below
 *   5. Whole panel cross-fades out, revealing the app
 *
 * Runs on its OWN clock (not gated on data load) so it can never hang.
 * After it dismisses, App falls back to <Loading /> if data is still
 * pending.
 */

export default function IntroAnimation({ onComplete }) {
  // Stages: 'letters' → 'spiral' → 'loader' → 'exit'
  const [stage, setStage] = useState('letters')

  useEffect(() => {
    const timers = [
      setTimeout(() => setStage('spiral'), 800),
      setTimeout(() => setStage('loader'), 1500),
      setTimeout(() => setStage('exit'), 2500),
      setTimeout(() => onComplete?.(), 3050),
    ]
    return () => timers.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <AnimatePresence>
      {stage !== 'done' && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{
            opacity: stage === 'exit' ? 0 : 1,
            scale: stage === 'exit' ? 1.04 : 1,
          }}
          transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden bg-white"
        >
          {/* Subtle radial backdrop */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(31,78,121,0.06), transparent 60%)',
            }}
          />

          <div className="relative h-44 w-44 flex items-center justify-center">
            {/* Pulsing halo */}
            <motion.div
              className="absolute rounded-full bg-vcf-500/10 blur-3xl"
              initial={{ opacity: 0, scale: 0.5, width: 160, height: 160 }}
              animate={{
                opacity: stage === 'exit' ? 0 : 0.9,
                scale:
                  stage === 'letters'
                    ? 1
                    : stage === 'spiral'
                    ? 1.6
                    : 1.2,
              }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              style={{ width: 160, height: 160 }}
            />

            {/* === Phase 1/2: VC letters (drawn, then spiral) === */}
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

                  {/* "V" */}
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

                  {/* "C" — ¾ circle opening to the right */}
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

            {/* === Phase 3: Loader spinner === */}
            <AnimatePresence>
              {(stage === 'loader' || stage === 'exit') && (
                <motion.div
                  key="spinner"
                  initial={{ opacity: 0, scale: 0.55 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
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
              opacity: stage === 'loader' || stage === 'exit' ? 1 : 0,
              y: stage === 'loader' || stage === 'exit' ? 0 : 12,
              letterSpacing:
                stage === 'loader' || stage === 'exit' ? '0.4em' : '0.15em',
            }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="mt-10 text-[11px] font-semibold uppercase text-slate-500"
          >
            Varsity Capital · Fund Dashboard
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
