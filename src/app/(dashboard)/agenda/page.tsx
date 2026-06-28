'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Calendar, Plus, X, Edit2, Trash2, Clock, ChevronLeft, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { SpotlightCard, ShimmerButton, Skeleton, BackgroundGrid, FloatingOrbs, AcernityFonts } from '@/components/ui/aceternity'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16, filter: 'blur(4px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  transition: { duration: 0.46, delay, ease: [0.16, 1, 0.3, 1] as const },
})

const EVENT_COLORS = ['#7c6ef7','#34d399','#f87171','#fbbf24','#22d3ee','#a78bfa','#fb923c']
const DAYS_PT = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

const EMPTY_FORM = { title: '', description: '', start_at: '', end_at: '', color: '#7c6ef7', location: '' }

export default function AgendaPage() {
  const supabase = createClient()
  const router   = useRouter()
  const [loading, setLoading] = useState(true)
  const [biz, setBiz]         = useState<any>(null)
  const [events, setEvents]   = useState<any[]>([])
  const [current, setCurrent] = useState(new Date())
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm]       = useState(EMPTY_FORM)
  const [saving, setSaving]   = useState(false)
  const [deleting, setDeleting] = useState<string|null>(null)
  const [selectedDay, setSelectedDay] = useState<string|null>(null)

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/login'); return }
    const { data: owned } = await supabase.from('businesses').select('*').eq('owner_id', user.id)
    const business = (owned || [])[0]; if (!business) { setLoading(false); return }
    setBiz(business)
    const { data } = await supabase.from('events').select('*').eq('business_id', business.id).order('start_at')
    setEvents(data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    const payload = { ...form, end_at: form.end_at || null, location: form.location || null, description: form.description || null, business_id: biz.id }
    if (editing) await supabase.from('events').update(payload).eq('id', editing.id)
    else await supabase.from('events').insert(payload)
    setSaving(false); setShowModal(false); setEditing(null); setForm(EMPTY_FORM); load()
  }

  async function handleDelete(id: string) {
    setDeleting(id); await supabase.from('events').delete().eq('id', id); setDeleting(null); load()
  }

  function openEdit(ev: any) {
    setEditing(ev); setForm({ title: ev.title||'', description: ev.description||'', start_at: ev.start_at?.slice(0,16)||'', end_at: ev.end_at?.slice(0,16)||'', color: ev.color||'#7c6ef7', location: ev.location||'' }); setShowModal(true)
  }

  function openNewForDay(day: string) {
    setEditing(null)
    setForm({ ...EMPTY_FORM, start_at: `${day}T09:00`, end_at: `${day}T10:00` })
    setShowModal(true)
  }

  // Calendar helpers
  const year  = current.getFullYear()
  const month = current.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number|null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]

  function eventsForDay(day: number) {
    const key = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
    return events.filter(e => e.start_at?.startsWith(key))
  }

  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`
  const selectedEvents = selectedDay ? events.filter(e => e.start_at?.startsWith(selectedDay)) : []

  const cardStyle = { background: 'rgba(13,13,20,0.82)', border: '1px solid rgba(255,255,255,0.065)', backdropFilter: 'blur(14px)', boxShadow: '0 4px 28px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04)' }
  const inputStyle: React.CSSProperties = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#e8e8f0', borderRadius: 10, padding: '9px 12px', fontSize: 13, outline: 'none', width: '100%', transition: 'border-color 0.15s ease', fontFamily: 'inherit' }
  const focus = (e: any) => e.currentTarget.style.borderColor = 'rgba(124,110,247,0.5)'
  const blur  = (e: any) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'

  if (loading) return <><AcernityFonts /><BackgroundGrid><FloatingOrbs /><div className="flex flex-col gap-5"><Skeleton className="h-9 w-32 rounded-xl" /><Skeleton className="h-96 rounded-2xl" /></div></BackgroundGrid></>

  return (
    <>
      <AcernityFonts />
      <BackgroundGrid>
        <FloatingOrbs />
        <div className="flex flex-col gap-5">

          {/* Header */}
          <motion.div {...fadeUp(0)} className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Syne, sans-serif' }}>Agenda</h1>
              <p className="text-sm mt-0.5" style={{ color: '#4a4a6a' }}>{events.length} evento{events.length !== 1 ? 's' : ''} agendado{events.length !== 1 ? 's' : ''}</p>
            </div>
            <ShimmerButton onClick={() => { setEditing(null); setForm(EMPTY_FORM); setShowModal(true) }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: 'linear-gradient(135deg, #7c6ef7, #a06ef7)', color: 'white', boxShadow: '0 0 28px rgba(124,110,247,0.45), inset 0 1px 0 rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>
              <Plus size={15} /> Novo evento
            </ShimmerButton>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Calendar */}
            <motion.div {...fadeUp(0.1)} className="lg:col-span-2">
              <SpotlightCard className="rounded-2xl overflow-hidden" style={cardStyle}>
                {/* Month nav */}
                <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                  <h2 className="font-bold" style={{ fontFamily: 'Syne, sans-serif', color: '#e8e8f0' }}>
                    {MONTHS_PT[month]} {year}
                  </h2>
                  <div className="flex gap-2">
                    <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
                      onClick={() => setCurrent(new Date(year, month - 1, 1))}
                      className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)', color: '#9a9ab0', cursor: 'pointer' }}>
                      <ChevronLeft size={15} />
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
                      onClick={() => setCurrent(new Date())}
                      className="px-3 py-1 rounded-lg text-xs font-semibold" style={{ background: 'rgba(124,110,247,0.12)', color: '#9d8fff', border: '1px solid rgba(124,110,247,0.22)', cursor: 'pointer' }}>
                      Hoje
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
                      onClick={() => setCurrent(new Date(year, month + 1, 1))}
                      className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)', color: '#9a9ab0', cursor: 'pointer' }}>
                      <ChevronRight size={15} />
                    </motion.button>
                  </div>
                </div>

                <div className="p-4">
                  {/* Day headers */}
                  <div className="grid grid-cols-7 mb-2">
                    {DAYS_PT.map(d => (
                      <div key={d} className="text-center text-xs font-semibold py-1" style={{ color: '#4a4a6a' }}>{d}</div>
                    ))}
                  </div>
                  {/* Cells */}
                  <div className="grid grid-cols-7 gap-1">
                    {cells.map((day, idx) => {
                      if (!day) return <div key={idx} />
                      const dayStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
                      const dayEvents = eventsForDay(day)
                      const isToday   = dayStr === todayStr
                      const isSelected = dayStr === selectedDay
                      return (
                        <motion.button key={idx} whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
                          onClick={() => setSelectedDay(isSelected ? null : dayStr)}
                          className="rounded-xl p-1.5 flex flex-col items-center min-h-14"
                          style={{
                            background: isSelected ? 'rgba(124,110,247,0.18)' : isToday ? 'rgba(124,110,247,0.08)' : 'rgba(255,255,255,0.02)',
                            border: `1px solid ${isSelected ? 'rgba(124,110,247,0.4)' : isToday ? 'rgba(124,110,247,0.2)' : 'rgba(255,255,255,0.05)'}`,
                            cursor: 'pointer', transition: 'all 0.15s',
                            boxShadow: isSelected ? '0 0 16px rgba(124,110,247,0.2)' : 'none',
                          }}>
                          <span className="text-xs font-semibold" style={{ color: isToday || isSelected ? '#9d8fff' : '#8a8aaa' }}>{day}</span>
                          <div className="flex flex-wrap gap-0.5 justify-center mt-1">
                            {dayEvents.slice(0,3).map(ev => (
                              <div key={ev.id} className="w-1.5 h-1.5 rounded-full" style={{ background: ev.color || '#7c6ef7', boxShadow: `0 0 4px ${ev.color || '#7c6ef7'}` }} />
                            ))}
                          </div>
                        </motion.button>
                      )
                    })}
                  </div>
                </div>
              </SpotlightCard>
            </motion.div>

            {/* Sidebar: selected day or upcoming */}
            <motion.div {...fadeUp(0.18)}>
              <SpotlightCard className="rounded-2xl overflow-hidden h-full" style={cardStyle}>
                <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                  <h3 className="font-bold text-sm" style={{ fontFamily: 'Syne, sans-serif', color: '#e8e8f0' }}>
                    {selectedDay
                      ? new Date(selectedDay).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })
                      : 'Próximos eventos'}
                  </h3>
                </div>
                <div className="p-4 flex flex-col gap-2">
                  {(selectedDay ? selectedEvents : events.filter(e => e.start_at >= new Date().toISOString()).slice(0, 8)).map((ev, i) => (
                    <motion.div key={ev.id}
                      initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: i * 0.04 }}
                      className="rounded-xl p-3 group"
                      style={{ background: 'rgba(255,255,255,0.025)', border: `1px solid ${ev.color || '#7c6ef7'}20`, boxShadow: `0 0 10px ${ev.color || '#7c6ef7'}08` }}>
                      <div className="flex items-start gap-2.5">
                        <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: ev.color || '#7c6ef7', boxShadow: `0 0 6px ${ev.color || '#7c6ef7'}` }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: '#d0d0e0' }}>{ev.title}</p>
                          <p className="text-xs mt-0.5" style={{ color: '#4a4a6a' }}>
                            {new Date(ev.start_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            {ev.end_at && ` – ${new Date(ev.end_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
                          </p>
                          {ev.location && <p className="text-xs mt-0.5 truncate" style={{ color: '#4a4a6a' }}>📍 {ev.location}</p>}
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <motion.button whileTap={{ scale: 0.88 }} onClick={() => openEdit(ev)}
                            className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'rgba(124,110,247,0.1)', color: '#9d8fff', cursor: 'pointer' }}>
                            <Edit2 size={11} />
                          </motion.button>
                          <motion.button whileTap={{ scale: 0.88 }} onClick={() => handleDelete(ev.id)}
                            className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171', cursor: 'pointer' }}>
                            {deleting === ev.id ? <div className="w-2.5 h-2.5 rounded-full border border-current border-t-transparent animate-spin" /> : <Trash2 size={11} />}
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {(selectedDay ? selectedEvents : events.filter(e => e.start_at >= new Date().toISOString())).length === 0 && (
                    <div className="py-8 text-center">
                      <Calendar size={28} className="mx-auto mb-2" style={{ color: '#2a2a3e' }} />
                      <p className="text-xs" style={{ color: '#4a4a6a' }}>Nenhum evento</p>
                      {selectedDay && (
                        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                          onClick={() => openNewForDay(selectedDay)}
                          className="text-xs mt-3 px-3 py-1.5 rounded-lg"
                          style={{ background: 'rgba(124,110,247,0.1)', color: '#9d8fff', border: '1px solid rgba(124,110,247,0.2)', cursor: 'pointer' }}>
                          + Adicionar evento
                        </motion.button>
                      )}
                    </div>
                  )}
                </div>
              </SpotlightCard>
            </motion.div>
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
                  <h2 className="font-bold text-lg" style={{ fontFamily: 'Syne, sans-serif', color: '#f0f0f8' }}>{editing ? 'Editar evento' : 'Novo evento'}</h2>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => { setShowModal(false); setEditing(null) }}
                    className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.05)', color: '#6b6b8a', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer' }}>
                    <X size={14} />
                  </motion.button>
                </div>
                <form onSubmit={handleSave} className="flex flex-col gap-3">
                  <input placeholder="Título do evento *" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} style={inputStyle} onFocus={focus} onBlur={blur} />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: '#4a4a6a' }}>Início *</label>
                      <input type="datetime-local" required value={form.start_at} onChange={e => setForm({ ...form, start_at: e.target.value })} style={inputStyle} onFocus={focus} onBlur={blur} />
                    </div>
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: '#4a4a6a' }}>Fim</label>
                      <input type="datetime-local" value={form.end_at} onChange={e => setForm({ ...form, end_at: e.target.value })} style={inputStyle} onFocus={focus} onBlur={blur} />
                    </div>
                  </div>
                  <input placeholder="Local (opcional)" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} style={inputStyle} onFocus={focus} onBlur={blur} />
                  <textarea placeholder="Descrição (opcional)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'none' }} onFocus={focus} onBlur={blur} />
                  {/* Color picker */}
                  <div>
                    <label className="text-xs mb-2 block" style={{ color: '#4a4a6a' }}>Cor do evento</label>
                    <div className="flex gap-2 flex-wrap">
                      {EVENT_COLORS.map(c => (
                        <motion.button key={c} type="button" whileTap={{ scale: 0.88 }}
                          onClick={() => setForm({ ...form, color: c })}
                          className="w-7 h-7 rounded-lg"
                          style={{ background: c, boxShadow: form.color === c ? `0 0 14px ${c}` : 'none', border: form.color === c ? `2px solid rgba(255,255,255,0.6)` : '2px solid transparent', cursor: 'pointer', transition: 'all 0.15s' }} />
                      ))}
                    </div>
                  </div>
                  <ShimmerButton type="submit" disabled={saving} className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm w-full mt-1"
                    style={{ background: 'linear-gradient(135deg, #7c6ef7, #a06ef7)', color: 'white', boxShadow: saving ? 'none' : '0 0 28px rgba(124,110,247,0.38)', border: '1px solid rgba(255,255,255,0.1)', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                    {saving ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : editing ? 'Salvar alterações' : 'Criar evento'}
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
