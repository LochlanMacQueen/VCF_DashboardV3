import { useEffect, useRef, useState } from 'react'

/**
 * Smoothly counts from the previous value to the new one.
 * Defaults to ~700 ms ease-out so it feels lively but not noisy.
 */
export default function AnimatedNumber({
  value,
  duration = 700,
  format = (v) => v.toFixed(2),
  className = '',
}) {
  const [display, setDisplay] = useState(value)
  const fromRef = useRef(value)
  const startRef = useRef(null)
  const rafRef = useRef(null)

  useEffect(() => {
    cancelAnimationFrame(rafRef.current)
    fromRef.current = display
    startRef.current = null

    const step = (ts) => {
      if (!startRef.current) startRef.current = ts
      const elapsed = ts - startRef.current
      const t = Math.min(1, elapsed / duration)
      const eased = 1 - Math.pow(1 - t, 3) // easeOutCubic
      const next = fromRef.current + (value - fromRef.current) * eased
      setDisplay(next)
      if (t < 1) rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration])

  return <span className={className}>{format(display)}</span>
}
