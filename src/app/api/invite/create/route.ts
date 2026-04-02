import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const resend = new Resend(process.env.RESEND_API_KEY)

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
  // Permite gerar novo link mesmo pra quem já é membro (ex: mudar role)
  // Se não quiser isso, mantém o return abaixo
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

    // ── Dispara email ao convidado ────────────────────────────────
    const inviterName = user.email?.split('@')[0] ?? 'Um colega'
    const roleLabels: Record<string, string> = { admin: 'Administrador', member: 'Membro', viewer: 'Visualizador' }
    const roleLabel = roleLabels[role] ?? role

    try {
      await resend.emails.send({
        from: 'BossFlow <noreply@bossflow.com.br>',
        to: email,
        subject: `${inviterName} te convidou para ${biz?.name ?? 'uma empresa'} no BossFlow`,
        html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#080810;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#080810;padding:40px 16px">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#111118;border-radius:20px;border:1px solid #1e1e2e;overflow:hidden">

        <tr>
          <td style="padding:36px 40px 28px;border-bottom:1px solid #1a1a2a">
            <img src="https://bossflow.com.br/bossflow.png" alt="BossFlow" height="32" style="display:block" />
          </td>
        </tr>

        <tr>
          <td style="padding:36px 40px">
            <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#e8e8f0;letter-spacing:-0.02em">
              Você foi convidado! 🎉
            </h1>
            <p style="margin:0 0 20px;font-size:15px;color:#6b6b8a;line-height:1.6">
              <strong style="color:#d0d0e0">${inviterName}</strong> te convidou para colaborar na empresa
              <strong style="color:#d0d0e0">${biz?.name ?? 'no BossFlow'}</strong>
              como <strong style="color:#9d8fff">${roleLabel}</strong>.
            </p>

            <div style="background:#0d0d1a;border:1px solid #1e1e3a;border-radius:12px;padding:16px 20px;margin-bottom:28px">
              <p style="margin:0;font-size:13px;color:#4a4a6a">Empresa</p>
              <p style="margin:4px 0 0;font-size:16px;font-weight:600;color:#e8e8f0">${biz?.name ?? '—'}</p>
              <p style="margin:8px 0 0;font-size:13px;color:#4a4a6a">Seu papel</p>
              <p style="margin:4px 0 0;font-size:15px;font-weight:600;color:#9d8fff">${roleLabel}</p>
              <p style="margin:12px 0 0;font-size:11px;color:#2a2a4a">⏰ Convite válido por 48 horas</p>
            </div>

            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="border-radius:12px;background:linear-gradient(135deg,#7c6ef7,#9d8fff);box-shadow:0 4px 24px rgba(124,110,247,0.35)">
                  <a href="${inviteUrl}"
                    style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:white;text-decoration:none;letter-spacing:-0.01em">
                    Aceitar convite →
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:20px 0 0;font-size:12px;color:#2a2a4a;line-height:1.6">
              Ou acesse: <a href="${inviteUrl}" style="color:#4a4a8a;text-decoration:none">${inviteUrl}</a>
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:20px 40px;border-top:1px solid #1a1a2a">
            <p style="margin:0;font-size:12px;color:#2a2a3e;text-align:center">
              BossFlow · Se você não esperava esse convite, pode ignorar este email.<br/>
              <a href="https://bossflow.com.br" style="color:#3a3a5c;text-decoration:none">bossflow.com.br</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
      })
    } catch (emailErr) {
      console.error('[invite/create] email error:', emailErr)
      // Não bloqueia o fluxo se o email falhar
    }

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
