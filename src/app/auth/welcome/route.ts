import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    const { name, email } = await req.json()
    if (!email) return NextResponse.json({ error: 'Email obrigatório' }, { status: 400 })

    const firstName = name?.split(' ')[0] || 'empreendedor'

    await resend.emails.send({
      from: 'BossFlow <noreply@bossflow.com.br>',
      to: email,
      subject: 'Bem-vindo ao BossFlow! 🚀',
      html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#080810;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#080810;padding:40px 16px">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#111118;border-radius:20px;border:1px solid #1e1e2e;overflow:hidden">

        <!-- Header -->
        <tr>
          <td style="padding:36px 40px 28px;border-bottom:1px solid #1a1a2a">
            <img src="https://bossflow.com.br/bossflow.png" alt="BossFlow" height="32" style="display:block" />
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px">
            <h1 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#e8e8f0;letter-spacing:-0.02em">
              Bem-vindo, ${firstName}! 👋
            </h1>
            <p style="margin:0 0 24px;font-size:15px;color:#6b6b8a;line-height:1.6">
              Sua conta no BossFlow foi criada com sucesso. Agora você tem tudo que precisa para gerenciar sua empresa de forma simples e profissional.
            </p>

            <!-- Features -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px">
              ${[
                ['💰', 'Financeiro', 'Controle entradas, saídas e categorias'],
                ['👥', 'Clientes', 'Cadastre e gerencie seus clientes'],
                ['🛍️', 'Vendas', 'Registre vendas e acompanhe resultados'],
                ['✅', 'Tarefas', 'Organize as atividades do seu negócio'],
              ].map(([icon, title, desc]) => `
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #1a1a2a">
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="width:36px;font-size:18px">${icon}</td>
                      <td>
                        <p style="margin:0;font-size:14px;font-weight:600;color:#d0d0e0">${title}</p>
                        <p style="margin:0;font-size:12px;color:#4a4a6a">${desc}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>`).join('')}
            </table>

            <!-- CTA -->
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="border-radius:12px;background:linear-gradient(135deg,#7c6ef7,#9d8fff);box-shadow:0 4px 24px rgba(124,110,247,0.35)">
                  <a href="https://app.bossflow.com.br/dashboard"
                    style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:white;text-decoration:none;letter-spacing:-0.01em">
                    Acessar minha conta →
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #1a1a2a">
            <p style="margin:0;font-size:12px;color:#2a2a3e;text-align:center">
              BossFlow · Gestão simples para negócios brasileiros<br/>
              <a href="https://bossflow.com.br" style="color:#3a3a5c;text-decoration:none">bossflow.com.br</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
      `,
    })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('Welcome email error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
