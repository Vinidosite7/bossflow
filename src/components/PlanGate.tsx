'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Zap, X, ArrowRight } from 'lucide-react'
import { PlanKey, PLAN_ORDER, PLAN_LABELS, PLAN_PRICES, PLAN_CHECKOUT_URLS, planHasAccess } from '@/lib/plans'

// ─── UpgradeModal ──────────────────────────────────────────────
interface UpgradeModalProps {
  isOpen: boolean; onClose: () => void
  feature: string; description?: string
  requiredPlan: PlanKey; currentPlan: string
}

export function UpgradeModal({ isOpen, onClose, feature, description, requiredPlan, currentPlan }: UpgradeModalProps) {
  const currentIdx  = PLAN_ORDER.indexOf(currentPlan as PlanKey)
  const requiredIdx = PLAN_ORDER.indexOf(requiredPlan)
  const targetPlan  = PLAN_ORDER[Math.max(currentIdx + 1, requiredIdx)] ?? requiredPlan
  const price       = PLAN_PRICES[targetPlan]
  const checkoutUrl = PLAN_CHECKOUT_URLS[targetPlan]
  const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
            onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm px-4"
            style={{ transform: 'translate(-50%, -50%)' }}>
            <div className="rounded-2xl overflow-hidden"
              style={{ background: '#0e0e1a', border: '1px solid rgba(124,110,247,0.3)', boxShadow: '0 0 60px rgba(124,110,247,0.15), 0 24px 48px rgba(0,0,0,0.5)' }}>
              <div className="px-5 pt-5 pb-4 relative"
                style={{ background: 'linear-gradient(135deg, rgba(124,110,247,0.12), rgba(157,143,255,0.06))' }}>
                <button onClick={onClose}
                  className="absolute right-4 top-4 w-7 h-7 flex items-center justify-center rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.05)', color: '#4a4a6a' }}>
                  <X size={14} />
                </button>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: 'rgba(124,110,247,0.15)', border: '1px solid rgba(124,110,247,0.3)' }}>
                  <Lock size={18} style={{ color: '#9d8fff' }} />
                </div>
                <h3 className="font-bold text-base" style={{ fontFamily: 'Syne, sans-serif', color: '#e8e8f0' }}>{feature}</h3>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: '#5a5a7a' }}>
                  {description ?? `Disponível a partir do plano ${PLAN_LABELS[requiredPlan]}`}
                </p>
              </div>
              <div className="px-5 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs font-medium" style={{ color: '#5a5a7a' }}>Plano {PLAN_LABELS[targetPlan]}</p>
                    <p className="text-2xl font-bold" style={{ fontFamily: 'Syne, sans-serif', color: '#e8e8f0', letterSpacing: '-0.02em' }}>
                      R$ {fmt(price)}<span className="text-sm font-normal" style={{ color: '#4a4a6a' }}>/mês</span>
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {checkoutUrl ? (
                    <a href={checkoutUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold"
                      style={{ background: 'linear-gradient(135deg, #7c6ef7, #9d8fff)', color: 'white', textDecoration: 'none', boxShadow: '0 4px 20px rgba(124,110,247,0.35)' }}>
                      <Zap size={14} /> Fazer upgrade agora
                    </a>
                  ) : (
                    <Link href="/assinatura"
                      className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold"
                      style={{ background: 'linear-gradient(135deg, #7c6ef7, #9d8fff)', color: 'white', textDecoration: 'none' }}>
                      <Zap size={14} /> Ver planos
                    </Link>
                  )}
                  <button onClick={onClose}
                    className="flex items-center justify-center py-2.5 px-4 rounded-xl text-sm font-medium"
                    style={{ background: 'rgba(255,255,255,0.03)', color: '#4a4a6a', border: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer' }}>
                    Agora não
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ─── Mapa de features → visual contextual ─────────────────────
// Tipo atualizado com suporte a imagem
interface FeatureVisual {
  emoji?: string
  img?: string      // caminho da imagem em /public
  color: string
  preview: string[]
}

const FEATURE_VISUALS: Record<string, FeatureVisual> = {
  'Agendamento de eventos': {
    img: '/icon-512.png', color: '#22d3ee',
    preview: ['Agenda semanal e mensal', 'Lembretes automáticos', 'Sincronização com tarefas'],
  },
  'Estagiária Bia': {
    img: '/bia-avatar.png', color: '#c084fc',
    preview: ['Lê notas fiscais e cadastra', 'Responde sobre seu financeiro', 'Cria lançamentos por texto'],
  },
  'Módulo financeiro': {
    img: '/icon-512.png', color: '#34d399',
    preview: ['Fluxo de caixa detalhado', 'Categorias personalizadas', 'Histórico completo'],
  },
  'Metas mensais': {
    img: '/icon-512.png', color: '#f97316',
    preview: ['Meta de faturamento mensal', 'Progresso em tempo real', 'Histórico de meses anteriores'],
  },
  'Compartilhamento de empresa': {
    img: '/icon-512.png', color: '#fbbf24',
    preview: ['Convide membros da equipe', 'Controle de permissões', 'Acesso simultâneo'],
  },
}

// ─── PlanGate inline (tela de bloqueio) ───────────────────────
interface PlanGateProps {
  currentPlan: string
  requiredPlan: PlanKey
  feature: string
  description?: string
  mode?: 'hide' | 'blur'
  children: React.ReactNode
}

export function PlanGate({ currentPlan, requiredPlan, feature, description, mode = 'hide', children }: PlanGateProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const hasAccess = planHasAccess(currentPlan, requiredPlan)

  if (hasAccess) return <>{children}</>

  const visual = FEATURE_VISUALS[feature] ?? { img: '/icon-512.png', color: '#7c6ef7', preview: [] }
  const price   = PLAN_PRICES[requiredPlan]
  const fmt     = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
  const checkoutUrl = PLAN_CHECKOUT_URLS[requiredPlan]

  return (
    <>
      <UpgradeModal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        feature={feature} description={description}
        requiredPlan={requiredPlan} currentPlan={currentPlan} />

      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        textAlign: 'center', padding: '48px 24px', maxWidth: 400, margin: '0 auto',
      }}>
        {/* Ícone contextual */}
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <div style={{
            width: 80, height: 80, borderRadius: 22, overflow: 'hidden',
            background: `rgba(124,110,247,0.08)`,
            border: `1px solid ${visual.color}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 36,
            boxShadow: `0 0 32px ${visual.color}18`,
          }}>
            {visual.img
              ? <img src={visual.img} alt={feature}
                  style={{ width: '100%', height: '100%', objectFit: 'cover',
                    objectPosition: feature === 'Estagiária Bia' ? 'center top' : 'center',
                    filter: 'brightness(0.85)' }} />
              : <span>{visual.emoji}</span>}
          </div>
          <div style={{
            position: 'absolute', bottom: -8, right: -8,
            width: 28, height: 28, borderRadius: 99,
            background: '#7c6ef7', border: '2px solid #0a0a0f',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(124,110,247,0.4)',
          }}>
            <Lock size={12} color="white" />
          </div>
        </div>

        {/* Título */}
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800, color: '#e8e8f0', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
          {feature}
        </h2>
        <p style={{ fontSize: 13, color: '#5a5a7a', lineHeight: 1.65, margin: '0 0 20px' }}>
          {description ?? `Disponível a partir do plano ${PLAN_LABELS[requiredPlan]}`}
        </p>

        {/* Preview de features */}
        {visual.preview.length > 0 && (
          <div style={{
            width: '100%', padding: '14px 16px', borderRadius: 14, marginBottom: 20,
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', flexDirection: 'column', gap: 9,
          }}>
            {visual.preview.map(p => (
              <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left' }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', flexShrink: 0, background: visual.color }} />
                <span style={{ fontSize: 13, color: '#4a4a6a' }}>{p}</span>
              </div>
            ))}
          </div>
        )}

        {/* Preço */}
        <div style={{ marginBottom: 16 }}>
          <span style={{ fontSize: 11, color: '#3a3a5a', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            A partir de
          </span>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#e8e8f0', fontFamily: 'Syne, sans-serif', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            R$ {fmt(price)}<span style={{ fontSize: 14, fontWeight: 400, color: '#3a3a5a' }}>/mês</span>
          </div>
        </div>

        {/* CTA */}
        {checkoutUrl ? (
          <a href={checkoutUrl} target="_blank" rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 28px', borderRadius: 12, fontSize: 14, fontWeight: 700,
              color: 'white', textDecoration: 'none',
              background: 'linear-gradient(135deg, #7c6ef7, #9d8fff)',
              boxShadow: '0 4px 24px rgba(124,110,247,0.35)',
            }}>
            <Zap size={14} /> Fazer upgrade
          </a>
        ) : (
          <Link href="/assinatura"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 28px', borderRadius: 12, fontSize: 14, fontWeight: 700,
              color: 'white', textDecoration: 'none',
              background: 'linear-gradient(135deg, #7c6ef7, #9d8fff)',
              boxShadow: '0 4px 24px rgba(124,110,247,0.35)',
            }}>
            <Zap size={14} /> Ver planos
          </Link>
        )}

        <Link href="/assinatura" style={{ marginTop: 12, fontSize: 12, color: '#3a3a5a', textDecoration: 'none' }}>
          Ver todos os planos <ArrowRight size={10} style={{ display: 'inline', verticalAlign: 'middle' }} />
        </Link>
      </div>
    </>
  )
}


// ── Alias para compatibilidade com imports antigos ────────────
export const PlanAction = PlanGate
