'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useBusiness } from '@/hooks/useBusiness'
import { useTour } from '@/hooks/useTour'
import { TourTooltip } from "@/components/TourTooltip"
import { Users, Plus, Loader2, X, Pencil, Trash2, Search, UserCheck, Phone, Mail, FileText } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  SpotlightCard,
  ShimmerButton,
  Skeleton,
  BackgroundGrid,
  FloatingOrbs,
  GlowCorner,
} from '@/components/ui/bossflow-ui'

// ─── Design tokens (mesmo padrão da dash) ─────────────────────
const T = {
  bg: 'rgba(8,8,14,0.92)', bgDeep: 'rgba(6,6,10,0.97)',
  border: 'rgba(255,255,255,0.055)', borderP: 'rgba(124,110,247,0.22)',
  text: '#dcdcf0', sub: '#8a8aaa', muted: '#4a4a6a',
  green: '#34d399', red: '#f87171', amber: '#fbbf24',
  purple: '#7c6ef7', violet: '#a78bfa', cyan: '#22d3ee',
  blur: 'blur(20px)',
}
const card = {
  background: T.bg,
  border: `1px solid ${T.border}`,
  backdropFilter: T.blur,
  boxShadow: '0 4px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)',
}
const inp: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: `1px solid ${T.border}`,
  color: T.text,
  borderRadius: 12,
  padding: '10px 14px',
  fontSize: 13,
  outline: 'none',
  width: '100%',
  transition: 'border-color 0.15s',
}

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16, filter: 'blur(4px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  transition: { duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] as const },
})

const TOUR_STEPS = [
  { target: '[data-tour="clientes-header"]', title: 'Cadastro de clientes', description: 'Mantenha seu cadastro atualizado. Eles ficarão disponíveis ao registrar vendas.', position: 'bottom' as const },
  { target: '[data-tour="clientes-busca"]', title: 'Busca de clientes', description: 'Pesquise por nome ou email. O resultado aparece instantaneamente.', position: 'bottom' as const },
  { target: '[data-tour="clientes-lista"]', title: 'Lista de clientes', description: 'Clique no lápis para editar ou na lixeira para excluir um cliente.', position: 'top' as const },
]

const AVATAR_COLORS = ['#7c6ef7', '#34d399', '#f87171', '#fbbf24', '#22d3ee', '#a78bfa', '#fb923c']
function colorFor(name: string) { return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length] }
function initials(name: string) { return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) }

// ─── Skeleton ─────────────────────────────────────────────────
function ClientesSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-32 rounded-xl" />
          <Skeleton className="h-4 w-44 rounded-lg" />
        </div>
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>
      <Skeleton className="h-11 w-full rounded-xl" />
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  )
}

// ── FIX: supabase client criado fora do componente (evita recriação a cada render)
const supabase = createClient()

export default function ClientesPage() {
  const { businessId, loading: bizLoading } = useBusiness()
  const tour = useTour('clientes', TOUR_STEPS)

  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editClient, setEditClient] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [showConfirm, setShowConfirm] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '', document: '' })

  async function load() {
    if (!businessId) return
    try {
      const { data } = await supabase.from('clients').select('*').eq('business_id', businessId).order('name')
      setClients(data || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { if (businessId) load() }, [businessId])
  useEffect(() => { if (!bizLoading && !businessId) setLoading(false) }, [bizLoading, businessId])

  function openCreate() {
    setEditClient(null)
    setForm({ name: '', email: '', phone: '', document: '' })
    setShowForm(true)
  }

  function openEdit(client: any) {
    setEditClient(client)
    setForm({ name: client.name, email: client.email || '', phone: client.phone || '', document: client.document || '' })
    setShowForm(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      if (editClient) {
        const { error } = await supabase.from('clients').update({
          name: form.name, email: form.email || null,
          phone: form.phone || null, document: form.document || null,
        }).eq('id', editClient.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('clients').insert({
          name: form.name, email: form.email || null,
          phone: form.phone || null, document: form.document || null,
          business_id: businessId, active: true,
        })
        if (error) throw error
      }
      setShowForm(false); setEditClient(null); load()
    } catch (err: any) {
      console.error('[Clientes] save:', err)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    await supabase.from('clients').delete().eq('id', id)
    setShowConfirm(null); load()
  }

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading || bizLoading) return (
    <BackgroundGrid><FloatingOrbs /><ClientesSkeleton /></BackgroundGrid>
  )

  return (
    <BackgroundGrid>
      <FloatingOrbs />
      <div className="flex flex-col gap-5">

        <TourTooltip active={tour.active} step={tour.step} current={tour.current} total={tour.total} onNext={tour.next} onPrev={tour.prev} onFinish={tour.finish} />

        {/* ── Header ─────────────────────────────────────────── */}
        <motion.div {...fadeUp(0)} className="flex items-start justify-between gap-4" data-tour="clientes-header">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Syne, sans-serif', color: T.text }}>
              Clientes
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  style={{ background: T.purple, animationDuration: '1.4s' }} />
                <span className="relative inline-flex rounded-full h-2 w-2"
                  style={{ background: T.purple, boxShadow: `0 0 6px ${T.purple}` }} />
              </div>
              <p className="text-sm" style={{ color: T.muted }}>
                {clients.length} cliente{clients.length !== 1 ? 's' : ''} cadastrado{clients.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <ShimmerButton
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold shrink-0"
            style={{ background: 'linear-gradient(135deg, #7c6ef7 0%, #a06ef7 100%)', color: 'white', boxShadow: '0 0 28px rgba(124,110,247,0.45), inset 0 1px 0 rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>
            <Plus size={15} />
            <span className="hidden sm:inline">Novo cliente</span>
            <span className="sm:hidden">Novo</span>
          </ShimmerButton>
        </motion.div>

        {/* ── Busca ──────────────────────────────────────────── */}
        <motion.div {...fadeUp(0.06)} data-tour="clientes-busca">
          <SpotlightCard className="rounded-xl" spotlightColor="rgba(124,110,247,0.08)" style={{ ...card, padding: 0 }}>
            <div className="flex items-center gap-3 px-4 py-3">
              <Search size={14} style={{ color: T.muted, flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Buscar por nome ou email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: T.text }}
              />
              <AnimatePresence>
                {search && (
                  <motion.button initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }}
                    onClick={() => setSearch('')}
                    className="w-5 h-5 rounded-md flex items-center justify-center"
                    style={{ color: T.muted, background: 'rgba(255,255,255,0.05)', border: `1px solid ${T.border}`, cursor: 'pointer' }}>
                    <X size={11} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </SpotlightCard>
        </motion.div>

        {/* ── Lista / Empty ───────────────────────────────────── */}
        {filtered.length === 0 ? (
          <motion.div {...fadeUp(0.12)} className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(124,110,247,0.08)', border: '1px solid rgba(124,110,247,0.18)', boxShadow: '0 0 32px rgba(124,110,247,0.1)' }}>
              <Users size={28} style={{ color: T.purple }} />
            </div>
            <h2 className="text-xl font-bold" style={{ fontFamily: 'Syne, sans-serif', color: T.text }}>
              {search ? 'Nenhum resultado' : 'Nenhum cliente ainda'}
            </h2>
            <p className="text-sm" style={{ color: T.muted }}>
              {search ? 'Tente outro termo de busca' : 'Cadastre seu primeiro cliente'}
            </p>
            {!search && (
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={openCreate}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold mt-2"
                style={{ background: `${T.purple}12`, color: T.violet, border: `1px solid ${T.purple}28`, cursor: 'pointer' }}>
                <Plus size={14} /> Adicionar cliente
              </motion.button>
            )}
          </motion.div>
        ) : (
          <motion.div {...fadeUp(0.1)} data-tour="clientes-lista">
            <SpotlightCard className="rounded-2xl overflow-hidden" style={{ ...card, padding: 0 }}>
              {/* Cabeçalho da tabela */}
              <div className="flex items-center gap-3 px-5 py-3 border-b"
                style={{ borderColor: T.border }}>
                <span className="text-xs font-semibold uppercase tracking-widest flex-1"
                  style={{ color: T.muted, fontFamily: 'Syne, sans-serif', letterSpacing: '0.1em' }}>
                  {filtered.length} {filtered.length !== 1 ? 'clientes' : 'cliente'}{search ? ` para "${search}"` : ''}
                </span>
              </div>

              <AnimatePresence initial={false}>
                {filtered.map((client, i) => {
                  const color = colorFor(client.name)
                  return (
                    <motion.div
                      key={client.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 12, height: 0, overflow: 'hidden' }}
                      transition={{ duration: 0.22, delay: i * 0.03 }}
                      className="flex items-center gap-3 px-5 py-3.5"
                      style={{ borderBottom: i < filtered.length - 1 ? `1px solid rgba(255,255,255,0.035)` : 'none', transition: 'background 0.12s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.018)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                      {/* Avatar */}
                      <motion.div whileHover={{ scale: 1.08 }}
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0"
                        style={{ background: `${color}18`, color, border: `1px solid ${color}28`, boxShadow: `0 0 12px ${color}14`, fontFamily: 'Syne, sans-serif' }}>
                        {initials(client.name)}
                      </motion.div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: T.text }}>{client.name}</p>
                        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                          {client.email && (
                            <span className="flex items-center gap-1 text-xs" style={{ color: T.muted }}>
                              <Mail size={10} style={{ color: T.muted }} />
                              {client.email}
                            </span>
                          )}
                          {client.phone && (
                            <span className="flex items-center gap-1 text-xs" style={{ color: T.muted }}>
                              <Phone size={10} style={{ color: T.muted }} />
                              {client.phone}
                            </span>
                          )}
                          {!client.email && !client.phone && (
                            <span className="text-xs" style={{ color: T.muted }}>Sem contato</span>
                          )}
                        </div>
                      </div>

                      {/* CPF/CNPJ badge */}
                      {client.document && (
                        <span className="hidden sm:flex items-center gap-1 text-xs px-2 py-1 rounded-lg shrink-0"
                          style={{ background: 'rgba(255,255,255,0.04)', color: T.muted, border: `1px solid ${T.border}` }}>
                          <FileText size={10} />
                          {client.document}
                        </span>
                      )}

                      {/* Ações */}
                      <div className="flex gap-2 shrink-0">
                        <motion.button whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.9 }}
                          onClick={() => openEdit(client)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{ background: `${T.purple}10`, color: T.purple, border: `1px solid ${T.purple}22`, cursor: 'pointer' }}>
                          <Pencil size={12} />
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.9 }}
                          onClick={() => setShowConfirm(client.id)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{ background: `${T.red}10`, color: T.red, border: `1px solid ${T.red}22`, cursor: 'pointer' }}>
                          <Trash2 size={12} />
                        </motion.button>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </SpotlightCard>
          </motion.div>
        )}

        {/* ── Modal: Form ─────────────────────────────────────── */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
              style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)' }}
              onClick={e => { if (e.target === e.currentTarget) { setShowForm(false); setEditClient(null) } }}>

              <motion.div
                initial={{ y: 60, opacity: 0, scale: 0.97 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 60, opacity: 0 }}
                transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] as const }}
                className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6"
                style={{ background: T.bgDeep, border: `1px solid ${T.borderP}`, boxShadow: '0 0 0 1px rgba(124,110,247,0.08), 0 -8px 48px rgba(0,0,0,0.8)', backdropFilter: 'blur(28px)' }}>

                {/* Handle mobile */}
                <div className="w-10 h-1 rounded-full mx-auto mb-5 sm:hidden" style={{ background: 'rgba(255,255,255,0.1)' }} />

                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{ background: `${T.purple}14`, border: `1px solid ${T.purple}28` }}>
                      <UserCheck size={14} style={{ color: T.purple }} />
                    </div>
                    <h2 className="font-bold text-lg" style={{ fontFamily: 'Syne, sans-serif', color: T.text }}>
                      {editClient ? 'Editar cliente' : 'Novo cliente'}
                    </h2>
                  </div>
                  <motion.button whileTap={{ scale: 0.9 }}
                    onClick={() => { setShowForm(false); setEditClient(null) }}
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.05)', color: T.sub, border: `1px solid ${T.border}`, cursor: 'pointer' }}>
                    <X size={14} />
                  </motion.button>
                </div>

                <form onSubmit={handleSave} className="flex flex-col gap-3">
                  <input type="text" placeholder="Nome completo *" value={form.name} required
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    style={inp}
                    onFocus={e => e.currentTarget.style.borderColor = T.borderP}
                    onBlur={e => e.currentTarget.style.borderColor = T.border} />

                  <input type="email" placeholder="Email" value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    style={inp}
                    onFocus={e => e.currentTarget.style.borderColor = T.borderP}
                    onBlur={e => e.currentTarget.style.borderColor = T.border} />

                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" placeholder="Telefone" value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                      style={inp}
                      onFocus={e => e.currentTarget.style.borderColor = T.borderP}
                      onBlur={e => e.currentTarget.style.borderColor = T.border} />
                    <input type="text" placeholder="CPF/CNPJ" value={form.document}
                      onChange={e => setForm({ ...form, document: e.target.value })}
                      style={inp}
                      onFocus={e => e.currentTarget.style.borderColor = T.borderP}
                      onBlur={e => e.currentTarget.style.borderColor = T.border} />
                  </div>

                  <ShimmerButton type="submit" disabled={saving}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm w-full mt-1"
                    style={{ background: 'linear-gradient(135deg, #7c6ef7, #a06ef7)', color: 'white', boxShadow: saving ? 'none' : '0 0 28px rgba(124,110,247,0.4)', border: '1px solid rgba(255,255,255,0.1)', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                    {saving
                      ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      : editClient ? 'Salvar alterações' : 'Criar cliente'}
                  </ShimmerButton>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Modal: Confirmar exclusão ───────────────────────── */}
        <AnimatePresence>
          {showConfirm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)' }}>
              <motion.div
                initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] as const }}
                className="w-full max-w-sm rounded-2xl p-6"
                style={{ background: T.bgDeep, border: `1px solid rgba(248,113,113,0.22)`, boxShadow: '0 0 0 1px rgba(248,113,113,0.06), 0 24px 64px rgba(0,0,0,0.8)' }}>

                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)' }}>
                  <Trash2 size={20} style={{ color: T.red }} />
                </div>

                <h2 className="font-bold text-lg text-center mb-2" style={{ fontFamily: 'Syne, sans-serif', color: T.text }}>
                  Excluir cliente?
                </h2>
                <p className="text-sm text-center mb-6" style={{ color: T.muted }}>
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
                    style={{ background: 'rgba(248,113,113,0.12)', color: T.red, border: '1px solid rgba(248,113,113,0.28)', cursor: 'pointer' }}>
                    Excluir
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </BackgroundGrid>
  )
}
