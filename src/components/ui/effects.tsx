'use client'

// effects.tsx — Efeitos visuais: backgrounds, SpotlightCard, GlowCorner, GlowingEffect

import { useRef, useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export function BackgroundGrid({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: 'relative', minHeight: '100%' }}>
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: 'radial-gradient(circle, rgba(124,110,247,0.10) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        maskImage: 'radial-gradient(ellipse 85% 80% at 50% 42%, black 25%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse 85% 80% at 50% 42%, black 25%, transparent 100%)',
      }} />
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse 130% 100% at 50% -10%, transparent 35%, rgba(5,5,12,0.65) 100%)',
      }} />
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </div>
  )
}

export function FloatingOrbs() {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -180, left: -100, width: 580, height: 580, borderRadius: '50%', background: 'radial-gradient(circle at 40% 40%, rgba(124,110,247,0.09) 0%, transparent 60%)', animation: 'orb-drift-a 18s ease-in-out infinite', filter: 'blur(1px)' }} />
      <div style={{ position: 'absolute', bottom: -220, right: -140, width: 660, height: 660, borderRadius: '50%', background: 'radial-gradient(circle at 60% 60%, rgba(52,211,153,0.065) 0%, transparent 60%)', animation: 'orb-drift-b 22s ease-in-out infinite', filter: 'blur(1px)' }} />
      <div style={{ position: 'absolute', top: '30%', right: '5%', width: 340, height: 340, borderRadius: '50%', background: 'radial-gradient(circle, rgba(157,110,247,0.04) 0%, transparent 70%)', animation: 'orb-drift-c 28s ease-in-out infinite' }} />
    </div>
  )
}

interface SpotlightCardProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  spotlightColor?: string
  variant?: 'default' | 'focus'
}

export function SpotlightCard({
  children, className = '', style = {},
  spotlightColor = 'rgba(124,110,247,0.13)',
  variant = 'default',
}: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ x: -9999, y: -9999 })
  const [hovered, setHovered] = useState(false)

  const onMove = useCallback((e: MouseEvent) => {
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    setPos({ x: e.clientX - r.left, y: e.clientY - r.top })
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const enter = () => setHovered(true)
    const leave = () => { setHovered(false); setPos({ x: -9999, y: -9999 }) }
    el.addEventListener('mousemove', onMove)
    el.addEventListener('mouseenter', enter)
    el.addEventListener('mouseleave', leave)
    return () => {
      el.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseenter', enter)
      el.removeEventListener('mouseleave', leave)
    }
  }, [onMove])

  const borderHover = hovered
    ? '1px solid rgba(124,110,247,0.22)'
    : (style.border as string | undefined) || '1px solid rgba(255,255,255,0.06)'

  const spotlightSize = variant === 'focus' ? 320 : 280

  return (
    <div ref={ref} className={className} style={{
      position: 'relative', overflow: 'hidden', ...style,
      border: borderHover,
      boxShadow: hovered
        ? `${(style.boxShadow as string) || ''}, 0 0 0 1px rgba(124,110,247,0.08)`
        : style.boxShadow as string | undefined,
      transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    }}>
      {/* Spotlight */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2,
        background: `radial-gradient(${spotlightSize}px circle at ${pos.x}px ${pos.y}px, ${spotlightColor}, transparent 68%)`,
        transition: hovered ? 'none' : 'background 0.4s ease', borderRadius: 'inherit',
      }} />
      {/* Noise texture (default only) */}
      {variant === 'default' && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 3, borderRadius: 'inherit',
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.78' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)' opacity='0.045'/%3E%3C/svg%3E")`,
          backgroundSize: '140px 140px', mixBlendMode: 'overlay', opacity: 0.75,
        }} />
      )}
      {/* Top highlight (default only) */}
      {variant === 'default' && (
        <div style={{
          position: 'absolute', top: 0, left: '8%', right: '8%', height: '1px',
          zIndex: 4, pointerEvents: 'none',
          background: hovered
            ? `linear-gradient(90deg, transparent, ${spotlightColor.replace(/[\d.]+\)$/, '0.55)')}, transparent)`
            : 'transparent',
          transition: 'background 0.3s ease',
        }} />
      )}
      {/* Bottom glow (default only) */}
      {variant === 'default' && (
        <div style={{
          position: 'absolute', bottom: 0, left: '20%', right: '20%', height: '1px',
          zIndex: 4, pointerEvents: 'none',
          background: hovered ? 'linear-gradient(90deg, transparent, rgba(124,110,247,0.18), transparent)' : 'transparent',
          transition: 'background 0.3s ease',
        }} />
      )}
      {/* Focus circle (focus only) */}
      {variant === 'focus' && hovered && (
        <div style={{
          position: 'absolute', pointerEvents: 'none', zIndex: 3, borderRadius: '50%',
          width: 120, height: 120, left: pos.x - 60, top: pos.y - 60,
          background: `radial-gradient(circle, ${spotlightColor.replace(/[\d.]+\)$/, '0.18)')} 0%, transparent 70%)`,
          filter: 'blur(12px)', transition: 'none',
        }} />
      )}
      <div style={{ position: 'relative', zIndex: 5 }}>{children}</div>
    </div>
  )
}

// CardSpotlight — alias retrocompat → usa SpotlightCard variant='focus'
export function CardSpotlight({ children, className = '', style = {}, color = '#7c6ef7' }: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties; color?: string
}) {
  return (
    <SpotlightCard
      className={className}
      style={{ background: 'rgba(13,13,20,0.82)', backdropFilter: 'blur(14px)', ...style }}
      spotlightColor={`${color}1a`}
      variant="focus"
    >
      {children}
    </SpotlightCard>
  )
}

export function GlowCorner({ color, position = 'bottom-right' }: {
  color: string; position?: 'bottom-right' | 'bottom-left' | 'top-right'
}) {
  const pos: Record<string, React.CSSProperties> = {
    'bottom-right': { bottom: -24, right: -24 },
    'bottom-left':  { bottom: -24, left:  -24 },
    'top-right':    { top:    -24, right: -24  },
  }
  return (
    <div style={{
      position: 'absolute', width: 130, height: 130, borderRadius: '50%',
      background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
      filter: 'blur(18px)', pointerEvents: 'none', zIndex: 0, ...pos[position],
    }} />
  )
}

export function GlowingEffect({ children, className = '', color = '#7c6ef7', spread = 36, blur = 14, disabled = false }: {
  children: React.ReactNode; className?: string; color?: string; spread?: number; blur?: number; disabled?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [angle, setAngle] = useState(0)
  const [hovered, setHovered] = useState(false)
  const raf = useRef<number>(0)

  useEffect(() => {
    if (!hovered || disabled) return
    const start = performance.now()
    function tick(now: number) {
      setAngle(((now - start) / 3000) * 360)
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [hovered, disabled])

  const gradient = `conic-gradient(from ${angle}deg at 50% 50%, transparent 0deg, ${color}cc ${spread}deg, transparent ${spread * 2}deg)`

  return (
    <div ref={ref} className={className} style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      {!disabled && (
        <div aria-hidden style={{
          position: 'absolute', inset: -1, borderRadius: 'inherit', background: gradient,
          filter: `blur(${blur}px)`, opacity: hovered ? 1 : 0, transition: 'opacity 0.4s ease',
          pointerEvents: 'none', zIndex: 0,
        }} />
      )}
      <div style={{ position: 'relative', zIndex: 1, width: '100%' }}>{children}</div>
    </div>
  )
}

export function BackgroundBeamsSection({ children, className = '', beamCount = 6 }: {
  children: React.ReactNode; className?: string; beamCount?: number
}) {
  const beams = Array.from({ length: beamCount }, (_, i) => ({
    id: i, left: `${(i / beamCount) * 100 + Math.random() * 10}%`,
    angle: 30 + Math.random() * 20, duration: 6 + Math.random() * 8,
    delay: i * (12 / beamCount), width: 60 + Math.random() * 120,
    opacity: 0.04 + Math.random() * 0.08,
  }))
  return (
    <div className={className} style={{ position: 'relative', overflow: 'hidden' }}>
      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        {beams.map(b => (
          <div key={b.id} style={{
            position: 'absolute', top: '-20%', left: b.left, width: b.width, height: '140%',
            background: `linear-gradient(180deg, transparent 0%, rgba(124,110,247,${b.opacity}) 40%, rgba(124,110,247,${b.opacity * 0.6}) 60%, transparent 100%)`,
            transform: `rotate(${b.angle}deg)`, transformOrigin: 'top center',
            animation: `beam-move ${b.duration}s ease-in-out ${b.delay}s infinite`,
            '--beam-angle': `${b.angle}deg`,
          } as React.CSSProperties} />
        ))}
      </div>
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </div>
  )
}

export function RippleBackground({ children, className = '', color = 'rgba(124,110,247,0.12)', rings = 5 }: {
  children: React.ReactNode; className?: string; color?: string; rings?: number
}) {
  return (
    <div className={className} style={{ position: 'relative', overflow: 'hidden' }}>
      <div aria-hidden style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 0 }}>
        {Array.from({ length: rings }, (_, i) => (
          <div key={i} style={{
            position: 'absolute', width: `${(i + 1) * (100 / rings)}%`,
            paddingBottom: `${(i + 1) * (100 / rings)}%`, borderRadius: '50%',
            border: `1px solid ${color}`,
            animation: `ripple-expand ${3 + i * 0.8}s ease-out ${i * 0.5}s infinite`,
            opacity: 1 - i * 0.15,
          }} />
        ))}
      </div>
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </div>
  )
}
