'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useBusiness } from '@/hooks/useBusiness'
import { useTour } from '@/hooks/useTour'
import { TourTooltip } from "@/components/TourTooltip"
import { CheckSquare, Plus, Loader2, X, Pencil, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay, ease: [0.25, 0.46, 0.45, 0.94] as const }
})

const statusConfig = {
  todo: { label: 'A fazer', color: '#6b6b8a', bg: 'rgba(107,107,138,0.1)' },
  in_progress: { label: 'Em andamento', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
  done: { label: 'Concluída', color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
}

const TOUR_STEPS = [
  {
    target: '[data-tour="tarefas-header"]',
    title: 'Gerenciador de tarefas',
    description: 'Organize as atividades do seu negócio. Clique em "Nova tarefa" para adicionar.',
    position: 'bottom' as const,
  },
  {
    target: '[data-tour="tarefas-filtros"]',
    title: 'Filtros por status',
    description: 'Filtre suas tarefas por A fazer, Em andamento ou Concluídas. O número mostra a quantidade em cada status.',
    position: 'bottom' as const,
  },
  {
    target: '[data-tour="tarefas-lista"]',
    title: 'Lista de tarefas',
    description: 'Clique no círculo para avançar o status da tarefa. Tarefas atrasadas aparecem em vermelho.',
    position: 'top' as const,
  },
]

export default function TarefasPage() {
  const supabase = createClient()
  const { businessId, loading: bizLoading } = useBusiness()
  const tour = useTour('tarefas', TOUR_STEPS)

  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editTask, setEditTask] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [showConfirm, setShowConfirm] = useState<string | null>(null)
  const [form, setForm] = useState({ title: '', description: '', due_date: '', status: 'todo' })

  async function load() {
    if (!businessId) return
    try {
      const { data } = await supabase.from('tasks').select('*')
        .eq('business_id', businessId).order('created_at', { ascending: false })
      setTasks(data || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { if (businessId) load() }, [businessId])
  useEffect(() => { if (!bizLoading && !businessId) setLoading(false) }, [bizLoading, businessId])

  function openCreate() {
    setEditTask(null)
    setForm({ title: '', description: '', due_date: '', status: 'todo' })
    setShowForm(true)
  }

  function openEdit(task: any) {
    setEditTask(task)
    setForm({ title: task.title, description: task.description || '', due_date: task.due_date || '', status: task.status })
    setShowForm(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const payload = {
      title: form.title, description: form.description || null,
      due_date: form.due_date || null, status: form.status,
    }
    if (editTask) {
      await supabase.from('tasks').update(payload).eq('id', editTask.id)
    } else {
      await supabase.from('tasks').insert({ ...payload, business_id: businessId, assigned_to: user?.id })
    }
    setShowForm(false); setEditTask(null); setSaving(false); load()
  }

  async function toggleStatus(task: any) {
    const next = task.status === 'todo' ? 'in_progress' : task.status === 'in_progress' ? 'done' : 'todo'
    await supabase.from('tasks').update({ status: next }).eq('id', task.id)
    load()
  }

  async function handleDelete(id: string) {
    await supabase.from('tasks').delete().eq('id', id)
    setShowConfirm(null); load()
  }

  const filtered = tasks.filter(t => filter === 'all' || t.status === filter)
  const today = new Date().toISOString().split('T')[0]
  const counts = {
    all: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    done: tasks.filter(t => t.status === 'done').length,
  }

  if (loading || bizLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: '#7c6ef7', borderTopColor: 'transparent' }} />
    </div>
  )

  return (
    <div className="flex flex-col gap-6">
      <TourTooltip active={tour.active} step={tour.step} current={tour.current} total={tour.total} onNext={tour.next} onPrev={tour.prev} onFinish={tour.finish} />

      <motion.div {...fadeUp(0)} className="flex items-center justify-between" data-tour="tarefas-header">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>Tarefas</h1>
          <p className="text-sm mt-1" style={{ color: '#4a4a6a' }}>{tasks.filter(t => t.status !== 'done').length} pendentes</p>
        </div>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ background: '#7c6ef7', color: 'white', boxShadow: '0 0 20px rgba(124,110,247,0.3)' }}>
          <Plus size={15} /> <span className="hidden sm:inline">Nova tarefa</span><span className="sm:hidden">Novo</span>
        </motion.button>
      </motion.div>

      <motion.div {...fadeUp(0.07)} className="flex gap-2 overflow-x-auto pb-1" data-tour="tarefas-filtros">
        {[
          { key: 'all', label: 'Todas' },
          { key: 'todo', label: 'A fazer' },
          { key: 'in_progress', label: 'Em andamento' },
          { key: 'done', label: 'Concluídas' },
        ].map(({ key, label }) => (
          <motion.button key={key} whileTap={{ scale: 0.95 }} onClick={() => setFilter(key)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all"
            style={{
              background: filter === key ? '#7c6ef7' : '#111118',
              color: filter === key ? 'white' : '#6b6b8a',
              border: `1px solid ${filter === key ? '#7c6ef7' : '#1e1e2e'}`,
            }}>
            {label}
            <span className="px-1.5 py-0.5 rounded-full text-xs"
              style={{ background: filter === key ? 'rgba(255,255,255,0.2)' : '#1e1e2e', color: filter === key ? 'white' : '#4a4a6a' }}>
              {counts[key as keyof typeof counts]}
            </span>
          </motion.button>
        ))}
      </motion.div>

      {/* Modais */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            style={{ background: 'rgba(0,0,0,0.8)' }}
            onClick={e => { if (e.target === e.currentTarget) { setShowForm(false); setEditTask(null) } }}>
            <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as const }}
              className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl border p-6"
              style={{ background: '#111118', borderColor: '#1e1e2e' }}>
              <div className="w-10 h-1 rounded-full mx-auto mb-5 sm:hidden" style={{ background: '#2a2a3e' }} />
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-lg" style={{ fontFamily: 'Syne, sans-serif' }}>
                  {editTask ? 'Editar tarefa' : 'Nova tarefa'}
                </h2>
                <button onClick={() => { setShowForm(false); setEditTask(null) }} style={{ color: '#4a4a6a' }}><X size={18} /></button>
              </div>
              <form onSubmit={handleSave} className="flex flex-col gap-4">
                <input type="text" placeholder="Título da tarefa *" value={form.title} required
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="px-3 py-3 rounded-xl border text-sm outline-none"
                  style={{ background: '#0d0d14', borderColor: '#1e1e2e', color: '#e8e8f0' }} />
                <textarea placeholder="Descrição (opcional)" value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })} rows={2}
                  className="px-3 py-3 rounded-xl border text-sm outline-none resize-none"
                  style={{ background: '#0d0d14', borderColor: '#1e1e2e', color: '#e8e8f0' }} />
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium" style={{ color: '#6b6b8a' }}>Prazo (opcional)</label>
                    <input type="date" value={form.due_date}
                      onChange={e => setForm({ ...form, due_date: e.target.value })}
                      className="px-3 py-3 rounded-xl border text-sm outline-none"
                      style={{ background: '#0d0d14', borderColor: '#1e1e2e', color: '#e8e8f0' }} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium" style={{ color: '#6b6b8a' }}>Status</label>
                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                      className="px-3 py-3 rounded-xl border text-sm outline-none"
                      style={{ background: '#0d0d14', borderColor: '#1e1e2e', color: '#e8e8f0' }}>
                      <option value="todo">A fazer</option>
                      <option value="in_progress">Em andamento</option>
                      <option value="done">Concluída</option>
                    </select>
                  </div>
                </div>
                <button type="submit" disabled={saving}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm mt-2"
                  style={{ background: '#7c6ef7', color: 'white' }}>
                  {saving ? <Loader2 size={16} className="animate-spin" /> : editTask ? 'Salvar alterações' : 'Criar tarefa'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm rounded-2xl border p-6" style={{ background: '#111118', borderColor: '#1e1e2e' }}>
              <h2 className="font-bold text-lg mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>Excluir tarefa?</h2>
              <p className="text-sm mb-6" style={{ color: '#6b6b8a' }}>Esta ação não pode ser desfeita.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowConfirm(null)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: '#0d0d14', border: '1px solid #1e1e2e', color: '#6b6b8a' }}>Cancelar</button>
                <button onClick={() => handleDelete(showConfirm!)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: 'rgba(248,113,113,0.15)', color: '#f87171', border: '1px solid rgba(248,113,113,0.3)' }}>Excluir</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {filtered.length === 0 ? (
        <motion.div {...fadeUp(0.12)} className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(124,110,247,0.1)', border: '1px solid rgba(124,110,247,0.2)' }}>
            <CheckSquare size={32} style={{ color: '#7c6ef7' }} />
          </div>
          <h2 className="text-xl font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>Nenhuma tarefa</h2>
          <p style={{ color: '#4a4a6a' }}>Crie sua primeira tarefa</p>
        </motion.div>
      ) : (
        <div className="flex flex-col gap-3" data-tour="tarefas-lista">
          <AnimatePresence initial={false}>
            {filtered.map((task, i) => {
              const s = statusConfig[task.status as keyof typeof statusConfig]
              const overdue = task.due_date && task.due_date < today && task.status !== 'done'
              return (
                <motion.div key={task.id}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.04 }}
                  layout
                  className="rounded-2xl p-4 flex items-start gap-3"
                  style={{ background: '#111118', border: `1px solid ${overdue ? 'rgba(248,113,113,0.3)' : '#1e1e2e'}` }}>
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.85 }}
                    onClick={() => toggleStatus(task)}
                    className="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors"
                    style={{
                      borderColor: task.status === 'done' ? '#34d399' : task.status === 'in_progress' ? '#fbbf24' : '#2a2a3e',
                      background: task.status === 'done' ? '#34d399' : task.status === 'in_progress' ? 'rgba(251,191,36,0.15)' : 'transparent',
                    }}>
                    <AnimatePresence>
                      {task.status === 'done' && (
                        <motion.span initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                          className="text-white text-xs">✓</motion.span>
                      )}
                      {task.status === 'in_progress' && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                          className="w-2 h-2 rounded-full" style={{ background: '#fbbf24' }} />
                      )}
                    </AnimatePresence>
                  </motion.button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{
                      color: task.status === 'done' ? '#4a4a6a' : '#e8e8f0',
                      textDecoration: task.status === 'done' ? 'line-through' : 'none',
                    }}>{task.title}</p>
                    {task.description && (
                      <p className="text-xs mt-0.5 truncate" style={{ color: '#4a4a6a' }}>{task.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: s.bg, color: s.color }}>{s.label}</span>
                      {task.due_date && (
                        <span className="text-xs" style={{ color: overdue ? '#f87171' : '#4a4a6a' }}>
                          {overdue ? '⚠ ' : ''}{new Date(task.due_date).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      onClick={() => openEdit(task)} className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ background: 'rgba(124,110,247,0.1)', color: '#7c6ef7' }}>
                      <Pencil size={12} />
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      onClick={() => setShowConfirm(task.id)} className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171' }}>
                      <Trash2 size={12} />
                    </motion.button>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}