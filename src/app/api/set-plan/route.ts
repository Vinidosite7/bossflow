import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { userId, plan, days, note } = await req.json()

    const expiresAt = days
      ? new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
      : null

    // Tenta update primeiro
    const { data: existing } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .single()

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

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}