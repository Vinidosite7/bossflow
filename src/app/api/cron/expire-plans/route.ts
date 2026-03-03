import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: Request) {
  // Proteção: só Vercel Cron pode chamar
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Busca assinaturas ativas que já expiraram
  const { data: expired, error: fetchError } = await supabase
    .from('subscriptions')
    .select('id, user_id, plan, expires_at')
    .eq('status', 'active')
    .lt('expires_at', new Date().toISOString())
    .not('expires_at', 'is', null)

  if (fetchError) {
    console.error('[cron/expire-plans] fetch error:', fetchError)
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  if (!expired || expired.length === 0) {
    return NextResponse.json({ ok: true, expired: 0 })
  }

  // Expira cada uma
  const ids = expired.map(s => s.id)
  const { error: updateError } = await supabase
    .from('subscriptions')
    .update({ status: 'expired' })
    .in('id', ids)

  if (updateError) {
    console.error('[cron/expire-plans] update error:', updateError)
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  console.log(`[cron/expire-plans] Expirados: ${expired.length}`, expired.map(s => s.user_id))

  return NextResponse.json({ ok: true, expired: expired.length, users: expired.map(s => s.user_id) })
}
