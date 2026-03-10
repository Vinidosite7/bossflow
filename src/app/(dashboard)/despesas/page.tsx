'use client'
// DESPESAS / LANÇAMENTOS PAGE
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useBusiness } from '@/hooks/useBusiness'
import { useTour } from '@/hooks/useTour'
import { TourTooltip } from '@/components/TourTooltip'
import {
  TrendingUp, TrendingDown, Plus, Loader2, X,
  Pencil, Trash2, Search, DollarSign, AlertTriangle,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  SpotlightCard, ShimmerButton, GlowCorner,
  BackgroundGrid, FloatingOrbs, Skeleton,
} from '@/components/ui/bossflow-ui'

// ─── Tokens ───────────────────────────────────────────────────────────────────
const T = {
  bg:      'rgba(8,8,14,0.92)',
  bgDeep:  'rgba(6,6,10,0.97)',
  surface: 'rgba(255,255,255,0.025)',
  border:  'rgba(255,255,255,0.055)',
  borderP: 'rgba(124,110,247,0.28)',
  text:    '#dcdcf0',
  sub:     '#8a8aaa',
  muted:   '#4a4a6a',
  green:   '#34d399',
  red:     '#f87171',
  amber:   '#fbbf24',
  purple:  '#7c6ef7',
  violet:  '#a78bfa',
  blur:    'blur(20px)',
}
const SYNE = 'Syne, sans-serif'
const card = {
  background:     T.bg,
  border:         `1px solid ${T.border}`,
  backdropFilter: T.blur,
  boxShadow:      '0 4px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)',
}
const inp: React.CSSProperties = {
  background:   'rgba(255,255,255,0.03)',
  border:       `1px solid ${T.border}`,
  color:        T.text,
  borderRadius: 12,
  padding:      '10px 14px',
  fontSize:     13,
  outline:      'none',
  width:        '100%',
  fontFamily:   SYNE,
}

const fadeUp = (delay = 0) => ({
  initial:    { opacity: 0, y: 20, filter: 'blur(4px)' },
  animate:    { opacity: 1, y: 0,  filter: 'blur(0px)' },
  transition: { duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] as const },
})

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
  const { businessId, loading: bizLoading } = useBusiness()
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

  const filtered = transactions.filter(t => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase())
    const matchType   = typeFilter === 'all' || t.type === typeFilter
    return matchSearch && matchType
  })

  if (loading || bizLoading) return (
    <BackgroundGrid>
      <FloatingOrbs />
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
    </BackgroundGrid>
  )

  return (
    <BackgroundGrid>
      <FloatingOrbs />
      <div className="flex flex-col gap-5">

        <TourTooltip active={tour.active} step={tour.step} current={tour.current}
          total={tour.total} onNext={tour.next} onPrev={tour.prev} onFinish={tour.finish} />

        {/* ── Header ── */}
        <motion.div {...fadeUp(0)} className="flex items-start justify-between gap-4" data-tour="lancamentos-header">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: SYNE, color: T.text }}>
              Lançamentos
            </h1>
            <p className="text-sm mt-1" style={{ color: T.muted, fontFamily: SYNE }}>
              {transactions.length} {transactions.length === 1 ? 'lançamento' : 'lançamentos'} registrados
            </p>
          </div>
          <ShimmerButton onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold shrink-0"
            style={{
              background: 'linear-gradient(135deg,#7c6ef7,#a06ef7)',
              color: 'white',
              boxShadow: '0 0 28px rgba(124,110,247,0.45),inset 0 1px 0 rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.1)',
              cursor: 'pointer', fontFamily: SYNE,
            }}>
            <Plus size={15} />
            <span className="hidden sm:inline">Novo lançamento</span>
            <span className="sm:hidden">Novo</span>
          </ShimmerButton>
        </motion.div>

        {/* ── KPIs ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" data-tour="lancamentos-kpis">
          {[
            { label: 'Entradas', value: income,  color: T.green,                  icon: TrendingUp   },
            { label: 'Saídas',   value: expense, color: T.red,                    icon: TrendingDown },
            { label: 'Saldo',    value: saldo,   color: saldo >= 0 ? T.green : T.red, icon: saldo >= 0 ? TrendingUp : TrendingDown },
          ].map(({ label, value, color, icon: Icon }, i) => (
            <motion.div key={label} {...fadeUp(0.08 + i * 0.07)}>
              <SpotlightCard className="rounded-2xl h-full" spotlightColor={`${color}16`} style={card}>
                <div className="p-5 relative overflow-hidden">
                  <GlowCorner color={`${color}22`} position="bottom-right" />
                  <div className="flex items-center justify-between mb-4" style={{ position: 'relative', zIndex: 1 }}>
                    <span className="text-xs font-semibold uppercase tracking-widest"
                      style={{ color: T.muted, fontFamily: SYNE }}>{label}</span>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{ background: `${color}14`, border: `1px solid ${color}25`, boxShadow: `0 0 14px ${color}20` }}>
                      <Icon size={14} style={{ color }} strokeWidth={2} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold tabular-nums"
                    style={{ fontFamily: SYNE, color, textShadow: `0 0 28px ${color}55`, letterSpacing: '-0.01em', position: 'relative', zIndex: 1 }}>
                    {fmtShort(value)}
                  </p>
                  <p className="text-xs mt-1.5" style={{ color: T.muted, fontFamily: SYNE, position: 'relative', zIndex: 1 }}>
                    {label === 'Saldo' ? (saldo >= 0 ? 'Resultado positivo' : 'Resultado negativo') : 'Total registrado'}
                  </p>
                </div>
              </SpotlightCard>
            </motion.div>
          ))}
        </div>

        {/* ── Filtros ── */}
        <motion.div {...fadeUp(0.22)} className="flex flex-col sm:flex-row gap-3">
          {/* Busca */}
          <div className="flex items-center gap-2.5 flex-1 px-4 py-2.5 rounded-xl"
            style={{ background: T.bg, border: `1px solid ${T.border}`, backdropFilter: T.blur }}>
            <Search size={14} style={{ color: T.muted, flexShrink: 0 }} />
            <input type="text" placeholder="Buscar lançamento..." value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ background: 'transparent', border: 'none', outline: 'none', flex: 1, color: T.text, fontSize: 13, fontFamily: SYNE }} />
            <AnimatePresence>
              {search && (
                <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => setSearch('')} style={{ color: T.muted, cursor: 'pointer' }}>
                  <X size={12} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Tipo */}
          <div className="flex gap-1.5 p-1 rounded-xl" style={{ background: T.bg, border: `1px solid ${T.border}` }}>
            {([['all', 'Todos'], ['income', 'Entradas'], ['expense', 'Saídas']] as const).map(([v, l]) => (
              <motion.button key={v} whileTap={{ scale: 0.95 }} onClick={() => setTypeFilter(v)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: typeFilter === v
                    ? v === 'income' ? `${T.green}12` : v === 'expense' ? `${T.red}12` : `${T.purple}12`
                    : 'transparent',
                  color: typeFilter === v
                    ? v === 'income' ? T.green : v === 'expense' ? T.red : T.violet
                    : T.muted,
                  border: typeFilter === v
                    ? `1px solid ${v === 'income' ? `${T.green}30` : v === 'expense' ? `${T.red}30` : `${T.purple}30`}`
                    : '1px solid transparent',
                  cursor: 'pointer', fontFamily: SYNE,
                }}>{l}</motion.button>
            ))}
          </div>
        </motion.div>

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
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
              style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)' }}
              onClick={e => { if (e.target === e.currentTarget) { setShowForm(false); setEditTx(null) } }}>
              <motion.div
                initial={{ y: 60, opacity: 0, scale: 0.97 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 60, opacity: 0 }}
                transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] as const }}
                className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6"
                style={{ background: T.bgDeep, border: `1px solid ${T.borderP}`, boxShadow: '0 0 0 1px rgba(124,110,247,0.08),0 -8px 48px rgba(0,0,0,0.8)', backdropFilter: 'blur(28px)' }}>
                <div className="w-10 h-1 rounded-full mx-auto mb-5 sm:hidden" style={{ background: 'rgba(255,255,255,0.1)' }} />
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-bold text-lg" style={{ fontFamily: SYNE, color: T.text }}>
                    {editTx ? 'Editar lançamento' : 'Novo lançamento'}
                  </h2>
                  <motion.button whileTap={{ scale: 0.9 }}
                    onClick={() => { setShowForm(false); setEditTx(null) }}
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.05)', color: T.sub, border: `1px solid ${T.border}`, cursor: 'pointer' }}>
                    <X size={14} />
                  </motion.button>
                </div>
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
                  <ShimmerButton type="submit" disabled={saving}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm w-full"
                    style={{
                      background: 'linear-gradient(135deg,#7c6ef7,#a06ef7)',
                      color: 'white',
                      boxShadow: saving ? 'none' : '0 0 28px rgba(124,110,247,0.4)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      cursor: saving ? 'not-allowed' : 'pointer',
                      opacity: saving ? 0.7 : 1,
                      fontFamily: SYNE,
                    }}>
                    {saving ? <Loader2 size={16} className="animate-spin" /> : editTx ? 'Salvar alterações' : 'Salvar lançamento'}
                  </ShimmerButton>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Modal confirmar exclusão ── */}
        <AnimatePresence>
          {showConfirm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)' }}>
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] as const }}
                className="w-full max-w-sm rounded-2xl p-6"
                style={{ background: T.bgDeep, border: `1px solid rgba(248,113,113,0.25)`, boxShadow: '0 0 0 1px rgba(248,113,113,0.08),0 8px 48px rgba(0,0,0,0.8)', backdropFilter: 'blur(28px)' }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${T.red}12`, border: `1px solid ${T.red}25` }}>
                    <AlertTriangle size={18} style={{ color: T.red }} />
                  </div>
                  <div>
                    <h2 className="font-bold text-base" style={{ fontFamily: SYNE, color: T.text }}>Excluir lançamento?</h2>
                    <p className="text-xs mt-0.5" style={{ color: T.muted, fontFamily: SYNE }}>Esta ação não pode ser desfeita.</p>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <motion.button whileTap={{ scale: 0.97 }}
                    onClick={() => setShowConfirm(null)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                    style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.sub, cursor: 'pointer', fontFamily: SYNE }}>
                    Cancelar
                  </motion.button>
                  <ShimmerButton
                    onClick={() => handleDelete(showConfirm!)} disabled={deleting}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold"
                    style={{ background: `${T.red}15`, color: T.red, border: `1px solid ${T.red}30`, cursor: deleting ? 'not-allowed' : 'pointer', fontFamily: SYNE }}>
                    {deleting ? <Loader2 size={14} className="animate-spin" /> : 'Excluir'}
                  </ShimmerButton>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </BackgroundGrid>
  )
}
