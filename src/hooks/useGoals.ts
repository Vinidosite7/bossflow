'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

export type Goal = {
  id?: string
  business_id: string
  month: number
  year: number
  target: number
  super_target: number | null
}

export type GoalWithProgress = Goal & {
  revenue: number
  pct: number
  superPct: number | null
  hit: boolean
  superHit: boolean
}

export function useGoals(businessId: string | null) {
  const supabase = createClient()
  const [goals, setGoals] = useState<GoalWithProgress[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!businessId) { setLoading(false); return }
    try {
      const currentYear = new Date().getFullYear()

      const { data: goalsData } = await supabase
        .from('goals')
        .select('*')
        .eq('business_id', businessId)
        .eq('year', currentYear)
        .order('month')

      const startOfYear = `${currentYear}-01-01`
      const endOfYear = `${currentYear}-12-31`
      const { data: txs } = await supabase
        .from('transactions')
        .select('amount, date, type')
        .eq('business_id', businessId)
        .eq('type', 'income')
        .gte('date', startOfYear)
        .lte('date', endOfYear)

      // parseInt evita bug de timezone com new Date()
      const revenueByMonth: Record<number, number> = {}
      ;(txs || []).forEach(t => {
        const dateStr = typeof t.date === 'string' ? t.date : String(t.date)
        const m = parseInt(dateStr.split('-')[1], 10)
        revenueByMonth[m] = (revenueByMonth[m] || 0) + Number(t.amount)
      })

      const result: GoalWithProgress[] = Array.from({ length: 12 }, (_, i) => {
        const month = i + 1
        const goal = goalsData?.find(g => g.month === month)
        const revenue = revenueByMonth[month] || 0
        const target = Number(goal?.target) || 0
        const super_target = goal?.super_target ? Number(goal.super_target) : null
        const pct = target > 0 ? Math.min((revenue / target) * 100, 999) : 0
        const superPct = super_target && super_target > 0 ? Math.min((revenue / super_target) * 100, 999) : null
        return {
          id: goal?.id,
          business_id: businessId,
          month,
          year: currentYear,
          target,
          super_target,
          revenue,
          pct,
          superPct,
          hit: target > 0 && revenue >= target,
          superHit: !!super_target && revenue >= super_target,
        }
      })

      setGoals(result)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [businessId])

  useEffect(() => { load() }, [load])

  async function saveGoal(month: number, target: number, superTarget: number | null) {
    if (!businessId) return
    const year = new Date().getFullYear()
    await supabase.from('goals').upsert(
      { business_id: businessId, month, year, target, super_target: superTarget },
      { onConflict: 'business_id,month,year' }
    )
    await load()
  }

  const currentMonth = new Date().getMonth() + 1
  const currentGoal = goals.find(g => g.month === currentMonth)
  const annualTarget = goals.reduce((a, g) => a + g.target, 0)
  const annualRevenue = goals.reduce((a, g) => a + g.revenue, 0)
  const annualPct = annualTarget > 0 ? Math.min((annualRevenue / annualTarget) * 100, 999) : 0
  const monthsHit = goals.filter(g => g.hit && g.month <= currentMonth).length

  let streak = 0
  for (let i = currentMonth - 2; i >= 0; i--) {
    const g = goals[i]
    if (g && g.hit) streak++
    else break
  }

  return {
    goals, loading, saveGoal, reload: load,
    currentGoal, annualTarget, annualRevenue, annualPct, monthsHit, streak,
  }
}
