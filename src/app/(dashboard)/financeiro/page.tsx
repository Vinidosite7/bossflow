'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useTour } from '@/hooks/useTour'
import { usePlanLimits } from '@/hooks/usePlanLimits'
import { TourOverlay } from '@/components/TourOverlay'
import { PlanGate } from '@/components/PlanGate'
import { TrendingUp, TrendingDown, DollarSign, Plus, X, Loader2, Pencil, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

type Tab = 'visao' | 'categorias' | 'bancos'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay, ease: [0.25, 0.46, 0.45, 0.94] as const }
})

const scaleIn = (delay = 0) => ({
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.35, delay, ease: [0.25, 0.46, 0.45, 0.94] as const }
})

const TOUR_STEPS = [
  {
    target: '[data-tour="fin-header"]',
    title: 'Painel financeiro',
    description: 'Registre entradas e saídas do seu negócio. Clique em "Novo lançamento" para começar.',
    position: 'bottom' as const,
  },
  {
    target: '[data-tour="fin-tabs"]',
    title: 'Visões do financeiro',
    description: 'Alterne entre Visão geral, Categorias e Bancos para diferentes perspectivas das suas finanças.',
    position: 'bottom' as const,
  },
  {
    target: '[data-tour="fin-kpis"]',
    title: 'Resumo do período',
    description: 'Receitas, despesas e lucro do período selecionado. Use os filtros de 7, 30 ou 90 dias.',
    position: 'bottom' as const,
  },
  {
    target: '[data-tour="fin-grafico"]',
    title: 'Gráfico de fluxo',
    description: 'Visualize entradas (verde) e saídas (vermelho) dia a dia. Passe o mouse para ver os valores.',
    position: 'top' as const,
  },
]

export default function FinanceiroPage() {
  const supabase = createClient()
  const { plan } = usePlanLimits()
  const tour = useTour('financeiro', TOUR_STEPS)

  const [tab, setTab] = useState<Tab>('visao')
  const [loading, setLoading] = useState(true)
  const [businessId, setBusinessId] = useState('')
  const [transactions, setTransactions] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [period, setPeriod] = useState('30')

  const [showTxForm, setShowTxForm] = useState(false)
  const [showCatForm, setShowCatForm] = useState(false)
  const [editCat, setEditCat] = useState<any>(null)
  const [savingTx, setSavingTx] = useState(false)
  const [savingCat, setSavingCat] = useState(false)

  const [txForm, setTxForm] = useState({
    title: '', amount: '', date: new Date().toISOString().split('T')[0],
    type: 'expense', category_id: '', description: '', paid: true,
  })
  const [catForm, setCatForm] = useState({ name: '', type: 'expense', color: '#f87171' })

  async function load() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const savedBizId = typeof window !== 'undefined' ? localStorage.getItem('activeBizId') || '' : ''
      const { data: bizList } = await supabase.from('businesses').select('id').eq('owner_id', user.id)
      if (!bizList?.length) { setLoading(false); return }
      const biz = bizList.find(b => b.id === savedBizId) || bizList[0]
      setBusinessId(biz.id)
      const daysNum = parseInt(period)
      const from = new Date()
      from.setDate(from.getDate() - daysNum)
      const fromStr = from.toISOString().split('T')[0]
      const [{ data: txs }, { data: cats }] = await Promise.all([
        supabase.from('transactions').select('*, categories(name, color)').eq('business_id', biz.id).gte('date', fromStr).order('date', { ascending: false }),
        supabase.from('categories').select('*').eq('business_id', biz.id).order('name'),
      ])
      setTransactions(txs || [])
      setCategories(cats || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [period])

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const income = transactions.filter(t => t.type === 'income').reduce((a, t) => a + Number(t.amount), 0)
  const expense = transactions.filter(t => t.type === 'expense').reduce((a, t) => a + Number(t.amount), 0)
  const lucro = income - expense

  async function handleCreateTx(e: React.FormEvent) {
    e.preventDefault()
    setSavingTx(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('transactions').insert({
      title: txForm.title, amount: parseFloat(txForm.amount),
      date: txForm.date, type: txForm.type,
      category_id: txForm.category_id || null,
      description: txForm.description || null,
      paid: txForm.paid, paid_at: txForm.paid ? new Date().toISOString() : null,
      business_id: businessId, created_by: user?.id,
    })
    setTxForm({ title: '', amount: '', date: new Date().toISOString().split('T')[0], type: 'expense', category_id: '', description: '', paid: true })
    setShowTxForm(false); setSavingTx(false); load()
  }

  async function handleSaveCat(e: React.FormEvent) {
    e.preventDefault()
    setSavingCat(true)
    if (editCat) {
      await supabase.from('categories').update({ name: catForm.name, type: catForm.type, color: catForm.color }).eq('id', editCat.id)
    } else {
      await supabase.from('categories').insert({ ...catForm, business_id: businessId })
    }
    setCatForm({ name: '', type: 'expense', color: '#f87171' }); setEditCat(null); setShowCatForm(false); setSavingCat(false); load()
  }

  async function handleDeleteCat(id: string) {
    if (!confirm('Excluir esta categoria?')) return
    await supabase.from('categories').delete().eq('id', id)
    load()
  }

  const colors = ['#f87171', '#34d399', '#fbbf24', '#22d3ee', '#a78bfa', '#7c6ef7', '#fb923c', '#6b6b8a']

  const byDay = transactions.reduce((acc: any, t) => {
    if (!acc[t.date]) acc[t.date] = { income: 0, expense: 0 }
    acc[t.date][t.type === 'income' ? 'income' : 'expense'] += Number(t.amount)
    return acc
  }, {})
  const chartDays = Object.entries(byDay).slice(-14)
  const maxVal = Math.max(...chartDays.map((d: any) => Math.max(d[1].income, d[1].expense)), 1)

  const expenseByCategory = transactions.filter(t => t.type === 'expense').reduce((acc: any, t) => {
    const cat = t.categories?.name || 'Sem categoria'
    acc[cat] = (acc[cat] || 0) + Number(t.amount)
    return acc
  }, {})
  const catEntries = Object.entries(expenseByCategory).sort((a: any, b: any) => b[1] - a[1])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: '#7c6ef7', borderTopColor: 'transparent' }} />
    </div>
  )

  return (
    <div className="flex flex-col gap-6">
      <TourOverlay active={tour.active} step={tour.step} current={tour.current} total={tour.total} onNext={tour.next} onPrev={tour.prev} onFinish={tour.finish} />

      <motion.div {...fadeUp(0)} className="flex items-center justify-between" data-tour="fin-header">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>Financeiro</h1>
          <p className="text-sm mt-1" style={{ color: '#4a4a6a' }}>Gerencie suas finanças</p>
        </div>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={() => setShowTxForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ background: '#7c6ef7', color: 'white', boxShadow: '0 0 20px rgba(124,110,247,0.3)' }}>
          <Plus size={15} />
          <span className="hidden sm:inline">Novo lançamento</span>
          <span className="sm:hidden">Novo</span>
        </motion.button>
      </motion.div>

      {/* Tabs */}
      <motion.div {...fadeUp(0.06)} className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: '#111118', border: '1px solid #1e1e2e' }} data-tour="fin-tabs">
        {([['visao', 'Visão geral'], ['categorias', 'Categorias'], ['bancos', 'Bancos']] as const).map(([key, label]) => (
          <motion.button key={key} whileTap={{ scale: 0.95 }} onClick={() => setTab(key)}
            className="px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all"
            style={{ background: tab === key ? '#1e1e2e' : 'transparent', color: tab === key ? '#e8e8f0' : '#4a4a6a' }}>
            {label}
          </motion.button>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">
        {tab === 'visao' && (
          <motion.div key="visao" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-6">
            <motion.div {...fadeUp(0.1)} className="flex gap-2">
              {[['7', '7 dias'], ['30', '30 dias'], ['90', '90 dias']].map(([v, l]) => (
                <motion.button key={v} whileTap={{ scale: 0.95 }} onClick={() => setPeriod(v)}
                  className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all"
                  style={{
                    background: period === v ? 'rgba(124,110,247,0.15)' : '#111118',
                    color: period === v ? '#9d8fff' : '#4a4a6a',
                    border: `1px solid ${period === v ? 'rgba(124,110,247,0.3)' : '#1e1e2e'}`,
                  }}>
                  {l}
                </motion.button>
              ))}
            </motion.div>

            <div className="grid grid-cols-3 gap-3" data-tour="fin-kpis">
              {[
                { label: 'Receitas', value: fmt(income), color: '#34d399', icon: TrendingUp },
                { label: 'Despesas', value: fmt(expense), color: '#f87171', icon: TrendingDown },
                { label: 'Lucro', value: fmt(lucro), color: lucro >= 0 ? '#34d399' : '#f87171', icon: DollarSign },
              ].map(({ label, value, color, icon: Icon }, i) => (
                <motion.div key={label} {...fadeUp(0.12 + i * 0.07)}
                  className="rounded-2xl p-3 sm:p-5" style={{ background: '#111118', border: '1px solid #1e1e2e' }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs uppercase tracking-widest font-semibold hidden sm:block" style={{ color: '#4a4a6a' }}>{label}</span>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
                      <Icon size={14} style={{ color }} />
                    </div>
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-1 sm:hidden" style={{ color: '#4a4a6a' }}>{label}</p>
                  <p className="text-base sm:text-2xl font-bold leading-tight" style={{ fontFamily: 'Syne, sans-serif', color }}>{value}</p>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" data-tour="fin-grafico">
              <motion.div {...scaleIn(0.28)} className="sm:col-span-2 rounded-2xl p-5" style={{ background: '#111118', border: '1px solid #1e1e2e' }}>
                <h2 className="font-bold mb-4 text-sm sm:text-base" style={{ fontFamily: 'Syne, sans-serif' }}>Entradas × Saídas</h2>
                {chartDays.length === 0 ? (
                  <div className="flex items-center justify-center h-40 text-sm" style={{ color: '#4a4a6a' }}>Sem dados no período</div>
                ) : (
                  <div className="flex items-end gap-1 h-40">
                    {chartDays.map(([day, vals]: any, i) => (
                      <div key={day} className="flex-1 flex flex-col items-center gap-0.5">
                        <div className="w-full flex gap-0.5 items-end" style={{ height: '120px' }}>
                          <motion.div className="flex-1 rounded-t-sm"
                            initial={{ height: 0 }} animate={{ height: `${(vals.income / maxVal) * 100}%` }}
                            transition={{ duration: 0.5, delay: 0.3 + i * 0.03 }}
                            style={{ background: '#34d399', opacity: 0.8, minHeight: vals.income > 0 ? '4px' : '0' }} />
                          <motion.div className="flex-1 rounded-t-sm"
                            initial={{ height: 0 }} animate={{ height: `${(vals.expense / maxVal) * 100}%` }}
                            transition={{ duration: 0.5, delay: 0.35 + i * 0.03 }}
                            style={{ background: '#f87171', opacity: 0.8, minHeight: vals.expense > 0 ? '4px' : '0' }} />
                        </div>
                        <span style={{ color: '#3a3a5c', fontSize: '9px' }}>{new Date(day).getDate()}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-4 mt-3">
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: '#4a4a6a' }}>
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ background: '#34d399' }} /> Entradas
                  </div>
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: '#4a4a6a' }}>
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ background: '#f87171' }} /> Saídas
                  </div>
                </div>
              </motion.div>

              <motion.div {...scaleIn(0.34)} className="rounded-2xl p-5" style={{ background: '#111118', border: '1px solid #1e1e2e' }}>
                <h2 className="font-bold mb-4 text-sm sm:text-base" style={{ fontFamily: 'Syne, sans-serif' }}>Por categoria</h2>
                {catEntries.length === 0 ? (
                  <div className="flex items-center justify-center h-40 text-sm" style={{ color: '#4a4a6a' }}>Sem despesas</div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {catEntries.slice(0, 6).map(([cat, val]: any, i) => (
                      <motion.div key={cat} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.05 }}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="truncate mr-2" style={{ color: '#6b6b8a' }}>{cat}</span>
                          <span className="shrink-0" style={{ color: '#e8e8f0' }}>{fmt(val)}</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#1e1e2e' }}>
                          <motion.div className="h-full rounded-full"
                            initial={{ width: 0 }} animate={{ width: `${(val / expense) * 100}%` }}
                            transition={{ duration: 0.6, delay: 0.45 + i * 0.05 }}
                            style={{ background: '#7c6ef7' }} />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>

            <motion.div {...fadeUp(0.4)} className="rounded-2xl overflow-hidden" style={{ background: '#111118', border: '1px solid #1e1e2e' }}>
              <div className="px-5 py-4 border-b" style={{ borderColor: '#1a1a2a' }}>
                <h2 className="font-bold text-sm sm:text-base" style={{ fontFamily: 'Syne, sans-serif' }}>Transações recentes</h2>
              </div>
              {transactions.length === 0 ? (
                <p className="text-sm px-5 py-6" style={{ color: '#4a4a6a' }}>Nenhuma transação no período.</p>
              ) : transactions.slice(0, 8).map((tx, i) => (
                <motion.div key={tx.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25, delay: 0.45 + i * 0.04 }}
                  className="flex items-center gap-3 px-4 py-3.5"
                  style={{ borderBottom: i < Math.min(transactions.length, 8) - 1 ? '1px solid #1a1a2a' : 'none' }}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: tx.type === 'income' ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)' }}>
                    {tx.type === 'income' ? <TrendingUp size={13} style={{ color: '#34d399' }} /> : <TrendingDown size={13} style={{ color: '#f87171' }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: '#d0d0e0' }}>{tx.title}</p>
                    <p className="text-xs mt-0.5 truncate" style={{ color: '#4a4a6a' }}>
                      {tx.categories?.name || 'Sem categoria'} · {new Date(tx.date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <span className="text-sm font-semibold shrink-0" style={{ color: tx.type === 'income' ? '#34d399' : '#f87171' }}>
                    {tx.type === 'income' ? '+' : '-'}{fmt(Number(tx.amount))}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}

        {tab === 'categorias' && (
          <motion.div key="categorias" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col gap-4">
            <div className="flex justify-end">
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => { setEditCat(null); setCatForm({ name: '', type: 'expense', color: '#f87171' }); setShowCatForm(true) }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                style={{ background: '#7c6ef7', color: 'white' }}>
                <Plus size={15} /> Nova categoria
              </motion.button>
            </div>
            {['income', 'expense'].map((type, ti) => (
              <motion.div key={type} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: ti * 0.08 }}
                className="rounded-2xl p-5" style={{ background: '#111118', border: '1px solid #1e1e2e' }}>
                <h2 className="font-bold mb-4" style={{ fontFamily: 'Syne, sans-serif', color: type === 'income' ? '#34d399' : '#f87171' }}>
                  {type === 'income' ? '↑ Receitas' : '↓ Despesas'}
                </h2>
                <div className="flex flex-col gap-2">
                  {categories.filter(c => c.type === type).length === 0 ? (
                    <p className="text-sm" style={{ color: '#4a4a6a' }}>Nenhuma categoria ainda.</p>
                  ) : categories.filter(c => c.type === type).map((cat, i) => (
                    <motion.div key={cat.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                      className="flex items-center justify-between py-2.5 px-3 rounded-xl"
                      style={{ background: '#0d0d14', border: '1px solid #1a1a2e' }}>
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ background: cat.color }} />
                        <span className="text-sm font-medium truncate" style={{ color: '#d0d0e0' }}>{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                          onClick={() => { setEditCat(cat); setCatForm({ name: cat.name, type: cat.type, color: cat.color }); setShowCatForm(true) }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{ background: 'rgba(124,110,247,0.1)', color: '#7c6ef7' }}>
                          <Pencil size={12} />
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                          onClick={() => handleDeleteCat(cat.id)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171' }}>
                          <Trash2 size={12} />
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {tab === 'bancos' && (
          <motion.div key="bancos" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <PlanGate currentPlan={plan} requiredPlan="pro" feature="Integração com Bancos"
              description="Conecte Nubank, Itaú, Bradesco e mais para sincronizar transações automaticamente." mode="hide">
              <div className="rounded-2xl p-8 flex flex-col items-center justify-center gap-4"
                style={{ background: '#111118', border: '1px solid #1e1e2e' }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: 'rgba(124,110,247,0.1)', border: '1px solid rgba(124,110,247,0.2)' }}>
                  <DollarSign size={28} style={{ color: '#7c6ef7' }} />
                </div>
                <h2 className="font-bold text-lg" style={{ fontFamily: 'Syne, sans-serif' }}>Bancos em breve</h2>
                <p className="text-sm text-center" style={{ color: '#4a4a6a' }}>
                  Integração com Nubank, Itaú, Bradesco e mais.<br />Disponível na próxima versão.
                </p>
                <span className="text-xs px-3 py-1.5 rounded-full font-medium"
                  style={{ background: 'rgba(124,110,247,0.1)', color: '#9d8fff' }}>Em desenvolvimento</span>
              </div>
            </PlanGate>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: Novo lançamento */}
      <AnimatePresence>
        {showTxForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            style={{ background: 'rgba(0,0,0,0.8)' }}
            onClick={e => { if (e.target === e.currentTarget) setShowTxForm(false) }}>
            <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as const }}
              className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl border p-6"
              style={{ background: '#111118', borderColor: '#1e1e2e' }}>
              <div className="w-10 h-1 rounded-full mx-auto mb-5 sm:hidden" style={{ background: '#2a2a3e' }} />
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-lg" style={{ fontFamily: 'Syne, sans-serif' }}>Novo lançamento</h2>
                <button onClick={() => setShowTxForm(false)} style={{ color: '#4a4a6a' }}><X size={18} /></button>
              </div>
              <form onSubmit={handleCreateTx} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-2">
                  {['expense', 'income'].map(t => (
                    <button key={t} type="button" onClick={() => setTxForm({ ...txForm, type: t })}
                      className="py-2.5 rounded-xl text-sm font-semibold transition-all"
                      style={{
                        background: txForm.type === t ? (t === 'income' ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)') : '#0d0d14',
                        color: txForm.type === t ? (t === 'income' ? '#34d399' : '#f87171') : '#4a4a6a',
                        border: `1px solid ${txForm.type === t ? (t === 'income' ? '#34d399' : '#f87171') : '#1e1e2e'}`,
                      }}>
                      {t === 'income' ? '↑ Entrada' : '↓ Saída'}
                    </button>
                  ))}
                </div>
                <input type="text" placeholder="Título" value={txForm.title} required
                  onChange={e => setTxForm({ ...txForm, title: e.target.value })}
                  className="px-3 py-3 rounded-xl border text-sm outline-none"
                  style={{ background: '#0d0d14', borderColor: '#1e1e2e', color: '#e8e8f0' }} />
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" step="0.01" placeholder="Valor" value={txForm.amount} required
                    onChange={e => setTxForm({ ...txForm, amount: e.target.value })}
                    className="px-3 py-3 rounded-xl border text-sm outline-none"
                    style={{ background: '#0d0d14', borderColor: '#1e1e2e', color: '#e8e8f0' }} />
                  <input type="date" value={txForm.date} required
                    onChange={e => setTxForm({ ...txForm, date: e.target.value })}
                    className="px-3 py-3 rounded-xl border text-sm outline-none"
                    style={{ background: '#0d0d14', borderColor: '#1e1e2e', color: '#e8e8f0' }} />
                </div>
                <select value={txForm.category_id} onChange={e => setTxForm({ ...txForm, category_id: e.target.value })}
                  className="px-3 py-3 rounded-xl border text-sm outline-none"
                  style={{ background: '#0d0d14', borderColor: '#1e1e2e', color: '#e8e8f0' }}>
                  <option value="">Sem categoria</option>
                  {categories.filter(c => c.type === txForm.type).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={txForm.paid} onChange={e => setTxForm({ ...txForm, paid: e.target.checked })} />
                  <span className="text-sm" style={{ color: '#6b6b8a' }}>Já foi pago/recebido</span>
                </label>
                <button type="submit" disabled={savingTx}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm"
                  style={{ background: '#7c6ef7', color: 'white' }}>
                  {savingTx ? <Loader2 size={16} className="animate-spin" /> : 'Salvar lançamento'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: Categoria */}
      <AnimatePresence>
        {showCatForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            style={{ background: 'rgba(0,0,0,0.8)' }}
            onClick={e => { if (e.target === e.currentTarget) { setShowCatForm(false); setEditCat(null) } }}>
            <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as const }}
              className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl border p-6"
              style={{ background: '#111118', borderColor: '#1e1e2e' }}>
              <div className="w-10 h-1 rounded-full mx-auto mb-5 sm:hidden" style={{ background: '#2a2a3e' }} />
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-lg" style={{ fontFamily: 'Syne, sans-serif' }}>{editCat ? 'Editar categoria' : 'Nova categoria'}</h2>
                <button onClick={() => { setShowCatForm(false); setEditCat(null) }} style={{ color: '#4a4a6a' }}><X size={18} /></button>
              </div>
              <form onSubmit={handleSaveCat} className="flex flex-col gap-4">
                <input type="text" placeholder="Nome da categoria" value={catForm.name} required
                  onChange={e => setCatForm({ ...catForm, name: e.target.value })}
                  className="px-3 py-3 rounded-xl border text-sm outline-none"
                  style={{ background: '#0d0d14', borderColor: '#1e1e2e', color: '#e8e8f0' }} />
                <div className="grid grid-cols-2 gap-2">
                  {['income', 'expense'].map(t => (
                    <button key={t} type="button" onClick={() => setCatForm({ ...catForm, type: t })}
                      className="py-2 rounded-xl text-sm font-semibold transition-all"
                      style={{
                        background: catForm.type === t ? (t === 'income' ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)') : '#0d0d14',
                        color: catForm.type === t ? (t === 'income' ? '#34d399' : '#f87171') : '#4a4a6a',
                        border: `1px solid ${catForm.type === t ? (t === 'income' ? '#34d399' : '#f87171') : '#1e1e2e'}`,
                      }}>
                      {t === 'income' ? '↑ Receita' : '↓ Despesa'}
                    </button>
                  ))}
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium" style={{ color: '#6b6b8a' }}>Cor</label>
                  <div className="flex gap-2 flex-wrap">
                    {colors.map(c => (
                      <motion.button key={c} type="button" whileTap={{ scale: 0.85 }}
                        onClick={() => setCatForm({ ...catForm, color: c })}
                        className="w-7 h-7 rounded-full transition-all"
                        animate={{ scale: catForm.color === c ? 1.2 : 1 }}
                        style={{ background: c, outline: catForm.color === c ? `2px solid ${c}` : 'none', outlineOffset: '2px' }} />
                    ))}
                  </div>
                </div>
                <button type="submit" disabled={savingCat}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm mt-2"
                  style={{ background: '#7c6ef7', color: 'white' }}>
                  {savingCat ? <Loader2 size={16} className="animate-spin" /> : editCat ? 'Salvar alterações' : 'Criar categoria'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}