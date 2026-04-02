import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
const supabase  = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const data = rateLimitMap.get(userId)
  if (!data || now > data.resetAt) { rateLimitMap.set(userId, { count: 1, resetAt: now + 60_000 }); return true }
  if (data.count >= 30) return false
  data.count++; return true
}

const MAX_IMG_SIZE = 5 * 1024 * 1024

const SYSTEM_PROMPT = `Você é a Estagiária Bia do BossFlow. Assistente financeira de pequenos empresários brasileiros. Direta, simpática, inteligente.

FORMATO DE RESPOSTA — OBRIGATÓRIO:
Sempre responda com JSON válido. Nunca use markdown, blocos de código ou texto fora do JSON.

{
  "type": "transactions" | "tasks" | "message",
  "message": "mensagem curta (máx 2 linhas)",
  "data": []
}

TIPO transactions — use para gastos, receitas, notas, faturas, boletos:
{
  "title": "nome curto (máx 40 chars)",
  "amount": 0.00,
  "type": "expense" | "income",
  "date": "YYYY-MM-DD",
  "category_id": "id ou null",
  "category_name": "nome sugerido",
  "description": "detalhes ou null",
  "paid": true | false
}

REGRAS DE AMOUNT — CRÍTICO:
- amount SEMPRE positivo (nunca negativo)
- "gastei R$ 50" → amount=50, type="expense"
- "recebi R$ 500" → amount=500, type="income"
- "parcelei R$ 1200 em 6x" → amount=200 (1200÷6), description="Parcela 1/6"
- "comprei 3x R$ 100" → amount=100 (valor da parcela), description="Parcela 1/3"
- NUNCA coloque o valor total de parcelas — sempre o valor de cada parcela
- Para notas fiscais: 1 transação por estabelecimento (some os itens)
- Para faturas: 1 transação por linha
- Para boletos: paid=false, date=vencimento

CATEGORIZAÇÃO:
- Use o id da categoria quando encontrar compatível no contexto
- Caso contrário: category_id=null

TIPO tasks — use para criar tarefas e lembretes:
{
  "title": "título objetivo",
  "description": "detalhes ou null",
  "due_date": "YYYY-MM-DD ou null",
  "status": "todo"
}

TIPO message — use para:
- Perguntas sobre dados financeiros (analise o contexto, cite valores reais)
- Dúvidas gerais
- Quando precisar de mais informações

AMBIGUIDADE — se não tiver certeza, pergunte:
{ "type": "message", "message": "Qual o valor? / É despesa ou receita?" }

DATAS — use o contexto:
- Hoje = data do contexto
- "ontem" = hoje - 1
- Nunca invente datas

TOM: BR informal. Mensagens curtas. Confirme o que fez: "Cadastrei R$ 50 no mercado ✅"
Para parcelas: "Cadastrei parcela 1/6 de R$ 200. Lance as próximas nos próximos meses 📅"

ERROS A EVITAR:
- NÃO some parcelas (só a parcela atual)
- NÃO crie transactions com amount=0
- NÃO use valores negativos
- NÃO responda fora do JSON`

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
    if (authErr || !user) return NextResponse.json({ error: 'Token inválido' }, { status: 401 })

    if (!checkRateLimit(user.id)) return NextResponse.json({ error: 'Muitas mensagens seguidas. Aguarda um segundo! 😅' }, { status: 429 })

    const { data: sub } = await supabase.from('subscriptions').select('plan').eq('user_id', user.id).eq('status', 'active').maybeSingle()
    const plan = sub?.plan ?? 'free'
    if (plan === 'free') return NextResponse.json({ error: 'A Estagiária Bia está nos planos Starter e Pro. Faz upgrade em Assinatura! 🚀' }, { status: 403 })

    const body = await req.json()
    const { message, image, imageType, businessId, history = [] } = body

    if (!businessId) return NextResponse.json({ error: 'Erro: empresa não identificada.' }, { status: 400 })
    if (!message?.trim() && !image) return NextResponse.json({ error: 'Manda uma mensagem ou imagem!' }, { status: 400 })
    if (message?.length > 3000) return NextResponse.json({ error: 'Mensagem muito longa!' }, { status: 400 })
    if (image && image.length > MAX_IMG_SIZE) return NextResponse.json({ error: 'Arquivo muito grande. Máximo 5MB.' }, { status: 400 })

    const { data: ownedBiz } = await supabase.from('businesses').select('id, name').eq('id', businessId).eq('owner_id', user.id).maybeSingle()
    const { data: memberBiz } = !ownedBiz ? await supabase.from('business_members').select('business_id').eq('business_id', businessId).eq('user_id', user.id).in('status', ['active','accepted']).maybeSingle() : { data: null }
    if (!ownedBiz && !memberBiz) return NextResponse.json({ error: 'Empresa não encontrada. Recarrega a página.' }, { status: 403 })

    const now            = new Date()
    const today          = now.toISOString().split('T')[0]
    const startMonth     = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]
    const endLastMonth   = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]

    const [{ data: cats }, { data: txs }, { data: lastTxs }, { data: tasks }, { data: pending }] = await Promise.all([
      supabase.from('categories').select('id, name, type').eq('business_id', businessId).order('name'),
      supabase.from('transactions').select('title, amount, type, date, paid').eq('business_id', businessId).gte('date', startMonth).order('date', { ascending: false }).limit(20),
      supabase.from('transactions').select('amount, type').eq('business_id', businessId).gte('date', startLastMonth).lte('date', endLastMonth),
      supabase.from('tasks').select('title, due_date').eq('business_id', businessId).eq('status', 'todo').limit(8),
      supabase.from('transactions').select('title, amount, date').eq('business_id', businessId).eq('paid', false).gte('date', today).order('date').limit(5),
    ])

    const income  = (txs || []).filter(t => t.type === 'income').reduce((a, t) => a + Number(t.amount), 0)
    const expense = (txs || []).filter(t => t.type === 'expense').reduce((a, t) => a + Number(t.amount), 0)
    const lIncome  = (lastTxs || []).filter(t => t.type === 'income').reduce((a, t) => a + Number(t.amount), 0)
    const lExpense = (lastTxs || []).filter(t => t.type === 'expense').reduce((a, t) => a + Number(t.amount), 0)
    const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

    const ctx = `
## CONTEXTO
Hoje: ${today} | Empresa: ${ownedBiz?.name || 'empresa'}

### Categorias (use os IDs):
${(cats || []).map(c => `- id:"${c.id}" | "${c.name}" | ${c.type === 'income' ? 'receita' : 'despesa'}`).join('\n') || '(nenhuma — use category_id: null)'}

### Este mês:
Receitas: ${fmt(income)} | Despesas: ${fmt(expense)} | Lucro: ${fmt(income - expense)}

### Mês anterior:
Receitas: ${fmt(lIncome)} | Despesas: ${fmt(lExpense)}

### Últimas transações:
${(txs || []).slice(0, 10).map(t => `${t.date} | ${t.type === 'income' ? '+' : '-'}${fmt(Number(t.amount))} | ${t.title}`).join('\n') || '(nenhuma)'}

### Contas a pagar:
${(pending || []).map(t => `${t.date} | ${fmt(Number(t.amount))} | ${t.title}`).join('\n') || '(nenhuma)'}

### Tarefas pendentes:
${(tasks || []).map(t => `${t.title}${t.due_date ? ` (vence ${t.due_date})` : ''}`).join('\n') || '(nenhuma)'}`

    const msgs = [
      ...history.slice(-10).filter((h: any) => h.content).map((h: any) => ({ role: h.role as 'user' | 'assistant', content: String(h.content) })),
    ]

    const userContent: any[] = []
    if (image) {
      userContent.push({ type: imageType === 'application/pdf' ? 'document' : 'image', source: { type: 'base64', media_type: imageType || 'image/jpeg', data: image } })
    }
    userContent.push({ type: 'text', text: `${ctx}\n\n---\n${message || 'Analise o documento e extraia os lançamentos. Responda em JSON.'}` })
    msgs.push({ role: 'user', content: userContent })

    const response = await anthropic.messages.create({ model: 'claude-sonnet-4-20250514', max_tokens: 2048, system: SYSTEM_PROMPT, messages: msgs })
    const raw = response.content[0].type === 'text' ? response.content[0].text : ''

    let parsed: any
    try {
      const clean = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim()
      parsed = JSON.parse(clean)
      if (!['transactions', 'tasks', 'message'].includes(parsed.type)) parsed = { type: 'message', message: parsed.message || clean }
      if (parsed.type === 'transactions' && Array.isArray(parsed.data)) {
        parsed.data = parsed.data
          .filter((t: any) => Number(t.amount) > 0)
          .map((t: any) => ({
            ...t,
            amount: Math.abs(parseFloat(t.amount)),
            type: t.type === 'income' ? 'income' : 'expense',
            paid: t.paid ?? true,
            date: t.date || today,
            category_id: t.category_id || null,
          }))
      }
    } catch {
      parsed = { type: 'message', message: raw.slice(0, 400) || 'Pronto!' }
    }

    return NextResponse.json({ ok: true, result: parsed })

  } catch (err: any) {
    console.error('[bia]', err?.message)
    return NextResponse.json({ error: 'Erro interno. Tenta de novo.' }, { status: 500 })
  }
}
