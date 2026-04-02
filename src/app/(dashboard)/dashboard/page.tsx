'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import {
  TrendingUp, TrendingDown, Users, ShoppingCart, Package,
  Plus, ArrowRight, CheckSquare, Calendar, Target, Activity,
  BarChart2, DollarSign, ClipboardList, CalendarDays, Sparkles,
} from 'lucide-react'
import { useGoals } from '@/hooks/useGoals'
import { GoalCard } from '@/components/GoalCard'
import { useRouter } from 'next/navigation'
import { useBusinessContext } from '@/lib/business-context'
import { motion, AnimatePresence, animate } from 'framer-motion'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { useTour } from '@/hooks/useTour'
import { TourTooltip } from '@/components/TourTooltip'
import { InstallButton } from '@/components/InstallButton'

// ── Design System ────────────────────────────────────────────────────────────
import { T, card, inp, SYNE, btnPrimary } from '@/lib/design'
import { fadeUp, scaleIn } from '@/lib/animations'
import { SpotlightCard, Skeleton, GlowCorner } from '@/components/ui/bossflow-ui'
import { PageBackground, KPICard, SectionHeader, FormModal, ModalSubmitButton } from '@/components/core'

// ─── Tour steps ───────────────────────────────────────────────
const TOUR_STEPS = [
  { target: '[data-tour="kpis"]',         title: 'Resumo financeiro',    description: 'Faturamento, despesas e lucro líquido do mês. Atualizam em tempo real.' },
  { target: '[data-tour="alerts"]',        title: 'Alertas inteligentes', description: 'Avisos de tarefas atrasadas, pagamentos pendentes e eventos do dia.' },
  { target: '[data-tour="chart"]',         title: 'Fluxo de caixa',       description: 'Gráfico dos últimos 14 dias com entradas e saídas.' },
  { target: '[data-tour="performance"]',   title: 'Performance',          description: 'Compare receita, despesas, clientes e vendas com o mês anterior.' },
  { target: '[data-tour="meta"]',          title: 'Meta do mês',          description: 'Acompanhe o progresso da sua meta mensal.' },
  { target: '[data-tour="counters"]',      title: 'Contadores',           description: 'Totais de clientes, vendas e produtos.' },
  { target: '[data-tour="quick-actions"]', title: 'Acesso rápido',        description: 'Atalhos para as ações mais usadas.' },
  { target: '[data-tour="recent-txs"]',    title: 'Últimas transações',   description: 'As 7 transações mais recentes.' },
]

// ─── Número animado ───────────────────────────────────────────
function AnimatedNumber({ value, format }: { value: number; format: (v: number) => string }) {
  const [display, setDisplay] = useState(format(0))
  const prevRef = useRef(0)
  useEffect(() => {
    const from = prevRef.current; prevRef.current = value
    const ctrl = animate(from, value, { duration: 0.9, ease: 'easeOut', onUpdate: v => setDisplay(format(v)) })
    return ctrl.stop
  }, [value])
  return <span>{display}</span>
}

// ─── Tooltip do gráfico ───────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  return (
    <div style={{ background: 'rgba(6,6,10,0.97)', border: '1px solid rgba(124,110,247,0.25)', borderRadius: 12, padding: '10px 14px', fontSize: 12, boxShadow: '0 12px 40px rgba(0,0,0,0.75)', backdropFilter: 'blur(20px)' }}>
      <p style={{ color: T.muted, fontWeight: 600, marginBottom: 8, fontFamily: SYNE, fontSize: 11 }}>
        {new Date(label).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
      </p>
      {payload.map((p: any) => (
        <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: p.color, display: 'inline-block', boxShadow: `0 0 6px ${p.color}`, flexShrink: 0 }} />
          <span style={{ color: T.muted }}>{p.name === 'income' ? 'Entrada' : 'Saída'}:</span>
          <span style={{ color: p.color, fontWeight: 600, fontFamily: SYNE }}>{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Skeleton ────────────────────────────────────────────────
function DashSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-2"><Skeleton className="h-8 w-36 rounded-xl" /><Skeleton className="h-4 w-48 rounded-lg" /></div>
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>
      <div className="grid grid-cols-3 gap-3">{[0,1,2].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
      <div className="grid grid-cols-3 gap-3"><Skeleton className="col-span-2 h-52 rounded-2xl" /><Skeleton className="h-52 rounded-2xl" /></div>
      <Skeleton className="h-56 rounded-2xl" />
    </div>
  )
}

// ─── Página Principal ─────────────────────────────────────────
export default function DashboardPage() {
  const supabase = createClient()
  const router   = useRouter()
  const { business, businessId, loading: bizLoading } = useBusinessContext()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    income: 0, expense: 0, clients: 0, sales: 0, products: 0,
    pendingTasks: 0, todayEvents: 0, pendingTxs: 0,
    lastMonthIncome: 0, lastMonthExpense: 0,
  })
  const [recentTxs, setRecentTxs] = useState<any[]>([])
  const [chartData, setChartData]  = useState<{ day: string; income: number; expense: number }[]>([])
  const { currentGoal } = useGoals(businessId)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ title: '', amount: '', type: 'expense', date: new Date().toISOString().split('T')[0], paid: true })
  const [saving, setSaving] = useState(false)
  const tour = useTour('dashboard', TOUR_STEPS)

  async function load(bizId: string) {
    try {
      const now              = new Date()
      const startOfMonth     = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]
      const endOfLastMonth   = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]
      const today            = now.toISOString().split('T')[0]
      const todayEnd         = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59).toISOString()

      const [
        { data: txs }, { data: lastTxs }, { data: clients }, { data: sales },
        { data: products }, { data: pendingTasks }, { data: todayEvents },
        { data: pendingTxs }, { data: recent },
      ] = await Promise.all([
        supabase.from('transactions').select('*').eq('business_id', bizId).gte('date', startOfMonth),
        supabase.from('transactions').select('*').eq('business_id', bizId).gte('date', startOfLastMonth).lte('date', endOfLastMonth),
        supabase.from('clients').select('id').eq('business_id', bizId),
        supabase.from('sales').select('id').eq('business_id', bizId).gte('date', startOfMonth),
        supabase.from('products').select('id').eq('business_id', bizId),
        supabase.from('tasks').select('id').eq('business_id', bizId).eq('status', 'todo').lt('due_date', today),
        supabase.from('events').select('id').eq('business_id', bizId).gte('start_at', today).lte('start_at', todayEnd),
        supabase.from('transactions').select('id').eq('business_id', bizId).eq('paid', false),
        supabase.from('transactions').select('*, categories(name, color)').eq('business_id', bizId).order('date', { ascending: false }).limit(7),
      ])

      const income           = (txs || []).filter(t => t.type === 'income').reduce((a, t) => a + Number(t.amount), 0)
      const expense          = (txs || []).filter(t => t.type === 'expense').reduce((a, t) => a + Number(t.amount), 0)
      const lastMonthIncome  = (lastTxs || []).filter(t => t.type === 'income').reduce((a, t) => a + Number(t.amount), 0)
      const lastMonthExpense = (lastTxs || []).filter(t => t.type === 'expense').reduce((a, t) => a + Number(t.amount), 0)
      setStats({ income, expense, clients: clients?.length || 0, sales: sales?.length || 0, products: products?.length || 0, pendingTasks: pendingTasks?.length || 0, todayEvents: todayEvents?.length || 0, pendingTxs: pendingTxs?.length || 0, lastMonthIncome, lastMonthExpense })
      setRecentTxs(recent || [])

      const byDay: Record<string, { income: number; expense: number }> = {}
      for (let i = 13; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); byDay[d.toISOString().split('T')[0]] = { income: 0, expense: 0 } }
      ;(txs || []).forEach(t => { if (byDay[t.date]) byDay[t.date][t.type === 'income' ? 'income' : 'expense'] += Number(t.amount) })
      setChartData(Object.entries(byDay).map(([day, val]) => ({ day, ...val })))
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { if (businessId) load(businessId) }, [businessId])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('transactions').insert({ title: form.title, amount: parseFloat(form.amount), type: form.type, date: form.date, paid: form.paid, business_id: business?.id ?? businessId, created_by: user?.id })
    setShowModal(false); setSaving(false)
    setForm({ title: '', amount: '', type: 'expense', date: new Date().toISOString().split('T')[0], paid: true })
    if (businessId) load(businessId)
  }

  const fmt      = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const fmtShort = (v: number) => { if (v >= 1e6) return `R$ ${(v/1e6).toFixed(1)}M`; if (v >= 1e3) return `R$ ${(v/1e3).toFixed(1)}k`; return fmt(v) }
  const month    = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const profit   = stats.income - stats.expense
  const hasAlerts = stats.pendingTasks > 0 || stats.pendingTxs > 0 || stats.todayEvents > 0

  function pct(current: number, last: number) {
    if (!last) return null
    const diff = ((current - last) / last) * 100
    return { value: Math.abs(diff).toFixed(1), up: diff >= 0 }
  }
  const incomeChange  = pct(stats.income,  stats.lastMonthIncome)
  const expenseChange = pct(stats.expense, stats.lastMonthExpense)

  if (loading || bizLoading) return (
    <PageBackground><DashSkeleton /></PageBackground>
  )

  return (
    <PageBackground>
      <div className="flex flex-col gap-5">

          {/* ── Header ─────────────────────────────────────────── */}
          <SectionHeader
            title="Dashboard"
            subtitle={`${business?.name} · ${month}`}
            live
            cta={{ label: 'Novo lançamento', icon: Plus, onClick: () => setShowModal(true) }}
          />

          {/* ── Alertas ────────────────────────────────────────── */}
          <motion.div {...fadeUp(0.05)} data-tour="alerts" className="flex flex-col sm:flex-row gap-2">
            <AnimatePresence>
              {stats.pendingTasks > 0 && <AlertBadge icon={CheckSquare} color={T.red}   label={`${stats.pendingTasks} tarefa${stats.pendingTasks > 1 ? 's' : ''} atrasada${stats.pendingTasks > 1 ? 's' : ''}`} onClick={() => router.push('/tarefas')} />}
              {stats.pendingTxs  > 0 && <AlertBadge icon={Activity}    color={T.amber} label={`${stats.pendingTxs} pagamento${stats.pendingTxs > 1 ? 's' : ''} pendente${stats.pendingTxs > 1 ? 's' : ''}`} onClick={() => router.push('/financeiro')} />}
              {stats.todayEvents > 0 && <AlertBadge icon={Calendar}    color={T.cyan}  label={`${stats.todayEvents} evento${stats.todayEvents > 1 ? 's' : ''} hoje`} onClick={() => router.push('/agenda')} />}
              {!hasAlerts && (
                <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl text-xs"
                  style={{ background: `${T.green}06`, border: `1px solid ${T.green}18`, color: T.muted }}>
                  <span style={{ color: T.green }}>✅</span> Tudo em dia — sem alertas no momento
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* ── KPI Cards ──────────────────────────────────────── */}
          <div data-tour="kpis" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <motion.div {...fadeUp(0.10)}>
              <KPICard
                label="Faturamento" value={stats.income} color={T.green}
                icon={TrendingUp} format={fmtShort}
                change={incomeChange ? { value: incomeChange.value, up: incomeChange.up } : undefined}
              />
            </motion.div>
            <motion.div {...fadeUp(0.17)}>
              <KPICard
                label="Despesas" value={stats.expense} color={T.red}
                icon={TrendingDown} format={fmtShort}
                change={expenseChange ? { value: expenseChange.value, up: expenseChange.up } : undefined}
                invertBadge
              />
            </motion.div>
            <motion.div {...fadeUp(0.24)}>
              <KPICard
                label="Lucro Líquido" value={profit}
                color={profit >= 0 ? T.green : T.red}
                icon={profit >= 0 ? TrendingUp : TrendingDown}
                format={fmtShort}
                sub={profit >= 0
                  ? `Margem: ${stats.income > 0 ? ((profit / stats.income) * 100).toFixed(1) : 0}%`
                  : 'Mês no prejuízo'}
              />
            </motion.div>
          </div>

          {/* ── Gráfico + Performance ───────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <motion.div {...scaleIn(0.22)} data-tour="chart" className="sm:col-span-2">
              <SpotlightCard className="rounded-2xl h-full" style={card}>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="font-bold text-sm" style={{ fontFamily: SYNE, color: T.text }}>Fluxo de caixa</h2>
                      <p className="text-xs mt-0.5" style={{ color: T.muted }}>Últimos 14 dias</p>
                    </div>
                    <div className="flex gap-4">
                      {[{ color: T.green, label: 'Entrada' }, { color: T.red, label: 'Saída' }].map(l => (
                        <div key={l.label} className="flex items-center gap-1.5 text-xs" style={{ color: T.muted }}>
                          <div className="w-2 h-2 rounded-full" style={{ background: l.color, boxShadow: `0 0 5px ${l.color}` }} />
                          {l.label}
                        </div>
                      ))}
                    </div>
                  </div>
                  {chartData.every(d => d.income === 0 && d.expense === 0) ? (
                    <div className="flex flex-col items-center justify-center h-40 gap-2">
                      <BarChart2 size={28} style={{ color: T.muted }} />
                      <p className="text-sm" style={{ color: T.muted }}>Sem dados ainda</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={160}>
                      <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                        <defs>
                          <linearGradient id="incG" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor={T.green} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={T.green} stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="expG" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor={T.red} stopOpacity={0.24} />
                            <stop offset="95%" stopColor={T.red} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                        <XAxis dataKey="day" tickFormatter={d => new Date(d).getDate().toString()} tick={{ fontSize: 10, fill: T.muted }} axisLine={false} tickLine={false} interval={2} />
                        <YAxis tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} tick={{ fontSize: 10, fill: T.muted }} axisLine={false} tickLine={false} />
                        <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(124,110,247,0.18)', strokeWidth: 1 }} />
                        <Area type="monotone" dataKey="income"  stroke={T.green} strokeWidth={2} fill="url(#incG)" dot={false} activeDot={{ r: 4, fill: T.green, strokeWidth: 0, filter: `drop-shadow(0 0 5px ${T.green})` }} />
                        <Area type="monotone" dataKey="expense" stroke={T.red}   strokeWidth={2} fill="url(#expG)" dot={false} activeDot={{ r: 4, fill: T.red,   strokeWidth: 0, filter: `drop-shadow(0 0 5px ${T.red})` }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </SpotlightCard>
            </motion.div>

            <motion.div {...scaleIn(0.28)} data-tour="performance">
              <SpotlightCard className="rounded-2xl h-full" style={card}>
                <div className="p-5 flex flex-col gap-4 h-full">
                  <div>
                    <h2 className="font-bold text-sm" style={{ fontFamily: SYNE, color: T.text }}>Performance</h2>
                    <p className="text-xs mt-0.5" style={{ color: T.muted }}>vs mês anterior</p>
                  </div>
                  {[
                    { label: 'Receita',  value: stats.income,  max: Math.max(stats.income, stats.lastMonthIncome, 1),   color: T.green },
                    { label: 'Despesas', value: stats.expense, max: Math.max(stats.expense, stats.lastMonthExpense, 1), color: T.red   },
                    { label: 'Clientes', value: stats.clients, max: Math.max(stats.clients, 10),                        color: T.amber },
                    { label: 'Vendas',   value: stats.sales,   max: Math.max(stats.sales, 10),                          color: T.cyan  },
                  ].map(({ label, value, max, color }, idx) => (
                    <div key={label}>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span style={{ color: T.sub }}>{label}</span>
                        <span className="font-semibold tabular-nums" style={{ color: T.text, fontFamily: SYNE }}>{value > 100 ? fmtShort(value) : value}</span>
                      </div>
                      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min((value / max) * 100, 100)}%` }}
                          transition={{ duration: 1.1, delay: 0.38 + idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
                          className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${color}aa, ${color})`, boxShadow: `0 0 10px ${color}60` }} />
                      </div>
                    </div>
                  ))}
                  <div className="mt-auto pt-3 border-t" style={{ borderColor: T.border }}>
                    <div className="flex items-center gap-2">
                      <Target size={13} style={{ color: profit >= 0 ? T.green : T.red }} />
                      <span className="text-xs" style={{ color: T.muted }}>
                        {profit >= 0 ? `Margem líquida: ${stats.income > 0 ? ((profit / stats.income) * 100).toFixed(1) : 0}%` : 'Mês no prejuízo'}
                      </span>
                    </div>
                  </div>
                </div>
              </SpotlightCard>
            </motion.div>
          </div>

          {/* ── Meta + Contadores ───────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" data-tour="counters">
            <div data-tour="meta">
              <GoalCard goal={currentGoal} onSetGoal={() => router.push('/metas')} currentRevenue={stats.income} />
            </div>
            <div className="sm:col-span-2 grid grid-cols-3 gap-3">
              {([
                { label: 'Clientes', sub: 'ativos',      value: stats.clients,  icon: Users,        color: T.amber,  href: '/clientes' },
                { label: 'Vendas',   sub: 'este mês',    value: stats.sales,    icon: ShoppingCart, color: T.cyan,   href: '/vendas'   },
                { label: 'Produtos', sub: 'cadastrados', value: stats.products, icon: Package,      color: T.violet, href: '/produtos' },
              ] as const).map(({ label, sub, value, icon: Icon, color, href }, i) => (
                <motion.div key={label} {...fadeUp(0.3 + i * 0.06)} className="h-full">
                  <SpotlightCard className="rounded-2xl h-full cursor-pointer" spotlightColor={`${color}14`} style={card}>
                    <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} onClick={() => router.push(href)}
                      className="w-full p-4 flex flex-col gap-3 relative overflow-hidden h-full"
                      style={{ cursor: 'pointer', background: 'none', border: 'none', textAlign: 'left' }}>
                      <GlowCorner color={`${color}20`} position="bottom-right" />
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${color}10`, border: `1px solid ${color}22`, boxShadow: `0 0 14px ${color}16` }}>
                        <Icon size={14} style={{ color }} strokeWidth={1.8} />
                      </div>
                      <div className="flex-1">
                        <p className="text-3xl font-bold tabular-nums leading-none" style={{ fontFamily: SYNE, color: T.text, letterSpacing: '-0.02em', position: 'relative', zIndex: 1 }}>
                          <AnimatedNumber value={value} format={v => Math.round(v).toString()} />
                        </p>
                        <p className="text-xs mt-1.5" style={{ color: T.muted }}>
                          <span style={{ color: T.sub, fontWeight: 600 }}>{label}</span>{' '}<span>{sub}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-xs pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                        <ArrowRight size={11} style={{ color }} />
                        <span style={{ color, fontWeight: 500 }}>Ver todos</span>
                      </div>
                    </motion.button>
                  </SpotlightCard>
                </motion.div>
              ))}
            </div>
          </div>

          {/* ── Quick Actions ───────────────────────────────────── */}
          <motion.div {...fadeUp(0.36)} data-tour="quick-actions">
            <SpotlightCard className="rounded-2xl" style={card}>
              <div className="p-4">
                <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: T.muted, letterSpacing: '0.1em', fontFamily: SYNE }}>Acesso rápido</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: 'Novo lançamento',     icon: DollarSign,    color: T.purple, action: () => setShowModal(true) },
                    { label: 'Ver tarefas',          icon: ClipboardList, color: T.red,    action: () => router.push('/tarefas'),    badge: stats.pendingTasks > 0 ? stats.pendingTasks : null },
                    { label: 'Agenda de hoje',       icon: CalendarDays,  color: T.cyan,   action: () => router.push('/agenda'),     badge: stats.todayEvents > 0 ? stats.todayEvents : null },
                    { label: 'Relatório financeiro', icon: BarChart2,     color: T.green,  action: () => router.push('/financeiro') },
                  ].map(({ label, icon: Icon, color, action, badge }) => (
                    <motion.button key={label} whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }} onClick={action}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-left w-full"
                      style={{ color: T.sub, background: 'rgba(255,255,255,0.02)', border: `1px solid ${T.border}`, transition: 'all 0.15s', cursor: 'pointer' }}
                      onMouseEnter={e => { e.currentTarget.style.background = `${color}0b`; e.currentTarget.style.borderColor = `${color}28`; e.currentTarget.style.boxShadow = `0 0 14px ${color}10` }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = 'none' }}>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}12`, border: `1px solid ${color}22` }}>
                        <Icon size={13} style={{ color }} strokeWidth={1.8} />
                      </div>
                      <span className="text-sm font-medium flex-1 truncate" style={{ color: T.sub }}>{label}</span>
                      {badge && <span className="text-xs px-1.5 py-0.5 rounded-full font-bold" style={{ background: `${T.red}15`, color: T.red, border: `1px solid ${T.red}28` }}>{badge}</span>}
                    </motion.button>
                  ))}
                </div>
              </div>
            </SpotlightCard>
          </motion.div>

          {/* ── Últimas transações ──────────────────────────────── */}
          <motion.div {...fadeUp(0.42)} data-tour="recent-txs">
            <SpotlightCard className="rounded-2xl overflow-hidden" style={card}>
              <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: T.border }}>
                <div>
                  <h2 className="font-bold text-sm" style={{ fontFamily: SYNE, color: T.text }}>Últimas transações</h2>
                  <p className="text-xs mt-0.5" style={{ color: T.muted }}>{recentTxs.length} mais recentes</p>
                </div>
                <motion.button whileHover={{ x: 2 }} onClick={() => router.push('/financeiro')}
                  className="flex items-center gap-1 text-xs font-semibold"
                  style={{ color: T.violet, cursor: 'pointer', background: 'none', border: 'none' }}>
                  Ver todas <ArrowRight size={12} />
                </motion.button>
              </div>
              {recentTxs.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <DollarSign size={28} className="mx-auto mb-3" style={{ color: T.muted }} />
                  <p className="text-sm mb-3" style={{ color: T.muted }}>Nenhuma transação ainda</p>
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setShowModal(true)}
                    className="text-xs font-semibold px-4 py-2.5 rounded-xl"
                    style={{ background: `${T.purple}12`, color: T.violet, border: `1px solid ${T.purple}28`, cursor: 'pointer' }}>
                    + Adicionar primeira transação
                  </motion.button>
                </div>
              ) : recentTxs.map((tx, i) => (
                <motion.div key={tx.id}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.48 + i * 0.04 }}
                  className="flex items-center gap-3 px-5 py-3.5"
                  style={{ borderBottom: i < recentTxs.length - 1 ? `1px solid rgba(255,255,255,0.04)` : 'none', transition: 'background 0.12s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.022)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: tx.type === 'income' ? `${T.green}10` : `${T.red}10`, border: `1px solid ${tx.type === 'income' ? T.green : T.red}20`, boxShadow: `0 0 10px ${tx.type === 'income' ? T.green : T.red}12` }}>
                    {tx.type === 'income' ? <TrendingUp size={14} style={{ color: T.green }} strokeWidth={2} /> : <TrendingDown size={14} style={{ color: T.red }} strokeWidth={2} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: T.text }}>{tx.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs" style={{ color: T.muted }}>
                        {new Date(tx.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                      </span>
                      {tx.categories?.name && (
                        <span className="text-xs px-1.5 py-0.5 rounded-md"
                          style={{ background: `${tx.categories.color || T.sub}14`, color: tx.categories.color || T.sub, border: `1px solid ${tx.categories.color || T.sub}22` }}>
                          {tx.categories.name}
                        </span>
                      )}
                      {!tx.paid && <span className="text-xs px-1.5 py-0.5 rounded-md" style={{ background: `${T.amber}10`, color: T.amber, border: `1px solid ${T.amber}22` }}>Pendente</span>}
                    </div>
                  </div>
                  <span className="text-sm font-bold shrink-0 tabular-nums" style={{ fontFamily: SYNE, color: tx.type === 'income' ? T.green : T.red, textShadow: tx.type === 'income' ? `0 0 14px ${T.green}40` : `0 0 14px ${T.red}40` }}>
                    {tx.type === 'income' ? '+' : '−'}{fmt(Number(tx.amount))}
                  </span>
                </motion.div>
              ))}
            </SpotlightCard>
          </motion.div>


          {/* ── Estagiária Bia ──────────────────────────────────── */}
          <motion.div {...fadeUp(0.44)}>
            <div
              onClick={() => router.push('/estagiario')}
              style={{
                borderRadius: 20, cursor: 'pointer', overflow: 'hidden', position: 'relative',
                background: 'linear-gradient(135deg, rgba(124,110,247,0.1) 0%, rgba(157,143,255,0.05) 100%)',
                border: '1px solid rgba(124,110,247,0.25)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,110,247,0.5)'
                ;(e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(124,110,247,0.15)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,110,247,0.25)'
                ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
              }}
            >
              {/* Glow fundo */}
              <div style={{
                position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(124,110,247,0.15), transparent 70%)',
                pointerEvents: 'none',
              }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px' }}>
                {/* Avatar Bia */}
                <div style={{
                  width: 52, height: 52, borderRadius: 14, flexShrink: 0, overflow: 'hidden',
                  border: '2px solid rgba(124,110,247,0.4)',
                  boxShadow: '0 0 20px rgba(124,110,247,0.3)',
                }}>
                  <img src="/bia-avatar.png" alt="Bia" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
                </div>

                {/* Texto */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#e8e8f0', margin: 0, fontFamily: 'Syne, sans-serif' }}>
                      Bia, sua estagiária IA
                    </p>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                      background: 'rgba(124,110,247,0.15)', color: '#9d8fff',
                      border: '1px solid rgba(124,110,247,0.3)', letterSpacing: '0.05em',
                    }}>
                      IA
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: '#5a5a7a', margin: 0, lineHeight: 1.5 }}>
                    Manda nota, fatura ou boleto — ela cadastra na hora ✨
                  </p>
                </div>

                {/* CTA */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', borderRadius: 10, flexShrink: 0,
                  background: 'rgba(124,110,247,0.15)', border: '1px solid rgba(124,110,247,0.3)',
                  fontSize: 12, fontWeight: 700, color: '#9d8fff',
                }}>
                  <Sparkles size={12} />
                  Falar com a Bia
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Modal novo lançamento ───────────────────────────── */}
          <FormModal
            open={showModal}
            onClose={() => setShowModal(false)}
            title="Novo lançamento"
          >
            <form onSubmit={handleSave} className="flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-2">
                {['expense', 'income'].map(t => (
                  <button key={t} type="button" onClick={() => setForm({ ...form, type: t })}
                    className="py-2.5 rounded-xl text-sm font-semibold"
                    style={{ background: form.type === t ? (t === 'income' ? `${T.green}12` : `${T.red}12`) : 'rgba(255,255,255,0.02)', color: form.type === t ? (t === 'income' ? T.green : T.red) : T.muted, border: `1px solid ${form.type === t ? (t === 'income' ? `${T.green}30` : `${T.red}30`) : T.border}`, transition: 'all 0.15s', cursor: 'pointer' }}>
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
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={form.paid} onChange={e => setForm({ ...form, paid: e.target.checked })} style={{ accentColor: T.purple }} />
                <span className="text-sm" style={{ color: T.sub, fontFamily: SYNE }}>Já foi pago/recebido</span>
              </label>
              <ModalSubmitButton loading={saving}>Salvar lançamento</ModalSubmitButton>
            </form>
          </FormModal>

                    <TourTooltip active={tour.active} step={tour.step} current={tour.current} total={tour.total} onNext={tour.next} onPrev={tour.prev} onFinish={tour.finish} />
          <InstallButton />
        </div>
    </PageBackground>
  )
}

// ─── AlertBadge ───────────────────────────────────────────────
function AlertBadge({ icon: Icon, color, label, onClick }: { icon: any; color: string; label: string; onClick: () => void }) {
  return (
    <motion.button initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }} onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 rounded-xl flex-1 text-left"
      style={{ background: `${color}08`, border: `1px solid ${color}22`, backdropFilter: 'blur(8px)', cursor: 'pointer', transition: 'box-shadow 0.2s' }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = `0 0 24px ${color}18`}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
      <Icon size={14} style={{ color, flexShrink: 0 }} />
      <span className="text-xs font-semibold flex-1" style={{ color }}>{label}</span>
      <ArrowRight size={11} style={{ color }} />
    </motion.button>
  )
}
