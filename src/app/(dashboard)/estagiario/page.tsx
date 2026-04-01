'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useBusinessContext } from '@/lib/business-context'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, Paperclip, X, Check, ChevronRight,
  FileText, Image, Loader2, Bot, User,
  Sparkles, Receipt, MessageSquare, BarChart2,
  CheckSquare, Zap,
} from 'lucide-react'
import { T, card, SYNE } from '@/lib/design'
import { PageBackground } from '@/components/core'

const supabase = createClient()

// ─── Types ───────────────────────────────────────────────────
type MessageRole = 'user' | 'assistant'
interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  image?: string
  fileName?: string
  result?: any
  saving?: boolean
  saved?: boolean
}

interface TxPreview {
  title: string
  amount: number
  type: 'income' | 'expense'
  date: string
  category_id: string | null
  category_name: string
  description: string | null
  paid: boolean
  confirmed: boolean
}

// ─── Sugestões rápidas ─────────────────────────────────────
const QUICK = [
  { icon: Receipt,       label: 'Analisar nota fiscal',      text: 'Analisa essa nota e cadastra os lançamentos' },
  { icon: MessageSquare, label: 'Resumo do mês',             text: 'Como tá meu financeiro esse mês?' },
  { icon: CheckSquare,   label: 'Criar tarefa',              text: 'Cria uma tarefa para ' },
  { icon: Zap,           label: 'Lançamento rápido',         text: 'Gastei R$ ' },
]

// ─── Componente de preview de transações ──────────────────
function TxPreviewCard({
  txs, onToggle, onConfirm, saving,
}: {
  txs: TxPreview[]
  onToggle: (i: number) => void
  onConfirm: () => void
  saving: boolean
}) {
  const selected = txs.filter(t => t.confirmed)
  const total = selected.reduce((a, t) => a + (t.type === 'expense' ? -t.amount : t.amount), 0)
  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <div style={{ ...card, borderRadius: 16, padding: 0, overflow: 'hidden', marginTop: 8 }}>
      {/* Header */}
      <div style={{
        padding: '14px 18px', borderBottom: `1px solid ${T.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(124,110,247,0.05)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Receipt size={15} style={{ color: T.violet }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: T.text, fontFamily: SYNE }}>
            {txs.length} lançamento{txs.length !== 1 ? 's' : ''} encontrado{txs.length !== 1 ? 's' : ''}
          </span>
        </div>
        <span style={{ fontSize: 12, color: T.muted }}>
          Selecione os que quer salvar
        </span>
      </div>

      {/* Lista */}
      <div style={{ maxHeight: 320, overflowY: 'auto' }}>
        {txs.map((tx, i) => (
          <motion.div
            key={i}
            whileTap={{ scale: 0.99 }}
            onClick={() => onToggle(i)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 18px', cursor: 'pointer',
              borderBottom: i < txs.length - 1 ? `1px solid ${T.border}` : 'none',
              background: tx.confirmed ? 'rgba(124,110,247,0.04)' : 'transparent',
              transition: 'background 0.15s',
            }}>
            {/* Checkbox */}
            <div style={{
              width: 20, height: 20, borderRadius: 6, flexShrink: 0,
              background: tx.confirmed ? T.violet : 'transparent',
              border: `2px solid ${tx.confirmed ? T.violet : T.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}>
              {tx.confirmed && <Check size={11} color="white" strokeWidth={3} />}
            </div>

            {/* Dot tipo */}
            <div style={{
              width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
              background: tx.type === 'income' ? '#34d399' : '#f87171',
            }} />

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: T.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {tx.title}
              </p>
              <p style={{ fontSize: 11, color: T.muted, margin: '2px 0 0' }}>
                {tx.category_name || 'Sem categoria'} · {tx.date} · {tx.paid ? 'pago' : 'pendente'}
              </p>
            </div>

            {/* Valor */}
            <span style={{
              fontSize: 14, fontWeight: 700, flexShrink: 0,
              color: tx.type === 'income' ? '#34d399' : '#f87171',
            }}>
              {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        padding: '12px 18px', borderTop: `1px solid ${T.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(255,255,255,0.02)',
      }}>
        <div>
          <span style={{ fontSize: 12, color: T.muted }}>{selected.length} selecionado{selected.length !== 1 ? 's' : ''} · </span>
          <span style={{
            fontSize: 13, fontWeight: 700,
            color: total >= 0 ? '#34d399' : '#f87171',
          }}>
            {total >= 0 ? '+' : ''}{fmt(total)}
          </span>
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onConfirm}
          disabled={selected.length === 0 || saving}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 18px', borderRadius: 10, border: 'none',
            fontSize: 13, fontWeight: 700, cursor: selected.length === 0 ? 'not-allowed' : 'pointer',
            background: selected.length === 0 ? T.border : `linear-gradient(135deg, ${T.violet}, #9d8fff)`,
            color: selected.length === 0 ? T.muted : 'white',
            opacity: saving ? 0.7 : 1,
            boxShadow: selected.length > 0 ? '0 4px 16px rgba(124,110,247,0.3)' : 'none',
          }}>
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
          {saving ? 'Salvando...' : 'Salvar selecionados'}
        </motion.button>
      </div>
    </div>
  )
}

// ─── Componente de preview de tarefas ─────────────────────
function TaskPreviewCard({
  tasks, onToggle, onConfirm, saving,
}: {
  tasks: any[]
  onToggle: (i: number) => void
  onConfirm: () => void
  saving: boolean
}) {
  const selected = tasks.filter(t => t.confirmed)
  return (
    <div style={{ ...card, borderRadius: 16, padding: 0, overflow: 'hidden', marginTop: 8 }}>
      <div style={{ padding: '14px 18px', borderBottom: `1px solid ${T.border}`, background: 'rgba(52,211,153,0.05)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <CheckSquare size={15} style={{ color: '#34d399' }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: T.text, fontFamily: SYNE }}>
          {tasks.length} tarefa{tasks.length !== 1 ? 's' : ''} para criar
        </span>
      </div>
      {tasks.map((task, i) => (
        <motion.div key={i} whileTap={{ scale: 0.99 }} onClick={() => onToggle(i)}
          style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', cursor: 'pointer',
            borderBottom: i < tasks.length - 1 ? `1px solid ${T.border}` : 'none',
            background: task.confirmed ? 'rgba(52,211,153,0.04)' : 'transparent',
          }}>
          <div style={{
            width: 20, height: 20, borderRadius: 6, flexShrink: 0,
            background: task.confirmed ? '#34d399' : 'transparent',
            border: `2px solid ${task.confirmed ? '#34d399' : T.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {task.confirmed && <Check size={11} color="white" strokeWidth={3} />}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: T.text, margin: 0 }}>{task.title}</p>
            {task.due_date && <p style={{ fontSize: 11, color: T.muted, margin: '2px 0 0' }}>Vence: {task.due_date}</p>}
          </div>
        </motion.div>
      ))}
      <div style={{ padding: '12px 18px', borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'flex-end' }}>
        <motion.button whileTap={{ scale: 0.97 }} onClick={onConfirm} disabled={selected.length === 0 || saving}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 18px', borderRadius: 10, border: 'none',
            fontSize: 13, fontWeight: 700, cursor: selected.length === 0 ? 'not-allowed' : 'pointer',
            background: selected.length === 0 ? T.border : 'linear-gradient(135deg, #34d399, #10b981)',
            color: selected.length === 0 ? T.muted : 'white',
          }}>
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
          {saving ? 'Salvando...' : `Criar ${selected.length} tarefa${selected.length !== 1 ? 's' : ''}`}
        </motion.button>
      </div>
    </div>
  )
}

// ─── Página Principal ──────────────────────────────────────
export default function EstagiarioPage() {
  const { businessId } = useBusinessContext()
  const [messages, setMessages]   = useState<ChatMessage[]>([])
  const [input, setInput]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [image, setImage]         = useState<string | null>(null)
  const [imageType, setImageType] = useState<string>('')
  const [fileName, setFileName]   = useState<string>('')
  const fileRef  = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLTextAreaElement>(null)

  // Scroll para o fim sempre que tiver nova mensagem
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Upload de arquivo ──────────────────────────────────
  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setImageType(file.type)
    const reader = new FileReader()
    reader.onload = () => {
      const b64 = (reader.result as string).split(',')[1]
      setImage(b64)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // ── Enviar mensagem ────────────────────────────────────
  async function handleSend() {
    if (!input.trim() && !image) return
    if (!businessId) return

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      image: image || undefined,
      fileName: fileName || undefined,
    }

    const historyForApi = messages.map(m => ({
      role: m.role,
      content: m.content || (m.image ? '[imagem enviada]' : ''),
    }))

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setImage(null)
    setFileName('')
    setLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/estagiario', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          message: input,
          image: image || undefined,
          imageType: imageType || undefined,
          businessId,
          history: historyForApi,
        }),
      })

      const data = await res.json()
      const result = data.result

      // Inicializar confirmed = true para todos os itens
      if (result?.data) {
        result.data = result.data.map((item: any) => ({ ...item, confirmed: true }))
      }

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result?.message || '',
        result,
      }

      setMessages(prev => [...prev, assistantMsg])
    } catch (err) {
      console.error('[estagiario]', err)
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Ops, algo deu errado. Tenta de novo!',
      }])
    } finally {
      setLoading(false)
    }
  }

  // ── Toggle item no preview ─────────────────────────────
  function toggleItem(msgId: string, idx: number) {
    setMessages(prev => prev.map(m => {
      if (m.id !== msgId || !m.result?.data) return m
      const newData = m.result.data.map((item: any, i: number) =>
        i === idx ? { ...item, confirmed: !item.confirmed } : item
      )
      return { ...m, result: { ...m.result, data: newData } }
    }))
  }

  // ── Salvar transações ──────────────────────────────────
  async function saveTransactions(msgId: string) {
    const msg = messages.find(m => m.id === msgId)
    if (!msg?.result?.data) return

    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, saving: true } : m))

    try {
      const { data: { user } } = await supabase.auth.getUser()
      const selected = msg.result.data.filter((t: any) => t.confirmed)

      const inserts = selected.map((t: any) => ({
        title: t.title,
        amount: parseFloat(t.amount),
        type: t.type,
        date: t.date,
        category_id: t.category_id || null,
        description: t.description || null,
        paid: t.paid ?? true,
        paid_at: t.paid ? new Date().toISOString() : null,
        business_id: businessId,
        created_by: user?.id,
      }))

      const { error } = await supabase.from('transactions').insert(inserts)
      if (error) throw error

      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, saving: false, saved: true } : m))
    } catch (err) {
      console.error('[estagiario] save txs:', err)
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, saving: false } : m))
    }
  }

  // ── Salvar tarefas ─────────────────────────────────────
  async function saveTasks(msgId: string) {
    const msg = messages.find(m => m.id === msgId)
    if (!msg?.result?.data) return

    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, saving: true } : m))

    try {
      const { data: { user } } = await supabase.auth.getUser()
      const selected = msg.result.data.filter((t: any) => t.confirmed)

      const inserts = selected.map((t: any) => ({
        title: t.title,
        description: t.description || null,
        due_date: t.due_date || null,
        status: 'todo',
        business_id: businessId,
        created_by: user?.id,
      }))

      await supabase.from('tasks').insert(inserts)
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, saving: false, saved: true } : m))
    } catch (err) {
      console.error('[estagiario] save tasks:', err)
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, saving: false } : m))
    }
  }

  // ── Enter para enviar ──────────────────────────────────
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const isEmpty = messages.length === 0

  return (
    <PageBackground>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', maxWidth: 760, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12, flexShrink: 0,
              background: `linear-gradient(135deg, ${T.violet}, #9d8fff)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(124,110,247,0.35)',
            }}>
              <Sparkles size={18} color="white" />
            </div>
            <div>
              <h1 style={{ fontFamily: SYNE, fontSize: 20, fontWeight: 800, color: T.text, margin: 0 }}>
                Estagiário
              </h1>
              <p style={{ fontSize: 12, color: T.muted, margin: 0 }}>
                Manda nota, fatura, boleto ou digita o que precisa
              </p>
            </div>
          </div>
        </div>

        {/* Área de mensagens */}
        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 16 }}>
          <AnimatePresence>

            {/* Empty state */}
            {isEmpty && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                style={{ paddingTop: 40 }}>

                {/* Ícone central */}
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: 20, margin: '0 auto 16px',
                    background: `linear-gradient(135deg, ${T.violet}20, ${T.violet}10)`,
                    border: `1px solid ${T.violet}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Bot size={28} style={{ color: T.violet }} />
                  </div>
                  <h2 style={{ fontFamily: SYNE, fontSize: 18, fontWeight: 700, color: T.text, margin: '0 0 8px' }}>
                    O que posso fazer por você?
                  </h2>
                  <p style={{ fontSize: 13, color: T.muted, margin: 0 }}>
                    Manda uma imagem ou digita abaixo
                  </p>
                </div>

                {/* Sugestões */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {QUICK.map(({ icon: Icon, label, text }) => (
                    <motion.button key={label} whileTap={{ scale: 0.97 }}
                      onClick={() => { setInput(text); inputRef.current?.focus() }}
                      style={{
                        ...card, padding: '14px 16px', borderRadius: 14, cursor: 'pointer',
                        border: `1px solid ${T.border}`, background: 'rgba(255,255,255,0.02)',
                        display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = `${T.violet}50`)}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = T.border)}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                        background: `${T.violet}12`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Icon size={14} style={{ color: T.violet }} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{label}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Mensagens */}
            {messages.map((msg) => (
              <motion.div key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginBottom: 20 }}>

                <div style={{
                  display: 'flex',
                  flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                  alignItems: 'flex-start', gap: 10,
                }}>
                  {/* Avatar */}
                  <div style={{
                    width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                    background: msg.role === 'user'
                      ? 'rgba(255,255,255,0.08)'
                      : `linear-gradient(135deg, ${T.violet}, #9d8fff)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {msg.role === 'user'
                      ? <User size={14} style={{ color: T.muted }} />
                      : <Sparkles size={14} color="white" />}
                  </div>

                  {/* Conteúdo */}
                  <div style={{ flex: 1, maxWidth: '85%' }}>
                    {/* Preview de imagem */}
                    {msg.image && (
                      <div style={{ marginBottom: 8, display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          padding: '8px 12px', borderRadius: 10,
                          background: 'rgba(255,255,255,0.04)',
                          border: `1px solid ${T.border}`,
                          fontSize: 12, color: T.muted,
                        }}>
                          {msg.fileName?.endsWith('.pdf') ? <FileText size={14} style={{ color: T.violet }} /> : <Image size={14} style={{ color: T.violet }} />}
                          {msg.fileName || 'arquivo'}
                        </div>
                      </div>
                    )}

                    {/* Texto */}
                    {msg.content && (
                      <div style={{
                        padding: '10px 14px', borderRadius: 12,
                        background: msg.role === 'user'
                          ? `${T.violet}18`
                          : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${msg.role === 'user' ? `${T.violet}30` : T.border}`,
                        fontSize: 14, color: T.text, lineHeight: 1.65,
                        textAlign: msg.role === 'user' ? 'right' : 'left',
                        whiteSpace: 'pre-wrap',
                      }}>
                        {msg.content}
                      </div>
                    )}

                    {/* Preview de transações */}
                    {msg.result?.type === 'transactions' && !msg.saved && (
                      <TxPreviewCard
                        txs={msg.result.data || []}
                        onToggle={(i) => toggleItem(msg.id, i)}
                        onConfirm={() => saveTransactions(msg.id)}
                        saving={!!msg.saving}
                      />
                    )}

                    {/* Preview de tarefas */}
                    {msg.result?.type === 'tasks' && !msg.saved && (
                      <TaskPreviewCard
                        tasks={msg.result.data || []}
                        onToggle={(i) => toggleItem(msg.id, i)}
                        onConfirm={() => saveTasks(msg.id)}
                        saving={!!msg.saving}
                      />
                    )}

                    {/* Salvo com sucesso */}
                    {msg.saved && (
                      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        style={{
                          marginTop: 8, padding: '10px 14px', borderRadius: 10,
                          background: 'rgba(52,211,153,0.08)',
                          border: '1px solid rgba(52,211,153,0.2)',
                          display: 'flex', alignItems: 'center', gap: 8,
                          fontSize: 13, color: '#34d399',
                        }}>
                        <Check size={14} />
                        Salvo com sucesso!
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                  background: `linear-gradient(135deg, ${T.violet}, #9d8fff)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Sparkles size={14} color="white" />
                </div>
                <div style={{
                  padding: '10px 16px', borderRadius: 12,
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${T.border}`,
                  display: 'flex', gap: 5, alignItems: 'center',
                }}>
                  {[0, 1, 2].map(i => (
                    <motion.div key={i}
                      animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                      style={{ width: 6, height: 6, borderRadius: '50%', background: T.violet }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{
          ...card, borderRadius: 16, padding: 12,
          border: `1px solid ${T.border}`,
        }}>
          {/* Preview de arquivo */}
          {image && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
              padding: '6px 10px', borderRadius: 8,
              background: `${T.violet}10`, border: `1px solid ${T.violet}25`,
            }}>
              {fileName.endsWith('.pdf') ? <FileText size={13} style={{ color: T.violet }} /> : <Image size={13} style={{ color: T.violet }} />}
              <span style={{ fontSize: 12, color: T.violet, flex: 1 }}>{fileName}</span>
              <button onClick={() => { setImage(null); setFileName('') }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, display: 'flex' }}>
                <X size={13} />
              </button>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            {/* Botão de anexo */}
            <motion.button whileTap={{ scale: 0.94 }}
              onClick={() => fileRef.current?.click()}
              style={{
                width: 38, height: 38, borderRadius: 10, flexShrink: 0, cursor: 'pointer',
                background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
              <Paperclip size={15} style={{ color: T.muted }} />
            </motion.button>

            {/* Textarea */}
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Manda uma nota, fatura, ou digita aqui... (Enter para enviar)"
              rows={1}
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                color: T.text, fontSize: 14, lineHeight: 1.5, resize: 'none',
                fontFamily: '-apple-system, sans-serif',
                maxHeight: 120, overflowY: 'auto',
                padding: '8px 4px',
              }}
            />

            {/* Botão enviar */}
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={handleSend}
              disabled={(!input.trim() && !image) || loading}
              style={{
                width: 38, height: 38, borderRadius: 10, flexShrink: 0, cursor: 'pointer',
                border: 'none',
                background: (!input.trim() && !image) || loading
                  ? 'rgba(255,255,255,0.06)'
                  : `linear-gradient(135deg, ${T.violet}, #9d8fff)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: (!input.trim() && !image) ? 'none' : '0 4px 14px rgba(124,110,247,0.35)',
                transition: 'all 0.15s',
              }}>
              {loading
                ? <Loader2 size={15} color="white" className="animate-spin" />
                : <Send size={15} color={(!input.trim() && !image) ? T.muted : 'white'} />}
            </motion.button>
          </div>
        </div>

        <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFile} />
      </div>
    </PageBackground>
  )
}
