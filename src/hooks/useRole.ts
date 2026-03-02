import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

export type Role = 'owner' | 'admin' | 'member' | 'viewer' | null

export function useRole(businessId: string | null) {
  const [role, setRole] = useState<Role>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!businessId) { setLoading(false); return }

    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data } = await supabase
        .from('business_members')
        .select('role')
        .eq('business_id', businessId)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      setRole((data?.role as Role) ?? null)
      setLoading(false)
    }

    load()
  }, [businessId])

  const isOwner = role === 'owner'
  const isAdmin = role === 'owner' || role === 'admin'
  const canEdit = role === 'owner' || role === 'admin' || role === 'member'
  const canView = role !== null

  return { role, loading, isOwner, isAdmin, canEdit, canView }
}