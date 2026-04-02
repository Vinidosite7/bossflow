import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: NextRequest) {
  try {
    // ── Auth obrigatória ───────────────────────────────────────
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
    if (authErr || !user) return NextResponse.json({ error: 'Token inválido' }, { status: 401 })

    // ── Verificar se é admin ───────────────────────────────────
    const { data: profile } = await supabase
      .from('profiles').select('is_admin').eq('id', user.id).single()
    if (!profile?.is_admin) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

    // ── Processar ─────────────────────────────────────────────
    const { userId, plan, days, note } = await req.json()
    if (!userId || !plan) return NextResponse.json({ error: 'userId e plan obrigatórios' }, { status: 400 })

    const expiresAt = days
      ? new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
      : null

    const { data: existing } = await supabase
      .from('subscriptions').select('id').eq('user_id', userId).single()

    let error
    if (existing) {
      const { error: e } = await supabase
        .from('subscriptions')
        .update({ plan, status: 'active', expires_at: expiresAt, note, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
      error = e
    } else {
      const { error: e } = await supabase
        .from('subscriptions')
        .insert({ user_id: userId, plan, status: 'active', activated_at: new Date().toISOString(), expires_at: expiresAt, note })
      error = e
    }

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })

  } catch (err: any) {
    console.error('[admin/set-plan]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
