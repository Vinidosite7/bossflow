'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useBusiness } from '@/hooks/useBusiness'
import { sendPush } from '@/lib/push'
import { Calendar, Plus, X, Clock, Pencil, Trash2, CalendarDays } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { SpotlightCard, ShimmerButton, Skeleton } from '@/components/ui/bossflow-ui'

// ── Design System ──────────────────────────────────────────────────────────
import { T, card, inp, inpLg, inpSm, SYNE } from '@/lib/design'
import { fadeUp, scaleIn } from '@/lib/animations'

import { PageBackground, SectionHeader, FormModal, ModalSubmitButton } from '@/components/core'
const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: T.muted, letterSpacing: '0.06em', fontFamily: SYNE, textTransform: 'uppercase', marginBottom: 6, display: 'block' }

function AgendaSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-2"><Skeleton className="h-8 w-28 rounded-xl" /><Skeleton className="h-4 w-44 rounded-lg" /></div>
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>
      <div className="flex flex-col gap-3">{[0,1,2].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
    </div>
  )
}

// ── FIX: supabase client criado fora do componente (evita recriação a cada render)
const supabase = createClient()

export default function AgendaPage() {
  const { businessId, loading: bizLoading } = useBusiness()
  const [events, setEvents]           = useState<any[]>([])
  const [loading, setLoading]         = useState(true)
  const [showForm, setShowForm]       = useState(false)
  const [editEvent, setEditEvent]     = useState<any>(null)
  const [saving, setSaving]           = useState(false)
  const [showConfirm, setShowConfirm] = useState<string | null>(null)
  const [form, setForm]               = useState({ title: '', description: '', date: '', time: '' })

  async function load() {
    if (!businessId) return
    try {
      const { data } = await supabase.from('events').select('*').eq('business_id', businessId).order('start_at', { ascending: true })
      setEvents(data || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { if (businessId) load() }, [businessId])
  useEffect(() => { if (!bizLoading && !businessId) setLoading(false) }, [bizLoading, businessId])

  function openCreate() { setEditEvent(null); setForm({ title: '', description: '', date: '', time: '' }); setShowForm(true) }
  function openEdit(ev: any) {
    setEditEvent(ev)
    const d = new Date(ev.start_at)
    setForm({ title: ev.title, description: ev.description || '', date: d.toISOString().split('T')[0], time: d.toTimeString().slice(0, 5) })
    setShowForm(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const start_at = form.time
        ? new Date(`${form.date}T${form.time}`).toISOString()
        : new Date(`${form.date}T00:00`).toISOString()
      if (editEvent) {
        await supabase.from('events').update({ title: form.title, description: form.description || null, start_at }).eq('id', editEvent.id)
      } else {
        await supabase.from('events').insert({ title: form.title, description: form.description || null, start_at, business_id: businessId, created_by: user?.id })
        if (user) {
          const dateStr = new Date(start_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: form.time ? '2-digit' : undefined, minute: form.time ? '2-digit' : undefined })
          await sendPush(user.id, '📅 Evento agendado!', `${form.title} · ${dateStr}`, '/agenda')
        }
      }
      setShowForm(false); setEditEvent(null); load()
    } catch (err: any) {
      console.error('[Agenda] save:', err)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) { await supabase.from('events').delete().eq('id', id); setShowConfirm(null); load() }

  const now      = new Date()
  const upcoming = events.filter(e => new Date(e.start_at) >= now)
  const past     = events.filter(e => new Date(e.start_at) < now)

  function formatDate(d: string) {
    const date    = new Date(d)
    const hasTime = date.getHours() !== 0 || date.getMinutes() !== 0
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', ...(hasTime ? { hour: '2-digit', minute: '2-digit' } : {}) })
  }

  if (loading || bizLoading) return <PageBackground><AgendaSkeleton /></PageBackground>

  return (
    <PageBackground>
      <div className="flex flex-col gap-5">

        {/* Header */}
        <SectionHeader
          title="Agenda"
          subtitle={`${upcoming.length} evento${upcoming.length !== 1 ? 's' : ''} próximo${upcoming.length !== 1 ? 's' : ''}`}
          live liveColor={T.cyan}
          cta={{ label: 'Novo evento', labelMobile: 'Novo', icon: Plus, onClick: openCreate }}
        />

        {/* Empty */}
        {events.length === 0 ? (
          <motion.div {...fadeUp(0.1)} className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: `${T.cyan}08`, border: `1px solid ${T.cyan}18`, boxShadow: `0 0 32px ${T.cyan}10` }}>
              <Calendar size={28} style={{ color: T.cyan }} />
            </div>
            <h2 className="text-xl font-bold" style={{ fontFamily: SYNE, color: T.text }}>Nenhum evento ainda</h2>
            <p className="text-sm" style={{ color: T.muted }}>Crie seu primeiro evento na agenda</p>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold mt-2"
              style={{ background: `${T.cyan}10`, color: T.cyan, border: `1px solid ${T.cyan}25`, cursor: 'pointer' }}>
              <Plus size={14} /> Criar evento
            </motion.button>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Próximos */}
            {upcoming.length > 0 && (
              <motion.div {...fadeUp(0.08)}>
                <p className="text-xs font-semibold uppercase tracking-widest mb-3"
                  style={{ color: T.muted, fontFamily: SYNE, letterSpacing: '0.1em' }}>Próximos</p>
                <div className="flex flex-col gap-2.5">
                  <AnimatePresence initial={false}>
                    {upcoming.map((ev, i) => (
                      <motion.div key={ev.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.25, delay: i * 0.04 }}>
                        <SpotlightCard className="rounded-2xl" spotlightColor={`${T.cyan}0c`}
                          style={{ ...card, border: `1px solid ${T.cyan}20`, padding: 0 }}>
                          <motion.div whileHover={{ x: 2 }} className="flex items-start gap-3 p-4">
                            <motion.div whileHover={{ rotate: 12, scale: 1.08 }}
                              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                              style={{ background: `${T.cyan}12`, border: `1px solid ${T.cyan}22`, boxShadow: `0 0 12px ${T.cyan}10` }}>
                              <CalendarDays size={14} style={{ color: T.cyan }} />
                            </motion.div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm" style={{ color: T.text }}>{ev.title}</p>
                              {ev.description && <p className="text-xs mt-0.5 truncate" style={{ color: T.muted }}>{ev.description}</p>}
                              <div className="flex items-center gap-1 mt-2 text-xs" style={{ color: T.cyan }}>
                                <Clock size={10} /> {formatDate(ev.start_at)}
                              </div>
                            </div>
                            <div className="flex gap-1.5 shrink-0">
                              <motion.button whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.9 }} onClick={() => openEdit(ev)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center"
                                style={{ background: `${T.purple}10`, color: T.purple, border: `1px solid ${T.purple}22`, cursor: 'pointer' }}>
                                <Pencil size={12} />
                              </motion.button>
                              <motion.button whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.9 }} onClick={() => setShowConfirm(ev.id)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center"
                                style={{ background: `${T.red}10`, color: T.red, border: `1px solid ${T.red}22`, cursor: 'pointer' }}>
                                <Trash2 size={12} />
                              </motion.button>
                            </div>
                          </motion.div>
                        </SpotlightCard>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

            {/* Passados */}
            {past.length > 0 && (
              <motion.div {...fadeUp(upcoming.length > 0 ? 0.16 : 0.08)}>
                <p className="text-xs font-semibold uppercase tracking-widest mb-3"
                  style={{ color: T.muted, fontFamily: SYNE, letterSpacing: '0.1em' }}>Passados</p>
                <div className="flex flex-col gap-2.5">
                  {past.slice(0, 5).map((ev, i) => (
                    <motion.div key={ev.id} initial={{ opacity: 0 }} animate={{ opacity: 0.45 }} transition={{ delay: i * 0.04 }}>
                      <SpotlightCard className="rounded-2xl" style={{ ...card, padding: 0 }}>
                        <div className="flex items-start gap-3 p-4">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.border}` }}>
                            <Calendar size={14} style={{ color: T.muted }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm" style={{ color: T.sub }}>{ev.title}</p>
                            <div className="flex items-center gap-1 mt-1 text-xs" style={{ color: T.muted }}>
                              <Clock size={10} /> {formatDate(ev.start_at)}
                            </div>
                          </div>
                          <motion.button whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.9 }} onClick={() => setShowConfirm(ev.id)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                            style={{ background: `${T.red}10`, color: T.red, border: `1px solid ${T.red}22`, cursor: 'pointer' }}>
                            <Trash2 size={12} />
                          </motion.button>
                        </div>
                      </SpotlightCard>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Modal Form */}
                <FormModal
          open={showForm}
          onClose={() => { setShowForm(false); setEditEvent && setEditEvent(null) }}
          title={editEvent ? 'Editar evento' : 'Novo evento'}
          size="sm"
        >
          <form onSubmit={handleSave} className="flex flex-col gap-3">
            <input type="text" placeholder="Título do evento *" value={form.title} required onChange={e => setForm({ ...form, title: e.target.value })}
              style={inp} onFocus={e => e.currentTarget.style.borderColor = T.borderP} onBlur={e => e.currentTarget.style.borderColor = T.border} />
            <textarea placeholder="Descrição (opcional)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2}
              style={{ ...inp, resize: 'none' }} onFocus={e => e.currentTarget.style.borderColor = T.borderP} onBlur={e => e.currentTarget.style.borderColor = T.border} />
            <div className="grid grid-cols-2 gap-3">
              <div><label style={lbl}>Data *</label>
                <input type="date" value={form.date} required onChange={e => setForm({ ...form, date: e.target.value })}
                  style={inp} onFocus={e => e.currentTarget.style.borderColor = T.borderP} onBlur={e => e.currentTarget.style.borderColor = T.border} />
              </div>
              <div><label style={lbl}>Hora <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(opcional)</span></label>
                <input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })}
                  style={inp} onFocus={e => e.currentTarget.style.borderColor = T.borderP} onBlur={e => e.currentTarget.style.borderColor = T.border} />
              </div>
            </div>
            <ModalSubmitButton loading={saving}>
              editEvent ? 'Salvar alterações' : 'Criar evento'
            </ModalSubmitButton>
          </form>
        </FormModal>

        {/* Modal Confirm */}
                <FormModal
          open={!!showConfirm}
          onClose={() => setShowConfirm(null)}
          title="Excluir evento?"
          size="sm"
        >
          <p className="text-sm text-center mb-5" style={{ color: T.muted }}>
            Esta ação não pode ser desfeita.
          </p>
          <div className="flex gap-3">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => setShowConfirm(null)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}`, color: T.sub, cursor: 'pointer' }}>
              Cancelar
            </motion.button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => handleDelete(showConfirm!)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: `${T.red}12`, color: T.red, border: `1px solid ${T.red}28`, cursor: 'pointer' }}>
              Excluir
            </motion.button>
          </div>
        </FormModal>
      </div>
    </PageBackground>
  )
}
