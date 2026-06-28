'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { CheckSquare, Plus, X, Edit2, Trash2, Clock, AlertCircle, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { SpotlightCard, ShimmerButton, Skeleton, BackgroundGrid, FloatingOrbs, AcernityFonts } from '@/components/ui/aceternity'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16, filter: 'blur(4px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  transition: { duration: 0.46, delay, ease: [0.16, 1, 0.3, 1] as const },
})

const COLUMNS = [
  { key: 'todo',  label: 'A fazer',    color: '#6b6b8a', accent: 'rgba(107,107,138,0.15)' },
  { key: 'doing', label: 'Em andamento', color: '#fbbf24', accent: 'rgba(251,191,36,0.15)' },
  { key: 'done',  label: 'Concluído',  color: '#34d399', accent: 'rgba(52,211,153,0.15)' },
]
const PRIORITY = {
  low:    { label: 'Baixa',  color: '#6b6b8a' },
  medium: { label: 'Média',  color: '#fbbf24' },
  high:   { label: 'Alta',   color: '#f87171' },
}
const EMPTY_FORM = { title: '', description: '', status: 'todo', priority: 'medium', due_date: '' }

export default function TarefasPage() {
  const supabase = createClient()
  const router   = useRouter()
  const [loading, setLoading]   = useState(true)
  const [biz, setBiz]           = useState<any>(null)
  const [tasks, setTasks]       = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing]   = useState<any>(null)
  const [form, setForm]         = useState(EMPTY_FORM)
  const [saving, setSaving]     = useState(false)
  const [deleting, setDeleting] = useState<string|null>(null)

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/login'); return }
    const { data: owned } = await supabase.from('businesses').select('*').eq('owner_id', user.id)
    const business = (owned || [])[0]; if (!business) { setLoading(false); return }
    setBiz(business)
    const { data } = await supabase.from('tasks').select('*').eq('business_id', business.id).order('created_at', { ascending: false })
    setTasks(data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    const payload = { ...form, due_date: form.due_date || null, business_id: biz.id }
    if (editing) await supabase.from('tasks').update(payload).eq('id', editing.id)
    else await supabase.from('tasks').insert(payload)
    setSaving(false); setShowModal(false); setEditing(null); setForm(EMPTY_FORM); load()
  }

  async function handleDelete(id: string) {
    setDeleting(id); await supabase.from('tasks').delete().eq('id', id); setDeleting(null); load()
  }

  async function moveTask(task: any, newStatus: string) {
    await supabase.from('tasks').update({ status: newStatus }).eq('id', task.id); load()
  }

  function openEdit(t: any) {
    setEditing(t); setForm({ title: t.title, description: t.description||'', status: t.status, priority: t.priority||'medium', due_date: t.due_date||'' }); setShowModal(true)
  }

  const today = new Date().toISOString().split('T')[0]
  const overdue = tasks.filter(t => t.status !== 'done' && t.due_date && t.due_date < today)

  const cardStyle = { background: 'rgba(13,13,20,0.82)', border: '1px solid rgba(255,255,255,0.065)', backdropFilter: 'blur(14px)', boxShadow: '0 4px 28px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04)' }
  const inputStyle: React.CSSProperties = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#e8e8f0', borderRadius: 10, padding: '9px 12px', fontSize: 13, outline: 'none', width: '100%', transition: 'border-color 0.15s ease', fontFamily: 'inherit' }
  const focus = (e: any) => e.currentTarget.style.borderColor = 'rgba(124,110,247,0.5)'
  const blur  = (e: any) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'

  if (loading) return <><AcernityFonts /><BackgroundGrid><FloatingOrbs /><div className="flex flex-col gap-5"><Skeleton className="h-9 w-32 rounded-xl" /><div className="grid grid-cols-3 gap-4">{[0,1,2].map(i=><Skeleton key={i} className="h-96 rounded-2xl"/>)}</div></div></BackgroundGrid></>

  return (
    <>
      <AcernityFonts />
      <BackgroundGrid>
        <FloatingOrbs />
        <div className="flex flex-col gap-5">

          {/* Header */}
          <motion.div {...fadeUp(0)} className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Syne, sans-serif' }}>Tarefas</h1>
              <p className="text-sm mt-0.5" style={{ color: '#4a4a6a' }}>
                {tasks.length} tarefa{tasks.length !== 1 ? 's' : ''}
                {overdue.length > 0 && <span style={{ color: '#f87171' }}> · {overdue.length} atrasada{overdue.length > 1 ? 's' : ''}</span>}
              </p>
            </div>
            <ShimmerButton onClick={() => { setEditing(null); setForm(EMPTY_FORM); setShowModal(true) }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: 'linear-gradient(135deg, #7c6ef7, #a06ef7)', color: 'white', boxShadow: '0 0 28px rgba(124,110,247,0.45), inset 0 1px 0 rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>
              <Plus size={15} /> Nova tarefa
            </ShimmerButton>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {COLUMNS.map(({ key, label, color }, i) => {
              const count = tasks.filter(t => t.status === key).length
              return (
                <motion.div key={key} {...fadeUp(0.06 + i * 0.05)}>
                  <SpotlightCard className="rounded-2xl" spotlightColor={`${color}12`} style={cardStyle}>
                    <div className="p-4 relative overflow-hidden">
                      <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full pointer-events-none" style={{ background: `${color}18`, filter: 'blur(18px)' }} />
                      <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#4a4a6a', letterSpacing: '0.1em' }}>{label}</p>
                      <p className="text-3xl font-bold" style={{ fontFamily: 'Syne, sans-serif', color, textShadow: `0 0 20px ${color}55` }}>{count}</p>
                    </div>
                  </SpotlightCard>
                </motion.div>
              )
            })}
          </div>

          {/* Kanban */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {COLUMNS.map(({ key, label, color, accent }, ci) => {
              const col = tasks.filter(t => t.status === key)
              return (
                <motion.div key={key} {...fadeUp(0.18 + ci * 0.06)}>
                  <div className="rounded-2xl overflow-hidden" style={{ ...cardStyle, minHeight: 200 }}>
                    {/* Column header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)', background: accent }}>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
                        <span className="text-sm font-semibold" style={{ color }}>{label}</span>
                      </div>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: `${color}18`, color }}>{col.length}</span>
                    </div>

                    {/* Tasks */}
                    <div className="p-3 flex flex-col gap-2">
                      <AnimatePresence>
                        {col.length === 0 && (
                          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="text-xs py-6 text-center" style={{ color: '#3a3a5c' }}>
                            Nenhuma tarefa
                          </motion.p>
                        )}
                        {col.map((task, ti) => {
                          const prio = PRIORITY[task.priority as keyof typeof PRIORITY] || PRIORITY.medium
                          const isOverdue = task.due_date && task.due_date < today
                          return (
                            <motion.div key={task.id}
                              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.2, delay: ti * 0.04 }}
                              className="rounded-xl p-3 group"
                              style={{ background: 'rgba(255,255,255,0.025)', border: `1px solid ${isOverdue ? 'rgba(248,113,113,0.2)' : 'rgba(255,255,255,0.06)'}`, transition: 'border-color 0.15s ease', boxShadow: isOverdue ? '0 0 12px rgba(248,113,113,0.08)' : 'none' }}>

                              <div className="flex items-start justify-between gap-2 mb-2">
                                <p className="text-sm font-medium leading-tight flex-1" style={{ color: '#d0d0e0' }}>{task.title}</p>
                                <span className="text-xs px-1.5 py-0.5 rounded-md shrink-0 font-semibold" style={{ background: `${prio.color}14`, color: prio.color, border: `1px solid ${prio.color}22` }}>
                                  {prio.label}
                                </span>
                              </div>

                              {task.description && <p className="text-xs mb-2 line-clamp-2" style={{ color: '#4a4a6a' }}>{task.description}</p>}

                              {task.due_date && (
                                <div className="flex items-center gap-1 mb-2">
                                  {isOverdue ? <AlertCircle size={11} style={{ color: '#f87171' }} /> : <Clock size={11} style={{ color: '#6b6b8a' }} />}
                                  <span className="text-xs" style={{ color: isOverdue ? '#f87171' : '#6b6b8a' }}>
                                    {new Date(task.due_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                    {isOverdue && ' · Atrasada'}
                                  </span>
                                </div>
                              )}

                              {/* Actions */}
                              <div className="flex items-center justify-between mt-2 pt-2 border-t opacity-0 group-hover:opacity-100 transition-opacity" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                                <div className="flex gap-1">
                                  {COLUMNS.filter(c => c.key !== key).map(nc => (
                                    <motion.button key={nc.key} whileTap={{ scale: 0.88 }}
                                      onClick={() => moveTask(task, nc.key)}
                                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs"
                                      style={{ background: `${nc.color}12`, color: nc.color, border: `1px solid ${nc.color}20`, cursor: 'pointer' }}>
                                      <ArrowRight size={9} /> {nc.label.split(' ')[0]}
                                    </motion.button>
                                  ))}
                                </div>
                                <div className="flex gap-1">
                                  <motion.button whileTap={{ scale: 0.88 }} onClick={() => openEdit(task)}
                                    className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'rgba(124,110,247,0.1)', color: '#9d8fff', cursor: 'pointer' }}>
                                    <Edit2 size={11} />
                                  </motion.button>
                                  <motion.button whileTap={{ scale: 0.88 }} onClick={() => handleDelete(task.id)}
                                    className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171', cursor: 'pointer' }}>
                                    {deleting === task.id ? <div className="w-2.5 h-2.5 rounded-full border border-current border-t-transparent animate-spin" /> : <Trash2 size={11} />}
                                  </motion.button>
                                </div>
                              </div>
                            </motion.div>
                          )
                        })}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
              style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)' }}
              onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
              <motion.div initial={{ y: 60, opacity: 0, scale: 0.97 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 60, opacity: 0 }}
                transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] as const }}
                className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6"
                style={{ background: 'rgba(10,10,18,0.98)', border: '1px solid rgba(124,110,247,0.22)', boxShadow: '0 0 0 1px rgba(124,110,247,0.08), 0 -8px 48px rgba(0,0,0,0.75)', backdropFilter: 'blur(24px)' }}>
                <div className="w-10 h-1 rounded-full mx-auto mb-5 sm:hidden" style={{ background: '#2a2a3e' }} />
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-bold text-lg" style={{ fontFamily: 'Syne, sans-serif', color: '#f0f0f8' }}>{editing ? 'Editar tarefa' : 'Nova tarefa'}</h2>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => { setShowModal(false); setEditing(null) }}
                    className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.05)', color: '#6b6b8a', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer' }}>
                    <X size={14} />
                  </motion.button>
                </div>
                <form onSubmit={handleSave} className="flex flex-col gap-3">
                  <input placeholder="Título da tarefa *" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} style={inputStyle} onFocus={focus} onBlur={blur} />
                  <textarea placeholder="Descrição (opcional)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'none' }} onFocus={focus} onBlur={blur} />
                  <div className="grid grid-cols-2 gap-3">
                    <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} style={{ ...inputStyle, background: 'rgba(13,13,20,0.95)' }}>
                      <option value="low">Prioridade: Baixa</option>
                      <option value="medium">Prioridade: Média</option>
                      <option value="high">Prioridade: Alta</option>
                    </select>
                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={{ ...inputStyle, background: 'rgba(13,13,20,0.95)' }}>
                      {COLUMNS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                    </select>
                  </div>
                  <input type="date" placeholder="Prazo (opcional)" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} style={inputStyle} onFocus={focus} onBlur={blur} />
                  <ShimmerButton type="submit" disabled={saving} className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm w-full mt-1"
                    style={{ background: 'linear-gradient(135deg, #7c6ef7, #a06ef7)', color: 'white', boxShadow: saving ? 'none' : '0 0 28px rgba(124,110,247,0.38)', border: '1px solid rgba(255,255,255,0.1)', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                    {saving ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : editing ? 'Salvar alterações' : 'Criar tarefa'}
                  </ShimmerButton>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </BackgroundGrid>
    </>
  )
}
