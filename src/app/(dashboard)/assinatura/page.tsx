'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Lock, Zap, Star, Rocket, Building2, PartyPopper, X } from 'lucide-react'
import { createClient } from '@/lib/supabase'

/* ─── Hook: plano atual do Supabase ────────────────────────────────────── */
function useSubscription() {
  const [plan, setPlan] = useState<string>('free')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setLoading(false); return }

        const { data } = await supabase
          .from('subscriptions')
          .select('plan, status')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single()

        if (data?.plan) setPlan(data.plan)
      } catch { /* sem assinatura = free */ }
      finally { setLoading(false) }
    }
    load()
  }, [])

  return { plan, loading }
}

/* ─── Motion ───────────────────────────────────────────────────────────── */
const vContainer = {
  hidden: { opacity: 1 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
}
const vFadeUp = {
  hidden: { opacity: 0, y: 16, filter: 'blur(6px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
}
const vCard = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const } },
}

/* ─── Types ────────────────────────────────────────────────────────────── */
type Plan = {
  key: string
  title: string
  subtitle: string
  priceMonthly: number
  icon: React.ReactNode
  highlight?: boolean
  locked?: boolean
  tag?: string
  currentPlan?: boolean
  href?: string
  features: { text: string; available: boolean }[]
  cta: string
}

/* ─── Compare rows ─────────────────────────────────────────────────────── */
const compareRows = [
  { label: 'Empresas',      cols: ['1', 'Até 3', 'Ilimitadas', 'Ilimitadas'] },
  { label: 'Contas/Caixas', cols: ['2', '5', 'Ilimitadas', 'Ilimitadas'] },
  { label: 'Relatórios',    cols: ['—', '—', 'Mensais', 'Auditoria'] },
  { label: 'Metas do mês',  cols: ['—', '—', '✓', '✓'] },
  { label: 'Export CSV',    cols: ['—', 'Básico', 'Completo', 'Avançado'] },
  { label: 'Suporte',       cols: ['Padrão', 'Padrão', 'Prioritário', 'VIP'] },
  { label: 'Onboarding',    cols: ['—', '—', '—', 'Assistido'] },
]

const PLAN_LABELS: Record<string, string> = {
  free: 'Gratuito',
  starter: 'Starter',
  pro: 'Pro',
  scale: 'Scale',
}

/* ─── Page ─────────────────────────────────────────────────────────────── */
export default function AssinaturaPage() {
  const searchParams = useSearchParams()
  const sucesso = searchParams.get('sucesso') === 'true'
  const [showBanner, setShowBanner] = useState(sucesso)
  const { plan: currentPlan, loading } = useSubscription()

  const fmt = (v: number) =>
    v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const plans: Plan[] = useMemo(() => [
    {
      key: 'free',
      title: 'Gratuito',
      subtitle: 'Para quem está começando.',
      priceMonthly: 0,
      icon: <Zap size={15} />,
      currentPlan: currentPlan === 'free',
      features: [
        { text: '1 empresa', available: true },
        { text: '2 contas/caixas', available: true },
        { text: 'Dashboard do mês', available: true },
        { text: 'Categorias', available: true },
        { text: 'Fluxo de caixa básico', available: true },
        { text: 'Relatórios mensais', available: false },
        { text: 'Metas do mês', available: false },
        { text: 'Export CSV', available: false },
      ],
      cta: 'Plano atual',
    },
    {
      key: 'starter',
      title: 'Starter',
      subtitle: 'Para quem já tem uma operação rodando.',
      priceMonthly: 39.90,
      icon: <Star size={15} />,
      currentPlan: currentPlan === 'starter',
      href: currentPlan === 'starter' ? undefined : 'https://pay.cakto.com.br/ewnmtb7_790932',
      features: [
        { text: 'Até 3 empresas', available: true },
        { text: '5 contas/caixas', available: true },
        { text: 'Dashboard + Financeiro', available: true },
        { text: 'Histórico ampliado', available: true },
        { text: 'Export básico', available: true },
        { text: 'Relatórios mensais', available: false },
        { text: 'Metas do mês', available: false },
        { text: 'Suporte prioritário', available: false },
      ],
      cta: currentPlan === 'starter' ? 'Plano atual' : 'Assinar Starter',
    },
    {
      key: 'pro',
      title: 'Pro',
      subtitle: 'Visão clara e decisão rápida.',
      priceMonthly: 69.90,
      icon: <Rocket size={15} />,
      highlight: true,
      tag: 'Mais vendido',
      currentPlan: currentPlan === 'pro',
      href: currentPlan === 'pro' ? undefined : 'https://pay.cakto.com.br/roe67up_790935',
      features: [
        { text: 'Empresas ilimitadas', available: true },
        { text: 'Contas ilimitadas', available: true },
        { text: 'Relatórios mensais', available: true },
        { text: 'Metas do mês', available: true },
        { text: 'Export CSV completo', available: true },
        { text: 'Histórico completo', available: true },
        { text: 'Suporte prioritário', available: true },
        { text: 'Onboarding assistido', available: false },
      ],
      cta: currentPlan === 'pro' ? 'Plano atual' : 'Ativar BossFlow Pro',
    },
    {
      key: 'scale',
      title: 'Scale',
      subtitle: 'Para quem já é monstro da escala.',
      priceMonthly: 149,
      icon: <Building2 size={15} />,
      locked: true,
      currentPlan: currentPlan === 'scale',
      features: [
        { text: 'Tudo do Pro', available: true },
        { text: 'Onboarding assistido', available: true },
        { text: 'Suporte VIP', available: true },
        { text: 'Permissões por membro', available: true },
        { text: 'Auditoria completa', available: true },
        { text: 'Integrações sob demanda', available: true },
        { text: 'SLA garantido', available: true },
        { text: 'Acesso antecipado', available: true },
      ],
      cta: 'Em breve',
    },
  ], [currentPlan])

  return (
    <div className="flex flex-col gap-8 pb-10">

      {/* Banner de sucesso */}
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.97 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
            style={{
              background: 'rgba(34,197,94,0.08)',
              border: '1px solid rgba(34,197,94,0.25)',
            }}
          >
            <PartyPopper size={18} style={{ color: 'rgb(34,197,94)', flexShrink: 0 }} />
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: 'rgb(34,197,94)' }}>
                Pagamento confirmado! 🎉
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#4a4a6a' }}>
                Seu plano foi ativado. Bem-vindo ao BossFlow {PLAN_LABELS[currentPlan]}!
              </p>
            </div>
            <button
              onClick={() => setShowBanner(false)}
              className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'rgba(255,255,255,0.05)', color: '#4a4a6a' }}
            >
              <X size={12} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div variants={vContainer} initial="hidden" animate="show" className="flex flex-col gap-1">
        <motion.h1 variants={vFadeUp} className="text-2xl font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>
          Assinatura
        </motion.h1>
        <motion.p variants={vFadeUp} className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {loading ? (
            <span>Carregando plano...</span>
          ) : (
            <>
              Você está no plano{' '}
              <span
                className="font-semibold px-1.5 py-0.5 rounded-md text-xs"
                style={{ background: 'var(--accent-glow)', color: 'var(--accent-bright)', border: '1px solid var(--accent-border)' }}
              >
                {PLAN_LABELS[currentPlan] ?? 'Gratuito'}
              </span>
              {' '}— faça upgrade a qualquer momento, sem fidelidade.
            </>
          )}
        </motion.p>
      </motion.div>

      {/* Cards */}
      <motion.div
        variants={vContainer} initial="hidden" animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
      >
        {plans.map((plan) => (
          <PlanCard key={plan.key} plan={plan} fmt={fmt} />
        ))}
      </motion.div>

      {/* Tabela comparativa */}
      <motion.div
        variants={vContainer} initial="hidden" whileInView="show"
        viewport={{ once: true, amount: 0.15 }} className="flex flex-col gap-4"
      >
        <motion.div variants={vFadeUp}>
          <h2 className="text-base font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>Comparação completa</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            O Pro é o sweet spot para a maioria das operações.
          </p>
        </motion.div>

        <motion.div
          variants={vFadeUp}
          className="rounded-2xl border overflow-hidden"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th className="py-3.5 px-4 text-left font-medium text-xs" style={{ color: 'var(--text-muted)' }}>Recurso</th>
                  {['Gratuito', 'Starter', 'Pro ✦', 'Scale'].map((h, i) => (
                    <th key={h} className="py-3.5 px-4 text-left font-semibold text-xs"
                      style={{ color: i === 2 ? 'var(--accent-bright)' : 'var(--text)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {compareRows.map((row, i) => (
                  <tr key={row.label} style={{
                    borderTop: '1px solid var(--border)',
                    background: i % 2 !== 0 ? 'var(--bg-hover)' : 'transparent',
                  }}>
                    <td className="py-3 px-4 text-xs" style={{ color: 'var(--text-muted)' }}>{row.label}</td>
                    {row.cols.map((c, ci) => (
                      <td key={ci} className="py-3 px-4 text-xs font-medium" style={{
                        color: c === '—' ? 'var(--text-muted)' : ci === 2 ? 'var(--accent-bright)' : 'var(--text)',
                        opacity: c === '—' ? 0.35 : 1,
                      }}>{c}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 text-xs" style={{ borderTop: '1px solid var(--border)', color: 'var(--text-muted)' }}>
            Todos os planos incluem atualizações automáticas sem custo extra.
          </div>
        </motion.div>
      </motion.div>

      {/* Trust */}
      <motion.div
        variants={vContainer} initial="hidden" whileInView="show"
        viewport={{ once: true, amount: 0.15 }} className="grid sm:grid-cols-3 gap-3"
      >
        {[
          { icon: '🔓', title: 'Sem fidelidade', desc: 'Cancele quando quiser, sem multa.' },
          { icon: '⚡', title: 'Setup em 2 min', desc: 'Crie sua empresa e já use tudo.' },
          { icon: '📦', title: 'Seus dados são seus', desc: 'Exporte tudo em CSV a qualquer hora.' },
        ].map((item) => (
          <motion.div key={item.title} variants={vCard} className="rounded-xl border p-4"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <div className="text-xl mb-2">{item.icon}</div>
            <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{item.title}</div>
            <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-muted)' }}>{item.desc}</p>
          </motion.div>
        ))}
      </motion.div>

    </div>
  )
}

/* ─── Plan Card ─────────────────────────────────────────────────────────── */
function PlanCard({ plan, fmt }: { plan: Plan; fmt: (v: number) => string }) {
  const isFree = plan.priceMonthly === 0

  return (
    <motion.div
      variants={vCard}
      className="relative rounded-2xl border flex flex-col overflow-hidden"
      style={{
        background: plan.highlight ? 'var(--accent-glow)' : 'var(--bg-card)',
        borderColor: plan.currentPlan ? 'rgba(34,197,94,0.4)' : plan.highlight ? 'var(--accent-border)' : 'var(--border)',
        boxShadow: plan.currentPlan ? '0 0 20px rgba(34,197,94,0.1)' : plan.highlight ? '0 0 28px var(--accent-glow)' : 'none',
        opacity: plan.locked ? 0.55 : 1,
      }}
    >
      {/* Tag do topo */}
      {plan.currentPlan ? (
        <div className="w-full py-2 text-center text-xs font-bold tracking-wide"
          style={{ background: 'rgba(34,197,94,0.15)', color: 'rgb(34,197,94)' }}>
          ✓ Seu plano atual
        </div>
      ) : plan.tag ? (
        <div className="w-full py-2 text-center text-xs font-bold tracking-wide"
          style={{ background: 'var(--accent)', color: 'white' }}>
          {plan.tag}
        </div>
      ) : null}

      {plan.locked && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-2xl"
          style={{ background: 'color-mix(in srgb, var(--bg-card) 80%, transparent)', backdropFilter: 'blur(3px)' }}>
          <Lock size={20} style={{ color: 'var(--text-muted)' }} />
          <span className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>Em breve</span>
        </div>
      )}

      <div className="p-5 flex-1 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg shrink-0"
            style={{
              background: plan.currentPlan ? 'rgba(34,197,94,0.15)' : plan.highlight ? 'var(--accent)' : 'var(--bg-hover)',
              color: plan.currentPlan ? 'rgb(34,197,94)' : plan.highlight ? 'white' : 'var(--text-muted)',
            }}>
            {plan.icon}
          </span>
          <div>
            <h2 className="font-bold text-base leading-none" style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text)' }}>
              {plan.title}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{plan.subtitle}</p>
          </div>
        </div>

        <div>
          <div className="flex items-end gap-1">
            <span className="text-3xl font-extrabold"
              style={{
                fontFamily: 'Syne, sans-serif',
                color: plan.currentPlan ? 'rgb(34,197,94)' : plan.highlight ? 'var(--accent-bright)' : 'var(--text)',
              }}>
              {isFree ? 'R$ 0' : `R$ ${fmt(plan.priceMonthly)}`}
            </span>
            <span className="text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>/mês</span>
          </div>
          {!isFree && (
            <p className="text-xs" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
              R$&nbsp;{fmt(plan.priceMonthly * 12)}/ano no anual
            </p>
          )}
        </div>

        <div style={{ borderTop: '1px solid var(--border)' }} />

        <div className="flex flex-col gap-2 flex-1">
          {plan.features.map((f) => (
            <div key={f.text} className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full shrink-0"
                style={{
                  background: f.available
                    ? plan.currentPlan ? 'rgba(34,197,94,0.15)' : plan.highlight ? 'var(--accent)' : 'var(--bg-hover)'
                    : 'transparent',
                  color: f.available
                    ? plan.currentPlan ? 'rgb(34,197,94)' : plan.highlight ? 'white' : 'var(--text-muted)'
                    : 'var(--text-muted)',
                  border: f.available ? 'none' : '1px solid var(--border)',
                  opacity: f.available ? 1 : 0.4,
                }}>
                {f.available ? <Check size={9} strokeWidth={3} /> : <span style={{ fontSize: 9 }}>—</span>}
              </span>
              <span className="text-xs"
                style={{ color: f.available ? 'var(--text)' : 'var(--text-muted)', opacity: f.available ? 1 : 0.5 }}>
                {f.text}
              </span>
            </div>
          ))}
        </div>

        {/* CTA */}
        {plan.href ? (
          <button
            onClick={() => { window.location.href = plan.href! }}
            className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all mt-1"
            style={{
              background: plan.highlight ? 'var(--accent)' : 'var(--bg-hover)',
              color: plan.highlight ? 'white' : 'var(--text)',
              border: plan.highlight ? 'none' : '1px solid var(--border-light)',
              cursor: 'pointer',
            }}
          >
            {plan.cta}
          </button>
        ) : (
          <button
            disabled
            className="w-full py-2.5 rounded-xl text-sm font-semibold mt-1"
            style={{
              background: plan.currentPlan ? 'rgba(34,197,94,0.08)' : 'var(--bg-hover)',
              color: plan.currentPlan ? 'rgb(34,197,94)' : 'var(--text-muted)',
              border: plan.currentPlan ? '1px solid rgba(34,197,94,0.2)' : '1px solid var(--border-light)',
              cursor: 'default',
            }}
          >
            {plan.cta}
          </button>
        )}
      </div>
    </motion.div>
  )
}
