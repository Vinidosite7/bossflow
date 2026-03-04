import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

export type BusinessRole = 'owner' | 'admin' | 'member' | 'viewer' | null

const PERMISSIONS = {
  owner:  ['dashboard', 'financeiro', 'despesas', 'metas', 'metas:edit', 'vendas', 'clientes', 'tarefas', 'agenda', 'produtos', 'configuracoes', 'empresas', 'invite'],
  admin:  ['dashboard', 'financeiro', 'despesas', 'metas', 'metas:edit', 'vendas', 'clientes', 'tarefas', 'agenda', 'produtos', 'configuracoes', 'invite'],
  member: ['dashboard', 'financeiro', 'despesas', 'metas', 'vendas', 'clientes', 'tarefas', 'agenda'],
  viewer: ['dashboard', 'financeiro', 'despesas', 'metas', 'vendas', 'clientes', 'tarefas', 'agenda'],
}

export function useBusinessRole(businessId?: string | null) {
  const [role, setRole]       = useState<BusinessRole>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!businessId) { setLoading(false); return }

    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      // Verifica se é owner
      const { data: biz } = await supabase
        .from('businesses')
        .select('owner_id')
        .eq('id', businessId)
        .maybeSingle()

      if (biz?.owner_id === user.id) {
        setRole('owner')
        setLoading(false)
        return
      }

      // Verifica se é membro
      const { data: member } = await supabase
        .from('business_members')
        .select('role')
        .eq('business_id', businessId)
        .eq('user_id', user.id)
        .eq('status', 'accepted')
        .maybeSingle()

      setRole((member?.role as BusinessRole) ?? null)
      setLoading(false)
    }

    load()
  }, [businessId])

  function can(action: string): boolean {
    if (!role) return false
    return PERMISSIONS[role]?.includes(action) ?? false
  }

  function canEdit(): boolean {
    return role === 'owner' || role === 'admin' || role === 'member'
  }

  function canInvite(): boolean {
    return role === 'owner' || role === 'admin'
  }

  function isOwnerOrAdmin(): boolean {
    return role === 'owner' || role === 'admin'
  }

  return { role, loading, can, canEdit, canInvite, isOwnerOrAdmin }
}
