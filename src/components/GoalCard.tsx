'use client'

import { motion } from 'framer-motion'
import { Target, Zap, ArrowRight, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { GoalWithProgress } from '@/hooks/useGoals'

interface GoalCardProps {
  goal: GoalWithProgress | undefined
  onSetGoal?: () => void
}

export function GoalCard({ goal, onSetGoal }: GoalCardProps) {
  const router = useRouter()

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const fmtShort = (v: number) => {
    if (v >= 1000000) return `R$ ${(v / 1000000).toFixed(1)}M`
    if (v >= 1000) return `R$ ${(v / 1000).toFixed(1)}k`
    return fmt(v)
  }

  const monthName = new Date().toLocaleDateString('pt-BR', { month: 'long' })

  // Sem meta definida
  if (!goal || goal.target === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.38 }}
        className="rounded-2xl p-5 flex flex-col gap-3"
        style={{ background: '#111118', border: '1px dashed #2a2a3e' }}>
        <div className="flex items-center gap-2">
          <Target size={14} style={{ color: '#3a3a5c' }} />
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#3a3a5c' }}>
            Meta de {monthName}
          </span>
        </div>
        <p className="text-sm" style={{ color: '#4a4a6a' }}>
          Você ainda não definiu uma meta para este mês.
        </p>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={onSetGoal || (() => router.push('/metas'))}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold self-start"
          style={{ background: 'rgba(249,115,22,0.1)', color: '#f97316', border: '1px solid rgba(249,115,22,0.25)' }}>
          <Plus size={13} /> Definir meta
        </motion.button>
      </motion.div>
    )
  }

  const pct = goal.pct
  const superPct = goal.superPct ?? 0
  const hasSuperTarget = !!goal.super_target && goal.super_target > 0

  // Cor dinâmica baseada no progresso
  const mainColor = goal.hit ? '#34d399' : pct >= 80 ? '#fbbf24' : pct >= 50 ? '#f97316' : '#f87171'
  const superColor = '#a78bfa'

  // Barra principal: até onde está em relação à meta normal
  const mainBarPct = Math.min(pct, 100)
  // Se bateu super cota, barra vai além dos 100% visualmente
  const totalTarget = hasSuperTarget ? goal.super_target! : goal.target
  const overallPct = Math.min((goal.revenue / totalTarget) * 100, 100)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.38 }}
      className="rounded-2xl p-5 relative overflow-hidden"
      style={{ background: '#111118', border: `1px solid ${goal.superHit ? '#a78bfa40' : goal.hit ? '#34d39940' : '#1e1e2e'}` }}>

      {/* Glow de fundo quando bateu meta */}
      {(goal.hit || goal.superHit) && (
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full blur-3xl pointer-events-none"
          style={{ background: goal.superHit ? 'rgba(167,139,250,0.15)' : 'rgba(52,211,153,0.12)' }} />
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Target size={13} style={{ color: '#f97316' }} />
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#f97316' }}>
              Meta de {monthName}
            </span>
            {goal.superHit && (
              <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-bold"
                style={{ background: 'rgba(167,139,250,0.15)', color: '#a78bfa' }}>
                <Zap size={10} /> Super Cota!
              </span>
            )}
            {goal.hit && !goal.superHit && (
              <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399' }}>
                ✓ Meta batida!
              </span>
            )}
          </div>
          <p className="text-2xl font-bold mt-1" style={{ fontFamily: 'Syne, sans-serif', color: mainColor }}>
            {fmtShort(goal.revenue)}
          </p>
        </div>
        <motion.button
          whileHover={{ x: 2 }}
          onClick={() => router.push('/metas')}
          className="text-xs flex items-center gap-1"
          style={{ color: '#4a4a6a' }}>
          Ver metas <ArrowRight size={11} />
        </motion.button>
      </div>

      {/* Barra de progresso principal */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs" style={{ color: '#6b6b8a' }}>Meta: {fmtShort(goal.target)}</span>
          <span className="text-xs font-bold" style={{ color: mainColor }}>{Math.round(pct)}%</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden relative" style={{ background: '#1e1e2e' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${mainBarPct}%` }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            className="h-full rounded-full absolute top-0 left-0"
            style={{ background: `linear-gradient(90deg, ${mainColor}aa, ${mainColor})` }}
          />
        </div>
      </div>

      {/* Barra super cota */}
      {hasSuperTarget && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Zap size={10} style={{ color: superColor }} />
              <span className="text-xs" style={{ color: '#6b6b8a' }}>
                Super Cota: {fmtShort(goal.super_target!)}
              </span>
            </div>
            <span className="text-xs font-bold" style={{ color: superColor }}>
              {Math.round(superPct)}%
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden relative" style={{ background: '#1e1e2e' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(superPct, 100)}%` }}
              transition={{ duration: 1, delay: 0.15, ease: 'easeOut' }}
              className="h-full rounded-full absolute top-0 left-0"
              style={{ background: `linear-gradient(90deg, ${superColor}66, ${superColor})` }}
            />
          </div>
        </div>
      )}

      {/* Falta quanto */}
      {!goal.hit && goal.target > 0 && (
        <p className="text-xs mt-3" style={{ color: '#4a4a6a' }}>
          Faltam {fmtShort(goal.target - goal.revenue)} para bater a meta
        </p>
      )}
      {goal.hit && !goal.superHit && hasSuperTarget && (
        <p className="text-xs mt-3" style={{ color: '#a78bfa99' }}>
          Faltam {fmtShort(goal.super_target! - goal.revenue)} para a super cota
        </p>
      )}
    </motion.div>
  )
}
