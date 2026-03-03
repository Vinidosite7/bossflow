import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const { error } = await supabase
    .from('subscriptions')
    .update({ status: 'expired', plan: 'free' })
    .eq('status', 'active')
    .lt('expires_at', new Date().toISOString())
    .not('expires_at', 'is', null)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}