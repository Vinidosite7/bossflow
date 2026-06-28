'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useBusiness } from '@/hooks/useBusiness'
import { useTour } from '@/hooks/useTour'
import { TourTooltip } from '@/components/TourTooltip'
import { TrendingUp, TrendingDown, Plus, X, Pencil, Trash2, Search } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { SpotlightCard, ShimmerButton, Skeleton, BackgroundGrid, FloatingOrbs, AcernityFonts, GlowCorner } from '@/components/ui/aceternity'

const T = {
  bg: 'rgba(8,8,14,0.92)', bgDeep: 'rgba(6,6,10,0.97)',
  border: 'rgba(255,255,255,0.055)', borderP: 'rgba(124,110,247,0.22)',
  text: '#dcdcf0', sub: '#8a8aaa', muted: '#4a4a6a',
  green: '#34d399', red: '#f87171', amber: '#fbbf24',
  purple: '#7c6ef7', violet: '#a78bfa', blur: 'blur(20px)',
}
const card = { background: T.bg, border: `1px solid ${T.border}`, backdropFilter: T.blur, boxShadow: '0 4px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)' }
const inp: React.CSSProperties = { background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.border}`, color: T.text, borderRadius: 12, padding: '10px 14px', fontSize: 13, outline: 'none', width: '100%', transition: 'border-color 0.15s', fontFamily: 'DM Sans, sans-serif' }
const selStyle: React.CSSProperties = { background: 'rgba(8,8,14,0.95)', border: `1px solid ${T.border}`, color: T.text, borderRadius: 12, padding: '10px 14px', fontSize: 13, outline: 'none', width: '100%', transition: 'border-color 0.15s', fontFamily: 'DM Sans, sans-serif' }
const focus = (e: any) => e.currentTarget.style.borderColor = T.borderP
const blurEv = (e: any) => e.currentTarget.style.borderColor = T.border
const fadeUp = (delay = 0) => ({ initial: { opacity: 0, y: 16, filter: 'blur(4px)' }, animate: { opacity: 1, y: 0, filter: 'blur(0px)' }, transition: { duration: 0.46, delay, ease: [0.16, 1, 0.3, 1] as const } })

const TOUR_STEPS = [
  { target: '[data-tour="lancamentos-header"]', title: 'Lançamentos financeiros', description: 'Registre entradas e saídas de forma rápida. Clique em "Novo lançamento" para começar.', position: 'bottom' as const },
  { target: '[data-tour="lancamentos-kpis"]',   title: 'Resumo financeiro',        description: 'Veja o total de entradas, saídas e o saldo atual em tempo real.',                    position: 'bottom' as const },
  { target: '[data-tour="lancamentos-lista"]',  title: 'Histórico de lançamentos', description: 'Lançamentos "Pendente" ainda não foram pagos ou recebidos.', position: 'top' as const },
]

const EMPTY_FORM = { title: '', amount: '', date: new Date().toISOString().split('T')[0], type: 'expense', category_id: '', description: '', paid: true }

export default function LancamentosPage() {
  const supabase = createClient()
  const { businessId, loading: bizLoading } = useBusiness()
  const tour = useTour('lancamentos', TOUR_STEPS)

  const [transactions, setTransactions] = useState<any[]>([])
  const [categories, setCategories]     = useState<any[]>([])
  const [loading, setLoading]           = useState(true)
  const [showForm, setShowForm]         = useState(false)
  const [editTx, setEditTx]             = useState<any>(null)
  const [saving, setSaving]             = useState(false)
  const [search, setSearch]             = useState('')
  const [showConfirm, setShowConfirm]   = useState<string | null>(null)
  const [form, setForm]                 = useState(EMPTY_FORM)

  async function load() {
    if (!businessId) return
    try {
      const [{ data: txs }, { data: cats }] = await Promise.all([
        supabase.from('transactions').select('*, categories(name, color)').eq('business_id', businessId).order('date', { ascending: false }),
        supabase.from('categories').select('*').eq('business_id', businessId).order('name'),
      ])
      setTransactions(txs || [])
      setCategories(cats || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { if (businessId) load() }, [businessId])
  useEffect(() => { if (!bizLoading && !businessId) setLoading(false) }, [bizLoading, businessId])

  function openCreate() { setEditTx(null); setForm(EMPTY_FORM); setShowForm(true) }
  function openEdit(tx: any) {
    setEditTx(tx)
    setForm({ title: tx.title, amount: String(tx.amount), date: tx.date, type: tx.type, category_id: tx.category_id || '', description: tx.description || '', paid: tx.paid })
    setShowForm(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const payload = { title: form.title, amount: parseFloat(form.amount), date: form.date, type: form.type, category_id: form.category_id || null, description: form.description || null, paid: form.paid, paid_at: form.paid ? new Date().toISOString() : null }
    if (editTx) await supabase.from('transactions').update(payload).eq('id', editTx.id)
    else await supabase.from('transactions').insert({ ...payload, business_id: businessId, created_by: user?.id })
    setShowForm(false); setEditTx(null); setSaving(false); load()
  }
  async function handleDelete(id: string) { await supabase.from('transactions').delete().eq('id', id); setShowConfirm(null); load() }

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const income  = transactions.filter(t => t.type === 'income').reduce((a, t) => a + Number(t.amount), 0)
  const expense = transactions.filter(t => t.type === 'expense').reduce((a, t) => a + Number(t.amount), 0)
  const saldo   = income - expense
  const filtered = transactions.filter(t => t.title.toLowerCase().includes(search.toLowerCase()))

  if (loading || bizLoading) return (
    <><AcernityFonts /><BackgroundGrid><FloatingOrbs />
      <div className="flex flex-col gap-5">
        <div className="flex justify-between"><Skeleton className="h-9 w-40 rounded-xl" /><Skeleton className="h-10 w-40 rounded-xl" /></div>
        <div className="grid grid-cols-3 gap-3">{[0,1,2].map(i=><Skeleton key={i} className="h-28 rounded-2xl"/>)}</div>
        <Skeleton className="h-64 rounded-2xl"/>
      </div>
    </BackgroundGrid></>
  )

  return (
    <>
      <AcernityFonts />
      <BackgroundGrid>
        <FloatingOrbs />
        <div className="flex flex-col gap-5">
          <TourTooltip active={tour.active} step={tour.step} current={tour.current} total={tour.total}
            onNext={tour.next} onPrev={tour.prev} onFinish={tour.finish} />

          {/* Header */}
          <motion.div {...fadeUp(0)} className="flex items-center justify-between" data-tour="lancamentos-header">
            <div>
              <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Syne, sans-serif', color: T.text }}>Lançamentos</h1>
              <p className="text-sm mt-0.5" style={{ color: T.muted, fontFamily: 'DM Sans, sans-serif' }}>{transactions.length} lançamento{transactions.length !== 1 ? 's' : ''}</p>
            </div>
            <ShimmerButton onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: 'linear-gradient(135deg, #7c6ef7, #a06ef7)', color: 'white', boxShadow: '0 0 28px rgba(124,110,247,0.45)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>
              <Plus size={15} /> Novo lançamento
            </ShimmerButton>
          </motion.div>

          {/* KPIs */}
          <div className="grid grid-cols-3 gap-3" data-tour="lancamentos-kpis">
            {[
              { label: 'Entradas', value: income,  color: T.green, Icon: TrendingUp },
              { label: 'Saídas',   value: expense, color: T.red,   Icon: TrendingDown },
              { label: 'Saldo',    value: saldo,   color: saldo >= 0 ? T.green : T.red, Icon: saldo >= 0 ? TrendingUp : TrendingDown },
            ].map(({ label, value, color, Icon }, i) => (
              <motion.div key={label} {...fadeUp(0.08 + i * 0.06)}>
                <SpotlightCard className="rounded-2xl" spotlightColor={`${color}18`} style={card}>
                  <div className="p-4 relative overflow-hidden">
                    <GlowCorner color={`${color}22`} position="bottom-right" />
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center mb-3"
                      style={{ background: `${color}14`, border: `1px solid ${color}25`, boxShadow: `0 0 12px ${color}20`, position: 'relative', zIndex: 1 }}>
                      <Icon size={14} style={{ color }} />
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: T.muted, fontFamily: 'Syne, sans-serif', letterSpacing: '0.1em', position: 'relative', zIndex: 1 }}>{label}</p>
                    <p className="text-lg font-bold" style={{ fontFamily: 'Syne, sans-serif', color, textShadow: `0 0 20px ${color}55`, position: 'relative', zIndex: 1 }}>{fmt(value)}</p>
                  </div>
                </SpotlightCard>
              </motion.div>
            ))}
          </div>

          {/* Search */}
          <motion.div {...fadeUp(0.22)}>
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl"
              style={{ background: T.bg, border: `1px solid ${T.border}`, backdropFilter: T.blur }}>
              <Search size={13} style={{ color: T.muted }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar lançamento..."
                className="flex-1 bg-transparent text-sm outline-none" style={{ color: T.text, fontFamily: 'DM Sans, sans-serif' }} />
              <AnimatePresence>
                {search && (
                  <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                    onClick={() => setSearch('')} style={{ color: T.muted, cursor: 'pointer' }}><X size={13} /></motion.button>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Lista */}
          {filtered.length === 0 ? (
            <motion.div {...fadeUp(0.28)} className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: `${T.purple}10`, border: `1px solid ${T.purple}22` }}>
                <TrendingUp size={28} style={{ color: T.violet }} />
              </div>
              <h2 className="text-lg font-bold" style={{ fontFamily: 'Syne, sans-serif', color: T.text }}>
                {search ? 'Nenhum resultado' : 'Nenhum lançamento ainda'}
              </h2>
              <p style={{ color: T.muted, fontSize: 13, fontFamily: 'DM Sans, sans-serif' }}>
                {search ? 'Tente outro termo' : 'Registre seu primeiro lançamento'}
              </p>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} data-tour="lancamentos-lista">
              <SpotlightCard className="rounded-2xl overflow-hidden" style={card}>
                <AnimatePresence initial={false}>
                  {filtered.map((tx, i) => (
                    <motion.div key={tx.id}
                      initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 12, height: 0 }}
                      transition={{ duration: 0.22, delay: i * 0.025 }}
                      className="flex items-center gap-3 px-4 py-3.5 group"
                      style={{ borderBottom: i < filtered.length - 1 ? 'rgba(255,255,255,0.04) 0px 1px 0px inset' : 'none', borderBottomWidth: i < filtered.length - 1 ? 1 : 0, borderBottomStyle: 'solid', borderBottomColor: 'rgba(255,255,255,0.04)', transition: 'background 0.12s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: tx.type === 'income' ? `${T.green}12` : `${T.red}12`, border: `1px solid ${tx.type === 'income' ? T.green : T.red}22`, boxShadow: `0 0 10px ${tx.type === 'income' ? T.green : T.red}18` }}>
                        {tx.type === 'income'
                          ? <TrendingUp size={14} style={{ color: T.green }} strokeWidth={2} />
                          : <TrendingDown size={14} style={{ color: T.red }} strokeWidth={2} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: T.text, fontFamily: 'DM Sans, sans-serif' }}>{tx.title}</p>
                        <p className="text-xs mt-0.5 truncate" style={{ color: T.muted, fontFamily: 'DM Sans, sans-serif' }}>
                          {tx.categories?.name || 'Sem categoria'} · {new Date(tx.date).toLocaleDateString('pt-BR')}
                          {!tx.paid && <span className="ml-1.5 px-1.5 py-0.5 rounded text-xs" style={{ background: `${T.amber}12`, color: T.amber, border: `1px solid ${T.amber}22` }}>Pendente</span>}
                        </p>
                      </div>
                      <span className="text-sm font-bold tabular-nums shrink-0"
                        style={{ fontFamily: 'Syne, sans-serif', color: tx.type === 'income' ? T.green : T.red, textShadow: `0 0 12px ${tx.type === 'income' ? T.green : T.red}40` }}>
                        {tx.type === 'income' ? '+' : '-'}{fmt(Number(tx.amount))}
                      </span>
                      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => openEdit(tx)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{ background: `${T.purple}14`, color: T.violet, cursor: 'pointer' }}>
                          <Pencil size={12} />
                        </motion.button>
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowConfirm(tx.id)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{ background: `${T.red}12`, color: T.red, cursor: 'pointer' }}>
                          <Trash2 size={12} />
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </SpotlightCard>
            </motion.div>
          )}
        </div>

        {/* Modal form */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
              style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)' }}
              onClick={e => { if (e.target === e.currentTarget) { setShowForm(false); setEditTx(null) } }}>
              <motion.div initial={{ y: 60, opacity: 0, scale: 0.97 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 60, opacity: 0 }}
                transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] as const }}
                className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6"
                style={{ background: T.bgDeep, border: `1px solid ${T.borderP}`, backdropFilter: 'blur(28px)', boxShadow: `0 0 0 1px rgba(124,110,247,0.08), 0 -8px 48px rgba(0,0,0,0.8)` }}>
                <div className="w-10 h-1 rounded-full mx-auto mb-5 sm:hidden" style={{ background: 'rgba(255,255,255,0.1)' }} />
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-bold text-lg" style={{ fontFamily: 'Syne, sans-serif', color: T.text }}>{editTx ? 'Editar lançamento' : 'Novo lançamento'}</h2>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => { setShowForm(false); setEditTx(null) }}
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.05)', color: T.sub, border: `1px solid ${T.border}`, cursor: 'pointer' }}>
                    <X size={14} />
                  </motion.button>
                </div>
                <form onSubmit={handleSave} className="flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-2">
                    {(['expense', 'income'] as const).map(t => (
                      <button key={t} type="button" onClick={() => setForm({ ...form, type: t })}
                        className="py-2.5 rounded-xl text-sm font-semibold"
                        style={{ background: form.type === t ? (t === 'income' ? `${T.green}15` : `${T.red}15`) : 'rgba(255,255,255,0.03)', color: form.type === t ? (t === 'income' ? T.green : T.red) : T.muted, border: `1px solid ${form.type === t ? (t === 'income' ? `${T.green}35` : `${T.red}35`) : T.border}`, cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'DM Sans, sans-serif' }}>
                        {t === 'income' ? '↑ Entrada' : '↓ Saída'}
                      </button>
                    ))}
                  </div>
                  <input type="text" placeholder="Título *" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} style={inp} onFocus={focus} onBlur={blurEv} />
                  <div className="grid grid-cols-2 gap-3">
                    <input type="number" step="0.01" placeholder="Valor *" required value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} style={inp} onFocus={focus} onBlur={blurEv} />
                    <input type="date" value={form.date} required onChange={e => setForm({ ...form, date: e.target.value })} style={inp} onFocus={focus} onBlur={blurEv} />
                  </div>
                  <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })} style={selStyle}>
                    <option value="">Sem categoria</option>
                    {categories.filter(c => c.type === form.type).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.paid} onChange={e => setForm({ ...form, paid: e.target.checked })} style={{ accentColor: T.purple }} />
                    <span className="text-sm" style={{ color: T.sub, fontFamily: 'DM Sans, sans-serif' }}>Já foi pago/recebido</span>
                  </label>
                  <ShimmerButton type="submit" disabled={saving} className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm w-full mt-1"
                    style={{ background: 'linear-gradient(135deg, #7c6ef7, #a06ef7)', color: 'white', boxShadow: saving ? 'none' : '0 0 28px rgba(124,110,247,0.4)', border: '1px solid rgba(255,255,255,0.1)', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                    {saving ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : editTx ? 'Salvar alterações' : 'Salvar lançamento'}
                  </ShimmerButton>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Confirm delete */}
        <AnimatePresence>
          {showConfirm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)' }}>
              <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
                transition={{ duration: 0.22 }} className="w-full max-w-sm rounded-2xl p-6"
                style={{ background: T.bgDeep, border: `1px solid ${T.red}30`, backdropFilter: 'blur(28px)', boxShadow: `0 0 48px rgba(248,113,113,0.12)` }}>
                <h2 className="font-bold text-lg mb-2" style={{ fontFamily: 'Syne, sans-serif', color: T.text }}>Excluir lançamento?</h2>
                <p className="text-sm mb-6" style={{ color: T.muted, fontFamily: 'DM Sans, sans-serif' }}>Esta ação não pode ser desfeita.</p>
                <div className="flex gap-3">
                  <button onClick={() => setShowConfirm(null)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                    style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}`, color: T.sub, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>Cancelar</button>
                  <button onClick={() => handleDelete(showConfirm!)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                    style={{ background: `${T.red}15`, color: T.red, border: `1px solid ${T.red}30`, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>Excluir</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </BackgroundGrid>
    </>
  )
}
