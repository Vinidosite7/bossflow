'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import {
  TrendingUp, TrendingDown, Plus, Search, Filter, X,
  ArrowRight, ChevronLeft, ChevronRight, Download,
  DollarSign, Calendar, Tag, Check, Trash2, Edit2,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence, animate } from 'framer-motion'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, BarChart, Bar,
} from 'recharts'
import { SpotlightCard, ShimmerButton, Skeleton, BackgroundGrid, FloatingOrbs, AcernityFonts } from '@/components/ui/aceternity'

// ─── Helpers ─────────────────────────────────────────────────
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16, filter: 'blur(4px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  transition: { duration: 0.46, delay, ease: [0.16, 1, 0.3, 1] as const },
})

function AnimatedNumber({ value, format }: { value: number; format: (v: number) => string }) {
  const [display, setDisplay] = useState(format(0))
  const prev = useRef(0)
  useEffect(() => {
    const from = prev.current; prev.current = value
    const c = animate(from, value, { duration: 0.85, ease: 'easeOut', onUpdate: v => setDisplay(format(v)) })
    return c.stop
  }, [value])
  return <span>{display}</span>
}

function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  return (
    <div style={{
      background: 'rgba(10,10,18,0.97)', border: '1px solid rgba(124,110,247,0.25)',
      borderRadius: 12, padding: '10px 14px', fontSize: 12,
      boxShadow: '0 12px 40px rgba(0,0,0,0.75)',
    }}>
      <p style={{ color: '#6b6b8a', marginBottom: 8, fontWeight: 600 }}>
        {new Date(label + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
      </p>
      {payload.map((p: any) => (
        <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: p.color, display: 'inline-block', boxShadow: `0 0 6px ${p.color}` }} />
          <span style={{ color: '#6b6b8a' }}>{p.name === 'income' ? 'Entradas' : 'Saídas'}:</span>
          <span style={{ color: p.color, fontWeight: 600 }}>{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

export default function FinanceiroPage() {
  const supabase  = createClient()
  const router    = useRouter()
  const [loading, setLoading]     = useState(true)
  const [biz, setBiz]             = useState<any>(null)
  const [txs, setTxs]             = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [chartData, setChartData]   = useState<any[]>([])
  const [search, setSearch]         = useState('')
  const [filterType, setFilterType] = useState<'all'|'income'|'expense'>('all')
  const [filterMonth, setFilterMonth] = useState(() => {
    const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
  })
  const [filterCat, setFilterCat]   = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage]             = useState(1)
  const PER_PAGE = 15

  // Modal
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing]     = useState<any>(null)
  const [form, setForm] = useState({ title: '', amount: '', type: 'expense', date: new Date().toISOString().split('T')[0], paid: true, category_id: '', notes: '' })
  const [saving, setSaving]       = useState(false)
  const [deleting, setDeleting]   = useState<string|null>(null)

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/login'); return }
    const savedBizId = localStorage.getItem('activeBizId') || ''
    const { data: owned } = await supabase.from('businesses').select('*').eq('owner_id', user.id)
    const bizList = owned || []
    if (!bizList.length) { setLoading(false); return }
    const business = bizList.find(b => b.id === savedBizId) || bizList[0]
    setBiz(business)

    const [{ data: transactions }, { data: cats }] = await Promise.all([
      supabase.from('transactions').select('*, categories(id,name,color)').eq('business_id', business.id).order('date', { ascending: false }),
      supabase.from('categories').select('*').eq('business_id', business.id),
    ])
    setTxs(transactions || [])
    setCategories(cats || [])

    // Chart — últimos 6 meses
    const now = new Date()
    const months: any[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
      months.push({ key, label: MONTHS[d.getMonth()], income: 0, expense: 0 })
    }
    ;(transactions || []).forEach(t => {
      const m = months.find(mo => t.date?.startsWith(mo.key))
      if (m) m[t.type === 'income' ? 'income' : 'expense'] += Number(t.amount)
    })
    setChartData(months)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const payload = {
      title: form.title, amount: parseFloat(form.amount), type: form.type,
      date: form.date, paid: form.paid,
      category_id: form.category_id || null,
      notes: form.notes || null,
      business_id: biz.id, created_by: user?.id,
    }
    if (editing) {
      await supabase.from('transactions').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('transactions').insert(payload)
    }
    setShowModal(false); setSaving(false); setEditing(null)
    setForm({ title: '', amount: '', type: 'expense', date: new Date().toISOString().split('T')[0], paid: true, category_id: '', notes: '' })
    load()
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    await supabase.from('transactions').delete().eq('id', id)
    setDeleting(null); load()
  }

  async function togglePaid(tx: any) {
    await supabase.from('transactions').update({ paid: !tx.paid }).eq('id', tx.id)
    load()
  }

  function openEdit(tx: any) {
    setEditing(tx)
    setForm({ title: tx.title, amount: String(tx.amount), type: tx.type, date: tx.date, paid: tx.paid, category_id: tx.category_id || '', notes: tx.notes || '' })
    setShowModal(true)
  }

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const fmtS = (v: number) => v >= 1e6 ? `R$ ${(v/1e6).toFixed(1)}M` : v >= 1e3 ? `R$ ${(v/1e3).toFixed(1)}k` : fmt(v)

  const filtered = txs.filter(t => {
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase())
    const matchType   = filterType === 'all' || t.type === filterType
    const matchMonth  = !filterMonth || t.date?.startsWith(filterMonth)
    const matchCat    = !filterCat || t.category_id === filterCat
    return matchSearch && matchType && matchMonth && matchCat
  })

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paginated  = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE)

  const income  = filtered.filter(t => t.type === 'income').reduce((a,t) => a + Number(t.amount), 0)
  const expense = filtered.filter(t => t.type === 'expense').reduce((a,t) => a + Number(t.amount), 0)
  const profit  = income - expense
  const pending = filtered.filter(t => !t.paid)

  const cardStyle = { background: 'rgba(13,13,20,0.82)', border: '1px solid rgba(255,255,255,0.065)', backdropFilter: 'blur(14px)', boxShadow: '0 4px 28px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04)' }
  const inputStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#e8e8f0', borderRadius: 10, padding: '9px 12px', fontSize: 13, outline: 'none', width: '100%', transition: 'border-color 0.15s ease', fontFamily: 'inherit' }

  if (loading) return (
    <>
      <AcernityFonts />
      <BackgroundGrid><FloatingOrbs />
        <div className="flex flex-col gap-5">
          <div className="flex justify-between"><Skeleton className="h-9 w-44 rounded-xl" /><Skeleton className="h-10 w-40 rounded-xl" /></div>
          <div className="grid grid-cols-3 gap-3">{[0,1,2].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
          <Skeleton className="h-52 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </BackgroundGrid>
    </>
  )

  return (
    <>
      <AcernityFonts />
      <BackgroundGrid>
        <FloatingOrbs />
        <div className="flex flex-col gap-5">

          {/* Header */}
          <motion.div {...fadeUp(0)} className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Syne, sans-serif' }}>Financeiro</h1>
              <p className="text-sm mt-0.5" style={{ color: '#4a4a6a' }}>
                {new Date(filterMonth+'-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#6b6b8a', cursor: 'pointer' }}
                onClick={() => { /* export CSV */ }}>
                <Download size={14} /> <span className="hidden sm:inline">Exportar</span>
              </motion.button>
              <ShimmerButton
                onClick={() => { setEditing(null); setForm({ title: '', amount: '', type: 'expense', date: new Date().toISOString().split('T')[0], paid: true, category_id: '', notes: '' }); setShowModal(true) }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: 'linear-gradient(135deg, #7c6ef7, #a06ef7)', color: 'white', boxShadow: '0 0 28px rgba(124,110,247,0.45), inset 0 1px 0 rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>
                <Plus size={15} /> Novo lançamento
              </ShimmerButton>
            </div>
          </motion.div>

          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Entradas',  value: income,  color: '#34d399', glow: 'rgba(52,211,153,0.18)',  icon: TrendingUp },
              { label: 'Saídas',    value: expense, color: '#f87171', glow: 'rgba(248,113,113,0.18)', icon: TrendingDown },
              { label: 'Saldo',     value: profit,  color: profit >= 0 ? '#34d399' : '#f87171', glow: profit >= 0 ? 'rgba(52,211,153,0.18)' : 'rgba(248,113,113,0.18)', icon: profit >= 0 ? TrendingUp : TrendingDown },
              { label: 'Pendentes', value: pending.length, color: '#fbbf24', glow: 'rgba(251,191,36,0.16)', icon: Calendar, isCount: true },
            ].map(({ label, value, color, glow, icon: Icon, isCount }, i) => (
              <motion.div key={label} {...fadeUp(0.08 + i * 0.06)}>
                <SpotlightCard className="rounded-2xl" spotlightColor={`${color}14`} style={cardStyle}>
                  <div className="p-4 relative overflow-hidden">
                    <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full pointer-events-none"
                      style={{ background: glow, filter: 'blur(18px)', zIndex: 0 }} />
                    <div className="flex items-center justify-between mb-3" style={{ position: 'relative', zIndex: 1 }}>
                      <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#4a4a6a', letterSpacing: '0.1em' }}>{label}</span>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}14`, border: `1px solid ${color}22`, boxShadow: `0 0 12px ${color}20` }}>
                        <Icon size={13} style={{ color }} strokeWidth={2} />
                      </div>
                    </div>
                    <p className="text-xl font-bold tabular-nums" style={{ fontFamily: 'Syne, sans-serif', color, textShadow: `0 0 22px ${color}55`, position: 'relative', zIndex: 1 }}>
                      {isCount ? value : <AnimatedNumber value={value as number} format={fmtS} />}
                    </p>
                  </div>
                </SpotlightCard>
              </motion.div>
            ))}
          </div>

          {/* Chart */}
          <motion.div {...fadeUp(0.22)}>
            <SpotlightCard className="rounded-2xl" style={cardStyle}>
              <div className="p-5">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="font-bold text-sm" style={{ fontFamily: 'Syne, sans-serif', color: '#e8e8f0' }}>Evolução mensal</h2>
                    <p className="text-xs mt-0.5" style={{ color: '#4a4a6a' }}>Últimos 6 meses</p>
                  </div>
                  <div className="flex gap-4">
                    {[{ color: '#34d399', label: 'Entradas' }, { color: '#f87171', label: 'Saídas' }].map(l => (
                      <div key={l.label} className="flex items-center gap-1.5 text-xs" style={{ color: '#4a4a6a' }}>
                        <div className="w-2 h-2 rounded-full" style={{ background: l.color, boxShadow: `0 0 5px ${l.color}` }} /> {l.label}
                      </div>
                    ))}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }} barCategoryGap="30%">
                    <defs>
                      <linearGradient id="barIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#34d399" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#34d399" stopOpacity={0.5} />
                      </linearGradient>
                      <linearGradient id="barExpense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f87171" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#f87171" stopOpacity={0.5} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#3a3a5c' }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} tick={{ fontSize: 10, fill: '#3a3a5c' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTip />} cursor={{ fill: 'rgba(124,110,247,0.05)' }} />
                    <Bar dataKey="income" fill="url(#barIncome)" radius={[4,4,0,0]} maxBarSize={32} />
                    <Bar dataKey="expense" fill="url(#barExpense)" radius={[4,4,0,0]} maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </SpotlightCard>
          </motion.div>

          {/* Filters + Table */}
          <motion.div {...fadeUp(0.3)}>
            <SpotlightCard className="rounded-2xl overflow-hidden" style={cardStyle}>
              {/* Search & Filters */}
              <div className="p-4 border-b flex flex-wrap items-center gap-3" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                {/* Search */}
                <div className="flex items-center gap-2 flex-1 min-w-0 px-3 py-2 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <Search size={13} style={{ color: '#4a4a6a', flexShrink: 0 }} />
                  <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
                    placeholder="Buscar transação..." className="text-sm outline-none flex-1 bg-transparent"
                    style={{ color: '#d0d0e0', minWidth: 0 }} />
                  {search && <motion.button whileTap={{ scale: 0.9 }} onClick={() => setSearch('')}><X size={13} style={{ color: '#4a4a6a' }} /></motion.button>}
                </div>

                {/* Type filter */}
                <div className="flex gap-1">
                  {(['all','income','expense'] as const).map(t => (
                    <button key={t} onClick={() => { setFilterType(t); setPage(1) }}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                      style={{
                        background: filterType === t ? (t === 'income' ? 'rgba(52,211,153,0.15)' : t === 'expense' ? 'rgba(248,113,113,0.15)' : 'rgba(124,110,247,0.15)') : 'rgba(255,255,255,0.03)',
                        color: filterType === t ? (t === 'income' ? '#34d399' : t === 'expense' ? '#f87171' : '#9d8fff') : '#6b6b8a',
                        border: `1px solid ${filterType === t ? (t === 'income' ? 'rgba(52,211,153,0.3)' : t === 'expense' ? 'rgba(248,113,113,0.3)' : 'rgba(124,110,247,0.3)') : 'rgba(255,255,255,0.06)'}`,
                        cursor: 'pointer', transition: 'all 0.15s ease',
                      }}>
                      {t === 'all' ? 'Todos' : t === 'income' ? '↑ Entradas' : '↓ Saídas'}
                    </button>
                  ))}
                </div>

                {/* Month */}
                <input type="month" value={filterMonth} onChange={e => { setFilterMonth(e.target.value); setPage(1) }}
                  className="px-3 py-1.5 rounded-xl text-xs outline-none"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: '#d0d0e0', cursor: 'pointer' }} />

                {/* Category filter */}
                {categories.length > 0 && (
                  <select value={filterCat} onChange={e => { setFilterCat(e.target.value); setPage(1) }}
                    className="px-3 py-1.5 rounded-xl text-xs outline-none"
                    style={{ background: 'rgba(13,13,20,0.95)', border: '1px solid rgba(255,255,255,0.07)', color: filterCat ? '#d0d0e0' : '#6b6b8a', cursor: 'pointer' }}>
                    <option value="">Categoria</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                )}

                <span className="text-xs ml-auto" style={{ color: '#4a4a6a' }}>{filtered.length} registro{filtered.length !== 1 ? 's' : ''}</span>
              </div>

              {/* Table */}
              {paginated.length === 0 ? (
                <div className="py-16 text-center">
                  <DollarSign size={32} className="mx-auto mb-3" style={{ color: '#2a2a3e' }} />
                  <p className="text-sm" style={{ color: '#4a4a6a' }}>Nenhuma transação encontrada</p>
                </div>
              ) : paginated.map((tx, i) => (
                <motion.div key={tx.id}
                  initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.22, delay: i * 0.03 }}
                  className="flex items-center gap-3 px-5 py-3 group"
                  style={{ borderBottom: i < paginated.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', transition: 'background 0.12s ease' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                  {/* Icon */}
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: tx.type === 'income' ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)', border: `1px solid ${tx.type === 'income' ? 'rgba(52,211,153,0.18)' : 'rgba(248,113,113,0.18)'}`, boxShadow: tx.type === 'income' ? '0 0 10px rgba(52,211,153,0.12)' : '0 0 10px rgba(248,113,113,0.12)' }}>
                    {tx.type === 'income' ? <TrendingUp size={14} style={{ color: '#34d399' }} strokeWidth={2} /> : <TrendingDown size={14} style={{ color: '#f87171' }} strokeWidth={2} />}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: '#d0d0e0' }}>{tx.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs" style={{ color: '#4a4a6a' }}>
                        {new Date(tx.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                      {tx.categories?.name && (
                        <span className="text-xs px-1.5 py-0.5 rounded-md"
                          style={{ background: `${tx.categories.color || '#6b6b8a'}18`, color: tx.categories.color || '#6b6b8a', border: `1px solid ${tx.categories.color || '#6b6b8a'}25` }}>
                          {tx.categories.name}
                        </span>
                      )}
                      {tx.notes && <span className="text-xs truncate max-w-24" style={{ color: '#3a3a5c' }}>{tx.notes}</span>}
                    </div>
                  </div>

                  {/* Paid toggle */}
                  <motion.button whileTap={{ scale: 0.88 }} onClick={() => togglePaid(tx)}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold"
                    style={{
                      background: tx.paid ? 'rgba(52,211,153,0.1)' : 'rgba(251,191,36,0.1)',
                      color: tx.paid ? '#34d399' : '#fbbf24',
                      border: `1px solid ${tx.paid ? 'rgba(52,211,153,0.22)' : 'rgba(251,191,36,0.22)'}`,
                      cursor: 'pointer', transition: 'all 0.15s ease',
                    }}>
                    {tx.paid ? <Check size={11} /> : null}
                    {tx.paid ? 'Pago' : 'Pendente'}
                  </motion.button>

                  {/* Amount */}
                  <span className="text-sm font-bold tabular-nums shrink-0 w-24 text-right"
                    style={{ color: tx.type === 'income' ? '#34d399' : '#f87171', textShadow: tx.type === 'income' ? '0 0 12px rgba(52,211,153,0.35)' : '0 0 12px rgba(248,113,113,0.35)' }}>
                    {tx.type === 'income' ? '+' : '−'}{fmt(Number(tx.amount))}
                  </span>

                  {/* Actions — visible on hover */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <motion.button whileTap={{ scale: 0.88 }} onClick={() => openEdit(tx)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ background: 'rgba(124,110,247,0.1)', color: '#9d8fff', cursor: 'pointer' }}>
                      <Edit2 size={12} />
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.88 }} onClick={() => handleDelete(tx.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171', cursor: 'pointer' }}>
                      {deleting === tx.id
                        ? <div className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
                        : <Trash2 size={12} />}
                    </motion.button>
                  </div>
                </motion.div>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                  <span className="text-xs" style={{ color: '#4a4a6a' }}>
                    Página {page} de {totalPages}
                  </span>
                  <div className="flex gap-2">
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: 'rgba(255,255,255,0.04)', color: page <= 1 ? '#3a3a5c' : '#9a9ab0', cursor: page <= 1 ? 'default' : 'pointer' }}>
                      <ChevronLeft size={14} />
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: 'rgba(255,255,255,0.04)', color: page >= totalPages ? '#3a3a5c' : '#9a9ab0', cursor: page >= totalPages ? 'default' : 'pointer' }}>
                      <ChevronRight size={14} />
                    </motion.button>
                  </div>
                </div>
              )}
            </SpotlightCard>
          </motion.div>
        </div>

        {/* Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
              style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)' }}
              onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
              <motion.div
                initial={{ y: 60, opacity: 0, scale: 0.97 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 60, opacity: 0 }}
                transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] as const }}
                className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6"
                style={{ background: 'rgba(10,10,18,0.98)', border: '1px solid rgba(124,110,247,0.22)', boxShadow: '0 0 0 1px rgba(124,110,247,0.08), 0 -8px 48px rgba(0,0,0,0.75)', backdropFilter: 'blur(24px)' }}>
                <div className="w-10 h-1 rounded-full mx-auto mb-5 sm:hidden" style={{ background: '#2a2a3e' }} />
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-bold text-lg" style={{ fontFamily: 'Syne, sans-serif', color: '#f0f0f8' }}>
                    {editing ? 'Editar lançamento' : 'Novo lançamento'}
                  </h2>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => { setShowModal(false); setEditing(null) }}
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.05)', color: '#6b6b8a', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer' }}>
                    <X size={14} />
                  </motion.button>
                </div>

                <form onSubmit={handleSave} className="flex flex-col gap-3.5">
                  <div className="grid grid-cols-2 gap-2">
                    {['expense', 'income'].map(t => (
                      <button key={t} type="button" onClick={() => setForm({ ...form, type: t })}
                        className="py-2.5 rounded-xl text-sm font-semibold"
                        style={{ background: form.type === t ? (t === 'income' ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)') : 'rgba(255,255,255,0.02)', color: form.type === t ? (t === 'income' ? '#34d399' : '#f87171') : '#4a4a6a', border: `1px solid ${form.type === t ? (t === 'income' ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)') : 'rgba(255,255,255,0.07)'}`, boxShadow: form.type === t ? `0 0 14px ${t === 'income' ? 'rgba(52,211,153,0.14)' : 'rgba(248,113,113,0.14)'}` : 'none', transition: 'all 0.15s', cursor: 'pointer' }}>
                        {t === 'income' ? '↑ Entrada' : '↓ Saída'}
                      </button>
                    ))}
                  </div>
                  <input type="text" placeholder="Título *" value={form.title} required onChange={e => setForm({ ...form, title: e.target.value })} style={inputStyle} onFocus={e => e.currentTarget.style.borderColor = 'rgba(124,110,247,0.5)'} onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'} />
                  <div className="grid grid-cols-2 gap-3">
                    <input type="number" step="0.01" placeholder="Valor *" value={form.amount} required onChange={e => setForm({ ...form, amount: e.target.value })} style={inputStyle} onFocus={e => e.currentTarget.style.borderColor = 'rgba(124,110,247,0.5)'} onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'} />
                    <input type="date" value={form.date} required onChange={e => setForm({ ...form, date: e.target.value })} style={inputStyle} onFocus={e => e.currentTarget.style.borderColor = 'rgba(124,110,247,0.5)'} onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'} />
                  </div>
                  {categories.length > 0 && (
                    <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}
                      style={{ ...inputStyle, background: 'rgba(13,13,20,0.95)' }}>
                      <option value="">Categoria (opcional)</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  )}
                  <input type="text" placeholder="Observações (opcional)" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={inputStyle} onFocus={e => e.currentTarget.style.borderColor = 'rgba(124,110,247,0.5)'} onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'} />
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={form.paid} onChange={e => setForm({ ...form, paid: e.target.checked })} style={{ accentColor: '#7c6ef7' }} />
                    <span className="text-sm" style={{ color: '#6b6b8a' }}>Já foi pago / recebido</span>
                  </label>
                  <ShimmerButton type="submit" disabled={saving}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm w-full mt-1"
                    style={{ background: 'linear-gradient(135deg, #7c6ef7, #a06ef7)', color: 'white', boxShadow: saving ? 'none' : '0 0 28px rgba(124,110,247,0.38)', border: '1px solid rgba(255,255,255,0.1)', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                    {saving ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : editing ? 'Salvar alterações' : 'Salvar lançamento'}
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
