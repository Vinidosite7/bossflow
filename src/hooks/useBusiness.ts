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
        const { data: bizList } = await supabase.from('businesses').select('*').eq('owner_id', user.id)
        if (!bizList?.length) { setLoading(false); return }

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