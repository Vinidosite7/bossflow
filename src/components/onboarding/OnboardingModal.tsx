'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap, Building2, Target, DollarSign, Check,
  ArrowRight, ArrowLeft, Loader2, Upload, TrendingUp, TrendingDown,
} from 'lucide-react'

const segments = [
  'Agência', 'E-commerce', 'Restaurante', 'Loja física',
  'Prestador de serviços', 'Clínica', 'Autônomo', 'Outro',
]

const STEPS = [
  { color: '#7c6ef7', glow: 'rgba(124,110,247,0.2)',  bg: 'rgba(124,110,247,0.1)',  border: 'rgba(124,110,247,0.2)' },
  { color: '#7c6ef7', glow: 'rgba(124,110,247,0.2)',  bg: 'rgba(124,110,247,0.1)',  border: 'rgba(124,110,247,0.2)' },
  { color: '#f97316', glow: 'rgba(249,115,22,0.2)',   bg: 'rgba(249,115,22,0.1)',   border: 'rgba(249,115,22,0.2)'  },
  { color: '#34d399', glow: 'rgba(52,211,153,0.2)',   bg: 'rgba(52,211,153,0.1)',   border: 'rgba(52,211,153,0.2)'  },
]

const PREVIEWS = [
  {
    badge: 'Bem-vindo',
    title: 'Controle total\ndo negócio',
    desc: 'Dashboard financeiro, metas, tarefas e muito mais numa única plataforma.',
    cards: [
      { label: 'Receita mensal',  value: 'R$ 12.840', sub: '+18% este mês',   up: true  },
      { label: 'Lucro líquido',   value: 'R$ 8.630',  sub: '+24% este mês',   up: true  },
      { label: 'Tarefas ativas',  value: '12',        sub: '3 para hoje',     up: true  },
      { label: 'Metas cumpridas', value: '3 de 5',    sub: '60% do objetivo', up: true  },
    ],
  },
  {
    badge: 'Sua empresa',
    title: 'Múltiplos negócios,\numa só plataforma',
    desc: 'Organize quantas empresas quiser e troque entre elas com um clique.',
    cards: [
      { label: 'Empresas',   value: 'Ilimitadas',    sub: 'Nos planos Pro',       up: true },
      { label: 'Membros',    value: 'Multi-usuário', sub: 'Convide sua equipe',   up: true },
      { label: 'Categorias', value: 'Custom',        sub: 'Você define',          up: true },
      { label: 'Permissões', value: '4 níveis',      sub: 'Owner a Viewer',       up: true },
    ],
  },
  {
    badge: 'Meta',
    title: 'Bata suas metas\ntodo mês',
    desc: 'Defina objetivos, acompanhe em tempo real e celebre cada conquista.',
    cards: [
      { label: 'Meta mensal',    value: 'R$ 10k',  sub: 'Você define',  up: true },
      { label: 'Super cota',     value: 'R$ 15k',  sub: 'Bônus extra',  up: true },
      { label: 'Progresso',      value: '68%',     sub: '+12% hoje',    up: true },
      { label: 'Dias restantes', value: '12',      sub: 'Deste mês',    up: true },
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
      { label: 'Transações', value: '47',       sub: 'Este mês',      up: true  },
    ],
  },
]

export function OnboardingModal({ onComplete }: { onComplete: () => void }) {
  const supabase = createClient()

  const [step,   setStep]   = useState(0)
  const [dir,    setDir]    = useState(1)
  const [saving, setSaving] = useState(false)

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
        .select().single()
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
      if (bizId && target) {
        const year  = new Date().getFullYear()
        const month = new Date().getMonth() + 1
        await supabase.from('goals').upsert(
          { business_id: bizId, month, year, target: parseFloat(target), super_target: superTarget ? parseFloat(superTarget) : null },
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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      if (bizId && txAmount) {
        await supabase.from('transactions').insert({
          business_id: bizId,
          type: txType,
          amount: parseFloat(txAmount),
          description: txDesc || (txType === 'income' ? 'Primeira entrada' : 'Primeira despesa'),
          date: new Date().toISOString().split('T')[0],
          paid: true,
          created_by: user.id,
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
  }

  const pIdx    = Math.min(step, 3)
  const preview = PREVIEWS[pIdx]
  const sm      = STEPS[pIdx]

  const formV = {
    enter:  (d: number) => ({ opacity: 0, y: d > 0 ? 20 : -20 }),
    center: { opacity: 1, y: 0 },
    exit:   (d: number) => ({ opacity: 0, y: d > 0 ? -20 : 20 }),
  }
  const leftV = {
    enter:  (d: number) => ({ opacity: 0, x: d > 0 ? 24 : -24 }),
    center: { opacity: 1, x: 0 },
    exit:   (d: number) => ({ opacity: 0, x: d > 0 ? -24 : 24 }),
  }

  return (
    <div className="fixed inset-0 z-50 flex" style={{ background: '#06060c' }}>

      {/* ═══ ESQUERDA ══════════════════════════════════════════════════════ */}
      <div className="hidden lg:flex flex-col flex-1 relative overflow-hidden"
        style={{ borderRight: '1px solid rgba(255,255,255,0.04)' }}>

        {/* Fundo dinâmico */}
        <motion.div key={`glow-${pIdx}`}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse 70% 55% at 25% 35%, ${sm.glow}, transparent)` }}
        />
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 50% 45% at 85% 85%, rgba(34,211,238,0.05), transparent)' }} />

        {/* Grid sutil */}
        <div className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }} />

        {/* Logo */}
        <div className="relative z-10 p-10 pb-0">
          <img src="/bossflow.png" alt="BossFlow" style={{ height: 28, objectFit: 'contain' }} />
        </div>

        {/* Conteúdo */}
        <div className="relative z-10 flex-1 flex flex-col justify-center px-12">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div key={`left-${pIdx}`}
              custom={dir} variants={leftV}
              initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.42, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.08 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-7"
                style={{ background: sm.bg, color: sm.color, border: `1px solid ${sm.border}` }}
              >
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: sm.color }} />
                {preview.badge}
              </motion.div>

              {/* Título */}
              <h2
                className="font-bold mb-5 leading-tight"
                style={{
                  fontFamily: 'Syne, sans-serif',
                  fontSize: 'clamp(30px, 2.8vw, 44px)',
                  background: `linear-gradient(135deg, #ffffff 50%, ${sm.color})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  whiteSpace: 'pre-line',
                }}
              >
                {preview.title}
              </h2>

              <p className="text-sm mb-10" style={{ color: '#4a4a6a', lineHeight: 1.75, maxWidth: 360 }}>
                {preview.desc}
              </p>

              {/* Cards 2x2 — harmônicos */}
              <div className="grid grid-cols-2 gap-4" style={{ maxWidth: 440 }}>
                {preview.cards.map((card, i) => (
                  <motion.div
                    key={`${pIdx}-${card.label}`}
                    initial={{ opacity: 0, y: 14, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.12 + i * 0.08, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="rounded-2xl p-5 relative overflow-hidden"
                    style={{
                      background: 'rgba(255,255,255,0.028)',
                      border: '1px solid rgba(255,255,255,0.07)',
                    }}
                  >
                    {i === 0 && (
                      <div className="absolute inset-0 pointer-events-none rounded-2xl"
                        style={{ background: `radial-gradient(circle at 20% 50%, ${sm.color}12, transparent 65%)` }} />
                    )}
                    <p className="text-xs mb-3 relative z-10" style={{ color: '#3a3a5c' }}>{card.label}</p>
                    <p className="font-bold mb-3 relative z-10 leading-none"
                      style={{
                        color: '#e8e8f0',
                        fontFamily: 'Syne, sans-serif',
                        fontSize: card.value.length > 8 ? '15px' : '22px',
                      }}>
                      {card.value}
                    </p>
                    <span
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold relative z-10"
                      style={{
                        background: card.up ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)',
                        color: card.up ? '#34d399' : '#f87171',
                      }}
                    >
                      {card.up ? '↑' : '↓'} {card.sub}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="relative z-10 px-12 pb-8">
          <p className="text-xs" style={{ color: '#1e1e2e' }}>© 2026 BossFlow · Feito no Brasil 🇧🇷</p>
        </div>
      </div>

      {/* ═══ DIREITA — form ════════════════════════════════════════════════ */}
      <div className="flex flex-col w-full lg:w-[420px] lg:max-w-[420px] relative"
        style={{ background: '#07070e' }}>

        {/* Glow dinâmico direita */}
        <motion.div
          key={`right-glow-${pIdx}`}
          animate={{ background: `radial-gradient(circle at 80% 10%, ${sm.glow.replace('0.2','0.07')}, transparent 65%)` }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0 pointer-events-none"
        />

        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <motion.div
            animate={{ width: `${Math.min((step / 4) * 100, 100)}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{ height: '100%', background: `linear-gradient(90deg, ${sm.color}, #22d3ee)` }}
          />
        </div>

        {/* Logo mobile + dots */}
        <div className="lg:hidden px-6 pt-8 flex items-center gap-3">
          <img src="/bossflow.png" alt="BossFlow" style={{ height: 24, objectFit: 'contain' }} />
          {step > 0 && step < 4 && (
            <div className="flex gap-1.5 ml-auto">
              {[1,2,3].map(s => (
                <motion.div key={s}
                  animate={{ width: step === s ? 16 : 5, background: step >= s ? sm.color : 'rgba(255,255,255,0.1)' }}
                  transition={{ duration: 0.3 }}
                  style={{ height: 5, borderRadius: 999 }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Form */}
        <div className="flex-1 flex flex-col justify-center px-7 sm:px-10 overflow-y-auto relative z-10"
          style={{ paddingTop: 32, paddingBottom: 'calc(env(safe-area-inset-bottom) + 32px)' }}>

          <AnimatePresence mode="wait" custom={dir}>

            {step === 0 && (
              <motion.div key="w" custom={dir} variants={formV}
                initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}>

                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 18 }}
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-7"
                  style={{ background: sm.bg, border: `1px solid ${sm.border}`, boxShadow: `0 0 28px ${sm.glow}` }}>
                  <Zap size={24} style={{ color: sm.color }} />
                </motion.div>

                <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Syne, sans-serif', color: '#e8e8f0' }}>
                  Bem-vindo ao BossFlow! 🎉
                </h2>
                <p className="text-sm mb-8" style={{ color: '#3a3a5c', lineHeight: 1.7 }}>
                  Configuração rápida em menos de 2 minutos.
                </p>

                <div className="flex flex-col gap-2.5 mb-8">
                  {[
                    { icon: '📊', text: 'Dashboard financeiro em tempo real' },
                    { icon: '🎯', text: 'Metas mensais com conquistas' },
                    { icon: '🏢', text: 'Gerencie múltiplas empresas' },
                    { icon: '📱', text: 'Funciona no celular como app' },
                  ].map(({ icon, text }, i) => (
                    <motion.div key={text}
                      initial={{ opacity: 0, x: -14 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.07 }}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm"
                      style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)', color: '#6b6b8a' }}>
                      <span className="text-lg">{icon}</span>{text}
                    </motion.div>
                  ))}
                </div>

                <motion.button
                  whileHover={{ scale: 1.01, boxShadow: '0 8px 40px rgba(124,110,247,0.5)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={goNext}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm"
                  style={{ background: 'linear-gradient(135deg, #7c6ef7, #9d6ef7)', color: 'white', boxShadow: '0 4px 32px rgba(124,110,247,0.35)' }}>
                  Começar configuração <ArrowRight size={16} />
                </motion.button>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="e" custom={dir} variants={formV}
                initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}>

                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6"
                  style={{ background: sm.bg, border: `1px solid ${sm.border}`, boxShadow: `0 0 20px ${sm.glow}` }}>
                  <Building2 size={22} style={{ color: sm.color }} />
                </div>
                <h2 className="text-2xl font-bold mb-1.5" style={{ fontFamily: 'Syne, sans-serif', color: '#e8e8f0' }}>Sua empresa</h2>
                <p className="text-sm mb-6" style={{ color: '#3a3a5c' }}>Você pode criar várias e trocar com 1 clique depois.</p>

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden shrink-0"
                    style={{ background: '#0d0d14', border: '2px dashed rgba(255,255,255,0.07)' }}>
                    {logoPreview ? <img src={logoPreview} alt="logo" className="w-full h-full object-cover" />
                      : <Building2 size={18} style={{ color: '#2a2a3e' }} />}
                  </div>
                  <label className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                    style={{ background: sm.bg, color: sm.color, border: `1px solid ${sm.border}` }}>
                    <Upload size={11} />{logoPreview ? 'Trocar logo' : 'Logo (opcional)'}
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogo} />
                  </label>
                </div>

                <input type="text" placeholder="Ex: Minha Loja, Studio X..."
                  value={businessName} onChange={e => setBusinessName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && businessName.trim() && saveEmpresa()}
                  autoFocus
                  className="w-full px-4 py-3.5 rounded-xl text-sm outline-none mb-4"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: '#e8e8f0', transition: 'border-color 0.2s, box-shadow 0.2s' }}
                  onFocus={e => { e.currentTarget.style.borderColor = sm.color + '60'; e.currentTarget.style.boxShadow = `0 0 0 3px ${sm.glow}` }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.boxShadow = 'none' }}
                />

                <div className="grid grid-cols-2 gap-2 mb-7">
                  {segments.map(s => (
                    <button key={s} type="button" onClick={() => setSegment(s)}
                      className="py-2.5 px-3 rounded-xl text-xs font-medium text-left transition-all"
                      style={{
                        background: segment === s ? sm.bg : 'rgba(255,255,255,0.025)',
                        color: segment === s ? sm.color : '#4a4a6a',
                        border: `1px solid ${segment === s ? sm.border : 'rgba(255,255,255,0.05)'}`,
                      }}>{s}</button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button onClick={goPrev} className="w-12 h-12 flex items-center justify-center rounded-xl shrink-0"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: '#4a4a6a' }}>
                    <ArrowLeft size={16} />
                  </button>
                  <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                    onClick={saveEmpresa} disabled={!businessName.trim() || saving}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all"
                    style={{
                      background: businessName.trim() ? 'linear-gradient(135deg,#7c6ef7,#9d6ef7)' : 'rgba(255,255,255,0.04)',
                      color: businessName.trim() ? 'white' : '#3a3a5c',
                      boxShadow: businessName.trim() ? '0 4px 28px rgba(124,110,247,0.35)' : 'none',
                    }}>
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <>Continuar <ArrowRight size={16} /></>}
                  </motion.button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="m" custom={dir} variants={formV}
                initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}>

                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6"
                  style={{ background: sm.bg, border: `1px solid ${sm.border}`, boxShadow: `0 0 20px ${sm.glow}` }}>
                  <Target size={22} style={{ color: sm.color }} />
                </div>
                <h2 className="text-2xl font-bold mb-1.5" style={{ fontFamily: 'Syne, sans-serif', color: '#e8e8f0' }}>Meta do mês</h2>
                <p className="text-sm mb-7" style={{ color: '#3a3a5c' }}>Quanto quer faturar? A super cota é um bônus extra.</p>

                <div className="flex flex-col gap-3 mb-7">
                  {[
                    { label: 'META (R$)', sub: null, color: '#f97316', value: target, set: setTarget, ph: 'Ex: 10.000' },
                    { label: 'SUPER COTA (R$)', sub: 'opcional', color: '#a78bfa', value: superTarget, set: setSuperTarget, ph: 'Ex: 15.000' },
                  ].map(f => (
                    <div key={f.label} className="p-5 rounded-2xl"
                      style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: f.color }}>{f.label}</span>
                        {f.sub && <span className="text-xs ml-auto" style={{ color: '#2a2a3e' }}>{f.sub}</span>}
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm" style={{ color: '#3a3a5c' }}>R$</span>
                        <input type="number" placeholder={f.ph} value={f.value}
                          onChange={e => f.set(e.target.value)}
                          className="flex-1 bg-transparent text-2xl font-bold outline-none"
                          style={{ color: '#e8e8f0', fontFamily: 'Syne, sans-serif' }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 mb-3">
                  <button onClick={goPrev} className="w-12 h-12 flex items-center justify-center rounded-xl shrink-0"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: '#4a4a6a' }}>
                    <ArrowLeft size={16} />
                  </button>
                  <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                    onClick={saveMeta} disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm"
                    style={{ background: 'linear-gradient(135deg,#f97316,#fb923c)', color: 'white', boxShadow: '0 4px 28px rgba(249,115,22,0.3)' }}>
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <>Continuar <ArrowRight size={16} /></>}
                  </motion.button>
                </div>
                <button onClick={() => { setDir(1); setStep(3) }}
                  className="w-full text-center text-xs py-2"
                  style={{ color: '#2a2a3e' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#4a4a6a'}
                  onMouseLeave={e => e.currentTarget.style.color = '#2a2a3e'}>
                  Pular por agora
                </button>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="l" custom={dir} variants={formV}
                initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}>

                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6"
                  style={{ background: sm.bg, border: `1px solid ${sm.border}`, boxShadow: `0 0 20px ${sm.glow}` }}>
                  <DollarSign size={22} style={{ color: sm.color }} />
                </div>
                <h2 className="text-2xl font-bold mb-1.5" style={{ fontFamily: 'Syne, sans-serif', color: '#e8e8f0' }}>Primeiro lançamento</h2>
                <p className="text-sm mb-7" style={{ color: '#3a3a5c' }}>Registre uma entrada ou saída pra ver o painel em ação.</p>

                <div className="flex flex-col gap-3 mb-7">
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'income',  label: 'Entrada', icon: <TrendingUp size={14} />,  color: '#34d399' },
                      { id: 'expense', label: 'Saída',   icon: <TrendingDown size={14} />, color: '#f87171' },
                    ].map(t => (
                      <motion.button key={t.id} whileTap={{ scale: 0.96 }}
                        onClick={() => setTxType(t.id as 'income' | 'expense')}
                        className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all"
                        style={{
                          background: txType === t.id ? `${t.color}12` : 'rgba(255,255,255,0.025)',
                          border: `1px solid ${txType === t.id ? t.color + '40' : 'rgba(255,255,255,0.05)'}`,
                          color: txType === t.id ? t.color : '#4a4a6a',
                          boxShadow: txType === t.id ? `0 0 20px ${t.color}18` : 'none',
                        }}>
                        {t.icon} {t.label}
                      </motion.button>
                    ))}
                  </div>

                  <div className="p-5 rounded-2xl"
                    style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm" style={{ color: '#3a3a5c' }}>R$</span>
                      <input type="number" placeholder="0,00" value={txAmount}
                        onChange={e => setTxAmount(e.target.value)}
                        className="flex-1 bg-transparent text-3xl font-bold outline-none"
                        style={{ color: txType === 'income' ? '#34d399' : '#f87171', fontFamily: 'Syne, sans-serif', transition: 'color 0.3s' }} />
                    </div>
                  </div>

                  <input type="text" placeholder="Descrição (opcional)" value={txDesc}
                    onChange={e => setTxDesc(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl text-sm outline-none"
                    style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', color: '#e8e8f0', transition: 'border-color 0.2s' }}
                    onFocus={e => e.currentTarget.style.borderColor = 'rgba(52,211,153,0.4)'}
                    onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'} />
                </div>

                <div className="flex gap-2 mb-3">
                  <button onClick={goPrev} className="w-12 h-12 flex items-center justify-center rounded-xl shrink-0"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: '#4a4a6a' }}>
                    <ArrowLeft size={16} />
                  </button>
                  <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                    onClick={saveLancamento} disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm"
                    style={{ background: 'linear-gradient(135deg,#34d399,#22d3ee)', color: '#050810', boxShadow: '0 4px 28px rgba(52,211,153,0.3)' }}>
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <>Finalizar <Check size={16} /></>}
                  </motion.button>
                </div>
                <button onClick={async () => {
                    const { data: { user } } = await supabase.auth.getUser()
                    if (user) await supabase.from('profiles').upsert({ id: user.id, onboarding_done: true })
                    goNext()
                  }}
                  className="w-full text-center text-xs py-2"
                  style={{ color: '#2a2a3e' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#4a4a6a'}
                  onMouseLeave={e => e.currentTarget.style.color = '#2a2a3e'}>
                  Pular por agora
                </button>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="d" custom={dir} variants={formV}
                initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}>

                <motion.div
                  initial={{ scale: 0, rotate: -15 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-7 text-3xl"
                  style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', boxShadow: '0 0 32px rgba(52,211,153,0.2)' }}>
                  🎉
                </motion.div>

                <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Syne, sans-serif', color: '#e8e8f0' }}>
                  Tudo pronto, Boss!
                </h2>
                <p className="text-sm mb-8" style={{ color: '#3a3a5c', lineHeight: 1.7 }}>
                  Sua empresa está configurada. Agora é só usar.
                </p>

                <div className="flex flex-col gap-2.5 mb-8">
                  {[
                    `Empresa "${businessName || 'sua empresa'}" criada`,
                    'Categorias padrão configuradas',
                    target ? `Meta de R$ ${parseFloat(target).toLocaleString('pt-BR')} definida` : 'Pronto para usar!',
                  ].map((text, i) => (
                    <motion.div key={text}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.12, type: 'spring', stiffness: 300, damping: 24 }}
                      className="flex items-center gap-3 p-3.5 rounded-xl text-sm"
                      style={{ background: 'rgba(52,211,153,0.04)', border: '1px solid rgba(52,211,153,0.12)' }}>
                      <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)' }}>
                        <Check size={12} style={{ color: '#34d399' }} />
                      </div>
                      <span style={{ color: '#6b6b8a' }}>{text}</span>
                    </motion.div>
                  ))}
                </div>

                <motion.button
                  whileHover={{ scale: 1.01, boxShadow: '0 8px 40px rgba(52,211,153,0.5)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={finish}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm"
                  style={{ background: 'linear-gradient(135deg,#34d399,#22d3ee)', color: '#050810', boxShadow: '0 4px 32px rgba(52,211,153,0.35)' }}>
                  Ir para o Dashboard <ArrowRight size={16} />
                </motion.button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Dots desktop */}
        {step > 0 && step < 4 && (
          <div className="hidden lg:flex justify-center gap-1.5 pb-8">
            {[1,2,3].map(s => (
              <motion.div key={s}
                animate={{ width: step === s ? 20 : 6, background: step >= s ? sm.color : 'rgba(255,255,255,0.08)' }}
                transition={{ duration: 0.3 }}
                style={{ height: 5, borderRadius: 999 }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
