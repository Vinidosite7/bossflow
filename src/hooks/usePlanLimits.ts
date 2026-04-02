import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { getLimits, getFeatures, PlanKey } from '@/lib/plans'

const PLAN_CACHE_KEY = 'bf_plan_cache'

function getCachedPlan(): string {
  if (typeof window === 'undefined') return 'free'
  try { return localStorage.getItem(PLAN_CACHE_KEY) ?? 'free' } catch { return 'free' }
}

function setCachedPlan(plan: string) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(PLAN_CACHE_KEY, plan) } catch {}
}

export function usePlanLimits() {
  // Inicia com o cache — sem loading visual na maioria dos casos
  const [plan, setPlan]               = useState<string>(getCachedPlan)
  const [businessCount, setBusinessCount] = useState(0)
  const [loading, setLoading]         = useState(true)

  const fetchCounts = useCallback(async (userId: string) => {
    const supabase = createClient()
    const { count } = await supabase
      .from('businesses')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', userId)
    setBusinessCount(count ?? 0)
  }, [])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      // Já temos o cache — desbloqueia o UI imediatamente
      setLoading(false)

      // Busca o plano real em background
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('plan')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle()

      const currentPlan = sub?.plan ?? 'free'
      setPlan(currentPlan)
      setCachedPlan(currentPlan)
      fetchCounts(user.id)
    }
    load()
  }, [fetchCounts])

  const limits   = getLimits(plan)
  const features = getFeatures(plan)

  const canCreateBusiness = businessCount < limits.businesses
  const canInviteMember   = (memberCount: number) =>
    limits.members > 0 && memberCount < limits.members

  const businessLimitMsg = `Seu plano ${plan} permite até ${
    limits.businesses === Infinity ? 'ilimitadas' : limits.businesses
  } empresa${limits.businesses !== 1 ? 's' : ''}. Faça upgrade para criar mais.`

  const memberLimitMsg = limits.members === 0
    ? `Compartilhamento de empresa não está disponível no plano ${plan}.`
    : `Seu plano ${plan} permite até ${limits.members} membros por empresa. Faça upgrade para convidar mais.`

  const canCreateAccount  = (currentCount: number) => currentCount < limits.accounts
  const isRevenueBlocked  = (monthlyRevenue: number) =>
    limits.monthlyRevenue !== Infinity && monthlyRevenue > limits.monthlyRevenue
  const hasFeature        = (feature: keyof ReturnType<typeof getFeatures>) =>
    features[feature] ?? false

  const refreshCounts = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) await fetchCounts(user.id)
  }

  return {
    plan, loading, limits,
    canCreateBusiness, canInviteMember,
    businessLimitMsg, memberLimitMsg, businessCount,
    features, canCreateAccount, isRevenueBlocked, hasFeature, refreshCounts,
  }
}
