'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Target, Zap, ArrowRight, Plus } from 'lucide-react'
import { SpotlightCard, GlowCorner } from '@/components/ui/bossflow-ui'

// ─── Design tokens (espelho do dashboard) ──────────────────────────────────
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
  purple:  '#7c6ef7',
  violet:  '#a78bfa',
  blur:    'blur(20px)',
}

const card = {
  background:     T.bg,
  border:         `1px solid ${T.border}`,
  backdropFilter: T.blur,
  boxShadow:      '0 4px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)',
}

// ─── Barra de progresso animada ────────────────────────────────────────────
function ProgressBar({
  value,
  color,
  delay = 0,
}: {
  value: number
  color: string
  delay?: number
}) {
  const pct = Math.min(Math.max(value, 0), 100)
  return (
    <div
      className="h-1.5 rounded-full overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.06)' }}
    >
      <motion.div
        className="h-full rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 1.1, delay, ease: [0.16, 1, 0.3, 1] }}
        style={{
          background: `linear-gradient(90deg, ${color}88, ${color})`,
          boxShadow:  pct > 0 ? `0 0 10px ${color}60` : 'none',
        }}
      />
    </div>
  )
}

// ─── Anel circular de progresso ────────────────────────────────────────────
function RingProgress({
  value,
  color,
  size = 56,
}: {
  value: number
  color: string
  size?: number
}) {
  const pct    = Math.min(Math.max(value, 0), 100)
  const r      = (size - 6) / 2
  const circ   = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      {/* Track */}
      <circle cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={3} />
      {/* Progress */}
      <motion.circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.3, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        style={{ filter: `drop-shadow(0 0 4px ${color}88)` }}
      />
    </svg>
  )
}

// ─── Helpers ───────────────────────────────────────────────────────────────
const fmtShort = (v: number) => {
  if (v >= 1e6) return `R$ ${(v / 1e6).toFixed(1)}M`
  if (v >= 1e3) return `R$ ${(v / 1e3).toFixed(1)}k`
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// ─── Componente principal ──────────────────────────────────────────────────
// Tipagem espelha GoalWithProgress do useGoals hook
interface Goal {
  id?:          string
  target:       number        // meta principal
  super_target?: number | null // super cota
  revenue:      number        // faturamento atual do mês
  pct:          number        // % da meta (0-999)
  superPct?:    number | null // % da super cota
  hit:          boolean       // meta batida
  superHit:     boolean       // super cota batida
  month?:       number
  year?:        number
}

interface GoalCardProps {
  goal:            Goal | null | undefined
  onSetGoal?:      () => void
  currentRevenue?: number  // override: passa stats.income do dashboard
}

export function GoalCard({ goal, onSetGoal, currentRevenue }: GoalCardProps) {
  const monthLabel = new Date().toLocaleDateString('pt-BR', { month: 'long' }).toUpperCase()

  // ─── Estado: sem meta cadastrada ─────────────────────────────────────────
  if (!goal) {
    return (
      <SpotlightCard
        className="rounded-2xl h-full"
        spotlightColor={`${T.amber}12`}
        style={card}
      >
        <div className="p-5 relative overflow-hidden h-full flex flex-col items-center justify-center gap-3 text-center">
          <GlowCorner color={`${T.amber}18`} position="bottom-right" />

          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center"
            style={{
              background: `${T.amber}10`,
              border:     `1px solid ${T.amber}25`,
              boxShadow:  `0 0 20px ${T.amber}18`,
            }}
          >
            <Target size={18} style={{ color: T.amber }} strokeWidth={1.8} />
          </div>

          <div>
            <p className="text-sm font-semibold" style={{ color: T.sub, fontFamily: 'Syne, sans-serif' }}>
              Sem meta definida
            </p>
            <p className="text-xs mt-1" style={{ color: T.muted, fontFamily: 'DM Sans, sans-serif' }}>
              Defina uma meta mensal para acompanhar seu progresso
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={onSetGoal}
            className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl mt-1"
            style={{
              background: `${T.amber}10`,
              color:       T.amber,
              border:      `1px solid ${T.amber}28`,
              cursor:      'pointer',
              fontFamily:  'DM Sans, sans-serif',
            }}
          >
            <Plus size={12} />
            Definir meta
          </motion.button>
        </div>
      </SpotlightCard>
    )
  }

  // ─── Cálculos — usa campos reais do useGoals hook ─────────────────────────
  // currentRevenue vem do stats.income do dashboard (mesma fonte do KPI card)
  const current    = currentRevenue ?? goal.revenue ?? 0
  const target     = goal.target        ?? 0
  const superQuota = goal.super_target  ?? 0

  // Recalcula % com o revenue correto (ignora goal.pct se currentRevenue foi passado)
  const mainPct  = target > 0 ? Math.min((current / target) * 100, 100) : 0
  const superPct = superQuota > 0 ? Math.min((current / superQuota) * 100, 100) : 0

  const remaining  = Math.max(target - current, 0)
  const beatTarget = target > 0 && current >= target
  const beatSuper  = superQuota > 0 && current >= superQuota

  // Cor dinâmica da meta principal
  const mainColor = beatTarget ? T.green : mainPct >= 70 ? '#f59e0b' : T.amber

  return (
    <SpotlightCard
      className="rounded-2xl h-full"
      spotlightColor={`${mainColor}14`}
      style={card}
    >
      <div className="p-5 relative overflow-hidden flex flex-col gap-4">
        <GlowCorner color={`${mainColor}20`} position="bottom-right" />

        {/* ── Cabeçalho ── */}
        <div className="flex items-center justify-between" style={{ position: 'relative', zIndex: 1 }}>
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-xl flex items-center justify-center"
              style={{
                background: `${mainColor}14`,
                border:     `1px solid ${mainColor}28`,
                boxShadow:  `0 0 12px ${mainColor}20`,
              }}
            >
              <Target size={13} style={{ color: mainColor }} strokeWidth={2} />
            </div>
            <span
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: T.muted, letterSpacing: '0.1em', fontFamily: 'Syne, sans-serif' }}
            >
              Meta de {monthLabel}
            </span>
          </div>

          <motion.button
            whileHover={{ x: 2 }}
            onClick={onSetGoal}
            className="flex items-center gap-1 text-xs font-semibold"
            style={{ color: T.violet, cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'DM Sans, sans-serif' }}
          >
            Ver metas <ArrowRight size={11} />
          </motion.button>
        </div>

        {/* ── Valor atual + anel ── */}
        <div
          className="flex items-center justify-between"
          style={{ position: 'relative', zIndex: 1 }}
        >
          <div>
            <p
              className="text-3xl font-bold tabular-nums leading-none"
              style={{
                fontFamily:  'Syne, sans-serif',
                color:       mainColor,
                textShadow:  `0 0 28px ${mainColor}55`,
                letterSpacing: '-0.02em',
              }}
            >
              {fmtShort(current)}
            </p>
            {beatTarget && (
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs mt-1 font-semibold"
                style={{ color: T.green, fontFamily: 'DM Sans, sans-serif' }}
              >
                ✓ Meta batida!
              </motion.p>
            )}
          </div>

          {/* Anel circular */}
          <div className="relative flex items-center justify-center" style={{ width: 56, height: 56 }}>
            <RingProgress value={mainPct} color={mainColor} size={56} />
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ fontSize: 10, fontFamily: 'Syne, sans-serif', fontWeight: 700, color: mainColor }}
            >
              {Math.round(mainPct)}%
            </div>
          </div>
        </div>

        {/* ── Barra meta principal ── */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span style={{ color: T.sub, fontFamily: 'DM Sans, sans-serif' }}>
              Meta: <span style={{ color: T.text, fontWeight: 600 }}>{fmtShort(target)}</span>
            </span>
            <span
              className="font-bold tabular-nums"
              style={{
                color:      mainPct >= 100 ? T.green : mainColor,
                fontFamily: 'Syne, sans-serif',
              }}
            >
              {mainPct.toFixed(0)}%
            </span>
          </div>
          <ProgressBar value={mainPct} color={mainColor} delay={0.3} />
        </div>

        {/* ── Super Cota ── */}
        {superQuota > 0 && (
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <div className="flex items-center gap-1.5">
                <Zap size={11} style={{ color: T.violet }} />
                <span style={{ color: T.sub, fontFamily: 'DM Sans, sans-serif' }}>
                  Super Cota: <span style={{ color: T.text, fontWeight: 600 }}>{fmtShort(superQuota)}</span>
                </span>
              </div>
              <span
                className="font-bold tabular-nums"
                style={{
                  color:      beatSuper ? T.green : T.violet,
                  fontFamily: 'Syne, sans-serif',
                }}
              >
                {superPct.toFixed(0)}%
              </span>
            </div>
            <ProgressBar value={superPct} color={beatSuper ? T.green : T.purple} delay={0.45} />
          </div>
        )}

        {/* ── Rodapé ── */}
        <div
          className="pt-3 border-t"
          style={{ borderColor: 'rgba(255,255,255,0.05)', position: 'relative', zIndex: 1 }}
        >
          {beatSuper ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs font-semibold"
              style={{ color: T.green, fontFamily: 'DM Sans, sans-serif' }}
            >
              🏆 Super Cota batida! Resultado excepcional.
            </motion.p>
          ) : beatTarget ? (
            <p className="text-xs" style={{ color: T.sub, fontFamily: 'DM Sans, sans-serif' }}>
              Faltam{' '}
              <span style={{ color: T.violet, fontWeight: 600 }}>{fmtShort(superQuota - current)}</span>
              {' '}para a Super Cota
            </p>
          ) : (
            <p className="text-xs" style={{ color: T.muted, fontFamily: 'DM Sans, sans-serif' }}>
              Faltam{' '}
              <span style={{ color: mainColor, fontWeight: 600 }}>{fmtShort(remaining)}</span>
              {' '}para bater a meta
            </p>
          )}
        </div>
      </div>
    </SpotlightCard>
  )
}

export default GoalCard
