import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
const supabase  = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// ── Rate limiting simples em memória (por userId) ─────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT    = 30   // max requests
const RATE_WINDOW   = 60_000 // por minuto
const MAX_IMG_SIZE  = 5 * 1024 * 1024 // 5MB em base64 chars ≈ 6.7MB

function checkRateLimit(userId: string): boolean {
  const now  = Date.now()
  const data = rateLimitMap.get(userId)
  if (!data || now > data.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_WINDOW })
    return true
  }
  if (data.count >= RATE_LIMIT) return false
  data.count++
  return true
}

const SYSTEM_PROMPT = `Você é a Estagiária Bia do BossFlow — uma assistente financeira inteligente para pequenos empresários brasileiros.

Você pode:
1. Analisar fotos de notas fiscais, cupons, boletos e faturas de cartão
2. Registrar receitas e despesas por texto ("gastei 50 no mercado")
3. Criar tarefas ("lembra de ligar pro fornecedor amanhã")
4. Responder perguntas sobre os dados financeiros do usuário
5. Gerar resumos e análises financeiras

## RESPOSTA EM JSON

Sempre responda com JSON puro, sem markdown. Use este formato:

{
  "type": "transactions" | "tasks" | "message" | "analysis",
  "message": "mensagem amigável para o usuário",
  "data": [ ... ]
}

### type: "transactions"
Use quando identificar lançamentos financeiros.
"data" é um array de:
{
  "title": "nome curto do lançamento",
  "amount": 0.00,
  "type": "expense" | "income",
  "date": "YYYY-MM-DD",
  "category_id": "id da categoria ou null",
  "category_name": "nome sugerido da categoria",
  "description": "detalhes opcionais ou null",
  "paid": true | false
}

### type: "tasks"
"data" é um array de:
{
  "title": "título da tarefa",
  "description": "detalhes ou null",
  "due_date": "YYYY-MM-DD ou null",
  "status": "todo"
}

### type: "message"
Para respostas em texto, análises ou quando não há ação.

## REGRAS
- Português brasileiro informal
- Para datas, use hoje se não especificada
- Para faturas: uma transação por linha relevante
- Para boletos: extraia valor, vencimento e favorecido
- Para notas: agrupe por estabelecimento
- Tente encaixar nas categorias do usuário
- Nunca invente valores
- Seja direta e objetiva

## COMPRAS PARCELADAS
Quando o usuário mencionar parcelas (ex: "comprei 5x de R$ 200" ou "parcelei em 5x R$ 1000"):
- Identifique o valor de CADA parcela (não o total)
- Se disser "5x R$ 200": cada parcela = R$ 200 → crie 1 transação de R$ 200 para o mês atual com description "1/5"
- Se disser "parcelei R$ 1000 em 5x": cada parcela = R$ 200 → mesmo acima
- NUNCA cadastre o valor total. Sempre o valor de cada parcela
- Cadastre apenas a parcela do mês atual (não todas as 5 de uma vez)
- Na description, informe "Parcela 1/5" para deixar claro
- No message para o usuário, explique que cadastrou só a parcela atual e que as próximas precisam ser lançadas nos meses seguintes`

export async function POST(req: NextRequest) {
  try {
    // ── Auth ──────────────────────────────────────────────────────
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
    if (authErr || !user) return NextResponse.json({ error: 'Token inválido' }, { status: 401 })

    // ── Rate limit ────────────────────────────────────────────────
    if (!checkRateLimit(user.id)) {
      return NextResponse.json({ error: 'Muitas requisições. Aguarde um momento.' }, { status: 429 })
    }

    // ── Verificar plano ───────────────────────────────────────────
    const { data: sub } = await supabase
      .from('subscriptions').select('plan, status').eq('user_id', user.id).eq('status', 'active').maybeSingle()
    const plan = sub?.plan ?? 'free'
    if (plan === 'free') {
      return NextResponse.json({ error: 'A Estagiária Bia está disponível nos planos Starter e Pro.' }, { status: 403 })
    }

    // ── Body + validação ──────────────────────────────────────────
    const body = await req.json()
    const { message, image, imageType, businessId, history = [] } = body

    if (!businessId) return NextResponse.json({ error: 'businessId obrigatório' }, { status: 400 })
    if (!message?.trim() && !image) return NextResponse.json({ error: 'Mensagem ou imagem obrigatória' }, { status: 400 })
    if (message && message.length > 2000) return NextResponse.json({ error: 'Mensagem muito longa' }, { status: 400 })
    if (image && image.length > MAX_IMG_SIZE) return NextResponse.json({ error: 'Arquivo muito grande. Máximo 5MB.' }, { status: 400 })

    // ── Verificar que businessId pertence ao usuário ───────────────
    const { data: ownedBiz } = await supabase
      .from('businesses').select('id').eq('id', businessId).eq('owner_id', user.id).maybeSingle()
    const { data: memberBiz } = !ownedBiz ? await supabase
      .from('business_members').select('business_id').eq('business_id', businessId).eq('user_id', user.id).in('status', ['active', 'accepted']).maybeSingle()
      : { data: null }
    if (!ownedBiz && !memberBiz) return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 403 })

    // ── Contexto financeiro ───────────────────────────────────────
    const today        = new Date().toISOString().split('T')[0]
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

    const [{ data: categories }, { data: recentTxs }, { data: pendingTasks }] = await Promise.all([
      supabase.from('categories').select('id, name, type').eq('business_id', businessId).order('name'),
      supabase.from('transactions').select('title, amount, type, date, paid').eq('business_id', businessId).gte('date', startOfMonth).order('date', { ascending: false }).limit(15),
      supabase.from('tasks').select('title, due_date').eq('business_id', businessId).eq('status', 'todo').limit(8),
    ])

    const contextBlock = `
## Contexto
Data de hoje: ${today}

### Categorias disponíveis:
${(categories || []).map(c => `- ${c.name} (${c.type === 'income' ? 'receita' : 'despesa'}) | id: ${c.id}`).join('\n') || 'Nenhuma categoria criada'}

### Últimas transações do mês:
${(recentTxs || []).map(t => `- ${t.date} | ${t.type === 'income' ? '+' : '-'}R$${t.amount} | ${t.title}`).join('\n') || 'Sem transações'}

### Tarefas pendentes:
${(pendingTasks || []).map(t => `- ${t.title}${t.due_date ? ` (vence ${t.due_date})` : ''}`).join('\n') || 'Nenhuma'}`

    // ── Monta mensagens ───────────────────────────────────────────
    const messages: any[] = [
      ...history.slice(-8).map((h: any) => ({ role: h.role, content: h.content })),
    ]

    const userContent: any[] = []
    if (image) {
      const isPdf = imageType === 'application/pdf'
      userContent.push({ type: isPdf ? 'document' : 'image', source: { type: 'base64', media_type: imageType || 'image/jpeg', data: image } })
    }
    userContent.push({ type: 'text', text: `${contextBlock}\n\n${message || 'Analise este documento e extraia os lançamentos financeiros.'}` })
    messages.push({ role: 'user', content: userContent })

    // ── Chamada Anthropic com timeout ─────────────────────────────
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 25_000)

    let raw = ''
    try {
      const response = await anthropic.messages.create({
        model:      'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system:     SYSTEM_PROMPT,
        messages,
      })
      raw = response.content[0].type === 'text' ? response.content[0].text : ''
    } finally {
      clearTimeout(timeout)
    }

    // ── Parse JSON ────────────────────────────────────────────────
    let parsed: any
    try {
      const clean = raw.replace(/```json|```/g, '').trim()
      parsed = JSON.parse(clean)
    } catch {
      parsed = { type: 'message', message: raw }
    }

    return NextResponse.json({ ok: true, result: parsed })

  } catch (err: any) {
    if (err.name === 'AbortError') {
      return NextResponse.json({ error: 'A Bia demorou muito para responder. Tenta de novo!' }, { status: 504 })
    }
    console.error('[bia]', err?.message)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
