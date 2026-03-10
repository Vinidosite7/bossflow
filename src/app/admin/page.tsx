'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, CreditCard, TrendingUp, Activity, Search, X,
  Check, Loader2, Crown, Star, Rocket, Zap, Building2, LogOut, Trash2
} from 'lucide-react'
import { SpotlightCard, ShimmerButton, Skeleton } from '@/components/ui/bossflow-ui'

// ─── Design tokens (standalone — sem BackgroundGrid pra não conflitar) ──
const T = {
  bg: '#0a0a12', card: 'rgba(8,8,14,0.92)', bgDeep: 'rgba(6,6,10,0.97)',
  border: 'rgba(255,255,255,0.055)', borderP: 'rgba(124,110,247,0.22)',
  text: '#dcdcf0', sub: '#8a8aaa', muted: '#4a4a6a',
  green: '#34d399', red: '#f87171', amber: '#fbbf24',
  purple: '#7c6ef7', violet: '#a78bfa', cyan: '#22d3ee',
  blur: 'blur(20px)',
}
const cardStyle = { background: T.card, border: `1px solid ${T.border}`, backdropFilter: T.blur, boxShadow: '0 4px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)' }
const inp: React.CSSProperties = { background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.border}`, color: T.text, borderRadius: 12, padding: '10px 14px', fontSize: 13, outline: 'none', width: '100%', transition: 'border-color 0.15s' }

// ─── Types ────────────────────────────────────────────────────
type AdminUser = {
  id: string; email: string; created_at: string; last_sign_in_at: string | null
  full_name: string | null; is_admin: boolean; plan: string; sub_status: string | null
  activated_at: string | null; expires_at: string | null; note: string | null
}

// ─── Constants ───────────────────────────────────────────────
const PLANS       = ['free', 'starter', 'pro', 'scale']
const PLAN_LABELS: Record<string, string> = { free: 'Gratuito', starter: 'Starter', pro: 'Pro', scale: 'Scale' }
const PLAN_ICONS:  Record<string, any>    = { free: Zap, starter: Star, pro: Rocket, scale: Crown }
const PLAN_COLORS: Record<string, string> = { free: T.muted, starter: T.green, pro: T.purple, scale: T.amber }
const MRR:         Record<string, number> = { free: 0, starter: 39.9, pro: 69.9, scale: 149 }
const QUICK_DAYS  = [7, 14, 30, 90, 365]

function fmt(v: number)       { return v.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }
function fmtDate(d: string | null) { return d ? new Date(d).toLocaleDateString('pt-BR') : '—' }

// ─── KPI Card ────────────────────────────────────────────────
function KPI({ icon: Icon, label, value, color, sub }: any) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <SpotlightCard className="rounded-2xl" spotlightColor={`${color}0c`}
        style={{ ...cardStyle, padding: 0 }}>
        <div className="p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium" style={{ color: T.muted }}>{label}</span>
            <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: `${color}14`, border: `1px solid ${color}22` }}>
              <Icon size={13} style={{ color }} />
            </div>
          </div>
          <div className="text-2xl font-extrabold" style={{ fontFamily: 'Syne, sans-serif', color: T.text }}>{value}</div>
          {sub && <p className="text-xs" style={{ color: T.muted }}>{sub}</p>}
        </div>
      </SpotlightCard>
    </motion.div>
  )
}

// ─── Page ────────────────────────────────────────────────────
export default function AdminPage() {
  const supabase = createClient()
  const [users, setUsers]         = useState<AdminUser[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [filterPlan, setFilterPlan] = useState<string>('all')
  const [setPlanModal, setSetPlanModal] = useState<AdminUser | null>(null)
  const [newPlan, setNewPlan]     = useState('starter')
  const [days, setDays]           = useState<number | ''>('')
  const [note, setNote]           = useState('')
  const [saving, setSaving]       = useState(false)
  const [saveOk, setSaveOk]       = useState(false)

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

  const totalUsers = users.length
  const paidUsers  = users.filter(u => u.plan !== 'free').length
  const mrr        = users.reduce((acc, u) => acc + (MRR[u.plan] ?? 0), 0)
  const todayUsers = users.filter(u => new Date(u.created_at).toDateString() === new Date().toDateString()).length

  const filtered = users.filter(u => {
    const matchSearch = !search || u.email.toLowerCase().includes(search.toLowerCase()) || (u.full_name ?? '').toLowerCase().includes(search.toLowerCase())
    const matchPlan   = filterPlan === 'all' || u.plan === filterPlan
    return matchSearch && matchPlan
  })

  function openSetPlan(u: AdminUser) { setSetPlanModal(u); setNewPlan(u.plan === 'free' ? 'starter' : u.plan); setDays(''); setNote(u.note ?? ''); setSaveOk(false) }

  async function handleSetPlan() {
    if (!setPlanModal) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/set-plan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: setPlanModal.id, plan: newPlan, days: days || null, note }) })
      if (!res.ok) throw new Error()
      setSaveOk(true); await load(); setTimeout(() => setSetPlanModal(null), 1200)
    } catch { }
    finally { setSaving(false) }
  }

  async function handleRevoke(userId: string) {
    if (!confirm('Revogar plano e voltar para Gratuito?')) return
    await fetch('/api/admin/set-plan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, plan: 'free', days: null, note: 'Revogado pelo admin' }) })
    load()
  }

  async function handleDelete(u: AdminUser) {
    if (!confirm(`Deletar permanentemente ${u.email}?\n\nEssa ação não pode ser desfeita.`)) return
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/admin/delete-user', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` }, body: JSON.stringify({ userId: u.id }) })
    if (res.ok) { load() } else { const { error } = await res.json(); alert(error ?? 'Erro ao deletar usuário') }
  }

  return (
    <div className="min-h-screen p-4 sm:p-8 flex flex-col gap-6" style={{ background: T.bg, color: T.text }}>

      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ fontFamily: 'Syne, sans-serif' }}>
            Admin <span style={{ color: T.violet, textShadow: `0 0 24px ${T.purple}60` }}>BossFlow</span>
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: T.green, animationDuration: '2s' }} />
              <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: T.green, boxShadow: `0 0 6px ${T.green}` }} />
            </div>
            <p className="text-sm" style={{ color: T.muted }}>Painel de administração</p>
          </div>
        </div>
        <a href="/dashboard" className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold"
          style={{ background: 'rgba(255,255,255,0.04)', color: T.sub, border: `1px solid ${T.border}` }}>
          <LogOut size={13} /> Dashboard
        </a>
      </motion.div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPI icon={Users}      label="Total usuários" value={totalUsers}         color={T.purple} sub={`+${todayUsers} hoje`} />
        <KPI icon={CreditCard} label="Pagantes"        value={paidUsers}          color={T.green}  sub={`${totalUsers > 0 ? Math.round(paidUsers / totalUsers * 100) : 0}% do total`} />
        <KPI icon={TrendingUp} label="MRR"             value={`R$ ${fmt(mrr)}`}   color={T.amber}  sub="receita mensal recorrente" />
        <KPI icon={Activity}   label="ARR"             value={`R$ ${fmt(mrr*12)}`} color="#f472b6" sub="receita anual estimada" />
      </div>

      {/* ── Distribuição ── */}
      <SpotlightCard className="rounded-2xl" spotlightColor={`${T.purple}08`} style={{ ...cardStyle, padding: 0 }}>
        <div className="p-4">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: T.muted, fontFamily: 'Syne, sans-serif', letterSpacing: '0.1em' }}>Distribuição por plano</p>
          <div className="flex gap-2.5 flex-wrap">
            {PLANS.map(plan => {
              const count = users.filter(u => u.plan === plan).length
              const pct   = totalUsers > 0 ? Math.round(count / totalUsers * 100) : 0
              const Icon  = PLAN_ICONS[plan]
              const color = PLAN_COLORS[plan]
              return (
                <div key={plan} className="flex items-center gap-2 px-3 py-2 rounded-xl"
                  style={{ background: `${color}08`, border: `1px solid ${color}18` }}>
                  <Icon size={12} style={{ color }} />
                  <span className="text-xs font-semibold" style={{ color }}>{PLAN_LABELS[plan]}</span>
                  <span className="text-sm font-extrabold" style={{ color: T.text, fontFamily: 'Syne, sans-serif' }}>{count}</span>
                  <span className="text-xs" style={{ color: T.muted }}>{pct}%</span>
                </div>
              )
            })}
          </div>
        </div>
      </SpotlightCard>

      {/* ── Filtros ── */}
      <div className="flex gap-3 flex-wrap items-center">
        <SpotlightCard className="rounded-xl flex-1 min-w-48" spotlightColor="rgba(124,110,247,0.06)" style={{ ...cardStyle, padding: 0 }}>
          <div className="flex items-center gap-2 px-3 py-2.5">
            <Search size={13} style={{ color: T.muted }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por email ou nome..."
              className="bg-transparent outline-none text-sm flex-1" style={{ color: T.text }} />
            {search && <motion.button whileTap={{ scale: 0.9 }} onClick={() => setSearch('')}><X size={12} style={{ color: T.muted }} /></motion.button>}
          </div>
        </SpotlightCard>
        <div className="flex gap-1.5 flex-wrap">
          {['all', ...PLANS].map(p => {
            const color  = p === 'all' ? T.purple : PLAN_COLORS[p]
            const active = filterPlan === p
            return (
              <motion.button key={p} whileTap={{ scale: 0.95 }} onClick={() => setFilterPlan(p)}
                className="px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                style={{ background: active ? `${color}15` : 'rgba(255,255,255,0.03)', color: active ? color : T.muted, border: `1px solid ${active ? `${color}35` : T.border}`, cursor: 'pointer' }}>
                {p === 'all' ? 'Todos' : PLAN_LABELS[p]}
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* ── Tabela ── */}
      <SpotlightCard className="rounded-2xl" spotlightColor="rgba(124,110,247,0.06)" style={{ ...cardStyle, padding: 0 }}>
        {loading ? (
          <div className="flex flex-col gap-3 p-5">
            {[0,1,2,3].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm" style={{ color: T.muted }}>Nenhum usuário encontrado.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {['Usuário', 'Plano', 'Ativado em', 'Expira em', 'Último acesso', 'Ações'].map(h => (
                    <th key={h} className="py-3 px-4 text-left text-xs font-semibold" style={{ color: T.muted, fontFamily: 'Syne, sans-serif', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => {
                  const Icon      = PLAN_ICONS[u.plan] ?? Zap
                  const color     = PLAN_COLORS[u.plan] ?? T.muted
                  const isExpired = u.expires_at && new Date(u.expires_at) < new Date()
                  return (
                    <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                      style={{ borderTop: i > 0 ? `1px solid ${T.border}` : 'none' }}
                      className="transition-colors"
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.018)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                            style={{ background: `${color}14`, color, fontFamily: 'Syne, sans-serif' }}>
                            {u.email[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-xs" style={{ color: T.sub }}>{u.email}</p>
                            {u.full_name && <p className="text-xs" style={{ color: T.muted }}>{u.full_name}</p>}
                            {u.is_admin && <span className="text-[10px] px-1.5 rounded-md" style={{ background: `${T.purple}14`, color: T.violet }}>admin</span>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="flex items-center gap-1.5 w-fit px-2 py-1 rounded-lg text-xs font-semibold"
                          style={{ background: `${color}14`, color, border: `1px solid ${color}22` }}>
                          <Icon size={10} /> {PLAN_LABELS[u.plan]}
                        </span>
                        {u.note && <p className="text-[10px] mt-1" style={{ color: T.muted }}>{u.note}</p>}
                      </td>
                      <td className="py-3 px-4 text-xs" style={{ color: T.muted }}>{fmtDate(u.activated_at)}</td>
                      <td className="py-3 px-4">
                        {u.expires_at ? (
                          <span className="text-xs px-2 py-0.5 rounded-lg"
                            style={{ background: isExpired ? `${T.red}10` : `${T.amber}10`, color: isExpired ? T.red : T.amber, border: `1px solid ${isExpired ? `${T.red}22` : `${T.amber}22`}` }}>
                            {isExpired ? 'Expirado' : fmtDate(u.expires_at)}
                          </span>
                        ) : <span style={{ color: T.muted }} className="text-xs">—</span>}
                      </td>
                      <td className="py-3 px-4 text-xs" style={{ color: T.muted }}>{fmtDate(u.last_sign_in_at)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}
                            onClick={() => openSetPlan(u)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold"
                            style={{ background: `${T.purple}10`, color: T.violet, border: `1px solid ${T.purple}22`, cursor: 'pointer' }}>
                            Setar plano
                          </motion.button>
                          <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.9 }}
                            onClick={() => handleDelete(u)} title="Deletar usuário"
                            className="w-7 h-7 rounded-lg flex items-center justify-center"
                            style={{ background: `${T.red}08`, color: T.red, border: `1px solid ${T.red}18`, cursor: 'pointer' }}>
                            <Trash2 size={12} />
                          </motion.button>
                          {u.plan !== 'free' && (
                            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}
                              onClick={() => handleRevoke(u.id)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold"
                              style={{ background: `${T.red}08`, color: T.red, border: `1px solid ${T.red}18`, cursor: 'pointer' }}>
                              Revogar
                            </motion.button>
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
      </SpotlightCard>

      {/* ── Modal Setar Plano ── */}
      <AnimatePresence>
        {setPlanModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)' }}
            onClick={e => { if (e.target === e.currentTarget) setSetPlanModal(null) }}>
            <motion.div initial={{ scale: 0.93, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.93, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] as const }}
              className="w-full max-w-sm rounded-2xl p-6 flex flex-col gap-5"
              style={{ background: T.bgDeep, border: `1px solid ${T.borderP}`, boxShadow: '0 0 0 1px rgba(124,110,247,0.08), 0 24px 64px rgba(0,0,0,0.8)', backdropFilter: 'blur(28px)' }}>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${T.purple}14`, border: `1px solid ${T.purple}28` }}>
                    <Crown size={14} style={{ color: T.violet }} />
                  </div>
                  <h2 className="font-bold text-base" style={{ fontFamily: 'Syne, sans-serif', color: T.text }}>Setar plano</h2>
                </div>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setSetPlanModal(null)}
                  className="w-7 h-7 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.05)', color: T.sub, border: `1px solid ${T.border}`, cursor: 'pointer' }}>
                  <X size={13} />
                </motion.button>
              </div>

              <div className="px-3 py-2.5 rounded-xl text-xs font-mono" style={{ background: 'rgba(255,255,255,0.03)', color: T.sub, border: `1px solid ${T.border}` }}>
                {setPlanModal.email}
              </div>

              {/* Plano */}
              <div className="flex flex-col gap-2">
                <label style={{ fontSize: 11, fontWeight: 600, color: T.muted, letterSpacing: '0.06em', fontFamily: 'Syne, sans-serif', textTransform: 'uppercase' }}>Plano</label>
                <div className="grid grid-cols-2 gap-2">
                  {PLANS.map(p => {
                    const Icon  = PLAN_ICONS[p]
                    const color = PLAN_COLORS[p]
                    const sel   = newPlan === p
                    return (
                      <motion.button key={p} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                        onClick={() => setNewPlan(p)}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all"
                        style={{ background: sel ? `${color}14` : 'rgba(255,255,255,0.03)', color: sel ? color : T.muted, border: `1px solid ${sel ? `${color}35` : T.border}`, cursor: 'pointer' }}>
                        <Icon size={12} /> {PLAN_LABELS[p]}
                        {sel && <Check size={10} className="ml-auto" />}
                      </motion.button>
                    )
                  })}
                </div>
              </div>

              {/* Dias */}
              <div className="flex flex-col gap-2">
                <label style={{ fontSize: 11, fontWeight: 600, color: T.muted, letterSpacing: '0.06em', fontFamily: 'Syne, sans-serif', textTransform: 'uppercase' }}>
                  Duração <span style={{ color: T.muted, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(vazio = sem expiração)</span>
                </label>
                <div className="flex gap-1.5 flex-wrap items-center">
                  {QUICK_DAYS.map(d => (
                    <motion.button key={d} whileTap={{ scale: 0.95 }} onClick={() => setDays(d)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold"
                      style={{ background: days === d ? `${T.purple}14` : 'rgba(255,255,255,0.03)', color: days === d ? T.violet : T.muted, border: `1px solid ${days === d ? `${T.purple}30` : T.border}`, cursor: 'pointer' }}>
                      {d}d
                    </motion.button>
                  ))}
                  <input type="number" placeholder="Outro" value={days} onChange={e => setDays(e.target.value ? Number(e.target.value) : '')}
                    className="w-16 px-2 py-1.5 rounded-lg text-xs outline-none"
                    style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.border}`, color: T.text }}
                    onFocus={e => e.currentTarget.style.borderColor = T.borderP}
                    onBlur={e => e.currentTarget.style.borderColor = T.border} />
                </div>
              </div>

              {/* Nota */}
              <div className="flex flex-col gap-2">
                <label style={{ fontSize: 11, fontWeight: 600, color: T.muted, letterSpacing: '0.06em', fontFamily: 'Syne, sans-serif', textTransform: 'uppercase' }}>Observação</label>
                <input value={note} onChange={e => setNote(e.target.value)} placeholder="Ex: teste grátis, parceria..."
                  style={inp}
                  onFocus={e => e.currentTarget.style.borderColor = T.borderP}
                  onBlur={e => e.currentTarget.style.borderColor = T.border} />
              </div>

              <ShimmerButton onClick={handleSetPlan} disabled={saving}
                className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold w-full"
                style={{ background: saveOk ? `${T.green}18` : `linear-gradient(135deg, ${T.purple}, #a06ef7)`, color: saveOk ? T.green : 'white', boxShadow: saving || saveOk ? 'none' : `0 0 28px ${T.purple}40`, border: saveOk ? `1px solid ${T.green}30` : '1px solid rgba(255,255,255,0.1)', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : saveOk ? <><Check size={15} /> Salvo!</> : 'Confirmar'}
              </ShimmerButton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
