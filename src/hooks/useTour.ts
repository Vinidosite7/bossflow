import { useState, useEffect, useCallback } from 'react'

export interface TourStep {
  target: string
  title: string
  description: string
  position?: 'top' | 'bottom' | 'left' | 'right'
}

export function useTour(tourId: string, steps: TourStep[]) {
  const storageKey = `bossflow_tour_${tourId}`
  const [active, setActive]   = useState(false)
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const seen = localStorage.getItem(storageKey)
    if (!seen) {
      const t = setTimeout(() => setActive(true), 600)
      return () => clearTimeout(t)
    }
  }, [storageKey])

  // ✅ finish agora é useCallback estável
  const finish = useCallback(() => {
    localStorage.setItem(storageKey, 'done')
    setActive(false)
    setCurrent(0)
  }, [storageKey])

  // ✅ finish agora está nas deps de next
  const next = useCallback(() => {
    if (current < steps.length - 1) {
      setCurrent(c => c + 1)
    } else {
      finish()
    }
  }, [current, steps.length, finish])

  const prev = useCallback(() => {
    setCurrent(c => Math.max(0, c - 1))
  }, [])

  const restart = useCallback(() => {
    setCurrent(0)
    setActive(true)
  }, [])

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