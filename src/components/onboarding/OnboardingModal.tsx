'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap, Building2, Target, DollarSign, Check,
  ArrowRight, ArrowLeft, Loader2, Upload, TrendingUp, TrendingDown,
  BarChart2, Smartphone, Sparkles,
} from 'lucide-react'

// ─── Design tokens (mesmos da Header/Sidebar) ──────────────────
const S = {
  bg:      '#07070e',
  bgPanel: 'rgba(8,8,14,0.96)',
  border:  'rgba(255,255,255,0.055)',
  borderP: 'rgba(124,110,247,0.2)',
  text:    '#dcdcf0',
  sub:     '#6b6b8a',
  muted:   '#3a3a5c',
  dim:     '#1e1e2a',
}

const segments = [
  'Agência', 'E-commerce', 'Restaurante', 'Loja física',
  'Prestador de serviços', 'Clínica', 'Autônomo', 'Outro',
]

const STEPS = [
  { color: '#7c6ef7', glow: 'rgba(124,110,247,0.14)', bg: 'rgba(124,110,247,0.08)', border: 'rgba(124,110,247,0.2)' },
  { color: '#7c6ef7', glow: 'rgba(124,110,247,0.14)', bg: 'rgba(124,110,247,0.08)', border: 'rgba(124,110,247,0.2)' },
  { color: '#f97316', glow: 'rgba(249,115,22,0.14)',  bg: 'rgba(249,115,22,0.08)',  border: 'rgba(249,115,22,0.2)'  },
  { color: '#34d399', glow: 'rgba(52,211,153,0.14)',  bg: 'rgba(52,211,153,0.08)',  border: 'rgba(52,211,153,0.2)'  },
]

const PREVIEWS = [
  {
    badge: 'Bem-vindo',
    title: 'Controle total\ndo negócio',
    desc: 'Dashboard financeiro, metas, tarefas e muito mais numa única plataforma.',
    cards: [
      { label: 'Receita mensal',  value: 'R$ 12.840', sub: '+18% este mês',   up: true  },
      { label: 'Lucro líquido',   value: 'R$ 8.630',  sub: '+24% este mês',   up: true  },
      { label: 'Tarefas ativas',  value: '12',         sub: '3 para hoje',     up: true  },
      { label: 'Metas cumpridas', value: '3 de 5',     sub: '60% do objetivo', up: true  },
    ],
  },
  {
    badge: 'Sua empresa',
    title: 'Múltiplos negócios,\numa só plataforma',
    desc: 'Organize quantas empresas quiser e troque entre elas com um clique.',
    cards: [
      { label: 'Empresas',   value: 'Ilimitadas',    sub: 'Planos Pro/Scale',   up: true },
      { label: 'Membros',    value: 'Multi-usuário', sub: 'Convide sua equipe', up: true },
      { label: 'Categorias', value: 'Custom',        sub: 'Você define',        up: true },
      { label: 'Permissões', value: '4 níveis',      sub: 'Owner a Viewer',     up: true },
    ],
  },
  {
    badge: 'Meta mensal',
    title: 'Bata suas metas\ntodo mês',
    desc: 'Defina objetivos, acompanhe em tempo real e celebre cada conquista.',
    cards: [
      { label: 'Meta mensal',    value: 'R$ 10k', sub: 'Você define', up: true },
      { label: 'Super cota',     value: 'R$ 15k', sub: 'Bônus extra', up: true },
      { label: 'Progresso',      value: '68%',    sub: '+12% hoje',   up: true },
      { label: 'Dias restantes', value: '12',     sub: 'Deste mês',   up: true },
    ],
  },
  {
    badge: 'Lançamentos',
    title: 'Registre tudo\nem segundos',
    desc: 'Entradas, saídas e categorias. Veja o painel atualizar em tempo real.',
    cards: [
      { label: 'Entradas',   value: 'R$ 8.200', sub: '+22% este mês', up: true  },
      { label: 'Saídas',     value: 'R$ 3.100', sub: '-8% este mês',  up: false },
      { label: 'Saldo',      value: 'R$ 5.100', sub: '+31% este mês', up: true  },
      { label: 'Transações', value: '47',        sub: 'Este mês',      up: true  },
    ],
  },
]

const FEATURES = [
  { Icon: BarChart2,  color: '#7c6ef7', text: 'Dashboard financeiro em tempo real' },
  { Icon: Target,     color: '#f97316', text: 'Metas mensais com conquistas'        },
  { Icon: Building2,  color: '#22d3ee', text: 'Gerencie múltiplas empresas'         },
  { Icon: Smartphone, color: '#34d399', text: 'Funciona no celular como app'        },
]

// ─── Animações ─────────────────────────────────────────────────
const fV = {
  enter:  (d: number) => ({ opacity: 0, y: d > 0 ? 18 : -18 }),
  center: { opacity: 1, y: 0 },
  exit:   (d: number) => ({ opacity: 0, y: d > 0 ? -14 : 14 }),
}
const lV = {
  enter:  (d: number) => ({ opacity: 0, x: d > 0 ? 24 : -24 }),
  center: { opacity: 1, x: 0 },
  exit:   (d: number) => ({ opacity: 0, x: d > 0 ? -20 : 20 }),
}

// ─── Inputs reutilizáveis ──────────────────────────────────────
function Input({ value, onChange, placeholder, type = 'text', color = '#7c6ef7', autoFocus = false, onKeyDown }: {
  value: string; onChange: (v: string) => void; placeholder: string
  type?: string; color?: string; autoFocus?: boolean
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      autoFocus={autoFocus}
      onChange={e => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      style={{
        width: '100%', padding: '13px 15px', borderRadius: 13,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        color: S.text, fontSize: 14, outline: 'none', boxSizing: 'border-box',
        fontFamily: 'DM Sans, sans-serif',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}
      onFocus={e => {
        e.currentTarget.style.borderColor = color + '60'
        e.currentTarget.style.boxShadow = `0 0 0 3px ${color}18`
      }}
      onBlur={e => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    />
  )
}

// ─── Botão back ────────────────────────────────────────────────
function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      width: 48, height: 52, flexShrink: 0, borderRadius: 13, cursor: 'pointer',
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.07)',
      color: S.sub, display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'all 0.15s',
    }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = S.text }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = S.sub }}
    >
      <ArrowLeft size={16} />
    </button>
  )
}

// ─── Skip link ─────────────────────────────────────────────────
function SkipBtn({ onClick, label = 'Pular por agora' }: { onClick: () => void; label?: string }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', background: 'none', border: 'none', cursor: 'pointer',
      color: S.muted, fontSize: 13, padding: '10px 0', transition: 'color 0.2s',
      fontFamily: 'DM Sans, sans-serif',
    }}
      onMouseEnter={e => e.currentTarget.style.color = S.sub}
      onMouseLeave={e => e.currentTarget.style.color = S.muted}
    >
      {label}
    </button>
  )
}

// ─── Preview card ──────────────────────────────────────────────
function PreviewCard({ label, value, sub, up }: { label: string; value: string; sub: string; up: boolean }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.025)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 18, padding: '18px 18px 14px',
      backdropFilter: 'blur(8px)',
    }}>
      <p style={{ color: S.muted, fontSize: 11, marginBottom: 10, fontFamily: 'DM Sans, sans-serif' }}>{label}</p>
      <p style={{
        color: S.text, fontFamily: 'Syne, sans-serif', fontWeight: 700,
        fontSize: value.length > 8 ? 15 : 22, marginBottom: 10, lineHeight: 1,
      }}>
        {value}
      </p>
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '3px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600,
        background: up ? 'rgba(52,211,153,0.09)' : 'rgba(248,113,113,0.09)',
        color: up ? '#34d399' : '#f87171',
        border: `1px solid ${up ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)'}`,
      }}>
        {up ? '↑' : '↓'} {sub}
      </span>
    </div>
  )
}

// ─── Componente principal ──────────────────────────────────────
export function OnboardingModal({ onComplete }: { onComplete: () => void }) {
  const supabase = createClient()

  const [step,         setStep]         = useState(0)
  const [dir,          setDir]          = useState(1)
  const [saving,       setSaving]       = useState(false)
  const [businessName, setBusinessName] = useState('')
  const [segment,      setSegment]      = useState('')
  const [logoFile,     setLogoFile]     = useState<File | null>(null)
  const [logoPreview,  setLogoPreview]  = useState('')
  const [bizId,        setBizId]        = useState<string | null>(null)
  const [target,       setTarget]       = useState('')
  const [superTarget,  setSuperTarget]  = useState('')
  const [txType,       setTxType]       = useState<'income' | 'expense'>('income')
  const [txAmount,     setTxAmount]     = useState('')
  const [txDesc,       setTxDesc]       = useState('')

  function goNext() { setDir(1);  setStep(s => s + 1) }
  function goPrev() { setDir(-1); setStep(s => s - 1) }

  function handleLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setLogoFile(f)
    setLogoPreview(URL.createObjectURL(f))
  }

  async function saveEmpresa() {
    if (!businessName.trim()) return
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      let logo_url: string | null = null
      if (logoFile) {
        const ext  = logoFile.name.split('.').pop()
        const path = `logos/${user.id}-${Date.now()}.${ext}`
        const { error } = await supabase.storage.from('business-logos').upload(path, logoFile, { upsert: true })
        if (!error) {
          const { data } = supabase.storage.from('business-logos').getPublicUrl(path)
          logo_url = data.publicUrl
        }
      }
      const { data: biz } = await supabase.from('businesses')
        .insert({ name: businessName, logo_url, owner_id: user.id })
        .select().maybeSingle()
      if (biz) {
        localStorage.setItem('activeBizId', biz.id)
        setBizId(biz.id)
        await supabase.from('categories').insert([
          { business_id: biz.id, name: 'Vendas',             type: 'income',  color: '#34d399' },
          { business_id: biz.id, name: 'Serviços',           type: 'income',  color: '#22d3ee' },
          { business_id: biz.id, name: 'Aluguel',            type: 'expense', color: '#f87171' },
          { business_id: biz.id, name: 'Fornecedores',       type: 'expense', color: '#fbbf24' },
          { business_id: biz.id, name: 'Marketing',          type: 'expense', color: '#a78bfa' },
          { business_id: biz.id, name: 'Folha de pagamento', type: 'expense', color: '#fb923c' },
        ])
        await supabase.from('profiles').upsert({ id: user.id, onboarding_step: 'meta' })
      }
      goNext()
    } finally { setSaving(false) }
  }

  async function saveMeta() {
    setSaving(true)
    try {
      const activeBizId = bizId || localStorage.getItem('activeBizId')
      if (activeBizId && target) {
        const year  = new Date().getFullYear()
        const month = new Date().getMonth() + 1
        await supabase.from('goals').upsert(
          { business_id: activeBizId, month, year, target: parseFloat(target), super_target: superTarget ? parseFloat(superTarget) : null },
          { onConflict: 'business_id,month,year' }
        )
      }
      const { data: { user } } = await supabase.auth.getUser()
      if (user) await supabase.from('profiles').upsert({ id: user.id, onboarding_step: 'lancamento' })
      goNext()
    } finally { setSaving(false) }
  }

  async function saveLancamento() {
    setSaving(true)
    try {
      await supabase.auth.refreshSession()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const activeBizId = bizId || localStorage.getItem('activeBizId')
      if (activeBizId && txAmount) {
        const title = txDesc || (txType === 'income' ? 'Primeira entrada' : 'Primeira despesa')
        await supabase.from('transactions').insert({
          business_id: activeBizId, type: txType, title,
          amount: parseFloat(txAmount), description: txDesc || null,
          date: new Date().toISOString().split('T')[0], paid: true, created_by: user.id,
        })
      }
      await supabase.from('profiles').upsert({ id: user.id, onboarding_done: true, onboarding_step: 'done' })
      goNext()
    } finally { setSaving(false) }
  }

  async function finish() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) await supabase.from('profiles').upsert({ id: user.id, onboarding_done: true })
    onComplete()
    window.location.href = '/dashboard'
  }

  const pIdx    = Math.min(step, 3)
  const preview = PREVIEWS[pIdx]
  const sm      = STEPS[pIdx]

  return (
    <div className="fixed inset-0 z-50 flex overflow-hidden" style={{ background: S.bg }}>

      {/* ══════════════════════════════════════════════════════ */}
      {/* LADO ESQUERDO — preview animado                       */}
      {/* ══════════════════════════════════════════════════════ */}
      <div
        className="hidden lg:flex flex-col flex-1 relative overflow-hidden"
        style={{ borderRight: `1px solid ${S.border}` }}
      >
        {/* Glow ambiental */}
        <motion.div key={`glow-${pIdx}`}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.9 }}
          aria-hidden style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: `radial-gradient(ellipse 65% 50% at 28% 35%, ${sm.glow}, transparent), radial-gradient(ellipse 35% 35% at 80% 78%, rgba(34,211,238,0.06), transparent)`,
          }}
        />

        {/* Grid dot */}
        <div aria-hidden style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '32px 32px', opacity: 0.35,
        }} />

        {/* Logo */}
        <div style={{ position: 'relative', zIndex: 10, padding: '44px 52px 0' }}>
          <img src="/bossflow.png" alt="BossFlow" style={{ height: 26, objectFit: 'contain', opacity: 0.9 }} />
        </div>

        {/* Preview */}
        <div style={{
          position: 'relative', zIndex: 10, flex: 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '36px 52px',
        }}>
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div key={`left-${pIdx}`} custom={dir} variants={lV}
              initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.38, ease: [0.25, 0.46, 0.45, 0.94] }}
              style={{ width: '100%', maxWidth: 480 }}
            >
              {/* Badge animado */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '5px 14px', borderRadius: 999, marginBottom: 22,
                background: sm.bg, color: sm.color,
                border: `1px solid ${sm.border}`,
                fontSize: 11, fontWeight: 700, fontFamily: 'Syne, sans-serif',
                letterSpacing: '0.06em',
              }}>
                <motion.span
                  animate={{ opacity: [1, 0.25, 1] }}
                  transition={{ repeat: Infinity, duration: 2.2 }}
                  style={{ width: 6, height: 6, borderRadius: '50%', background: sm.color, display: 'block', flexShrink: 0 }}
                />
                {preview.badge}
              </div>

              {/* Título */}
              <h2 style={{
                fontFamily: 'Syne, sans-serif',
                fontSize: 'clamp(30px, 3vw, 50px)',
                fontWeight: 800, lineHeight: 1.1, marginBottom: 14,
                background: `linear-gradient(140deg, #ffffff 35%, ${sm.color})`,
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                whiteSpace: 'pre-line', letterSpacing: '-0.03em',
              }}>
                {preview.title}
              </h2>

              <p style={{
                color: '#4a4a6a', fontSize: 15, lineHeight: 1.72,
                marginBottom: 36, maxWidth: 360,
                fontFamily: 'DM Sans, sans-serif',
              }}>
                {preview.desc}
              </p>

              {/* Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {preview.cards.map((card, i) => (
                  <motion.div key={`${pIdx}-${i}`}
                    initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.07, duration: 0.38 }}>
                    <PreviewCard {...card} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div style={{ position: 'relative', zIndex: 10, padding: '0 52px 32px' }}>
          <p style={{ color: S.dim, fontSize: 11, fontFamily: 'DM Sans, sans-serif' }}>© 2026 BossFlow · Feito no Brasil</p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════ */}
      {/* LADO DIREITO — formulário                             */}
      {/* ══════════════════════════════════════════════════════ */}
      <div className="flex flex-col w-full lg:w-[440px] lg:max-w-[440px]"
        style={{ background: 'rgba(6,6,12,0.98)', position: 'relative', borderLeft: `1px solid ${S.border}` }}>

        {/* Glow ambiente */}
        <div aria-hidden style={{
          position: 'absolute', top: -80, right: -80, width: 360, height: 360,
          pointerEvents: 'none',
          background: `radial-gradient(circle, ${sm.glow}, transparent 70%)`,
          transition: 'background 0.7s ease',
        }} />

        {/* Barra de progresso topo */}
        <div aria-hidden style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'rgba(255,255,255,0.04)' }}>
          <motion.div
            animate={{ width: `${Math.min((step / 4) * 100, 100)}%` }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            style={{
              height: '100%',
              background: `linear-gradient(90deg, ${sm.color}, #22d3ee)`,
              borderRadius: 1,
            }}
          />
        </div>

        {/* Logo mobile */}
        <div className="lg:hidden" style={{ padding: '32px 32px 0', display: 'flex', alignItems: 'center' }}>
          <img src="/bossflow.png" alt="BossFlow" style={{ height: 22, objectFit: 'contain' }} />
          {step > 0 && step < 4 && (
            <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
              {[1, 2, 3].map(s => (
                <motion.div key={s}
                  animate={{ width: step === s ? 18 : 5, background: step >= s ? sm.color : 'rgba(255,255,255,0.09)' }}
                  transition={{ duration: 0.3 }} style={{ height: 5, borderRadius: 999 }} />
              ))}
            </div>
          )}
        </div>

        {/* Conteúdo */}
        <div className="relative z-10 flex-1 overflow-y-auto"
          style={{
            padding: '40px 40px',
            paddingBottom: 'calc(env(safe-area-inset-bottom) + 40px)',
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
          }}>
          <AnimatePresence mode="wait" custom={dir}>

            {/* ── Step 0: Welcome ─────────────────────────────── */}
            {step === 0 && (
              <motion.div key="w" custom={dir} variants={fV} initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.32, ease: [0.25, 0.46, 0.45, 0.94] }}>

                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 18 }}
                  style={{
                    width: 56, height: 56, borderRadius: 18,
                    background: sm.bg, border: `1px solid ${sm.border}`,
                    boxShadow: `0 0 36px ${sm.glow}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 26,
                  }}>
                  <Zap size={24} style={{ color: sm.color }} />
                </motion.div>

                <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 800, color: S.text, marginBottom: 8, letterSpacing: '-0.02em' }}>
                  Bem-vindo ao BossFlow!
                </h2>
                <p style={{ color: S.muted, fontSize: 14, lineHeight: 1.7, marginBottom: 26, fontFamily: 'DM Sans, sans-serif' }}>
                  Configuração rápida em menos de 2 minutos.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 30 }}>
                  {FEATURES.map(({ Icon, color, text }, i) => (
                    <motion.div key={text}
                      initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.08 + i * 0.07 }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '11px 14px', borderRadius: 13,
                        background: 'rgba(255,255,255,0.025)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        color: S.sub, fontSize: 13.5,
                        fontFamily: 'DM Sans, sans-serif',
                      }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                        background: `${color}10`, border: `1px solid ${color}22`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Icon size={15} style={{ color }} />
                      </div>
                      {text}
                    </motion.div>
                  ))}
                </div>

                <motion.button
                  whileHover={{ scale: 1.01, boxShadow: '0 8px 40px rgba(124,110,247,0.5)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={goNext}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '15px 24px', borderRadius: 15, border: 'none', cursor: 'pointer',
                    background: 'linear-gradient(135deg, #7c6ef7, #9d6ef7)',
                    color: 'white', fontWeight: 700, fontSize: 14,
                    fontFamily: 'Syne, sans-serif',
                    boxShadow: '0 4px 32px rgba(124,110,247,0.32)',
                  }}>
                  Começar configuração <ArrowRight size={15} />
                </motion.button>
              </motion.div>
            )}

            {/* ── Step 1: Empresa ──────────────────────────────── */}
            {step === 1 && (
              <motion.div key="e" custom={dir} variants={fV} initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.32, ease: [0.25, 0.46, 0.45, 0.94] }}>

                <div style={{
                  width: 48, height: 48, borderRadius: 15, marginBottom: 22,
                  background: sm.bg, border: `1px solid ${sm.border}`,
                  boxShadow: `0 0 28px ${sm.glow}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Building2 size={21} style={{ color: sm.color }} />
                </div>

                <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 23, fontWeight: 800, color: S.text, marginBottom: 8, letterSpacing: '-0.02em' }}>
                  Sua empresa
                </h2>
                <p style={{ color: S.muted, fontSize: 14, lineHeight: 1.7, marginBottom: 24, fontFamily: 'DM Sans, sans-serif' }}>
                  Você pode criar várias e trocar com 1 clique depois.
                </p>

                {/* Logo upload */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div style={{
                    width: 46, height: 46, borderRadius: 13, flexShrink: 0,
                    background: 'rgba(255,255,255,0.03)',
                    border: `2px dashed ${logoPreview ? sm.border : 'rgba(255,255,255,0.07)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                    transition: 'border-color 0.2s',
                  }}>
                    {logoPreview
                      ? <img src={logoPreview} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <Building2 size={17} style={{ color: S.muted }} />}
                  </div>
                  <label style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '7px 13px', borderRadius: 10, cursor: 'pointer',
                    background: sm.bg, color: sm.color,
                    border: `1px solid ${sm.border}`,
                    fontSize: 12, fontWeight: 600,
                    fontFamily: 'DM Sans, sans-serif',
                    transition: 'opacity 0.15s',
                  }}>
                    <Upload size={11} />
                    {logoPreview ? 'Trocar logo' : 'Logo (opcional)'}
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogo} />
                  </label>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <Input
                    value={businessName}
                    onChange={setBusinessName}
                    placeholder="Nome da empresa..."
                    color={sm.color}
                    autoFocus
                    onKeyDown={e => e.key === 'Enter' && businessName.trim() && saveEmpresa()}
                  />
                </div>

                {/* Segmentos */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, marginBottom: 26 }}>
                  {segments.map(s => (
                    <button key={s} type="button" onClick={() => setSegment(s === segment ? '' : s)}
                      style={{
                        padding: '9px 11px', borderRadius: 11, cursor: 'pointer',
                        textAlign: 'left', fontSize: 13, fontWeight: 500,
                        fontFamily: 'DM Sans, sans-serif',
                        background: segment === s ? sm.bg : 'rgba(255,255,255,0.02)',
                        color: segment === s ? sm.color : S.muted,
                        border: `1px solid ${segment === s ? sm.border : 'rgba(255,255,255,0.05)'}`,
                        transition: 'all 0.15s',
                      }}>
                      {s}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <BackBtn onClick={goPrev} />
                  <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                    onClick={saveEmpresa} disabled={!businessName.trim() || saving}
                    style={{
                      flex: 1, height: 52, borderRadius: 13, border: 'none',
                      cursor: businessName.trim() ? 'pointer' : 'not-allowed',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      background: businessName.trim()
                        ? 'linear-gradient(135deg, #7c6ef7, #9d6ef7)'
                        : 'rgba(255,255,255,0.04)',
                      color: businessName.trim() ? 'white' : S.muted,
                      fontWeight: 700, fontSize: 14, fontFamily: 'Syne, sans-serif',
                      boxShadow: businessName.trim() ? '0 4px 28px rgba(124,110,247,0.28)' : 'none',
                      transition: 'all 0.2s', opacity: saving ? 0.7 : 1,
                    }}>
                    {saving ? <Loader2 size={15} className="animate-spin" /> : <>Continuar <ArrowRight size={15} /></>}
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* ── Step 2: Meta ─────────────────────────────────── */}
            {step === 2 && (
              <motion.div key="m" custom={dir} variants={fV} initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.32, ease: [0.25, 0.46, 0.45, 0.94] }}>

                <div style={{
                  width: 48, height: 48, borderRadius: 15, marginBottom: 22,
                  background: sm.bg, border: `1px solid ${sm.border}`,
                  boxShadow: `0 0 28px ${sm.glow}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Target size={21} style={{ color: sm.color }} />
                </div>

                <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 23, fontWeight: 800, color: S.text, marginBottom: 8, letterSpacing: '-0.02em' }}>
                  Meta do mês
                </h2>
                <p style={{ color: S.muted, fontSize: 14, lineHeight: 1.7, marginBottom: 24, fontFamily: 'DM Sans, sans-serif' }}>
                  Quanto quer faturar? A super cota é um bônus extra.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 26 }}>
                  {[
                    { label: 'META',       sub: '',         color: '#f97316', value: target,      set: setTarget,      ph: 'Ex: 10.000' },
                    { label: 'SUPER COTA', sub: 'opcional', color: '#a78bfa', value: superTarget, set: setSuperTarget, ph: 'Ex: 15.000' },
                  ].map(f => (
                    <div key={f.label} style={{
                      padding: '18px 18px 14px', borderRadius: 16,
                      background: 'rgba(255,255,255,0.025)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                        <span style={{
                          color: f.color, fontSize: 10, fontWeight: 800,
                          letterSpacing: '0.1em', fontFamily: 'Syne, sans-serif',
                        }}>
                          {f.label}
                        </span>
                        {f.sub && <span style={{ color: S.muted, fontSize: 11, marginLeft: 'auto', fontFamily: 'DM Sans, sans-serif' }}>{f.sub}</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                        <span style={{ color: S.muted, fontSize: 14, fontFamily: 'DM Sans, sans-serif' }}>R$</span>
                        <input type="number" placeholder={f.ph} value={f.value}
                          onChange={e => f.set(e.target.value)}
                          style={{
                            flex: 1, background: 'transparent', border: 'none', outline: 'none',
                            color: S.text, fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 26,
                          }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                  <BackBtn onClick={goPrev} />
                  <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                    onClick={saveMeta} disabled={saving}
                    style={{
                      flex: 1, height: 52, borderRadius: 13, cursor: 'pointer', border: 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      background: 'linear-gradient(135deg, #f97316, #fb923c)',
                      color: 'white', fontWeight: 700, fontSize: 14,
                      fontFamily: 'Syne, sans-serif',
                      boxShadow: '0 4px 28px rgba(249,115,22,0.26)',
                      opacity: saving ? 0.7 : 1,
                    }}>
                    {saving ? <Loader2 size={15} className="animate-spin" /> : <>Continuar <ArrowRight size={15} /></>}
                  </motion.button>
                </div>
                <SkipBtn onClick={() => { setDir(1); setStep(3) }} />
              </motion.div>
            )}

            {/* ── Step 3: Lançamento ───────────────────────────── */}
            {step === 3 && (
              <motion.div key="l" custom={dir} variants={fV} initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.32, ease: [0.25, 0.46, 0.45, 0.94] }}>

                <div style={{
                  width: 48, height: 48, borderRadius: 15, marginBottom: 22,
                  background: sm.bg, border: `1px solid ${sm.border}`,
                  boxShadow: `0 0 28px ${sm.glow}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <DollarSign size={21} style={{ color: sm.color }} />
                </div>

                <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 23, fontWeight: 800, color: S.text, marginBottom: 8, letterSpacing: '-0.02em' }}>
                  Primeiro lançamento
                </h2>
                <p style={{ color: S.muted, fontSize: 14, lineHeight: 1.7, marginBottom: 22, fontFamily: 'DM Sans, sans-serif' }}>
                  Registre uma entrada ou saída pra ver o painel em ação.
                </p>

                {/* Tipo */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9, marginBottom: 12 }}>
                  {[
                    { id: 'income',  label: 'Entrada', Icon: TrendingUp,   color: '#34d399' },
                    { id: 'expense', label: 'Saída',   Icon: TrendingDown, color: '#f87171' },
                  ].map(t => (
                    <motion.button key={t.id} whileTap={{ scale: 0.97 }}
                      onClick={() => setTxType(t.id as 'income' | 'expense')}
                      style={{
                        padding: '13px 12px', borderRadius: 13, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        fontSize: 14, fontWeight: 700, fontFamily: 'Syne, sans-serif',
                        background: txType === t.id ? `${t.color}10` : 'rgba(255,255,255,0.025)',
                        border: `1px solid ${txType === t.id ? t.color + '35' : 'rgba(255,255,255,0.06)'}`,
                        color: txType === t.id ? t.color : S.sub,
                        boxShadow: txType === t.id ? `0 0 24px ${t.color}14` : 'none',
                        transition: 'all 0.18s',
                      }}>
                      <t.Icon size={14} /> {t.label}
                    </motion.button>
                  ))}
                </div>

                {/* Valor */}
                <div style={{
                  padding: '18px', borderRadius: 15, marginBottom: 10,
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ color: S.muted, fontSize: 14 }}>R$</span>
                    <input type="number" placeholder="0,00" value={txAmount}
                      onChange={e => setTxAmount(e.target.value)}
                      style={{
                        flex: 1, background: 'transparent', border: 'none', outline: 'none',
                        color: txType === 'income' ? '#34d399' : '#f87171',
                        fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 30,
                        transition: 'color 0.25s',
                      }} />
                  </div>
                </div>

                <div style={{ marginBottom: 22 }}>
                  <Input
                    value={txDesc} onChange={setTxDesc}
                    placeholder="Descrição (opcional)"
                    color="#34d399"
                  />
                </div>

                <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                  <BackBtn onClick={goPrev} />
                  <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                    onClick={saveLancamento} disabled={saving}
                    style={{
                      flex: 1, height: 52, borderRadius: 13, cursor: 'pointer', border: 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      background: 'linear-gradient(135deg, #34d399, #22d3ee)',
                      color: '#050810', fontWeight: 700, fontSize: 14,
                      fontFamily: 'Syne, sans-serif',
                      boxShadow: '0 4px 28px rgba(52,211,153,0.25)',
                      opacity: saving ? 0.7 : 1,
                    }}>
                    {saving ? <Loader2 size={15} className="animate-spin" /> : <>Finalizar <Check size={15} /></>}
                  </motion.button>
                </div>
                <SkipBtn onClick={async () => {
                  const { data: { user } } = await supabase.auth.getUser()
                  if (user) await supabase.from('profiles').upsert({ id: user.id, onboarding_done: true })
                  goNext()
                }} />
              </motion.div>
            )}

            {/* ── Step 4: Done ─────────────────────────────────── */}
            {step === 4 && (
              <motion.div key="d" custom={dir} variants={fV} initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.32, ease: [0.25, 0.46, 0.45, 0.94] }}>

                <motion.div
                  initial={{ scale: 0, rotate: -12 }} animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                  style={{
                    width: 64, height: 64, borderRadius: 20, marginBottom: 26,
                    background: 'linear-gradient(135deg, rgba(52,211,153,0.12), rgba(34,211,238,0.10))',
                    border: '1px solid rgba(52,211,153,0.25)',
                    boxShadow: '0 0 44px rgba(52,211,153,0.22)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                  <Sparkles size={28} style={{ color: '#34d399' }} />
                </motion.div>

                <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 800, color: S.text, marginBottom: 10, letterSpacing: '-0.02em' }}>
                  Tudo pronto, Boss! 🎉
                </h2>
                <p style={{ color: S.muted, fontSize: 14, lineHeight: 1.7, marginBottom: 28, fontFamily: 'DM Sans, sans-serif' }}>
                  Sua empresa está configurada. Agora é só usar.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 30 }}>
                  {[
                    `Empresa "${businessName || 'sua empresa'}" criada`,
                    'Categorias padrão configuradas',
                    target ? `Meta de R$ ${parseFloat(target).toLocaleString('pt-BR')} definida` : 'Pronto para usar!',
                  ].map((text, i) => (
                    <motion.div key={text}
                      initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.11, type: 'spring', stiffness: 300, damping: 24 }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '13px 15px', borderRadius: 13,
                        background: 'rgba(52,211,153,0.04)',
                        border: '1px solid rgba(52,211,153,0.1)',
                      }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                        background: 'rgba(52,211,153,0.12)',
                        border: '1px solid rgba(52,211,153,0.25)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Check size={11} style={{ color: '#34d399' }} />
                      </div>
                      <span style={{ color: S.sub, fontSize: 13.5, fontFamily: 'DM Sans, sans-serif' }}>{text}</span>
                    </motion.div>
                  ))}
                </div>

                <motion.button
                  whileHover={{ scale: 1.01, boxShadow: '0 8px 44px rgba(52,211,153,0.45)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={finish}
                  style={{
                    width: '100%', height: 54, borderRadius: 15, border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    background: 'linear-gradient(135deg, #34d399, #22d3ee)',
                    color: '#050810', fontWeight: 700, fontSize: 14,
                    fontFamily: 'Syne, sans-serif',
                    boxShadow: '0 4px 32px rgba(52,211,153,0.32)',
                  }}>
                  Ir para o Dashboard <ArrowRight size={15} />
                </motion.button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Dots de progresso — desktop */}
        {step > 0 && step < 4 && (
          <div className="hidden lg:flex" style={{ justifyContent: 'center', gap: 8, paddingBottom: 28 }}>
            {[1, 2, 3].map(s => (
              <motion.div key={s}
                animate={{ width: step === s ? 22 : 6, background: step >= s ? sm.color : 'rgba(255,255,255,0.07)' }}
                transition={{ duration: 0.3 }} style={{ height: 6, borderRadius: 999 }} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
