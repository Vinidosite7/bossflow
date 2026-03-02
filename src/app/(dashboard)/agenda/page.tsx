'use client'
// AGENDA
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useBusiness } from '@/hooks/useBusiness'
import { Calendar, Plus, Loader2, X, Clock, Pencil, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay, ease: [0.25, 0.46, 0.45, 0.94] as const }
})

export default function AgendaPage() {
  const supabase = createClient()
  const { businessId, loading: bizLoading } = useBusiness()
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editEvent, setEditEvent] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [showConfirm, setShowConfirm] = useState<string | null>(null)
  const [form, setForm] = useState({ title: '', description: '', date: '', time: '' })

  async function load() {
    if (!businessId) return
    try {
      const { data } = await supabase.from('events').select('*')
        .eq('business_id', businessId).order('start_at', { ascending: true })
      setEvents(data || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { if (businessId) load() }, [businessId])
  useEffect(() => { if (!bizLoading && !businessId) setLoading(false) }, [bizLoading, businessId])

  function openCreate() {
    setEditEvent(null)
    setForm({ title: '', description: '', date: '', time: '' })
    setShowForm(true)
  }

  function openEdit(ev: any) {
    setEditEvent(ev)
    const d = new Date(ev.start_at)
    setForm({ title: ev.title, description: ev.description || '', date: d.toISOString().split('T')[0], time: d.toTimeString().slice(0, 5) })
    setShowForm(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const start_at = form.time ? new Date(`${form.date}T${form.time}`).toISOString() : new Date(`${form.date}T00:00`).toISOString()
    if (editEvent) {
      await supabase.from('events').update({ title: form.title, description: form.description || null, start_at }).eq('id', editEvent.id)
    } else {
      await supabase.from('events').insert({ title: form.title, description: form.description || null, start_at, business_id: businessId, created_by: user?.id })
    }
    setShowForm(false); setEditEvent(null); setSaving(false); load()
  }

  async function handleDelete(id: string) {
    await supabase.from('events').delete().eq('id', id)
    setShowConfirm(null); load()
  }

  const now = new Date()
  const upcoming = events.filter(e => new Date(e.start_at) >= now)
  const past = events.filter(e => new Date(e.start_at) < now)

  function formatDate(d: string) {
    const date = new Date(d)
    const hasTime = date.getHours() !== 0 || date.getMinutes() !== 0
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', ...(hasTime ? { hour: '2-digit', minute: '2-digit' } : {}) })
  }

  if (loading || bizLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: '#7c6ef7', borderTopColor: 'transparent' }} />
    </div>
  )

  return (
    <div className="flex flex-col gap-6">
      <motion.div {...fadeUp(0)} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>Agenda</h1>
          <p className="text-sm mt-1" style={{ color: '#4a4a6a' }}>{upcoming.length} eventos próximos</p>
        </div>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ background: '#7c6ef7', color: 'white', boxShadow: '0 0 20px rgba(124,110,247,0.3)' }}>
          <Plus size={15} /> <span className="hidden sm:inline">Novo evento</span><span className="sm:hidden">Novo</span>
        </motion.button>
      </motion.div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            style={{ background: 'rgba(0,0,0,0.8)' }}
            onClick={e => { if (e.target === e.currentTarget) { setShowForm(false); setEditEvent(null) } }}>
            <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as const }}
              className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl border p-6"
              style={{ background: '#111118', borderColor: '#1e1e2e' }}>
              <div className="w-10 h-1 rounded-full mx-auto mb-5 sm:hidden" style={{ background: '#2a2a3e' }} />
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-lg" style={{ fontFamily: 'Syne, sans-serif' }}>{editEvent ? 'Editar evento' : 'Novo evento'}</h2>
                <button onClick={() => { setShowForm(false); setEditEvent(null) }} style={{ color: '#4a4a6a' }}><X size={18} /></button>
              </div>
              <form onSubmit={handleSave} className="flex flex-col gap-4">
                <input type="text" placeholder="Título do evento *" value={form.title} required onChange={e => setForm({ ...form, title: e.target.value })}
                  className="px-3 py-3 rounded-xl border text-sm outline-none" style={{ background: '#0d0d14', borderColor: '#1e1e2e', color: '#e8e8f0' }} />
                <textarea placeholder="Descrição (opcional)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2}
                  className="px-3 py-3 rounded-xl border text-sm outline-none resize-none" style={{ background: '#0d0d14', borderColor: '#1e1e2e', color: '#e8e8f0' }} />
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium" style={{ color: '#6b6b8a' }}>Data *</label>
                    <input type="date" value={form.date} required onChange={e => setForm({ ...form, date: e.target.value })}
                      className="px-3 py-3 rounded-xl border text-sm outline-none" style={{ background: '#0d0d14', borderColor: '#1e1e2e', color: '#e8e8f0' }} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium" style={{ color: '#6b6b8a' }}>Hora (opcional)</label>
                    <input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })}
                      className="px-3 py-3 rounded-xl border text-sm outline-none" style={{ background: '#0d0d14', borderColor: '#1e1e2e', color: '#e8e8f0' }} />
                  </div>
                </div>
                <button type="submit" disabled={saving}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm mt-2"
                  style={{ background: '#7c6ef7', color: 'white' }}>
                  {saving ? <Loader2 size={16} className="animate-spin" /> : editEvent ? 'Salvar alterações' : 'Criar evento'}
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
              <h2 className="font-bold text-lg mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>Excluir evento?</h2>
              <p className="text-sm mb-6" style={{ color: '#6b6b8a' }}>Esta ação não pode ser desfeita.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowConfirm(null)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: '#0d0d14', border: '1px solid #1e1e2e', color: '#6b6b8a' }}>Cancelar</button>
                <button onClick={() => handleDelete(showConfirm)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: 'rgba(248,113,113,0.15)', color: '#f87171', border: '1px solid rgba(248,113,113,0.3)' }}>Excluir</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {events.length === 0 ? (
        <motion.div {...fadeUp(0.1)} className="flex flex-col items-center justify-center py-24 gap-4">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.4, delay: 0.15 }}
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(124,110,247,0.1)', border: '1px solid rgba(124,110,247,0.2)' }}>
            <Calendar size={32} style={{ color: '#7c6ef7' }} />
          </motion.div>
          <h2 className="text-xl font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>Nenhum evento ainda</h2>
          <p style={{ color: '#4a4a6a' }}>Crie seu primeiro evento na agenda</p>
        </motion.div>
      ) : (
        <div className="flex flex-col gap-6">
          {upcoming.length > 0 && (
            <motion.div {...fadeUp(0.1)}>
              <h2 className="font-bold mb-3 text-xs uppercase tracking-widest" style={{ color: '#4a4a6a' }}>Próximos</h2>
              <div className="flex flex-col gap-3">
                <AnimatePresence initial={false}>
                  {upcoming.map((ev, i) => (
                    <motion.div key={ev.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.25, delay: i * 0.05 }}
                      whileHover={{ x: 2 }}
                      className="rounded-2xl p-4 flex items-start gap-3"
                      style={{ background: '#111118', border: '1px solid rgba(124,110,247,0.3)' }}>
                      <motion.div whileHover={{ rotate: 15, scale: 1.1 }}
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: 'rgba(124,110,247,0.1)' }}>
                        <Calendar size={16} style={{ color: '#7c6ef7' }} />
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm" style={{ color: '#e8e8f0' }}>{ev.title}</p>
                        {ev.description && <p className="text-xs mt-0.5 truncate" style={{ color: '#4a4a6a' }}>{ev.description}</p>}
                        <div className="flex items-center gap-1 mt-2 text-xs" style={{ color: '#9d8fff' }}>
                          <Clock size={11} />{formatDate(ev.start_at)}
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                          onClick={() => openEdit(ev)} className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{ background: 'rgba(124,110,247,0.1)', color: '#7c6ef7' }}>
                          <Pencil size={12} />
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                          onClick={() => setShowConfirm(ev.id)} className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171' }}>
                          <Trash2 size={12} />
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
          {past.length > 0 && (
            <motion.div {...fadeUp(upcoming.length > 0 ? 0.2 : 0.1)}>
              <h2 className="font-bold mb-3 text-xs uppercase tracking-widest" style={{ color: '#4a4a6a' }}>Passados</h2>
              <div className="flex flex-col gap-3">
                {past.slice(0, 5).map((ev, i) => (
                  <motion.div key={ev.id}
                    initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} transition={{ delay: i * 0.04 }}
                    className="rounded-2xl p-4 flex items-start gap-3"
                    style={{ background: '#111118', border: '1px solid #1e1e2e' }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#0d0d14' }}>
                      <Calendar size={16} style={{ color: '#4a4a6a' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm" style={{ color: '#d0d0e0' }}>{ev.title}</p>
                      <div className="flex items-center gap-1 mt-1 text-xs" style={{ color: '#4a4a6a' }}>
                        <Clock size={11} />{formatDate(ev.start_at)}
                      </div>
                    </div>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      onClick={() => setShowConfirm(ev.id)} className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171' }}>
                      <Trash2 size={12} />
                    </motion.button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  )
}
