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

const slide = (dir: number) => ({
  initial:    { opacity: 0, x: dir * 40 },
  animate:    { opacity: 1, x: 0 },
  exit:       { opacity: 0, x: -dir * 40 },
  transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as const },
})

export function OnboardingModal({ onComplete }: { onComplete: () => void }) {
  const supabase = createClient()
  const router   = useRouter()

  const [step,    setStep]    = useState(0)
  const [dir,     setDir]     = useState(1)
  const [saving,  setSaving]  = useState(false)

  // step 1 — empresa
  const [businessName, setBusinessName] = useState('')
  const [segment,      setSegment]      = useState('')
  const [logoFile,     setLogoFile]     = useState<File | null>(null)
  const [logoPreview,  setLogoPreview]  = useState('')
  const [bizId,        setBizId]        = useState<string | null>(null)

  // step 2 — meta
  const [target,      setTarget]      = useState('')
  const [superTarget, setSuperTarget] = useState('')

  // step 3 — lançamento
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

  // ── SAVE EMPRESA ─────────────────────────────────────────────────────────
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

        // categorias padrão
        await supabase.from('categories').insert([
          { business_id: biz.id, name: 'Vendas',              type: 'income',  color: '#34d399' },
          { business_id: biz.id, name: 'Serviços',            type: 'income',  color: '#22d3ee' },
          { business_id: biz.id, name: 'Aluguel',             type: 'expense', color: '#f87171' },
          { business_id: biz.id, name: 'Fornecedores',        type: 'expense', color: '#fbbf24' },
          { business_id: biz.id, name: 'Marketing',           type: 'expense', color: '#a78bfa' },
          { business_id: biz.id, name: 'Folha de pagamento',  type: 'expense', color: '#fb923c' },
        ])

        await supabase.from('profiles').upsert({ id: user.id, onboarding_step: 'meta' })
      }

      goNext()
    } finally { setSaving(false) }
  }

  // ── SAVE META ─────────────────────────────────────────────────────────────
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

  // ── SAVE LANÇAMENTO + FINALIZAR ───────────────────────────────────────────
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

  // ── BARRA DE PROGRESSO ────────────────────────────────────────────────────
  const TOTAL = 4 // steps 0-3, sendo 3 o done
  const pct   = step === 0 ? 0 : (step / TOTAL) * 100

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>

      {/* Glow de fundo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl opacity-15 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #7c6ef7, transparent)' }} />

      <div className="relative w-full sm:max-w-md">
        {/* Progress bar */}
        {step > 0 && step < 4 && (
          <div className="h-1 rounded-full mb-4 mx-1 overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <motion.div className="h-full rounded-full"
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              style={{ background: 'linear-gradient(90deg, #7c6ef7, #22d3ee)' }} />
          </div>
        )}

        <div className="w-full rounded-t-3xl sm:rounded-2xl border p-6 sm:p-8"
          style={{ background: '#111118', borderColor: '#1e1e2e' }}>
          {/* Handle bar mobile */}
          <div className="w-10 h-1 rounded-full mx-auto mb-5 sm:hidden" style={{ background: '#2a2a3e' }} />

          <AnimatePresence mode="wait" custom={dir}>

            {/* ── 0: WELCOME ─────────────────────────────────────────── */}
            {step === 0 && (
              <motion.div key="welcome" {...slide(dir)}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                  style={{ background: 'rgba(124,110,247,0.15)', border: '1px solid rgba(124,110,247,0.3)' }}>
                  <Zap size={28} style={{ color: '#9d8fff' }} />
                </div>
                <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>
                  Bem-vindo ao BossFlow! 🎉
                </h2>
                <p className="text-sm mb-8" style={{ color: '#4a4a6a' }}>
                  Vamos configurar sua conta em menos de 2 minutos.
                </p>
                <div className="flex flex-col gap-3 mb-8">
                  {[
                    { icon: '📊', text: 'Dashboard financeiro em tempo real' },
                    { icon: '🎯', text: 'Metas mensais com badges e conquistas' },
                    { icon: '🏢', text: 'Gerencie múltiplas empresas' },
                    { icon: '📱', text: 'Funciona no celular como app' },
                  ].map(({ icon, text }) => (
                    <div key={text} className="flex items-center gap-3 text-sm" style={{ color: '#6b6b8a' }}>
                      <span className="text-lg">{icon}</span>{text}
                    </div>
                  ))}
                </div>
                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                  onClick={goNext}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm"
                  style={{ background: 'linear-gradient(135deg, #7c6ef7, #9d6ef7)', color: 'white', boxShadow: '0 0 28px rgba(124,110,247,0.35)' }}>
                  Começar <ArrowRight size={16} />
                </motion.button>
              </motion.div>
            )}

            {/* ── 1: EMPRESA ─────────────────────────────────────────── */}
            {step === 1 && (
              <motion.div key="empresa" {...slide(dir)}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                  style={{ background: 'rgba(124,110,247,0.15)', border: '1px solid rgba(124,110,247,0.3)' }}>
                  <Building2 size={28} style={{ color: '#9d8fff' }} />
                </div>
                <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>
                  Sua empresa
                </h2>
                <p className="text-sm mb-6" style={{ color: '#4a4a6a' }}>
                  Você pode criar várias e trocar com 1 clique depois.
                </p>

                <div className="flex flex-col gap-4 mb-6">
                  {/* Logo */}
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center overflow-hidden shrink-0"
                      style={{ background: '#0d0d14', border: '2px dashed #1e1e2e' }}>
                      {logoPreview
                        ? <img src={logoPreview} alt="logo" className="w-full h-full object-cover" />
                        : <Building2 size={22} style={{ color: '#3a3a5c' }} />}
                    </div>
                    <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                      style={{ background: 'rgba(124,110,247,0.1)', color: '#9d8fff', border: '1px solid rgba(124,110,247,0.2)' }}>
                      <Upload size={12} /> {logoPreview ? 'Trocar logo' : 'Logo (opcional)'}
                      <input type="file" accept="image/*" className="hidden" onChange={handleLogo} />
                    </label>
                  </div>

                  {/* Nome */}
                  <input type="text" placeholder="Ex: Minha Loja, Studio X..."
                    value={businessName} onChange={e => setBusinessName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && businessName.trim() && saveEmpresa()}
                    autoFocus
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={{ background: '#0d0d14', border: '1px solid #1e1e2e', color: '#e8e8f0' }}
                    onFocus={e => e.currentTarget.style.borderColor = '#7c6ef7'}
                    onBlur={e => e.currentTarget.style.borderColor = '#1e1e2e'} />

                  {/* Segmento */}
                  <div className="grid grid-cols-2 gap-2">
                    {segments.map(s => (
                      <button key={s} type="button" onClick={() => setSegment(s)}
                        className="py-2 px-3 rounded-xl text-xs font-medium text-left transition-all"
                        style={{
                          background: segment === s ? 'rgba(124,110,247,0.12)' : '#0d0d14',
                          color: segment === s ? '#9d8fff' : '#4a4a6a',
                          border: `1px solid ${segment === s ? 'rgba(124,110,247,0.35)' : '#1a1a2e'}`,
                        }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={goPrev}
                    className="w-10 flex items-center justify-center rounded-xl"
                    style={{ background: '#0d0d14', border: '1px solid #1e1e2e', color: '#4a4a6a' }}>
                    <ArrowLeft size={16} />
                  </button>
                  <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                    onClick={saveEmpresa} disabled={!businessName.trim() || saving}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all"
                    style={{
                      background: businessName.trim() ? 'linear-gradient(135deg,#7c6ef7,#9d6ef7)' : '#1a1a2e',
                      color: businessName.trim() ? 'white' : '#3a3a5c',
                      boxShadow: businessName.trim() ? '0 0 24px rgba(124,110,247,0.3)' : 'none',
                    }}>
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <>Continuar <ArrowRight size={16} /></>}
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* ── 2: META ────────────────────────────────────────────── */}
            {step === 2 && (
              <motion.div key="meta" {...slide(dir)}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                  style={{ background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.3)' }}>
                  <Target size={28} style={{ color: '#f97316' }} />
                </div>
                <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>
                  Meta do mês
                </h2>
                <p className="text-sm mb-6" style={{ color: '#4a4a6a' }}>
                  Quanto quer faturar este mês? A super cota é um bônus extra.
                </p>

                <div className="flex flex-col gap-3 mb-6">
                  <div className="p-4 rounded-2xl" style={{ background: '#0d0d14', border: '1px solid #1e1e2e' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Target size={12} style={{ color: '#f97316' }} />
                      <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#f97316' }}>Meta (R$)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm" style={{ color: '#4a4a6a' }}>R$</span>
                      <input type="number" placeholder="Ex: 10.000" value={target}
                        onChange={e => setTarget(e.target.value)}
                        className="flex-1 bg-transparent text-2xl font-bold outline-none"
                        style={{ color: '#e8e8f0', fontFamily: 'Syne, sans-serif' }} />
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl" style={{ background: '#0d0d14', border: '1px solid #1e1e2e' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs">⚡</span>
                      <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#a78bfa' }}>Super Cota (R$)</span>
                      <span className="text-xs ml-auto" style={{ color: '#3a3a5c' }}>opcional</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm" style={{ color: '#4a4a6a' }}>R$</span>
                      <input type="number" placeholder="Ex: 15.000" value={superTarget}
                        onChange={e => setSuperTarget(e.target.value)}
                        className="flex-1 bg-transparent text-2xl font-bold outline-none"
                        style={{ color: '#e8e8f0', fontFamily: 'Syne, sans-serif' }} />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={goPrev}
                    className="w-10 flex items-center justify-center rounded-xl"
                    style={{ background: '#0d0d14', border: '1px solid #1e1e2e', color: '#4a4a6a' }}>
                    <ArrowLeft size={16} />
                  </button>
                  <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                    onClick={saveMeta} disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm"
                    style={{ background: 'linear-gradient(135deg,#f97316,#fb923c)', color: 'white', boxShadow: '0 0 24px rgba(249,115,22,0.3)' }}>
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <>Continuar <ArrowRight size={16} /></>}
                  </motion.button>
                </div>

                <button onClick={() => { setDir(1); setStep(3) }}
                  className="w-full text-center text-xs mt-3 py-2" style={{ color: '#3a3a5c' }}>
                  Pular por agora
                </button>
              </motion.div>
            )}

            {/* ── 3: LANÇAMENTO ──────────────────────────────────────── */}
            {step === 3 && (
              <motion.div key="lancamento" {...slide(dir)}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                  style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)' }}>
                  <DollarSign size={28} style={{ color: '#34d399' }} />
                </div>
                <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>
                  Primeiro lançamento
                </h2>
                <p className="text-sm mb-6" style={{ color: '#4a4a6a' }}>
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
                          background: txType === t.id ? `${t.color}18` : '#0d0d14',
                          border: `1px solid ${txType === t.id ? t.color + '50' : '#1a1a2e'}`,
                          color: txType === t.id ? t.color : '#4a4a6a',
                        }}>
                        {t.icon} {t.label}
                      </motion.button>
                    ))}
                  </div>

                  <div className="p-4 rounded-2xl" style={{ background: '#0d0d14', border: '1px solid #1e1e2e' }}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm" style={{ color: '#4a4a6a' }}>R$</span>
                      <input type="number" placeholder="0,00" value={txAmount}
                        onChange={e => setTxAmount(e.target.value)}
                        className="flex-1 bg-transparent text-3xl font-bold outline-none"
                        style={{ color: txType === 'income' ? '#34d399' : '#f87171', fontFamily: 'Syne, sans-serif' }} />
                    </div>
                  </div>

                  <input type="text" placeholder="Descrição (opcional)" value={txDesc}
                    onChange={e => setTxDesc(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={{ background: '#0d0d14', border: '1px solid #1e1e2e', color: '#e8e8f0' }}
                    onFocus={e => e.currentTarget.style.borderColor = '#34d399'}
                    onBlur={e => e.currentTarget.style.borderColor = '#1e1e2e'} />
                </div>

                <div className="flex gap-3">
                  <button onClick={goPrev}
                    className="w-10 flex items-center justify-center rounded-xl"
                    style={{ background: '#0d0d14', border: '1px solid #1e1e2e', color: '#4a4a6a' }}>
                    <ArrowLeft size={16} />
                  </button>
                  <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                    onClick={saveLancamento} disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm"
                    style={{ background: 'linear-gradient(135deg,#34d399,#22d3ee)', color: '#050810', boxShadow: '0 0 24px rgba(52,211,153,0.3)' }}>
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <>Finalizar <Check size={16} /></>}
                  </motion.button>
                </div>

                <button onClick={async () => {
                    const { data: { user } } = await supabase.auth.getUser()
                    if (user) await supabase.from('profiles').upsert({ id: user.id, onboarding_done: true })
                    goNext()
                  }}
                  className="w-full text-center text-xs mt-3 py-2" style={{ color: '#3a3a5c' }}>
                  Pular por agora
                </button>
              </motion.div>
            )}

            {/* ── 4: DONE ────────────────────────────────────────────── */}
            {step === 4 && (
              <motion.div key="done" {...slide(dir)}>
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-3xl"
                  style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)' }}>
                  🎉
                </motion.div>
                <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>
                  Tudo pronto, Boss!
                </h2>
                <p className="text-sm mb-6" style={{ color: '#4a4a6a' }}>
                  Sua empresa está configurada. Agora é só usar.
                </p>

                <div className="flex flex-col gap-2.5 mb-6">
                  {[
                    `Empresa "${businessName || 'sua empresa'}" criada`,
                    'Categorias padrão configuradas',
                    target ? `Meta de R$ ${parseFloat(target).toLocaleString('pt-BR')} definida` : 'Pronto para usar!',
                  ].map((text, i) => (
                    <motion.div key={text}
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-3 text-sm">
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
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm"
                  style={{ background: 'linear-gradient(135deg,#34d399,#22d3ee)', color: '#050810', boxShadow: '0 0 32px rgba(52,211,153,0.3)' }}>
                  Ir para o Dashboard <ArrowRight size={16} />
                </motion.button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Dots */}
        {step > 0 && step < 4 && (
          <div className="flex justify-center gap-2 mt-4">
            {[1, 2, 3].map(s => (
              <div key={s} className="rounded-full transition-all duration-300"
                style={{
                  width: step === s ? 20 : 6, height: 6,
                  background: step >= s ? '#7c6ef7' : 'rgba(255,255,255,0.1)',
                }} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
