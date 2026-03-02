import { useState, useEffect, useCallback } from 'react'

export interface TourStep {
  target: string        // seletor CSS do elemento alvo
  title: string
  description: string
  position?: 'top' | 'bottom' | 'left' | 'right' // preferência, auto-ajusta no mobile
}

export function useTour(tourId: string, steps: TourStep[]) {
  const storageKey = `bossflow_tour_${tourId}`
  const [active, setActive]   = useState(false)
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    // Mostra automaticamente se nunca viu esse tour
    const seen = localStorage.getItem(storageKey)
    if (!seen) {
      // Pequeno delay pra página terminar de montar
      const t = setTimeout(() => setActive(true), 600)
      return () => clearTimeout(t)
    }
  }, [storageKey])

  const next = useCallback(() => {
    if (current < steps.length - 1) {
      setCurrent(c => c + 1)
    } else {
      finish()
    }
  }, [current, steps.length])

  const prev = useCallback(() => {
    setCurrent(c => Math.max(0, c - 1))
  }, [])

  function finish() {
    localStorage.setItem(storageKey, 'done')
    setActive(false)
    setCurrent(0)
  }

  function restart() {
    setCurrent(0)
    setActive(true)
  }

  return {
    active,
    current,
    step: steps[current],
    total: steps.length,
    next,
    prev,
    finish,
    restart,
  }
}
