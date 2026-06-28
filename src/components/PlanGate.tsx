'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Zap, X, ArrowRight, TrendingUp } from 'lucide-react'
import { PlanKey, PLAN_ORDER, PLAN_LABELS, PLAN_PRICES, PLAN_CHECKOUT_URLS, planHasAccess } from '@/lib/plans'

// ─── Shared glass tokens ───────────────────────────────────────
const MODAL_BG    = 'rgba(8,8,14,0.97)'
const MODAL_BORDER = 'rgba(124,110,247,0.22)'
const MODAL_SHADOW = '0 0 70px rgba(0,0,0,0.75), 0 0 0 1px rgba(124,110,247,0.07)'

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
  const currentIdx  = PLAN_ORDER.indexOf(currentPlan as PlanKey)
  const requiredIdx = PLAN_ORDER.indexOf(requiredPlan)
  const targetPlan  = PLAN_ORDER[Math.max(currentIdx + 1, requiredIdx)] ?? requiredPlan
  const price        = PLAN_PRICES[targetPlan]
  const checkoutUrl  = PLAN_CHECKOUT_URLS[targetPlan]
  const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
            onClick={onClose}
          />
          {/* Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm px-4"
            style={{ transform: 'translate(-50%, -50%)' }}
          >
            <div className="rounded-2xl overflow-hidden"
              style={{ background: MODAL_BG, border: `1px solid ${MODAL_BORDER}`, boxShadow: MODAL_SHADOW, backdropFilter: 'blur(24px)' }}>

              {/* Header */}
              <div className="px-5 pt-5 pb-4 relative"
                style={{ background: 'linear-gradient(135deg, rgba(124,110,247,0.08), rgba(157,143,255,0.03))' }}>
                <button onClick={onClose}
                  className="absolute right-4 top-4 w-7 h-7 flex items-center justify-center rounded-lg transition-all"
                  style={{ background: 'rgba(255,255,255,0.04)', color: '#4a4a6a', border: '1px solid rgba(255,255,255,0.06)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(248,113,113,0.1)'; (e.currentTarget as HTMLButtonElement).style.color = '#f87171' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLButtonElement).style.color = '#4a4a6a' }}
                >
                  <X size={13} />
                </button>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: 'rgba(124,110,247,0.1)', border: '1px solid rgba(124,110,247,0.2)' }}>
                  <Lock size={18} style={{ color: '#9d8fff' }} />
                </div>
                <h3 className="font-bold text-base" style={{ fontFamily: 'Syne, sans-serif', color: '#dcdcf0' }}>
                  {feature}
                </h3>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: '#4a4a6a', fontFamily: 'DM Sans, sans-serif' }}>
                  {description ?? `Disponível a partir do plano ${PLAN_LABELS[requiredPlan]}`}
                </p>
              </div>

              {/* Preço + CTA */}
              <div className="px-5 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.055)' }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs font-medium" style={{ color: '#4a4a6a' }}>
                      Plano {PLAN_LABELS[targetPlan]}
                    </p>
                    <div className="flex items-end gap-1 mt-0.5">
                      <span className="text-2xl font-extrabold"
                        style={{ fontFamily: 'Syne, sans-serif', color: '#9d8fff' }}>
                        R$ {price === 0 ? '0' : fmt(price)}
                      </span>
                      <span className="text-xs mb-1" style={{ color: '#4a4a6a' }}>/mês</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold"
                    style={{ background: 'rgba(52,211,153,0.08)', color: '#34d399', border: '1px solid rgba(52,211,153,0.18)' }}>
                    <TrendingUp size={11} /> Upgrade
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {checkoutUrl && (
                    <a href={checkoutUrl}
                      className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                      style={{
                        background: 'linear-gradient(135deg, #7c6ef7, #9d6ef7)',
                        color: 'white', boxShadow: '0 0 24px rgba(124,110,247,0.3)',
                        textDecoration: 'none', fontFamily: 'Syne, sans-serif',
                      }}>
                      <Zap size={13} /> Fazer upgrade agora
                    </a>
                  )}
                  <Link href="/assinatura"
                    className="w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                    style={{
                      background: 'rgba(255,255,255,0.03)', color: '#6b6b8a',
                      border: '1px solid rgba(255,255,255,0.07)', textDecoration: 'none',
                      fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s',
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
        <div className="cursor-pointer select-none" style={{ opacity: 0.4 }} onClick={() => setModalOpen(true)}>
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
            style={{ background: 'rgba(124,110,247,0.08)', border: '1px solid rgba(124,110,247,0.18)' }}>
            <Lock size={22} style={{ color: '#7c6ef7' }} />
          </div>
          <p className="font-semibold mb-1" style={{ color: '#dcdcf0', fontFamily: 'Syne, sans-serif' }}>{feature}</p>
          <p className="text-sm mb-5" style={{ color: '#4a4a6a', fontFamily: 'DM Sans, sans-serif' }}>
            {description ?? `Disponível no plano ${PLAN_LABELS[requiredPlan]}`}
          </p>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
            style={{
              background: 'linear-gradient(135deg, #7c6ef7, #9d6ef7)',
              color: 'white', border: 'none', cursor: 'pointer',
              fontFamily: 'Syne, sans-serif',
              boxShadow: '0 0 24px rgba(124,110,247,0.25)',
            }}>
            <Zap size={13} /> Fazer upgrade
          </motion.button>
        </div>
        <UpgradeModal isOpen={modalOpen} onClose={() => setModalOpen(false)}
          feature={feature} description={description} requiredPlan={requiredPlan} currentPlan={currentPlan} />
      </>
    )
  }

  // blur mode
  return (
    <>
      <div className="relative rounded-2xl overflow-hidden">
        <div className="pointer-events-none select-none" style={{ filter: 'blur(4px)', opacity: 0.35 }}>
          {children}
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer"
          style={{ background: 'rgba(4,4,10,0.75)', backdropFilter: 'blur(3px)' }}
          onClick={() => setModalOpen(true)}>
          <div className="rounded-2xl p-6 text-center max-w-xs mx-4"
            style={{ background: MODAL_BG, border: `1px solid ${MODAL_BORDER}`, backdropFilter: 'blur(20px)' }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
              style={{ background: 'rgba(124,110,247,0.1)', border: '1px solid rgba(124,110,247,0.2)' }}>
              <Lock size={20} style={{ color: '#7c6ef7' }} />
            </div>
            <p className="font-bold mb-1 text-sm" style={{ color: '#dcdcf0', fontFamily: 'Syne, sans-serif' }}>{feature}</p>
            <p className="text-xs mb-4 leading-relaxed" style={{ color: '#4a4a6a', fontFamily: 'DM Sans, sans-serif' }}>
              {description ?? `Disponível a partir do plano ${PLAN_LABELS[requiredPlan]}`}
            </p>
            <span className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold"
              style={{
                background: 'linear-gradient(135deg, #7c6ef7, #9d6ef7)',
                color: 'white', fontFamily: 'Syne, sans-serif',
                boxShadow: '0 0 20px rgba(124,110,247,0.3)',
              }}>
              <Zap size={11} /> Upgrade para {PLAN_LABELS[requiredPlan]}
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
interface PlanActionProps {
  currentPlan: string
  requiredPlan: PlanKey
  children: React.ReactNode
  tooltip?: string
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
        style={{
          background: 'rgba(124,110,247,0.07)',
          border: '1px solid rgba(124,110,247,0.18)',
          color: '#7c6ef7', cursor: 'pointer',
          fontFamily: 'DM Sans, sans-serif',
        }}
        title={featureLabel}>
        <Lock size={10} /> {PLAN_LABELS[requiredPlan]}
      </button>
      <UpgradeModal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        feature={featureLabel} description={description} requiredPlan={requiredPlan} currentPlan={currentPlan} />
    </>
  )
}

// ─── RevenueGate ───────────────────────────────────────────────
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
          style={{ background: 'rgba(4,4,10,0.78)', backdropFilter: 'blur(3px)' }}>
          <div style={{ background: MODAL_BG, border: '1px solid rgba(245,158,11,0.2)', borderRadius: 16, padding: 24, maxWidth: 320, textAlign: 'center' }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
              style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.18)' }}>
              <TrendingUp size={20} style={{ color: 'rgb(245,158,11)' }} />
            </div>
            <p className="font-bold text-sm mb-1" style={{ color: '#dcdcf0', fontFamily: 'Syne, sans-serif' }}>
              Faturamento acima do limite
            </p>
            <p className="text-xs mb-4 leading-relaxed" style={{ color: '#5a5a7a', fontFamily: 'DM Sans, sans-serif' }}>
              Sua empresa faturou {fmtR(monthlyRevenue)}/mês, acima do limite de {fmtR(limit)} do plano Básico.
            </p>
            <span className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold"
              style={{ background: 'linear-gradient(135deg, #7c6ef7, #9d6ef7)', color: 'white', fontFamily: 'Syne, sans-serif', boxShadow: '0 0 20px rgba(124,110,247,0.3)' }}>
              <Zap size={11} /> Fazer upgrade
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
