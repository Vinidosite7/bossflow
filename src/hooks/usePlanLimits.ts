import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { getLimits, getFeatures, PlanKey } from '@/lib/plans'

export function usePlanLimits() {
  const [plan, setPlan] = useState<string>('free')
  const [businessCount, setBusinessCount] = useState(0)
  const [loading, setLoading] = useState(true)

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

      // Busca plano ativo — mesma query que antes, não muda nada no fluxo Cakto
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('plan')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle()

      const currentPlan = sub?.plan ?? 'free'
      setPlan(currentPlan)
      await fetchCounts(user.id)
      setLoading(false)
    }
    load()
  }, [fetchCounts])

  const limits   = getLimits(plan)
  const features = getFeatures(plan)

  // ── Compatibilidade total com uso atual (empresas/page, etc.) ──
  const canCreateBusiness = businessCount < limits.businesses

  // "members" no hook antigo = contas/caixas na nomenclatura nova
  // Mantendo o nome antigo pra não quebrar empresas/page.tsx
  const canInviteMember = (memberCount: number) =>
    limits.members > 0 && memberCount < limits.members

  const businessLimitMsg = `Seu plano ${plan} permite até ${
    limits.businesses === Infinity ? 'ilimitadas' : limits.businesses
  } empresa${limits.businesses !== 1 ? 's' : ''}. Faça upgrade para criar mais.`

  const memberLimitMsg = limits.members === 0
    ? `Compartilhamento de empresa não está disponível no plano ${plan}.`
    : `Seu plano ${plan} permite até ${limits.members} membros por empresa. Faça upgrade para convidar mais.`

  // ── Verificações novas ─────────────────────────────────────────
  const canCreateAccount = (currentCount: number) => currentCount < limits.accounts

  const isRevenueBlocked = (monthlyRevenue: number) =>
    limits.monthlyRevenue !== Infinity && monthlyRevenue > limits.monthlyRevenue

  const hasFeature = (feature: keyof ReturnType<typeof getFeatures>) =>
    features[feature] ?? false

  const refreshCounts = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) await fetchCounts(user.id)
  }

  return {
    // Originais — não muda nada pra quem já usa o hook
    plan,
    loading,
    limits,
    canCreateBusiness,
    canInviteMember,
    businessLimitMsg,
    memberLimitMsg,
    businessCount,
    // Novos
    features,
    canCreateAccount,
    isRevenueBlocked,
    hasFeature,
    refreshCounts,
  }
}
