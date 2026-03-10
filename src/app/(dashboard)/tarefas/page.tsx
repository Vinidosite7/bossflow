'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useBusiness } from '@/hooks/useBusiness'
import { useTour } from '@/hooks/useTour'
import { TourTooltip } from "@/components/TourTooltip"
import { CheckSquare, Plus, X, Pencil, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  SpotlightCard, ShimmerButton, Skeleton, BackgroundGrid, FloatingOrbs,
} from '@/components/ui/bossflow-ui'

const T = {
  bg: 'rgba(8,8,14,0.92)', bgDeep: 'rgba(6,6,10,0.97)',
  border: 'rgba(255,255,255,0.055)', borderP: 'rgba(124,110,247,0.22)',
  text: '#dcdcf0', sub: '#8a8aaa', muted: '#4a4a6a',
  green: '#34d399', red: '#f87171', amber: '#fbbf24',
  purple: '#7c6ef7', violet: '#a78bfa', cyan: '#22d3ee',
  blur: 'blur(20px)',
}
const card = { background: T.bg, border: `1px solid ${T.border}`, backdropFilter: T.blur, boxShadow: '0 4px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)' }
const inp: React.CSSProperties = { background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.border}`, color: T.text, borderRadius: 12, padding: '10px 14px', fontSize: 13, outline: 'none', width: '100%', transition: 'border-color 0.15s' }
const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: T.muted, letterSpacing: '0.06em', fontFamily: 'Syne, sans-serif', textTransform: 'uppercase', marginBottom: 6, display: 'block' }

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16, filter: 'blur(4px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  transition: { duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] as const },
})

const statusConfig = {
  todo:        { label: 'A fazer',       color: T.sub,   bg: 'rgba(138,138,170,0.1)',  border: 'rgba(138,138,170,0.2)'  },
  in_progress: { label: 'Em andamento',  color: T.amber, bg: 'rgba(251,191,36,0.1)',   border: 'rgba(251,191,36,0.2)'   },
  done:        { label: 'Concluída',     color: T.green, bg: 'rgba(52,211,153,0.1)',   border: 'rgba(52,211,153,0.2)'   },
}

const TOUR_STEPS = [
  { target: '[data-tour="tarefas-header"]',  title: 'Gerenciador de tarefas', description: 'Organize as atividades do seu negócio.', position: 'bottom' as const },
  { target: '[data-tour="tarefas-filtros"]', title: 'Filtros por status',     description: 'Filtre por A fazer, Em andamento ou Concluídas.', position: 'bottom' as const },
  { target: '[data-tour="tarefas-lista"]',   title: 'Lista de tarefas',       description: 'Clique no círculo para avançar o status. Tarefas atrasadas aparecem em vermelho.', position: 'top' as const },
]

const supabase = createClient()

function TarefasSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-2"><Skeleton className="h-8 w-32 rounded-xl" /><Skeleton className="h-4 w-40 rounded-lg" /></div>
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>
      <div className="flex gap-2"><Skeleton className="h-8 w-20 rounded-xl" /><Skeleton className="h-8 w-24 rounded-xl" /><Skeleton className="h-8 w-28 rounded-xl" /><Skeleton className="h-8 w-24 rounded-xl" /></div>
      <div className="flex flex-col gap-3">{[0,1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
    </div>
  )
}

export default function TarefasPage() {
  const supabase = createClient()
  const { businessId, loading: bizLoading } = useBusiness()
  const tour = useTour('tarefas', TOUR_STEPS)

  const [tasks, setTasks]             = useState<any[]>([])
  const [loading, setLoading]         = useState(true)
  const [filter, setFilter]           = useState('all')
  const [showForm, setShowForm]       = useState(false)
  const [editTask, setEditTask]       = useState<any>(null)
  const [saving, setSaving]           = useState(false)
  const [showConfirm, setShowConfirm] = useState<string | null>(null)
  const [form, setForm]               = useState({ title: '', description: '', due_date: '', status: 'todo' })

  async function load() {
    if (!businessId) return
    try {
      const { data } = await supabase.from('tasks').select('*').eq('business_id', businessId).order('created_at', { ascending: false })
      setTasks(data || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { if (businessId) load() }, [businessId])
  useEffect(() => { if (!bizLoading && !businessId) setLoading(false) }, [bizLoading, businessId])

  function openCreate() { setEditTask(null); setForm({ title: '', description: '', due_date: '', status: 'todo' }); setShowForm(true) }
  function openEdit(task: any) { setEditTask(task); setForm({ title: task.title, description: task.description || '', due_date: task.due_date || '', status: task.status }); setShowForm(true) }

  async function handleSave(e: React.FormEvent) {
  e.preventDefault(); setSaving(true)
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (!user) {
      console.error('[Tarefas] usuário não autenticado:', authError)
      return
    }

    const payload = { title: form.title, description: form.description || null, due_date: form.due_date || null, status: form.status }
    
    const { error } = editTask
      ? await supabase.from('tasks').update(payload).eq('id', editTask.id)
      : await supabase.from('tasks').insert({ ...payload, business_id: businessId, created_by: user.id })

    if (error) {
      console.error('[Tarefas] erro:', error.message, '|', error.details, '|', error.hint)
      return
    }

    setShowForm(false); setEditTask(null); load()
  } catch (err: any) {
    console.error('[Tarefas] catch:', err)
  } finally {
    setSaving(false)
  }
}

  async function toggleStatus(task: any) {
    const next = task.status === 'todo' ? 'in_progress' : task.status === 'in_progress' ? 'done' : 'todo'
    await supabase.from('tasks').update({ status: next }).eq('id', task.id); load()
  }

  async function handleDelete(id: string) { await supabase.from('tasks').delete().eq('id', id); setShowConfirm(null); load() }

  const filtered = tasks.filter(t => filter === 'all' || t.status === filter)
  const today    = new Date().toISOString().split('T')[0]
  const counts   = { all: tasks.length, todo: tasks.filter(t => t.status === 'todo').length, in_progress: tasks.filter(t => t.status === 'in_progress').length, done: tasks.filter(t => t.status === 'done').length }

  const FILTERS = [
    { key: 'all',         label: 'Todas' },
    { key: 'todo',        label: 'A fazer' },
    { key: 'in_progress', label: 'Em andamento' },
    { key: 'done',        label: 'Concluídas' },
  ]

  if (loading || bizLoading) return <BackgroundGrid><FloatingOrbs /><TarefasSkeleton /></BackgroundGrid>

  return (
    <BackgroundGrid>
      <FloatingOrbs />
      <div className="flex flex-col gap-5">
        <TourTooltip active={tour.active} step={tour.step} current={tour.current} total={tour.total} onNext={tour.next} onPrev={tour.prev} onFinish={tour.finish} />

        {/* Header */}
        <motion.div {...fadeUp(0)} className="flex items-start justify-between gap-4" data-tour="tarefas-header">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Syne, sans-serif', color: T.text }}>Tarefas</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: T.amber, animationDuration: '1.4s' }} />
                <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: T.amber, boxShadow: `0 0 6px ${T.amber}` }} />
              </div>
              <p className="text-sm" style={{ color: T.muted }}>{tasks.filter(t => t.status !== 'done').length} pendentes</p>
            </div>
          </div>
          <ShimmerButton onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold shrink-0"
            style={{ background: 'linear-gradient(135deg, #7c6ef7 0%, #a06ef7 100%)', color: 'white', boxShadow: '0 0 28px rgba(124,110,247,0.45), inset 0 1px 0 rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>
            <Plus size={15} /><span className="hidden sm:inline">Nova tarefa</span><span className="sm:hidden">Nova</span>
          </ShimmerButton>
        </motion.div>

        {/* Filtros */}
        <motion.div {...fadeUp(0.06)} className="flex gap-2 overflow-x-auto pb-1" data-tour="tarefas-filtros">
          {FILTERS.map(({ key, label }) => {
            const active = filter === key
            const s = statusConfig[key as keyof typeof statusConfig]
            const activeColor = s?.color || T.purple
            return (
              <motion.button key={key} whileTap={{ scale: 0.95 }} onClick={() => setFilter(key)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap"
                style={{ background: active ? `${activeColor}15` : 'rgba(255,255,255,0.03)', color: active ? activeColor : T.muted, border: `1px solid ${active ? `${activeColor}35` : T.border}`, transition: 'all 0.15s', cursor: 'pointer' }}>
                {label}
                <span className="px-1.5 py-0.5 rounded-full text-xs"
                  style={{ background: active ? `${activeColor}20` : 'rgba(255,255,255,0.06)', color: active ? activeColor : T.muted }}>
                  {counts[key as keyof typeof counts]}
                </span>
              </motion.button>
            )
          })}
        </motion.div>

        {/* Lista / Empty */}
        {filtered.length === 0 ? (
          <motion.div {...fadeUp(0.12)} className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: `${T.purple}08`, border: `1px solid ${T.purple}18`, boxShadow: `0 0 32px ${T.purple}10` }}>
              <CheckSquare size={28} style={{ color: T.purple }} />
            </div>
            <h2 className="text-xl font-bold" style={{ fontFamily: 'Syne, sans-serif', color: T.text }}>Nenhuma tarefa</h2>
            <p className="text-sm" style={{ color: T.muted }}>Crie sua primeira tarefa</p>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold mt-2"
              style={{ background: `${T.purple}12`, color: T.violet, border: `1px solid ${T.purple}28`, cursor: 'pointer' }}>
              <Plus size={14} /> Adicionar tarefa
            </motion.button>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-2.5" data-tour="tarefas-lista">
            <AnimatePresence initial={false}>
              {filtered.map((task, i) => {
                const s       = statusConfig[task.status as keyof typeof statusConfig]
                const overdue = task.due_date && task.due_date < today && task.status !== 'done'
                return (
                  <motion.div key={task.id}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.25, delay: i * 0.035 }} layout>
                    <SpotlightCard className="rounded-2xl" spotlightColor={overdue ? `${T.red}10` : `${s.color}0a`}
                      style={{ ...card, border: `1px solid ${overdue ? `${T.red}28` : T.border}`, padding: 0 }}>
                      <div className="flex items-start gap-3 p-4">
                        {/* Toggle status */}
                        <motion.button whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.85 }}
                          onClick={() => toggleStatus(task)}
                          className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5"
                          style={{ borderColor: task.status === 'done' ? T.green : task.status === 'in_progress' ? T.amber : 'rgba(255,255,255,0.12)', background: task.status === 'done' ? T.green : task.status === 'in_progress' ? `${T.amber}18` : 'transparent', transition: 'all 0.15s', cursor: 'pointer' }}>
                          <AnimatePresence>
                            {task.status === 'done' && (
                              <motion.span initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                                style={{ color: 'white', fontSize: 9, fontWeight: 800 }}>✓</motion.span>
                            )}
                            {task.status === 'in_progress' && (
                              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                                className="w-1.5 h-1.5 rounded-full" style={{ background: T.amber }} />
                            )}
                          </AnimatePresence>
                        </motion.button>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium" style={{ color: task.status === 'done' ? T.muted : T.text, textDecoration: task.status === 'done' ? 'line-through' : 'none' }}>
                            {task.title}
                          </p>
                          {task.description && <p className="text-xs mt-0.5 truncate" style={{ color: T.muted }}>{task.description}</p>}
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                              style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
                              {s.label}
                            </span>
                            {task.due_date && (
                              <span className="text-xs flex items-center gap-1" style={{ color: overdue ? T.red : T.muted }}>
                                {overdue && '⚠ '}{new Date(task.due_date).toLocaleDateString('pt-BR')}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-1.5 shrink-0">
                          <motion.button whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.9 }} onClick={() => openEdit(task)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center"
                            style={{ background: `${T.purple}10`, color: T.purple, border: `1px solid ${T.purple}22`, cursor: 'pointer' }}>
                            <Pencil size={12} />
                          </motion.button>
                          <motion.button whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.9 }} onClick={() => setShowConfirm(task.id)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center"
                            style={{ background: `${T.red}10`, color: T.red, border: `1px solid ${T.red}22`, cursor: 'pointer' }}>
                            <Trash2 size={12} />
                          </motion.button>
                        </div>
                      </div>
                    </SpotlightCard>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Modal Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
              style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)' }}
              onClick={e => { if (e.target === e.currentTarget) { setShowForm(false); setEditTask(null) } }}>
              <motion.div initial={{ y: 60, opacity: 0, scale: 0.97 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 60, opacity: 0 }}
                transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] as const }}
                className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6"
                style={{ background: T.bgDeep, border: `1px solid ${T.borderP}`, boxShadow: '0 0 0 1px rgba(124,110,247,0.08), 0 -8px 48px rgba(0,0,0,0.8)', backdropFilter: 'blur(28px)' }}>
                <div className="w-10 h-1 rounded-full mx-auto mb-5 sm:hidden" style={{ background: 'rgba(255,255,255,0.1)' }} />
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${T.purple}14`, border: `1px solid ${T.purple}28` }}>
                      <CheckSquare size={14} style={{ color: T.purple }} />
                    </div>
                    <h2 className="font-bold text-lg" style={{ fontFamily: 'Syne, sans-serif', color: T.text }}>{editTask ? 'Editar tarefa' : 'Nova tarefa'}</h2>
                  </div>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => { setShowForm(false); setEditTask(null) }}
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.05)', color: T.sub, border: `1px solid ${T.border}`, cursor: 'pointer' }}>
                    <X size={14} />
                  </motion.button>
                </div>
                <form onSubmit={handleSave} className="flex flex-col gap-3">
                  <input type="text" placeholder="Título da tarefa *" value={form.title} required onChange={e => setForm({ ...form, title: e.target.value })}
                    style={inp} onFocus={e => e.currentTarget.style.borderColor = T.borderP} onBlur={e => e.currentTarget.style.borderColor = T.border} />
                  <textarea placeholder="Descrição (opcional)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2}
                    style={{ ...inp, resize: 'none' }} onFocus={e => e.currentTarget.style.borderColor = T.borderP} onBlur={e => e.currentTarget.style.borderColor = T.border} />
                  <div className="grid grid-cols-2 gap-3">
                    <div><label style={lbl}>Prazo</label>
                      <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })}
                        style={inp} onFocus={e => e.currentTarget.style.borderColor = T.borderP} onBlur={e => e.currentTarget.style.borderColor = T.border} />
                    </div>
                    <div><label style={lbl}>Status</label>
                      <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                        style={{ ...inp, cursor: 'pointer' }}>
                        <option value="todo" style={{ background: '#0d0d14' }}>A fazer</option>
                        <option value="in_progress" style={{ background: '#0d0d14' }}>Em andamento</option>
                        <option value="done" style={{ background: '#0d0d14' }}>Concluída</option>
                      </select>
                    </div>
                  </div>
                  <ShimmerButton type="submit" disabled={saving}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm w-full mt-1"
                    style={{ background: 'linear-gradient(135deg, #7c6ef7, #a06ef7)', color: 'white', boxShadow: saving ? 'none' : '0 0 28px rgba(124,110,247,0.4)', border: '1px solid rgba(255,255,255,0.1)', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                    {saving ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : editTask ? 'Salvar alterações' : 'Criar tarefa'}
                  </ShimmerButton>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal Confirm */}
        <AnimatePresence>
          {showConfirm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)' }}>
              <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] as const }}
                className="w-full max-w-sm rounded-2xl p-6"
                style={{ background: T.bgDeep, border: 'rgba(248,113,113,0.22)', boxShadow: '0 24px 64px rgba(0,0,0,0.8)' }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)' }}>
                  <Trash2 size={20} style={{ color: T.red }} />
                </div>
                <h2 className="font-bold text-lg text-center mb-2" style={{ fontFamily: 'Syne, sans-serif', color: T.text }}>Excluir tarefa?</h2>
                <p className="text-sm text-center mb-6" style={{ color: T.muted }}>Esta ação não pode ser desfeita.</p>
                <div className="flex gap-3">
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => setShowConfirm(null)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                    style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}`, color: T.sub, cursor: 'pointer' }}>Cancelar</motion.button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => handleDelete(showConfirm!)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                    style={{ background: 'rgba(248,113,113,0.12)', color: T.red, border: '1px solid rgba(248,113,113,0.28)', cursor: 'pointer' }}>Excluir</motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </BackgroundGrid>
  )
}
