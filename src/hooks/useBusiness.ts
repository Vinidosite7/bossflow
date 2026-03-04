import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

export function useBusiness() {
  const [businessId, setBusinessId] = useState<string>('')
  const [business, setBusiness] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setLoading(false); return }

        const savedBizId = typeof window !== 'undefined' ? localStorage.getItem('activeBizId') || '' : ''

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

        if (!savedBizId) {
          localStorage.setItem('activeBizId', biz.id)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return { businessId, business, loading }
}
