import React, { useRef, useState, useCallback } from 'react'

export const GlowCard = ({ children, className = '', color = 'emerald', glowSize = 220 }) => {
  const ref = useRef(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [visible, setVisible] = useState(false)

  const glowColors = {
    emerald: 'rgba(16,185,129,0.12)',
    cyan: 'rgba(6,182,212,0.12)',
    violet: 'rgba(139,92,246,0.12)',
    purple: 'rgba(168,85,247,0.12)',
    amber: 'rgba(245,158,11,0.10)',
    white: 'rgba(255,255,255,0.06)',
  }

  const handleMouseMove = useCallback((e) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
    if (!visible) setVisible(true)
  }, [visible])

  const handleMouseLeave = useCallback(() => setVisible(false), [])

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden ${className}`}
    >
      <div
        className="absolute pointer-events-none rounded-full transition-opacity duration-300"
        style={{
          left: pos.x - glowSize / 2,
          top: pos.y - glowSize / 2,
          width: glowSize,
          height: glowSize,
          background: `radial-gradient(circle, ${glowColors[color] || glowColors.white} 0%, transparent 70%)`,
          opacity: visible ? 1 : 0,
        }}
      />
      {children}
    </div>
  )
}
