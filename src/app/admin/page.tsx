'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, CreditCard, TrendingUp, Activity, Search, X,
  ChevronDown, Check, Loader2, Calendar, Crown, Star,
  Rocket, Zap, Building2, LogOut
} from 'lucide-react'

/* ─── Types ── */
type AdminUser = {
  id: string
  email: string
  created_at: string
  last_sign_in_at: string | null
  full_name: string | null
  is_admin: boolean
  plan: string
  sub_status: string | null
  activated_at: string | null
  expires_at: string | null
  note: string | null
}

/* ─── Constants ── */
const PLANS = ['free', 'starter', 'pro', 'scale']
const PLAN_LABELS: Record<string, string> = { free: 'Gratuito', starter: 'Starter', pro: 'Pro', scale: 'Scale' }
const PLAN_ICONS: Record<string, any> = { free: Zap, starter: Star, pro: Rocket, scale: Crown }
const PLAN_COLORS: Record<string, string> = {
  free: '#6b6b8a', starter: '#34d399', pro: '#7c6ef7', scale: '#fbbf24'
}
const MRR: Record<string, number> = { free: 0, starter: 39.9, pro: 69.9, scale: 149 }

const QUICK_DAYS = [7, 14, 30, 90, 365]

/* ─── Helpers ── */
function fmt(v: number) {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
}
function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR')
}

/* ─── KPI Card ── */
function KPI({ icon: Icon, label, value, color, sub }: any) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border p-4 flex flex-col gap-2"
      style={{ background: '#111118', borderColor: '#1e1e2e' }}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color: '#4a4a6a' }}>{label}</span>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: `${color}18` }}>
          <Icon size={13} style={{ color }} />
        </div>
      </div>
      <div className="text-2xl font-extrabold" style={{ fontFamily: 'Syne, sans-serif', color: '#e8eaf0' }}>
        {value}
      </div>
      {sub && <p className="text-xs" style={{ color: '#4a4a6a' }}>{sub}</p>}
    </motion.div>
  )
}

/* ─── Page ── */
export default function AdminPage() {
  const supabase = createClient()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterPlan, setFilterPlan] = useState<string>('all')

  // Set plan modal
  const [setPlanModal, setSetPlanModal] = useState<AdminUser | null>(null)
  const [newPlan, setNewPlan] = useState('starter')
  const [days, setDays] = useState<number | ''>('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveOk, setSaveOk] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const { data, error } = await supabase.from('admin_users_view').select('*').order('created_at', { ascending: false })
      if (error) throw error
      setUsers(data ?? [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  /* KPIs */
  const totalUsers = users.length
  const paidUsers = users.filter(u => u.plan !== 'free').length
  const mrr = users.reduce((acc, u) => acc + (MRR[u.plan] ?? 0), 0)
  const todayUsers = users.filter(u => {
    const d = new Date(u.created_at)
    const now = new Date()
    return d.toDateString() === now.toDateString()
  }).length

  /* Filtered */
  const filtered = users.filter(u => {
    const matchSearch = !search ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.full_name ?? '').toLowerCase().includes(search.toLowerCase())
    const matchPlan = filterPlan === 'all' || u.plan === filterPlan
    return matchSearch && matchPlan
  })

  /* Set plan */
  function openSetPlan(u: AdminUser) {
    setSetPlanModal(u)
    setNewPlan(u.plan === 'free' ? 'starter' : u.plan)
    setDays('')
    setNote(u.note ?? '')
    setSaveOk(false)
  }

  async function handleSetPlan() {
    if (!setPlanModal) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/set-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: setPlanModal.id, plan: newPlan, days: days || null, note }),
      })
      if (!res.ok) throw new Error()
      setSaveOk(true)
      await load()
      setTimeout(() => setSetPlanModal(null), 1200)
    } catch { }
    finally { setSaving(false) }
  }

  async function handleRevoke(userId: string) {
    if (!confirm('Revogar plano e voltar para Gratuito?')) return
    await fetch('/api/admin/set-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, plan: 'free', days: null, note: 'Revogado pelo admin' }),
    })
    load()
  }

  return (
    <div className="min-h-screen p-4 sm:p-8 flex flex-col gap-8" style={{ background: '#0a0a12', color: '#e8eaf0' }}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ fontFamily: 'Syne, sans-serif' }}>
            Admin <span style={{ color: '#7c6ef7' }}>BossFlow</span>
          </h1>
          <p className="text-sm mt-0.5" style={{ color: '#4a4a6a' }}>Painel de administração</p>
        </div>
        <a href="/dashboard"
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold"
          style={{ background: '#1a1a2a', color: '#6b6b8a', border: '1px solid #1e1e2e' }}>
          <LogOut size={13} /> Dashboard
        </a>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPI icon={Users} label="Total usuários" value={totalUsers} color="#7c6ef7" sub={`+${todayUsers} hoje`} />
        <KPI icon={CreditCard} label="Pagantes" value={paidUsers} color="#34d399" sub={`${totalUsers > 0 ? Math.round(paidUsers / totalUsers * 100) : 0}% do total`} />
        <KPI icon={TrendingUp} label="MRR" value={`R$ ${fmt(mrr)}`} color="#fbbf24" sub="receita mensal recorrente" />
        <KPI icon={Activity} label="ARR" value={`R$ ${fmt(mrr * 12)}`} color="#f472b6" sub="receita anual estimada" />
      </div>

      {/* Distribuição por plano */}
      <div className="rounded-2xl border p-4" style={{ background: '#111118', borderColor: '#1e1e2e' }}>
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#4a4a6a' }}>Distribuição por plano</p>
        <div className="flex gap-3 flex-wrap">
          {PLANS.map(plan => {
            const count = users.filter(u => u.plan === plan).length
            const pct = totalUsers > 0 ? Math.round(count / totalUsers * 100) : 0
            const Icon = PLAN_ICONS[plan]
            return (
              <div key={plan} className="flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{ background: '#0d0d14', border: '1px solid #1a1a2a' }}>
                <Icon size={13} style={{ color: PLAN_COLORS[plan] }} />
                <span className="text-xs font-medium" style={{ color: PLAN_COLORS[plan] }}>{PLAN_LABELS[plan]}</span>
                <span className="text-sm font-bold" style={{ color: '#e8eaf0' }}>{count}</span>
                <span className="text-xs" style={{ color: '#4a4a6a' }}>{pct}%</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1 min-w-48"
          style={{ background: '#111118', border: '1px solid #1e1e2e' }}>
          <Search size={14} style={{ color: '#4a4a6a' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por email ou nome..."
            className="bg-transparent outline-none text-sm flex-1"
            style={{ color: '#e8eaf0' }} />
          {search && <button onClick={() => setSearch('')}><X size={12} style={{ color: '#4a4a6a' }} /></button>}
        </div>
        <div className="flex gap-1.5">
          {['all', ...PLANS].map(p => (
            <button key={p} onClick={() => setFilterPlan(p)}
              className="px-3 py-2 rounded-xl text-xs font-medium transition-all"
              style={{
                background: filterPlan === p ? (p === 'all' ? '#7c6ef7' : `${PLAN_COLORS[p]}18`) : '#111118',
                color: filterPlan === p ? (p === 'all' ? 'white' : PLAN_COLORS[p]) : '#4a4a6a',
                border: `1px solid ${filterPlan === p ? (p === 'all' ? '#7c6ef7' : `${PLAN_COLORS[p]}40`) : '#1e1e2e'}`,
              }}>
              {p === 'all' ? 'Todos' : PLAN_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: '#111118', borderColor: '#1e1e2e' }}>
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={24} className="animate-spin" style={{ color: '#7c6ef7' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm" style={{ color: '#4a4a6a' }}>Nenhum usuário encontrado.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #1a1a2a' }}>
                  {['Usuário', 'Plano', 'Ativado em', 'Expira em', 'Último acesso', 'Ações'].map(h => (
                    <th key={h} className="py-3 px-4 text-left text-xs font-semibold"
                      style={{ color: '#4a4a6a' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => {
                  const Icon = PLAN_ICONS[u.plan] ?? Zap
                  const color = PLAN_COLORS[u.plan] ?? '#6b6b8a'
                  const isExpired = u.expires_at && new Date(u.expires_at) < new Date()
                  return (
                    <motion.tr key={u.id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      style={{ borderTop: i > 0 ? '1px solid #1a1a2a' : 'none' }}
                      className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                            style={{ background: `${color}18`, color }}>
                            {u.email[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-xs" style={{ color: '#d0d0e0' }}>{u.email}</p>
                            {u.full_name && <p className="text-xs" style={{ color: '#4a4a6a' }}>{u.full_name}</p>}
                            {u.is_admin && <span className="text-[10px] px-1 rounded" style={{ background: 'rgba(124,110,247,0.15)', color: '#9d8fff' }}>admin</span>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="flex items-center gap-1.5 w-fit px-2 py-1 rounded-lg text-xs font-semibold"
                          style={{ background: `${color}18`, color }}>
                          <Icon size={11} /> {PLAN_LABELS[u.plan]}
                        </span>
                        {u.note && <p className="text-[10px] mt-1" style={{ color: '#4a4a6a' }}>{u.note}</p>}
                      </td>
                      <td className="py-3 px-4 text-xs" style={{ color: '#6b6b8a' }}>{fmtDate(u.activated_at)}</td>
                      <td className="py-3 px-4">
                        {u.expires_at ? (
                          <span className="text-xs px-2 py-0.5 rounded-lg"
                            style={{
                              background: isExpired ? 'rgba(248,113,113,0.1)' : 'rgba(251,191,36,0.1)',
                              color: isExpired ? '#f87171' : '#fbbf24',
                            }}>
                            {isExpired ? 'Expirado' : fmtDate(u.expires_at)}
                          </span>
                        ) : (
                          <span className="text-xs" style={{ color: '#4a4a6a' }}>—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs" style={{ color: '#6b6b8a' }}>{fmtDate(u.last_sign_in_at)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => openSetPlan(u)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
                            style={{ background: 'rgba(124,110,247,0.1)', color: '#9d8fff', border: '1px solid rgba(124,110,247,0.2)' }}>
                            Setar plano
                          </button>
                          {u.plan !== 'free' && (
                            <button onClick={() => handleRevoke(u.id)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold"
                              style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}>
                              Revogar
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal setar plano */}
      <AnimatePresence>
        {setPlanModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.85)' }}
            onClick={e => { if (e.target === e.currentTarget) setSetPlanModal(null) }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-sm rounded-2xl border p-6 flex flex-col gap-5"
              style={{ background: '#111118', borderColor: '#1e1e2e' }}>

              <div className="flex items-center justify-between">
                <h2 className="font-bold text-base" style={{ fontFamily: 'Syne, sans-serif' }}>Setar plano</h2>
                <button onClick={() => setSetPlanModal(null)} style={{ color: '#4a4a6a' }}><X size={16} /></button>
              </div>

              <div className="px-3 py-2 rounded-xl text-xs" style={{ background: '#0d0d14', color: '#6b6b8a' }}>
                {setPlanModal.email}
              </div>

              {/* Plano */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold" style={{ color: '#6b6b8a' }}>Plano</label>
                <div className="grid grid-cols-2 gap-2">
                  {PLANS.map(p => {
                    const Icon = PLAN_ICONS[p]
                    const color = PLAN_COLORS[p]
                    return (
                      <button key={p} onClick={() => setNewPlan(p)}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all"
                        style={{
                          background: newPlan === p ? `${color}18` : '#0d0d14',
                          color: newPlan === p ? color : '#4a4a6a',
                          border: `1px solid ${newPlan === p ? `${color}40` : '#1e1e2e'}`,
                        }}>
                        <Icon size={13} /> {PLAN_LABELS[p]}
                        {newPlan === p && <Check size={11} className="ml-auto" />}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Dias */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold" style={{ color: '#6b6b8a' }}>
                  Duração <span style={{ color: '#3a3a5c' }}>(vazio = sem expiração)</span>
                </label>
                <div className="flex gap-1.5 flex-wrap">
                  {QUICK_DAYS.map(d => (
                    <button key={d} onClick={() => setDays(d)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{
                        background: days === d ? 'rgba(124,110,247,0.15)' : '#0d0d14',
                        color: days === d ? '#9d8fff' : '#4a4a6a',
                        border: `1px solid ${days === d ? 'rgba(124,110,247,0.3)' : '#1e1e2e'}`,
                      }}>
                      {d}d
                    </button>
                  ))}
                  <input
                    type="number" placeholder="Outro" value={days}
                    onChange={e => setDays(e.target.value ? Number(e.target.value) : '')}
                    className="w-16 px-2 py-1.5 rounded-lg text-xs outline-none"
                    style={{ background: '#0d0d14', border: '1px solid #1e1e2e', color: '#e8eaf0' }}
                  />
                </div>
              </div>

              {/* Nota */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold" style={{ color: '#6b6b8a' }}>Observação</label>
                <input value={note} onChange={e => setNote(e.target.value)}
                  placeholder="Ex: teste grátis, parceria, etc."
                  className="px-3 py-2.5 rounded-xl border text-xs outline-none"
                  style={{ background: '#0d0d14', borderColor: '#1e1e2e', color: '#e8eaf0' }} />
              </div>

              <button onClick={handleSetPlan} disabled={saving}
                className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all"
                style={{ background: saveOk ? 'rgba(52,211,153,0.2)' : '#7c6ef7', color: saveOk ? '#34d399' : 'white' }}>
                {saving ? <Loader2 size={16} className="animate-spin" /> : saveOk ? <><Check size={15} /> Salvo!</> : 'Confirmar'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
