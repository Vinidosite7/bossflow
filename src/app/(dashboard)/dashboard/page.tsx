'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import {
  TrendingUp, TrendingDown, Users, ShoppingCart, Package,
  Plus, ArrowRight, CheckSquare, Calendar, Target, Activity,
  Zap, BarChart2, DollarSign, ClipboardList, CalendarDays,
  ChevronRight,
} from 'lucide-react'
import { useGoals } from '@/hooks/useGoals'
import { GoalCard } from '@/components/GoalCard'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence, useMotionValue, useSpring, animate } from 'framer-motion'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { useTour } from '@/hooks/useTour'
import { TourTooltip } from '@/components/TourTooltip'
import { TourButton } from '@/components/TourButton'

// ─── Tour steps ───────────────────────────────────────────────────────────────
const TOUR_STEPS = [
  {
    target: '[data-tour="kpis"]',
    title: 'Resumo financeiro',
    description: 'Faturamento, despesas e lucro líquido do mês. Os valores atualizam em tempo real conforme você lança.',
  },
  {
    target: '[data-tour="alerts"]',
    title: 'Alertas inteligentes',
    description: 'Avisos de tarefas atrasadas, pagamentos pendentes e eventos do dia aparecem aqui automaticamente.',
  },
  {
    target: '[data-tour="chart"]',
    title: 'Fluxo de caixa',
    description: 'Gráfico dos últimos 14 dias com entradas e saídas. Passe o mouse sobre os pontos para ver os valores.',
  },
  {
    target: '[data-tour="performance"]',
    title: 'Performance',
    description: 'Compare receita, despesas, clientes e vendas com o mês anterior em barras de progresso.',
  },
  {
    target: '[data-tour="meta"]',
    title: 'Meta do mês',
    description: 'Acompanhe o progresso da sua meta mensal e super cota. Clique em "Definir meta" para configurar.',
  },
  {
    target: '[data-tour="counters"]',
    title: 'Contadores',
    description: 'Totais de clientes, vendas e produtos. Clique em qualquer um para ir direto para aquela seção.',
  },
  {
    target: '[data-tour="quick-actions"]',
    title: 'Acesso rápido',
    description: 'Atalhos para as ações mais usadas: novo lançamento, tarefas, agenda e relatório financeiro.',
  },
  {
    target: '[data-tour="recent-txs"]',
    title: 'Últimas transações',
    description: 'As 7 transações mais recentes da empresa. Clique em "Ver todas" para o histórico completo.',
  },
]

// ─── Helpers de animação ──────────────────────────────────────────────────────
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: [0.25, 0.46, 0.45, 0.94] as const },
})

const scaleIn = (delay = 0) => ({
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.4, delay, ease: [0.25, 0.46, 0.45, 0.94] as const },
})

// ─── Contador animado ─────────────────────────────────────────────────────────
function AnimatedNumber({ value, format }: { value: number; format: (v: number) => string }) {
  const [display, setDisplay] = useState('0')
  const prevRef = useRef(0)
  useEffect(() => {
    const from = prevRef.current
    prevRef.current = value
    const controls = animate(from, value, {
      duration: 0.8, ease: 'easeOut',
      onUpdate: (v) => setDisplay(format(v)),
    })
    return controls.stop
  }, [value])
  return <span>{display}</span>
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton({ className = '', style = {} }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`rounded-xl animate-pulse ${className}`}
      style={{ background: 'linear-gradient(90deg, #1a1a2e 25%, #1e1e3a 50%, #1a1a2e 75%)', backgroundSize: '200% 100%', ...style }} />
  )
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-between">
        <div className="flex flex-col gap-2"><Skeleton className="h-8 w-36" /><Skeleton className="h-4 w-52" /></div>
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>
      <div className="grid grid-cols-3 gap-3">{[0,1,2].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Skeleton className="sm:col-span-2 h-52 rounded-2xl" />
        <Skeleton className="h-52 rounded-2xl" />
      </div>
      <Skeleton className="h-56 rounded-2xl" />
    </div>
  )
}

// ─── Tooltip do gráfico ───────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  return (
    <div className="rounded-xl px-3 py-2.5 text-xs"
      style={{ background: '#16162a', border: '1px solid #2a2a3e', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
      <p className="font-semibold mb-1.5" style={{ color: '#6b6b8a' }}>
        {new Date(label).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
      </p>
      {payload.map((p: any) => (
        <p key={p.name} className="flex items-center gap-1.5" style={{ color: p.color }}>
          <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: p.color }} />
          {p.name === 'income' ? 'Entrada' : 'Saída'}: {fmt(p.value)}
        </p>
      ))}
    </div>
  )
}

// ─── Página ───────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const supabase = createClient()
  const router   = useRouter()
  const [loading, setLoading]     = useState(true)
  const [business, setBusiness]   = useState<any>(null)
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [stats, setStats] = useState({
    income: 0, expense: 0, clients: 0, sales: 0, products: 0,
    pendingTasks: 0, todayEvents: 0, pendingTxs: 0,
    lastMonthIncome: 0, lastMonthExpense: 0,
  })
  const [recentTxs, setRecentTxs] = useState<any[]>([])
  const [chartData, setChartData] = useState<{ day: string; income: number; expense: number }[]>([])
  const { currentGoal } = useGoals(businessId)

  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    title: '', amount: '', type: 'expense',
    date: new Date().toISOString().split('T')[0], paid: true,
  })
  const [saving, setSaving] = useState(false)

  // ── Tour ──
  const tour = useTour('dashboard', TOUR_STEPS)

  async function load() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const savedBizId = typeof window !== 'undefined' ? localStorage.getItem('activeBizId') || '' : ''
      const { data: bizList } = await supabase.from('businesses').select('*').eq('owner_id', user.id)
      if (!bizList?.length) { setLoading(false); return }

      const biz = bizList.find(b => b.id === savedBizId) || bizList[0]
      setBusiness(biz)
      setBusinessId(biz.id)

      const now = new Date()
      const startOfMonth    = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]
      const endOfLastMonth  = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]
      const today           = now.toISOString().split('T')[0]
      const todayEnd        = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59).toISOString()

      const [
        { data: txs }, { data: lastTxs }, { data: clients },
        { data: sales }, { data: products }, { data: pendingTasks },
        { data: todayEvents }, { data: pendingTxs }, { data: recent },
      ] = await Promise.all([
        supabase.from('transactions').select('*').eq('business_id', biz.id).gte('date', startOfMonth),
        supabase.from('transactions').select('*').eq('business_id', biz.id).gte('date', startOfLastMonth).lte('date', endOfLastMonth),
        supabase.from('clients').select('id').eq('business_id', biz.id),
        supabase.from('sales').select('id').eq('business_id', biz.id).gte('date', startOfMonth),
        supabase.from('products').select('id').eq('business_id', biz.id),
        supabase.from('tasks').select('id').eq('business_id', biz.id).eq('status', 'todo').lt('due_date', today),
        supabase.from('events').select('id').eq('business_id', biz.id).gte('start_at', today).lte('start_at', todayEnd),
        supabase.from('transactions').select('id').eq('business_id', biz.id).eq('paid', false),
        supabase.from('transactions').select('*, categories(name, color)').eq('business_id', biz.id).order('date', { ascending: false }).limit(7),
      ])

      const income          = (txs || []).filter(t => t.type === 'income').reduce((a, t) => a + Number(t.amount), 0)
      const expense         = (txs || []).filter(t => t.type === 'expense').reduce((a, t) => a + Number(t.amount), 0)
      const lastMonthIncome  = (lastTxs || []).filter(t => t.type === 'income').reduce((a, t) => a + Number(t.amount), 0)
      const lastMonthExpense = (lastTxs || []).filter(t => t.type === 'expense').reduce((a, t) => a + Number(t.amount), 0)

      setStats({
        income, expense,
        clients: clients?.length || 0,
        sales: sales?.length || 0,
        products: products?.length || 0,
        pendingTasks: pendingTasks?.length || 0,
        todayEvents: todayEvents?.length || 0,
        pendingTxs: pendingTxs?.length || 0,
        lastMonthIncome,
        lastMonthExpense,
      })

      setRecentTxs(recent || [])

      const byDay: Record<string, { income: number; expense: number }> = {}
      for (let i = 13; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        byDay[d.toISOString().split('T')[0]] = { income: 0, expense: 0 }
      }
      ;(txs || []).forEach(t => {
        if (byDay[t.date]) byDay[t.date][t.type === 'income' ? 'income' : 'expense'] += Number(t.amount)
      })
      setChartData(Object.entries(byDay).map(([day, val]) => ({ day, ...val })))
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('transactions').insert({
      title: form.title, amount: parseFloat(form.amount),
      type: form.type, date: form.date, paid: form.paid,
      business_id: business.id, created_by: user?.id,
    })
    setShowModal(false)
    setSaving(false)
    setForm({ title: '', amount: '', type: 'expense', date: new Date().toISOString().split('T')[0], paid: true })
    load()
  }

  const fmt      = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const fmtShort = (v: number) => {
    if (v >= 1000000) return `R$ ${(v / 1000000).toFixed(1)}M`
    if (v >= 1000)    return `R$ ${(v / 1000).toFixed(1)}k`
    return fmt(v)
  }
  const month  = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const profit = stats.income - stats.expense

  function pct(current: number, last: number) {
    if (!last) return null
    const diff = ((current - last) / last) * 100
    return { value: Math.abs(diff).toFixed(1), up: diff >= 0 }
  }

  const incomeChange  = pct(stats.income, stats.lastMonthIncome)
  const expenseChange = pct(stats.expense, stats.lastMonthExpense)
  const hasAlerts     = stats.pendingTasks > 0 || stats.pendingTxs > 0 || stats.todayEvents > 0

  if (loading) return <DashboardSkeleton />

  return (
    <div className="flex flex-col gap-5">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <motion.div {...fadeUp(0)} className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Syne, sans-serif' }}>Dashboard</h1>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#34d399' }} />
            <p className="text-sm capitalize" style={{ color: '#4a4a6a' }}>{business?.name} · {month}</p>
          </div>
        </div>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold shrink-0"
          style={{ background: 'linear-gradient(135deg, #7c6ef7, #9d6ef7)', color: 'white', boxShadow: '0 0 24px rgba(124,110,247,0.35)' }}>
          <Plus size={15} />
          <span className="hidden sm:inline">Novo lançamento</span>
          <span className="sm:hidden">Novo</span>
        </motion.button>
      </motion.div>

      {/* ── Alertas ─────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {hasAlerts && (
          <motion.div {...fadeUp(0.05)} data-tour="alerts" className="flex flex-col sm:flex-row gap-2">
            {stats.pendingTasks > 0 && (
              <AlertBadge icon={CheckSquare} color="#f87171"
                label={`${stats.pendingTasks} tarefa${stats.pendingTasks > 1 ? 's' : ''} atrasada${stats.pendingTasks > 1 ? 's' : ''}`}
                onClick={() => router.push('/tarefas')} />
            )}
            {stats.pendingTxs > 0 && (
              <AlertBadge icon={Activity} color="#fbbf24"
                label={`${stats.pendingTxs} pagamento${stats.pendingTxs > 1 ? 's' : ''} pendente${stats.pendingTxs > 1 ? 's' : ''}`}
                onClick={() => router.push('/financeiro')} />
            )}
            {stats.todayEvents > 0 && (
              <AlertBadge icon={Calendar} color="#22d3ee"
                label={`${stats.todayEvents} evento${stats.todayEvents > 1 ? 's' : ''} hoje`}
                onClick={() => router.push('/agenda')} />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── KPI Cards ───────────────────────────────────────────────────────── */}
      <div data-tour="kpis" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Faturamento', value: stats.income, color: '#34d399', icon: TrendingUp, bg: 'rgba(52,211,153,0.08)', change: incomeChange, glow: 'rgba(52,211,153,0.15)' },
          { label: 'Despesas', value: stats.expense, color: '#f87171', icon: TrendingDown, bg: 'rgba(248,113,113,0.08)', change: expenseChange, glow: 'rgba(248,113,113,0.15)' },
          { label: 'Lucro Líquido', value: profit, color: profit >= 0 ? '#34d399' : '#f87171', icon: profit >= 0 ? TrendingUp : TrendingDown, bg: profit >= 0 ? 'rgba(52,211,153,0.08)' : 'rgba(248,113,113,0.08)', change: null, glow: profit >= 0 ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)' },
        ].map(({ label, value, color, icon: Icon, bg, change, glow }, i) => (
          <motion.div key={label} {...fadeUp(0.1 + i * 0.07)}
            className="rounded-2xl p-5 relative overflow-hidden"
            style={{ background: '#111118', border: '1px solid #1e1e2e' }}>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full blur-2xl pointer-events-none" style={{ background: glow }} />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#4a4a6a' }}>{label}</span>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                <Icon size={15} style={{ color }} />
              </div>
            </div>
            <p className="text-2xl font-bold" style={{ fontFamily: 'Syne, sans-serif', color }}>
              <AnimatedNumber value={value} format={fmtShort} />
            </p>
            {change ? (
              <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: change.up ? '#34d399' : '#f87171' }}>
                {change.up ? '↑' : '↓'} {change.value}% vs mês anterior
              </p>
            ) : (
              <p className="text-xs mt-1.5" style={{ color: '#3a3a5c' }}>
                {profit >= 0 ? `Margem: ${stats.income > 0 ? ((profit / stats.income) * 100).toFixed(1) : 0}%` : 'Mês no prejuízo'}
              </p>
            )}
          </motion.div>
        ))}
      </div>

      {/* ── Gráfico + Performance ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <motion.div {...scaleIn(0.22)} data-tour="chart"
          className="sm:col-span-2 rounded-2xl p-5"
          style={{ background: '#111118', border: '1px solid #1e1e2e' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>Fluxo de caixa</h2>
              <p className="text-xs mt-0.5" style={{ color: '#4a4a6a' }}>Últimos 14 dias</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5 text-xs" style={{ color: '#4a4a6a' }}>
                <div className="w-2 h-2 rounded-full" style={{ background: '#34d399' }} /> Entrada
              </div>
              <div className="flex items-center gap-1.5 text-xs" style={{ color: '#4a4a6a' }}>
                <div className="w-2 h-2 rounded-full" style={{ background: '#f87171' }} /> Saída
              </div>
            </div>
          </div>
          {chartData.every(d => d.income === 0 && d.expense === 0) ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2">
              <BarChart2 size={28} style={{ color: '#2a2a3e' }} />
              <p className="text-sm" style={{ color: '#3a3a5c' }}>Sem dados ainda</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f87171" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" vertical={false} />
                <XAxis dataKey="day" tickFormatter={d => new Date(d).getDate().toString()}
                  tick={{ fontSize: 10, fill: '#3a3a5c' }} axisLine={false} tickLine={false} interval={2} />
                <YAxis tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
                  tick={{ fontSize: 10, fill: '#3a3a5c' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#2a2a3e', strokeWidth: 1 }} />
                <Area type="monotone" dataKey="income" stroke="#34d399" strokeWidth={2}
                  fill="url(#incomeGrad)" dot={false} activeDot={{ r: 4, fill: '#34d399', strokeWidth: 0 }} />
                <Area type="monotone" dataKey="expense" stroke="#f87171" strokeWidth={2}
                  fill="url(#expenseGrad)" dot={false} activeDot={{ r: 4, fill: '#f87171', strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        <motion.div {...scaleIn(0.28)} data-tour="performance"
          className="rounded-2xl p-5 flex flex-col gap-3"
          style={{ background: '#111118', border: '1px solid #1e1e2e' }}>
          <div>
            <h2 className="font-bold text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>Performance</h2>
            <p className="text-xs mt-0.5" style={{ color: '#4a4a6a' }}>vs mês anterior</p>
          </div>
          {[
            { label: 'Receita',  value: stats.income,  max: Math.max(stats.income, stats.lastMonthIncome, 1),   color: '#34d399' },
            { label: 'Despesas', value: stats.expense, max: Math.max(stats.expense, stats.lastMonthExpense, 1), color: '#f87171' },
            { label: 'Clientes', value: stats.clients, max: Math.max(stats.clients, 10), color: '#fbbf24' },
            { label: 'Vendas',   value: stats.sales,   max: Math.max(stats.sales, 10),   color: '#22d3ee' },
          ].map(({ label, value, max, color }) => (
            <div key={label}>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span style={{ color: '#6b6b8a' }}>{label}</span>
                <span className="font-semibold" style={{ color: '#d0d0e0' }}>
                  {value > 100 ? fmtShort(value) : value}
                </span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#1e1e2e' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((value / max) * 100, 100)}%` }}
                  transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
                  className="h-full rounded-full" style={{ background: color }} />
              </div>
            </div>
          ))}
          <div className="mt-auto pt-3 border-t" style={{ borderColor: '#1a1a2a' }}>
            <div className="flex items-center gap-2">
              <Target size={13} style={{ color: profit >= 0 ? '#34d399' : '#f87171' }} />
              <span className="text-xs font-medium" style={{ color: '#6b6b8a' }}>
                {profit >= 0
                  ? `Margem líquida: ${stats.income > 0 ? ((profit / stats.income) * 100).toFixed(1) : 0}%`
                  : 'Mês no prejuízo'}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Meta + Contadores + Ações ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div data-tour="meta">
          <GoalCard goal={currentGoal} onSetGoal={() => router.push('/metas')} />
        </div>

        <motion.div {...fadeUp(0.32)} data-tour="counters"
          className="sm:col-span-2 grid grid-cols-3 gap-3 content-start">
          {[
            { label: 'Clientes', value: stats.clients, icon: Users,        color: '#fbbf24', href: '/clientes' },
            { label: 'Vendas',   value: stats.sales,   icon: ShoppingCart,  color: '#22d3ee', href: '/vendas' },
            { label: 'Produtos', value: stats.products, icon: Package,      color: '#a78bfa', href: '/produtos' },
          ].map(({ label, value, icon: Icon, color, href }, i) => (
            <motion.button key={label} whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}
              onClick={() => router.push(href)}
              className="rounded-2xl p-4 text-center relative overflow-hidden"
              style={{ background: '#111118', border: '1px solid #1e1e2e' }}>
              <div className="absolute inset-x-0 bottom-0 h-1 rounded-b-2xl"
                style={{ background: `linear-gradient(90deg, transparent, ${color}40, transparent)` }} />
              <div className="w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-2" style={{ background: `${color}15` }}>
                <Icon size={15} style={{ color }} />
              </div>
              <p className="text-2xl font-bold" style={{ fontFamily: 'Syne, sans-serif', color }}>
                <AnimatedNumber value={value} format={v => Math.round(v).toString()} />
              </p>
              <p className="text-xs mt-1" style={{ color: '#4a4a6a' }}>{label}</p>
            </motion.button>
          ))}
        </motion.div>

        <motion.div {...fadeUp(0.36)} data-tour="quick-actions"
          className="sm:col-span-3 rounded-2xl p-4 flex flex-col gap-2"
          style={{ background: '#111118', border: '1px solid #1e1e2e' }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#4a4a6a' }}>Acesso rápido</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: 'Novo lançamento',    icon: DollarSign,   color: '#7c6ef7', action: () => setShowModal(true) },
              { label: 'Ver tarefas',        icon: ClipboardList, color: '#f87171', action: () => router.push('/tarefas'),  badge: stats.pendingTasks > 0 ? stats.pendingTasks : null },
              { label: 'Agenda de hoje',     icon: CalendarDays,  color: '#22d3ee', action: () => router.push('/agenda'),   badge: stats.todayEvents > 0 ? stats.todayEvents : null },
              { label: 'Relatório financeiro', icon: BarChart2,   color: '#34d399', action: () => router.push('/financeiro') },
            ].map(({ label, icon: Icon, color, action, badge }) => (
              <motion.button key={label} whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
                onClick={action}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-left w-full transition-colors"
                style={{ color: '#8a8aaa', background: '#0d0d14', border: '1px solid #1a1a2e' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#2a2a3e'; e.currentTarget.style.color = '#d0d0e0' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#1a1a2e'; e.currentTarget.style.color = '#8a8aaa' }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}15` }}>
                  <Icon size={13} style={{ color }} />
                </div>
                <span className="text-sm font-medium flex-1 truncate">{label}</span>
                {badge && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                    style={{ background: 'rgba(248,113,113,0.15)', color: '#f87171' }}>{badge}</span>
                )}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Últimas transações ────────────────────────────────────────────── */}
      <motion.div {...fadeUp(0.42)} data-tour="recent-txs"
        className="rounded-2xl overflow-hidden"
        style={{ background: '#111118', border: '1px solid #1e1e2e' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#1a1a2a' }}>
          <div>
            <h2 className="font-bold text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>Últimas transações</h2>
            <p className="text-xs mt-0.5" style={{ color: '#4a4a6a' }}>{recentTxs.length} mais recentes</p>
          </div>
          <motion.button whileHover={{ x: 2 }} onClick={() => router.push('/financeiro')}
            className="flex items-center gap-1 text-xs font-medium" style={{ color: '#7c6ef7' }}>
            Ver todas <ArrowRight size={12} />
          </motion.button>
        </div>

        {recentTxs.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <DollarSign size={28} className="mx-auto mb-3" style={{ color: '#2a2a3e' }} />
            <p className="text-sm mb-3" style={{ color: '#4a4a6a' }}>Nenhuma transação ainda</p>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => setShowModal(true)}
              className="text-xs font-semibold px-4 py-2.5 rounded-xl"
              style={{ background: 'rgba(124,110,247,0.1)', color: '#9d8fff', border: '1px solid rgba(124,110,247,0.2)' }}>
              + Adicionar primeira transação
            </motion.button>
          </div>
        ) : recentTxs.map((tx, i) => (
          <motion.div key={tx.id}
            initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.5 + i * 0.04 }}
            className="flex items-center gap-3 px-5 py-3.5 transition-colors cursor-default"
            style={{ borderBottom: i < recentTxs.length - 1 ? '1px solid #1a1a2a' : 'none' }}
            onMouseEnter={e => e.currentTarget.style.background = '#0d0d14'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: tx.type === 'income' ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)' }}>
              {tx.type === 'income'
                ? <TrendingUp size={14} style={{ color: '#34d399' }} />
                : <TrendingDown size={14} style={{ color: '#f87171' }} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: '#d0d0e0' }}>{tx.title}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs" style={{ color: '#4a4a6a' }}>
                  {new Date(tx.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                </span>
                {tx.categories?.name && (
                  <span className="text-xs px-1.5 py-0.5 rounded-md"
                    style={{ background: tx.categories.color ? `${tx.categories.color}18` : '#1e1e2e', color: tx.categories.color || '#6b6b8a' }}>
                    {tx.categories.name}
                  </span>
                )}
                {!tx.paid && (
                  <span className="text-xs px-1.5 py-0.5 rounded-md"
                    style={{ background: 'rgba(251,191,36,0.1)', color: '#fbbf24' }}>Pendente</span>
                )}
              </div>
            </div>
            <span className="text-sm font-bold shrink-0" style={{ color: tx.type === 'income' ? '#34d399' : '#f87171' }}>
              {tx.type === 'income' ? '+' : '-'}{fmt(Number(tx.amount))}
            </span>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Modal novo lançamento ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}
            onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
            <motion.div
              initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              transition={{ duration: 0.32, ease: [0.25, 0.46, 0.45, 0.94] as const }}
              className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl border p-6"
              style={{ background: '#111118', borderColor: '#1e1e2e' }}>
              <div className="w-10 h-1 rounded-full mx-auto mb-5 sm:hidden" style={{ background: '#2a2a3e' }} />
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-lg" style={{ fontFamily: 'Syne, sans-serif' }}>Novo lançamento</h2>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowModal(false)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: '#1a1a2e', color: '#6b6b8a' }}>✕</motion.button>
              </div>
              <form onSubmit={handleSave} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-2">
                  {['expense', 'income'].map(t => (
                    <button key={t} type="button" onClick={() => setForm({ ...form, type: t })}
                      className="py-2.5 rounded-xl text-sm font-semibold transition-all"
                      style={{
                        background: form.type === t ? (t === 'income' ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)') : '#0d0d14',
                        color: form.type === t ? (t === 'income' ? '#34d399' : '#f87171') : '#4a4a6a',
                        border: `1px solid ${form.type === t ? (t === 'income' ? '#34d399' : '#f87171') : '#1e1e2e'}`,
                      }}>
                      {t === 'income' ? '↑ Entrada' : '↓ Saída'}
                    </button>
                  ))}
                </div>
                <input type="text" placeholder="Título *" value={form.title} required
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="px-3 py-3 rounded-xl border text-sm outline-none"
                  style={{ background: '#0d0d14', borderColor: '#1e1e2e', color: '#e8e8f0' }}
                  onFocus={e => e.currentTarget.style.borderColor = '#7c6ef7'}
                  onBlur={e => e.currentTarget.style.borderColor = '#1e1e2e'} />
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" step="0.01" placeholder="Valor *" value={form.amount} required
                    onChange={e => setForm({ ...form, amount: e.target.value })}
                    className="px-3 py-3 rounded-xl border text-sm outline-none"
                    style={{ background: '#0d0d14', borderColor: '#1e1e2e', color: '#e8e8f0' }}
                    onFocus={e => e.currentTarget.style.borderColor = '#7c6ef7'}
                    onBlur={e => e.currentTarget.style.borderColor = '#1e1e2e'} />
                  <input type="date" value={form.date} required
                    onChange={e => setForm({ ...form, date: e.target.value })}
                    className="px-3 py-3 rounded-xl border text-sm outline-none"
                    style={{ background: '#0d0d14', borderColor: '#1e1e2e', color: '#e8e8f0' }}
                    onFocus={e => e.currentTarget.style.borderColor = '#7c6ef7'}
                    onBlur={e => e.currentTarget.style.borderColor = '#1e1e2e'} />
                </div>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={form.paid} onChange={e => setForm({ ...form, paid: e.target.checked })} />
                  <span className="text-sm" style={{ color: '#6b6b8a' }}>Já foi pago/recebido</span>
                </label>
                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                  type="submit" disabled={saving}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm"
                  style={{ background: 'linear-gradient(135deg, #7c6ef7, #9d6ef7)', color: 'white', boxShadow: '0 0 20px rgba(124,110,247,0.3)' }}>
                  {saving
                    ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    : 'Salvar lançamento'}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Tour ─────────────────────────────────────────────────────────── */}
      <TourTooltip
        active={tour.active}
        step={tour.step}
        current={tour.current}
        total={tour.total}
        onNext={tour.next}
        onPrev={tour.prev}
        onFinish={tour.finish}
      />
      <TourButton onRestart={tour.restart} label="Tour" />

    </div>
  )
}

function AlertBadge({ icon: Icon, color, label, onClick }: { icon: any; color: string; label: string; onClick: () => void }) {
  return (
    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 rounded-xl flex-1 text-left"
      style={{ background: `${color}08`, border: `1px solid ${color}25` }}>
      <Icon size={14} style={{ color, flexShrink: 0 }} />
      <span className="text-xs font-medium flex-1" style={{ color }}>{label}</span>
      <ArrowRight size={11} style={{ color }} />
    </motion.button>
  )
}
