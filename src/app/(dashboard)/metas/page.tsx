'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useGoals } from '@/hooks/useGoals'
import { useBusiness } from '@/hooks/useBusiness'
import { useTour } from '@/hooks/useTour'
import { usePlanLimits } from '@/hooks/usePlanLimits'
import { TourTooltip } from "@/components/TourTooltip"
import { PlanGate } from '@/components/PlanGate'
import { motion, AnimatePresence } from 'framer-motion'
import { Target, Zap, Trophy, CheckCircle2, TrendingUp, X, Save } from 'lucide-react'
import { SpotlightCard, ShimmerButton, Skeleton, GlowCorner } from '@/components/ui/bossflow-ui'

// ── Design System ──────────────────────────────────────────────────────────
import { T, card, inp, inpLg, inpSm, SYNE } from '@/lib/design'
import { fadeUp, scaleIn } from '@/lib/animations'

import { PageBackground, SectionHeader, FormModal, ModalSubmitButton } from '@/components/core'
const MONTH_NAMES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const MONTH_FULL  = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

const TOUR_STEPS = [
  { target: '[data-tour="metas-anual"]',      title: 'Meta anual',      description: 'Acompanhe o progresso do seu objetivo anual. A barra mostra quantos % você já atingiu.', position: 'bottom' as const },
  { target: '[data-tour="metas-mensal"]',     title: 'Metas mensais',   description: 'Clique em qualquer mês para definir sua meta. Meses com ✓ significam meta batida!', position: 'top' as const },
  { target: '[data-tour="metas-conquistas"]', title: 'Conquistas',      description: 'Desbloqueie badges conforme você bate metas. Quanto mais consistente, mais conquistas!', position: 'top' as const },
]

// ─── Skeleton ─────────────────────────────────────────────────
function MetasSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-48 rounded-xl" />
          <Skeleton className="h-4 w-56 rounded-lg" />
        </div>
        <Skeleton className="h-8 w-32 rounded-xl" />
      </div>
      <Skeleton className="h-36 w-full rounded-2xl" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
        {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
      </div>
    </div>
  )
}

// ── FIX: supabase client criado fora do componente (evita recriação a cada render)
const supabase = createClient()

export default function MetasPage() {
  // ── FIX: usar useBusiness (suporta owner + member, não só owner)
  const { businessId, loading: loadingBiz } = useBusiness()
  const { plan } = usePlanLimits()
  const tour = useTour('metas', TOUR_STEPS)

  const { goals, loading, saveGoal, annualTarget, annualRevenue, annualPct, monthsHit, streak } = useGoals(businessId)

  const [editingMonth, setEditingMonth] = useState<number | null>(null)
  const [editTarget, setEditTarget]     = useState('')
  const [editSuper, setEditSuper]       = useState('')
  const [saving, setSaving]             = useState(false)

  const currentMonth = new Date().getMonth() + 1
  const currentYear  = new Date().getFullYear()

  const fmt      = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const fmtShort = (v: number) => {
    if (v >= 1000000) return `R$ ${(v / 1000000).toFixed(1)}M`
    if (v >= 1000)    return `R$ ${(v / 1000).toFixed(1)}k`
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
    { id: 'first_goal',   emoji: '🚀', label: 'Primeiro passo',      desc: 'Definiu sua primeira meta',               unlocked: goals.some(g => g.target > 0),   color: T.purple  },
    { id: 'first_hit',    emoji: '🎯', label: 'Em cheio!',            desc: 'Bateu a meta pela primeira vez',           unlocked: goals.some(g => g.hit),           color: T.green   },
    { id: 'super_hit',    emoji: '⚡', label: 'Super Cota',           desc: 'Atingiu a super cota',                    unlocked: goals.some(g => g.superHit),      color: T.violet  },
    { id: 'streak_3',     emoji: '🔥', label: '3 meses seguidos',     desc: 'Bateu a meta 3 meses consecutivos',        unlocked: streak >= 3,                      color: T.orange  },
    { id: 'streak_6',     emoji: '🌟', label: '6 meses seguidos',     desc: 'Bateu a meta 6 meses consecutivos',        unlocked: streak >= 6,                      color: T.amber   },
    { id: 'annual_50',    emoji: '📈', label: 'Metade do caminho',    desc: '50% da meta anual atingida',               unlocked: annualPct >= 50,                  color: T.cyan    },
    { id: 'annual_100',   emoji: '🏆', label: 'Ano batido!',          desc: 'Meta anual 100% atingida',                 unlocked: annualPct >= 100,                 color: T.amber   },
    { id: 'perfect_year', emoji: '💎', label: 'Ano perfeito',         desc: 'Bateu todas as metas do ano',              unlocked: monthsHit === 12,                 color: T.violet  },
  ]

  const unlockedCount = badges.filter(b => b.unlocked).length
  const annualColor   = annualPct >= 100 ? T.green : annualPct >= 60 ? T.amber : T.orange

  if (loadingBiz || loading) return (
    <PageBackground><MetasSkeleton /></PageBackground>
  )

  return (
    <PageBackground>
      <div className="flex flex-col gap-5">

        <TourTooltip active={tour.active} step={tour.step} current={tour.current} total={tour.total} onNext={tour.next} onPrev={tour.prev} onFinish={tour.finish} />

        {/* ── Header ─────────────────────────────────────────── */}
        <SectionHeader
          title="Metas & Conquistas"
          subtitle={`${currentYear} · ${monthsHit} ${monthsHit === 1 ? 'mês batido' : 'meses batidos'}${streak > 0 ? ` · 🔥 ${streak} em sequência` : ''}`}
          live liveColor={T.orange}
        />

        {/* ── Meta Anual ─────────────────────────────────────── */}
        <motion.div {...fadeUp(0.06)} data-tour="metas-anual">
          <SpotlightCard className="rounded-2xl" spotlightColor={`${annualColor}12`}
            style={{ ...card, border: `1px solid ${annualPct >= 100 ? `${T.green}30` : T.border}` }}>
            <div className="p-5 relative overflow-hidden">
              <GlowCorner color={`${annualColor}20`} position="bottom-right" />

              <div className="flex items-start justify-between mb-5" style={{ position: 'relative', zIndex: 1 }}>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                      style={{ background: `${T.orange}14`, border: `1px solid ${T.orange}28` }}>
                      <Target size={12} style={{ color: T.orange }} />
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-widest"
                      style={{ color: T.orange, fontFamily: SYNE, letterSpacing: '0.1em' }}>
                      Meta Anual {currentYear}
                    </span>
                  </div>
                  <p className="text-3xl font-bold" style={{ fontFamily: SYNE, color: annualColor, textShadow: `0 0 28px ${annualColor}55` }}>
                    {Math.round(annualPct)}%
                  </p>
                  <p className="text-sm mt-1" style={{ color: T.sub }}>
                    {fmtShort(annualRevenue)}
                    {annualTarget > 0 && <span style={{ color: T.muted }}> / {fmtShort(annualTarget)}</span>}
                  </p>
                </div>

                {/* Círculo SVG */}
                <div className="relative w-16 h-16 shrink-0">
                  <svg viewBox="0 0 64 64" className="w-16 h-16 -rotate-90">
                    <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5" />
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

              {/* Barra */}
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)', position: 'relative', zIndex: 1 }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(annualPct, 100)}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut' }} className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${annualColor}80, ${annualColor})`, boxShadow: `0 0 8px ${annualColor}60` }} />
              </div>
            </div>
          </SpotlightCard>
        </motion.div>

        {/* ── Grade Mensal ────────────────────────────────────── */}
        <motion.div {...fadeUp(0.1)} data-tour="metas-mensal">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-sm" style={{ fontFamily: SYNE, color: T.text }}>Metas mensais</h2>
            <p className="text-xs" style={{ color: T.muted }}>Clique para editar</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {goals.map((g, i) => {
              const isCurrent = g.month === currentMonth
              const isFuture  = g.month > currentMonth
              const hasGoal   = g.target > 0
              const color     = g.superHit ? T.violet : g.hit ? T.green : g.pct >= 80 ? T.amber : g.pct >= 50 ? T.orange : T.red

              return (
                <motion.button key={g.month}
                  initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.03, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ scale: 1.025, y: -2 }} whileTap={{ scale: 0.97 }}
                  onClick={() => openEdit(g.month)}
                  className="rounded-2xl p-4 text-left relative overflow-hidden"
                  style={{
                    background: isCurrent ? `${T.orange}07` : T.bg,
                    border: `1px solid ${isCurrent ? `${T.orange}30` : hasGoal && g.hit ? `${color}25` : T.border}`,
                    backdropFilter: T.blur,
                    boxShadow: isCurrent ? `0 0 20px ${T.orange}10` : 'none',
                    opacity: isFuture && !hasGoal ? 0.5 : 1,
                    cursor: 'pointer',
                  }}>

                  {/* Dot mês atual */}
                  {isCurrent && (
                    <div className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full"
                      style={{ background: T.orange, boxShadow: `0 0 6px ${T.orange}`, animation: 'loader-pulse 1.5s ease-in-out infinite' }} />
                  )}

                  {/* Glow de fundo no hit */}
                  {hasGoal && g.hit && !isFuture && (
                    <div className="absolute -bottom-4 -right-4 w-16 h-16 rounded-full blur-xl pointer-events-none"
                      style={{ background: `${color}18` }} />
                  )}

                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold" style={{ color: isCurrent ? T.orange : T.muted, fontFamily: SYNE }}>
                      {MONTH_NAMES[g.month - 1]}
                    </span>
                    {g.superHit  && <span className="text-xs">⚡</span>}
                    {g.hit && !g.superHit && <CheckCircle2 size={11} style={{ color: T.green }} />}
                    {!hasGoal    && <span className="text-xs" style={{ color: T.muted }}>—</span>}
                  </div>

                  {hasGoal ? (
                    <>
                      <p className="text-sm font-bold" style={{ fontFamily: SYNE, color: isFuture ? T.muted : color }}>
                        {Math.round(g.pct)}%
                      </p>
                      <p className="text-xs mt-0.5 truncate" style={{ color: T.muted }}>
                        {fmtShort(g.revenue)} / {fmtShort(g.target)}
                      </p>
                      {!isFuture && (
                        <div className="h-1 rounded-full mt-2 overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                          <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(g.pct, 100)}%` }}
                            transition={{ duration: 0.7, delay: i * 0.03 }}
                            className="h-full rounded-full"
                            style={{ background: color, boxShadow: `0 0 6px ${color}60` }} />
                        </div>
                      )}
                      {g.super_target && g.super_target > 0 && (
                        <div className="flex items-center gap-1 mt-1.5">
                          <Zap size={9} style={{ color: T.violet }} />
                          <span className="text-xs" style={{ color: T.muted }}>{fmtShort(g.super_target)}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-xs mt-1" style={{ color: T.muted }}>
                      {isFuture ? 'Definir meta' : 'Sem meta'}
                    </p>
                  )}
                </motion.button>
              )
            })}
          </div>
        </motion.div>

        {/* ── Conquistas ──────────────────────────────────────── */}
        <motion.div {...fadeUp(0.14)} data-tour="metas-conquistas">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="font-bold text-sm" style={{ fontFamily: SYNE, color: T.text }}>Conquistas</h2>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold"
              style={{ background: `${T.amber}10`, color: T.amber, border: `1px solid ${T.amber}22` }}>
              {unlockedCount}/{badges.length}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {badges.map((b, i) => (
              <motion.div key={b.id}
                initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.14 + i * 0.04, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-2xl p-4 flex flex-col items-center text-center gap-2 relative overflow-hidden"
                style={{
                  background: b.unlocked ? `${b.color}07` : 'rgba(8,8,14,0.7)',
                  border: `1px solid ${b.unlocked ? `${b.color}22` : T.border}`,
                  backdropFilter: T.blur,
                  boxShadow: b.unlocked ? `0 0 20px ${b.color}10` : 'none',
                  opacity: b.unlocked ? 1 : 0.4,
                }}>

                {b.unlocked && (
                  <div className="absolute -top-5 -right-5 w-20 h-20 rounded-full blur-2xl pointer-events-none"
                    style={{ background: `${b.color}18` }} />
                )}

                <span className="text-3xl" style={{ filter: b.unlocked ? `drop-shadow(0 0 8px ${b.color}60)` : 'none' }}>
                  {b.unlocked ? b.emoji : '🔒'}
                </span>

                <div>
                  <p className="text-xs font-bold leading-tight" style={{ color: b.unlocked ? b.color : T.muted }}>
                    {b.label}
                  </p>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: T.muted }}>{b.desc}</p>
                </div>

                {b.unlocked && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle2 size={11} style={{ color: b.color }} />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Modal: Edição de meta ───────────────────────────── */}
                <FormModal
          open={editingMonth !== null}
          onClose={() => setEditingMonth(null)}
          title={editingMonth !== null ? `Meta de ${MONTH_FULL[editingMonth - 1]}` : ''}
          size="sm"
        >
          {/* Custom header extra: subtitle e ícone */}
          <div className="flex items-center gap-3 mb-5 -mt-1">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: `${T.orange}14`, border: `1px solid ${T.orange}28` }}>
              <Target size={14} style={{ color: T.orange }} />
            </div>
            <p className="text-xs" style={{ color: T.muted }}>{currentYear}</p>
          </div>

<div className="flex flex-col gap-4">
          {/* Meta principal */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold mb-2"
              style={{ color: T.orange, fontFamily: SYNE, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              <Target size={11} /> Meta de receita (R$)
            </label>
            <input type="number" step="0.01" placeholder="Ex: 10000" value={editTarget}
              onChange={e => setEditTarget(e.target.value)}
              style={inp}
              onFocus={e => e.currentTarget.style.borderColor = T.orange}
              onBlur={e => e.currentTarget.style.borderColor = T.border} />
          </div>

          {/* Super Cota — Starter+ */}
          <PlanGate currentPlan={plan} requiredPlan="starter" feature="Super Cota"
            description="Defina uma meta bônus extra ambiciosa. Disponível no plano Starter." mode="hide">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold mb-2"
                style={{ color: T.violet, fontFamily: SYNE, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                <Zap size={11} /> Super Cota (R$)
                <span className="font-normal normal-case tracking-normal" style={{ color: T.muted }}>— opcional</span>
              </label>
              <input type="number" step="0.01" placeholder="Ex: 15000" value={editSuper}
                onChange={e => setEditSuper(e.target.value)}
                style={inp}
                onFocus={e => e.currentTarget.style.borderColor = T.violet}
                onBlur={e => e.currentTarget.style.borderColor = T.border} />
              <p className="text-xs mt-1.5" style={{ color: T.muted }}>
                Meta bônus — desbloqueie o badge ⚡ ao atingir
              </p>
            </div>
          </PlanGate>
          </div>

          <div className="flex gap-3 mt-1">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => setEditingMonth(null)}
              className="flex-1 py-3 rounded-xl text-sm font-semibold"
              style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}`, color: T.sub, cursor: 'pointer' }}>
              Cancelar
            </motion.button>

            <ShimmerButton onClick={handleSave} disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold"
              style={{ background: `linear-gradient(135deg, ${T.orange}, #fb923c)`, color: 'white', boxShadow: saving ? 'none' : `0 0 24px ${T.orange}40`, border: '1px solid rgba(255,255,255,0.1)', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving
                ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                : <><Save size={14} /> Salvar meta</>}
            </ShimmerButton>
          </div>
        </FormModal>

      </div>
    </PageBackground>
  )
}
