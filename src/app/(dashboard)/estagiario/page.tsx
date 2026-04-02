'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useBusinessContext } from '@/lib/business-context'
import { usePlanLimits } from '@/hooks/usePlanLimits'
import { PlanGate } from '@/components/PlanGate'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, Paperclip, X, Check, FileText, Image as ImageIcon,
  Loader2, User, Receipt, MessageSquare, CheckSquare,
  Zap, Trash2,
} from 'lucide-react'
import { T, card, SYNE } from '@/lib/design'
import { PageBackground } from '@/components/core'

const supabase = createClient()

type MessageRole = 'user' | 'assistant'
interface ChatMessage {
  id: string; role: MessageRole; content: string
  image?: string; fileName?: string; result?: any; saving?: boolean; saved?: boolean
}

const QUICK = [
  { icon: Receipt,       label: 'Analisar nota fiscal', text: 'Analisa essa nota e cadastra os lançamentos' },
  { icon: MessageSquare, label: 'Resumo do mês',         text: 'Como tá meu financeiro esse mês?' },
  { icon: CheckSquare,   label: 'Criar tarefa',          text: 'Cria uma tarefa: ' },
  { icon: Zap,           label: 'Lançamento rápido',     text: 'Gastei R$ ' },
]

const SUGGESTIONS = [
  'Qual meu maior gasto esse mês?',
  'Tenho contas a pagar essa semana?',
  'Como tá meu lucro comparado ao mês passado?',
  'Quais clientes não compraram há mais de 30 dias?',
]

function TxPreviewCard({ txs, onToggle, onConfirm, saving }: { txs: any[]; onToggle: (i: number) => void; onConfirm: () => void; saving: boolean }) {
  const selected = txs.filter(t => t.confirmed)
  const total = selected.reduce((a, t) => a + (t.type === 'expense' ? -t.amount : t.amount), 0)
  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  return (
    <div style={{ borderRadius: 16, overflow: 'hidden', marginTop: 10, border: '1px solid rgba(124,110,247,0.2)', background: 'rgba(124,110,247,0.03)' }}>
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Receipt size={13} style={{ color: T.violet }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: T.text, fontFamily: SYNE }}>{txs.length} lançamento{txs.length !== 1 ? 's' : ''} encontrado{txs.length !== 1 ? 's' : ''}</span>
        </div>
        <span style={{ fontSize: 11, color: T.muted }}>clique para selecionar</span>
      </div>
      <div style={{ maxHeight: 280, overflowY: 'auto' }}>
        {txs.map((tx, i) => (
          <motion.div key={i} whileTap={{ scale: 0.99 }} onClick={() => onToggle(i)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', cursor: 'pointer', borderBottom: i < txs.length - 1 ? `1px solid ${T.border}` : 'none', background: tx.confirmed ? 'rgba(124,110,247,0.06)' : 'transparent' }}>
            <div style={{ width: 18, height: 18, borderRadius: 5, flexShrink: 0, background: tx.confirmed ? T.violet : 'transparent', border: `2px solid ${tx.confirmed ? T.violet : T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {tx.confirmed && <Check size={10} color="white" strokeWidth={3} />}
            </div>
            <div style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: tx.type === 'income' ? '#34d399' : '#f87171' }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: T.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.title}</p>
              <p style={{ fontSize: 11, color: T.muted, margin: '2px 0 0' }}>{tx.category_name || 'Sem categoria'} · {tx.date}</p>
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: tx.type === 'income' ? '#34d399' : '#f87171', flexShrink: 0 }}>{tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}</span>
          </motion.div>
        ))}
      </div>
      <div style={{ padding: '10px 16px', borderTop: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, color: total >= 0 ? '#34d399' : '#f87171', fontWeight: 700 }}>{selected.length} selecionado{selected.length !== 1 ? 's' : ''} · {total >= 0 ? '+' : ''}{fmt(total)}</span>
        <motion.button whileTap={{ scale: 0.97 }} onClick={onConfirm} disabled={selected.length === 0 || saving}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 9, border: 'none', fontSize: 12, fontWeight: 700, cursor: selected.length === 0 ? 'not-allowed' : 'pointer', background: selected.length === 0 ? T.border : `linear-gradient(135deg, ${T.violet}, #9d8fff)`, color: selected.length === 0 ? T.muted : 'white', boxShadow: selected.length > 0 ? '0 4px 14px rgba(124,110,247,0.3)' : 'none' }}>
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
          {saving ? 'Salvando...' : 'Salvar'}
        </motion.button>
      </div>
    </div>
  )
}

function TaskPreviewCard({ tasks, onToggle, onConfirm, saving }: { tasks: any[]; onToggle: (i: number) => void; onConfirm: () => void; saving: boolean }) {
  const selected = tasks.filter(t => t.confirmed)
  return (
    <div style={{ borderRadius: 16, overflow: 'hidden', marginTop: 10, border: '1px solid rgba(52,211,153,0.2)', background: 'rgba(52,211,153,0.03)' }}>
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
        <CheckSquare size={13} style={{ color: '#34d399' }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: T.text, fontFamily: SYNE }}>{tasks.length} tarefa{tasks.length !== 1 ? 's' : ''} para criar</span>
      </div>
      {tasks.map((task, i) => (
        <motion.div key={i} whileTap={{ scale: 0.99 }} onClick={() => onToggle(i)}
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', cursor: 'pointer', borderBottom: i < tasks.length - 1 ? `1px solid ${T.border}` : 'none', background: task.confirmed ? 'rgba(52,211,153,0.05)' : 'transparent' }}>
          <div style={{ width: 18, height: 18, borderRadius: 5, flexShrink: 0, background: task.confirmed ? '#34d399' : 'transparent', border: `2px solid ${task.confirmed ? '#34d399' : T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {task.confirmed && <Check size={10} color="white" strokeWidth={3} />}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: T.text, margin: 0 }}>{task.title}</p>
            {task.due_date && <p style={{ fontSize: 11, color: T.muted, margin: '2px 0 0' }}>Vence: {task.due_date}</p>}
          </div>
        </motion.div>
      ))}
      <div style={{ padding: '10px 16px', borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'flex-end' }}>
        <motion.button whileTap={{ scale: 0.97 }} onClick={onConfirm} disabled={selected.length === 0 || saving}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 9, border: 'none', fontSize: 12, fontWeight: 700, cursor: selected.length === 0 ? 'not-allowed' : 'pointer', background: selected.length === 0 ? T.border : 'linear-gradient(135deg, #34d399, #10b981)', color: selected.length === 0 ? T.muted : 'white' }}>
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
          {saving ? 'Salvando...' : `Criar ${selected.length}`}
        </motion.button>
      </div>
    </div>
  )
}

export default function BiaPage() {
  const { businessId, user } = useBusinessContext()
  const { plan, features, loading: planLoading } = usePlanLimits()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [image, setImage]       = useState<string | null>(null)
  const [imageType, setImageType] = useState('')
  const [fileName, setFileName] = useState('')
  const fileRef   = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLTextAreaElement>(null)

  const userName = (user as any)?.user_metadata?.full_name?.split(' ')[0] || 'você'

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setFileName(file.name); setImageType(file.type)
    const reader = new FileReader()
    reader.onload = () => setImage((reader.result as string).split(',')[1])
    reader.readAsDataURL(file); e.target.value = ''
  }

  async function handleSend(overrideText?: string) {
    const text = overrideText ?? input
    if (!text.trim() && !image) return; if (!businessId) return
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: text, image: image || undefined, fileName: fileName || undefined }
    const historyForApi = messages.map(m => ({ role: m.role, content: m.content || (m.image ? '[imagem enviada]' : '') }))
    setMessages(prev => [...prev, userMsg]); setInput(''); setImage(null); setFileName(''); setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/estagiario', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` }, body: JSON.stringify({ message: text, image: image || undefined, imageType: imageType || undefined, businessId, history: historyForApi }) })
      const data = await res.json()
      const result = data.result
      if (result?.data) result.data = result.data.map((item: any) => ({ ...item, confirmed: true }))
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: result?.message || '', result }])
    } catch {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: 'Ops, algo deu errado. Tenta de novo!' }])
    } finally { setLoading(false) }
  }

  function toggleItem(msgId: string, idx: number) {
    setMessages(prev => prev.map(m => m.id !== msgId || !m.result?.data ? m : { ...m, result: { ...m.result, data: m.result.data.map((item: any, i: number) => i === idx ? { ...item, confirmed: !item.confirmed } : item) } }))
  }

  async function saveTransactions(msgId: string) {
    const msg = messages.find(m => m.id === msgId); if (!msg?.result?.data) return
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, saving: true } : m))
    try {
      const { data: { user: u } } = await supabase.auth.getUser()
      await supabase.from('transactions').insert(msg.result.data.filter((t: any) => t.confirmed).map((t: any) => ({ title: t.title, amount: parseFloat(t.amount), type: t.type, date: t.date, category_id: t.category_id || null, description: t.description || null, paid: t.paid ?? true, paid_at: t.paid ? new Date().toISOString() : null, business_id: businessId, created_by: u?.id })))
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, saving: false, saved: true } : m))
    } catch { setMessages(prev => prev.map(m => m.id === msgId ? { ...m, saving: false } : m)) }
  }

  async function saveTasks(msgId: string) {
    const msg = messages.find(m => m.id === msgId); if (!msg?.result?.data) return
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, saving: true } : m))
    try {
      const { data: { user: u } } = await supabase.auth.getUser()
      await supabase.from('tasks').insert(msg.result.data.filter((t: any) => t.confirmed).map((t: any) => ({ title: t.title, description: t.description || null, due_date: t.due_date || null, status: 'todo', business_id: businessId, created_by: u?.id })))
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, saving: false, saved: true } : m))
    } catch { setMessages(prev => prev.map(m => m.id === msgId ? { ...m, saving: false } : m)) }
  }

  function handleKeyDown(e: React.KeyboardEvent) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }

  const isEmpty = messages.length === 0

  // Gate: aiAssistant disponível só no Starter+
  if (!planLoading && !features.aiAssistant) {
    return (
      <PageBackground>
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3 px-1 pt-1">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(192,132,252,0.12)', border: '1px solid rgba(192,132,252,0.2)' }}>
              <span style={{ fontSize: 16 }}>🤖</span>
            </div>
            <div>
              <h1 className="font-bold text-lg" style={{ color: '#e8e8f0', fontFamily: 'Syne, sans-serif' }}>Estagiário IA</h1>
              <p className="text-xs" style={{ color: '#4a4a6a' }}>Assistente financeiro inteligente</p>
            </div>
          </div>
          <PlanGate currentPlan={plan} requiredPlan="starter"
            feature="Estagiário IA"
            description="Analise notas fiscais, registre lançamentos por texto e consulte seus dados financeiros com IA. Disponível no plano Starter."
            mode="hide">
            <div className="flex flex-col gap-3">
              {[0,1,2].map(i => <div key={i} className="h-16 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)' }} />)}
            </div>
          </PlanGate>
        </div>
      </PageBackground>
    )
  }

  return (
    <PageBackground>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 112px)', maxWidth: 720, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, overflow: 'hidden', flexShrink: 0, border: '2px solid rgba(124,110,247,0.4)', boxShadow: '0 0 20px rgba(124,110,247,0.25)' }}>
              <img src="/bia-avatar.png" alt="Bia" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h1 style={{ fontFamily: SYNE, fontSize: 17, fontWeight: 800, color: T.text, margin: 0 }}>Bia</h1>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: 'rgba(124,110,247,0.12)', color: '#9d8fff', border: '1px solid rgba(124,110,247,0.25)', letterSpacing: '0.05em' }}>ESTAGIÁRIA IA</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 2, repeat: Infinity }} style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399' }} />
                  <span style={{ fontSize: 11, color: '#34d399' }}>online</span>
                </div>
              </div>
              <p style={{ fontSize: 11, color: T.muted, margin: 0 }}>Manda nota, fatura, boleto ou digita o que precisar</p>
            </div>
          </div>
          {messages.length > 0 && (
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => setMessages([])}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 9, border: `1px solid ${T.border}`, background: 'transparent', fontSize: 12, color: T.muted, cursor: 'pointer' }}>
              <Trash2 size={11} /> Limpar
            </motion.button>
          )}
        </div>

        {/* Mensagens */}
        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 12 }}>
          <AnimatePresence>
            {isEmpty && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ paddingTop: 16 }}>
                {/* Boas-vindas */}
                <div style={{ ...card, borderRadius: 20, padding: '18px 20px', marginBottom: 20, background: 'linear-gradient(135deg, rgba(124,110,247,0.08), rgba(124,110,247,0.03))', border: '1px solid rgba(124,110,247,0.18)', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, overflow: 'hidden', flexShrink: 0, border: '2px solid rgba(124,110,247,0.3)' }}>
                    <img src="/bia-avatar.png" alt="Bia" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: '0 0 4px', fontFamily: SYNE }}>Oi, {userName}! 👋 Sou a Bia.</p>
                    <p style={{ fontSize: 13, color: '#6a6a8a', margin: 0, lineHeight: 1.6 }}>Sua estagiária financeira. Posso analisar notas, cadastrar lançamentos, criar tarefas e responder perguntas sobre seu negócio. Por onde quer começar?</p>
                  </div>
                </div>

                {/* Ações rápidas */}
                <p style={{ fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>O que posso fazer</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
                  {QUICK.map(({ icon: Icon, label, text }) => (
                    <motion.button key={label} whileTap={{ scale: 0.97 }} onClick={() => { setInput(text); inputRef.current?.focus() }}
                      style={{ ...card, padding: '12px 14px', borderRadius: 12, cursor: 'pointer', border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left', transition: 'all 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(124,110,247,0.4)')}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = T.border)}>
                      <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: 'rgba(124,110,247,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={13} style={{ color: T.violet }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{label}</span>
                    </motion.button>
                  ))}
                </div>

                {/* Perguntas */}
                <p style={{ fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Perguntas frequentes</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {SUGGESTIONS.map(s => (
                    <motion.button key={s} whileTap={{ scale: 0.99 }} onClick={() => handleSend(s)}
                      style={{ padding: '10px 14px', borderRadius: 10, cursor: 'pointer', textAlign: 'left', background: 'rgba(255,255,255,0.02)', border: `1px solid ${T.border}`, fontSize: 13, color: T.sub, transition: 'all 0.15s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,110,247,0.3)'; (e.currentTarget as HTMLElement).style.color = T.text }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = T.border; (e.currentTarget as HTMLElement).style.color = T.sub }}>
                      {s}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {messages.map(msg => (
              <motion.div key={msg.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                style={{ marginBottom: 16, display: 'flex', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, overflow: 'hidden', border: msg.role === 'assistant' ? '1.5px solid rgba(124,110,247,0.3)' : `1px solid ${T.border}`, background: msg.role === 'user' ? 'rgba(255,255,255,0.06)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {msg.role === 'assistant'
                    ? <img src="/bia-avatar.png" alt="Bia" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
                    : <User size={13} style={{ color: T.muted }} />}
                </div>
                <div style={{ flex: 1, maxWidth: '86%' }}>
                  {msg.image && (
                    <div style={{ marginBottom: 8, display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}`, fontSize: 12, color: T.muted }}>
                        {msg.fileName?.endsWith('.pdf') ? <FileText size={12} style={{ color: T.violet }} /> : <ImageIcon size={12} style={{ color: T.violet }} />}
                        {msg.fileName || 'arquivo'}
                      </div>
                    </div>
                  )}
                  {msg.content && (
                    <div style={{ padding: '10px 13px', borderRadius: 12, background: msg.role === 'user' ? 'rgba(124,110,247,0.14)' : 'rgba(255,255,255,0.04)', border: `1px solid ${msg.role === 'user' ? 'rgba(124,110,247,0.25)' : T.border}`, fontSize: 13, color: T.text, lineHeight: 1.7, textAlign: msg.role === 'user' ? 'right' : 'left', whiteSpace: 'pre-wrap' }}>
                      {msg.content}
                    </div>
                  )}
                  {msg.result?.type === 'transactions' && !msg.saved && <TxPreviewCard txs={msg.result.data || []} onToggle={i => toggleItem(msg.id, i)} onConfirm={() => saveTransactions(msg.id)} saving={!!msg.saving} />}
                  {msg.result?.type === 'tasks' && !msg.saved && <TaskPreviewCard tasks={msg.result.data || []} onToggle={i => toggleItem(msg.id, i)} onConfirm={() => saveTasks(msg.id)} saving={!!msg.saving} />}
                  {msg.saved && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                      style={{ marginTop: 8, padding: '8px 12px', borderRadius: 8, background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#34d399' }}>
                      <Check size={12} /> Salvo com sucesso!
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}

            {loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, overflow: 'hidden', border: '1.5px solid rgba(124,110,247,0.3)', flexShrink: 0 }}>
                  <img src="/bia-avatar.png" alt="Bia" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
                </div>
                <div style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}`, display: 'flex', gap: 4, alignItems: 'center' }}>
                  {[0,1,2].map(i => (
                    <motion.div key={i} animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                      style={{ width: 5, height: 5, borderRadius: '50%', background: T.violet }} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ ...card, borderRadius: 16, padding: '10px 12px', border: `1px solid ${T.border}` }}>
          {image && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, padding: '5px 10px', borderRadius: 8, background: 'rgba(124,110,247,0.08)', border: '1px solid rgba(124,110,247,0.2)' }}>
              {fileName.endsWith('.pdf') ? <FileText size={12} style={{ color: T.violet }} /> : <ImageIcon size={12} style={{ color: T.violet }} />}
              <span style={{ fontSize: 11, color: T.violet, flex: 1 }}>{fileName}</span>
              <button onClick={() => { setImage(null); setFileName('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, display: 'flex' }}><X size={12} /></button>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            <motion.button whileTap={{ scale: 0.94 }} onClick={() => fileRef.current?.click()}
              style={{ width: 36, height: 36, borderRadius: 9, flexShrink: 0, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Paperclip size={14} style={{ color: T.muted }} />
            </motion.button>
            <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
              placeholder="Manda uma nota, fatura, ou digita aqui..." rows={1}
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: T.text, fontSize: 13, lineHeight: 1.5, resize: 'none', fontFamily: '-apple-system, sans-serif', maxHeight: 100, overflowY: 'auto', padding: '7px 4px' }} />
            <motion.button whileTap={{ scale: 0.94 }} onClick={() => handleSend()} disabled={(!input.trim() && !image) || loading}
              style={{ width: 36, height: 36, borderRadius: 9, flexShrink: 0, cursor: 'pointer', border: 'none', background: (!input.trim() && !image) || loading ? 'rgba(255,255,255,0.06)' : `linear-gradient(135deg, ${T.violet}, #9d8fff)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: (!input.trim() && !image) ? 'none' : '0 4px 14px rgba(124,110,247,0.35)', transition: 'all 0.15s' }}>
              {loading ? <Loader2 size={14} color="white" className="animate-spin" /> : <Send size={14} color={(!input.trim() && !image) ? T.muted : 'white'} />}
            </motion.button>
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFile} />
      </div>
    </PageBackground>
  )
}
