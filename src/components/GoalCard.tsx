'use client'

import { motion } from 'framer-motion'
import { Target, Zap, ArrowRight, Plus, TrendingUp } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { GoalWithProgress } from '@/hooks/useGoals'
import { SpotlightCard, GlowCorner } from '@/components/ui/aceternity'

// ─── Tokens (alinhados com o sistema global) ───────────────
const T = {
  bg: 'rgba(8,8,14,0.92)', bgDeep: 'rgba(6,6,10,0.97)',
  border: 'rgba(255,255,255,0.055)', borderP: 'rgba(124,110,247,0.22)',
  text: '#dcdcf0', sub: '#8a8aaa', muted: '#4a4a6a',
  green: '#34d399', purple: '#7c6ef7', violet: '#a78bfa',
  red: '#f87171', amber: '#fbbf24', blur: 'blur(20px)',
}
const card = {
  background: T.bg, border: `1px solid ${T.border}`,
  backdropFilter: T.blur,
  boxShadow: '0 4px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)',
}

interface GoalCardProps {
  goal: GoalWithProgress | undefined
  onSetGoal?: () => void
}

export function GoalCard({ goal, onSetGoal }: GoalCardProps) {
  const router = useRouter()
  const fmt      = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const fmtShort = (v: number) => {
    if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`
    if (v >= 1_000)     return `R$ ${(v / 1_000).toFixed(1)}k`
    return fmt(v)
  }
  const monthName = new Date().toLocaleDateString('pt-BR', { month: 'long' })

  // ── Sem meta ───────────────────────────────────────────────
  if (!goal || goal.target === 0) {
    return (
      <SpotlightCard className="rounded-2xl h-full" spotlightColor={`${T.purple}14`} style={card}>
        <div className="p-5 flex flex-col gap-3 h-full relative overflow-hidden">
          <GlowCorner color={`${T.purple}18`} position="bottom-right" />
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: `${T.purple}14`, border: `1px solid ${T.purple}25` }}>
              <Target size={12} style={{ color: T.violet }} />
            </div>
            <span className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: T.muted, fontFamily: 'Syne, sans-serif' }}>
              Meta de {monthName}
            </span>
          </div>
          <p className="text-sm leading-relaxed flex-1" style={{ color: T.muted, fontFamily: 'DM Sans, sans-serif' }}>
            Sem meta definida para este mês.
          </p>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={onSetGoal || (() => router.push('/metas'))}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold self-start"
            style={{ background: `${T.purple}10`, color: T.violet, border: `1px solid ${T.purple}28`, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
            <Plus size={13} /> Definir meta
          </motion.button>
        </div>
      </SpotlightCard>
    )
  }

  const pct         = goal.pct
  const superPct    = goal.superPct ?? 0
  const hasSuperTarget = !!goal.super_target && goal.super_target > 0

  // Cor baseada no progresso — sem laranja saturado
  const mainColor = goal.hit
    ? T.green
    : pct >= 80
    ? T.amber
    : pct >= 40
    ? T.violet
    : T.red

  const superColor  = '#a78bfa'
  const mainBarPct  = Math.min(pct, 100)

  const spotColor = goal.superHit ? superColor : goal.hit ? T.green : mainColor
  const borderColor = goal.superHit
    ? 'rgba(167,139,250,0.2)'
    : goal.hit
    ? 'rgba(52,211,153,0.18)'
    : T.border

  return (
    <SpotlightCard className="rounded-2xl h-full" spotlightColor={`${spotColor}14`}
      style={{ ...card, border: `1px solid ${borderColor}` }}>
      <div className="p-5 relative overflow-hidden flex flex-col gap-4 h-full">

        {/* Glow de fundo sutil quando meta batida */}
        {(goal.hit || goal.superHit) && (
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full blur-3xl pointer-events-none"
            style={{ background: goal.superHit ? 'rgba(167,139,250,0.07)' : 'rgba(52,211,153,0.06)' }} />
        )}

        <GlowCorner color={`${spotColor}18`} position="bottom-right" />

        {/* Header */}
        <div className="flex items-start justify-between" style={{ position: 'relative', zIndex: 1 }}>
          <div className="flex flex-col gap-1.5">
            {/* Label */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ background: `${mainColor}14`, border: `1px solid ${mainColor}25` }}>
                <Target size={11} style={{ color: mainColor }} />
              </div>
              <span className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: T.muted, fontFamily: 'Syne, sans-serif' }}>
                Meta de {monthName}
              </span>
              {goal.superHit && (
                <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-bold"
                  style={{ background: 'rgba(167,139,250,0.1)', color: superColor, border: '1px solid rgba(167,139,250,0.22)' }}>
                  <Zap size={9} /> Super!
                </span>
              )}
              {goal.hit && !goal.superHit && (
                <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                  style={{ background: 'rgba(52,211,153,0.1)', color: T.green, border: '1px solid rgba(52,211,153,0.22)' }}>
                  ✓ Batida
                </span>
              )}
            </div>

            {/* Valor atual */}
            <p className="text-2xl font-extrabold"
              style={{ fontFamily: 'Syne, sans-serif', color: mainColor, letterSpacing: '-0.02em' }}>
              {fmtShort(goal.revenue)}
            </p>
          </div>

          <motion.button whileHover={{ x: 2 }} onClick={() => router.push('/metas')}
            className="text-xs flex items-center gap-1 shrink-0"
            style={{ color: T.muted, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
            Ver metas <ArrowRight size={11} />
          </motion.button>
        </div>

        {/* Barra principal */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs" style={{ color: T.muted, fontFamily: 'DM Sans, sans-serif' }}>
              Meta: {fmtShort(goal.target)}
            </span>
            <span className="text-xs font-bold" style={{ color: mainColor, fontFamily: 'Syne, sans-serif' }}>
              {Math.round(pct)}%
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.055)' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${mainBarPct}%` }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] as const }}
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${mainColor}88, ${mainColor})`, boxShadow: `0 0 8px ${mainColor}66` }}
            />
          </div>
        </div>

        {/* Barra super cota */}
        {hasSuperTarget && (
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <Zap size={10} style={{ color: superColor }} />
                <span className="text-xs" style={{ color: T.muted, fontFamily: 'DM Sans, sans-serif' }}>
                  Super: {fmtShort(goal.super_target!)}
                </span>
              </div>
              <span className="text-xs font-bold" style={{ color: superColor, fontFamily: 'Syne, sans-serif' }}>
                {Math.round(superPct)}%
              </span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.055)' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(superPct, 100)}%` }}
                transition={{ duration: 1.1, delay: 0.12, ease: [0.16, 1, 0.3, 1] as const }}
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${superColor}55, ${superColor})`, boxShadow: `0 0 6px ${superColor}55` }}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto" style={{ position: 'relative', zIndex: 1 }}>
          {!goal.hit && goal.target > 0 && (
            <div className="flex items-center gap-1.5">
              <TrendingUp size={11} style={{ color: T.muted }} />
              <p className="text-xs" style={{ color: T.muted, fontFamily: 'DM Sans, sans-serif' }}>
                Faltam{' '}
                <span style={{ color: T.sub, fontWeight: 600 }}>{fmtShort(goal.target - goal.revenue)}</span>
                {' '}para bater a meta
              </p>
            </div>
          )}
          {goal.hit && !goal.superHit && hasSuperTarget && (
            <p className="text-xs" style={{ color: 'rgba(167,139,250,0.55)', fontFamily: 'DM Sans, sans-serif' }}>
              Faltam {fmtShort(goal.super_target! - goal.revenue)} para a super cota
            </p>
          )}
          {goal.superHit && (
            <p className="text-xs" style={{ color: T.green, fontFamily: 'DM Sans, sans-serif' }}>
              🎯 Todas as metas batidas!
            </p>
          )}
        </div>
      </div>
    </SpotlightCard>
  )
}
