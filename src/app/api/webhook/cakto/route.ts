import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ID do offer na Cakto (só o prefixo, sem _790932)
const PLAN_MAP: Record<string, string> = {
  'ewnmtb7': 'starter',
  'roe67up': 'pro',
}

export async function POST(req: NextRequest) {
  try {
    // ── 1. Parse do body ───────────────────────────────────────────────
    let body: any
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'invalid json' }, { status: 400 })
    }

    console.log('[cakto] webhook recebido:', JSON.stringify(body, null, 2))

    // ── 2. Valida secret (vem no body da Cakto) ────────────────────────
    const webhookSecret = process.env.CAKTO_WEBHOOK_SECRET
    if (webhookSecret && body.secret !== webhookSecret) {
      console.warn('[cakto] Secret inválido')
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    // ── 3. Só processa purchase_approved ──────────────────────────────
    if (body.event !== 'purchase_approved') {
      console.log('[cakto] evento ignorado:', body.event)
      return NextResponse.json({ ok: true })
    }

    const data    = body.data
    const status  = data?.status
    const email   = data?.customer?.email as string | undefined
    const offerId = data?.offer?.id ?? ''
    const orderId = data?.id ?? ''

    // ── 4. Só processa status paid ─────────────────────────────────────
    if (status !== 'paid') {
      console.log('[cakto] status ignorado:', status)
      return NextResponse.json({ ok: true })
    }

    if (!email) {
      console.error('[cakto] email não encontrado no body')
      return NextResponse.json({ error: 'no email' }, { status: 400 })
    }

    // ── 5. Descobre o plano pelo offer id ─────────────────────────────
    const plan = PLAN_MAP[offerId] ?? 'starter'
    console.log('[cakto] email:', email, '| offerId:', offerId, '| plano:', plan)

    // ── 6. Acha o usuário pelo email em profiles ───────────────────────
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (profileErr) {
      console.error('[cakto] erro ao buscar profile:', profileErr)
      throw profileErr
    }

    if (!profile) {
      console.warn('[cakto] usuário não encontrado para email:', email)
      // Retorna 200 pra Cakto não ficar retentando
      return NextResponse.json({ ok: true, warning: 'user not found' })
    }

    const userId = profile.id

    // ── 7. Upsert na tabela subscriptions ─────────────────────────────
    const { error: upsertErr } = await supabase
      .from('subscriptions')
      .upsert(
        {
          user_id:        userId,
          plan,
          status:         'active',
          cakto_order_id: orderId,
          cakto_email:    email,
          activated_at:   new Date().toISOString(),
          updated_at:     new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )

    if (upsertErr) {
      console.error('[cakto] erro ao salvar subscription:', upsertErr)
      throw upsertErr
    }

    console.log(`[cakto] ✅ plano "${plan}" ativado para ${email} (${userId})`)
    return NextResponse.json({ ok: true })

  } catch (err: any) {
    console.error('[cakto] erro interno:', err)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }
}
