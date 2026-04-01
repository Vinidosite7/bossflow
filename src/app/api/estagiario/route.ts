import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const SYSTEM_PROMPT = `Você é o Estagiário do BossFlow — um assistente financeiro inteligente para pequenos empresários brasileiros.

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
  "data": [ ... ] // quando type for transactions ou tasks
}

### type: "transactions"
Use quando identificar lançamentos financeiros (notas, faturas, boletos, texto com valores).
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
Use quando o usuário pedir para criar uma tarefa ou lembrete.
"data" é um array de:
{
  "title": "título da tarefa",
  "description": "detalhes ou null",
  "due_date": "YYYY-MM-DD ou null",
  "status": "todo"
}

### type: "message"
Use para responder perguntas, dar análises em texto ou quando não há ação a tomar.

### type: "analysis"
Use para análises financeiras estruturadas com gráficos ou tabelas em markdown.

## REGRAS IMPORTANTES

- Sempre use o português brasileiro informal
- Para datas, use a data de hoje se não especificada
- Para faturas de cartão: crie uma transação por linha relevante
- Para boletos: extraia valor, vencimento e favorecido
- Para notas fiscais: agrupe itens similares ou crie uma transação por estabelecimento
- Ao categorizar, tente encaixar nas categorias disponíveis do usuário
- Se não tiver certeza do valor, pergunte antes de criar
- Seja direto e objetivo — o usuário é um empreendedor ocupado
- Nunca invente valores que não estão no documento`

export async function POST(req: NextRequest) {
  try {
    // ── Auth ──────────────────────────────────────────────────────
    const authHeader = req.headers.get('authorization')
    if (!authHeader) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
    if (authErr || !user) return NextResponse.json({ error: 'Token inválido' }, { status: 401 })

    // ── Body ──────────────────────────────────────────────────────
    const body = await req.json()
    const { message, image, imageType, businessId, history = [] } = body

    if (!businessId) return NextResponse.json({ error: 'businessId obrigatório' }, { status: 400 })

    // ── Contexto financeiro do usuário ────────────────────────────
    const today = new Date().toISOString().split('T')[0]
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

    const [{ data: categories }, { data: recentTxs }, { data: pendingTasks }] = await Promise.all([
      supabase.from('categories').select('id, name, type').eq('business_id', businessId).order('name'),
      supabase.from('transactions')
        .select('title, amount, type, date, paid')
        .eq('business_id', businessId)
        .gte('date', startOfMonth)
        .order('date', { ascending: false })
        .limit(20),
      supabase.from('tasks')
        .select('title, due_date, status')
        .eq('business_id', businessId)
        .eq('status', 'todo')
        .limit(10),
    ])

    const contextBlock = `
## Contexto do usuário
Data de hoje: ${today}

### Categorias disponíveis:
${(categories || []).map(c => `- ${c.name} (${c.type === 'income' ? 'receita' : 'despesa'}) | id: ${c.id}`).join('\n') || 'Nenhuma categoria criada ainda'}

### Últimas transações do mês:
${(recentTxs || []).slice(0, 10).map(t => `- ${t.date} | ${t.type === 'income' ? '+' : '-'}R$${t.amount} | ${t.title} | ${t.paid ? 'pago' : 'pendente'}`).join('\n') || 'Sem transações este mês'}

### Tarefas pendentes:
${(pendingTasks || []).map(t => `- ${t.title}${t.due_date ? ` (vence ${t.due_date})` : ''}`).join('\n') || 'Sem tarefas pendentes'}
`

    // ── Monta mensagens ───────────────────────────────────────────
    const messages: any[] = [
      // Histórico anterior (máx 10 mensagens)
      ...history.slice(-10).map((h: any) => ({
        role: h.role,
        content: h.content,
      })),
    ]

    // Mensagem atual com imagem opcional
    const userContent: any[] = []

    if (image) {
      // Detecta se é PDF ou imagem
      const isPdf = imageType === 'application/pdf' || image.startsWith('JVBER')
      userContent.push({
        type: isPdf ? 'document' : 'image',
        source: {
          type: 'base64',
          media_type: imageType || 'image/jpeg',
          data: image,
        },
      })
    }

    userContent.push({
      type: 'text',
      text: `${contextBlock}\n\n${message || (image ? 'Analise este documento e extraia os lançamentos financeiros.' : '')}`,
    })

    messages.push({ role: 'user', content: userContent })

    // ── Chamada à API ─────────────────────────────────────────────
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages,
    })

    const raw = response.content[0].type === 'text' ? response.content[0].text : ''

    // ── Parse do JSON ──────────────────────────────────────────────
    let parsed: any
    try {
      const clean = raw.replace(/```json|```/g, '').trim()
      parsed = JSON.parse(clean)
    } catch {
      parsed = { type: 'message', message: raw }
    }

    return NextResponse.json({ ok: true, result: parsed })

  } catch (err: any) {
    console.error('[estagiario]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
