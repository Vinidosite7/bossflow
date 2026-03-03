import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { userId, title, body, url } = await req.json()

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: sub } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (!sub) return NextResponse.json({ error: 'Sem subscription' }, { status: 404 })

    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify({ title, body, icon: '/icon-192.png', url: url || '/dashboard' })
    )

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[Push]', err)
    return NextResponse.json({ error: 'Erro ao enviar' }, { status: 500 })
  }
}
