import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { email, role, businessId, businessName, inviterName } = await req.json()

    // Gera token único
    const token = crypto.randomUUID()

    // Salva convite no banco
    const { error } = await supabase
      .from('business_members')
      .insert({
        business_id: businessId,
        email,
        role: role ?? 'member',
        status: 'pending',
        invite_token: token,
        invited_at: new Date().toISOString(),
      })

    if (error) throw error

    // Monta link
    const link = `https://bossflow.vercel.app/convite?token=${token}`

    // Envia email
    await resend.emails.send({
      from: 'BossFlow <noreply@bossflow.pro>',
      to: email,
      subject: `${inviterName} te convidou para a ${businessName} no BossFlow`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="margin:0;padding:0;background:#0a0a12;font-family:'Inter',sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="padding:48px 16px;">
              <table width="480" cellpadding="0" cellspacing="0" style="background:#111118;border-radius:20px;border:1px solid #1e1e2e;overflow:hidden;">
                
                <!-- Header roxo -->
                <tr><td style="background:linear-gradient(135deg,#7c6ef7,#9d6ef7);padding:32px;text-align:center;">
                  <div style="font-size:28px;font-weight:900;color:white;letter-spacing:-1px;">BossFlow</div>
                  <div style="font-size:13px;color:rgba(255,255,255,0.7);margin-top:4px;">Controle total do seu negócio</div>
                </td></tr>

                <!-- Corpo -->
                <tr><td style="padding:36px 32px;">
                  <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#e8eaf0;">
                    Você foi convidado! 🎉
                  </h1>
                  <p style="margin:0 0 24px;font-size:14px;color:#6b6b8a;line-height:1.6;">
                    <strong style="color:#e8eaf0;">${inviterName}</strong> te convidou para fazer parte da empresa
                    <strong style="color:#9d8fff;">${businessName}</strong> no BossFlow como
                    <strong style="color:#e8eaf0;">${roleLabel(role)}</strong>.
                  </p>

                  <!-- Card empresa -->
                  <div style="background:#0d0d14;border:1px solid #1e1e2e;border-radius:12px;padding:16px 20px;margin-bottom:28px;">
                    <div style="font-size:11px;color:#4a4a6a;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Empresa</div>
                    <div style="font-size:16px;font-weight:700;color:#e8eaf0;">${businessName}</div>
                    <div style="margin-top:8px;display:inline-block;background:rgba(124,110,247,0.1);border:1px solid rgba(124,110,247,0.2);border-radius:6px;padding:3px 10px;font-size:12px;color:#9d8fff;">
                      ${roleLabel(role)}
                    </div>
                  </div>

                  <!-- Botão -->
                  <a href="${link}" style="display:block;background:linear-gradient(135deg,#7c6ef7,#9d6ef7);color:white;text-align:center;padding:14px 24px;border-radius:12px;font-size:15px;font-weight:700;text-decoration:none;box-shadow:0 0 24px rgba(124,110,247,0.4);">
                    Aceitar convite →
                  </a>

                  <p style="margin:20px 0 0;font-size:12px;color:#4a4a6a;text-align:center;">
                    Link válido por 7 dias. Se não reconhece este convite, ignore este email.
                  </p>
                </td></tr>

                <!-- Footer -->
                <tr><td style="padding:20px 32px;border-top:1px solid #1a1a2a;text-align:center;">
                  <p style="margin:0;font-size:11px;color:#3a3a5c;">
                    BossFlow · bossflow.vercel.app
                  </p>
                </td></tr>

              </table>
            </td></tr>
          </table>
        </body>
        </html>
      `,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Invite error:', err)
    return NextResponse.json({ error: 'Erro ao enviar convite' }, { status: 500 })
  }
}

function roleLabel(role: string) {
  const map: Record<string, string> = {
    owner: 'Dono',
    admin: 'Administrador',
    member: 'Membro',
    viewer: 'Visualizador',
  }
  return map[role] ?? 'Membro'
}