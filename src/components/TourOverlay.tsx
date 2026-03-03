'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
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

const TOOLTIP_W = 300
const PADDING = 8

export function TourOverlay({ active, step, current, total, onNext, onPrev, onFinish }: TourOverlayProps) {
  const [highlight, setHighlight] = useState({ top: 0, left: 0, width: 0, height: 0 })
  const [tooltip, setTooltip] = useState({ top: 0, left: 0 })
  const [ready, setReady] = useState(false)
  const rafRef = useRef<number>()

  const calcPositions = useCallback(() => {
    if (!active || !step) return

    const el = document.querySelector(step.target) as HTMLElement
    if (!el) return

    const rect = el.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight

    // Highlight — coordenadas do viewport (fixed)
    setHighlight({
      top: rect.top - PADDING,
      left: rect.left - PADDING,
      width: rect.width + PADDING * 2,
      height: rect.height + PADDING * 2,
    })

    // Tooltip
    const position = step.position ?? 'bottom'
    const tH = 190
    let tTop = 0
    let tLeft = rect.left + rect.width / 2 - TOOLTIP_W / 2

    if (position === 'bottom') {
      tTop = rect.bottom + 16
      if (tTop + tH > vh - 16) tTop = rect.top - tH - 16
    } else if (position === 'top') {
      tTop = rect.top - tH - 16
      if (tTop < 16) tTop = rect.bottom + 16
    } else if (position === 'right') {
      tTop = rect.top + rect.height / 2 - tH / 2
      tLeft = rect.right + 16
    } else if (position === 'left') {
      tTop = rect.top + rect.height / 2 - tH / 2
      tLeft = rect.left - TOOLTIP_W - 16
    }

    tLeft = Math.max(16, Math.min(tLeft, vw - TOOLTIP_W - 16))
    tTop = Math.max(16, Math.min(tTop, vh - tH - 16))

    setTooltip({ top: tTop, left: tLeft })
    setReady(true)
  }, [active, step])

  useEffect(() => {
    if (!active || !step) { setReady(false); return }

    setReady(false)

    const el = document.querySelector(step.target) as HTMLElement
    if (!el) return

    // Scroll pro elemento
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })

    // Aguarda scroll estabilizar antes de calcular posição
    let lastY = window.scrollY
    let stableCount = 0
    let settled = false

    const checkScrollEnd = () => {
      const currentY = window.scrollY
      if (Math.abs(currentY - lastY) < 1) {
        stableCount++
        if (stableCount >= 4) {
          settled = true
          calcPositions()
          return
        }
      } else {
        stableCount = 0
      }
      lastY = currentY
      if (!settled) rafRef.current = requestAnimationFrame(checkScrollEnd)
    }

    const t = setTimeout(() => {
      rafRef.current = requestAnimationFrame(checkScrollEnd)
    }, 60)

    return () => {
      clearTimeout(t)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [active, step, current, calcPositions])

  useEffect(() => {
    if (!active) return
    const handler = () => calcPositions()
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [active, calcPositions])

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
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 z-[9997] pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ background: 'rgba(0,0,0,0.75)' }}
          />

          {/* Highlight com spring suave */}
          <motion.div
            className="fixed z-[9998] pointer-events-none"
            animate={{
              top: highlight.top,
              left: highlight.left,
              width: highlight.width,
              height: highlight.height,
              opacity: ready ? 1 : 0,
            }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
            style={{
              borderRadius: 14,
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.75)',
              border: '2px solid rgba(124,110,247,0.9)',
              outline: '4px solid rgba(124,110,247,0.12)',
            }}
          />

          {/* Tooltip com spring suave */}
          <motion.div
            className="fixed z-[10000]"
            style={{ width: TOOLTIP_W }}
            animate={{
              top: tooltip.top,
              left: tooltip.left,
              opacity: ready ? 1 : 0,
            }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
          >
            <div className="rounded-2xl p-5"
              style={{
                background: '#0d0d14',
                border: '1px solid rgba(124,110,247,0.35)',
                boxShadow: '0 8px 40px rgba(0,0,0,0.7)',
              }}>

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
                  className="w-6 h-6 rounded-lg flex items-center justify-center"
                  style={{ color: '#4a4a6a' }}>
                  <X size={12} />
                </button>
              </div>

              {/* Progress */}
              <div className="h-0.5 rounded-full mb-4" style={{ background: '#1e1e2e' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, #7c6ef7, #9d8fff)' }}
                  animate={{ width: `${((current + 1) / total) * 100}%` }}
                  transition={{ duration: 0.35 }}
                />
              </div>

              {/* Conteúdo animado por step */}
              <AnimatePresence mode="wait">
                <motion.div key={current}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.18 }}>
                  <p className="font-bold mb-1.5 text-sm" style={{ color: '#e8e8f0' }}>{step.title}</p>
                  <p className="text-xs leading-relaxed mb-4" style={{ color: '#6b6b8a' }}>{step.description}</p>
                </motion.div>
              </AnimatePresence>

              {/* Botões */}
              <div className="flex items-center justify-between">
                <button onClick={onPrev} disabled={current === 0}
                  className="flex items-center gap-1 text-xs disabled:opacity-30"
                  style={{ color: '#6b6b8a' }}>
                  <ChevronLeft size={14} /> Anterior
                </button>
                <button onClick={onNext}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold"
                  style={{ background: 'linear-gradient(135deg, #7c6ef7, #9d8fff)', color: 'white' }}>
                  {current === total - 1 ? 'Concluir ✓' : <>Próximo <ChevronRight size={12} /></>}
                </button>
              </div>
            </div>
          </motion.div>

          {/* Click fora fecha */}
          <div className="fixed inset-0 z-[9996]" onClick={onFinish} style={{ cursor: 'pointer' }} />
        </>
      )}
    </AnimatePresence>
  )
}
