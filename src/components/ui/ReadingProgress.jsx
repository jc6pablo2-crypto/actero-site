import React, { useState, useEffect } from 'react'

export const ReadingProgress = ({ vertical }) => {
  const [progress, setProgress] = useState(0)
  const isImmo = vertical === 'immobilier'

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      setProgress(docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="fixed top-0 left-0 right-0 z-[200] h-[2px] bg-white/5 pointer-events-none">
      <div
        className={`h-full transition-[width] duration-75 ${
          isImmo
            ? 'bg-gradient-to-r from-violet-500 via-purple-400 to-fuchsia-500'
            : 'bg-gradient-to-r from-emerald-500 via-cyan-400 to-emerald-400'
        }`}
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
