import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Service role — só no servidor, nunca no client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const PLAN_MAP: Record<string, string> = {
  'ewnmtb7_790932': 'starter',
  'roe67up_790935': 'pro',
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('Cakto webhook:', JSON.stringify(body, null, 2))

    // Cakto envia status "paid" quando pagamento confirmado
    if (body.status !== 'paid') {
      return NextResponse.json({ ok: true })
    }

    const email = body.customer?.email
    const productId = body.product?.id ?? body.offer?.id ?? ''
    const orderId = body.id ?? body.order_id ?? ''

    if (!email) {
      return NextResponse.json({ error: 'no email' }, { status: 400 })
    }

    // Descobre qual plano pelo product id
    const plan = PLAN_MAP[productId] ?? 'starter'

    // Acha o usuário pelo email
    const { data: profile, error: profileErr } = await supabase
  .from('profiles')
  .select('id')
  .eq('email', email)
  .maybeSingle()

if (profileErr) throw profileErr

if (!profile) {
  console.warn('Usuário não encontrado para email:', email)
  return NextResponse.json({ error: 'user not found' }, { status: 404 })
}

const userId = profile.id

    // Upsert na tabela subscriptions
    const { error } = await supabase
      .from('subscriptions')
      .upsert({
  user_id: userId,
        plan,
        status: 'active',
        cakto_order_id: orderId,
        cakto_email: email,
        activated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

    if (error) throw error

    console.log(`Plano ${plan} ativado para ${email}`)
    return NextResponse.json({ ok: true })

  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }
}