// useBusiness — thin wrapper do BusinessContext
// Antes fazia 3 queries por página. Agora lê do Context (zero queries).
import { useBusinessContext } from '@/lib/business-context'

export function useBusiness() {
  const { businessId, business, businesses, loading } = useBusinessContext()
  return { businessId, business, businesses, loading }
}
