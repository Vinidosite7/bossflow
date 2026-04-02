'use client'
// DESPESAS / LANÇAMENTOS PAGE
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useBusiness } from '@/hooks/useBusiness'
import { usePlanLimits } from '@/hooks/usePlanLimits'
import { UpgradeModal } from '@/components/PlanGate'
import { sendPush, fmt as fmtPush } from '@/lib/push'
import { useTour } from '@/hooks/useTour'
import { TourTooltip } from '@/components/TourTooltip'
import {
  TrendingUp, TrendingDown, Plus, Loader2, X,
  Pencil, Trash2, Search, DollarSign, AlertTriangle, Lock,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { SpotlightCard, ShimmerButton, GlowCorner, Skeleton } from '@/components/ui/bossflow-ui'

// ── Design System ──────────────────────────────────────────────────────────
import { T, card, inp, inpLg, inpSm, SYNE } from '@/lib/design'
import { fadeUp, scaleIn } from '@/lib/animations'

import { PageBackground, SectionHeader, KPICard, FilterBar, FormModal, ModalSubmitButton } from '@/components/core'
const TOUR_STEPS = [
  { target: '[data-tour="lancamentos-header"]', title: 'Lançamentos',       description: 'Registre entradas e saídas. Clique em "Novo lançamento" para começar.', position: 'bottom' as const },
  { target: '[data-tour="lancamentos-kpis"]',   title: 'Resumo financeiro', description: 'Total de entradas, saídas e saldo atual em tempo real.', position: 'bottom' as const },
  { target: '[data-tour="lancamentos-lista"]',  title: 'Histórico',         description: 'Lançamentos "Pendente" ainda não foram pagos. Edite para marcar como pago.', position: 'top' as const },
]

const fmt      = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtShort = (v: number) => {
  if (v >= 1e6) return `R$ ${(v / 1e6).toFixed(1)}M`
  if (v >= 1e3) return `R$ ${(v / 1e3).toFixed(1)}k`
  return fmt(v)
}

// ── FIX: supabase client criado fora do componente (evita recriação a cada render)
const supabase = createClient()

export default function DespesasPage() {
  const { businessId, loading: bizLoading }      = useBusiness()
  const { plan, features, loading: planLoading } = usePlanLimits()
  const [upgradeOpen, setUpgradeOpen]            = useState(false)
  const tour = useTour('lancamentos', TOUR_STEPS)

  const [transactions, setTransactions] = useState<any[]>([])
  const [categories,   setCategories]   = useState<any[]>([])
  const [loading,      setLoading]      = useState(true)
  const [showForm,     setShowForm]     = useState(false)
  const [showConfirm,  setShowConfirm]  = useState<string | null>(null)
  const [editTx,       setEditTx]       = useState<any>(null)
  const [saving,       setSaving]       = useState(false)
  const [deleting,     setDeleting]     = useState(false)
  const [search,       setSearch]       = useState('')
  const [typeFilter,   setTypeFilter]   = useState<'all' | 'income' | 'expense'>('all')

  const [form, setForm] = useState({
    title: '', amount: '', date: new Date().toISOString().split('T')[0],
    type: 'expense', category_id: '', description: '', paid: true,
  })

  async function load() {
    if (!businessId) return
    try {
      const [{ data: txs }, { data: cats }] = await Promise.all([
        supabase.from('transactions').select('*, categories(name, color)')
          .eq('business_id', businessId).order('date', { ascending: false }),
        supabase.from('categories').select('*').eq('business_id', businessId).order('name'),
      ])
      setTransactions(txs || [])
      setCategories(cats || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { if (businessId) load() }, [businessId])
  useEffect(() => { if (!bizLoading && !businessId) setLoading(false) }, [bizLoading, businessId])

  function openCreate() {
    setEditTx(null)
    setForm({ title: '', amount: '', date: new Date().toISOString().split('T')[0], type: 'expense', category_id: '', description: '', paid: true })
    setShowForm(true)
  }
  function openEdit(tx: any) {
    setEditTx(tx)
    setForm({ title: tx.title, amount: String(tx.amount), date: tx.date, type: tx.type, category_id: tx.category_id || '', description: tx.description || '', paid: tx.paid })
    setShowForm(true)
  }
  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const payload = {
        title: form.title, amount: parseFloat(form.amount), date: form.date,
        type: form.type, category_id: form.category_id || null,
        description: form.description || null, paid: form.paid,
        paid_at: form.paid ? new Date().toISOString() : null,
      }
      if (editTx) {
        const { error } = await supabase.from('transactions').update(payload).eq('id', editTx.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('transactions').insert({ ...payload, business_id: businessId, created_by: user?.id })
        if (error) throw error
        if (user) await sendPush(user.id, '🔴 Nova despesa registrada', `${form.title} · ${fmtPush(parseFloat(form.amount))}`, '/despesas')
      }
      setShowForm(false); setEditTx(null); load()
    } catch (err: any) { console.error('[Despesas] save:', err) } finally { setSaving(false) }
  }
  async function handleDelete(id: string) {
    setDeleting(true)
    await supabase.from('transactions').delete().eq('id', id)
    setShowConfirm(null); setDeleting(false); load()
  }

  const income  = transactions.filter(t => t.type === 'income').reduce((a, t) => a + Number(t.amount), 0)
  const expense = transactions.filter(t => t.type === 'expense').reduce((a, t) => a + Number(t.amount), 0)
  const saldo   = income - expense

  // Free: mostra só últimos 30 dias · Starter+: histórico completo
  const hasHistory   = features.extendedHistory
  const cutoff       = !hasHistory ? new Date(Date.now() - 30*24*60*60*1000).toISOString().split('T')[0] : null
  const visible      = cutoff ? transactions.filter(t => t.date >= cutoff) : transactions
  const hiddenCount  = transactions.length - visible.length

  const filtered = visible.filter(t => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase())
    const matchType   = typeFilter === 'all' || t.type === typeFilter
    return matchSearch && matchType
  })

  if (loading || bizLoading || planLoading) return (
    <PageBackground>
      <div className="flex flex-col gap-5">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-40 rounded-xl" />
          <Skeleton className="h-10 w-40 rounded-xl" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[0,1,2].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
        <Skeleton className="h-12 rounded-xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    </PageBackground>
  )

  return (
    <PageBackground>
      <div className="flex flex-col gap-5">

        <TourTooltip active={tour.active} step={tour.step} current={tour.current}
          total={tour.total} onNext={tour.next} onPrev={tour.prev} onFinish={tour.finish} />

        {/* ── Header ── */}
        <SectionHeader
          title="Lançamentos"
          subtitle={`${transactions.length} ${transactions.length === 1 ? 'lançamento' : 'lançamentos'} registrados`}
          cta={{ label: 'Novo lançamento', labelMobile: 'Novo', icon: Plus, onClick: openCreate }}
          tourId="lancamentos-header"
        />

        {/* ── KPIs ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" data-tour="lancamentos-kpis">
          <motion.div {...fadeUp(0.08)}>
            <KPICard label="Entradas" value={income}  color={T.green} icon={TrendingUp}   format={fmtShort} sub="Total registrado" />
          </motion.div>
          <motion.div {...fadeUp(0.15)}>
            <KPICard label="Saídas"   value={expense} color={T.red}   icon={TrendingDown} format={fmtShort} sub="Total registrado" />
          </motion.div>
          <motion.div {...fadeUp(0.22)}>
            <KPICard
              label="Saldo"
              value={saldo}
              color={saldo >= 0 ? T.green : T.red}
              icon={saldo >= 0 ? TrendingUp : TrendingDown}
              format={fmtShort}
              sub={saldo >= 0 ? 'Resultado positivo' : 'Resultado negativo'}
            />
          </motion.div>
        </div>

        {/* ── Filtros ── */}
        <motion.div {...fadeUp(0.28)}>
          <FilterBar
            value={search}
            onChange={setSearch}
            placeholder="Buscar lançamento..."
            tabs={[
              { value: 'all',     label: 'Todos',    color: T.purple },
              { value: 'income',  label: 'Entradas', color: T.green  },
              { value: 'expense', label: 'Saídas',   color: T.red    },
            ]}
            activeTab={typeFilter}
            onTabChange={v => setTypeFilter(v as typeof typeFilter)}
          />
        </motion.div>

        <UpgradeModal isOpen={upgradeOpen} onClose={() => setUpgradeOpen(false)}
          feature="Histórico completo"
          description="Acesse todo o histórico financeiro sem limite de data. Disponível no Starter."
          requiredPlan="starter" currentPlan={plan} />

        {/* Banner histórico limitado — só free */}
        {hiddenCount > 0 && (
          <motion.div {...fadeUp(0.3)} className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{ background: `${T.amber}10`, border: `1px solid ${T.amber}25` }}>
            <Lock size={13} style={{ color: T.amber, flexShrink: 0 }} />
            <p className="text-xs flex-1" style={{ color: T.amber }}>
              Mostrando só os <strong>últimos 30 dias</strong>. {hiddenCount} lançamento{hiddenCount !== 1 ? 's' : ''} anterior{hiddenCount !== 1 ? 'es' : ''} oculto{hiddenCount !== 1 ? 's' : ''}.{' '}
              <span onClick={() => setUpgradeOpen(true)} style={{ color: T.purple, cursor: 'pointer', textDecoration: 'underline' }}>Ver histórico completo</span>
            </p>
          </motion.div>
        )}

        {/* ── Lista ── */}
        {filtered.length === 0 ? (
          <motion.div {...fadeUp(0.28)}>
            <SpotlightCard className="rounded-2xl" spotlightColor={`${T.purple}10`} style={card}>
              <div className="py-20 flex flex-col items-center gap-4 text-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: `${T.purple}12`, border: `1px solid ${T.purple}25`, boxShadow: `0 0 30px ${T.purple}20` }}>
                  <TrendingUp size={26} style={{ color: T.violet }} strokeWidth={1.6} />
                </div>
                <h2 className="text-lg font-bold" style={{ fontFamily: SYNE, color: T.text }}>
                  {search || typeFilter !== 'all' ? 'Nenhum resultado' : 'Nenhum lançamento ainda'}
                </h2>
                <p className="text-sm" style={{ color: T.muted, fontFamily: SYNE }}>
                  {search || typeFilter !== 'all' ? 'Tente outro filtro ou termo' : 'Registre seu primeiro lançamento'}
                </p>
                {(search || typeFilter !== 'all') && (
                  <motion.button whileTap={{ scale: 0.97 }}
                    onClick={() => { setSearch(''); setTypeFilter('all') }}
                    className="text-xs px-4 py-2 rounded-lg"
                    style={{ background: `${T.purple}10`, color: T.violet, border: `1px solid ${T.purple}25`, cursor: 'pointer', fontFamily: SYNE }}>
                    Limpar filtros
                  </motion.button>
                )}
              </div>
            </SpotlightCard>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} data-tour="lancamentos-lista">
            <SpotlightCard className="rounded-2xl overflow-hidden" style={card}>
              {/* Totalizador */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: T.border }}>
                <p className="text-xs font-semibold" style={{ color: T.muted, fontFamily: SYNE }}>
                  {filtered.length} {filtered.length !== transactions.length ? `de ${transactions.length}` : ''} lançamentos
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold tabular-nums" style={{ color: T.green, fontFamily: SYNE }}>
                    +{fmtShort(filtered.filter(t => t.type === 'income').reduce((a, t) => a + Number(t.amount), 0))}
                  </span>
                  <span style={{ color: T.border, fontSize: 12 }}>|</span>
                  <span className="text-xs font-semibold tabular-nums" style={{ color: T.red, fontFamily: SYNE }}>
                    −{fmtShort(filtered.filter(t => t.type === 'expense').reduce((a, t) => a + Number(t.amount), 0))}
                  </span>
                </div>
              </div>

              <AnimatePresence initial={false}>
                {filtered.map((tx, i) => (
                  <motion.div key={tx.id}
                    initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12, height: 0 }}
                    transition={{ duration: 0.22, delay: i * 0.025 }}
                    className="group flex items-center gap-3 px-5 py-3.5"
                    style={{ borderBottom: i < filtered.length - 1 ? `1px solid rgba(255,255,255,0.035)` : 'none', transition: 'background 0.12s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.022)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                    {/* Ícone */}
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        background: tx.type === 'income' ? `${T.green}10` : `${T.red}10`,
                        border:    `1px solid ${tx.type === 'income' ? T.green : T.red}20`,
                        boxShadow: `0 0 10px ${tx.type === 'income' ? T.green : T.red}12`,
                      }}>
                      {tx.type === 'income'
                        ? <TrendingUp  size={14} style={{ color: T.green }} strokeWidth={2} />
                        : <TrendingDown size={14} style={{ color: T.red  }} strokeWidth={2} />}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: T.text, fontFamily: SYNE }}>{tx.title}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs" style={{ color: T.muted, fontFamily: SYNE }}>
                          {new Date(tx.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' })}
                        </span>
                        {tx.categories?.name && (
                          <span className="text-xs px-1.5 py-0.5 rounded-md"
                            style={{ background: `${tx.categories.color || T.sub}14`, color: tx.categories.color || T.sub, border: `1px solid ${tx.categories.color || T.sub}22`, fontFamily: SYNE }}>
                            {tx.categories.name}
                          </span>
                        )}
                        {!tx.paid && (
                          <span className="text-xs px-1.5 py-0.5 rounded-md"
                            style={{ background: `${T.amber}10`, color: T.amber, border: `1px solid ${T.amber}22`, fontFamily: SYNE }}>
                            Pendente
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Valor */}
                    <span className="text-sm font-bold shrink-0 tabular-nums"
                      style={{ fontFamily: SYNE, color: tx.type === 'income' ? T.green : T.red, textShadow: `0 0 14px ${tx.type === 'income' ? T.green : T.red}40` }}>
                      {tx.type === 'income' ? '+' : '−'}{fmt(Number(tx.amount))}
                    </span>

                    {/* Ações */}
                    <div className="flex gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ml-1">
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                        onClick={() => openEdit(tx)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: `${T.purple}12`, color: T.violet, border: `1px solid ${T.purple}25`, cursor: 'pointer' }}>
                        <Pencil size={11} />
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                        onClick={() => setShowConfirm(tx.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: `${T.red}10`, color: T.red, border: `1px solid ${T.red}22`, cursor: 'pointer' }}>
                        <Trash2 size={11} />
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </SpotlightCard>
          </motion.div>
        )}

        {/* ── Modal lançamento ── */}
                <FormModal
          open={showForm}
          onClose={() => { setShowForm(false); setEditTx(null) }}
          title={editTx ? 'Editar lançamento' : 'Novo lançamento'}
          size="sm"
        >
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-2">
              {['expense', 'income'].map(t => (
                <button key={t} type="button" onClick={() => setForm({ ...form, type: t })}
                  className="py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    background: form.type === t ? (t === 'income' ? `${T.green}12` : `${T.red}12`) : 'rgba(255,255,255,0.02)',
                    color:      form.type === t ? (t === 'income' ? T.green : T.red) : T.muted,
                    border:     `1px solid ${form.type === t ? (t === 'income' ? `${T.green}30` : `${T.red}30`) : T.border}`,
                    cursor: 'pointer', fontFamily: SYNE,
                  }}>
                  {t === 'income' ? '↑ Entrada' : '↓ Saída'}
                </button>
              ))}
            </div>
            <input type="text" placeholder="Título *" value={form.title} required
              onChange={e => setForm({ ...form, title: e.target.value })} style={inp}
              onFocus={e => e.currentTarget.style.borderColor = T.borderP}
              onBlur={e => e.currentTarget.style.borderColor = T.border} />
            <div className="grid grid-cols-2 gap-3">
              <input type="number" step="0.01" placeholder="Valor *" value={form.amount} required
                onChange={e => setForm({ ...form, amount: e.target.value })} style={inp}
                onFocus={e => e.currentTarget.style.borderColor = T.borderP}
                onBlur={e => e.currentTarget.style.borderColor = T.border} />
              <input type="date" value={form.date} required
                onChange={e => setForm({ ...form, date: e.target.value })} style={inp}
                onFocus={e => e.currentTarget.style.borderColor = T.borderP}
                onBlur={e => e.currentTarget.style.borderColor = T.border} />
            </div>
            <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}
              style={{ ...inp, cursor: 'pointer' }}>
              <option value="">Sem categoria</option>
              {categories.filter(c => c.type === form.type).map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={form.paid}
                onChange={e => setForm({ ...form, paid: e.target.checked })}
                style={{ accentColor: T.purple }} />
              <span className="text-sm" style={{ color: T.sub, fontFamily: SYNE }}>Já foi pago/recebido</span>
            </label>
            <ModalSubmitButton loading={saving}>
              editTx ? 'Salvar alterações' : 'Salvar lançamento'
            </ModalSubmitButton>
          </form>
        </FormModal>

        {/* ── Modal confirmar exclusão ── */}
                <FormModal
          open={!!showConfirm}
          onClose={() => setShowConfirm(null)}
          title="Excluir lançamento?"
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
