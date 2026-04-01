'use client'

// decorative.tsx — Componentes decorativos: Sparkles, EncryptedText, ColourfulText, BentoGrid

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Sparkles ─────────────────────────────────────────────────────────────────
interface SparkleParticle { id: number; x: number; y: number; size: number; color: string; delay: number; duration: number }
const SPARKLE_COLORS = ['#7c6ef7', '#a78bfa', '#34d399', '#fbbf24', '#f0e6ff']

function generateSparkle(): SparkleParticle {
  return {
    id: Math.random(), x: Math.random() * 100, y: Math.random() * 100,
    size: 4 + Math.random() * 8, color: SPARKLE_COLORS[Math.floor(Math.random() * SPARKLE_COLORS.length)],
    delay: Math.random() * 0.8, duration: 0.6 + Math.random() * 0.6,
  }
}

export function Sparkles({ children, count = 6, className = '' }: { children: React.ReactNode; count?: number; className?: string }) {
  const [sparkles, setSparkles] = useState<SparkleParticle[]>([])
  const [active, setActive] = useState(false)

  useEffect(() => {
    if (!active) return
    setSparkles(Array.from({ length: count }, generateSparkle))
    const interval = setInterval(() => setSparkles(Array.from({ length: count }, generateSparkle)), 700)
    return () => clearInterval(interval)
  }, [active, count])

  return (
    <span className={className} style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => { setActive(false); setSparkles([]) }}>
      <AnimatePresence>
        {sparkles.map(s => (
          <motion.span key={s.id}
            initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: s.duration, delay: s.delay, ease: 'easeOut' }}
            aria-hidden style={{ position: 'absolute', left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size, pointerEvents: 'none', zIndex: 10 }}>
            <svg width={s.size} height={s.size} viewBox="0 0 16 16" fill="none">
              <path d="M8 0 L9 7 L16 8 L9 9 L8 16 L7 9 L0 8 L7 7 Z" fill={s.color} style={{ filter: `drop-shadow(0 0 3px ${s.color})` }} />
            </svg>
          </motion.span>
        ))}
      </AnimatePresence>
      <span style={{ position: 'relative', zIndex: 1 }}>{children}</span>
    </span>
  )
}

// ─── EncryptedText ────────────────────────────────────────────────────────────
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&'

export function EncryptedText({ text, duration = 1200, className = '', style = {}, trigger = 'mount' }: {
  text: string; duration?: number; className?: string; style?: React.CSSProperties; trigger?: 'mount' | 'hover'
}) {
  const [display, setDisplay] = useState(
    trigger === 'mount' ? text.replace(/[^\s]/g, () => CHARS[Math.floor(Math.random() * CHARS.length)]) : text
  )
  const [running, setRunning] = useState(false)

  const run = useCallback(() => {
    if (running) return
    setRunning(true)
    const steps = 18; let step = 0
    const interval = setInterval(() => {
      step++
      const progress = step / steps
      setDisplay(text.split('').map((char, i) => {
        if (char === ' ') return ' '
        if (i / text.length < progress) return char
        return CHARS[Math.floor(Math.random() * CHARS.length)]
      }).join(''))
      if (step >= steps) { clearInterval(interval); setDisplay(text); setRunning(false) }
    }, duration / steps)
  }, [text, duration, running])

  useEffect(() => {
    if (trigger === 'mount') { const t = setTimeout(run, 100); return () => clearTimeout(t) }
  }, []) // eslint-disable-line

  return (
    <span className={className} style={{ fontFamily: 'monospace', letterSpacing: '0.04em', ...style }}
      onMouseEnter={() => trigger === 'hover' && run()}>
      {display}
    </span>
  )
}

// ─── ColourfulText ────────────────────────────────────────────────────────────
export function ColourfulText({ children, className = '', colors = ['#7c6ef7','#a78bfa','#34d399','#22d3ee','#fbbf24','#f87171','#a06ef7'], speed = 4 }: {
  children: React.ReactNode; className?: string; colors?: string[]; speed?: number
}) {
  const gradient = `linear-gradient(90deg, ${[...colors, ...colors].join(', ')})`
  return (
    <span className={className} style={{ background: gradient, backgroundSize: '200% auto', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', animation: `colour-slide ${speed}s linear infinite`, display: 'inline-block' }}>
      {children}
    </span>
  )
}

// ─── BentoGrid / BentoItem ────────────────────────────────────────────────────
export function BentoGrid({ children, className = '', cols = 3 }: { children: React.ReactNode; className?: string; cols?: number }) {
  return (
    <div className={className} style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16, width: '100%' }}>
      {children}
    </div>
  )
}

export function BentoItem({ children, className = '', span = 1, rowSpan = 1, style = {} }: {
  children: React.ReactNode; className?: string; span?: 1 | 2 | 3; rowSpan?: 1 | 2; style?: React.CSSProperties
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }} transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={className}
      style={{ gridColumn: `span ${span}`, gridRow: `span ${rowSpan}`, background: 'rgba(13,13,20,0.82)', border: '1px solid rgba(255,255,255,0.065)', backdropFilter: 'blur(14px)', boxShadow: '0 4px 28px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04)', borderRadius: 20, overflow: 'hidden', position: 'relative', ...style }}
    >
      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(105deg, transparent 0%, rgba(124,110,247,0.035) 50%, transparent 100%)', backgroundSize: '200% 100%', animation: 'bento-shimmer 4s ease infinite', borderRadius: 'inherit' }} />
      <div style={{ position: 'relative', zIndex: 1, height: '100%' }}>{children}</div>
    </motion.div>
  )
}
