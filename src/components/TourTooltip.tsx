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

export function TourTooltip({ active, step, current, total, onNext, onPrev, onFinish }: Props) {
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<Pos | null>(null)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)

  const isLast  = current === total - 1
  const isFirst = current === 0

  useEffect(() => {
    if (!active || !step) return

    let attempts = 0
    let cancelled = false
    let rafId: ReturnType<typeof setTimeout>

    async function calculate() {
      if (cancelled) return

      const el = document.querySelector(step.target) as HTMLElement | null

      if (!el) {
        if (attempts < 10) {
          attempts++
          rafId = setTimeout(calculate, 100)
        } else {
          setTargetRect(null)
          const vw = window.innerWidth
          const vh = window.innerHeight
          setPos({
            top: vh / 2 - 100,
            left: Math.max(16, vw / 2 - 150),
            placement: 'bottom',
            arrowLeft: 150,
          })
        }
        return
      }

      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })

      // Aguarda o scroll terminar antes de medir a posição
      await new Promise(resolve => setTimeout(resolve, 350))
      if (cancelled) return

      const rect  = el.getBoundingClientRect()
      const vw    = window.innerWidth
      const vh    = window.innerHeight
      const TIP_W = Math.min(300, vw - 32)
      const TIP_H = 160
      const GAP   = 12

      setTargetRect(rect)

      const spaceBelow = vh - rect.bottom
      const spaceAbove = rect.top
      const placement  = spaceBelow >= TIP_H + GAP ? 'bottom'
                        : spaceAbove >= TIP_H + GAP ? 'top'
                        : 'bottom'

      const top = placement === 'bottom'
        ? rect.bottom + GAP
        : rect.top - TIP_H - GAP

      let left = rect.left + rect.width / 2 - TIP_W / 2
      left = Math.max(16, Math.min(left, vw - TIP_W - 16))

      const arrowLeft = Math.max(16, Math.min(
        rect.left + rect.width / 2 - left,
        TIP_W - 24
      ))

      setPos({ top, left, placement, arrowLeft })
    }

    calculate()
    window.addEventListener('resize', calculate)
    return () => {
      cancelled = true
      window.removeEventListener('resize', calculate)
      clearTimeout(rafId)
    }
  }, [active, step, current])

  return (
    <AnimatePresence>
      {active && (
        <>
          {/* Overlay escuro com buraco no elemento */}
          <div className="fixed inset-0 z-[9998] pointer-events-none">
            {targetRect && (
              <svg className="absolute inset-0 w-full h-full">
                <defs>
                  <mask id="tour-mask">
                    <rect width="100%" height="100%" fill="white" />
                    <rect
                      x={targetRect.left - 6}
                      y={targetRect.top - 6}
                      width={targetRect.width + 12}
                      height={targetRect.height + 12}
                      rx="12"
                      fill="black"
                    />
                  </mask>
                </defs>
                <rect
                  width="100%" height="100%"
                  fill="rgba(0,0,0,0.65)"
                  mask="url(#tour-mask)"
                />
                {/* Borda brilhante no elemento destacado */}
                <rect
                  x={targetRect.left - 6}
                  y={targetRect.top - 6}
                  width={targetRect.width + 12}
                  height={targetRect.height + 12}
                  rx="12"
                  fill="none"
                  stroke="rgba(124,110,247,0.7)"
                  strokeWidth="2"
                />
              </svg>
            )}
          </div>

          {/* Clique no overlay fecha */}
          <div className="fixed inset-0 z-[9998]" onClick={onFinish} />

          {/* Tooltip */}
          {pos && (
            <motion.div
              ref={tooltipRef}
              key={`tooltip-${current}`}
              initial={{ opacity: 0, y: pos.placement === 'bottom' ? -8 : 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="fixed z-[9999] pointer-events-auto"
              style={{
                top: pos.top,
                left: pos.left,
                width: Math.min(300, window.innerWidth - 32),
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Setinha cima */}
              {pos.placement === 'bottom' && (
                <div className="absolute -top-2 w-4 h-2 overflow-hidden" style={{ left: pos.arrowLeft - 8 }}>
                  <div
                    className="w-3 h-3 rotate-45 mx-auto"
                    style={{ background: '#1a1a2e', border: '1px solid rgba(124,110,247,0.3)', marginTop: 4 }}
                  />
                </div>
              )}

              <div
                className="rounded-2xl p-4 shadow-2xl"
                style={{
                  background: '#111118',
                  border: '1px solid rgba(124,110,247,0.25)',
                  boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(124,110,247,0.1)',
                }}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {Array.from({ length: total }).map((_, i) => (
                        <div
                          key={i}
                          className="rounded-full transition-all duration-300"
                          style={{
                            width: i === current ? 16 : 5,
                            height: 5,
                            background: i <= current ? '#7c6ef7' : 'rgba(255,255,255,0.1)',
                          }}
                        />
                      ))}
                    </div>
                    <span className="text-xs" style={{ color: '#4a4a6a' }}>{current + 1}/{total}</span>
                  </div>
                  <button
                    onClick={onFinish}
                    className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all"
                    style={{ background: 'rgba(255,255,255,0.05)', color: '#4a4a6a' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(248,113,113,0.1)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                  >
                    <X size={12} />
                  </button>
                </div>

                {/* Conteúdo */}
                <h3
                  className="font-bold text-sm mb-1"
                  style={{ fontFamily: 'Syne, sans-serif', color: '#e8eaf0' }}
                >
                  {step.title}
                </h3>
                <p className="text-xs leading-relaxed mb-4" style={{ color: '#5a5d75' }}>
                  {step.description}
                </p>

                {/* Botões */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={onFinish}
                    className="text-xs px-3 py-1.5 rounded-lg transition-all"
                    style={{ color: '#4a4a6a', background: 'transparent' }}
                  >
                    Pular tudo
                  </button>
                  <div className="flex gap-2 ml-auto">
                    {!isFirst && (
                      <button
                        onClick={onPrev}
                        className="w-7 h-7 rounded-xl flex items-center justify-center transition-all"
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          color: '#6b6b8a',
                          border: '1px solid rgba(255,255,255,0.08)',
                        }}
                      >
                        <ChevronLeft size={14} />
                      </button>
                    )}
                    <button
                      onClick={onNext}
                      className="flex items-center gap-1.5 px-3 h-7 rounded-xl text-xs font-bold transition-all"
                      style={{
                        background: 'linear-gradient(135deg, #7c6ef7, #9d6ef7)',
                        color: 'white',
                        boxShadow: '0 0 16px rgba(124,110,247,0.3)',
                      }}
                    >
                      {isLast ? <><Check size={12} /> Entendi</> : <>Próximo <ChevronRight size={12} /></>}
                    </button>
                  </div>
                </div>
              </div>

              {/* Setinha baixo */}
              {pos.placement === 'top' && (
                <div className="absolute -bottom-2 w-4 h-2 overflow-hidden" style={{ left: pos.arrowLeft - 8 }}>
                  <div
                    className="w-3 h-3 rotate-45 mx-auto"
                    style={{ background: '#1a1a2e', border: '1px solid rgba(124,110,247,0.3)', marginTop: -6 }}
                  />
                </div>
              )}
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  )
}
