'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap, Building2, Target, DollarSign, Check,
  ArrowRight, ArrowLeft, Loader2, Upload, TrendingUp, TrendingDown,
  BarChart2, Smartphone, Sparkles,
} from 'lucide-react'

const segments = [
  'Agência', 'E-commerce', 'Restaurante', 'Loja física',
  'Prestador de serviços', 'Clínica', 'Autônomo', 'Outro',
]

const STEPS = [
  { color: '#7c6ef7', glow: 'rgba(124,110,247,0.15)', bg: 'rgba(124,110,247,0.08)', border: 'rgba(124,110,247,0.2)' },
  { color: '#7c6ef7', glow: 'rgba(124,110,247,0.15)', bg: 'rgba(124,110,247,0.08)', border: 'rgba(124,110,247,0.2)' },
  { color: '#f97316', glow: 'rgba(249,115,22,0.15)',  bg: 'rgba(249,115,22,0.08)',  border: 'rgba(249,115,22,0.2)'  },
  { color: '#34d399', glow: 'rgba(52,211,153,0.15)',  bg: 'rgba(52,211,153,0.08)',  border: 'rgba(52,211,153,0.2)'  },
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
      { label: 'Transações', value: '47',       sub: 'Este mês',      up: true  },
    ],
  },
]

const FEATURES = [
  { Icon: BarChart2,  color: '#7c6ef7', text: 'Dashboard financeiro em tempo real' },
  { Icon: Target,     color: '#f97316', text: 'Metas mensais com conquistas'        },
  { Icon: Building2,  color: '#22d3ee', text: 'Gerencie múltiplas empresas'         },
  { Icon: Smartphone, color: '#34d399', text: 'Funciona no celular como app'        },
]

const supabase = createClient()

export function OnboardingModal({ onComplete }: { onComplete: () => void }) {

  const [step,        setStep]        = useState(0)
  const [dir,         setDir]         = useState(1)
  const [saving,      setSaving]      = useState(false)
  const [businessName,setBusinessName]= useState('')
  const [segment,     setSegment]     = useState('')
  const [logoFile,    setLogoFile]    = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState('')
  const [bizId,       setBizId]       = useState<string | null>(null)
  const [target,      setTarget]      = useState('')
  const [superTarget, setSuperTarget] = useState('')
  const [txType,      setTxType]      = useState<'income' | 'expense'>('income')
  const [txAmount,    setTxAmount]    = useState('')
  const [txDesc,      setTxDesc]      = useState('')

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

    const { data: biz, error: bizError } = await supabase
      .from('businesses')
      .insert({ name: businessName, logo_url, owner_id: user.id })
      .select().maybeSingle()

    if (bizError || !biz) {
      console.error('[Onboarding] saveEmpresa:', bizError)
      return // ← não avança se falhou
    }

    localStorage.setItem('activeBizId', biz.id)
    setBizId(biz.id)

    await supabase.from('categories').insert([
      { business_id: biz.id, name: 'Vendas',             type: 'income',  color: '#34d399' },
      { business_id: biz.id, name: 'Servicos',           type: 'income',  color: '#22d3ee' },
      { business_id: biz.id, name: 'Aluguel',            type: 'expense', color: '#f87171' },
      { business_id: biz.id, name: 'Fornecedores',       type: 'expense', color: '#fbbf24' },
      { business_id: biz.id, name: 'Marketing',          type: 'expense', color: '#a78bfa' },
      { business_id: biz.id, name: 'Folha de pagamento', type: 'expense', color: '#fb923c' },
    ])
    await supabase.from('profiles').upsert({ id: user.id, onboarding_step: 'meta' })
    goNext()
  } finally {
    setSaving(false)
  }
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
        const { error: txError } = await supabase.from('transactions').insert({
          business_id: activeBizId,
          type:        txType,
          title,
          amount:      parseFloat(txAmount),
          description: txDesc || null,
          date:        new Date().toISOString().split('T')[0],
          paid:        true,
          created_by:  user.id,
        })
        if (txError) console.error('TX ERROR:', txError)
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

  const fV = {
    enter:  (d: number) => ({ opacity: 0, y: d > 0 ? 18 : -18 }),
    center: { opacity: 1, y: 0 },
    exit:   (d: number) => ({ opacity: 0, y: d > 0 ? -18 : 18 }),
  }
  const lV = {
    enter:  (d: number) => ({ opacity: 0, x: d > 0 ? 20 : -20 }),
    center: { opacity: 1, x: 0 },
    exit:   (d: number) => ({ opacity: 0, x: d > 0 ? -20 : 20 }),
  }

  return (
    <div className="fixed inset-0 z-50 flex overflow-hidden" style={{ background: '#06060c' }}>

      {/* ESQUERDA */}
      <div
        className="hidden lg:flex flex-col flex-1"
        style={{ borderRight: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}
      >
        <motion.div key={`glow-${pIdx}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}
          style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: `radial-gradient(ellipse 65% 55% at 30% 40%, ${sm.glow}, transparent), radial-gradient(ellipse 40% 40% at 80% 80%, rgba(34,211,238,0.05), transparent)`,
          }} />
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '32px 32px', opacity: 0.4,
        }} />

        <div style={{ position: 'relative', zIndex: 10, padding: '48px 56px 0' }}>
          <img src="/bossflow.png" alt="BossFlow" style={{ height: 28, objectFit: 'contain' }} />
        </div>

        {/* CENTRALIZADO */}
        <div style={{
          position: 'relative', zIndex: 10,
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '40px 56px',
        }}>
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div key={`left-${pIdx}`} custom={dir} variants={lV}
              initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              style={{ width: '100%', maxWidth: 480 }}>

              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '6px 14px', borderRadius: 999, marginBottom: 24,
                background: sm.bg, color: sm.color, border: `1px solid ${sm.border}`,
                fontSize: 12, fontWeight: 700,
              }}>
                <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 2 }}
                  style={{ width: 6, height: 6, borderRadius: '50%', background: sm.color, display: 'block', flexShrink: 0 }} />
                {preview.badge}
              </div>

              <h2 style={{
                fontFamily: 'Syne, sans-serif',
                fontSize: 'clamp(32px, 3.2vw, 52px)',
                fontWeight: 800, lineHeight: 1.12, marginBottom: 16,
                background: `linear-gradient(140deg, #ffffff 40%, ${sm.color})`,
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                whiteSpace: 'pre-line',
              }}>
                {preview.title}
              </h2>

              <p style={{ color: '#4a4a6a', fontSize: 15, lineHeight: 1.7, marginBottom: 40, maxWidth: 380 }}>
                {preview.desc}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {preview.cards.map((card, i) => (
                  <motion.div key={`${pIdx}-${i}`}
                    initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.08, duration: 0.4 }}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      borderRadius: 20, padding: '20px 20px 16px',
                    }}>
                    <p style={{ color: '#3a3a5c', fontSize: 11, marginBottom: 10 }}>{card.label}</p>
                    <p style={{
                      color: '#e8e8f0', fontFamily: 'Syne, sans-serif', fontWeight: 700,
                      fontSize: card.value.length > 8 ? 16 : 24, marginBottom: 12, lineHeight: 1,
                    }}>
                      {card.value}
                    </p>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '4px 9px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                      background: card.up ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)',
                      color: card.up ? '#34d399' : '#f87171',
                    }}>
                      {card.up ? '↑' : '↓'} {card.sub}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div style={{ position: 'relative', zIndex: 10, padding: '0 56px 36px' }}>
          <p style={{ color: '#1e1e2e', fontSize: 12 }}>© 2026 BossFlow · Feito no Brasil</p>
        </div>
      </div>

      {/* DIREITA */}
      <div className="flex flex-col w-full lg:w-[440px] lg:max-w-[440px]"
        style={{ background: '#07070e', position: 'relative' }}>

        <div style={{
          position: 'absolute', top: -60, right: -60, width: 320, height: 320, pointerEvents: 'none',
          background: `radial-gradient(circle, ${sm.glow}, transparent 70%)`, transition: 'background 0.6s',
        }} />

        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'rgba(255,255,255,0.04)' }}>
          <motion.div animate={{ width: `${Math.min((step / 4) * 100, 100)}%` }} transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{ height: '100%', background: `linear-gradient(90deg, ${sm.color}, #22d3ee)`, borderRadius: 1 }} />
        </div>

        <div className="lg:hidden" style={{ padding: '32px 32px 0', display: 'flex', alignItems: 'center' }}>
          <img src="/bossflow.png" alt="BossFlow" style={{ height: 24, objectFit: 'contain' }} />
          {step > 0 && step < 4 && (
            <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
              {[1, 2, 3].map(s => (
                <motion.div key={s}
                  animate={{ width: step === s ? 18 : 5, background: step >= s ? sm.color : 'rgba(255,255,255,0.1)' }}
                  transition={{ duration: 0.3 }} style={{ height: 5, borderRadius: 999 }} />
              ))}
            </div>
          )}
        </div>

        <div className="relative z-10 flex-1 overflow-y-auto"
          style={{
            padding: '40px', paddingBottom: 'calc(env(safe-area-inset-bottom) + 40px)',
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
          }}>
          <AnimatePresence mode="wait" custom={dir}>

            {step === 0 && (
              <motion.div key="w" custom={dir} variants={fV} initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}>
                <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 18 }}
                  style={{
                    width: 56, height: 56, borderRadius: 18,
                    background: sm.bg, border: `1px solid ${sm.border}`,
                    boxShadow: `0 0 32px ${sm.glow}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28,
                  }}>
                  <Zap size={24} style={{ color: sm.color }} />
                </motion.div>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 800, color: '#e8e8f0', marginBottom: 8 }}>
                  Bem-vindo ao BossFlow!
                </h2>
                <p style={{ color: '#3a3a5c', fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>
                  Configuração rápida em menos de 2 minutos.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
                  {FEATURES.map(({ Icon, color, text }, i) => (
                    <motion.div key={text} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.07 }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '12px 14px', borderRadius: 14,
                        background: 'rgba(255,255,255,0.025)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        color: '#6b6b8a', fontSize: 14,
                      }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                        background: `${color}12`, border: `1px solid ${color}25`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Icon size={16} style={{ color }} />
                      </div>
                      {text}
                    </motion.div>
                  ))}
                </div>
                <motion.button whileHover={{ scale: 1.01, boxShadow: '0 8px 40px rgba(124,110,247,0.5)' }}
                  whileTap={{ scale: 0.98 }} onClick={goNext}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '16px 24px', borderRadius: 16, border: 'none', cursor: 'pointer',
                    background: 'linear-gradient(135deg, #7c6ef7, #9d6ef7)',
                    color: 'white', fontWeight: 700, fontSize: 14,
                    boxShadow: '0 4px 32px rgba(124,110,247,0.35)',
                  }}>
                  Começar configuração <ArrowRight size={16} />
                </motion.button>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="e" custom={dir} variants={fV} initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 16, background: sm.bg, border: `1px solid ${sm.border}`,
                  boxShadow: `0 0 24px ${sm.glow}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24,
                }}>
                  <Building2 size={22} style={{ color: sm.color }} />
                </div>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 800, color: '#e8e8f0', marginBottom: 8 }}>
                  Sua empresa
                </h2>
                <p style={{ color: '#3a3a5c', fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>
                  Você pode criar várias e trocar com 1 clique depois.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                    background: '#0d0d14', border: '2px dashed rgba(255,255,255,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                  }}>
                    {logoPreview ? <img src={logoPreview} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <Building2 size={18} style={{ color: '#2a2a3e' }} />}
                  </div>
                  <label style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, cursor: 'pointer',
                    background: sm.bg, color: sm.color, border: `1px solid ${sm.border}`, fontSize: 12, fontWeight: 600,
                  }}>
                    <Upload size={11} />
                    {logoPreview ? 'Trocar logo' : 'Logo (opcional)'}
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogo} />
                  </label>
                </div>
                <input type="text" placeholder="Nome da empresa..." value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && businessName.trim() && saveEmpresa()}
                  autoFocus
                  style={{
                    width: '100%', padding: '14px 16px', borderRadius: 14,
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                    color: '#e8e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 14,
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = sm.color + '70'; e.currentTarget.style.boxShadow = `0 0 0 3px ${sm.glow}` }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none' }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 28 }}>
                  {segments.map(s => (
                    <button key={s} type="button" onClick={() => setSegment(s === segment ? '' : s)}
                      style={{
                        padding: '10px 12px', borderRadius: 12, cursor: 'pointer',
                        textAlign: 'left', fontSize: 13, fontWeight: 500,
                        background: segment === s ? sm.bg : 'rgba(255,255,255,0.025)',
                        color: segment === s ? sm.color : '#4a4a6a',
                        border: `1px solid ${segment === s ? sm.border : 'rgba(255,255,255,0.05)'}`,
                        transition: 'all 0.15s',
                      }}>
                      {s}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={goPrev} style={{
                    width: 48, height: 52, flexShrink: 0, borderRadius: 14, cursor: 'pointer',
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                    color: '#4a4a6a', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <ArrowLeft size={16} />
                  </button>
                  <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                    onClick={saveEmpresa} disabled={!businessName.trim() || saving}
                    style={{
                      flex: 1, height: 52, borderRadius: 14, border: 'none',
                      cursor: businessName.trim() ? 'pointer' : 'not-allowed',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      background: businessName.trim() ? 'linear-gradient(135deg,#7c6ef7,#9d6ef7)' : 'rgba(255,255,255,0.04)',
                      color: businessName.trim() ? 'white' : '#3a3a5c',
                      fontWeight: 700, fontSize: 14,
                      boxShadow: businessName.trim() ? '0 4px 28px rgba(124,110,247,0.3)' : 'none',
                      transition: 'all 0.2s',
                    }}>
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <>Continuar <ArrowRight size={16} /></>}
                  </motion.button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="m" custom={dir} variants={fV} initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 16, background: sm.bg, border: `1px solid ${sm.border}`,
                  boxShadow: `0 0 24px ${sm.glow}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24,
                }}>
                  <Target size={22} style={{ color: sm.color }} />
                </div>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 800, color: '#e8e8f0', marginBottom: 8 }}>
                  Meta do mês
                </h2>
                <p style={{ color: '#3a3a5c', fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>
                  Quanto quer faturar? A super cota é um bônus extra.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
                  {[
                    { label: 'META (R$)', sub: '', color: '#f97316', value: target, set: setTarget, ph: 'Ex: 10.000' },
                    { label: 'SUPER COTA (R$)', sub: 'opcional', color: '#a78bfa', value: superTarget, set: setSuperTarget, ph: 'Ex: 15.000' },
                  ].map(f => (
                    <div key={f.label} style={{
                      padding: '20px 20px 16px', borderRadius: 18,
                      background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
                        <span style={{ color: f.color, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em' }}>{f.label}</span>
                        {f.sub && <span style={{ color: '#2a2a3e', fontSize: 11, marginLeft: 'auto' }}>{f.sub}</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                        <span style={{ color: '#3a3a5c', fontSize: 14 }}>R$</span>
                        <input type="number" placeholder={f.ph} value={f.value} onChange={e => f.set(e.target.value)}
                          style={{
                            flex: 1, background: 'transparent', border: 'none', outline: 'none',
                            color: '#e8e8f0', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 26,
                          }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                  <button onClick={goPrev} style={{
                    width: 48, height: 52, flexShrink: 0, borderRadius: 14, cursor: 'pointer',
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                    color: '#4a4a6a', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <ArrowLeft size={16} />
                  </button>
                  <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                    onClick={saveMeta} disabled={saving}
                    style={{
                      flex: 1, height: 52, borderRadius: 14, cursor: 'pointer', border: 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      background: 'linear-gradient(135deg,#f97316,#fb923c)',
                      color: 'white', fontWeight: 700, fontSize: 14,
                      boxShadow: '0 4px 28px rgba(249,115,22,0.28)',
                    }}>
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <>Continuar <ArrowRight size={16} /></>}
                  </motion.button>
                </div>
                <button onClick={() => { setDir(1); setStep(3) }}
                  style={{
                    width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                    color: '#2a2a3e', fontSize: 13, padding: '10px 0', transition: 'color 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#4a4a6a'}
                  onMouseLeave={e => e.currentTarget.style.color = '#2a2a3e'}>
                  Pular por agora
                </button>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="l" custom={dir} variants={fV} initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 16, background: sm.bg, border: `1px solid ${sm.border}`,
                  boxShadow: `0 0 24px ${sm.glow}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24,
                }}>
                  <DollarSign size={22} style={{ color: sm.color }} />
                </div>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 800, color: '#e8e8f0', marginBottom: 8 }}>
                  Primeiro lançamento
                </h2>
                <p style={{ color: '#3a3a5c', fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>
                  Registre uma entrada ou saída pra ver o painel em ação.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                  {[
                    { id: 'income',  label: 'Entrada', Icon: TrendingUp,  color: '#34d399' },
                    { id: 'expense', label: 'Saída',   Icon: TrendingDown, color: '#f87171' },
                  ].map(t => (
                    <motion.button key={t.id} whileTap={{ scale: 0.96 }}
                      onClick={() => setTxType(t.id as 'income' | 'expense')}
                      style={{
                        padding: '14px 12px', borderRadius: 14, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        fontSize: 14, fontWeight: 700,
                        background: txType === t.id ? `${t.color}12` : 'rgba(255,255,255,0.025)',
                        border: `1px solid ${txType === t.id ? t.color + '45' : 'rgba(255,255,255,0.06)'}`,
                        color: txType === t.id ? t.color : '#4a4a6a',
                        boxShadow: txType === t.id ? `0 0 24px ${t.color}18` : 'none',
                        transition: 'all 0.2s',
                      }}>
                      <t.Icon size={15} /> {t.label}
                    </motion.button>
                  ))}
                </div>
                <div style={{
                  padding: '20px', borderRadius: 18, marginBottom: 12,
                  background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ color: '#3a3a5c', fontSize: 14 }}>R$</span>
                    <input type="number" placeholder="0,00" value={txAmount} onChange={e => setTxAmount(e.target.value)}
                      style={{
                        flex: 1, background: 'transparent', border: 'none', outline: 'none',
                        color: txType === 'income' ? '#34d399' : '#f87171',
                        fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 32, transition: 'color 0.3s',
                      }} />
                  </div>
                </div>
                <input type="text" placeholder="Descricao (opcional)" value={txDesc} onChange={e => setTxDesc(e.target.value)}
                  style={{
                    width: '100%', padding: '14px 16px', borderRadius: 14, marginBottom: 24,
                    background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)',
                    color: '#e8e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = 'rgba(52,211,153,0.4)'}
                  onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'} />
                <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                  <button onClick={goPrev} style={{
                    width: 48, height: 52, flexShrink: 0, borderRadius: 14, cursor: 'pointer',
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                    color: '#4a4a6a', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <ArrowLeft size={16} />
                  </button>
                  <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                    onClick={saveLancamento} disabled={saving}
                    style={{
                      flex: 1, height: 52, borderRadius: 14, cursor: 'pointer', border: 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      background: 'linear-gradient(135deg,#34d399,#22d3ee)',
                      color: '#050810', fontWeight: 700, fontSize: 14,
                      boxShadow: '0 4px 28px rgba(52,211,153,0.28)',
                    }}>
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <>Finalizar <Check size={16} /></>}
                  </motion.button>
                </div>
                <button onClick={async () => {
                    const { data: { user } } = await supabase.auth.getUser()
                    if (user) await supabase.from('profiles').upsert({ id: user.id, onboarding_done: true })
                    goNext()
                  }}
                  style={{
                    width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                    color: '#2a2a3e', fontSize: 13, padding: '10px 0', transition: 'color 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#4a4a6a'}
                  onMouseLeave={e => e.currentTarget.style.color = '#2a2a3e'}>
                  Pular por agora
                </button>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="d" custom={dir} variants={fV} initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}>
                <motion.div initial={{ scale: 0, rotate: -15 }} animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                  style={{
                    width: 64, height: 64, borderRadius: 20,
                    background: 'linear-gradient(135deg, rgba(52,211,153,0.15), rgba(34,211,238,0.12))',
                    border: '1px solid rgba(52,211,153,0.3)',
                    boxShadow: '0 0 40px rgba(52,211,153,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28,
                  }}>
                  <Sparkles size={28} style={{ color: '#34d399' }} />
                </motion.div>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 800, color: '#e8e8f0', marginBottom: 10 }}>
                  Tudo pronto, Boss!
                </h2>
                <p style={{ color: '#3a3a5c', fontSize: 14, lineHeight: 1.7, marginBottom: 32 }}>
                  Sua empresa está configurada. Agora é só usar.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
                  {[
                    `Empresa "${businessName || 'sua empresa'}" criada`,
                    'Categorias padrão configuradas',
                    target ? `Meta de R$ ${parseFloat(target).toLocaleString('pt-BR')} definida` : 'Pronto para usar!',
                  ].map((text, i) => (
                    <motion.div key={text} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.12, type: 'spring', stiffness: 300, damping: 24 }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '14px 16px', borderRadius: 14,
                        background: 'rgba(52,211,153,0.04)', border: '1px solid rgba(52,211,153,0.12)',
                      }}>
                      <div style={{
                        width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                        background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Check size={12} style={{ color: '#34d399' }} />
                      </div>
                      <span style={{ color: '#6b6b8a', fontSize: 14 }}>{text}</span>
                    </motion.div>
                  ))}
                </div>
                <motion.button whileHover={{ scale: 1.01, boxShadow: '0 8px 40px rgba(52,211,153,0.5)' }}
                  whileTap={{ scale: 0.98 }} onClick={finish}
                  style={{
                    width: '100%', height: 54, borderRadius: 16, border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    background: 'linear-gradient(135deg,#34d399,#22d3ee)',
                    color: '#050810', fontWeight: 700, fontSize: 14,
                    boxShadow: '0 4px 32px rgba(52,211,153,0.35)',
                  }}>
                  Ir para o Dashboard <ArrowRight size={16} />
                </motion.button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {step > 0 && step < 4 && (
          <div className="hidden lg:flex" style={{ justifyContent: 'center', gap: 8, paddingBottom: 28 }}>
            {[1, 2, 3].map(s => (
              <motion.div key={s}
                animate={{ width: step === s ? 22 : 6, background: step >= s ? sm.color : 'rgba(255,255,255,0.08)' }}
                transition={{ duration: 0.3 }} style={{ height: 6, borderRadius: 999 }} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
