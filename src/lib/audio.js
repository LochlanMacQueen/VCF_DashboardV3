// ============================================
// Audio context priming (works around browser autoplay policy)
// ============================================
//
// Browsers require an AudioContext to be created/resumed *inside* a user
// gesture (click, keypress, etc). Async work between the gesture and the
// sound (like awaiting Supabase login) breaks that link.
//
// Solution: prime a single shared AudioContext as soon as the user clicks
// the login button (or any first interaction on the page), then re-use it
// when the intro animation plays its chime.

let primedContext = null
let autoListenerAttached = false

function getCtor() {
  return window.AudioContext || window.webkitAudioContext
}

/** Create or reuse the shared AudioContext, resuming it if possible. */
export function primeAudio() {
  const Ctx = getCtor()
  if (!Ctx) return null
  if (!primedContext) {
    try {
      primedContext = new Ctx()
    } catch {
      return null
    }
  }
  // Must be called inside the user gesture the first time around.
  primedContext.resume?.().catch(() => {})
  return primedContext
}

/** Returns the primed context if one exists, else null. */
export function getAudioContext() {
  return primedContext
}

/**
 * Attach a one-shot listener that primes audio on the first interaction
 * anywhere in the document. Useful for session-restored loads where the
 * user never clicked the login button.
 */
export function attachAutoPrime() {
  if (autoListenerAttached || typeof document === 'undefined') return
  autoListenerAttached = true

  const handler = () => {
    primeAudio()
    document.removeEventListener('pointerdown', handler)
    document.removeEventListener('keydown', handler)
    document.removeEventListener('touchstart', handler)
  }
  document.addEventListener('pointerdown', handler, { passive: true })
  document.addEventListener('keydown', handler)
  document.addEventListener('touchstart', handler, { passive: true })
}
