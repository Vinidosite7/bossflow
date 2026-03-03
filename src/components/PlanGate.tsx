'use client'

import Link from 'next/link'
import { Lock, Zap } from 'lucide-react'

type Plan = 'free' | 'starter' | 'pro' | 'scale'

const PLAN_ORDER: Plan[] = ['free', 'starter', 'pro', 'scale']
const PLAN_LABELS: Record<Plan, string> = {
  free: 'Gratuito',
  starter: 'Starter',
  pro: 'Pro',
  scale: 'Scale',
}

interface PlanGateProps {
  currentPlan: string
  requiredPlan: Plan
  feature: string           // ex: "Relatórios mensais"
  description?: string      // ex: "Acompanhe sua evolução mês a mês"
  children: React.ReactNode
  mode?: 'blur' | 'hide'   // blur = mostra mas bloqueia, hide = esconde
}

export function PlanGate({
  currentPlan,
  requiredPlan,
  feature,
  description,
  children,
  mode = 'blur',
}: PlanGateProps) {
  const currentIdx = PLAN_ORDER.indexOf(currentPlan as Plan)
  const requiredIdx = PLAN_ORDER.indexOf(requiredPlan)
  const hasAccess = currentIdx >= requiredIdx

  if (hasAccess) return <>{children}</>

  if (mode === 'hide') {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: 'rgba(124,110,247,0.1)', border: '1px solid rgba(124,110,247,0.2)' }}>
          <Lock size={22} style={{ color: '#7c6ef7' }} />
        </div>
        <p className="font-semibold mb-1" style={{ color: '#e8e8f0' }}>{feature}</p>
        <p className="text-sm mb-5" style={{ color: '#4a4a6a' }}>
          {description ?? `Disponível no plano ${PLAN_LABELS[requiredPlan]}`}
        </p>
        <Link href="/assinatura"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{ background: 'linear-gradient(135deg, #7c6ef7, #9d8fff)', color: 'white' }}>
          <Zap size={14} /> Fazer upgrade
        </Link>
      </div>
    )
  }

  // mode = blur
  return (
    <div className="relative rounded-2xl overflow-hidden">
      {/* Conteúdo desfocado */}
      <div className="pointer-events-none select-none" style={{ filter: 'blur(4px)', opacity: 0.4 }}>
        {children}
      </div>

      {/* Overlay de bloqueio */}
      <div className="absolute inset-0 flex flex-col items-center justify-center"
        style={{ background: 'rgba(8,8,16,0.7)', backdropFilter: 'blur(2px)' }}>
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
          <Link href="/assinatura"
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
            style={{ background: 'linear-gradient(135deg, #7c6ef7, #9d8fff)', color: 'white', boxShadow: '0 0 20px rgba(124,110,247,0.3)' }}>
            <Zap size={12} /> Upgrade para {PLAN_LABELS[requiredPlan]}
          </Link>
        </div>
      </div>
    </div>
  )
}

// Componente menor para bloquear só um botão/ação
interface PlanActionProps {
  currentPlan: string
  requiredPlan: Plan
  children: React.ReactNode
  tooltip?: string
}

export function PlanAction({ currentPlan, requiredPlan, children, tooltip }: PlanActionProps) {
  const currentIdx = PLAN_ORDER.indexOf(currentPlan as Plan)
  const requiredIdx = PLAN_ORDER.indexOf(requiredPlan)
  const hasAccess = currentIdx >= requiredIdx

  if (hasAccess) return <>{children}</>

  return (
    <Link href="/assinatura" title={tooltip ?? `Disponível no plano ${PLAN_LABELS[requiredPlan]}`}
      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
      style={{ background: 'rgba(124,110,247,0.08)', border: '1px solid rgba(124,110,247,0.2)', color: '#7c6ef7' }}>
      <Lock size={11} /> {PLAN_LABELS[requiredPlan]}
    </Link>
  )
}
