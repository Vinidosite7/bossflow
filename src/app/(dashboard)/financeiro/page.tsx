'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useBusinessContext } from '@/lib/business-context'
import { useTour } from '@/hooks/useTour'
import { usePlanLimits } from '@/hooks/usePlanLimits'
import { sendPush, fmt as fmtPush } from '@/lib/push'
import { TourTooltip } from '@/components/TourTooltip'
import { PlanGate } from '@/components/PlanGate'
import {
  TrendingUp, TrendingDown, DollarSign, Plus, X,
  Loader2, Pencil, Trash2, Search, SlidersHorizontal,
  Building2, Zap, ChevronRight,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { SpotlightCard, ShimmerButton, GlowCorner, Skeleton } from '@/components/ui/bossflow-ui'

// ── Design System ──────────────────────────────────────────────────────────
import { T, card, inp, inpLg, inpSm, SYNE } from '@/lib/design'
import { fadeUp, scaleIn } from '@/lib/animations'

import { PageBackground, FilterBar, FormModal, ModalSubmitButton } from '@/components/core'
// ─── Animações ────────────────────────────────────────────────────────────────

const TOUR_STEPS = [
  { target: '[data-tour="fin-header"]',  title: 'Painel financeiro',  description: 'Registre entradas e saídas. Clique em "Novo lançamento" para começar.', position: 'bottom' as const },
  { target: '[data-tour="fin-tabs"]',    title: 'Visões',             description: 'Alterne entre Visão geral, Transações, Categorias e Bancos.', position: 'bottom' as const },
  { target: '[data-tour="fin-kpis"]',    title: 'Resumo do período',  description: 'Receitas, despesas e lucro. Use os filtros de 7, 30 ou 90 dias.', position: 'bottom' as const },
  { target: '[data-tour="fin-grafico"]', title: 'Gráfico de fluxo',   description: 'Entradas (verde) e saídas (vermelho) dia a dia.', position: 'top' as const },
]

type Tab = 'visao' | 'transacoes' | 'categorias' | 'bancos'

const fmt      = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtShort = (v: number) => {
  if (v >= 1e6) return `R$ ${(v / 1e6).toFixed(1)}M`
  if (v >= 1e3) return `R$ ${(v / 1e3).toFixed(1)}k`
  return fmt(v)
}

// ── FIX: supabase client criado fora do componente (evita recriação a cada render)
const supabase = createClient()

export default function FinanceiroPage() {
  const { plan } = usePlanLimits()
  const tour     = useTour('financeiro', TOUR_STEPS)

  const [tab, setTab]               = useState<Tab>('visao')
  const [loading, setLoading]       = useState(true)
  const { businessId, loading: bizLoading } = useBusinessContext()
  const [transactions, setTransactions] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [period, setPeriod]         = useState('30')

  const [showTxForm,   setShowTxForm]   = useState(false)
  const [showCatForm,  setShowCatForm]  = useState(false)
  const [editTx,       setEditTx]       = useState<any>(null)
  const [editCat,      setEditCat]      = useState<any>(null)
  const [savingTx,     setSavingTx]     = useState(false)
  const [savingCat,    setSavingCat]    = useState(false)
  const [deletingTxId, setDeletingTxId] = useState<string | null>(null)

  const [txSearch,    setTxSearch]    = useState('')
  const [txTypeF,     setTxTypeF]     = useState<'all' | 'income' | 'expense'>('all')
  const [txCategoryF, setTxCategoryF] = useState('')

  const [txForm, setTxForm] = useState({
    title: '', amount: '', date: new Date().toISOString().split('T')[0],
    type: 'expense', category_id: '', description: '', paid: true,
  })
  const [catForm, setCatForm] = useState({ name: '', type: 'expense', color: '#f87171' })

  async function load() {
    try {
      if (!businessId) return
      const from = new Date()
      from.setDate(from.getDate() - parseInt(period))
      const fromStr = from.toISOString().split('T')[0]
      const [{ data: txs }, { data: cats }] = await Promise.all([
        supabase.from('transactions').select('*, categories(name, color)')
          .eq('business_id', businessId).gte('date', fromStr).order('date', { ascending: false }),
        supabase.from('categories').select('*').eq('business_id', businessId).order('name'),
      ])
      setTransactions(txs || [])
      setCategories(cats || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { if (businessId) load() }, [businessId, period])

  const income  = transactions.filter(t => t.type === 'income').reduce((a, t) => a + Number(t.amount), 0)
  const expense = transactions.filter(t => t.type === 'expense').reduce((a, t) => a + Number(t.amount), 0)
  const lucro   = income - expense

  const byDay: Record<string, { income: number; expense: number }> = {}
  transactions.forEach(t => {
    if (!byDay[t.date]) byDay[t.date] = { income: 0, expense: 0 }
    byDay[t.date][t.type === 'income' ? 'income' : 'expense'] += Number(t.amount)
  })
  const chartDays = Object.entries(byDay).slice(-14)
  const maxVal = Math.max(...chartDays.map((d: any) => Math.max(d[1].income, d[1].expense)), 1)

  const expByCategory: Record<string, number> = {}
  transactions.filter(t => t.type === 'expense').forEach(t => {
    const cat = t.categories?.name || 'Sem categoria'
    expByCategory[cat] = (expByCategory[cat] || 0) + Number(t.amount)
  })
  const catEntries = Object.entries(expByCategory).sort((a: any, b: any) => b[1] - a[1])

  const filteredTxs = transactions.filter(tx => {
    const matchSearch = txSearch === '' || tx.title.toLowerCase().includes(txSearch.toLowerCase())
    const matchType   = txTypeF === 'all' || tx.type === txTypeF
    const matchCat    = txCategoryF === '' || (tx.categories?.name || 'Sem categoria') === txCategoryF
    return matchSearch && matchType && matchCat
  })
  const uniqueCatNames = [...new Set(transactions.map(t => t.categories?.name || 'Sem categoria'))]

  function openNewTx() {
    setEditTx(null)
    setTxForm({ title: '', amount: '', date: new Date().toISOString().split('T')[0], type: 'expense', category_id: '', description: '', paid: true })
    setShowTxForm(true)
  }
  function openEditTx(tx: any) {
    setEditTx(tx)
    setTxForm({ title: tx.title, amount: String(tx.amount), date: tx.date, type: tx.type, category_id: tx.category_id || '', description: tx.description || '', paid: tx.paid ?? true })
    setShowTxForm(true)
  }
  async function handleSaveTx(e: React.FormEvent) {
    e.preventDefault(); setSavingTx(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (editTx) {
        const { error } = await supabase.from('transactions').update({
          title: txForm.title, amount: parseFloat(txForm.amount), date: txForm.date, type: txForm.type,
          category_id: txForm.category_id || null, description: txForm.description || null,
          paid: txForm.paid, paid_at: txForm.paid ? new Date().toISOString() : null,
        }).eq('id', editTx.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('transactions').insert({
          title: txForm.title, amount: parseFloat(txForm.amount), date: txForm.date, type: txForm.type,
          category_id: txForm.category_id || null, description: txForm.description || null,
          paid: txForm.paid, paid_at: txForm.paid ? new Date().toISOString() : null,
          business_id: businessId, created_by: user?.id,
        })
        if (error) throw error
        if (user) {
          const isIncome = txForm.type === 'income'
          await sendPush(
            user.id,
            isIncome ? '💚 Entrada registrada!' : '🔴 Saída registrada!',
            `${txForm.title} · ${fmtPush(parseFloat(txForm.amount))}`,
            '/financeiro'
          )
        }
      }
      setEditTx(null); setShowTxForm(false); load()
    } catch (err: any) { console.error('[Financeiro] saveTx:', err) } finally { setSavingTx(false) }
  }
  async function handleDeleteTx(id: string) {
    if (!confirm('Excluir este lançamento?')) return
    setDeletingTxId(id)
    await supabase.from('transactions').delete().eq('id', id)
    setDeletingTxId(null); load()
  }
  async function handleSaveCat(e: React.FormEvent) {
    e.preventDefault(); setSavingCat(true)
    try {
      if (editCat) {
        const { error } = await supabase.from('categories').update({ name: catForm.name, type: catForm.type, color: catForm.color }).eq('id', editCat.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('categories').insert({ ...catForm, business_id: businessId })
        if (error) throw error
      }
      setCatForm({ name: '', type: 'expense', color: '#f87171' })
      setEditCat(null); setShowCatForm(false); load()
    } catch (err: any) { console.error('[Financeiro] saveCat:', err) } finally { setSavingCat(false) }
  }
  async function handleDeleteCat(id: string) {
    if (!confirm('Excluir esta categoria?')) return
    await supabase.from('categories').delete().eq('id', id)
    load()
  }

  const CAT_COLORS = ['#f87171', '#34d399', '#fbbf24', '#22d3ee', '#a78bfa', '#7c6ef7', '#fb923c', '#6b6b8a']

  // ─── Row de transação (reutilizável) ──────────────────────────────────────────
  function TxRow({ tx, i }: { tx: any; i: number }) {
    return (
      <motion.div
        initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.22, delay: i * 0.03 }}
        className="group flex items-center gap-3 px-5 py-3.5"
        style={{ borderBottom: `1px solid rgba(255,255,255,0.035)`, transition: 'background 0.12s', cursor: 'default' }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.022)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

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

        <span className="text-sm font-bold shrink-0 tabular-nums"
          style={{ fontFamily: SYNE, color: tx.type === 'income' ? T.green : T.red, textShadow: `0 0 14px ${tx.type === 'income' ? T.green : T.red}40` }}>
          {tx.type === 'income' ? '+' : '−'}{fmt(Number(tx.amount))}
        </span>

        <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ml-1">
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={() => openEditTx(tx)}
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: `${T.purple}12`, color: T.violet, border: `1px solid ${T.purple}25`, cursor: 'pointer' }}>
            <Pencil size={11} />
          </motion.button>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={() => handleDeleteTx(tx.id)} disabled={deletingTxId === tx.id}
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: `${T.red}10`, color: T.red, border: `1px solid ${T.red}22`, cursor: 'pointer' }}>
            {deletingTxId === tx.id ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
          </motion.button>
        </div>
      </motion.div>
    )
  }

  if (loading || bizLoading) return (
    <PageBackground>
      <div className="flex flex-col gap-5">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-36 rounded-xl" />
          <Skeleton className="h-10 w-40 rounded-xl" />
        </div>
        <Skeleton className="h-10 w-72 rounded-xl" />
        <div className="grid grid-cols-3 gap-3">{[0,1,2].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
        <Skeleton className="h-56 rounded-2xl" />
      </div>
    </PageBackground>
  )

  return (
    <PageBackground>
      <div className="flex flex-col gap-5">
        <TourTooltip active={tour.active} step={tour.step} current={tour.current}
          total={tour.total} onNext={tour.next} onPrev={tour.prev} onFinish={tour.finish} />

        {/* ── Header ── */}
        <motion.div {...fadeUp(0)} className="flex items-start justify-between gap-4" data-tour="fin-header">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: SYNE, color: T.text }}>Financeiro</h1>
            <p className="text-sm mt-1" style={{ color: T.muted, fontFamily: SYNE }}>Gerencie receitas e despesas</p>
          </div>
          <ShimmerButton onClick={openNewTx}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold shrink-0"
            style={{ background: 'linear-gradient(135deg,#7c6ef7,#a06ef7)', color: 'white', boxShadow: '0 0 28px rgba(124,110,247,0.45),inset 0 1px 0 rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontFamily: SYNE }}>
            <Plus size={15} />
            <span className="hidden sm:inline">Novo lançamento</span>
            <span className="sm:hidden">Novo</span>
          </ShimmerButton>
        </motion.div>

        {/* ── Tabs ── */}
        <motion.div {...fadeUp(0.06)} data-tour="fin-tabs">
          <div className="flex gap-1 p-1 rounded-xl w-fit overflow-x-auto" style={{ background: T.bg, border: `1px solid ${T.border}` }}>
            {([['visao','Visão geral'],['transacoes','Transações'],['categorias','Categorias'],['bancos','Bancos']] as const).map(([key, label]) => (
              <motion.button key={key} whileTap={{ scale: 0.95 }} onClick={() => setTab(key)}
                className="px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap"
                style={{
                  background: tab === key ? 'rgba(124,110,247,0.15)' : 'transparent',
                  color:      tab === key ? T.violet : T.muted,
                  border:     tab === key ? `1px solid rgba(124,110,247,0.25)` : '1px solid transparent',
                  fontFamily: SYNE, cursor: 'pointer',
                }}>
                {label}
              </motion.button>
            ))}
          </div>
        </motion.div>

        <AnimatePresence mode="wait">

          {/* ══════ VISÃO GERAL ══════ */}
          {tab === 'visao' && (
            <motion.div key="visao" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-5">

              <motion.div {...fadeUp(0.1)} className="flex gap-2">
                {[['7','7 dias'],['30','30 dias'],['90','90 dias']].map(([v,l]) => (
                  <motion.button key={v} whileTap={{ scale: 0.95 }} onClick={() => setPeriod(v)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{ background: period===v?`${T.purple}18`:'rgba(255,255,255,0.03)', color: period===v?T.violet:T.muted, border:`1px solid ${period===v?`${T.purple}35`:T.border}`, fontFamily:SYNE, cursor:'pointer' }}>
                    {l}
                  </motion.button>
                ))}
              </motion.div>

              {/* KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" data-tour="fin-kpis">
                {[
                  { label:'Receitas', value:income,  color:T.green,                     sub:`Últimos ${period} dias`,                                               icon:TrendingUp   },
                  { label:'Despesas', value:expense, color:T.red,                       sub:`Últimos ${period} dias`,                                               icon:TrendingDown },
                  { label:'Lucro',    value:lucro,   color:lucro>=0?T.green:T.red,      sub:income>0?`Margem: ${((lucro/income)*100).toFixed(1)}%`:'–',             icon:DollarSign   },
                ].map(({ label, value, color, sub, icon: Icon }, i) => (
                  <motion.div key={label} {...fadeUp(0.12+i*0.07)}>
                    <SpotlightCard className="rounded-2xl h-full" spotlightColor={`${color}16`} style={card}>
                      <div className="p-5 relative overflow-hidden">
                        <GlowCorner color={`${color}22`} position="bottom-right" />
                        <div className="flex items-center justify-between mb-4" style={{ position:'relative', zIndex:1 }}>
                          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color:T.muted, fontFamily:SYNE }}>{label}</span>
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background:`${color}14`, border:`1px solid ${color}25`, boxShadow:`0 0 14px ${color}20` }}>
                            <Icon size={14} style={{ color }} strokeWidth={2} />
                          </div>
                        </div>
                        <p className="text-2xl font-bold tabular-nums" style={{ fontFamily:SYNE, color, textShadow:`0 0 28px ${color}55`, letterSpacing:'-0.01em', position:'relative', zIndex:1 }}>{fmtShort(value)}</p>
                        <p className="text-xs mt-1.5" style={{ color:T.muted, fontFamily:SYNE, position:'relative', zIndex:1 }}>{sub}</p>
                      </div>
                    </SpotlightCard>
                  </motion.div>
                ))}
              </div>

              {/* Gráfico + por categoria */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" data-tour="fin-grafico">
                <motion.div {...scaleIn(0.22)} className="sm:col-span-2">
                  <SpotlightCard className="rounded-2xl h-full" style={card}>
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-5">
                        <div>
                          <h2 className="font-bold text-sm" style={{ fontFamily:SYNE, color:T.text }}>Entradas × Saídas</h2>
                          <p className="text-xs mt-0.5" style={{ color:T.muted, fontFamily:SYNE }}>Últimos {period} dias</p>
                        </div>
                        <div className="flex gap-4">
                          {[{color:T.green,label:'Entrada'},{color:T.red,label:'Saída'}].map(l=>(
                            <div key={l.label} className="flex items-center gap-1.5 text-xs" style={{ color:T.muted, fontFamily:SYNE }}>
                              <div className="w-2 h-2 rounded-sm" style={{ background:l.color, boxShadow:`0 0 5px ${l.color}` }} />{l.label}
                            </div>
                          ))}
                        </div>
                      </div>
                      {chartDays.length===0 ? (
                        <div className="flex flex-col items-center justify-center h-40 gap-2">
                          <TrendingUp size={28} style={{ color:T.muted }} />
                          <p className="text-sm" style={{ color:T.muted, fontFamily:SYNE }}>Sem dados no período</p>
                        </div>
                      ):(
                        <div className="flex items-end gap-1" style={{ height:140 }}>
                          {chartDays.map(([day,vals]:any,i)=>(
                            <div key={day} className="flex-1 flex flex-col items-center gap-1">
                              <div className="w-full flex gap-0.5 items-end" style={{ height:112 }}>
                                <motion.div className="flex-1 rounded-t-sm" initial={{ height:0 }} animate={{ height:`${(vals.income/maxVal)*100}%` }} transition={{ duration:0.6,delay:0.2+i*0.03,ease:[0.16,1,0.3,1] }} style={{ background:`linear-gradient(to top,${T.green}55,${T.green}cc)`,boxShadow:vals.income>0?`0 -2px 8px ${T.green}40`:'none',minHeight:vals.income>0?3:0 }} />
                                <motion.div className="flex-1 rounded-t-sm" initial={{ height:0 }} animate={{ height:`${(vals.expense/maxVal)*100}%` }} transition={{ duration:0.6,delay:0.25+i*0.03,ease:[0.16,1,0.3,1] }} style={{ background:`linear-gradient(to top,${T.red}55,${T.red}cc)`,boxShadow:vals.expense>0?`0 -2px 8px ${T.red}40`:'none',minHeight:vals.expense>0?3:0 }} />
                              </div>
                              <span style={{ color:T.muted, fontSize:9, fontFamily:SYNE }}>{new Date(day).getDate()}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </SpotlightCard>
                </motion.div>

                <motion.div {...scaleIn(0.28)}>
                  <SpotlightCard className="rounded-2xl h-full" style={card}>
                    <div className="p-5 flex flex-col gap-4">
                      <div>
                        <h2 className="font-bold text-sm" style={{ fontFamily:SYNE, color:T.text }}>Por categoria</h2>
                        <p className="text-xs mt-0.5" style={{ color:T.muted, fontFamily:SYNE }}>Despesas</p>
                      </div>
                      {catEntries.length===0 ? (
                        <p className="text-sm py-6 text-center" style={{ color:T.muted, fontFamily:SYNE }}>Sem despesas</p>
                      ):(
                        <div className="flex flex-col gap-3">
                          {catEntries.slice(0,6).map(([cat,val]:any,i)=>(
                            <motion.div key={cat} initial={{ opacity:0,x:-8 }} animate={{ opacity:1,x:0 }} transition={{ delay:0.3+i*0.06 }}>
                              <div className="flex items-center justify-between text-xs mb-1.5">
                                <span className="truncate mr-2" style={{ color:T.sub, fontFamily:SYNE }}>{cat}</span>
                                <span className="shrink-0 font-semibold tabular-nums" style={{ color:T.text, fontFamily:SYNE }}>{fmtShort(val)}</span>
                              </div>
                              <div className="h-1 rounded-full overflow-hidden" style={{ background:'rgba(255,255,255,0.06)' }}>
                                <motion.div className="h-full rounded-full" initial={{ width:0 }} animate={{ width:`${(val/expense)*100}%` }} transition={{ duration:0.8,delay:0.35+i*0.06,ease:[0.16,1,0.3,1] }} style={{ background:`linear-gradient(90deg,${T.purple}88,${T.violet})`,boxShadow:`0 0 8px ${T.purple}50` }} />
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  </SpotlightCard>
                </motion.div>
              </div>

              {/* Preview das últimas 5 + "Ver todas" */}
              <motion.div {...fadeUp(0.38)}>
                <SpotlightCard className="rounded-2xl overflow-hidden" style={card}>
                  <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor:T.border }}>
                    <div>
                      <h2 className="font-bold text-sm" style={{ fontFamily:SYNE, color:T.text }}>Lançamentos recentes</h2>
                      <p className="text-xs mt-0.5" style={{ color:T.muted, fontFamily:SYNE }}>{transactions.length} no período</p>
                    </div>
                    <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                      onClick={() => setTab('transacoes')}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg"
                      style={{ background:`${T.purple}12`, color:T.violet, border:`1px solid ${T.purple}25`, cursor:'pointer', fontFamily:SYNE }}>
                      Ver todas <ChevronRight size={12} />
                    </motion.button>
                  </div>
                  {transactions.length===0 ? (
                    <div className="px-5 py-10 text-center">
                      <DollarSign size={28} className="mx-auto mb-3" style={{ color:T.muted }} />
                      <p className="text-sm" style={{ color:T.muted, fontFamily:SYNE }}>Nenhum lançamento no período</p>
                    </div>
                  ) : transactions.slice(0,5).map((tx,i) => <TxRow key={tx.id} tx={tx} i={i} />)}
                </SpotlightCard>
              </motion.div>
            </motion.div>
          )}

          {/* ══════ TRANSAÇÕES ══════ */}
          {tab === 'transacoes' && (
            <motion.div key="transacoes" initial={{ opacity:0,y:8 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0 }} className="flex flex-col gap-4">

              {/* Filtros */}
              <motion.div {...fadeUp(0.05)}>
                <SpotlightCard className="rounded-2xl" style={card}>
                  <div className="p-4">
                    <FilterBar
                      value={txSearch}
                      onChange={setTxSearch}
                      placeholder="Buscar lançamento..."
                      tabs={[
                        { value: 'all',     label: 'Todos',    color: T.purple },
                        { value: 'income',  label: 'Entradas', color: T.green  },
                        { value: 'expense', label: 'Saídas',   color: T.red    },
                      ]}
                      activeTab={txTypeF}
                      onTabChange={v => setTxTypeF(v as 'all' | 'income' | 'expense')}
                      extra={
                        <select
                          value={txCategoryF}
                          onChange={e => setTxCategoryF(e.target.value)}
                          style={{ ...inp, padding: '9px 12px', width: 'auto', minWidth: 140, cursor: 'pointer' }}
                        >
                          <option value="">Todas as categorias</option>
                          {uniqueCatNames.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      }
                    />
                  </div>
                </SpotlightCard>
              </motion.div>

              {/* Lista */}
              <motion.div {...fadeUp(0.1)}>
                <SpotlightCard className="rounded-2xl overflow-hidden" style={card}>
                  <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor:T.border }}>
                    <div>
                      <h2 className="font-bold text-sm" style={{ fontFamily:SYNE, color:T.text }}>Todos os lançamentos</h2>
                      <p className="text-xs mt-0.5" style={{ color:T.muted, fontFamily:SYNE }}>
                        {filteredTxs.length}{filteredTxs.length!==transactions.length?` de ${transactions.length}`:''} lançamentos
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="hidden sm:flex items-center gap-3 mr-2">
                        <span className="text-xs font-semibold tabular-nums" style={{ color:T.green, fontFamily:SYNE }}>
                          +{fmtShort(filteredTxs.filter(t=>t.type==='income').reduce((a,t)=>a+Number(t.amount),0))}
                        </span>
                        <span className="text-xs" style={{ color:T.border }}>|</span>
                        <span className="text-xs font-semibold tabular-nums" style={{ color:T.red, fontFamily:SYNE }}>
                          −{fmtShort(filteredTxs.filter(t=>t.type==='expense').reduce((a,t)=>a+Number(t.amount),0))}
                        </span>
                      </div>
                      <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }} onClick={openNewTx}
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg"
                        style={{ background:`${T.purple}12`, color:T.violet, border:`1px solid ${T.purple}25`, cursor:'pointer', fontFamily:SYNE }}>
                        <Plus size={12} /> Novo
                      </motion.button>
                    </div>
                  </div>
                  {filteredTxs.length===0 ? (
                    <div className="px-5 py-14 text-center flex flex-col items-center gap-3">
                      <SlidersHorizontal size={32} style={{ color:T.muted }} />
                      <p className="text-sm font-medium" style={{ color:T.sub, fontFamily:SYNE }}>
                        {txSearch||txTypeF!=='all'||txCategoryF ? 'Nenhum lançamento com esses filtros' : 'Nenhum lançamento no período'}
                      </p>
                      {(txSearch||txTypeF!=='all'||txCategoryF) && (
                        <motion.button whileTap={{ scale:0.97 }}
                          onClick={() => { setTxSearch(''); setTxTypeF('all'); setTxCategoryF('') }}
                          className="text-xs px-3 py-2 rounded-lg"
                          style={{ background:`${T.purple}10`, color:T.violet, border:`1px solid ${T.purple}25`, cursor:'pointer', fontFamily:SYNE }}>
                          Limpar filtros
                        </motion.button>
                      )}
                    </div>
                  ) : filteredTxs.map((tx,i) => <TxRow key={tx.id} tx={tx} i={i} />)}
                </SpotlightCard>
              </motion.div>
            </motion.div>
          )}

          {/* ══════ CATEGORIAS ══════ */}
          {tab === 'categorias' && (
            <motion.div key="categorias" initial={{ opacity:0,y:8 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0 }} className="flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <p className="text-sm" style={{ color:T.muted, fontFamily:SYNE }}>{categories.length} {categories.length===1?'categoria':'categorias'} cadastradas</p>
                <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                  onClick={() => { setEditCat(null); setCatForm({ name:'', type:'expense', color:'#f87171' }); setShowCatForm(true) }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background:`${T.purple}18`, color:T.violet, border:`1px solid ${T.purple}30`, cursor:'pointer', fontFamily:SYNE }}>
                  <Plus size={14} /> Nova categoria
                </motion.button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(['income','expense'] as const).map((type,ti) => {
                  const filtered = categories.filter(c => c.type===type)
                  const total    = transactions.filter(t => t.type===type).reduce((a,t) => a+Number(t.amount),0)
                  return (
                    <motion.div key={type} initial={{ opacity:0,y:8 }} animate={{ opacity:1,y:0 }} transition={{ delay:ti*0.08 }}>
                      <SpotlightCard className="rounded-2xl h-full" spotlightColor={type==='income'?`${T.green}10`:`${T.red}10`} style={card}>
                        <div className="p-5">
                          <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background:type==='income'?`${T.green}15`:`${T.red}15`, border:`1px solid ${type==='income'?T.green:T.red}25` }}>
                                {type==='income' ? <TrendingUp size={13} style={{ color:T.green }} /> : <TrendingDown size={13} style={{ color:T.red }} />}
                              </div>
                              <div>
                                <h2 className="font-bold text-sm" style={{ fontFamily:SYNE, color:type==='income'?T.green:T.red }}>{type==='income'?'Receitas':'Despesas'}</h2>
                                <p className="text-xs" style={{ color:T.muted, fontFamily:SYNE }}>{fmtShort(total)} no período</p>
                              </div>
                            </div>
                            <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background:'rgba(255,255,255,0.04)', color:T.sub, border:`1px solid ${T.border}`, fontFamily:SYNE }}>{filtered.length}</span>
                          </div>

                          <div className="flex flex-col gap-2">
                            {filtered.length===0 ? (
                              <div className="py-6 text-center">
                                <p className="text-sm" style={{ color:T.muted, fontFamily:SYNE }}>Nenhuma categoria ainda.</p>
                                <motion.button whileTap={{ scale:0.97 }}
                                  onClick={() => { setEditCat(null); setCatForm({ name:'', type, color:type==='income'?'#34d399':'#f87171' }); setShowCatForm(true) }}
                                  className="text-xs mt-3 px-3 py-2 rounded-lg"
                                  style={{ background:`${T.purple}10`, color:T.violet, border:`1px solid ${T.purple}22`, cursor:'pointer', fontFamily:SYNE }}>
                                  + Criar primeira
                                </motion.button>
                              </div>
                            ) : filtered.map((cat,i) => {
                              const catTotal = transactions.filter(t => t.type===type && t.category_id===cat.id).reduce((a,t) => a+Number(t.amount),0)
                              const pct = total>0 ? (catTotal/total)*100 : 0
                              return (
                                <motion.div key={cat.id} initial={{ opacity:0,x:-8 }} animate={{ opacity:1,x:0 }} transition={{ delay:i*0.04 }}
                                  className="group rounded-xl p-3" style={{ background:T.surface, border:`1px solid ${T.border}` }}>
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                      <div className="w-3 h-3 rounded-full shrink-0" style={{ background:cat.color, boxShadow:`0 0 8px ${cat.color}60` }} />
                                      <span className="text-sm font-medium truncate" style={{ color:T.text, fontFamily:SYNE }}>{cat.name}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <motion.button whileHover={{ scale:1.1 }} whileTap={{ scale:0.9 }}
                                        onClick={() => { setEditCat(cat); setCatForm({ name:cat.name, type:cat.type, color:cat.color }); setShowCatForm(true) }}
                                        className="w-6 h-6 rounded-md flex items-center justify-center"
                                        style={{ background:`${T.purple}12`, color:T.violet, border:`1px solid ${T.purple}22`, cursor:'pointer' }}>
                                        <Pencil size={10} />
                                      </motion.button>
                                      <motion.button whileHover={{ scale:1.1 }} whileTap={{ scale:0.9 }}
                                        onClick={() => handleDeleteCat(cat.id)}
                                        className="w-6 h-6 rounded-md flex items-center justify-center"
                                        style={{ background:`${T.red}10`, color:T.red, border:`1px solid ${T.red}22`, cursor:'pointer' }}>
                                        <Trash2 size={10} />
                                      </motion.button>
                                    </div>
                                    <span className="text-xs font-semibold tabular-nums ml-2 shrink-0" style={{ color:T.sub, fontFamily:SYNE }}>{fmtShort(catTotal)}</span>
                                  </div>
                                  <div className="h-1 rounded-full overflow-hidden" style={{ background:'rgba(255,255,255,0.05)' }}>
                                    <motion.div className="h-full rounded-full" initial={{ width:0 }} animate={{ width:`${pct}%` }}
                                      transition={{ duration:0.8, delay:0.1+i*0.05, ease:[0.16,1,0.3,1] }}
                                      style={{ background:cat.color, boxShadow:`0 0 6px ${cat.color}60` }} />
                                  </div>
                                  <p className="text-xs mt-1.5" style={{ color:T.muted, fontFamily:SYNE }}>{pct.toFixed(1)}% do total</p>
                                </motion.div>
                              )
                            })}
                          </div>
                        </div>
                      </SpotlightCard>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* ══════ BANCOS ══════ */}
          {tab === 'bancos' && (
            <motion.div key="bancos" initial={{ opacity:0,y:8 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0 }}>
              <PlanGate currentPlan={plan} requiredPlan="pro" feature="Integração com Bancos"
                description="Conecte Nubank, Itaú, Bradesco e mais para sincronizar automaticamente." mode="hide">
                <div className="flex flex-col gap-4">
                  <SpotlightCard className="rounded-2xl" spotlightColor={`${T.purple}12`} style={card}>
                    <div className="p-10 flex flex-col items-center text-center gap-5">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background:`${T.purple}12`, border:`1px solid ${T.purple}30`, boxShadow:`0 0 40px ${T.purple}25` }}>
                          <Building2 size={28} style={{ color:T.violet }} strokeWidth={1.6} />
                        </div>
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ background:T.amber, boxShadow:`0 0 12px ${T.amber}80` }}>
                          <Zap size={10} style={{ color:'#000' }} />
                        </div>
                      </div>
                      <div>
                        <h2 className="font-bold text-xl mb-2" style={{ fontFamily:SYNE, color:T.text }}>Open Finance em breve</h2>
                        <p className="text-sm max-w-sm" style={{ color:T.muted, fontFamily:SYNE, lineHeight:1.7 }}>
                          Sincronize automaticamente com os principais bancos do Brasil. Chega de lançamento manual.
                        </p>
                      </div>
                      <span className="text-xs px-4 py-2 rounded-full font-semibold" style={{ background:`${T.amber}12`, color:T.amber, border:`1px solid ${T.amber}28`, fontFamily:SYNE }}>⚡ Em desenvolvimento</span>
                    </div>
                  </SpotlightCard>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { name:'Nubank',    color:'#8B5CF6', symbol:'Nu' },
                      { name:'Itaú',      color:'#F59E0B', symbol:'Itaú' },
                      { name:'Bradesco',  color:'#EF4444', symbol:'Bra' },
                      { name:'Santander', color:'#EF4444', symbol:'San' },
                    ].map((bank,i) => (
                      <motion.div key={bank.name} initial={{ opacity:0,y:8 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.1+i*0.06 }}>
                        <SpotlightCard className="rounded-xl" spotlightColor={`${bank.color}12`} style={{ ...card, cursor:'default' }}>
                          <div className="p-4 flex flex-col items-center gap-2.5">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold" style={{ background:`${bank.color}15`, border:`1px solid ${bank.color}25`, color:bank.color, fontFamily:SYNE }}>
                              {bank.symbol.slice(0,2)}
                            </div>
                            <p className="text-xs font-semibold" style={{ color:T.sub, fontFamily:SYNE }}>{bank.name}</p>
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background:'rgba(255,255,255,0.04)', color:T.muted, border:`1px solid ${T.border}`, fontFamily:SYNE }}>Em breve</span>
                          </div>
                        </SpotlightCard>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </PlanGate>
            </motion.div>
          )}

        </AnimatePresence>

        {/* ── Modal lançamento ── */}
                <FormModal
          open={showTxForm}
          onClose={() => { setShowTxForm(false); setEditTx(null) }}
          title={editTx?'Editar lançamento':'Novo lançamento'}
        >
          <form onSubmit={handleSaveTx} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-2">
              {['expense','income'].map(t => (
                <button key={t} type="button" onClick={() => setTxForm({ ...txForm, type:t })}
                  className="py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background:txForm.type===t?(t==='income'?`${T.green}12`:`${T.red}12`):'rgba(255,255,255,0.02)', color:txForm.type===t?(t==='income'?T.green:T.red):T.muted, border:`1px solid ${txForm.type===t?(t==='income'?`${T.green}30`:`${T.red}30`):T.border}`, cursor:'pointer', fontFamily:SYNE }}>
                  {t==='income'?'↑ Entrada':'↓ Saída'}
                </button>
              ))}
            </div>
            <input type="text" placeholder="Título *" value={txForm.title} required
              onChange={e => setTxForm({ ...txForm, title:e.target.value })} style={inp}
              onFocus={e => e.currentTarget.style.borderColor=T.borderP} onBlur={e => e.currentTarget.style.borderColor=T.border} />
            <div className="grid grid-cols-2 gap-3">
              <input type="number" step="0.01" placeholder="Valor *" value={txForm.amount} required
                onChange={e => setTxForm({ ...txForm, amount:e.target.value })} style={inp}
                onFocus={e => e.currentTarget.style.borderColor=T.borderP} onBlur={e => e.currentTarget.style.borderColor=T.border} />
              <input type="date" value={txForm.date} required
                onChange={e => setTxForm({ ...txForm, date:e.target.value })} style={inp}
                onFocus={e => e.currentTarget.style.borderColor=T.borderP} onBlur={e => e.currentTarget.style.borderColor=T.border} />
            </div>
            <select value={txForm.category_id} onChange={e => setTxForm({ ...txForm, category_id:e.target.value })}
              style={{ ...inp, cursor:'pointer' }}>
              <option value="">Sem categoria</option>
              {categories.filter(c => c.type===txForm.type).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={txForm.paid} onChange={e => setTxForm({ ...txForm, paid:e.target.checked })} style={{ accentColor:T.purple }} />
              <span className="text-sm" style={{ color:T.sub, fontFamily:SYNE }}>Já foi pago/recebido</span>
            </label>
            <ModalSubmitButton loading={savingTx}>{editTx ? 'Salvar alterações' : 'Salvar lançamento'}</ModalSubmitButton>
          </form>
        </FormModal>

        {/* ── Modal categoria ── */}
        <FormModal
          open={showCatForm}
          onClose={() => { setShowCatForm(false); setEditCat(null) }}
          title={editCat ? 'Editar categoria' : 'Nova categoria'}
          size="sm"
        >
            <form onSubmit={handleSaveCat} className="flex flex-col gap-4">
              <input type="text" placeholder="Nome da categoria *" value={catForm.name} required
                onChange={e => setCatForm({ ...catForm, name:e.target.value })} style={inp}
                onFocus={e => e.currentTarget.style.borderColor=T.borderP} onBlur={e => e.currentTarget.style.borderColor=T.border} />
              <div className="grid grid-cols-2 gap-2">
                {(['income','expense'] as const).map(t => (
                  <button key={t} type="button" onClick={() => setCatForm({ ...catForm, type:t })}
                    className="py-2.5 rounded-xl text-sm font-semibold"
                    style={{ background:catForm.type===t?(t==='income'?`${T.green}12`:`${T.red}12`):'rgba(255,255,255,0.02)', color:catForm.type===t?(t==='income'?T.green:T.red):T.muted, border:`1px solid ${catForm.type===t?(t==='income'?`${T.green}30`:`${T.red}30`):T.border}`, cursor:'pointer', fontFamily:SYNE }}>
                    {t==='income'?'↑ Receita':'↓ Despesa'}
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-widest" style={{ color:T.muted, fontFamily:SYNE }}>Cor</label>
                <div className="flex gap-2 flex-wrap">
                  {CAT_COLORS.map(c => (
                    <motion.button key={c} type="button" whileTap={{ scale:0.85 }} onClick={() => setCatForm({ ...catForm, color:c })}
                      className="w-7 h-7 rounded-full" animate={{ scale:catForm.color===c?1.2:1 }}
                      style={{ background:c, cursor:'pointer', outline:catForm.color===c?`2px solid ${c}`:'none', outlineOffset:'2px', boxShadow:catForm.color===c?`0 0 12px ${c}80`:'none' }} />
                  ))}
                </div>
              </div>
              <ModalSubmitButton loading={savingCat}>
                {editCat ? 'Salvar alterações' : 'Criar categoria'}
              </ModalSubmitButton>
            </form>
          </FormModal>

      </div>
    </PageBackground>
  )
}
