'use client'

import { useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence, animate } from 'framer-motion'

// ─── Design Tokens ───────────────────────────────────────────────
export const T = {
  base:          '#0b0f14',
  card:          '#0f1623',
  elevated:      '#141d2b',
  border:        'rgba(148,163,184,0.08)',
  borderMid:     'rgba(148,163,184,0.14)',
  borderHover:   'rgba(148,163,184,0.22)',
  emerald:       '#10b981',
  emeraldDim:    'rgba(16,185,129,0.08)',
  emeraldGlow:   'rgba(16,185,129,0.18)',
  amber:         '#f59e0b',
  amberDim:      'rgba(245,158,11,0.08)',
  amberGlow:     'rgba(245,158,11,0.15)',
  red:           '#ef4444',
  redDim:        'rgba(239,68,68,0.08)',
  blue:          '#3b82f6',
  blueDim:       'rgba(59,130,246,0.08)',
  textPrimary:   '#e2e8f0',
  textSecondary: '#94a3b8',
  textMuted:     '#475569',
  purple:        '#7c6ef7',
  purpleDim:     'rgba(124,110,247,0.08)',
}

// ─── Fonts ───────────────────────────────────────────────────────
export function BossFlowFonts() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,600;9..144,700;9..144,900&display=swap');

      *, *::before, *::after { font-family: 'DM Sans', sans-serif; box-sizing: border-box; }

      /* Scrollbar premium */
      ::-webkit-scrollbar { width: 4px; height: 4px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: rgba(148,163,184,0.12); border-radius: 99px; }
      ::-webkit-scrollbar-thumb:hover { background: rgba(148,163,184,0.22); }

      /* Input date fix dark */
      input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.6); cursor: pointer; }
      input[type="number"]::-webkit-inner-spin-button { -webkit-appearance: none; }

      @keyframes skWave {
        0%   { background-position: 200% center; }
        100% { background-position: -200% center; }
      }
      @keyframes shimmerSweep {
        0%,100% { background-position: 200% center; }
        50%     { background-position: -200% center; }
      }
      @keyframes pulse-ring {
        0%   { transform: scale(1); opacity: 1; }
        100% { transform: scale(2.4); opacity: 0; }
      }
      @keyframes float-orb {
        0%,100% { transform: translate(0,0) scale(1); }
        50%     { transform: translate(12px, -16px) scale(1.08); }
      }
    `}</style>
  )
}

// ─── SVG Grain filter (hidden, referenced via CSS) ───────────────
export function GrainFilter() {
  return (
    <svg style={{ position: 'fixed', width: 0, height: 0, pointerEvents: 'none', zIndex: -1 }} aria-hidden>
      <defs>
        <filter id="bf-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="4" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer><feFuncA type="linear" slope="0.045" /></feComponentTransfer>
          <feBlend in="SourceGraphic" mode="overlay" />
        </filter>
      </defs>
    </svg>
  )
}

// ─── Background ambiental da página ──────────────────────────────
// Gradientes radiais flutuantes + dot grid — dá profundidade sem poluir
export function PageBackground() {
  return (
    <div style={{
      position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
      overflow: 'hidden',
    }}>
      {/* Orb esmeralda — canto superior esquerdo */}
      <div style={{
        position: 'absolute', top: -180, left: -60,
        width: 520, height: 520, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(16,185,129,0.055) 0%, transparent 70%)',
        animation: 'float-orb 12s ease-in-out infinite',
        filter: 'blur(1px)',
      }} />
      {/* Orb amber — canto inferior direito */}
      <div style={{
        position: 'absolute', bottom: -200, right: -100,
        width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(245,158,11,0.04) 0%, transparent 70%)',
        animation: 'float-orb 18s ease-in-out infinite reverse',
        filter: 'blur(1px)',
      }} />
      {/* Dot grid pattern */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `radial-gradient(circle, rgba(148,163,184,0.07) 1px, transparent 1px)`,
        backgroundSize: '28px 28px',
        maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)',
      }} />
    </div>
  )
}

// ─── GrainCard ───────────────────────────────────────────────────
interface GrainCardProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  hover?: boolean
  onClick?: () => void
  accent?: string
  glow?: boolean
}

export function GrainCard({ children, className = '', style = {}, hover = false, onClick, accent, glow }: GrainCardProps) {
  const [hovered, setHovered] = useState(false)
  const Tag = onClick ? motion.button : motion.div

  return (
    <Tag
      onClick={onClick}
      onHoverStart={() => hover && setHovered(true)}
      onHoverEnd={() => hover && setHovered(false)}
      className={`relative overflow-hidden rounded-2xl ${className}`}
      style={{
        background: T.card,
        border: `1px solid ${hovered ? T.borderHover : T.border}`,
        boxShadow: hovered && glow && accent
          ? `0 0 0 1px ${accent}20, 0 8px 32px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.2)`
          : '0 2px 12px rgba(0,0,0,0.22)',
        transition: 'border-color 0.2s ease, box-shadow 0.25s ease',
        ...style,
      }}
      whileHover={hover ? { y: -2, transition: { duration: 0.2, ease: 'easeOut' } } : undefined}
      whileTap={onClick ? { scale: 0.985 } : undefined}
    >
      {/* Grain noise */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1, borderRadius: 'inherit',
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)' opacity='0.04'/%3E%3C/svg%3E")`,
        backgroundSize: '160px 160px',
        mixBlendMode: 'overlay',
        opacity: 0.7,
      }} />

      {/* Accent glow line — top */}
      {accent && (
        <div style={{
          position: 'absolute', top: 0, left: '15%', right: '15%', height: '1px', zIndex: 2,
          background: `linear-gradient(90deg, transparent, ${accent}70, transparent)`,
          opacity: hovered ? 1 : 0.6,
          transition: 'opacity 0.2s ease',
        }} />
      )}

      {/* Hover inner glow */}
      {hover && hovered && accent && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{
            position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1, borderRadius: 'inherit',
            background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${accent}08, transparent 70%)`,
          }}
        />
      )}

      <div style={{ position: 'relative', zIndex: 3 }}>{children}</div>
    </Tag>
  )
}

// ─── EmeraldButton ───────────────────────────────────────────────
interface EmeraldButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  variant?: 'solid' | 'outline' | 'ghost'
  loading?: boolean
}

export function EmeraldButton({ children, size = 'md', variant = 'solid', loading, className = '', style = {}, ...props }: EmeraldButtonProps) {
  const sizes = { sm: { px: 12, py: 7, fs: 12 }, md: { px: 16, py: 10, fs: 13 }, lg: { px: 22, py: 13, fs: 15 } }
  const { px, py, fs } = sizes[size]

  const variantStyles = {
    solid: {
      background: `linear-gradient(135deg, ${T.emerald} 0%, #059669 100%)`,
      color: '#fff', border: 'none',
      boxShadow: `0 0 24px ${T.emeraldGlow}, inset 0 1px 0 rgba(255,255,255,0.18)`,
    },
    outline: {
      background: T.emeraldDim, color: T.emerald,
      border: `1px solid ${T.emerald}35`, boxShadow: 'none',
    },
    ghost: {
      background: 'transparent', color: T.textSecondary,
      border: `1px solid ${T.border}`, boxShadow: 'none',
    },
  }

  return (
    <motion.button
      whileHover={{ scale: 1.025 }} whileTap={{ scale: 0.97 }}
      {...props as any}
      className={`relative overflow-hidden rounded-xl font-semibold flex items-center gap-2 cursor-pointer ${className}`}
      style={{
        ...variantStyles[variant], padding: `${py}px ${px}px`, fontSize: fs,
        transition: 'box-shadow 0.2s ease', fontFamily: 'DM Sans, sans-serif',
        fontWeight: 600, opacity: props.disabled ? 0.6 : 1,
        ...style,
      }}>
      {/* Shimmer */}
      {variant === 'solid' && !loading && (
        <span style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.14) 50%, transparent 70%)',
          backgroundSize: '200% 100%',
          animation: 'shimmerSweep 3.5s ease-in-out infinite',
        }} />
      )}
      <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
        {loading
          ? <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite' }} />
          : children}
      </span>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </motion.button>
  )
}

// ─── KPI Number display ──────────────────────────────────────────
export function KPIValue({ value, color, size = 'xl' }: { value: string; color?: string; size?: 'lg' | 'xl' | '2xl' | '3xl' }) {
  const fsMap = { lg: '1.75rem', xl: '2.25rem', '2xl': '3rem', '3xl': '3.75rem' }
  return (
    <p style={{
      fontFamily: 'Fraunces, serif',
      fontWeight: 700,
      fontSize: fsMap[size],
      lineHeight: 1,
      letterSpacing: '-0.02em',
      color: color || T.textPrimary,
      fontVariantNumeric: 'tabular-nums',
    }}>
      {value}
    </p>
  )
}

// ─── Animated counter ────────────────────────────────────────────
export function AnimCounter({ value, format }: { value: number; format: (v: number) => string }) {
  const [display, setDisplay] = useState(format(0))
  const prev = useRef(0)
  useEffect(() => {
    const from = prev.current; prev.current = value
    const c = animate(from, value, {
      duration: 0.9, ease: [0.16, 1, 0.3, 1],
      onUpdate: v => setDisplay(format(v)),
    })
    return c.stop
  }, [value])
  return <>{display}</>
}

// ─── StatBar ─────────────────────────────────────────────────────
export function StatBar({ value, max, color, delay = 0 }: { value: number; max: number; color: string; delay?: number }) {
  const pct = Math.min((value / Math.max(max, 1)) * 100, 100)
  return (
    <div style={{ position: 'relative', height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
      <motion.div
        style={{ position: 'absolute', inset: '0 auto 0 0', borderRadius: 99, background: color, boxShadow: `0 0 8px ${color}60` }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 1.1, delay, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  )
}

// ─── Skeleton ────────────────────────────────────────────────────
export function Skeleton({ className = '', style = {} }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`rounded-2xl ${className}`} style={{
      background: `linear-gradient(90deg, ${T.card} 25%, ${T.elevated} 50%, ${T.card} 75%)`,
      backgroundSize: '400% 100%',
      animation: 'skWave 1.6s ease-in-out infinite',
      ...style,
    }} />
  )
}

// ─── Pill / Badge ────────────────────────────────────────────────
export function Pill({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600,
      background: `${color}12`, color, border: `1px solid ${color}25`,
      fontFamily: 'DM Sans, sans-serif',
    }}>
      {children}
    </span>
  )
}

// ─── Section header ──────────────────────────────────────────────
export function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div>
      <h2 style={{
        fontSize: 14, fontWeight: 600, color: T.textPrimary, fontFamily: 'DM Sans, sans-serif', lineHeight: 1.3,
      }}>{children}</h2>
      {sub && <p style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{sub}</p>}
    </div>
  )
}

export { motion, AnimatePresence, animate }
