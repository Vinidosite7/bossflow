import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token')
    if (!token) return NextResponse.json({ error: 'Token obrigatório' }, { status: 400 })

    const { data: invite } = await supabase
      .from('business_members')
      .select('role, email, status, invited_at, businesses(name)')
      .eq('invite_token', token)
      .maybeSingle()

    if (!invite) {
      return NextResponse.json({ error: 'Convite inválido' }, { status: 404 })
    }

    if (invite.status !== 'pending') {
      return NextResponse.json({ error: 'Convite já utilizado ou expirado' }, { status: 410 })
    }

    // Verifica expiração 48h
    const invitedAt = new Date(invite.invited_at).getTime()
    if ((Date.now() - invitedAt) / (1000 * 60 * 60) > 48) {
      return NextResponse.json({ error: 'Convite expirado' }, { status: 410 })
    }

    return NextResponse.json({
      businessName: (invite.businesses as any)?.name,
      role: invite.role,
      email: invite.email,
    })
  } catch (err: any) {
    console.error('[invite/info]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
