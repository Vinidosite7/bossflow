'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react'
import type { TourStep } from '@/hooks/useTour'

interface Props {
  active: boolean
  step: TourStep
  current: number
  total: number
  onNext: () => void
  onPrev: () => void
  onFinish: () => void
}

interface Pos {
  top: number
  left: number
  placement: 'top' | 'bottom'
  arrowLeft: number
}

interface HighlightRect {
  x: number
  y: number
  width: number
  height: number
}

const SPRING = { type: 'spring' as const, stiffness: 320, damping: 28 }
const EASE   = { duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] as const }

export function TourTooltip({ active, step, current, total, onNext, onPrev, onFinish }: Props) {
  const tooltipRef   = useRef<HTMLDivElement>(null)
  const [pos,        setPos]        = useState<Pos | null>(null)
  const [highlight,  setHighlight]  = useState<HighlightRect | null>(null)
  const [ready,      setReady]      = useState(false)

  const isLast  = current === total - 1
  const isFirst = current === 0

  useEffect(() => {
    if (!active || !step) return

    setReady(false)
    let cancelled = false
    let attempts  = 0
    let timer: ReturnType<typeof setTimeout>

    async function calculate() {
      if (cancelled) return

      const el = document.querySelector(step.target) as HTMLElement | null

      if (!el) {
        if (attempts < 12) {
          attempts++
          timer = setTimeout(calculate, 100)
        } else {
          // fallback — centro da tela
          const vw = window.innerWidth
          const vh = window.innerHeight
          setHighlight(null)
          setPos({ top: vh / 2 - 100, left: Math.max(16, vw / 2 - 150), placement: 'bottom', arrowLeft: 150 })
          setReady(true)
        }
        return
      }

      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      await new Promise(r => setTimeout(r, 380))
      if (cancelled) return

      const rect  = el.getBoundingClientRect()
      const vw    = window.innerWidth
      const vh    = window.innerHeight
      const PAD   = 8
      const TIP_W = Math.min(300, vw - 32)
      const TIP_H = 170
      const GAP   = 14

      setHighlight({
        x:      rect.left   - PAD,
        y:      rect.top    - PAD,
        width:  rect.width  + PAD * 2,
        height: rect.height + PAD * 2,
      })

      const spaceBelow = vh - rect.bottom
      const spaceAbove = rect.top
      const placement  = spaceBelow >= TIP_H + GAP ? 'bottom'
                       : spaceAbove >= TIP_H + GAP ? 'top'
                       : 'bottom'

      const top  = placement === 'bottom' ? rect.bottom + GAP : rect.top - TIP_H - GAP
      let   left = rect.left + rect.width / 2 - TIP_W / 2
      left       = Math.max(16, Math.min(left, vw - TIP_W - 16))

      const arrowLeft = Math.max(16, Math.min(rect.left + rect.width / 2 - left, TIP_W - 24))

      setPos({ top, left, placement, arrowLeft })
      setReady(true)
    }

    calculate()
    window.addEventListener('resize', calculate)
    return () => {
      cancelled = true
      clearTimeout(timer)
      window.removeEventListener('resize', calculate)
    }
  }, [active, step, current])

  return (
    <AnimatePresence>
      {active && (
        <>
          {/* Overlay escuro */}
          <motion.div
            className="fixed inset-0 z-[9998] pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={EASE}
          >
            <svg className="absolute inset-0 w-full h-full">
              <defs>
                <mask id="tour-mask">
                  <rect width="100%" height="100%" fill="white" />
                  {highlight && (
                    <motion.rect
                      animate={{
                        x:      highlight.x,
                        y:      highlight.y,
                        width:  highlight.width,
                        height: highlight.height,
                      }}
                      transition={SPRING}
                      rx="10"
                      fill="black"
                    />
                  )}
                </mask>
              </defs>

              <rect width="100%" height="100%" fill="rgba(0,0,0,0.7)" mask="url(#tour-mask)" />

              {/* Borda brilhante animada */}
              {highlight && (
                <motion.rect
                  animate={{
                    x:      highlight.x,
                    y:      highlight.y,
                    width:  highlight.width,
                    height: highlight.height,
                  }}
                  transition={SPRING}
                  rx="10"
                  fill="none"
                  stroke="rgba(124,110,247,0.8)"
                  strokeWidth="1.5"
                />
              )}
            </svg>
          </motion.div>

          {/* Click fora fecha */}
          <div className="fixed inset-0 z-[9998]" onClick={onFinish} />

          {/* Tooltip */}
          <AnimatePresence mode="wait">
            {pos && ready && (
              <motion.div
                ref={tooltipRef}
                key={`tooltip-pos-${current}`}
                initial={{ opacity: 0, scale: 0.92, y: pos.placement === 'bottom' ? -10 : 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: pos.placement === 'bottom' ? -6 : 6 }}
                transition={{ ...SPRING, opacity: { duration: 0.18 } }}
                className="fixed z-[9999] pointer-events-auto"
                style={{
                  top:   pos.top,
                  left:  pos.left,
                  width: Math.min(300, window.innerWidth - 32),
                }}
                onClick={e => e.stopPropagation()}
              >
                {/* Setinha cima */}
                {pos.placement === 'bottom' && (
                  <div
                    className="absolute -top-[9px] overflow-hidden"
                    style={{ left: pos.arrowLeft - 8, width: 18, height: 10 }}
                  >
                    <div style={{
                      width: 12, height: 12, margin: '4px auto 0',
                      background: '#13131f',
                      border: '1px solid rgba(124,110,247,0.3)',
                      transform: 'rotate(45deg)',
                    }} />
                  </div>
                )}

                <div style={{
                  background: '#13131f',
                  border: '1px solid rgba(124,110,247,0.2)',
                  borderRadius: 16,
                  padding: 16,
                  boxShadow: '0 12px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(124,110,247,0.08)',
                }}>
                  {/* Dots + contador + fechar */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {Array.from({ length: total }).map((_, i) => (
                          <motion.div
                            key={i}
                            animate={{
                              width:      i === current ? 16 : 5,
                              background: i <= current ? '#7c6ef7' : 'rgba(255,255,255,0.1)',
                            }}
                            transition={{ duration: 0.25 }}
                            style={{ height: 5, borderRadius: 999 }}
                          />
                        ))}
                      </div>
                      <span style={{ fontSize: 11, color: '#4a4a6a' }}>{current + 1}/{total}</span>
                    </div>
                    <button
                      onClick={onFinish}
                      style={{
                        width: 24, height: 24, borderRadius: 8, border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(255,255,255,0.05)', color: '#4a4a6a', transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(248,113,113,0.12)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                    >
                      <X size={12} />
                    </button>
                  </div>

                  {/* Conteúdo animado entre steps */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`content-${current}`}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -12 }}
                      transition={EASE}
                    >
                      <h3 style={{
                        fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14,
                        color: '#e8eaf0', marginBottom: 6,
                      }}>
                        {step.title}
                      </h3>
                      <p style={{ fontSize: 12, color: '#5a5d75', lineHeight: 1.6, marginBottom: 14 }}>
                        {step.description}
                      </p>
                    </motion.div>
                  </AnimatePresence>

                  {/* Botões */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      onClick={onFinish}
                      style={{
                        fontSize: 12, color: '#4a4a6a', background: 'transparent',
                        border: 'none', cursor: 'pointer', padding: '6px 8px', borderRadius: 8,
                        transition: 'color 0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#7c6ef7')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#4a4a6a')}
                    >
                      Pular tudo
                    </button>
                    <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
                      {!isFirst && (
                        <motion.button
                          whileTap={{ scale: 0.92 }}
                          onClick={onPrev}
                          style={{
                            width: 28, height: 28, borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)',
                            background: 'rgba(255,255,255,0.05)', color: '#6b6b8a',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', transition: 'all 0.15s',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                        >
                          <ChevronLeft size={14} />
                        </motion.button>
                      )}
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onNext}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          padding: '0 14px', height: 28, borderRadius: 10, border: 'none',
                          background: 'linear-gradient(135deg, #7c6ef7, #9d6ef7)',
                          color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                          boxShadow: '0 0 16px rgba(124,110,247,0.35)',
                        }}
                      >
                        {isLast ? <><Check size={12} /> Entendi</> : <>Próximo <ChevronRight size={12} /></>}
                      </motion.button>
                    </div>
                  </div>
                </div>

                {/* Setinha baixo */}
                {pos.placement === 'top' && (
                  <div
                    className="absolute -bottom-[9px] overflow-hidden"
                    style={{ left: pos.arrowLeft - 8, width: 18, height: 10 }}
                  >
                    <div style={{
                      width: 12, height: 12, margin: '-6px auto 0',
                      background: '#13131f',
                      border: '1px solid rgba(124,110,247,0.3)',
                      transform: 'rotate(45deg)',
                    }} />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  )
}
