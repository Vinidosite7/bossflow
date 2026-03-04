import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json()
    if (!token) return NextResponse.json({ error: 'Token obrigatório' }, { status: 400 })

    // Verifica autenticação
    const authHeader = req.headers.get('authorization')
    if (!authHeader) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const accessToken = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authErr } = await supabase.auth.getUser(accessToken)
    if (authErr || !user) return NextResponse.json({ error: 'Token inválido' }, { status: 401 })

    // Busca o convite
    const { data: invite, error: inviteErr } = await supabase
      .from('business_members')
      .select('*, businesses(name)')
      .eq('invite_token', token)
      .eq('status', 'pending')
      .maybeSingle()

    if (inviteErr) throw inviteErr

    if (!invite) {
      return NextResponse.json({ error: 'Convite inválido ou já utilizado' }, { status: 404 })
    }

    // Verifica se o convite expirou (48h a partir de invited_at)
    const invitedAt = new Date(invite.invited_at).getTime()
    const now = Date.now()
    const diffHours = (now - invitedAt) / (1000 * 60 * 60)

    if (diffHours > 48) {
      await supabase
        .from('business_members')
        .update({ status: 'expired' })
        .eq('id', invite.id)
      return NextResponse.json({ error: 'Convite expirado' }, { status: 410 })
    }

    // Verifica se o email bate
    if (invite.email && invite.email !== user.email) {
      return NextResponse.json({
        error: `Este convite é para ${invite.email}. Você está logado com ${user.email}.`
      }, { status: 403 })
    }

    // Aceita o convite
    const { error: updateErr } = await supabase
      .from('business_members')
      .update({
        user_id: user.id,
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        invite_token: null, // invalida o token
      })
      .eq('id', invite.id)

    if (updateErr) throw updateErr

    return NextResponse.json({
      ok: true,
      businessId: invite.business_id,
      businessName: (invite.businesses as any)?.name,
      role: invite.role,
    })

  } catch (err: any) {
    console.error('[invite/accept]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
