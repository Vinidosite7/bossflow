'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Lock, Zap, Star, Rocket, Building2, PartyPopper, X, Bot, CalendarClock, Share2, BarChart3, Target, BellDot } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { PLAN_LABELS, PLAN_PRICES, PLAN_CHECKOUT_URLS, type PlanKey } from '@/lib/plans'
import { SpotlightCard, ShimmerButton, Skeleton, GlowCorner } from '@/components/ui/bossflow-ui'

// ── Design System ──────────────────────────────────────────────────────────
import { T, card, inp, inpLg, inpSm, SYNE } from '@/lib/design'
import { fadeUp, scaleIn } from '@/lib/animations'

import { PageBackground } from '@/components/core'
// ─── Motion ──────────────────────────────────────────────────
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

// ─── Hook ────────────────────────────────────────────────────
function useSubscription() {
  const [plan, setPlan] = useState<string>('free')
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setLoading(false); return }
        const { data } = await supabase.from('subscriptions').select('plan, status').eq('user_id', user.id).eq('status', 'active').single()
        if (data?.plan) setPlan(data.plan)
      } catch { }
      finally { setLoading(false) }
    }
    load()
  }, [])
  return { plan, loading }
}

// ─── Types ───────────────────────────────────────────────────
type PlanDef = {
  key: PlanKey; title: string; subtitle: string; priceMonthly: number
  icon: React.ReactNode; highlight?: boolean; locked?: boolean; tag?: string
  currentPlan?: boolean; href?: string
  features: { text: string; available: boolean; badge?: string }[]
  cta: string
}

// ─── Tabela comparativa ───────────────────────────────────────
const compareRows = [
  { label: 'Empresas',              cols: ['1',        'Até 3',    'Ilimitadas', 'Ilimitadas'] },
  { label: 'Contas/Caixas',         cols: ['2',        '5',        'Ilimitadas', 'Ilimitadas'] },
  { label: 'Faturamento máx.',      cols: ['R$20k/mês','Ilimitado','Ilimitado',  'Ilimitado' ] },
  { label: 'Compartilhar empresa',  cols: ['—',        '✓',        '✓',          '✓'         ] },
  { label: 'Agendamento de contas', cols: ['—',        '✓',        '✓',          '✓'         ] },
  { label: 'Estagiário de IA',      cols: ['—',        '✓',        '✓',          '✓'         ] },
  { label: 'Export CSV',            cols: ['—',        'Básico',   'Completo',   'Completo'  ] },
  { label: 'Relatórios mensais',    cols: ['—',        '—',        '✓',          '✓'         ] },
  { label: 'Metas do mês',          cols: ['—',        '—',        '✓',          '✓'         ] },
  { label: 'Notif. inteligentes',   cols: ['—',        '—',        '✓',          '✓'         ] },
  { label: 'Suporte',               cols: ['Padrão',   'Padrão',   'Prioritário','VIP'        ] },
  { label: 'Onboarding assistido',  cols: ['—',        '—',        '✓',          '✓'         ] },
  { label: 'Auditoria completa',    cols: ['—',        '—',        '—',          '✓'         ] },
  { label: 'Integrações custom',    cols: ['—',        '—',        '—',          '✓'         ] },
]

// ─── PlanCard ────────────────────────────────────────────────
function PlanCard({ plan, fmt }: { plan: PlanDef; fmt: (v: number) => string }) {
  const isFree    = plan.priceMonthly === 0
  const accentCol = plan.currentPlan ? T.green : plan.highlight ? T.purple : T.border

  return (
    <motion.div variants={vCard} className="relative flex flex-col">
      <SpotlightCard className="rounded-2xl h-full flex flex-col overflow-hidden"
        spotlightColor={plan.highlight ? `${T.purple}14` : plan.currentPlan ? `${T.green}0a` : 'rgba(255,255,255,0.03)'}
        style={{ ...card, border: `1px solid ${accentCol}${plan.highlight ? '45' : plan.currentPlan ? '55' : ''}`, boxShadow: plan.currentPlan ? `0 0 24px ${T.green}10` : plan.highlight ? `0 0 32px ${T.purple}14` : 'none', opacity: plan.locked ? 0.55 : 1, padding: 0 }}>

        {/* Lock overlay */}
        {plan.locked && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-2xl"
            style={{ background: 'rgba(6,6,10,0.75)', backdropFilter: 'blur(4px)' }}>
            <Lock size={20} style={{ color: T.muted }} />
            <span className="text-xs font-bold" style={{ color: T.muted }}>Em breve</span>
          </div>
        )}

        {/* Tag topo */}
        {plan.currentPlan ? (
          <div className="w-full py-2 text-center text-xs font-bold tracking-wide"
            style={{ background: `${T.green}18`, color: T.green, borderBottom: `1px solid ${T.green}20` }}>✓ Seu plano atual</div>
        ) : plan.tag ? (
          <div className="w-full py-2 text-center text-xs font-bold tracking-wide"
            style={{ background: `${T.purple}18`, color: T.violet, borderBottom: `1px solid ${T.purple}22` }}>{plan.tag}</div>
        ) : null}

        <div className="p-5 flex-1 flex flex-col gap-4 relative">
          {plan.highlight && <GlowCorner color={`${T.purple}18`} position="bottom-right" />}

          {/* Icon + title */}
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl shrink-0"
              style={{ background: plan.currentPlan ? `${T.green}14` : plan.highlight ? `${T.purple}18` : 'rgba(255,255,255,0.05)', color: plan.currentPlan ? T.green : plan.highlight ? T.violet : T.sub, border: `1px solid ${plan.currentPlan ? `${T.green}22` : plan.highlight ? `${T.purple}28` : T.border}` }}>
              {plan.icon}
            </span>
            <div>
              <h2 className="font-bold text-base leading-none" style={{ fontFamily: SYNE, color: T.text }}>{plan.title}</h2>
              <p className="text-xs mt-0.5" style={{ color: T.muted }}>{plan.subtitle}</p>
            </div>
          </div>

          {/* Preço */}
          <div>
            <div className="flex items-end gap-1">
              <span className="text-3xl font-extrabold" style={{ fontFamily: SYNE, color: plan.currentPlan ? T.green : plan.highlight ? T.violet : T.text, textShadow: plan.highlight ? `0 0 28px ${T.purple}55` : 'none' }}>
                {isFree ? 'R$ 0' : `R$ ${fmt(plan.priceMonthly)}`}
              </span>
              <span className="text-xs mb-1.5" style={{ color: T.muted }}>/mês</span>
            </div>
            {!isFree && <p className="text-xs" style={{ color: T.muted, opacity: 0.55 }}>R$&nbsp;{fmt(plan.priceMonthly * 12)}/ano no anual</p>}
          </div>

          <div style={{ height: 1, background: T.border }} />

          {/* Features */}
          <div className="flex flex-col gap-2 flex-1">
            {plan.features.map(f => (
              <div key={f.text} className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full shrink-0"
                  style={{ background: f.available ? plan.currentPlan ? `${T.green}14` : plan.highlight ? `${T.purple}14` : 'rgba(255,255,255,0.06)' : 'transparent', color: f.available ? plan.currentPlan ? T.green : plan.highlight ? T.violet : T.sub : T.muted, border: f.available ? 'none' : `1px solid ${T.border}`, opacity: f.available ? 1 : 0.4 }}>
                  {f.available ? <Check size={9} strokeWidth={3} /> : <span style={{ fontSize: 8 }}>—</span>}
                </span>
                <span className="text-xs flex-1" style={{ color: f.available ? T.text : T.muted, opacity: f.available ? 1 : 0.45 }}>{f.text}</span>
                {f.badge && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0"
                    style={f.badge === 'novo' ? { background: `${T.purple}14`, color: T.violet } : { background: `${T.amber}14`, color: T.amber }}>
                    {f.badge}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* CTA */}
          {plan.href ? (
            <ShimmerButton onClick={() => { window.location.href = plan.href! }}
              className="w-full py-2.5 rounded-xl text-sm font-semibold mt-1"
              style={{ background: plan.highlight ? `linear-gradient(135deg, ${T.purple}, #a06ef7)` : 'rgba(255,255,255,0.05)', color: plan.highlight ? 'white' : T.text, border: `1px solid ${plan.highlight ? 'rgba(255,255,255,0.1)' : T.border}`, boxShadow: plan.highlight ? `0 0 28px ${T.purple}35` : 'none', cursor: 'pointer' }}>
              {plan.cta}
            </ShimmerButton>
          ) : (
            <button disabled className="w-full py-2.5 rounded-xl text-sm font-semibold mt-1"
              style={{ background: plan.currentPlan ? `${T.green}08` : 'rgba(255,255,255,0.03)', color: plan.currentPlan ? T.green : T.muted, border: `1px solid ${plan.currentPlan ? `${T.green}20` : T.border}`, cursor: 'default' }}>
              {plan.cta}
            </button>
          )}
        </div>
      </SpotlightCard>
    </motion.div>
  )
}

// ─── Page ────────────────────────────────────────────────────
export default function AssinaturaPage() {
  const searchParams  = useSearchParams()
  const sucesso       = searchParams.get('sucesso') === 'true'
  const [showBanner, setShowBanner] = useState(sucesso)
  const { plan: currentPlan, loading } = useSubscription()

  const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const plans: PlanDef[] = useMemo(() => [
    {
      key: 'free', title: 'Básico', subtitle: 'Para quem está começando.', priceMonthly: 0, icon: <Zap size={15} />,
      currentPlan: currentPlan === 'free',
      features: [
        { text: '1 empresa', available: true }, { text: '2 contas/caixas', available: true },
        { text: 'Dashboard do mês', available: true }, { text: 'Categorias', available: true },
        { text: 'Fluxo de caixa básico', available: true }, { text: 'Fatura até R$20k/mês', available: true, badge: 'limite' },
        { text: 'Agendamento de contas', available: false }, { text: 'Compartilhar empresa', available: false },
        { text: 'Estagiário de IA', available: false }, { text: 'Export CSV', available: false },
      ],
      cta: 'Plano atual',
    },
    {
      key: 'starter', title: 'Starter', subtitle: 'Para quem já tem uma operação rodando.', priceMonthly: PLAN_PRICES.starter, icon: <Star size={15} />,
      currentPlan: currentPlan === 'starter', href: currentPlan === 'starter' ? undefined : PLAN_CHECKOUT_URLS.starter,
      features: [
        { text: 'Até 3 empresas', available: true }, { text: '5 contas/caixas', available: true },
        { text: 'Dashboard + Financeiro', available: true }, { text: 'Histórico ampliado', available: true },
        { text: 'Agendamento de contas', available: true }, { text: 'Compartilhar empresa', available: true },
        { text: 'Estagiário de IA', available: true, badge: 'novo' }, { text: 'Export básico', available: true },
        { text: 'Relatórios mensais', available: false }, { text: 'Metas do mês', available: false },
      ],
      cta: currentPlan === 'starter' ? 'Plano atual' : 'Assinar Starter',
    },
    {
      key: 'pro', title: 'Pro', subtitle: 'Visão clara e decisão rápida.', priceMonthly: PLAN_PRICES.pro, icon: <Rocket size={15} />,
      highlight: true, tag: 'Mais vendido', currentPlan: currentPlan === 'pro', href: currentPlan === 'pro' ? undefined : PLAN_CHECKOUT_URLS.pro,
      features: [
        { text: 'Empresas ilimitadas', available: true }, { text: 'Contas ilimitadas', available: true },
        { text: 'Relatórios mensais', available: true }, { text: 'Metas do mês', available: true },
        { text: 'Export CSV completo', available: true }, { text: 'Histórico completo', available: true },
        { text: 'Estagiário de IA', available: true }, { text: 'Notificações inteligentes', available: true, badge: 'novo' },
        { text: 'Suporte prioritário', available: true }, { text: 'Onboarding assistido', available: true },
      ],
      cta: currentPlan === 'pro' ? 'Plano atual' : 'Ativar BossFlow Pro',
    },
    {
      key: 'scale', title: 'Scale', subtitle: 'Para quem já é monstro da escala.', priceMonthly: PLAN_PRICES.scale, icon: <Building2 size={15} />,
      locked: true, currentPlan: currentPlan === 'scale',
      features: [
        { text: 'Tudo do Pro', available: true }, { text: 'Auditoria completa', available: true },
        { text: 'Suporte VIP', available: true }, { text: 'Integrações sob demanda', available: true },
        { text: 'SLA garantido', available: true }, { text: 'Acesso antecipado', available: true },
        { text: 'Permissões por membro', available: true }, { text: 'Onboarding dedicado', available: true },
      ],
      cta: 'Em breve',
    },
  ], [currentPlan])

  const FEATURE_SECTIONS = [
    {
      title: 'O que você ganha no Starter',
      sub: 'Recursos que desbloqueiam na primeira assinatura',
      accent: T.purple,
      items: [
        { icon: <Bot size={16} />, title: 'Estagiário de IA', desc: 'Categorização automática e insights do seu caixa.' },
        { icon: <CalendarClock size={16} />, title: 'Agendamento', desc: 'Programe contas a pagar e a receber com antecedência.' },
        { icon: <Share2 size={16} />, title: 'Compartilhamento', desc: 'Convide sócios ou colaboradores para a empresa.' },
      ],
    },
    {
      title: 'Tudo do Starter +',
      sub: 'Exclusivo no Pro',
      accent: T.violet,
      badge: 'Pro',
      items: [
        { icon: <BarChart3 size={16} />, title: 'Relatórios mensais', desc: 'Acompanhe a evolução do seu negócio mês a mês.' },
        { icon: <Target size={16} />, title: 'Metas do mês', desc: 'Defina objetivos financeiros e acompanhe em tempo real.' },
        { icon: <BellDot size={16} />, title: 'Notif. inteligentes', desc: 'Alertas automáticos sobre fluxo de caixa e vencimentos.' },
      ],
    },
  ]

  return (
    <PageBackground>
      <div className="flex flex-col gap-8 pb-10">

        {/* Banner sucesso */}
        <AnimatePresence>
          {showBanner && (
            <motion.div initial={{ opacity: 0, y: -16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -16, scale: 0.97 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
              <SpotlightCard className="rounded-2xl" spotlightColor={`${T.green}0c`}
                style={{ ...card, border: `1px solid ${T.green}28`, padding: 0 }}>
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <PartyPopper size={18} style={{ color: T.green, flexShrink: 0 }} />
                  <div className="flex-1">
                    <p className="text-sm font-semibold" style={{ color: T.green }}>Pagamento confirmado! 🎉</p>
                    <p className="text-xs mt-0.5" style={{ color: T.muted }}>
                      Seu plano foi ativado. Bem-vindo ao BossFlow {PLAN_LABELS[currentPlan as PlanKey] ?? 'Básico'}!
                    </p>
                  </div>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowBanner(false)}
                    className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(255,255,255,0.05)', color: T.muted, border: `1px solid ${T.border}`, cursor: 'pointer' }}>
                    <X size={12} />
                  </motion.button>
                </div>
              </SpotlightCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <motion.div variants={vContainer} initial="hidden" animate="show" className="flex flex-col gap-1.5">
          <motion.h1 variants={vFadeUp} className="text-2xl font-bold tracking-tight" style={{ fontFamily: SYNE, color: T.text }}>
            Assinatura
          </motion.h1>
          <motion.div variants={vFadeUp} className="flex items-center gap-2 flex-wrap">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: T.purple, animationDuration: '1.4s' }} />
              <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: T.purple, boxShadow: `0 0 6px ${T.purple}` }} />
            </div>
            {loading ? (
              <Skeleton className="h-4 w-48 rounded-lg" />
            ) : (
              <p className="text-sm" style={{ color: T.muted }}>
                Você está no plano{' '}
                <span className="font-bold px-1.5 py-0.5 rounded-md text-xs"
                  style={{ background: `${T.purple}14`, color: T.violet, border: `1px solid ${T.purple}28` }}>
                  {PLAN_LABELS[currentPlan as PlanKey] ?? 'Básico'}
                </span>
                {' '}— faça upgrade a qualquer momento, sem fidelidade.
              </p>
            )}
          </motion.div>
        </motion.div>

        {/* Cards */}
        <motion.div variants={vContainer} initial="hidden" animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {plans.map(plan => <PlanCard key={plan.key} plan={plan} fmt={fmt} />)}
        </motion.div>

        {/* Feature Sections */}
        {FEATURE_SECTIONS.map(section => (
          <motion.div key={section.title} variants={vContainer} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }}>
            <SpotlightCard className="rounded-2xl" spotlightColor={`${section.accent}0a`}
              style={{ ...card, border: `1px solid ${section.accent}22`, padding: 0 }}>
              <div className="p-5 relative overflow-hidden">
                <GlowCorner color={`${section.accent}14`} position="bottom-right" />
                <motion.div variants={vFadeUp} className="flex items-center gap-2 mb-4">
                  {section.badge && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md"
                      style={{ background: `${section.accent}18`, color: section.accent }}>{section.badge}</span>
                  )}
                  <h2 className="text-base font-bold" style={{ fontFamily: SYNE, color: T.text }}>{section.title}</h2>
                </motion.div>
                <p className="text-xs mb-4" style={{ color: T.muted }}>{section.sub}</p>
                <motion.div variants={vFadeUp} className="grid sm:grid-cols-3 gap-3">
                  {section.items.map(item => (
                    <div key={item.title} className="flex gap-3 p-3.5 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.025)', border: `1px solid ${T.border}` }}>
                      <span className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: `${section.accent}12`, color: section.accent, border: `1px solid ${section.accent}22` }}>
                        {item.icon}
                      </span>
                      <div>
                        <p className="text-xs font-semibold" style={{ color: T.text }}>{item.title}</p>
                        <p className="text-xs mt-0.5 leading-relaxed" style={{ color: T.muted }}>{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </motion.div>
              </div>
            </SpotlightCard>
          </motion.div>
        ))}

        {/* Tabela comparativa */}
        <motion.div variants={vContainer} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.1 }} className="flex flex-col gap-4">
          <motion.div variants={vFadeUp}>
            <h2 className="text-base font-bold" style={{ fontFamily: SYNE, color: T.text }}>Comparação completa</h2>
            <p className="text-sm mt-0.5" style={{ color: T.muted }}>O Pro é o sweet spot para a maioria das operações.</p>
          </motion.div>
          <motion.div variants={vFadeUp}>
            <SpotlightCard className="rounded-2xl" spotlightColor={`${T.purple}08`} style={{ ...card, padding: 0 }}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                      <th className="py-3.5 px-4 text-left font-medium text-xs" style={{ color: T.muted }}>Recurso</th>
                      {['Básico', 'Starter', 'Pro ✦', 'Scale'].map((h, i) => (
                        <th key={h} className="py-3.5 px-4 text-left font-semibold text-xs"
                          style={{ color: i === 2 ? T.violet : T.text }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {compareRows.map((row, i) => (
                      <tr key={row.label} style={{ borderTop: `1px solid ${T.border}`, background: i % 2 !== 0 ? 'rgba(255,255,255,0.015)' : 'transparent' }}>
                        <td className="py-3 px-4 text-xs" style={{ color: T.muted }}>{row.label}</td>
                        {row.cols.map((c, ci) => (
                          <td key={ci} className="py-3 px-4 text-xs font-medium"
                            style={{ color: c === '—' ? T.muted : ci === 2 ? T.violet : T.text, opacity: c === '—' ? 0.3 : 1 }}>{c}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 text-xs" style={{ borderTop: `1px solid ${T.border}`, color: T.muted }}>
                Todos os planos incluem atualizações automáticas sem custo extra.
              </div>
            </SpotlightCard>
          </motion.div>
        </motion.div>

        {/* Trust */}
        <motion.div variants={vContainer} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }}
          className="grid sm:grid-cols-3 gap-3">
          {[
            { icon: '🔓', title: 'Sem fidelidade',    desc: 'Cancele quando quiser, sem multa.'          },
            { icon: '⚡', title: 'Setup em 2 min',    desc: 'Crie sua empresa e já use tudo.'            },
            { icon: '📦', title: 'Seus dados são seus', desc: 'Exporte tudo em CSV a qualquer hora.'     },
          ].map(item => (
            <motion.div key={item.title} variants={vCard}>
              <SpotlightCard className="rounded-xl h-full" style={{ ...card, padding: 0 }}>
                <div className="p-4">
                  <div className="text-xl mb-2">{item.icon}</div>
                  <div className="text-sm font-semibold" style={{ color: T.text }}>{item.title}</div>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: T.muted }}>{item.desc}</p>
                </div>
              </SpotlightCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </PageBackground>
  )
}
