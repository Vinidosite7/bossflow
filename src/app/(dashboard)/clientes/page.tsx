'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useBusiness } from '@/hooks/useBusiness'
import { usePlanLimits } from '@/hooks/usePlanLimits'
import { UpgradeModal } from '@/components/PlanGate'
import { useTour } from '@/hooks/useTour'
import { TourTooltip } from "@/components/TourTooltip"
import { Users, Plus, Loader2, X, Pencil, Trash2, Search, UserCheck, Phone, Mail, FileText, Lock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { SpotlightCard, ShimmerButton, Skeleton, GlowCorner } from '@/components/ui/bossflow-ui'

// ── Design System ──────────────────────────────────────────────────────────
import { T, card, inp, inpLg, inpSm, SYNE } from '@/lib/design'
import { fadeUp, scaleIn } from '@/lib/animations'

import { PageBackground, SectionHeader, FilterBar, FormModal, ModalSubmitButton } from '@/components/core'
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

const FREE_CLIENT_LIMIT = 50

export default function ClientesPage() {
  const { businessId, loading: bizLoading } = useBusiness()
  const { plan, loading: planLoading }      = usePlanLimits()
  const [upgradeOpen, setUpgradeOpen]       = useState(false)
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

  const isFree     = plan === 'free'
  const atLimit    = isFree && clients.length >= FREE_CLIENT_LIMIT
  const nearLimit  = isFree && clients.length >= FREE_CLIENT_LIMIT - 5 && !atLimit
  const canCreate  = !atLimit

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading || bizLoading || planLoading) return (
    <PageBackground><ClientesSkeleton /></PageBackground>
  )

  return (
    <PageBackground>
      <div className="flex flex-col gap-5">

        <TourTooltip active={tour.active} step={tour.step} current={tour.current} total={tour.total} onNext={tour.next} onPrev={tour.prev} onFinish={tour.finish} />

        <UpgradeModal isOpen={upgradeOpen} onClose={() => setUpgradeOpen(false)}
          feature="Clientes ilimitados"
          description={`Plano Básico permite até ${FREE_CLIENT_LIMIT} clientes. Faça upgrade para cadastrar ilimitados.`}
          requiredPlan="starter" currentPlan={plan} />

        {/* ── Header ─────────────────────────────────────────── */}
        <SectionHeader
          title="Clientes"
          subtitle={`${clients.length} cadastrado${clients.length !== 1 ? 's' : ''}`}
          live liveColor={T.purple}
          cta={canCreate
            ? { label: 'Novo cliente', labelMobile: 'Novo', icon: Plus, onClick: openCreate }
            : { label: 'Upgrade', labelMobile: 'Upgrade', icon: Lock, onClick: () => setUpgradeOpen(true) }
          }
          tourId="clientes-header"
        />

        {nearLimit && (
          <motion.div {...fadeUp(0)} className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{ background: `${T.amber}10`, border: `1px solid ${T.amber}25` }}>
            <Lock size={13} style={{ color: T.amber, flexShrink: 0 }} />
            <p className="text-xs" style={{ color: T.amber }}>
              <strong>{FREE_CLIENT_LIMIT - clients.length} vaga{FREE_CLIENT_LIMIT - clients.length !== 1 ? 's' : ''}</strong> restante{FREE_CLIENT_LIMIT - clients.length !== 1 ? 's' : ''} no plano Básico.{' '}
              <span onClick={() => setUpgradeOpen(true)} style={{ color: T.purple, cursor: 'pointer', textDecoration: 'underline' }}>Fazer upgrade</span>
            </p>
          </motion.div>
        )}
        {atLimit && (
          <motion.div {...fadeUp(0)} className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{ background: `${T.red}10`, border: `1px solid ${T.red}25` }}>
            <Lock size={13} style={{ color: T.red, flexShrink: 0 }} />
            <p className="text-xs" style={{ color: T.red }}>
              Limite de <strong>{FREE_CLIENT_LIMIT} clientes</strong> atingido.{' '}
              <span onClick={() => setUpgradeOpen(true)} style={{ color: T.purple, cursor: 'pointer', textDecoration: 'underline' }}>Faça upgrade</span> para adicionar mais.
            </p>
          </motion.div>
        )}

        {/* ── Busca ──────────────────────────────────────────── */}
        <motion.div {...fadeUp(0.06)} data-tour="clientes-busca">
          <FilterBar
            value={search}
            onChange={setSearch}
            placeholder="Buscar por nome ou email..."
          />
        </motion.div>

        {/* ── Lista / Empty ───────────────────────────────────── */}
        {filtered.length === 0 ? (
          <motion.div {...fadeUp(0.12)} className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(124,110,247,0.08)', border: '1px solid rgba(124,110,247,0.18)', boxShadow: '0 0 32px rgba(124,110,247,0.1)' }}>
              <Users size={28} style={{ color: T.purple }} />
            </div>
            <h2 className="text-xl font-bold" style={{ fontFamily: SYNE, color: T.text }}>
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
                  style={{ color: T.muted, fontFamily: SYNE, letterSpacing: '0.1em' }}>
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
                        style={{ background: `${color}18`, color, border: `1px solid ${color}28`, boxShadow: `0 0 12px ${color}14`, fontFamily: SYNE }}>
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
                {/* ── Modal: Form ─────────────────────────────────────── */}
        <FormModal
          open={showForm}
          onClose={() => { setShowForm(false); setEditClient(null) }}
          title={editClient ? 'Editar cliente' : 'Novo cliente'}
          size="sm"
        >
          <form onSubmit={handleSave} className="flex flex-col gap-4">
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

            <ModalSubmitButton loading={saving}>
              {editClient ? 'Salvar alterações' : 'Criar cliente'}
            </ModalSubmitButton>
          </form>
        </FormModal>

        {/* ── Modal: Confirmar exclusão ───────────────────────── */}
                {/* ── Modal: Confirmar exclusão ─────────────────────── */}
        <FormModal
          open={!!showConfirm}
          onClose={() => setShowConfirm(null)}
          title="Excluir cliente?"
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
              style={{ background: 'rgba(248,113,113,0.12)', color: T.red, border: '1px solid rgba(248,113,113,0.28)', cursor: 'pointer' }}>
              Excluir
            </motion.button>
          </div>
        </FormModal>

      </div>
    </PageBackground>
  )
}
