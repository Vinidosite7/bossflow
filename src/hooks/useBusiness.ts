import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'

// ── FIX: cliente criado UMA VEZ fora do hook (não recriado em cada render)
const supabase = createClient()

export function useBusiness() {
  const [businessId, setBusinessId] = useState<string>('')
  const [business, setBusiness]     = useState<any>(null)
  const [loading, setLoading]       = useState(true)
  const loadedRef = useRef(false)

  useEffect(() => {
    // ── FIX: evita dupla chamada em StrictMode
    if (loadedRef.current) return
    loadedRef.current = true

    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setLoading(false); return }

        const savedBizId = typeof window !== 'undefined'
          ? localStorage.getItem('activeBizId') || ''
          : ''

        // Empresas que é dono
        const { data: owned } = await supabase
          .from('businesses').select('*').eq('owner_id', user.id)

        // Memberships sem join (evita loop RLS)
        const { data: memberships } = await supabase
          .from('business_members').select('business_id, role')
          .eq('user_id', user.id).in('status', ['accepted', 'active'])

        // Empresas membro que não é dono
        const memberBizIds = (memberships || [])
          .map((m: any) => m.business_id)
          .filter((id: string) => !(owned || []).find((o: any) => o.id === id))

        let memberBizzes: any[] = []
        if (memberBizIds.length > 0) {
          const { data: bizData } = await supabase
            .from('businesses').select('*').in('id', memberBizIds)
          memberBizzes = (bizData || []).map((b: any) => ({
            ...b,
            _memberRole: memberships?.find((m: any) => m.business_id === b.id)?.role,
          }))
        }

        const bizList = [...(owned || []), ...memberBizzes]
        if (!bizList.length) { setLoading(false); return }

        const biz = bizList.find(b => b.id === savedBizId) || bizList[0]
        setBusiness(biz)
        setBusinessId(biz.id)

        // ── FIX: sempre persiste o activeBizId correto
        localStorage.setItem('activeBizId', biz.id)
      } catch (err) {
        console.error('[useBusiness]', err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  return { businessId, business, loading }
}
