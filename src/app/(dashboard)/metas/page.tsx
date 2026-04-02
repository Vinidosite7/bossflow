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
import { Target, Zap, CheckCircle2, TrendingUp, X, Save, Award, Calendar, BarChart2, Flame } from 'lucide-react'
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

        {/* ── Resumo Anual ─────────────────────────────────────── */}
        <motion.div {...fadeUp(0.14)}>
          <h2 className="font-bold text-sm mb-3" style={{ fontFamily: SYNE, color: T.text }}>
            Resumo {currentYear}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Faturamento total */}
            <div className="rounded-2xl p-4 flex flex-col gap-2 relative overflow-hidden"
              style={{ background: `${T.green}07`, border: `1px solid ${T.green}20` }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: `${T.green}12`, border: `1px solid ${T.green}25` }}>
                <BarChart2 size={14} style={{ color: T.green }} />
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: T.muted }}>Faturamento total</p>
                <p className="text-base font-bold mt-0.5" style={{ fontFamily: SYNE, color: T.text }}>
                  {fmtShort(annualRevenue)}
                </p>
              </div>
            </div>

            {/* Meses batidos */}
            <div className="rounded-2xl p-4 flex flex-col gap-2 relative overflow-hidden"
              style={{ background: `${T.orange}07`, border: `1px solid ${T.orange}20` }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: `${T.orange}12`, border: `1px solid ${T.orange}25` }}>
                <Award size={14} style={{ color: T.orange }} />
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: T.muted }}>Meses batidos</p>
                <p className="text-base font-bold mt-0.5" style={{ fontFamily: SYNE, color: T.text }}>
                  {monthsHit}<span className="text-sm font-normal" style={{ color: T.muted }}>/12</span>
                </p>
              </div>
            </div>

            {/* Melhor mês */}
            {(() => {
              const mesesComMeta = goals.filter(g => g.target > 0 && g.revenue > 0)
              const melhor = mesesComMeta.reduce((a, b) => b.revenue > a.revenue ? b : a, mesesComMeta[0])
              return (
                <div className="rounded-2xl p-4 flex flex-col gap-2 relative overflow-hidden"
                  style={{ background: `${T.violet}07`, border: `1px solid ${T.violet}20` }}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: `${T.violet}12`, border: `1px solid ${T.violet}25` }}>
                    <Calendar size={14} style={{ color: T.violet }} />
                  </div>
                  <div>
                    <p className="text-xs font-medium" style={{ color: T.muted }}>Melhor mês</p>
                    <p className="text-base font-bold mt-0.5" style={{ fontFamily: SYNE, color: T.text }}>
                      {melhor ? MONTH_NAMES[melhor.month - 1] : '—'}
                    </p>
                    {melhor && (
                      <p className="text-xs" style={{ color: T.muted }}>{fmtShort(melhor.revenue)}</p>
                    )}
                  </div>
                </div>
              )
            })()}

            {/* Sequência */}
            <div className="rounded-2xl p-4 flex flex-col gap-2 relative overflow-hidden"
              style={{ background: streak > 0 ? `${T.amber}07` : 'rgba(255,255,255,0.02)', border: `1px solid ${streak > 0 ? `${T.amber}20` : T.border}` }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: streak > 0 ? `${T.amber}12` : 'rgba(255,255,255,0.04)', border: `1px solid ${streak > 0 ? `${T.amber}25` : T.border}` }}>
                <Flame size={14} style={{ color: streak > 0 ? T.amber : T.muted }} />
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: T.muted }}>Sequência atual</p>
                <p className="text-base font-bold mt-0.5" style={{ fontFamily: SYNE, color: streak > 0 ? T.text : T.muted }}>
                  {streak > 0 ? `${streak} ${streak === 1 ? 'mês' : 'meses'}` : '—'}
                </p>
                {streak > 0 && <p className="text-xs" style={{ color: T.muted }}>consecutivos 🔥</p>}
              </div>
            </div>
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
