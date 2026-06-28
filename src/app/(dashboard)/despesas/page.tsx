'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { ShoppingCart, Plus, Search, X, Edit2, Trash2, TrendingUp, DollarSign, CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence, animate } from 'framer-motion'
import { SpotlightCard, ShimmerButton, Skeleton, BackgroundGrid, FloatingOrbs, AcernityFonts, GlowCorner } from '@/components/ui/aceternity'

const T = {
  bg: 'rgba(8,8,14,0.92)', bgDeep: 'rgba(6,6,10,0.97)',
  border: 'rgba(255,255,255,0.055)', borderP: 'rgba(124,110,247,0.22)',
  text: '#dcdcf0', sub: '#8a8aaa', muted: '#4a4a6a',
  green: '#34d399', amber: '#fbbf24', purple: '#7c6ef7',
  red: '#f87171', cyan: '#22d3ee', violet: '#a78bfa', blur: 'blur(20px)',
}
const card = { background: T.bg, border: `1px solid ${T.border}`, backdropFilter: T.blur, boxShadow: '0 4px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)' }
const inp: React.CSSProperties = { background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.border}`, color: T.text, borderRadius: 12, padding: '10px 14px', fontSize: 13, outline: 'none', width: '100%', transition: 'border-color 0.15s', fontFamily: 'DM Sans, sans-serif' }
const selStyle: React.CSSProperties = { background: 'rgba(8,8,14,0.95)', border: `1px solid ${T.border}`, color: T.text, borderRadius: 12, padding: '10px 14px', fontSize: 13, outline: 'none', width: '100%', transition: 'border-color 0.15s', fontFamily: 'DM Sans, sans-serif' }
const focus = (e: any) => e.currentTarget.style.borderColor = T.borderP
const blurEv = (e: any) => e.currentTarget.style.borderColor = T.border
const fadeUp = (delay = 0) => ({ initial: { opacity: 0, y: 16, filter: 'blur(4px)' }, animate: { opacity: 1, y: 0, filter: 'blur(0px)' }, transition: { duration: 0.46, delay, ease: [0.16, 1, 0.3, 1] as const } })

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending:   { label: 'Pendente',  color: T.amber },
  completed: { label: 'Concluída', color: T.green },
  cancelled: { label: 'Cancelada', color: T.red },
}
const EMPTY = { title: '', amount: '', date: new Date().toISOString().split('T')[0], status: 'completed', client_id: '', product_id: '', notes: '' }

function AnimatedNumber({ value, format }: { value: number; format: (v: number) => string }) {
  const [display, setDisplay] = useState(format(0))
  const prev = useRef(0)
  useEffect(() => {
    const from = prev.current; prev.current = value
    const ctrl = animate(from, value, { duration: 0.85, ease: 'easeOut', onUpdate: v => setDisplay(format(v)) })
    return ctrl.stop
  }, [value])
  return <span>{display}</span>
}

export default function VendasPage() {
  const supabase = createClient(); const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [biz, setBiz] = useState<any>(null)
  const [sales, setSales] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [search, setSearch] = useState(''); const [filterStatus, setFilterStatus] = useState('all')
  const [showModal, setShowModal] = useState(false); const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState(EMPTY); const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/login'); return }
    const { data: owned } = await supabase.from('businesses').select('*').eq('owner_id', user.id)
    const business = (owned || [])[0]; if (!business) { setLoading(false); return }
    setBiz(business)
    const [{ data: s }, { data: c }, { data: p }] = await Promise.all([
      supabase.from('sales').select('*, clients(name), products(name)').eq('business_id', business.id).order('date', { ascending: false }),
      supabase.from('clients').select('id,name').eq('business_id', business.id),
      supabase.from('products').select('id,name,price').eq('business_id', business.id),
    ])
    setSales(s || []); setClients(c || []); setProducts(p || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    const payload = { title: form.title, amount: parseFloat(form.amount), date: form.date, status: form.status, client_id: form.client_id || null, product_id: form.product_id || null, notes: form.notes || null, business_id: biz.id }
    if (editing) await supabase.from('sales').update(payload).eq('id', editing.id)
    else await supabase.from('sales').insert(payload)
    setSaving(false); setShowModal(false); setEditing(null); setForm(EMPTY); load()
  }
  async function handleDelete(id: string) { setDeleting(id); await supabase.from('sales').delete().eq('id', id); setDeleting(null); load() }
  function openEdit(s: any) { setEditing(s); setForm({ title: s.title || '', amount: String(s.amount), date: s.date, status: s.status || 'completed', client_id: s.client_id || '', product_id: s.product_id || '', notes: s.notes || '' }); setShowModal(true) }

  const fmt  = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const fmtS = (v: number) => v >= 1e6 ? `R$ ${(v/1e6).toFixed(1)}M` : v >= 1e3 ? `R$ ${(v/1e3).toFixed(1)}k` : fmt(v)

  const filtered = sales.filter(s => {
    const mS = !search || s.title?.toLowerCase().includes(search.toLowerCase()) || s.clients?.name?.toLowerCase().includes(search.toLowerCase())
    const mF = filterStatus === 'all' || s.status === filterStatus
    return mS && mF
  })

  const totalRevenue = filtered.filter(s => s.status === 'completed').reduce((a, s) => a + Number(s.amount), 0)
  const pending      = filtered.filter(s => s.status === 'pending').length
  const thisMonth    = sales.filter(s => s.date?.startsWith(new Date().toISOString().slice(0, 7))).length

  if (loading) return <><AcernityFonts /><BackgroundGrid><FloatingOrbs /><div className="flex flex-col gap-5"><Skeleton className="h-9 w-32 rounded-xl" /><div className="grid grid-cols-4 gap-3">{[0,1,2,3].map(i=><Skeleton key={i} className="h-24 rounded-2xl"/>)}</div><Skeleton className="h-80 rounded-2xl"/></div></BackgroundGrid></>

  return (
    <>
      <AcernityFonts />
      <BackgroundGrid>
        <FloatingOrbs />
        <div className="flex flex-col gap-5">

          <motion.div {...fadeUp(0)} className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Syne, sans-serif', color: T.text }}>Vendas</h1>
              <p className="text-sm mt-0.5" style={{ color: T.muted, fontFamily: 'DM Sans, sans-serif' }}>{sales.length} venda{sales.length !== 1 ? 's' : ''} registrada{sales.length !== 1 ? 's' : ''}</p>
            </div>
            <ShimmerButton onClick={() => { setEditing(null); setForm(EMPTY); setShowModal(true) }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: 'linear-gradient(135deg, #7c6ef7, #a06ef7)', color: 'white', boxShadow: '0 0 28px rgba(124,110,247,0.45)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>
              <Plus size={15} /> Nova venda
            </ShimmerButton>
          </motion.div>

          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Receita total', value: totalRevenue, color: T.green,  icon: TrendingUp,    isCurrency: true },
              { label: 'Este mês',      value: thisMonth,    color: T.purple,  icon: ShoppingCart,  isCurrency: false },
              { label: 'Pendentes',     value: pending,      color: T.amber,   icon: DollarSign,    isCurrency: false },
              { label: 'Concluídas',    value: filtered.filter(s => s.status === 'completed').length, color: T.cyan, icon: CheckCircle, isCurrency: false },
            ].map(({ label, value, color, icon: Icon, isCurrency }, i) => (
              <motion.div key={label} {...fadeUp(0.08 + i * 0.06)}>
                <SpotlightCard className="rounded-2xl" spotlightColor={`${color}18`} style={card}>
                  <div className="p-4 relative overflow-hidden">
                    <GlowCorner color={`${color}22`} position="bottom-right" />
                    <div className="flex items-center justify-between mb-3" style={{ position: 'relative', zIndex: 1 }}>
                      <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: T.muted, fontFamily: 'Syne, sans-serif', letterSpacing: '0.1em' }}>{label}</span>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}14`, border: `1px solid ${color}25`, boxShadow: `0 0 12px ${color}20` }}>
                        <Icon size={13} style={{ color }} strokeWidth={2} />
                      </div>
                    </div>
                    <p className="text-xl font-bold tabular-nums" style={{ fontFamily: 'Syne, sans-serif', color, textShadow: `0 0 22px ${color}55`, position: 'relative', zIndex: 1 }}>
                      {isCurrency ? <AnimatedNumber value={value as number} format={fmtS} /> : value}
                    </p>
                  </div>
                </SpotlightCard>
              </motion.div>
            ))}
          </div>

          {/* Table */}
          <motion.div {...fadeUp(0.28)}>
            <SpotlightCard className="rounded-2xl overflow-hidden" style={card}>
              <div className="p-4 border-b flex flex-wrap items-center gap-3" style={{ borderColor: T.border }}>
                <div className="flex items-center gap-2 flex-1 min-w-48 px-3 py-2 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.border}` }}>
                  <Search size={13} style={{ color: T.muted }} />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar venda ou cliente..."
                    className="text-sm outline-none flex-1 bg-transparent" style={{ color: T.text, fontFamily: 'DM Sans, sans-serif' }} />
                  {search && <motion.button whileTap={{ scale: 0.9 }} onClick={() => setSearch('')}><X size={13} style={{ color: T.muted }} /></motion.button>}
                </div>
                <div className="flex gap-1">
                  {(['all', 'completed', 'pending', 'cancelled']).map(s => {
                    const info = s === 'all' ? { label: 'Todos', color: T.violet } : STATUS_MAP[s]
                    const active = filterStatus === s
                    return (
                      <button key={s} onClick={() => setFilterStatus(s)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                        style={{ background: active ? `${info.color}18` : 'rgba(255,255,255,0.03)', color: active ? info.color : T.muted, border: `1px solid ${active ? `${info.color}30` : T.border}`, cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'DM Sans, sans-serif' }}>
                        {info.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {filtered.length === 0 ? (
                <div className="py-16 text-center">
                  <ShoppingCart size={32} className="mx-auto mb-3" style={{ color: T.muted }} />
                  <p className="text-sm" style={{ color: T.muted, fontFamily: 'DM Sans, sans-serif' }}>Nenhuma venda encontrada</p>
                </div>
              ) : filtered.map((s, i) => {
                const status = STATUS_MAP[s.status] || STATUS_MAP.pending
                return (
                  <motion.div key={s.id}
                    initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.22, delay: i * 0.03 }}
                    className="flex items-center gap-3 px-5 py-3.5 group"
                    style={{ borderBottom: i < filtered.length - 1 ? `1px solid rgba(255,255,255,0.04)` : 'none', transition: 'background 0.12s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${status.color}12`, border: `1px solid ${status.color}22`, boxShadow: `0 0 10px ${status.color}18` }}>
                      <ShoppingCart size={14} style={{ color: status.color }} strokeWidth={1.8} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: T.text, fontFamily: 'DM Sans, sans-serif' }}>{s.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs" style={{ color: T.muted, fontFamily: 'DM Sans, sans-serif' }}>{new Date(s.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        {s.clients?.name && <span className="text-xs" style={{ color: T.muted, fontFamily: 'DM Sans, sans-serif' }}>· {s.clients.name}</span>}
                      </div>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-lg font-semibold shrink-0"
                      style={{ background: `${status.color}14`, color: status.color, border: `1px solid ${status.color}28`, fontFamily: 'DM Sans, sans-serif' }}>
                      {status.label}
                    </span>
                    <span className="text-sm font-bold tabular-nums shrink-0 w-24 text-right"
                      style={{ fontFamily: 'Syne, sans-serif', color: s.status === 'cancelled' ? T.red : T.green, textShadow: s.status === 'cancelled' ? `0 0 12px ${T.red}40` : `0 0 12px ${T.green}40` }}>
                      {fmt(Number(s.amount))}
                    </span>
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <motion.button whileTap={{ scale: 0.88 }} onClick={() => openEdit(s)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: `${T.purple}14`, color: T.violet, cursor: 'pointer' }}>
                        <Edit2 size={12} />
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.88 }} onClick={() => handleDelete(s.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: `${T.red}12`, color: T.red, cursor: 'pointer' }}>
                        {deleting === s.id ? <div className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" /> : <Trash2 size={12} />}
                      </motion.button>
                    </div>
                  </motion.div>
                )
              })}
            </SpotlightCard>
          </motion.div>
        </div>

        <AnimatePresence>
          {showModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
              style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)' }}
              onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
              <motion.div initial={{ y: 60, opacity: 0, scale: 0.97 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 60, opacity: 0 }}
                transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] as const }}
                className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6"
                style={{ background: T.bgDeep, border: `1px solid ${T.borderP}`, backdropFilter: 'blur(28px)', boxShadow: `0 0 0 1px rgba(124,110,247,0.08), 0 -8px 48px rgba(0,0,0,0.8)` }}>
                <div className="w-10 h-1 rounded-full mx-auto mb-5 sm:hidden" style={{ background: 'rgba(255,255,255,0.1)' }} />
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-bold text-lg" style={{ fontFamily: 'Syne, sans-serif', color: T.text }}>{editing ? 'Editar venda' : 'Nova venda'}</h2>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => { setShowModal(false); setEditing(null) }}
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.05)', color: T.sub, border: `1px solid ${T.border}`, cursor: 'pointer' }}>
                    <X size={14} />
                  </motion.button>
                </div>
                <form onSubmit={handleSave} className="flex flex-col gap-3">
                  <input placeholder="Título da venda *" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} style={inp} onFocus={focus} onBlur={blurEv} />
                  <div className="grid grid-cols-2 gap-3">
                    <input type="number" step="0.01" placeholder="Valor *" required value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} style={inp} onFocus={focus} onBlur={blurEv} />
                    <input type="date" value={form.date} required onChange={e => setForm({ ...form, date: e.target.value })} style={inp} onFocus={focus} onBlur={blurEv} />
                  </div>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={selStyle}>
                    <option value="completed">Concluída</option>
                    <option value="pending">Pendente</option>
                    <option value="cancelled">Cancelada</option>
                  </select>
                  {clients.length > 0 && (
                    <select value={form.client_id} onChange={e => setForm({ ...form, client_id: e.target.value })} style={selStyle}>
                      <option value="">Cliente (opcional)</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  )}
                  {products.length > 0 && (
                    <select value={form.product_id} onChange={e => { const p = products.find((x: any) => x.id === e.target.value); setForm({ ...form, product_id: e.target.value, amount: p?.price ? String(p.price) : form.amount }) }} style={selStyle}>
                      <option value="">Produto (opcional)</option>
                      {products.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  )}
                  <input placeholder="Observações" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={inp} onFocus={focus} onBlur={blurEv} />
                  <ShimmerButton type="submit" disabled={saving} className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm w-full mt-1"
                    style={{ background: 'linear-gradient(135deg, #7c6ef7, #a06ef7)', color: 'white', boxShadow: saving ? 'none' : '0 0 28px rgba(124,110,247,0.4)', border: '1px solid rgba(255,255,255,0.1)', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                    {saving ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : editing ? 'Salvar alterações' : 'Registrar venda'}
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
