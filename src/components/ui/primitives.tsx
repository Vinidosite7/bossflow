'use client'

// primitives.tsx — Componentes base: Skeleton, LiveDot, StatBar, Buttons, BossLoader

import { motion, AnimatePresence } from 'framer-motion'

// ─── Skeleton ─────────────────────────────────────────────────────────────────
export function Skeleton({ className = '', style = {} }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div className={className} style={{
      background: 'linear-gradient(90deg, rgba(13,13,20,0.9) 0%, rgba(26,20,46,0.85) 40%, rgba(22,18,36,0.9) 60%, rgba(13,13,20,0.9) 100%)',
      backgroundSize: '400% 100%',
      animation: 'sk-wave 1.7s ease-in-out infinite',
      ...style,
    }} />
  )
}

// ─── StatBar ──────────────────────────────────────────────────────────────────
// Barra de progresso animada — usada no GoalCard e Performance cards
export function StatBar({ value, max, color, delay = 0.4 }: { value: number; max: number; color: string; delay?: number }) {
  const pct = Math.min((value / Math.max(max, 1)) * 100, 100)
  return (
    <div style={{ height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', position: 'relative' }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 1.1, delay, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'absolute', left: 0, top: 0, height: '100%', borderRadius: 99,
          background: `linear-gradient(90deg, ${color}, ${color}bb)`,
          boxShadow: `0 0 10px ${color}70`,
        }}
      />
    </div>
  )
}

// ─── LiveDot ──────────────────────────────────────────────────────────────────
// Ponto verde pulsante — indica "ao vivo" / conectado
export function LiveDot({ color = '#34d399' }: { color?: string }) {
  return (
    <span style={{ position: 'relative', display: 'inline-flex', width: 8, height: 8, flexShrink: 0 }}>
      <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: color, animation: 'live-ring 1.65s ease-out infinite' }} />
      <span style={{ position: 'relative', width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 7px ${color}`, display: 'inline-flex' }} />
    </span>
  )
}

// ─── ShimmerButton ────────────────────────────────────────────────────────────
// Botão com shimmer animado — botão primário CTA
interface ShimmerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
}

export function ShimmerButton({ children, className = '', style = {}, ...props }: ShimmerButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.022, filter: 'brightness(1.08)' }}
      whileTap={{ scale: 0.972 }}
      {...(props as any)}
      className={`relative overflow-hidden ${className}`}
      style={{ cursor: 'pointer', transition: 'box-shadow 0.22s ease', ...style }}
    >
      <span aria-hidden style={{ position: 'absolute', top: 0, bottom: 0, left: '-60%', width: '45%', background: 'linear-gradient(105deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)', animation: 'shimmer-sweep 2.6s ease-in-out infinite', pointerEvents: 'none', zIndex: 1 }} />
      <span aria-hidden style={{ position: 'absolute', top: 0, left: '8%', right: '8%', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.28), transparent)', pointerEvents: 'none', zIndex: 1 }} />
      <span style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: 6 }}>{children}</span>
    </motion.button>
  )
}

// ─── NoiseButton ──────────────────────────────────────────────────────────────
// Botão com textura de noise — alternativa ao ShimmerButton
interface NoiseButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  variant?: 'primary' | 'ghost'
}

export function NoiseButton({ children, className = '', style = {}, variant = 'primary', ...props }: NoiseButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02, filter: 'brightness(1.1)' }}
      whileTap={{ scale: 0.97 }}
      {...(props as any)}
      className={`relative overflow-hidden ${className}`}
      style={{
        cursor: 'pointer',
        background: variant === 'primary' ? 'linear-gradient(135deg, #7c6ef7, #a06ef7)' : 'rgba(255,255,255,0.04)',
        border: variant === 'primary' ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(255,255,255,0.08)',
        boxShadow: variant === 'primary' ? '0 0 28px rgba(124,110,247,0.4), inset 0 1px 0 rgba(255,255,255,0.15)' : 'none',
        color: 'white',
        ...style,
      }}
    >
      <span aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E")`, backgroundSize: '120px 120px', animation: 'noise-shift 0.5s steps(1) infinite', mixBlendMode: 'overlay', borderRadius: 'inherit' }} />
      <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>{children}</span>
    </motion.button>
  )
}

// ─── BossLoader ───────────────────────────────────────────────────────────────
// Loading screen full-page com identidade BossFlow — spinner duplo + logo BF
export function BossLoader({ message = 'Carregando...' }: { message?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(7,7,14,0.96)', backdropFilter: 'blur(12px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}
    >
      <div style={{ position: 'relative', width: 64, height: 64 }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid transparent', borderTopColor: '#7c6ef7', borderRightColor: 'rgba(124,110,247,0.3)', animation: 'loader-spin 1s linear infinite' }} />
        <div style={{ position: 'absolute', inset: 8, borderRadius: '50%', border: '2px solid transparent', borderTopColor: '#a06ef7', borderLeftColor: 'rgba(160,110,247,0.3)', animation: 'loader-spin 0.75s linear infinite reverse' }} />
        <div style={{ position: 'absolute', inset: 16, borderRadius: 8, background: 'linear-gradient(135deg, #7c6ef7, #a06ef7)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(124,110,247,0.5)', animation: 'loader-pulse 2s ease-in-out infinite' }}>
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 10, color: 'white', letterSpacing: '-0.02em' }}>BF</span>
        </div>
      </div>
      {message && <p style={{ fontSize: 13, color: '#4a4a6a', letterSpacing: '0.08em', fontWeight: 500 }}>{message}</p>}
    </motion.div>
  )
}

// ─── FloatingDock ─────────────────────────────────────────────────────────────
// Dock de ícones estilo macOS com efeito magnético
interface DockItem { icon: React.ReactNode; label: string; href: string; active?: boolean; color?: string }

export function FloatingDock({ items, className = '' }: { items: DockItem[]; className?: string }) {
  const [hoverIdx, setHoverIdx] = React.useState<number | null>(null)
  return (
    <div className={className} style={{ display: 'flex', alignItems: 'flex-end', gap: 6, padding: '10px 14px', borderRadius: 24, background: 'rgba(10,10,18,0.92)', border: '1px solid rgba(124,110,247,0.18)', boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(124,110,247,0.06)', backdropFilter: 'blur(20px)' }}>
      {items.map((item, i) => {
        const isHover = hoverIdx === i
        const isNeighbor = hoverIdx !== null && Math.abs(hoverIdx - i) === 1
        const scale = isHover ? 1.45 : isNeighbor ? 1.2 : 1
        return (
          <a key={item.href} href={item.href} onMouseEnter={() => setHoverIdx(i)} onMouseLeave={() => setHoverIdx(null)} style={{ position: 'relative', textDecoration: 'none' }}>
            <motion.div animate={{ scale, y: isHover ? -10 : isNeighbor ? -4 : 0 }} transition={{ type: 'spring', stiffness: 320, damping: 22 }} style={{ width: 44, height: 44, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: item.active ? 'linear-gradient(135deg, rgba(124,110,247,0.3), rgba(160,110,247,0.2))' : 'rgba(255,255,255,0.04)', border: `1px solid ${item.active ? 'rgba(124,110,247,0.35)' : 'rgba(255,255,255,0.07)'}`, boxShadow: item.active ? '0 0 16px rgba(124,110,247,0.25)' : 'none', color: item.active ? (item.color || '#9d8fff') : '#4a4a6a', transition: 'background 0.15s, border-color 0.15s, color 0.15s', cursor: 'pointer' }}>{item.icon}</motion.div>
            <AnimatePresence>
              {isHover && (
                <motion.div initial={{ opacity: 0, y: 4, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 4, scale: 0.9 }} transition={{ duration: 0.12 }} style={{ position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap', padding: '4px 10px', borderRadius: 8, background: 'rgba(10,10,18,0.95)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 11, fontWeight: 600, color: '#d0d0e0', pointerEvents: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.5)' }}>{item.label}</motion.div>
              )}
            </AnimatePresence>
            {item.active && <div style={{ position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)', width: 4, height: 4, borderRadius: '50%', background: item.color || '#7c6ef7', boxShadow: `0 0 6px ${item.color || '#7c6ef7'}` }} />}
          </a>
        )
      })}
    </div>
  )
}

// ─── SyneText ─────────────────────────────────────────────────────────────────
// Helper de tipografia rápida com Syne — renomeado para evitar conflito com T de lib/design.ts
export function SyneText({ children, className = '', style = {} }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return <span className={className} style={{ fontFamily: 'Syne, sans-serif', ...style }}>{children}</span>
}

// Necessário para FloatingDock
import React from 'react'
