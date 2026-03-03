'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { TourStep } from '@/hooks/useTour'

interface TourOverlayProps {
  active: boolean
  step: TourStep
  current: number
  total: number
  onNext: () => void
  onPrev: () => void
  onFinish: () => void
}

export function TourOverlay({ active, step, current, total, onNext, onPrev, onFinish }: TourOverlayProps) {
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0, height: 0 })
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 })
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!active || !step) return

    const el = document.querySelector(step.target) as HTMLElement
    if (!el) return

    const rect = el.getBoundingClientRect()
    const scrollY = window.scrollY
    const scrollX = window.scrollX

    const padding = 6
    setPos({
      top: rect.top + scrollY - padding,
      left: rect.left + scrollX - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
    })

    // Posição do tooltip
    const tW = 300
    const tH = 160
    const position = step.position ?? 'bottom'
    let tTop = 0, tLeft = 0

    if (position === 'bottom') {
      tTop = rect.bottom + scrollY + 16
      tLeft = rect.left + scrollX + rect.width / 2 - tW / 2
    } else if (position === 'top') {
      tTop = rect.top + scrollY - tH - 16
      tLeft = rect.left + scrollX + rect.width / 2 - tW / 2
    } else if (position === 'right') {
      tTop = rect.top + scrollY + rect.height / 2 - tH / 2
      tLeft = rect.right + scrollX + 16
    } else if (position === 'left') {
      tTop = rect.top + scrollY + rect.height / 2 - tH / 2
      tLeft = rect.left + scrollX - tW - 16
    }

    // Garante que não saia da tela
    tLeft = Math.max(16, Math.min(tLeft, window.innerWidth - tW - 16))
    tTop = Math.max(16, tTop)

    setTooltipPos({ top: tTop, left: tLeft })

    // Scroll suave pro elemento
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [active, step, current])

  // Keyboard navigation
  useEffect(() => {
    if (!active) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') onNext()
      if (e.key === 'ArrowLeft') onPrev()
      if (e.key === 'Escape') onFinish()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [active, onNext, onPrev, onFinish])

  return (
    <AnimatePresence>
      {active && step && (
        <>
          {/* Overlay escuro com buraco no elemento */}
          <motion.div
            className="fixed inset-0 z-[9998] pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              background: `radial-gradient(ellipse ${pos.width}px ${pos.height}px at ${pos.left + pos.width / 2}px ${pos.top + pos.height / 2}px, transparent 99%, rgba(0,0,0,0.75) 100%)`,
              boxShadow: `0 0 0 9999px rgba(0,0,0,0.7)`,
            }}
          />

          {/* Highlight border */}
          <motion.div
            className="fixed z-[9999] pointer-events-none rounded-xl"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              top: pos.top,
              left: pos.left,
              width: pos.width,
              height: pos.height,
              border: '2px solid rgba(124,110,247,0.8)',
              boxShadow: '0 0 20px rgba(124,110,247,0.4)',
            }}
          />

          {/* Tooltip */}
          <motion.div
            ref={tooltipRef}
            className="fixed z-[10000] w-[300px]"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2, delay: 0.05 }}
            style={{ top: tooltipPos.top, left: tooltipPos.left }}
          >
            <div className="rounded-2xl p-5"
              style={{ background: '#0d0d14', border: '1px solid rgba(124,110,247,0.3)', boxShadow: '0 8px 40px rgba(0,0,0,0.6)' }}>
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(124,110,247,0.15)' }}>
                    <Sparkles size={12} style={{ color: '#9d8fff' }} />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#7c6ef7' }}>
                    {current + 1} de {total}
                  </span>
                </div>
                <button onClick={onFinish}
                  className="w-6 h-6 rounded-lg flex items-center justify-center transition-all hover:bg-white/10"
                  style={{ color: '#4a4a6a' }}>
                  <X size={12} />
                </button>
              </div>

              {/* Progress bar */}
              <div className="h-0.5 rounded-full mb-4" style={{ background: '#1e1e2e' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, #7c6ef7, #9d8fff)' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${((current + 1) / total) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {/* Content */}
              <p className="font-bold mb-1.5 text-sm" style={{ color: '#e8e8f0' }}>{step.title}</p>
              <p className="text-xs leading-relaxed mb-4" style={{ color: '#6b6b8a' }}>{step.description}</p>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <button onClick={onPrev} disabled={current === 0}
                  className="flex items-center gap-1 text-xs transition-all disabled:opacity-30"
                  style={{ color: '#4a4a6a' }}
                  onMouseEnter={e => { if (current > 0) e.currentTarget.style.color = '#9d8fff' }}
                  onMouseLeave={e => e.currentTarget.style.color = '#4a4a6a'}>
                  <ChevronLeft size={14} /> Anterior
                </button>

                <button onClick={onNext}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                  style={{ background: 'linear-gradient(135deg, #7c6ef7, #9d8fff)', color: 'white' }}>
                  {current === total - 1 ? 'Concluir ✓' : <>Próximo <ChevronRight size={12} /></>}
                </button>
              </div>
            </div>
          </motion.div>

          {/* Click fora = fecha */}
          <div className="fixed inset-0 z-[9997] cursor-pointer" onClick={onFinish} />
        </>
      )}
    </AnimatePresence>
  )
}
