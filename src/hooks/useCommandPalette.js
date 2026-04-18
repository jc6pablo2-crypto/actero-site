import { useEffect, useState, useCallback } from 'react'

/**
 * useCommandPalette
 * ------------------
 * Gere l'ouverture/fermeture de la palette de commandes (Cmd+K / Ctrl+K)
 * et expose l'etat open + les setters. Enregistre automatiquement le
 * raccourci clavier global au mount et le nettoie au unmount.
 *
 * Retourne : { open, setOpen, toggle, close, isMac }
 */
export function useCommandPalette() {
  const [open, setOpen] = useState(false)

  const toggle = useCallback(() => setOpen((v) => !v), [])
  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    const handler = (e) => {
      // Cmd+K (Mac) / Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    // Custom event trigger (e.g. from sidebar search button) — Linear pattern.
    const openHandler = () => setOpen(true)
    window.addEventListener('keydown', handler)
    window.addEventListener('actero:open-command-palette', openHandler)
    return () => {
      window.removeEventListener('keydown', handler)
      window.removeEventListener('actero:open-command-palette', openHandler)
    }
  }, [])

  // Detect plateforme pour afficher Cmd vs Ctrl
  const isMac = typeof navigator !== 'undefined'
    && /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent || '')

  return { open, setOpen, toggle, close, isMac }
}
