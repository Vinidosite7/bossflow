'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useGoals } from '@/hooks/useGoals'
import { useTour } from '@/hooks/useTour'
import { usePlanLimits } from '@/hooks/usePlanLimits'
import { TourOverlay } from '@/components/TourOverlay'
import { PlanGate } from '@/components/PlanGate'
import { motion, AnimatePresence } from 'framer-motion'
import { Target, Zap, Trophy, CheckCircle2, TrendingUp, X, Save } from 'lucide-react'

const MONTH_NAMES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const MONTH_FULL = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

const TOUR_STEPS = [
  {
    target: '[data-tour="metas-anual"]',
    title: 'Meta anual',
    description: 'Acompanhe o progresso do seu objetivo anual. A barra mostra quantos % você já atingiu.',
    position: 'bottom' as const,
  },
  {
    target: '[data-tour="metas-mensal"]',
    title: 'Metas mensais',
    description: 'Clique em qualquer mês para definir sua meta. Meses com ✓ significam meta batida!',
    position: 'top' as const,
  },
  {
    target: '[data-tour="metas-conquistas"]',
    title: 'Conquistas',
    description: 'Desbloqueie badges conforme você bate metas. Quanto mais consistente, mais conquistas!',
    position: 'top' as const,
  },
]

export default function MetasPage() {
  const supabase = createClient()
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [loadingBiz, setLoadingBiz] = useState(true)
  const { plan } = usePlanLimits()
  const tour = useTour('metas', TOUR_STEPS)

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const saved = localStorage.getItem('activeBizId') || ''
        const { data: bizList } = await supabase.from('businesses').select('id').eq('owner_id', user.id)
        const biz = bizList?.find(b => b.id === saved) || bizList?.[0]
        setBusinessId(biz?.id || null)
      } catch {}
      finally { setLoadingBiz(false) }
    }
    load()
  }, [])

  const { goals, loading, saveGoal, annualTarget, annualRevenue, annualPct, monthsHit, streak } = useGoals(businessId)

  const [editingMonth, setEditingMonth] = useState<number | null>(null)
  const [editTarget, setEditTarget] = useState('')
  const [editSuper, setEditSuper] = useState('')
  const [saving, setSaving] = useState(false)

  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const fmtShort = (v: number) => {
    if (v >= 1000000) return `R$ ${(v / 1000000).toFixed(1)}M`
    if (v >= 1000) return `R$ ${(v / 1000).toFixed(1)}k`
    return fmt(v)
  }

  function openEdit(month: number) {
    const g = goals.find(g => g.month === month)
    setEditTarget(g?.target ? g.target.toString() : '')
    setEditSuper(g?.super_target ? g.super_target.toString() : '')
    setEditingMonth(month)
  }

  async function handleSave() {
    if (!editingMonth) return
    setSaving(true)
    await saveGoal(editingMonth, parseFloat(editTarget) || 0, editSuper ? parseFloat(editSuper) : null)
    setSaving(false)
    setEditingMonth(null)
  }

  const badges = [
    { id: 'first_goal', emoji: '🚀', label: 'Primeiro passo', desc: 'Definiu sua primeira meta', unlocked: goals.some(g => g.target > 0), color: '#7c6ef7' },
    { id: 'first_hit', emoji: '🎯', label: 'Em cheio!', desc: 'Bateu a meta pela primeira vez', unlocked: goals.some(g => g.hit), color: '#34d399' },
    { id: 'super_hit', emoji: '⚡', label: 'Super Cota', desc: 'Atingiu a super cota', unlocked: goals.some(g => g.superHit), color: '#a78bfa' },
    { id: 'streak_3', emoji: '🔥', label: '3 meses seguidos', desc: 'Bateu a meta 3 meses consecutivos', unlocked: streak >= 3, color: '#f97316' },
    { id: 'streak_6', emoji: '🌟', label: '6 meses seguidos', desc: 'Bateu a meta 6 meses consecutivos', unlocked: streak >= 6, color: '#fbbf24' },
    { id: 'annual_50', emoji: '📈', label: 'Metade do caminho', desc: '50% da meta anual atingida', unlocked: annualPct >= 50, color: '#22d3ee' },
    { id: 'annual_100', emoji: '🏆', label: 'Ano batido!', desc: 'Meta anual 100% atingida', unlocked: annualPct >= 100, color: '#fbbf24' },
    { id: 'perfect_year', emoji: '💎', label: 'Ano perfeito', desc: 'Bateu todas as metas do ano', unlocked: monthsHit === 12, color: '#a78bfa' },
  ]

  const unlockedCount = badges.filter(b => b.unlocked).length
  const annualColor = annualPct >= 100 ? '#34d399' : annualPct >= 60 ? '#fbbf24' : '#f97316'

  if (loadingBiz) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: '#f97316', borderTopColor: 'transparent' }} />
    </div>
  )

  return (
    <div className="flex flex-col gap-5">
      <TourOverlay active={tour.active} step={tour.step} current={tour.current} total={tour.total} onNext={tour.next} onPrev={tour.prev} onFinish={tour.finish} />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Syne, sans-serif' }}>Metas & Conquistas</h1>
          <p className="text-sm mt-1" style={{ color: '#4a4a6a' }}>
            {currentYear} · {monthsHit} {monthsHit === 1 ? 'mês batido' : 'meses batidos'}
            {streak > 0 && ` · 🔥 ${streak} em sequência`}
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
          style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)' }}>
          <Trophy size={13} style={{ color: '#f97316' }} />
          <span className="text-xs font-bold" style={{ color: '#f97316' }}>{unlockedCount}/{badges.length} conquistas</span>
        </div>
      </div>

      {/* Meta anual */}
      <div className="rounded-2xl p-5 relative overflow-hidden" data-tour="metas-anual"
        style={{ background: '#111118', border: `1px solid ${annualPct >= 100 ? '#34d39940' : '#1e1e2e'}` }}>
        {loading ? (
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full border-2 animate-spin shrink-0" style={{ borderColor: '#f97316', borderTopColor: 'transparent' }} />
            <span className="text-sm" style={{ color: '#4a4a6a' }}>Carregando metas...</span>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Target size={14} style={{ color: '#f97316' }} />
                  <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#f97316' }}>Meta Anual {currentYear}</span>
                </div>
                <p className="text-3xl font-bold" style={{ fontFamily: 'Syne, sans-serif', color: annualColor }}>{Math.round(annualPct)}%</p>
                <p className="text-sm mt-1" style={{ color: '#6b6b8a' }}>
                  {fmtShort(annualRevenue)}
                  {annualTarget > 0 && <span style={{ color: '#3a3a5c' }}> / {fmtShort(annualTarget)}</span>}
                </p>
              </div>
              <div className="relative w-16 h-16">
                <svg viewBox="0 0 64 64" className="w-16 h-16 -rotate-90">
                  <circle cx="32" cy="32" r="26" fill="none" stroke="#1e1e2e" strokeWidth="5" />
                  <motion.circle cx="32" cy="32" r="26" fill="none" stroke={annualColor} strokeWidth="5" strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 26}`}
                    initial={{ strokeDashoffset: 2 * Math.PI * 26 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 26 * (1 - Math.min(annualPct, 100) / 100) }}
                    transition={{ duration: 1.2, ease: 'easeOut' }} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <TrendingUp size={16} style={{ color: annualColor }} />
                </div>
              </div>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: '#1e1e2e' }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(annualPct, 100)}%` }}
                transition={{ duration: 1.2, ease: 'easeOut' }} className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${annualColor}80, ${annualColor})` }} />
            </div>
          </>
        )}
      </div>

      {/* Grade mensal */}
      <div data-tour="metas-mensal">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>Metas mensais</h2>
          <p className="text-xs" style={{ color: '#4a4a6a' }}>Clique para editar</p>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="rounded-2xl animate-pulse" style={{ height: 96, background: '#111118' }} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {goals.map((g, i) => {
              const isCurrent = g.month === currentMonth
              const isFuture = g.month > currentMonth
              const color = g.superHit ? '#a78bfa' : g.hit ? '#34d399' : g.pct >= 80 ? '#fbbf24' : g.pct >= 50 ? '#f97316' : '#f87171'
              const hasGoal = g.target > 0
              return (
                <motion.button key={g.month}
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.03 }} whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}
                  onClick={() => openEdit(g.month)}
                  className="rounded-2xl p-4 text-left relative overflow-hidden"
                  style={{
                    background: isCurrent ? 'rgba(249,115,22,0.06)' : '#111118',
                    border: `1px solid ${isCurrent ? 'rgba(249,115,22,0.3)' : hasGoal && g.hit ? `${color}30` : '#1e1e2e'}`,
                    opacity: isFuture && !hasGoal ? 0.5 : 1,
                  }}>
                  {isCurrent && <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#f97316' }} />}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold" style={{ color: isCurrent ? '#f97316' : '#6b6b8a' }}>{MONTH_NAMES[g.month - 1]}</span>
                    {g.superHit && <span className="text-xs">⚡</span>}
                    {g.hit && !g.superHit && <span className="text-xs">✓</span>}
                    {!hasGoal && <span className="text-xs" style={{ color: '#3a3a5c' }}>—</span>}
                  </div>
                  {hasGoal ? (
                    <>
                      <p className="text-sm font-bold" style={{ color: isFuture ? '#4a4a6a' : color }}>{Math.round(g.pct)}%</p>
                      <p className="text-xs mt-0.5 truncate" style={{ color: '#4a4a6a' }}>{fmtShort(g.revenue)} / {fmtShort(g.target)}</p>
                      {!isFuture && (
                        <div className="h-1 rounded-full mt-2 overflow-hidden" style={{ background: '#1e1e2e' }}>
                          <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(g.pct, 100)}%` }}
                            transition={{ duration: 0.7, delay: i * 0.03 }} className="h-full rounded-full" style={{ background: color }} />
                        </div>
                      )}
                      {g.super_target && g.super_target > 0 && (
                        <div className="flex items-center gap-1 mt-1.5">
                          <Zap size={9} style={{ color: '#a78bfa' }} />
                          <span className="text-xs" style={{ color: '#4a4a6a' }}>{fmtShort(g.super_target)}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-xs mt-1" style={{ color: '#3a3a5c' }}>{isFuture ? 'Definir meta' : 'Sem meta'}</p>
                  )}
                </motion.button>
              )
            })}
          </div>
        )}
      </div>

      {/* Conquistas */}
      <div data-tour="metas-conquistas">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="font-bold text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>Conquistas</h2>
          <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(251,191,36,0.1)', color: '#fbbf24' }}>
            {unlockedCount}/{badges.length}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {badges.map((b) => (
            <div key={b.id}
              className="rounded-2xl p-4 flex flex-col items-center text-center gap-2 relative overflow-hidden"
              style={{
                background: b.unlocked ? `${b.color}08` : '#0d0d14',
                border: `1px solid ${b.unlocked ? `${b.color}25` : '#1a1a2e'}`,
                opacity: b.unlocked ? 1 : 0.45,
              }}>
              {b.unlocked && <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full blur-2xl pointer-events-none" style={{ background: `${b.color}20` }} />}
              <span className="text-3xl">{b.unlocked ? b.emoji : '🔒'}</span>
              <div>
                <p className="text-xs font-bold leading-tight" style={{ color: b.unlocked ? b.color : '#4a4a6a' }}>{b.label}</p>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: '#4a4a6a' }}>{b.desc}</p>
              </div>
              {b.unlocked && <div className="absolute top-2 right-2"><CheckCircle2 size={12} style={{ color: b.color }} /></div>}
            </div>
          ))}
        </div>
      </div>

      {/* Modal edição */}
      <AnimatePresence>
        {editingMonth !== null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}
            onClick={e => { if (e.target === e.currentTarget) setEditingMonth(null) }}>
            <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as const }}
              className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl border p-6"
              style={{ background: '#111118', borderColor: '#1e1e2e' }}>
              <div className="w-10 h-1 rounded-full mx-auto mb-5 sm:hidden" style={{ background: '#2a2a3e' }} />
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-bold text-lg" style={{ fontFamily: 'Syne, sans-serif' }}>Meta de {MONTH_FULL[editingMonth - 1]}</h2>
                  <p className="text-xs mt-0.5" style={{ color: '#4a4a6a' }}>{currentYear}</p>
                </div>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setEditingMonth(null)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: '#1a1a2e', color: '#6b6b8a' }}>
                  <X size={15} />
                </motion.button>
              </div>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: '#f97316' }}>
                    <Target size={12} /> Meta de receita (R$)
                  </label>
                  <input type="number" step="0.01" placeholder="Ex: 10000" value={editTarget}
                    onChange={e => setEditTarget(e.target.value)}
                    className="w-full px-3 py-3 rounded-xl border text-sm outline-none"
                    style={{ background: '#0d0d14', borderColor: '#1e1e2e', color: '#e8e8f0' }}
                    onFocus={e => e.currentTarget.style.borderColor = '#f97316'}
                    onBlur={e => e.currentTarget.style.borderColor = '#1e1e2e'} />
                </div>

                {/* Super Cota - só Starter+ */}
                <PlanGate currentPlan={plan} requiredPlan="starter" feature="Super Cota"
                  description="Defina uma meta bônus extra ambiciosa. Disponível no plano Starter." mode="hide">
                  <div>
                    <label className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: '#a78bfa' }}>
                      <Zap size={12} /> Super Cota (R$) <span className="font-normal" style={{ color: '#4a4a6a' }}>— opcional</span>
                    </label>
                    <input type="number" step="0.01" placeholder="Ex: 15000" value={editSuper}
                      onChange={e => setEditSuper(e.target.value)}
                      className="w-full px-3 py-3 rounded-xl border text-sm outline-none"
                      style={{ background: '#0d0d14', borderColor: '#1e1e2e', color: '#e8e8f0' }}
                      onFocus={e => e.currentTarget.style.borderColor = '#a78bfa'}
                      onBlur={e => e.currentTarget.style.borderColor = '#1e1e2e'} />
                    <p className="text-xs mt-1.5" style={{ color: '#4a4a6a' }}>Meta bônus extra — desbloqueie o badge ⚡ ao atingir</p>
                  </div>
                </PlanGate>

                <div className="flex gap-3 mt-1">
                  <button onClick={() => setEditingMonth(null)} className="flex-1 py-3 rounded-xl text-sm font-semibold"
                    style={{ background: '#1a1a2e', color: '#6b6b8a' }}>Cancelar</button>
                  <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                    onClick={handleSave} disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold"
                    style={{ background: 'linear-gradient(135deg, #f97316, #fb923c)', color: 'white', boxShadow: '0 0 20px rgba(249,115,22,0.3)' }}>
                    {saving
                      ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      : <><Save size={14} /> Salvar meta</>}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}