import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { businessId, email, role } = await req.json()

    if (!businessId || !email || !role) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    if (!['admin', 'member', 'viewer'].includes(role)) {
      return NextResponse.json({ error: 'Role inválido' }, { status: 400 })
    }

    // Verifica se quem tá convidando é owner ou admin
    const authHeader = req.headers.get('authorization')
    if (!authHeader) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
    if (authErr || !user) return NextResponse.json({ error: 'Token inválido' }, { status: 401 })

    const { data: myRole } = await supabase
      .from('business_members')
      .select('role')
      .eq('business_id', businessId)
      .eq('user_id', user.id)
      .eq('status', 'accepted')
      .maybeSingle()

    // Owner não está em business_members, verifica se é dono
    const { data: biz } = await supabase
      .from('businesses')
      .select('id, name, owner_id')
      .eq('id', businessId)
      .maybeSingle()

    const isOwner = biz?.owner_id === user.id
    const isAdmin = myRole?.role === 'admin'

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Sem permissão para convidar' }, { status: 403 })
    }

    // Não pode convidar alguém com role maior que o seu
    if (!isOwner && role === 'admin') {
      return NextResponse.json({ error: 'Apenas o owner pode convidar admins' }, { status: 403 })
    }

    // Verifica se já tem convite pendente para esse email nessa empresa
    const { data: existing } = await supabase
      .from('business_members')
      .select('id, status')
      .eq('business_id', businessId)
      .eq('email', email)
      .maybeSingle()

    if (existing?.status === 'accepted') {
      return NextResponse.json({ error: 'Usuário já é membro desta empresa' }, { status: 409 })
    }

    // Gera token único
    const inviteToken = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString() // 48h

    if (existing) {
      // Atualiza convite existente
      await supabase
        .from('business_members')
        .update({
          invite_token: inviteToken,
          role,
          status: 'pending',
          invited_by: user.id,
          invited_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
    } else {
      // Cria novo convite
      const { error: insertErr } = await supabase.from('business_members').insert({
        business_id: businessId,
        email,
        role,
        invite_token: inviteToken,
        status: 'pending',
        invited_by: user.id,
        invited_at: new Date().toISOString(),
      })
      if (insertErr) console.error('[invite/create] insert error:', insertErr)
    }

    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.bossflow.pro'}/invite/${inviteToken}`

    return NextResponse.json({
      ok: true,
      inviteUrl,
      expiresAt,
      businessName: biz?.name,
    })

  } catch (err: any) {
    console.error('[invite/create]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
