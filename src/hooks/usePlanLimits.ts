import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

const LIMITS = {
  free:    { businesses: 1, members: 2 },
  starter: { businesses: 3, members: 5 },
  pro:     { businesses: Infinity, members: Infinity },
  scale:   { businesses: Infinity, members: Infinity },
}

export function usePlanLimits() {
  const [plan, setPlan] = useState<string>('free')
  const [businessCount, setBusinessCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      // Busca plano
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('plan')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()
      const currentPlan = sub?.plan ?? 'free'
      setPlan(currentPlan)

      // Conta empresas
      const { count } = await supabase
        .from('businesses')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', user.id)
      setBusinessCount(count ?? 0)

      setLoading(false)
    }
    load()
  }, [])

  const limits = LIMITS[plan as keyof typeof LIMITS] ?? LIMITS.free

  const canCreateBusiness = businessCount < limits.businesses
  const canInviteMember = (memberCount: number) => memberCount < limits.members

  const businessLimitMsg = `Seu plano ${plan} permite até ${limits.businesses} empresa${limits.businesses > 1 ? 's' : ''}. Faça upgrade para criar mais.`
  const memberLimitMsg = `Seu plano ${plan} permite até ${limits.members} membros por empresa. Faça upgrade para convidar mais.`

  return {
    plan, loading,
    limits,
    canCreateBusiness,
    canInviteMember,
    businessLimitMsg,
    memberLimitMsg,
  }
}