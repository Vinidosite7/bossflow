import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json()
    if (!userId) return NextResponse.json({ error: 'userId obrigatório' }, { status: 400 })

    // Verifica se quem tá chamando é admin
    const authHeader = req.headers.get('authorization')
    if (!authHeader) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token)
    if (authErr || !user) return NextResponse.json({ error: 'Token inválido' }, { status: 401 })

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    if (userId === user.id) return NextResponse.json({ error: 'Não pode deletar a própria conta' }, { status: 400 })

    // ── 1. Pega as empresas do usuário ──────────────────────────
    const { data: businesses } = await supabaseAdmin
      .from('businesses')
      .select('id')
      .eq('owner_id', userId)

    if (businesses && businesses.length > 0) {
      const bizIds = businesses.map(b => b.id)

      // ── 2. Deleta tudo ligado às empresas ───────────────────
      await supabaseAdmin.from('sale_items').delete().in(
        'sale_id',
        supabaseAdmin.from('sales').select('id').in('business_id', bizIds) as any
      )
      await supabaseAdmin.from('sales').delete().in('business_id', bizIds)
      await supabaseAdmin.from('transactions').delete().in('business_id', bizIds)
      await supabaseAdmin.from('goals').delete().in('business_id', bizIds)
      await supabaseAdmin.from('goals_old').delete().in('business_id', bizIds)
      await supabaseAdmin.from('tasks').delete().in('business_id', bizIds)
      await supabaseAdmin.from('categories').delete().in('business_id', bizIds)
      await supabaseAdmin.from('products').delete().in('business_id', bizIds)
      await supabaseAdmin.from('clients').delete().in('business_id', bizIds)
      await supabaseAdmin.from('events').delete().in('business_id', bizIds)
      await supabaseAdmin.from('notifications').delete().in('business_id', bizIds)
      await supabaseAdmin.from('business_members').delete().in('business_id', bizIds)
      await supabaseAdmin.from('businesses').delete().in('id', bizIds)
    }

    // ── 3. Deleta dados diretos do usuário ───────────────────
    await supabaseAdmin.from('push_subscriptions').delete().eq('user_id', userId)
    await supabaseAdmin.from('subscriptions').delete().eq('user_id', userId)
    await supabaseAdmin.from('onboarding_status').delete().eq('user_id', userId)
    await supabaseAdmin.from('business_members').delete().eq('user_id', userId)
    await supabaseAdmin.from('profiles').delete().eq('id', userId)

    // ── 4. Deleta o auth user ────────────────────────────────
    const { error: deleteErr } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (deleteErr) throw deleteErr

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[delete-user]', err)
    return NextResponse.json({ error: err.message ?? 'Erro interno' }, { status: 500 })
  }
}
