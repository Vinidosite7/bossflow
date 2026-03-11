'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useBusiness } from '@/hooks/useBusiness'
import { sendPush, fmt as fmtPush } from '@/lib/push'
import { useTour } from '@/hooks/useTour'
import { usePlanLimits } from '@/hooks/usePlanLimits'
import { TourTooltip } from '@/components/TourTooltip'
import {
  ShoppingCart, Plus, Loader2, X, Pencil, Trash2,
  Search, AlertTriangle, TrendingUp, DollarSign, Clock,
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
  cyan:    '#22d3ee',
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
const inpSm: React.CSSProperties = { ...inp, padding: '8px 10px', fontSize: 12 }

const fadeUp = (delay = 0) => ({
  initial:    { opacity: 0, y: 20, filter: 'blur(4px)' },
  animate:    { opacity: 1, y: 0,  filter: 'blur(0px)' },
  transition: { duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] as const },
})

const STATUS: Record<string, { label: string; color: string }> = {
  pending:   { label: 'Pendente',   color: T.amber  },
  paid:      { label: 'Pago',       color: T.green  },
  cancelled: { label: 'Cancelado',  color: T.red    },
}

const TOUR_STEPS = [
  { target: '[data-tour="vendas-header"]', title: 'Registro de vendas',  description: 'Registre e acompanhe todas as suas vendas. Clique em "Nova venda" para começar.', position: 'bottom' as const },
  { target: '[data-tour="vendas-kpis"]',   title: 'Resumo rápido',       description: 'Total recebido, vendas pagas e pendentes em tempo real.', position: 'bottom' as const },
  { target: '[data-tour="vendas-busca"]',  title: 'Busca inteligente',   description: 'Filtre suas vendas por cliente ou status rapidamente.', position: 'bottom' as const },
  { target: '[data-tour="vendas-lista"]',  title: 'Lista de vendas',     description: 'Cada venda mostra cliente, data, status e valor. Passe o mouse para editar ou excluir.', position: 'top' as const },
]

const fmt      = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtShort = (v: number) => {
  if (v >= 1e6) return `R$ ${(v / 1e6).toFixed(1)}M`
  if (v >= 1e3) return `R$ ${(v / 1e3).toFixed(1)}k`
  return fmt(v)
}

// ── FIX: supabase client criado fora do componente (evita recriação a cada render)
const supabase = createClient()

export default function VendasPage() {
  const { businessId, loading: bizLoading } = useBusiness()
  const { plan } = usePlanLimits()
  const tour     = useTour('vendas', TOUR_STEPS)

  const [sales,       setSales]       = useState<any[]>([])
  const [clients,     setClients]     = useState<any[]>([])
  const [products,    setProducts]    = useState<any[]>([])
  const [loading,     setLoading]     = useState(true)
  const [showForm,    setShowForm]    = useState(false)
  const [showConfirm, setShowConfirm] = useState<string | null>(null)
  const [editSale,    setEditSale]    = useState<any>(null)
  const [saving,      setSaving]      = useState(false)
  const [deleting,    setDeleting]    = useState(false)
  const [search,      setSearch]      = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid' | 'cancelled'>('all')

  const [form, setForm] = useState({
    client_id: '', status: 'pending',
    date: new Date().toISOString().split('T')[0], notes: '',
  })
  const [items, setItems] = useState([{ product_id: '', name: '', quantity: 1, unit_price: 0 }])

  async function load() {
    if (!businessId) return
    try {
      const [{ data: s }, { data: c }, { data: p }] = await Promise.all([
        supabase.from('sales').select('*, clients(name), sale_items(*)')
          .eq('business_id', businessId).order('date', { ascending: false }),
        supabase.from('clients').select('*').eq('business_id', businessId).order('name'),
        supabase.from('products').select('*').eq('business_id', businessId).order('name'),
      ])
      setSales(s || [])
      setClients(c || [])
      setProducts(p || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { if (businessId) load() }, [businessId])
  useEffect(() => { if (!bizLoading && !businessId) setLoading(false) }, [bizLoading, businessId])

  function openCreate() {
    setEditSale(null)
    setForm({ client_id: '', status: 'pending', date: new Date().toISOString().split('T')[0], notes: '' })
    setItems([{ product_id: '', name: '', quantity: 1, unit_price: 0 }])
    setShowForm(true)
  }
  async function openEdit(sale: any) {
    setEditSale(sale)
    setForm({ client_id: sale.client_id || '', status: sale.status, date: sale.date, notes: sale.notes || '' })
    const { data: saleItems } = await supabase.from('sale_items').select('*').eq('sale_id', sale.id)
    setItems(saleItems?.length
      ? saleItems.map((i: any) => ({ product_id: i.product_id || '', name: i.name, quantity: i.quantity, unit_price: i.unit_price }))
      : [{ product_id: '', name: '', quantity: 1, unit_price: 0 }])
    setShowForm(true)
  }
  function addItem() { setItems([...items, { product_id: '', name: '', quantity: 1, unit_price: 0 }]) }
  function removeItem(i: number) { setItems(items.filter((_, idx) => idx !== i)) }
  function updateItem(i: number, field: string, value: any) {
    const updated = [...items]
    updated[i] = { ...updated[i], [field]: value }
    if (field === 'product_id') {
      const p = products.find(p => p.id === value)
      if (p) { updated[i].name = p.name; updated[i].unit_price = p.price }
    }
    setItems(updated)
  }
  const total = items.reduce((a, i) => a + Number(i.unit_price) * Number(i.quantity), 0)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (editSale) {
        const { error: updErr } = await supabase.from('sales').update({ client_id: form.client_id || null, status: form.status, date: form.date, notes: form.notes || null, total }).eq('id', editSale.id)
        if (updErr) throw updErr
        await supabase.from('sale_items').delete().eq('sale_id', editSale.id)
        await supabase.from('sale_items').insert(items.filter(i => i.name).map(i => ({ sale_id: editSale.id, ...i, product_id: i.product_id || null })))
      } else {
        const { data: sale, error: insErr } = await supabase.from('sales').insert({ client_id: form.client_id || null, status: form.status, date: form.date, notes: form.notes || null, total, business_id: businessId, created_by: user?.id }).select().single()
        if (insErr) throw insErr
        if (sale) {
          await supabase.from('sale_items').insert(items.filter(i => i.name).map(i => ({ sale_id: sale.id, ...i, product_id: i.product_id || null })))
          if (user) {
            const clientName = clients.find((c: any) => c.id === form.client_id)?.name
            await sendPush(user.id, '💰 Nova venda registrada!', `${clientName ? clientName + ' · ' : ''}${fmtPush(total)}`, '/vendas')
          }
        }
      }
      setShowForm(false); setEditSale(null); load()
    } catch (err: any) { console.error('[Vendas] save:', err) } finally { setSaving(false) }
  }
  async function handleDelete(id: string) {
    setDeleting(true)
    await supabase.from('sale_items').delete().eq('sale_id', id)
    await supabase.from('sales').delete().eq('id', id)
    setShowConfirm(null); setDeleting(false); load()
  }

  const totalPaid    = sales.filter(s => s.status === 'paid').reduce((a, s) => a + Number(s.total), 0)
  const countPaid    = sales.filter(s => s.status === 'paid').length
  const countPending = sales.filter(s => s.status === 'pending').length

  const filtered = sales.filter(s => {
    const matchSearch = search === '' ||
      s.clients?.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.status.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || s.status === statusFilter
    return matchSearch && matchStatus
  })

  if (loading || bizLoading) return (
    <BackgroundGrid>
      <FloatingOrbs />
      <div className="flex flex-col gap-5">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-32 rounded-xl" />
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>
        <div className="grid grid-cols-3 gap-3">{[0,1,2].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
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
        <motion.div {...fadeUp(0)} className="flex items-start justify-between gap-4" data-tour="vendas-header">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: SYNE, color: T.text }}>Vendas</h1>
            <p className="text-sm mt-1" style={{ color: T.muted, fontFamily: SYNE }}>
              {sales.length} {sales.length === 1 ? 'venda registrada' : 'vendas registradas'}
            </p>
          </div>
          <ShimmerButton onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold shrink-0"
            style={{ background: 'linear-gradient(135deg,#7c6ef7,#a06ef7)', color: 'white', boxShadow: '0 0 28px rgba(124,110,247,0.45),inset 0 1px 0 rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontFamily: SYNE }}>
            <Plus size={15} />
            <span className="hidden sm:inline">Nova venda</span>
            <span className="sm:hidden">Novo</span>
          </ShimmerButton>
        </motion.div>

        {/* ── KPIs ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" data-tour="vendas-kpis">
          {[
            { label: 'Recebido',  value: fmtShort(totalPaid), color: T.green, icon: DollarSign,   sub: 'Vendas pagas'                         },
            { label: 'Pagas',     value: String(countPaid),   color: T.green, icon: TrendingUp,   sub: `de ${sales.length} total`              },
            { label: 'Pendentes', value: String(countPending),color: T.amber, icon: Clock,        sub: `${countPending > 0 ? 'a receber' : 'tudo em dia'}` },
          ].map(({ label, value, color, icon: Icon, sub }, i) => (
            <motion.div key={label} {...fadeUp(0.08 + i * 0.07)}>
              <SpotlightCard className="rounded-2xl h-full" spotlightColor={`${color}16`} style={card}>
                <div className="p-5 relative overflow-hidden">
                  <GlowCorner color={`${color}22`} position="bottom-right" />
                  <div className="flex items-center justify-between mb-4" style={{ position: 'relative', zIndex: 1 }}>
                    <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: T.muted, fontFamily: SYNE }}>{label}</span>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${color}14`, border: `1px solid ${color}25`, boxShadow: `0 0 14px ${color}20` }}>
                      <Icon size={14} style={{ color }} strokeWidth={2} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold tabular-nums" style={{ fontFamily: SYNE, color, textShadow: `0 0 28px ${color}55`, letterSpacing: '-0.01em', position: 'relative', zIndex: 1 }}>{value}</p>
                  <p className="text-xs mt-1.5" style={{ color: T.muted, fontFamily: SYNE, position: 'relative', zIndex: 1 }}>{sub}</p>
                </div>
              </SpotlightCard>
            </motion.div>
          ))}
        </div>

        {/* ── Filtros ── */}
        <motion.div {...fadeUp(0.22)} className="flex flex-col sm:flex-row gap-3" data-tour="vendas-busca">
          <div className="flex items-center gap-2.5 flex-1 px-4 py-2.5 rounded-xl"
            style={{ background: T.bg, border: `1px solid ${T.border}`, backdropFilter: T.blur }}>
            <Search size={14} style={{ color: T.muted, flexShrink: 0 }} />
            <input type="text" placeholder="Buscar por cliente ou status..." value={search}
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

          <div className="flex gap-1.5 p-1 rounded-xl" style={{ background: T.bg, border: `1px solid ${T.border}` }}>
            {([['all','Todos'],['paid','Pagas'],['pending','Pendentes'],['cancelled','Canceladas']] as const).map(([v,l]) => (
              <motion.button key={v} whileTap={{ scale: 0.95 }} onClick={() => setStatusFilter(v)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: statusFilter === v
                    ? v === 'paid' ? `${T.green}12` : v === 'pending' ? `${T.amber}12` : v === 'cancelled' ? `${T.red}12` : `${T.purple}12`
                    : 'transparent',
                  color: statusFilter === v
                    ? v === 'paid' ? T.green : v === 'pending' ? T.amber : v === 'cancelled' ? T.red : T.violet
                    : T.muted,
                  border: statusFilter === v
                    ? `1px solid ${v === 'paid' ? `${T.green}30` : v === 'pending' ? `${T.amber}30` : v === 'cancelled' ? `${T.red}30` : `${T.purple}30`}`
                    : '1px solid transparent',
                  cursor: 'pointer', fontFamily: SYNE, whiteSpace: 'nowrap',
                }}>{l}</motion.button>
            ))}
          </div>
        </motion.div>

        {/* ── Lista ── */}
        {filtered.length === 0 ? (
          <motion.div {...fadeUp(0.28)}>
            <SpotlightCard className="rounded-2xl" spotlightColor={`${T.cyan}10`} style={card}>
              <div className="py-20 flex flex-col items-center gap-4 text-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: `${T.cyan}10`, border: `1px solid ${T.cyan}25`, boxShadow: `0 0 30px ${T.cyan}15` }}>
                  <ShoppingCart size={26} style={{ color: T.cyan }} strokeWidth={1.6} />
                </div>
                <h2 className="text-lg font-bold" style={{ fontFamily: SYNE, color: T.text }}>
                  {search || statusFilter !== 'all' ? 'Nenhum resultado' : 'Nenhuma venda ainda'}
                </h2>
                <p className="text-sm" style={{ color: T.muted, fontFamily: SYNE }}>
                  {search || statusFilter !== 'all' ? 'Tente outro filtro ou termo' : 'Registre sua primeira venda'}
                </p>
                {(search || statusFilter !== 'all') && (
                  <motion.button whileTap={{ scale: 0.97 }}
                    onClick={() => { setSearch(''); setStatusFilter('all') }}
                    className="text-xs px-4 py-2 rounded-lg"
                    style={{ background: `${T.purple}10`, color: T.violet, border: `1px solid ${T.purple}25`, cursor: 'pointer', fontFamily: SYNE }}>
                    Limpar filtros
                  </motion.button>
                )}
              </div>
            </SpotlightCard>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} data-tour="vendas-lista">
            <SpotlightCard className="rounded-2xl overflow-hidden" style={card}>
              {/* Header da lista */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: T.border }}>
                <p className="text-xs font-semibold" style={{ color: T.muted, fontFamily: SYNE }}>
                  {filtered.length}{filtered.length !== sales.length ? ` de ${sales.length}` : ''} vendas
                </p>
                <span className="text-xs font-semibold tabular-nums" style={{ color: T.green, fontFamily: SYNE }}>
                  {fmtShort(filtered.filter(s => s.status === 'paid').reduce((a, s) => a + Number(s.total), 0))} recebido
                </span>
              </div>

              <AnimatePresence initial={false}>
                {filtered.map((sale, i) => {
                  const s = STATUS[sale.status as keyof typeof STATUS] ?? STATUS.pending
                  return (
                    <motion.div key={sale.id}
                      initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 12 }}
                      transition={{ duration: 0.22, delay: i * 0.025 }}
                      className="group flex items-center gap-3 px-5 py-3.5"
                      style={{ borderBottom: i < filtered.length - 1 ? `1px solid rgba(255,255,255,0.035)` : 'none', transition: 'background 0.12s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.022)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: `${T.cyan}10`, border: `1px solid ${T.cyan}20`, boxShadow: `0 0 10px ${T.cyan}12` }}>
                        <ShoppingCart size={14} style={{ color: T.cyan }} strokeWidth={2} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: T.text, fontFamily: SYNE }}>
                          {sale.clients?.name || 'Venda avulsa'}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs" style={{ color: T.muted, fontFamily: SYNE }}>
                            {new Date(sale.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' })}
                          </span>
                          {sale.sale_items?.length > 0 && (
                            <span className="text-xs px-1.5 py-0.5 rounded-md"
                              style={{ background: 'rgba(255,255,255,0.04)', color: T.sub, border: `1px solid ${T.border}`, fontFamily: SYNE }}>
                              {sale.sale_items.length} {sale.sale_items.length === 1 ? 'item' : 'itens'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Status badge */}
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0"
                        style={{ background: `${s.color}12`, color: s.color, border: `1px solid ${s.color}28`, fontFamily: SYNE }}>
                        {s.label}
                      </span>

                      <span className="text-sm font-bold shrink-0 tabular-nums"
                        style={{ fontFamily: SYNE, color: T.green, textShadow: `0 0 14px ${T.green}40` }}>
                        {fmt(Number(sale.total))}
                      </span>

                      <div className="flex gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ml-1">
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                          onClick={() => openEdit(sale)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{ background: `${T.purple}12`, color: T.violet, border: `1px solid ${T.purple}25`, cursor: 'pointer' }}>
                          <Pencil size={11} />
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                          onClick={() => setShowConfirm(sale.id)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{ background: `${T.red}10`, color: T.red, border: `1px solid ${T.red}22`, cursor: 'pointer' }}>
                          <Trash2 size={11} />
                        </motion.button>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </SpotlightCard>
          </motion.div>
        )}

        {/* ── Modal venda ── */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
              style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)' }}
              onClick={e => { if (e.target === e.currentTarget) { setShowForm(false); setEditSale(null) } }}>
              <motion.div
                initial={{ y: 60, opacity: 0, scale: 0.97 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 60, opacity: 0 }}
                transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] as const }}
                className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
                style={{ background: T.bgDeep, border: `1px solid ${T.borderP}`, boxShadow: '0 0 0 1px rgba(124,110,247,0.08),0 -8px 48px rgba(0,0,0,0.8)', backdropFilter: 'blur(28px)' }}>
                <div className="w-10 h-1 rounded-full mx-auto mb-5 sm:hidden" style={{ background: 'rgba(255,255,255,0.1)' }} />
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-bold text-lg" style={{ fontFamily: SYNE, color: T.text }}>
                    {editSale ? 'Editar venda' : 'Nova venda'}
                  </h2>
                  <motion.button whileTap={{ scale: 0.9 }}
                    onClick={() => { setShowForm(false); setEditSale(null) }}
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.05)', color: T.sub, border: `1px solid ${T.border}`, cursor: 'pointer' }}>
                    <X size={14} />
                  </motion.button>
                </div>

                <form onSubmit={handleSave} className="flex flex-col gap-4">
                  {/* Cliente + Data */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: T.muted, fontFamily: SYNE }}>Cliente</label>
                      <select value={form.client_id} onChange={e => setForm({ ...form, client_id: e.target.value })}
                        style={{ ...inp, cursor: 'pointer' }}>
                        <option value="">Sem cliente</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: T.muted, fontFamily: SYNE }}>Data</label>
                      <input type="date" value={form.date} required
                        onChange={e => setForm({ ...form, date: e.target.value })} style={inp}
                        onFocus={e => e.currentTarget.style.borderColor = T.borderP}
                        onBlur={e => e.currentTarget.style.borderColor = T.border} />
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: T.muted, fontFamily: SYNE }}>Status</label>
                    <div className="flex gap-2">
                      {Object.entries(STATUS).map(([key, { label, color }]) => (
                        <button key={key} type="button" onClick={() => setForm({ ...form, status: key })}
                          className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                          style={{
                            background: form.status === key ? `${color}14` : 'rgba(255,255,255,0.02)',
                            color:      form.status === key ? color : T.muted,
                            border:     `1px solid ${form.status === key ? `${color}35` : T.border}`,
                            cursor: 'pointer', fontFamily: SYNE,
                          }}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Itens */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: T.muted, fontFamily: SYNE }}>Itens da venda</label>
                    <AnimatePresence initial={false}>
                      {items.map((item, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
                          className="flex gap-2 items-center">
                          <select value={item.product_id} onChange={e => updateItem(i, 'product_id', e.target.value)}
                            style={{ ...inpSm, flex: '1 1 0', cursor: 'pointer', minWidth: 0 }}>
                            <option value="">Produto</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                          {!item.product_id && (
                            <input type="text" placeholder="Nome" value={item.name}
                              onChange={e => updateItem(i, 'name', e.target.value)}
                              style={{ ...inpSm, flex: '1 1 0', minWidth: 0 }} />
                          )}
                          <input type="number" step="0.01" placeholder="R$" value={item.unit_price}
                            onChange={e => updateItem(i, 'unit_price', e.target.value)}
                            style={{ ...inpSm, width: 72, flexShrink: 0 }} />
                          <input type="number" min="1" placeholder="Qtd" value={item.quantity}
                            onChange={e => updateItem(i, 'quantity', e.target.value)}
                            style={{ ...inpSm, width: 56, flexShrink: 0 }} />
                          {items.length > 1 && (
                            <motion.button whileTap={{ scale: 0.9 }} type="button" onClick={() => removeItem(i)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                              style={{ background: `${T.red}10`, color: T.red, border: `1px solid ${T.red}22`, cursor: 'pointer' }}>
                              <X size={11} />
                            </motion.button>
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    <motion.button type="button" onClick={addItem} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      className="flex items-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-lg w-fit"
                      style={{ background: `${T.purple}10`, color: T.violet, border: `1px solid ${T.purple}22`, cursor: 'pointer', fontFamily: SYNE }}>
                      <Plus size={11} /> Adicionar item
                    </motion.button>
                  </div>

                  {/* Observações */}
                  <textarea placeholder="Observações (opcional)" value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })} rows={2}
                    style={{ ...inp, resize: 'none' }}
                    onFocus={e => e.currentTarget.style.borderColor = T.borderP}
                    onBlur={e => e.currentTarget.style.borderColor = T.border} />

                  {/* Total */}
                  <div className="flex items-center justify-between py-3 border-t" style={{ borderColor: T.border }}>
                    <span className="text-sm font-semibold uppercase tracking-widest" style={{ color: T.muted, fontFamily: SYNE }}>Total</span>
                    <motion.span key={total}
                      initial={{ scale: 1.08 }} animate={{ scale: 1 }}
                      className="text-2xl font-bold tabular-nums"
                      style={{ fontFamily: SYNE, color: T.green, textShadow: `0 0 20px ${T.green}50` }}>
                      {fmt(total)}
                    </motion.span>
                  </div>

                  <ShimmerButton type="submit" disabled={saving}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm w-full"
                    style={{ background: 'linear-gradient(135deg,#7c6ef7,#a06ef7)', color: 'white', boxShadow: saving ? 'none' : '0 0 28px rgba(124,110,247,0.4)', border: '1px solid rgba(255,255,255,0.1)', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, fontFamily: SYNE }}>
                    {saving ? <Loader2 size={16} className="animate-spin" /> : editSale ? 'Salvar alterações' : 'Registrar venda'}
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
                    <h2 className="font-bold text-base" style={{ fontFamily: SYNE, color: T.text }}>Excluir venda?</h2>
                    <p className="text-xs mt-0.5" style={{ color: T.muted, fontFamily: SYNE }}>Esta ação não pode ser desfeita.</p>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowConfirm(null)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                    style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.sub, cursor: 'pointer', fontFamily: SYNE }}>
                    Cancelar
                  </motion.button>
                  <ShimmerButton onClick={() => handleDelete(showConfirm!)} disabled={deleting}
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
