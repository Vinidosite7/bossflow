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
const PAD = 10

export function TourOverlay({ active, step, current, total, onNext, onPrev, onFinish }: TourOverlayProps) {
  const [highlight, setHighlight] = useState({ top: 0, left: 0, width: 0, height: 0 })
  const [tooltip,   setTooltip]   = useState({ top: 0, left: 0 })
  const [ready,     setReady]     = useState(false)
  const rafRef = useRef<number | undefined>(undefined)

  const calcPositions = useCallback(() => {
    if (!active || !step) return
    const el = document.querySelector(step.target) as HTMLElement
    if (!el) return

    const rect = el.getBoundingClientRect()
    const vw = window.innerWidth; const vh = window.innerHeight

    setHighlight({ top: rect.top - PAD, left: rect.left - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2 })

    const position = step.position ?? 'bottom'
    const tH = 200
    let tTop = 0; let tLeft = rect.left + rect.width / 2 - TOOLTIP_W / 2

    if (position === 'bottom') {
      tTop = rect.bottom + 14
      if (tTop + tH > vh - 16) tTop = rect.top - tH - 14
    } else if (position === 'top') {
      tTop = rect.top - tH - 14
      if (tTop < 16) tTop = rect.bottom + 14
    } else if (position === 'right') {
      tTop = rect.top + rect.height / 2 - tH / 2; tLeft = rect.right + 14
    } else if (position === 'left') {
      tTop = rect.top + rect.height / 2 - tH / 2; tLeft = rect.left - TOOLTIP_W - 14
    }

    tLeft = Math.max(16, Math.min(tLeft, vw - TOOLTIP_W - 16))
    tTop  = Math.max(16, Math.min(tTop,  vh - tH - 16))
    setTooltip({ top: tTop, left: tLeft })
    setReady(true)
  }, [active, step])

  useEffect(() => {
    if (!active || !step) { setReady(false); return }
    setReady(false)
    const el = document.querySelector(step.target) as HTMLElement
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })

    let lastY = window.scrollY; let stableCount = 0; let settled = false
    const checkScrollEnd = () => {
      const y = window.scrollY
      if (Math.abs(y - lastY) < 1) {
        stableCount++
        if (stableCount >= 4) { settled = true; calcPositions(); return }
      } else { stableCount = 0 }
      lastY = y
      if (!settled) rafRef.current = requestAnimationFrame(checkScrollEnd)
    }
    const t = setTimeout(() => { rafRef.current = requestAnimationFrame(checkScrollEnd) }, 60)
    return () => { clearTimeout(t); if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [active, step, current, calcPositions])

  useEffect(() => {
    if (!active) return
    const h = () => calcPositions()
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [active, calcPositions])

  useEffect(() => {
    if (!active) return
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') onNext()
      if (e.key === 'ArrowLeft') onPrev()
      if (e.key === 'Escape') onFinish()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [active, onNext, onPrev, onFinish])

  return (
    <AnimatePresence>
      {active && step && (
        <>
          {/* Overlay */}
          <motion.div className="fixed inset-0 z-[9997] pointer-events-none"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ background: 'rgba(0,0,0,0.78)' }}
          />

          {/* Highlight */}
          <motion.div
            className="fixed z-[9998] pointer-events-none"
            animate={{ top: highlight.top, left: highlight.left, width: highlight.width, height: highlight.height, opacity: ready ? 1 : 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
            style={{
              borderRadius: 14,
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.78)',
              border: '1.5px solid rgba(124,110,247,0.85)',
              outline: '5px solid rgba(124,110,247,0.1)',
            }}
          />

          {/* Tooltip */}
          <motion.div
            className="fixed z-[10000]"
            style={{ width: TOOLTIP_W }}
            animate={{ top: tooltip.top, left: tooltip.left, opacity: ready ? 1 : 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
          >
            <div style={{
              background: 'rgba(8,8,14,0.97)',
              border: '1px solid rgba(124,110,247,0.22)',
              borderRadius: 16, padding: 18,
              backdropFilter: 'blur(20px)',
              boxShadow: '0 16px 60px rgba(0,0,0,0.75), 0 0 0 1px rgba(124,110,247,0.07)',
            }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(124,110,247,0.12)', border: '1px solid rgba(124,110,247,0.2)' }}>
                    <Sparkles size={11} style={{ color: '#9d8fff' }} />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest"
                    style={{ color: '#7c6ef7', fontFamily: 'Syne, sans-serif' }}>
                    {current + 1} de {total}
                  </span>
                </div>
                <button onClick={onFinish}
                  style={{
                    width: 24, height: 24, borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)',
                    background: 'rgba(255,255,255,0.04)', color: '#4a4a6a',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.1)'; e.currentTarget.style.color = '#f87171' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#4a4a6a' }}
                >
                  <X size={11} />
                </button>
              </div>

              {/* Progress */}
              <div className="h-0.5 rounded-full mb-4" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <motion.div className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, #7c6ef7, #a06ef7)' }}
                  animate={{ width: `${((current + 1) / total) * 100}%` }}
                  transition={{ duration: 0.35 }}
                />
              </div>

              <AnimatePresence mode="wait">
                <motion.div key={current}
                  initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.18 }}>
                  <p className="font-bold mb-1.5 text-sm"
                    style={{ color: '#dcdcf0', fontFamily: 'Syne, sans-serif' }}>
                    {step.title}
                  </p>
                  <p className="text-xs leading-relaxed mb-4"
                    style={{ color: '#5a5d75', fontFamily: 'DM Sans, sans-serif', lineHeight: 1.65 }}>
                    {step.description}
                  </p>
                </motion.div>
              </AnimatePresence>

              <div className="flex items-center justify-between">
                <button onClick={onPrev} disabled={current === 0}
                  className="flex items-center gap-1 text-xs disabled:opacity-25 transition-colors"
                  style={{ color: '#6b6b8a', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}
                  onMouseEnter={e => !e.currentTarget.disabled && (e.currentTarget.style.color = '#9090b0')}
                  onMouseLeave={e => e.currentTarget.style.color = '#6b6b8a'}
                >
                  <ChevronLeft size={13} /> Anterior
                </button>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }} onClick={onNext}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold"
                  style={{
                    background: 'linear-gradient(135deg, #7c6ef7, #9d6ef7)',
                    color: 'white', border: 'none', cursor: 'pointer',
                    fontFamily: 'Syne, sans-serif',
                    boxShadow: '0 0 20px rgba(124,110,247,0.35)',
                  }}>
                  {current === total - 1 ? 'Concluir ✓' : <>Próximo <ChevronRight size={11} /></>}
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Click fora */}
          <div className="fixed inset-0 z-[9996]" onClick={onFinish} style={{ cursor: 'pointer' }} />
        </>
      )}
    </AnimatePresence>
  )
}
