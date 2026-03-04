'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
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
  { icon: Zap,        color: '#7c6ef7', bg: 'rgba(124,110,247,0.12)', border: 'rgba(124,110,247,0.25)' },
  { icon: Building2,  color: '#7c6ef7', bg: 'rgba(124,110,247,0.12)', border: 'rgba(124,110,247,0.25)' },
  { icon: Target,     color: '#f97316', bg: 'rgba(249,115,22,0.12)',  border: 'rgba(249,115,22,0.25)'  },
  { icon: DollarSign, color: '#34d399', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.25)'  },
]

const PREVIEWS = [
  {
    title: 'Controle total do negócio',
    desc: 'Dashboard financeiro, metas, tarefas e muito mais numa única plataforma.',
    stats: [
      { label: 'Receita', value: 'R$ 12.840', change: '+18%', up: true },
      { label: 'Lucro',   value: 'R$ 8.630',  change: '+24%', up: true },
      { label: 'Tarefas', value: '12 pendentes', change: '3 hoje', up: true },
    ],
  },
  {
    title: 'Sua empresa no centro',
    desc: 'Organize múltiplos negócios e troque com um clique.',
    stats: [
      { label: 'Empresas',  value: 'Ilimitadas', change: 'Pro/Scale', up: true },
      { label: 'Membros',   value: 'Multi-usuário', change: 'Convide equipe', up: true },
      { label: 'Categorias', value: 'Personalizadas', change: 'Você define', up: true },
    ],
  },
  {
    title: 'Bata suas metas todo mês',
    desc: 'Defina objetivos, acompanhe em tempo real e celebre conquistas.',
    stats: [
      { label: 'Meta mensal',  value: 'R$ 10.000', change: 'Você define', up: true },
      { label: 'Super cota',   value: 'R$ 15.000', change: 'Bônus extra',  up: true },
      { label: 'Progresso',    value: '68%',        change: '+12% hoje',   up: true },
    ],
  },
  {
    title: 'Lançamentos em segundos',
    desc: 'Registre entradas e saídas rapidamente e veja o painel atualizar.',
    stats: [
      { label: 'Entradas', value: 'R$ 8.200',  change: '+22%', up: true  },
      { label: 'Saídas',   value: 'R$ 3.100',  change: '-8%',  up: false },
      { label: 'Saldo',    value: 'R$ 5.100',  change: '+31%', up: true  },
    ],
  },
]

export function OnboardingModal({ onComplete }: { onComplete: () => void }) {
  const supabase = createClient()

  const [step,    setStep]    = useState(0)
  const [dir,     setDir]     = useState(1)
  const [saving,  setSaving]  = useState(false)

  const [businessName, setBusinessName] = useState('')
  const [segment,      setSegment]      = useState('')
  const [logoFile,     setLogoFile]     = useState<File | null>(null)
  const [logoPreview,  setLogoPreview]  = useState('')
  const [bizId,        setBizId]        = useState<string | null>(null)

  const [target,      setTarget]      = useState('')
  const [superTarget, setSuperTarget] = useState('')

  const [txType,   setTxType]   = useState<'income' | 'expense'>('income')
  const [txAmount, setTxAmount] = useState('')
  const [txDesc,   setTxDesc]   = useState('')

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

  const isDone = step === 4
  const previewIdx = Math.min(step, 3)
  const preview = PREVIEWS[previewIdx]
  const stepMeta = STEPS[previewIdx]
  const StepIcon = stepMeta.icon

  const slideVariants = {
    enter: (d: number) => ({ opacity: 0, x: d * 32, scale: 0.98 }),
    center: { opacity: 1, x: 0, scale: 1 },
    exit:  (d: number) => ({ opacity: 0, x: -d * 32, scale: 0.98 }),
  }

  return (
    <div
      className="fixed inset-0 z-50 flex"
      style={{ background: '#06060c' }}
    >
      {/* ── LADO ESQUERDO — visual (só desktop) ───────────────── */}
      <div
        className="hidden lg:flex flex-col justify-between flex-1 relative overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #0a0a14 0%, #06060c 100%)',
          borderRight: '1px solid rgba(255,255,255,0.04)',
        }}
      >
        {/* Glow de fundo animado */}
        <motion.div
          key={previewIdx}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="absolute pointer-events-none"
          style={{
            top: '20%', left: '10%',
            width: 500, height: 500,
            background: `radial-gradient(circle, ${stepMeta.color}18, transparent 70%)`,
            filter: 'blur(60px)',
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: '10%', right: '5%',
            width: 300, height: 300,
            background: 'radial-gradient(circle, rgba(34,211,238,0.08), transparent 70%)',
            filter: 'blur(40px)',
          }}
        />

        {/* Logo */}
        <div className="relative z-10 p-10">
          <img src="/bossflow.png" alt="BossFlow" style={{ height: 30, objectFit: 'contain' }} />
        </div>

        {/* Conteúdo central */}
        <div className="relative z-10 flex-1 flex flex-col justify-center px-10 pb-8">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={previewIdx}
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              {/* Badge do step */}
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6"
                style={{ background: stepMeta.bg, color: stepMeta.color, border: `1px solid ${stepMeta.border}` }}
              >
                <StepIcon size={12} />
                {step === 0 ? 'Bem-vindo' : step === 1 ? 'Empresa' : step === 2 ? 'Meta' : 'Lançamento'}
              </div>

              <h2
                className="text-4xl font-bold mb-3 leading-tight"
                style={{
                  fontFamily: 'Syne, sans-serif',
                  background: `linear-gradient(135deg, #ffffff, ${stepMeta.color})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {preview.title}
              </h2>
              <p className="text-base mb-10" style={{ color: '#4a4a6a', lineHeight: 1.6 }}>
                {preview.desc}
              </p>

              {/* Mini dashboard preview */}
              <div
                className="rounded-2xl p-5"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  boxShadow: `0 0 60px ${stepMeta.color}10`,
                }}
              >
                {/* Topbar mock */}
                <div className="flex items-center gap-2 mb-5 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="flex gap-1.5">
                    {['#f87171','#fbbf24','#34d399'].map(c => (
                      <div key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c, opacity: 0.7 }} />
                    ))}
                  </div>
                  <div className="flex-1 mx-3 h-5 rounded-md flex items-center px-2"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <span className="text-xs" style={{ color: '#3a3a5c' }}>app.bossflow.pro/dashboard</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  {preview.stats.map((s, i) => (
                    <motion.div
                      key={s.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="rounded-xl p-3"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
                    >
                      <p className="text-xs mb-1.5" style={{ color: '#3a3a5c' }}>{s.label}</p>
                      <p className="text-sm font-bold mb-1" style={{ color: '#e8e8f0', fontFamily: 'Syne, sans-serif' }}>
                        {s.value}
                      </p>
                      <span
                        className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
                        style={{
                          background: s.up ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)',
                          color: s.up ? '#34d399' : '#f87171',
                        }}
                      >
                        {s.change}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="relative z-10 p-10 pt-0">
          <p className="text-xs" style={{ color: '#2a2a3e' }}>© 2026 BossFlow · Feito no Brasil 🇧🇷</p>
        </div>
      </div>

      {/* ── LADO DIREITO — formulário ──────────────────────────── */}
      <div
        className="flex flex-col w-full lg:w-[440px] lg:max-w-[440px] relative overflow-hidden"
        style={{ background: '#07070e' }}
      >
        {/* Glow sutil */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: -100, right: -100,
            width: 400, height: 400,
            background: 'radial-gradient(circle, rgba(124,110,247,0.06), transparent 70%)',
          }}
        />

        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <motion.div
            className="h-full"
            animate={{ width: isDone ? '100%' : `${(step / 4) * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{ background: 'linear-gradient(90deg, #7c6ef7, #22d3ee)' }}
          />
        </div>

        {/* Logo mobile */}
        <div className="lg:hidden px-6 pt-8 pb-2">
          <img src="/bossflow.png" alt="BossFlow" style={{ height: 26, objectFit: 'contain' }} />
        </div>

        {/* Formulário centralizado */}
        <div className="flex-1 flex flex-col justify-center px-6 sm:px-8 overflow-y-auto"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)', paddingTop: 24 }}>

          <AnimatePresence mode="wait" custom={dir}>

            {/* ── 0: WELCOME ─────────────────────────────────── */}
            {step === 0 && (
              <motion.div key="welcome"
                custom={dir} variants={slideVariants}
                initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6"
                  style={{ background: stepMeta.bg, border: `1px solid ${stepMeta.border}` }}>
                  <Zap size={22} style={{ color: stepMeta.color }} />
                </div>
                <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Syne, sans-serif', color: '#e8e8f0' }}>
                  Bem-vindo ao BossFlow! 🎉
                </h2>
                <p className="text-sm mb-8" style={{ color: '#3a3a5c', lineHeight: 1.6 }}>
                  Configuração rápida em menos de 2 minutos.
                </p>

                <div className="flex flex-col gap-3 mb-8">
                  {[
                    { icon: '📊', text: 'Dashboard financeiro em tempo real' },
                    { icon: '🎯', text: 'Metas mensais com conquistas' },
                    { icon: '🏢', text: 'Gerencie múltiplas empresas' },
                    { icon: '📱', text: 'Funciona no celular como app' },
                  ].map(({ icon, text }, i) => (
                    <motion.div
                      key={text}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.07 }}
                      className="flex items-center gap-3 p-3 rounded-xl text-sm"
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        color: '#6b6b8a',
                      }}
                    >
                      <span className="text-base w-6 text-center">{icon}</span>
                      {text}
                    </motion.div>
                  ))}
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                  onClick={goNext}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm"
                  style={{
                    background: 'linear-gradient(135deg, #7c6ef7, #9d6ef7)',
                    color: 'white',
                    boxShadow: '0 4px 32px rgba(124,110,247,0.4)',
                  }}
                >
                  Começar configuração <ArrowRight size={16} />
                </motion.button>
              </motion.div>
            )}

            {/* ── 1: EMPRESA ─────────────────────────────────── */}
            {step === 1 && (
              <motion.div key="empresa"
                custom={dir} variants={slideVariants}
                initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6"
                  style={{ background: stepMeta.bg, border: `1px solid ${stepMeta.border}` }}>
                  <Building2 size={22} style={{ color: stepMeta.color }} />
                </div>
                <h2 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Syne, sans-serif', color: '#e8e8f0' }}>
                  Sua empresa
                </h2>
                <p className="text-sm mb-6" style={{ color: '#3a3a5c' }}>
                  Você pode criar várias e trocar com 1 clique depois.
                </p>

                {/* Logo */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden shrink-0"
                    style={{ background: '#0d0d14', border: '2px dashed rgba(255,255,255,0.08)' }}>
                    {logoPreview
                      ? <img src={logoPreview} alt="logo" className="w-full h-full object-cover" />
                      : <Building2 size={18} style={{ color: '#2a2a3e' }} />}
                  </div>
                  <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all"
                    style={{
                      background: 'rgba(124,110,247,0.08)',
                      color: '#9d8fff',
                      border: '1px solid rgba(124,110,247,0.2)',
                    }}>
                    <Upload size={11} />
                    {logoPreview ? 'Trocar logo' : 'Logo (opcional)'}
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogo} />
                  </label>
                </div>

                {/* Nome */}
                <input
                  type="text"
                  placeholder="Ex: Minha Loja, Studio X..."
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && businessName.trim() && saveEmpresa()}
                  autoFocus
                  className="w-full px-4 py-3.5 rounded-xl text-sm outline-none mb-3"
                  style={{
                    background: '#0d0d14',
                    border: '1px solid rgba(255,255,255,0.07)',
                    color: '#e8e8f0',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = 'rgba(124,110,247,0.5)'}
                  onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'}
                />

                {/* Segmentos */}
                <div className="grid grid-cols-2 gap-2 mb-6">
                  {segments.map(s => (
                    <button key={s} type="button" onClick={() => setSegment(s)}
                      className="py-2.5 px-3 rounded-xl text-xs font-medium text-left transition-all"
                      style={{
                        background: segment === s ? 'rgba(124,110,247,0.1)' : 'rgba(255,255,255,0.02)',
                        color: segment === s ? '#9d8fff' : '#4a4a6a',
                        border: `1px solid ${segment === s ? 'rgba(124,110,247,0.3)' : 'rgba(255,255,255,0.05)'}`,
                      }}>
                      {s}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button onClick={goPrev}
                    className="w-11 h-12 flex items-center justify-center rounded-xl shrink-0"
                    style={{ background: '#0d0d14', border: '1px solid rgba(255,255,255,0.07)', color: '#4a4a6a' }}>
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

            {/* ── 2: META ────────────────────────────────────── */}
            {step === 2 && (
              <motion.div key="meta"
                custom={dir} variants={slideVariants}
                initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6"
                  style={{ background: stepMeta.bg, border: `1px solid ${stepMeta.border}` }}>
                  <Target size={22} style={{ color: stepMeta.color }} />
                </div>
                <h2 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Syne, sans-serif', color: '#e8e8f0' }}>
                  Meta do mês
                </h2>
                <p className="text-sm mb-6" style={{ color: '#3a3a5c' }}>
                  Quanto quer faturar este mês? A super cota é um bônus extra.
                </p>

                <div className="flex flex-col gap-3 mb-6">
                  {[
                    { label: 'META (R$)', icon: <Target size={12} />, color: '#f97316', value: target, setValue: setTarget, placeholder: 'Ex: 10.000' },
                    { label: 'SUPER COTA (R$)', icon: <span className="text-xs">⚡</span>, color: '#a78bfa', value: superTarget, setValue: setSuperTarget, placeholder: 'Ex: 15.000', optional: true },
                  ].map(field => (
                    <div key={field.label} className="p-4 rounded-2xl"
                      style={{ background: '#0d0d14', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="flex items-center gap-2 mb-2">
                        <span style={{ color: field.color }}>{field.icon}</span>
                        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: field.color }}>
                          {field.label}
                        </span>
                        {field.optional && (
                          <span className="text-xs ml-auto" style={{ color: '#2a2a3e' }}>opcional</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm" style={{ color: '#3a3a5c' }}>R$</span>
                        <input type="number" placeholder={field.placeholder} value={field.value}
                          onChange={e => field.setValue(e.target.value)}
                          className="flex-1 bg-transparent text-2xl font-bold outline-none"
                          style={{ color: '#e8e8f0', fontFamily: 'Syne, sans-serif' }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 mb-3">
                  <button onClick={goPrev}
                    className="w-11 h-12 flex items-center justify-center rounded-xl shrink-0"
                    style={{ background: '#0d0d14', border: '1px solid rgba(255,255,255,0.07)', color: '#4a4a6a' }}>
                    <ArrowLeft size={16} />
                  </button>
                  <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                    onClick={saveMeta} disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm"
                    style={{
                      background: 'linear-gradient(135deg,#f97316,#fb923c)',
                      color: 'white',
                      boxShadow: '0 4px 28px rgba(249,115,22,0.35)',
                    }}>
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <>Continuar <ArrowRight size={16} /></>}
                  </motion.button>
                </div>
                <button onClick={() => { setDir(1); setStep(3) }}
                  className="w-full text-center text-xs py-2" style={{ color: '#2a2a3e' }}>
                  Pular por agora
                </button>
              </motion.div>
            )}

            {/* ── 3: LANÇAMENTO ──────────────────────────────── */}
            {step === 3 && (
              <motion.div key="lancamento"
                custom={dir} variants={slideVariants}
                initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6"
                  style={{ background: stepMeta.bg, border: `1px solid ${stepMeta.border}` }}>
                  <DollarSign size={22} style={{ color: stepMeta.color }} />
                </div>
                <h2 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Syne, sans-serif', color: '#e8e8f0' }}>
                  Primeiro lançamento
                </h2>
                <p className="text-sm mb-6" style={{ color: '#3a3a5c' }}>
                  Registre uma entrada ou saída pra ver o painel em ação.
                </p>

                <div className="flex flex-col gap-3 mb-6">
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'income',  label: 'Entrada', icon: <TrendingUp size={14} />,  color: '#34d399' },
                      { id: 'expense', label: 'Saída',   icon: <TrendingDown size={14} />, color: '#f87171' },
                    ].map(t => (
                      <motion.button key={t.id} whileTap={{ scale: 0.96 }}
                        onClick={() => setTxType(t.id as 'income' | 'expense')}
                        className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all"
                        style={{
                          background: txType === t.id ? `${t.color}15` : 'rgba(255,255,255,0.02)',
                          border: `1px solid ${txType === t.id ? t.color + '45' : 'rgba(255,255,255,0.05)'}`,
                          color: txType === t.id ? t.color : '#4a4a6a',
                        }}>
                        {t.icon} {t.label}
                      </motion.button>
                    ))}
                  </div>

                  <div className="p-4 rounded-2xl" style={{ background: '#0d0d14', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm" style={{ color: '#3a3a5c' }}>R$</span>
                      <input type="number" placeholder="0,00" value={txAmount}
                        onChange={e => setTxAmount(e.target.value)}
                        className="flex-1 bg-transparent text-3xl font-bold outline-none"
                        style={{
                          color: txType === 'income' ? '#34d399' : '#f87171',
                          fontFamily: 'Syne, sans-serif',
                        }} />
                    </div>
                  </div>

                  <input type="text" placeholder="Descrição (opcional)" value={txDesc}
                    onChange={e => setTxDesc(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl text-sm outline-none"
                    style={{
                      background: '#0d0d14',
                      border: '1px solid rgba(255,255,255,0.07)',
                      color: '#e8e8f0',
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = 'rgba(52,211,153,0.4)'}
                    onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'} />
                </div>

                <div className="flex gap-2 mb-3">
                  <button onClick={goPrev}
                    className="w-11 h-12 flex items-center justify-center rounded-xl shrink-0"
                    style={{ background: '#0d0d14', border: '1px solid rgba(255,255,255,0.07)', color: '#4a4a6a' }}>
                    <ArrowLeft size={16} />
                  </button>
                  <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                    onClick={saveLancamento} disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm"
                    style={{
                      background: 'linear-gradient(135deg,#34d399,#22d3ee)',
                      color: '#050810',
                      boxShadow: '0 4px 28px rgba(52,211,153,0.35)',
                    }}>
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <>Finalizar <Check size={16} /></>}
                  </motion.button>
                </div>
                <button onClick={async () => {
                    const { data: { user } } = await supabase.auth.getUser()
                    if (user) await supabase.from('profiles').upsert({ id: user.id, onboarding_done: true })
                    goNext()
                  }}
                  className="w-full text-center text-xs py-2" style={{ color: '#2a2a3e' }}>
                  Pular por agora
                </button>
              </motion.div>
            )}

            {/* ── 4: DONE ────────────────────────────────────── */}
            {step === 4 && (
              <motion.div key="done"
                custom={dir} variants={slideVariants}
                initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 18 }}
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-3xl"
                  style={{ background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.25)' }}
                >
                  🎉
                </motion.div>
                <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Syne, sans-serif', color: '#e8e8f0' }}>
                  Tudo pronto, Boss!
                </h2>
                <p className="text-sm mb-8" style={{ color: '#3a3a5c' }}>
                  Sua empresa está configurada. Agora é só usar.
                </p>

                <div className="flex flex-col gap-2.5 mb-8">
                  {[
                    `Empresa "${businessName || 'sua empresa'}" criada`,
                    'Categorias padrão configuradas',
                    target ? `Meta de R$ ${parseFloat(target).toLocaleString('pt-BR')} definida` : 'Pronto para usar!',
                  ].map((text, i) => (
                    <motion.div key={text}
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-3 p-3 rounded-xl text-sm"
                      style={{
                        background: 'rgba(52,211,153,0.05)',
                        border: '1px solid rgba(52,211,153,0.15)',
                      }}>
                      <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)' }}>
                        <Check size={11} style={{ color: '#34d399' }} />
                      </div>
                      <span style={{ color: '#6b6b8a' }}>{text}</span>
                    </motion.div>
                  ))}
                </div>

                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                  onClick={finish}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm"
                  style={{
                    background: 'linear-gradient(135deg,#34d399,#22d3ee)',
                    color: '#050810',
                    boxShadow: '0 4px 32px rgba(52,211,153,0.4)',
                  }}>
                  Ir para o Dashboard <ArrowRight size={16} />
                </motion.button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Dots de progresso */}
        {step > 0 && step < 4 && (
          <div className="flex justify-center gap-1.5 pb-6"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 20px)' }}>
            {[1, 2, 3].map(s => (
              <motion.div key={s}
                animate={{
                  width: step === s ? 20 : 6,
                  background: step >= s ? '#7c6ef7' : 'rgba(255,255,255,0.08)',
                }}
                transition={{ duration: 0.3 }}
                style={{ height: 6, borderRadius: 999 }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
