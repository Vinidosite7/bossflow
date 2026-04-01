'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { createClient } from '@/lib/supabase'

const supabase = createClient()

interface Business {
  id: string
  name: string
  logo_url?: string
  owner_id: string
  _memberRole?: string
  [key: string]: any
}

interface BusinessContextValue {
  user:        any | null
  business:    Business | null
  businessId:  string
  businesses:  Business[]
  loading:     boolean
  // permite trocar empresa ativa (ex: header switcher)
  switchBusiness: (biz: Business) => void
  // refetch manual após criar/deletar empresa
  reload: () => void
}

const BusinessContext = createContext<BusinessContextValue>({
  user: null, business: null, businessId: '', businesses: [],
  loading: true, switchBusiness: () => {}, reload: () => {},
})

export function useBusinessContext() {
  return useContext(BusinessContext)
}

export function BusinessProvider({ children, onNoUser }: { children: ReactNode; onNoUser: () => void }) {
  const [user,       setUser]       = useState<any>(null)
  const [business,   setBusiness]   = useState<Business | null>(null)
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading,    setLoading]    = useState(true)

  const load = useCallback(async () => {
    try {
      const { data: { user: u }, error } = await supabase.auth.getUser()
      if (error || !u) { onNoUser(); return }
      setUser(u)

      const savedBizId = typeof window !== 'undefined'
        ? localStorage.getItem('activeBizId') || ''
        : ''

      // ── Busca owned + memberships em paralelo ─────────────────────
      const [{ data: owned }, { data: memberships }] = await Promise.all([
        supabase.from('businesses').select('*').eq('owner_id', u.id),
        supabase.from('business_members')
          .select('business_id, role')
          .eq('user_id', u.id)
          .in('status', ['accepted', 'active']),
      ])

      // Empresas membro (sem duplicar owned)
      const memberBizIds = (memberships || [])
        .map((m: any) => m.business_id)
        .filter((id: string) => !(owned || []).find((o: any) => o.id === id))

      let memberBizzes: Business[] = []
      if (memberBizIds.length > 0) {
        const { data: bizData } = await supabase
          .from('businesses').select('*').in('id', memberBizIds)
        memberBizzes = (bizData || []).map((b: any) => ({
          ...b,
          _memberRole: memberships?.find((m: any) => m.business_id === b.id)?.role,
        }))
      }

      const bizList: Business[] = [...(owned || []), ...memberBizzes]
      setBusinesses(bizList)

      if (!bizList.length) { setLoading(false); return }

      const biz = bizList.find(b => b.id === savedBizId) || bizList[0]
      setBusiness(biz)
      localStorage.setItem('activeBizId', biz.id)
    } catch (err) {
      console.error('[BusinessContext]', err)
    } finally {
      setLoading(false)
    }
  }, [onNoUser])

  useEffect(() => { load() }, [load])

  function switchBusiness(biz: Business) {
    setBusiness(biz)
    localStorage.setItem('activeBizId', biz.id)
  }

  return (
    <BusinessContext.Provider value={{
      user,
      business,
      businessId: business?.id ?? '',
      businesses,
      loading,
      switchBusiness,
      reload: load,
    }}>
      {children}
    </BusinessContext.Provider>
  )
}
