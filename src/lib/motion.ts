/**
 * Actero motion helpers — respect prefers-reduced-motion systematically.
 *
 * Usage:
 *   import { useMotion, motionPresets } from '@/lib/motion'
 *   const m = useMotion()
 *   <motion.div {...m.fadeUp}>...</motion.div>
 *
 * Why: ui-ux-pro-max priority 1 (a11y `reduced-motion`) — users with
 * vestibular disorders + OS-level "Reduce Motion" setting must not see
 * distracting animations. We zero-out transforms/opacity transitions when
 * detected, keeping layout intact.
 *
 * All motion in Actero should go through these presets or manually check
 * useReducedMotion(). Direct framer-motion calls without the check are a
 * lint-level smell.
 */
import { useReducedMotion, type Transition } from 'framer-motion'

// ── Base transitions ────────────────────────────────────────────
const EASE_OUT: Transition['ease'] = [0.22, 1, 0.36, 1]
const EASE_IN: Transition['ease'] = [0.4, 0, 1, 1]

export const motionPresets = {
  /** Fade up from 8px — for cards, sections, list items entering. */
  fadeUp: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3, ease: EASE_OUT },
  },
  /** Fade only — for overlays, skeletons, backgrounds. */
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.2, ease: EASE_OUT },
  },
  /** Scale+fade — for modals, popovers. */
  scaleFade: {
    initial: { opacity: 0, scale: 0.96 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.96, transition: { duration: 0.15, ease: EASE_IN } },
    transition: { duration: 0.25, ease: EASE_OUT },
  },
  /** Slide up — for sheets, bottom modals. */
  slideUp: {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 24, transition: { duration: 0.18, ease: EASE_IN } },
    transition: { duration: 0.3, ease: EASE_OUT },
  },
} as const

/** No-op motion preset returned when reduced-motion is ON. Keeps props shape stable. */
const NULL_PRESET = {
  initial: { opacity: 1 },
  animate: { opacity: 1 },
  transition: { duration: 0 },
}

type PresetKey = keyof typeof motionPresets
type MotionApi = Record<PresetKey, typeof motionPresets[PresetKey] | typeof NULL_PRESET>

/**
 * Returns motion presets that respect prefers-reduced-motion.
 * All presets collapse to a no-op when reduced-motion is ON.
 */
export function useMotion(): MotionApi {
  const reduce = useReducedMotion()
  if (!reduce) return motionPresets
  const disabled = Object.fromEntries(
    Object.keys(motionPresets).map((k) => [k, NULL_PRESET])
  ) as MotionApi
  return disabled
}

/**
 * Returns a numeric duration in ms, collapsing to 0 when reduced-motion is ON.
 * Use when you need raw duration for CSS transitions or imperative animations.
 */
export function useAnimationDuration(ms: number): number {
  const reduce = useReducedMotion()
  return reduce ? 0 : ms
}
