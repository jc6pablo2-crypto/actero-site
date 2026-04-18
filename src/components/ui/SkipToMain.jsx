import React from 'react'

/**
 * SkipToMain — keyboard-only a11y primitive.
 *
 * Invisible until focused. On Tab-in from the page top, it appears as a
 * floating CTA in the top-left. Activating it jumps focus/scroll to an
 * element with id="main-content", which must exist somewhere in the page
 * (we put it on the <main> wrapper in each dashboard).
 *
 * WCAG 2.4.1 (Bypass Blocks) — keyboard users shouldn't have to tab
 * through the entire sidebar on every page load to reach content.
 *
 * Usage:
 *   <SkipToMain />
 *   ...
 *   <main id="main-content">...</main>
 */
export function SkipToMain({ label = "Passer au contenu principal", targetId = "main-content" }) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[1000] focus:px-4 focus:py-2 focus:rounded-xl focus:bg-cta focus:text-white focus:text-[13px] focus:font-semibold focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-cta/40"
    >
      {label}
    </a>
  )
}
