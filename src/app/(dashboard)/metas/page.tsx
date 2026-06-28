'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useGoals } from '@/hooks/useGoals'
import { useTour } from '@/hooks/useTour'
import { usePlanLimits } from '@/hooks/usePlanLimits'
import { TourTooltip } from "@/components/TourTooltip"
import { PlanGate } from '@/components/PlanGate'
import { motion, AnimatePresence } from 'framer-motion'
import { Target, Zap, Trophy, CheckCircle2, TrendingUp, X, Save } from 'lucide-react'
import {
  SpotlightCard,
  ShimmerButton,
  BackgroundGrid,
  FloatingOrbs,
  AcernityFonts,
  GlowCorner,
} from '@/components/ui/aceternity'

// ─── Tokens ────────────────────────────────────────────────────
const T = {
  bg:      'rgba(8,8,14,0.92)',
  bgDeep:  'rgba(6,6,10,0.97)',
  border:  'rgba(255,255,255,0.055)',
  borderP: 'rgba(124,110,247,0.22)',
  text:    '#dcdcf0',
  sub:     '#8a8aaa',
  muted:   '#4a4a6a',
  green:   '#34d399',
  amber:   '#fbbf24',
  orange:  '#f97316',
  red:     '#f87171',
  cyan:    '#22d3ee',
  violet:  '#a78bfa',
  purple:  '#7c6ef7',
  blur:    'blur(20px)',
}

const cardStyle = {
  background: T.bg,
  border: `1px solid ${T.border}`,
  backdropFilter: T.blur,
  boxShadow: '0 4px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)',
}

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: `1px solid ${T.border}`,
  color: T.text,
  borderRadius: 12,
  padding: '10px 14px',
  fontSize: 13,
  outline: 'none',
  width: '100%',
  transition: 'border-color 0.15s ease',
  fontFamily: 'DM Sans, sans-serif',
}

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16, filter: 'blur(4px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  transition: { duration: 0.46, delay, ease: [0.16, 1, 0.3, 1] as const },
})

const MONTH_NAMES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const MONTH_FULL  = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

const TOUR_STEPS = [
  { target: '[data-tour="metas-anual"]',      title: 'Meta anual',    description: 'Acompanhe o progresso do seu objetivo anual. A barra mostra quantos % você já atingiu.',   position: 'bottom' as const },
  { target: '[data-tour="metas-mensal"]',     title: 'Metas mensais', description: 'Clique em qualquer mês para definir sua meta. Meses com ✓ significam meta batida!',        position: 'top' as const },
  { target: '[data-tour="metas-conquistas"]', title: 'Conquistas',    description: 'Desbloqueie badges conforme você bate metas. Quanto mais consistente, mais conquistas!',    position: 'top' as const },
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
  const [editTarget, setEditTarget]     = useState('')
  const [editSuper, setEditSuper]       = useState('')
  const [saving, setSaving]             = useState(false)

  const currentMonth = new Date().getMonth() + 1
  const currentYear  = new Date().getFullYear()

  const fmt      = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const fmtShort = (v: number) => {
    if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`
    if (v >= 1_000)     return `R$ ${(v / 1_000).toFixed(1)}k`
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
    { id: 'first_goal',   emoji: '🚀', label: 'Primeiro passo',   desc: 'Definiu sua primeira meta',           unlocked: goals.some(g => g.target > 0), color: T.purple  },
    { id: 'first_hit',    emoji: '🎯', label: 'Em cheio!',         desc: 'Bateu a meta pela primeira vez',      unlocked: goals.some(g => g.hit),         color: T.green   },
    { id: 'super_hit',    emoji: '⚡', label: 'Super Cota',        desc: 'Atingiu a super cota',                unlocked: goals.some(g => g.superHit),    color: T.violet  },
    { id: 'streak_3',     emoji: '🔥', label: '3 meses seguidos',  desc: 'Bateu a meta 3 meses consecutivos',  unlocked: streak >= 3,                    color: T.orange  },
    { id: 'streak_6',     emoji: '🌟', label: '6 meses seguidos',  desc: 'Bateu a meta 6 meses consecutivos',  unlocked: streak >= 6,                    color: T.amber   },
    { id: 'annual_50',    emoji: '📈', label: 'Metade do caminho', desc: '50% da meta anual atingida',          unlocked: annualPct >= 50,                color: T.cyan    },
    { id: 'annual_100',   emoji: '🏆', label: 'Ano batido!',       desc: 'Meta anual 100% atingida',            unlocked: annualPct >= 100,               color: T.amber   },
    { id: 'perfect_year', emoji: '💎', label: 'Ano perfeito',      desc: 'Bateu todas as metas do ano',         unlocked: monthsHit === 12,               color: T.violet  },
  ]

  const unlockedCount = badges.filter(b => b.unlocked).length
  const annualColor   = annualPct >= 100 ? T.green : annualPct >= 60 ? T.amber : T.orange

  // ── Loading skeleton ────────────────────────────────────────
  if (loadingBiz) return (
    <>
      <AcernityFonts />
      <BackgroundGrid>
        <FloatingOrbs />
        <div className="flex items-center justify-center h-64">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 animate-spin"
              style={{ borderColor: `${T.orange}25`, borderTopColor: T.orange }} />
            <p style={{ fontSize: 12, color: T.muted, fontFamily: 'DM Sans, sans-serif' }}>Carregando...</p>
          </motion.div>
        </div>
      </BackgroundGrid>
    </>
  )

  return (
    <>
      <AcernityFonts />
      <BackgroundGrid>
        <FloatingOrbs />
        <div className="flex flex-col gap-5">

          <TourTooltip active={tour.active} step={tour.step} current={tour.current} total={tour.total}
            onNext={tour.next} onPrev={tour.prev} onFinish={tour.finish} />

          {/* ── Header ─────────────────────────────────────────── */}
          <motion.div {...fadeUp(0)} className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight"
                style={{ fontFamily: 'Syne, sans-serif', color: T.text }}>
                Metas & Conquistas
              </h1>
              <p className="text-sm mt-1" style={{ color: T.muted, fontFamily: 'DM Sans, sans-serif' }}>
                {currentYear} · {monthsHit} {monthsHit === 1 ? 'mês batido' : 'meses batidos'}
                {streak > 0 && <span style={{ color: T.orange }}> · 🔥 {streak} em sequência</span>}
              </p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
              style={{ background: `${T.orange}12`, border: `1px solid ${T.orange}30` }}>
              <Trophy size={13} style={{ color: T.orange }} />
              <span className="text-xs font-bold" style={{ color: T.orange, fontFamily: 'Syne, sans-serif' }}>
                {unlockedCount}/{badges.length} conquistas
              </span>
            </div>
          </motion.div>

          {/* ── Meta anual ─────────────────────────────────────── */}
          <motion.div {...fadeUp(0.06)} data-tour="metas-anual">
            <SpotlightCard
              className="rounded-2xl"
              spotlightColor={`${annualColor}18`}
              style={{
                ...cardStyle,
                border: `1px solid ${annualPct >= 100 ? `${T.green}35` : T.border}`,
              }}
            >
              <div className="p-5 relative overflow-hidden">
                <GlowCorner color={`${annualColor}20`} position="top-right" />

                {loading ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full border-2 animate-spin shrink-0"
                      style={{ borderColor: `${T.orange}25`, borderTopColor: T.orange }} />
                    <span className="text-sm" style={{ color: T.muted, fontFamily: 'DM Sans, sans-serif' }}>
                      Carregando metas...
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between mb-4" style={{ position: 'relative', zIndex: 1 }}>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Target size={14} style={{ color: T.orange }} />
                          <span className="text-xs font-semibold uppercase tracking-widest"
                            style={{ color: T.orange, fontFamily: 'Syne, sans-serif', letterSpacing: '0.1em' }}>
                            Meta Anual {currentYear}
                          </span>
                        </div>
                        <p className="text-3xl font-bold"
                          style={{ fontFamily: 'Syne, sans-serif', color: annualColor, textShadow: `0 0 24px ${annualColor}55` }}>
                          {Math.round(annualPct)}%
                        </p>
                        <p className="text-sm mt-1" style={{ color: T.sub, fontFamily: 'DM Sans, sans-serif' }}>
                          {fmtShort(annualRevenue)}
                          {annualTarget > 0 && <span style={{ color: T.muted }}> / {fmtShort(annualTarget)}</span>}
                        </p>
                      </div>

                      {/* Ring */}
                      <div className="relative w-16 h-16">
                        <svg viewBox="0 0 64 64" className="w-16 h-16 -rotate-90">
                          <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
                          <motion.circle cx="32" cy="32" r="26" fill="none" stroke={annualColor} strokeWidth="5" strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 26}`}
                            initial={{ strokeDashoffset: 2 * Math.PI * 26 }}
                            animate={{ strokeDashoffset: 2 * Math.PI * 26 * (1 - Math.min(annualPct, 100) / 100) }}
                            transition={{ duration: 1.2, ease: 'easeOut' }}
                            style={{ filter: `drop-shadow(0 0 6px ${annualColor}80)` }} />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <TrendingUp size={16} style={{ color: annualColor }} />
                        </div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)', position: 'relative', zIndex: 1 }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(annualPct, 100)}%` }}
                        transition={{ duration: 1.2, ease: 'easeOut' }} className="h-full rounded-full"
                        style={{ background: `linear-gradient(90deg, ${annualColor}70, ${annualColor})`, boxShadow: `0 0 8px ${annualColor}60` }} />
                    </div>
                  </>
                )}
              </div>
            </SpotlightCard>
          </motion.div>

          {/* ── Grade mensal ───────────────────────────────────── */}
          <motion.div {...fadeUp(0.12)} data-tour="metas-mensal">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-sm" style={{ fontFamily: 'Syne, sans-serif', color: T.text }}>
                Metas mensais
              </h2>
              <p className="text-xs" style={{ color: T.muted, fontFamily: 'DM Sans, sans-serif' }}>Clique para editar</p>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="rounded-2xl animate-pulse"
                    style={{ height: 96, background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.border}` }} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                {goals.map((g, i) => {
                  const isCurrent = g.month === currentMonth
                  const isFuture  = g.month > currentMonth
                  const color     = g.superHit ? T.violet : g.hit ? T.green : g.pct >= 80 ? T.amber : g.pct >= 50 ? T.orange : T.red
                  const hasGoal   = g.target > 0

                  return (
                    <motion.div key={g.month}
                      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.03 }}>
                      <SpotlightCard
                        className="rounded-2xl w-full"
                        spotlightColor={hasGoal ? `${color}18` : `${T.purple}12`}
                        style={{
                          ...cardStyle,
                          border: `1px solid ${isCurrent ? `${T.orange}28` : hasGoal && g.hit ? `${color}28` : T.border}`,
                          opacity: isFuture && !hasGoal ? 0.42 : 1,
                          background: isCurrent ? `${T.orange}07` : T.bg,
                          cursor: 'pointer',
                        }}
                      >
                        <motion.div
                          whileHover={{ scale: 1.0 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => openEdit(g.month)}
                          className="p-4 relative overflow-hidden text-left w-full"
                        >
                          {/* Pulse dot — mês atual */}
                          {isCurrent && (
                            <div className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full animate-pulse"
                              style={{ background: T.orange, boxShadow: `0 0 6px ${T.orange}` }} />
                          )}

                          {/* Glow on hit */}
                          {hasGoal && g.hit && <GlowCorner color={`${color}20`} position="bottom-right" />}

                          <div className="flex items-center justify-between mb-2" style={{ position: 'relative', zIndex: 1 }}>
                            <span className="text-xs font-bold"
                              style={{ color: isCurrent ? T.orange : T.sub, fontFamily: 'Syne, sans-serif' }}>
                              {MONTH_NAMES[g.month - 1]}
                            </span>
                            {g.superHit && <span className="text-xs">⚡</span>}
                            {g.hit && !g.superHit && <span className="text-xs" style={{ color: T.green }}>✓</span>}
                            {!hasGoal && <span className="text-xs" style={{ color: T.muted }}>—</span>}
                          </div>

                          {hasGoal ? (
                            <div style={{ position: 'relative', zIndex: 1 }}>
                              <p className="text-sm font-bold"
                                style={{ fontFamily: 'Syne, sans-serif', color: isFuture ? T.muted : color, textShadow: !isFuture ? `0 0 12px ${color}50` : 'none' }}>
                                {Math.round(g.pct)}%
                              </p>
                              <p className="text-xs mt-0.5 truncate" style={{ color: T.muted, fontFamily: 'DM Sans, sans-serif' }}>
                                {fmtShort(g.revenue)} / {fmtShort(g.target)}
                              </p>
                              {!isFuture && (
                                <div className="h-1 rounded-full mt-2 overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                                  <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(g.pct, 100)}%` }}
                                    transition={{ duration: 0.7, delay: i * 0.03 }} className="h-full rounded-full"
                                    style={{ background: color, boxShadow: `0 0 6px ${color}60` }} />
                                </div>
                              )}
                              {g.super_target && g.super_target > 0 && (
                                <div className="flex items-center gap-1 mt-1.5">
                                  <Zap size={9} style={{ color: T.violet }} />
                                  <span className="text-xs" style={{ color: T.muted, fontFamily: 'DM Sans, sans-serif' }}>
                                    {fmtShort(g.super_target)}
                                  </span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs mt-1" style={{ color: T.muted, fontFamily: 'DM Sans, sans-serif' }}>
                              {isFuture ? 'Definir meta' : 'Sem meta'}
                            </p>
                          )}
                        </motion.div>
                      </SpotlightCard>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </motion.div>

          {/* ── Conquistas ─────────────────────────────────────── */}
          <motion.div {...fadeUp(0.18)} data-tour="metas-conquistas">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="font-bold text-sm" style={{ fontFamily: 'Syne, sans-serif', color: T.text }}>Conquistas</h2>
              <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                style={{ background: `${T.amber}12`, color: T.amber, border: `1px solid ${T.amber}25` }}>
                {unlockedCount}/{badges.length}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {badges.map((b, i) => (
                <motion.div key={b.id} {...fadeUp(0.20 + i * 0.04)}>
                  <SpotlightCard
                    className="rounded-2xl"
                    spotlightColor={b.unlocked ? `${b.color}20` : 'rgba(255,255,255,0.04)'}
                    style={{
                      ...cardStyle,
                      border: `1px solid ${b.unlocked ? `${b.color}25` : T.border}`,
                      background: b.unlocked ? `${b.color}07` : 'rgba(255,255,255,0.02)',
                      opacity: b.unlocked ? 1 : 0.38,
                    }}
                  >
                    <div className="p-4 flex flex-col items-center text-center gap-2 relative overflow-hidden">
                      {b.unlocked && (
                        <>
                          <GlowCorner color={`${b.color}25`} position="top-right" />
                          <div className="absolute top-2 right-2">
                            <CheckCircle2 size={11} style={{ color: b.color }} />
                          </div>
                        </>
                      )}
                      <span className="text-3xl" style={{ filter: b.unlocked ? 'none' : 'grayscale(1)', position: 'relative', zIndex: 1 }}>
                        {b.unlocked ? b.emoji : '🔒'}
                      </span>
                      <div style={{ position: 'relative', zIndex: 1 }}>
                        <p className="text-xs font-bold leading-tight"
                          style={{ color: b.unlocked ? b.color : T.muted, fontFamily: 'Syne, sans-serif' }}>
                          {b.label}
                        </p>
                        <p className="text-xs mt-1 leading-relaxed" style={{ color: T.muted, fontFamily: 'DM Sans, sans-serif' }}>
                          {b.desc}
                        </p>
                      </div>
                    </div>
                  </SpotlightCard>
                </motion.div>
              ))}
            </div>
          </motion.div>

        </div>

        {/* ── Modal edição ────────────────────────────────────── */}
        <AnimatePresence>
          {editingMonth !== null && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
              style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(10px)' }}
              onClick={e => { if (e.target === e.currentTarget) setEditingMonth(null) }}>

              <motion.div
                initial={{ y: 60, opacity: 0, scale: 0.97 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 60, opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as const }}
                className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6"
                style={{
                  background: T.bgDeep,
                  border: `1px solid ${T.borderP}`,
                  backdropFilter: 'blur(28px)',
                  boxShadow: `0 0 0 1px rgba(124,110,247,0.08), 0 -8px 60px rgba(0,0,0,0.8)`,
                }}>

                <div className="w-10 h-1 rounded-full mx-auto mb-5 sm:hidden"
                  style={{ background: 'rgba(255,255,255,0.1)' }} />

                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="font-bold text-lg" style={{ fontFamily: 'Syne, sans-serif', color: T.text }}>
                      Meta de {MONTH_FULL[editingMonth - 1]}
                    </h2>
                    <p className="text-xs mt-0.5" style={{ color: T.muted, fontFamily: 'DM Sans, sans-serif' }}>{currentYear}</p>
                  </div>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => setEditingMonth(null)}
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.05)', color: T.sub, border: `1px solid ${T.border}`, cursor: 'pointer' }}>
                    <X size={14} />
                  </motion.button>
                </div>

                <div className="flex flex-col gap-4">
                  <div>
                    <label className="text-xs font-semibold mb-2 flex items-center gap-1.5"
                      style={{ color: T.orange, fontFamily: 'Syne, sans-serif' }}>
                      <Target size={12} /> Meta de receita (R$)
                    </label>
                    <input type="number" step="0.01" placeholder="Ex: 10000" value={editTarget}
                      onChange={e => setEditTarget(e.target.value)} style={inputStyle}
                      onFocus={e => e.currentTarget.style.borderColor = T.orange}
                      onBlur={e => e.currentTarget.style.borderColor = T.border} />
                  </div>

                  <PlanGate currentPlan={plan} requiredPlan="starter" feature="Super Cota"
                    description="Defina uma meta bônus extra ambiciosa. Disponível no plano Starter." mode="hide">
                    <div>
                      <label className="text-xs font-semibold mb-2 flex items-center gap-1.5"
                        style={{ color: T.violet, fontFamily: 'Syne, sans-serif' }}>
                        <Zap size={12} /> Super Cota (R$)
                        <span className="font-normal" style={{ color: T.muted }}> — opcional</span>
                      </label>
                      <input type="number" step="0.01" placeholder="Ex: 15000" value={editSuper}
                        onChange={e => setEditSuper(e.target.value)} style={inputStyle}
                        onFocus={e => e.currentTarget.style.borderColor = T.violet}
                        onBlur={e => e.currentTarget.style.borderColor = T.border} />
                      <p className="text-xs mt-1.5" style={{ color: T.muted, fontFamily: 'DM Sans, sans-serif' }}>
                        Meta bônus extra — desbloqueie o badge ⚡ ao atingir
                      </p>
                    </div>
                  </PlanGate>

                  <div className="flex gap-3 mt-1">
                    <button onClick={() => setEditingMonth(null)}
                      className="flex-1 py-3 rounded-xl text-sm font-semibold"
                      style={{ background: 'rgba(255,255,255,0.04)', color: T.sub, border: `1px solid ${T.border}`, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                      Cancelar
                    </button>
                    <ShimmerButton
                      onClick={handleSave}
                      disabled={saving}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold"
                      style={{
                        background: `linear-gradient(135deg, ${T.orange}, #fb923c)`,
                        color: 'white',
                        border: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: saving ? 'none' : `0 0 28px ${T.orange}45`,
                        cursor: saving ? 'not-allowed' : 'pointer',
                        opacity: saving ? 0.7 : 1,
                        fontFamily: 'Syne, sans-serif',
                      }}>
                      {saving
                        ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        : <><Save size={14} /> Salvar meta</>}
                    </ShimmerButton>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </BackgroundGrid>
    </>
  )
}
