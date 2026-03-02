'use client'

import { Zap, Check } from 'lucide-react'

const plans = [
  {
    name: 'Starter',
    price: 'Grátis',
    description: 'Para começar',
    features: ['1 empresa', '50 transações/mês', 'Clientes ilimitados', 'Tarefas e agenda'],
    current: true,
    accent: false,
  },
  {
    name: 'Pro',
    price: 'R$ 49',
    period: '/mês',
    description: 'Para quem cresce',
    features: ['5 empresas', 'Transações ilimitadas', 'Relatórios avançados', 'Múltiplos usuários', 'Suporte prioritário'],
    current: false,
    accent: true,
  },
  {
    name: 'Business',
    price: 'R$ 99',
    period: '/mês',
    description: 'Para times',
    features: ['Empresas ilimitadas', 'Tudo do Pro', 'API access', 'Integrações', 'Gerente de conta'],
    current: false,
    accent: false,
  },
]

export default function AssinaturaPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>Assinatura</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Escolha o plano ideal para seu negócio</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {plans.map(plan => (
          <div key={plan.name}
            className="rounded-2xl border p-6 flex flex-col gap-4"
            style={{
              background: plan.accent ? 'var(--accent-glow)' : 'var(--bg-card)',
              borderColor: plan.accent ? 'var(--accent)' : 'var(--border)',
              boxShadow: plan.accent ? '0 0 24px var(--accent-glow)' : 'none',
            }}>
            {plan.accent && (
              <span className="text-xs font-bold px-2 py-1 rounded-full self-start"
                style={{ background: 'var(--accent)', color: 'white' }}>
                Popular
              </span>
            )}
            <div>
              <h2 className="font-bold text-lg" style={{ fontFamily: 'Syne, sans-serif' }}>{plan.name}</h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{plan.description}</p>
            </div>
            <div className="flex items-end gap-1">
              <span className="text-3xl font-bold" style={{ fontFamily: 'Syne, sans-serif', color: plan.accent ? 'var(--accent-bright)' : 'var(--text)' }}>
                {plan.price}
              </span>
              {plan.period && <span className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>{plan.period}</span>}
            </div>
            <div className="flex flex-col gap-2 flex-1">
              {plan.features.map(f => (
                <div key={f} className="flex items-center gap-2 text-sm">
                  <Check size={14} style={{ color: plan.accent ? 'var(--accent-bright)' : 'var(--green)', flexShrink: 0 }} />
                  <span style={{ color: 'var(--text-muted)' }}>{f}</span>
                </div>
              ))}
            </div>
            <button
              disabled={plan.current}
              className="py-2.5 rounded-xl font-semibold text-sm transition-all mt-2"
              style={{
                background: plan.current ? 'var(--border)' : plan.accent ? 'var(--accent)' : 'var(--bg)',
                color: plan.current ? 'var(--text-muted)' : plan.accent ? 'white' : 'var(--text)',
                border: plan.accent ? 'none' : `1px solid var(--border-light)`,
                cursor: plan.current ? 'default' : 'pointer',
              }}>
              {plan.current ? 'Plano atual' : 'Assinar agora'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}