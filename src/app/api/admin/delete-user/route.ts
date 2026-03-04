import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Service role — nunca expor no client
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

    // Checa se é admin na tabela profiles
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

    // Não deixa deletar a si mesmo
    if (userId === user.id) return NextResponse.json({ error: 'Não pode deletar a própria conta' }, { status: 400 })

    // Deleta tudo em cascata (businesses, profiles, etc.)
    // Se tiver ON DELETE CASCADE no Supabase, só precisa deletar o auth user
    const { error: deleteErr } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (deleteErr) throw deleteErr

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[delete-user]', err)
    return NextResponse.json({ error: err.message ?? 'Erro interno' }, { status: 500 })
  }
}
