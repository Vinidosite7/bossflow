'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Zap, X, ArrowRight, TrendingUp } from 'lucide-react'
import { PlanKey, PLAN_ORDER, PLAN_LABELS, PLAN_PRICES, PLAN_CHECKOUT_URLS, planHasAccess } from '@/lib/plans'

// ─── UpgradeModal ──────────────────────────────────────────────
interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  feature: string
  description?: string
  requiredPlan: PlanKey
  currentPlan: string
}

export function UpgradeModal({ isOpen, onClose, feature, description, requiredPlan, currentPlan }: UpgradeModalProps) {
  // Qual plano sugerir: o requerido, ou o próximo acima do atual
  const currentIdx = PLAN_ORDER.indexOf(currentPlan as PlanKey)
  const requiredIdx = PLAN_ORDER.indexOf(requiredPlan)
  const targetPlan = PLAN_ORDER[Math.max(currentIdx + 1, requiredIdx)] ?? requiredPlan

  const price       = PLAN_PRICES[targetPlan]
  const checkoutUrl = PLAN_CHECKOUT_URLS[targetPlan]
  const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm px-4"
            style={{ transform: 'translate(-50%, -50%)' }}
          >
            <div className="rounded-2xl overflow-hidden"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid rgba(124,110,247,0.3)',
                boxShadow: '0 0 60px rgba(124,110,247,0.15), 0 24px 48px rgba(0,0,0,0.5)',
              }}>
              {/* Header */}
              <div className="px-5 pt-5 pb-4 relative"
                style={{ background: 'linear-gradient(135deg, rgba(124,110,247,0.12), rgba(157,143,255,0.06))' }}>
                <button onClick={onClose}
                  className="absolute right-4 top-4 w-7 h-7 flex items-center justify-center rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                  <X size={14} />
                </button>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: 'rgba(124,110,247,0.15)', border: '1px solid rgba(124,110,247,0.3)' }}>
                  <Lock size={18} style={{ color: '#9d8fff' }} />
                </div>
                <h3 className="font-bold text-base" style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text)' }}>
                  {feature}
                </h3>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  {description ?? `Disponível a partir do plano ${PLAN_LABELS[requiredPlan]}`}
                </p>
              </div>

              {/* Preço + CTAs */}
              <div className="px-5 py-4" style={{ borderTop: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                      Plano {PLAN_LABELS[targetPlan]}
                    </p>
                    <div className="flex items-end gap-1 mt-0.5">
                      <span className="text-2xl font-extrabold"
                        style={{ fontFamily: 'Syne, sans-serif', color: '#9d8fff' }}>
                        R$ {price === 0 ? '0' : fmt(price)}
                      </span>
                      <span className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>/mês</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold"
                    style={{ background: 'rgba(34,197,94,0.1)', color: 'rgb(34,197,94)', border: '1px solid rgba(34,197,94,0.2)' }}>
                    <TrendingUp size={11} /> Upgrade
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {checkoutUrl && (
                    <a href={checkoutUrl}
                      className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                      style={{
                        background: 'linear-gradient(135deg, #7c6ef7, #9d8fff)',
                        color: 'white',
                        boxShadow: '0 0 24px rgba(124,110,247,0.35)',
                        textDecoration: 'none',
                      }}>
                      <Zap size={14} /> Fazer upgrade agora
                    </a>
                  )}
                  <Link href="/assinatura"
                    className="w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                    style={{
                      background: 'transparent', color: 'var(--text-muted)',
                      border: '1px solid var(--border)', textDecoration: 'none',
                    }}
                    onClick={onClose}>
                    Ver todos os planos <ArrowRight size={11} />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ─── PlanGate ──────────────────────────────────────────────────
// Retrocompatível: mesmos props de antes + mode='modal' novo
interface PlanGateProps {
  currentPlan: string
  requiredPlan: PlanKey
  feature: string
  description?: string
  children: React.ReactNode
  mode?: 'blur' | 'hide' | 'modal'
}

export function PlanGate({ currentPlan, requiredPlan, feature, description, children, mode = 'blur' }: PlanGateProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const hasAccess = planHasAccess(currentPlan, requiredPlan)

  if (hasAccess) return <>{children}</>

  if (mode === 'modal') {
    return (
      <>
        <div className="cursor-pointer select-none" style={{ opacity: 0.45 }} onClick={() => setModalOpen(true)}>
          {children}
        </div>
        <UpgradeModal isOpen={modalOpen} onClose={() => setModalOpen(false)}
          feature={feature} description={description} requiredPlan={requiredPlan} currentPlan={currentPlan} />
      </>
    )
  }

  if (mode === 'hide') {
    return (
      <>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'rgba(124,110,247,0.1)', border: '1px solid rgba(124,110,247,0.2)' }}>
            <Lock size={22} style={{ color: '#7c6ef7' }} />
          </div>
          <p className="font-semibold mb-1" style={{ color: '#e8e8f0' }}>{feature}</p>
          <p className="text-sm mb-5" style={{ color: '#4a4a6a' }}>
            {description ?? `Disponível no plano ${PLAN_LABELS[requiredPlan]}`}
          </p>
          <button onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: 'linear-gradient(135deg, #7c6ef7, #9d8fff)', color: 'white' }}>
            <Zap size={14} /> Fazer upgrade
          </button>
        </div>
        <UpgradeModal isOpen={modalOpen} onClose={() => setModalOpen(false)}
          feature={feature} description={description} requiredPlan={requiredPlan} currentPlan={currentPlan} />
      </>
    )
  }

  // mode = blur (padrão — mesmo comportamento visual de antes, mas agora abre modal)
  return (
    <>
      <div className="relative rounded-2xl overflow-hidden">
        <div className="pointer-events-none select-none" style={{ filter: 'blur(4px)', opacity: 0.4 }}>
          {children}
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer"
          style={{ background: 'rgba(8,8,16,0.7)', backdropFilter: 'blur(2px)' }}
          onClick={() => setModalOpen(true)}>
          <div className="rounded-2xl p-6 text-center max-w-xs mx-4"
            style={{ background: 'rgba(13,13,20,0.95)', border: '1px solid rgba(124,110,247,0.25)' }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
              style={{ background: 'rgba(124,110,247,0.12)', border: '1px solid rgba(124,110,247,0.2)' }}>
              <Lock size={20} style={{ color: '#7c6ef7' }} />
            </div>
            <p className="font-bold mb-1 text-sm" style={{ color: '#e8e8f0' }}>{feature}</p>
            <p className="text-xs mb-4 leading-relaxed" style={{ color: '#4a4a6a' }}>
              {description ?? `Disponível a partir do plano ${PLAN_LABELS[requiredPlan]}`}
            </p>
            <span className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold"
              style={{ background: 'linear-gradient(135deg, #7c6ef7, #9d8fff)', color: 'white', boxShadow: '0 0 20px rgba(124,110,247,0.3)' }}>
              <Zap size={12} /> Upgrade para {PLAN_LABELS[requiredPlan]}
            </span>
          </div>
        </div>
      </div>
      <UpgradeModal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        feature={feature} description={description} requiredPlan={requiredPlan} currentPlan={currentPlan} />
    </>
  )
}

// ─── PlanAction ────────────────────────────────────────────────
// Retrocompatível: mesma interface, agora abre modal em vez de Link
interface PlanActionProps {
  currentPlan: string
  requiredPlan: PlanKey
  children: React.ReactNode
  tooltip?: string
  // novos opcionais
  feature?: string
  description?: string
}

export function PlanAction({ currentPlan, requiredPlan, children, tooltip, feature, description }: PlanActionProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const hasAccess = planHasAccess(currentPlan, requiredPlan)

  if (hasAccess) return <>{children}</>

  const featureLabel = feature ?? tooltip ?? `Disponível no plano ${PLAN_LABELS[requiredPlan]}`

  return (
    <>
      <button onClick={() => setModalOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
        style={{ background: 'rgba(124,110,247,0.08)', border: '1px solid rgba(124,110,247,0.2)', color: '#7c6ef7', cursor: 'pointer' }}
        title={featureLabel}>
        <Lock size={11} /> {PLAN_LABELS[requiredPlan]}
      </button>
      <UpgradeModal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        feature={featureLabel} description={description} requiredPlan={requiredPlan} currentPlan={currentPlan} />
    </>
  )
}

// ─── RevenueGate ───────────────────────────────────────────────
// Novo: bloqueia quando empresa ultrapassa o faturamento do plano
interface RevenueGateProps {
  currentPlan: string
  monthlyRevenue: number
  children: React.ReactNode
}

export function RevenueGate({ currentPlan, monthlyRevenue, children }: RevenueGateProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const limit = currentPlan === 'free' ? 20_000 : Infinity
  const isBlocked = limit !== Infinity && monthlyRevenue > limit

  if (!isBlocked) return <>{children}</>

  const fmtR = (v: number) => v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`

  return (
    <>
      <div className="relative rounded-2xl overflow-hidden cursor-pointer" onClick={() => setModalOpen(true)}>
        <div className="pointer-events-none select-none" style={{ filter: 'blur(3px)', opacity: 0.3 }}>
          {children}
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ background: 'rgba(8,8,16,0.75)', backdropFilter: 'blur(2px)' }}>
          <div className="rounded-2xl p-6 text-center max-w-sm mx-4"
            style={{ background: 'rgba(13,13,20,0.95)', border: '1px solid rgba(245,158,11,0.3)' }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
              style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <TrendingUp size={20} style={{ color: 'rgb(245,158,11)' }} />
            </div>
            <p className="font-bold text-sm mb-1" style={{ color: '#e8e8f0' }}>Faturamento acima do limite</p>
            <p className="text-xs mb-4 leading-relaxed" style={{ color: '#6a6a8a' }}>
              Sua empresa faturou {fmtR(monthlyRevenue)}/mês, acima do limite de {fmtR(limit)} do plano Básico.
            </p>
            <span className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold"
              style={{ background: 'linear-gradient(135deg, #7c6ef7, #9d8fff)', color: 'white', boxShadow: '0 0 20px rgba(124,110,247,0.3)' }}>
              <Zap size={12} /> Fazer upgrade
            </span>
          </div>
        </div>
      </div>
      <UpgradeModal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        feature="Limite de faturamento atingido"
        description={`Plano Básico suporta até ${fmtR(limit)}/mês. Faça upgrade para continuar.`}
        requiredPlan="starter" currentPlan={currentPlan} />
    </>
  )
}
