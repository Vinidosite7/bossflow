'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import {
  User, Building2, Bell, Shield, LogOut,
  Save, ChevronRight, Key, Check, X, Moon,
  Smartphone, Eye, EyeOff,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  SpotlightCard, ShimmerButton, Skeleton,
  BackgroundGrid, FloatingOrbs, AcernityFonts, GlowCorner,
} from '@/components/ui/aceternity'

/* ─── tokens ─── */
const T = {
  bg: 'rgba(8,8,14,0.92)', bgDeep: 'rgba(6,6,10,0.97)',
  border: 'rgba(255,255,255,0.055)', borderP: 'rgba(124,110,247,0.22)',
  text: '#dcdcf0', sub: '#8a8aaa', muted: '#4a4a6a',
  green: '#34d399', amber: '#fbbf24', purple: '#7c6ef7',
  red: '#f87171', cyan: '#22d3ee', violet: '#a78bfa', blur: 'blur(20px)',
}
const card = { background: T.bg, border: `1px solid ${T.border}`, backdropFilter: T.blur, boxShadow: '0 4px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)' }
const inp: React.CSSProperties = { background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.border}`, color: T.text, borderRadius: 12, padding: '10px 14px', fontSize: 13, outline: 'none', width: '100%', transition: 'border-color 0.15s', fontFamily: 'DM Sans, sans-serif' }
const lbl: React.CSSProperties = { fontSize: 11, color: T.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, display: 'block', fontFamily: 'Syne, sans-serif' }
const focusIn  = (e: any) => e.currentTarget.style.borderColor = T.borderP
const focusOut = (e: any) => e.currentTarget.style.borderColor = T.border
const fadeUp   = (delay = 0) => ({ initial: { opacity: 0, y: 16, filter: 'blur(4px)' }, animate: { opacity: 1, y: 0, filter: 'blur(0px)' }, transition: { duration: 0.46, delay, ease: [0.16, 1, 0.3, 1] as const } })

const TABS = [
  { key: 'perfil',    label: 'Perfil',        icon: User     },
  { key: 'negocio',   label: 'Negócio',       icon: Building2 },
  { key: 'notif',     label: 'Notificações',  icon: Bell     },
  { key: 'seguranca', label: 'Segurança',     icon: Shield   },
]

/* ─── Toggle component ─── */
function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <motion.button whileTap={{ scale: 0.9 }} onClick={onChange}
      className="relative w-11 h-6 rounded-full shrink-0"
      style={{ background: on ? 'linear-gradient(135deg, #7c6ef7, #a06ef7)' : 'rgba(255,255,255,0.08)', boxShadow: on ? '0 0 14px rgba(124,110,247,0.45)' : 'none', border: `1px solid ${on ? 'rgba(124,110,247,0.3)' : T.border}`, cursor: 'pointer', transition: 'background 0.2s, box-shadow 0.2s' }}>
      <motion.div animate={{ x: on ? 20 : 2 }} transition={{ type: 'spring', stiffness: 420, damping: 30 }}
        className="absolute top-0.5 w-4 h-4 rounded-full"
        style={{ background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.4)' }} />
    </motion.button>
  )
}

export default function ConfiguracoesPage() {
  const supabase = createClient()
  const router   = useRouter()

  const [loading, setLoading] = useState(true)
  const [tab, setTab]         = useState('perfil')
  const [userAuth, setUserAuth] = useState<any>(null)
  const [biz, setBiz]         = useState<any>(null)
  const [saved, setSaved]     = useState(false)
  const [saving, setSaving]   = useState(false)
  const [showPass, setShowPass] = useState({ new: false, confirm: false })

  const [profileForm, setProfileForm] = useState({ full_name: '', email: '', phone: '' })
  const [bizForm, setBizForm]         = useState({ name: '', segment: '', cnpj: '', address: '', website: '' })
  const [passForm, setPassForm]       = useState({ new: '', confirm: '' })
  const [notifForm, setNotifForm]     = useState({ email_reports: true, task_reminders: true, payment_alerts: true, marketing: false })

  async function load() {
    const { data: { user: u } } = await supabase.auth.getUser()
    if (!u) { router.replace('/login'); return }
    setUserAuth(u)
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', u.id).single()
    setProfileForm({ full_name: profile?.full_name || '', email: u.email || '', phone: profile?.phone || '' })
    const { data: owned } = await supabase.from('businesses').select('*').eq('owner_id', u.id)
    const business = (owned || [])[0]
    if (business) {
      setBiz(business)
      setBizForm({ name: business.name || '', segment: business.segment || '', cnpj: business.cnpj || '', address: business.address || '', website: business.website || '' })
    }
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function saveProfile() {
    setSaving(true)
    await supabase.from('profiles').upsert({ id: userAuth.id, full_name: profileForm.full_name, phone: profileForm.phone })
    flash(); setSaving(false)
  }
  async function saveBiz() {
    if (!biz) return; setSaving(true)
    await supabase.from('businesses').update(bizForm).eq('id', biz.id)
    flash(); setSaving(false)
  }
  async function savePassword() {
    if (passForm.new !== passForm.confirm) return alert('As senhas não coincidem')
    if (passForm.new.length < 6) return alert('Mínimo 6 caracteres')
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password: passForm.new })
    if (error) alert(error.message)
    else { flash(); setPassForm({ new: '', confirm: '' }) }
    setSaving(false)
  }
  function flash() { setSaved(true); setTimeout(() => setSaved(false), 2200) }
  async function handleLogout() { await supabase.auth.signOut(); router.replace('/login') }

  if (loading) return (
    <><AcernityFonts /><BackgroundGrid><FloatingOrbs />
      <div className="flex flex-col gap-5">
        <Skeleton className="h-9 w-44 rounded-xl" />
        <div className="flex gap-4">
          <Skeleton className="h-64 w-48 rounded-2xl shrink-0 hidden sm:block" />
          <Skeleton className="h-64 flex-1 rounded-2xl" />
        </div>
      </div>
    </BackgroundGrid></>
  )

  return (
    <>
      <AcernityFonts />
      <BackgroundGrid>
        <FloatingOrbs />
        <div className="flex flex-col gap-5">

          {/* Header */}
          <motion.div {...fadeUp(0)} className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Syne, sans-serif', color: T.text }}>Configurações</h1>
              <p className="text-sm mt-0.5" style={{ color: T.muted, fontFamily: 'DM Sans, sans-serif' }}>Gerencie sua conta e preferências</p>
            </div>
            <AnimatePresence>
              {saved && (
                <motion.div initial={{ opacity: 0, scale: 0.9, x: 10 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold"
                  style={{ background: `${T.green}12`, color: T.green, border: `1px solid ${T.green}28`, fontFamily: 'DM Sans, sans-serif' }}>
                  <Check size={14} /> Salvo!
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <div className="flex gap-4 items-start">

            {/* Desktop sidebar */}
            <motion.div {...fadeUp(0.08)} className="w-52 shrink-0 hidden sm:block">
              <SpotlightCard className="rounded-2xl overflow-hidden" style={card}>
                <div className="p-2 flex flex-col gap-0.5">
                  {TABS.map(({ key, label, icon: Icon }) => {
                    const active = tab === key
                    return (
                      <motion.button key={key} whileHover={{ x: 2 }} whileTap={{ scale: 0.97 }}
                        onClick={() => setTab(key)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm w-full text-left"
                        style={{ background: active ? `${T.purple}14` : 'transparent', color: active ? T.violet : T.muted, border: `1px solid ${active ? `${T.purple}25` : 'transparent'}`, boxShadow: active ? `0 0 14px ${T.purple}12` : 'none', cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'DM Sans, sans-serif' }}>
                        <Icon size={14} />
                        <span className="font-medium">{label}</span>
                        {active && <ChevronRight size={12} className="ml-auto" />}
                      </motion.button>
                    )
                  })}
                  <div className="my-1.5 mx-2" style={{ borderTop: `1px solid ${T.border}` }} />
                  <motion.button whileHover={{ x: 2 }} whileTap={{ scale: 0.97 }} onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm w-full text-left"
                    style={{ color: T.red, cursor: 'pointer', transition: 'background 0.15s', background: 'transparent', fontFamily: 'DM Sans, sans-serif' }}
                    onMouseEnter={e => e.currentTarget.style.background = `${T.red}0a`}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <LogOut size={14} />
                    <span className="font-medium">Sair</span>
                  </motion.button>
                </div>
              </SpotlightCard>
            </motion.div>

            {/* Mobile tab bar */}
            <div className="sm:hidden flex gap-1 overflow-x-auto pb-1 w-full shrink-0">
              {TABS.map(({ key, label, icon: Icon }) => (
                <button key={key} onClick={() => setTab(key)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold shrink-0"
                  style={{ background: tab === key ? `${T.purple}14` : 'rgba(255,255,255,0.03)', color: tab === key ? T.violet : T.muted, border: `1px solid ${tab === key ? `${T.purple}25` : T.border}`, cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'DM Sans, sans-serif' }}>
                  <Icon size={12} />{label}
                </button>
              ))}
            </div>

            {/* Content panel */}
            <AnimatePresence mode="wait">
              <motion.div key={tab} initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.28 }} className="flex-1 min-w-0">
                <SpotlightCard className="rounded-2xl" style={card}>

                  {/* ── PERFIL ── */}
                  {tab === 'perfil' && (
                    <div className="p-6">
                      <h2 className="font-bold text-base mb-5" style={{ fontFamily: 'Syne, sans-serif', color: T.text }}>Dados pessoais</h2>

                      {/* Avatar */}
                      <div className="flex items-center gap-4 mb-6 pb-6" style={{ borderBottom: `1px solid ${T.border}` }}>
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold relative overflow-hidden"
                          style={{ background: `linear-gradient(135deg, ${T.purple}28, #a06ef7 28)`, border: `1px solid ${T.purple}35`, color: T.violet, boxShadow: `0 0 28px ${T.purple}22`, fontFamily: 'Syne, sans-serif' }}>
                          <GlowCorner color={`${T.violet}25`} position="bottom-right" />
                          {profileForm.full_name?.charAt(0)?.toUpperCase() || userAuth?.email?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: T.text, fontFamily: 'DM Sans, sans-serif' }}>{profileForm.full_name || 'Seu nome'}</p>
                          <p className="text-xs mt-0.5" style={{ color: T.muted, fontFamily: 'DM Sans, sans-serif' }}>{userAuth?.email}</p>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: T.green, boxShadow: `0 0 6px ${T.green}` }} />
                            <span className="text-xs" style={{ color: T.muted, fontFamily: 'DM Sans, sans-serif' }}>Conta ativa</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-4">
                        <div>
                          <label style={lbl}>Nome completo</label>
                          <input value={profileForm.full_name} onChange={e => setProfileForm({ ...profileForm, full_name: e.target.value })} placeholder="Seu nome completo" style={inp} onFocus={focusIn} onBlur={focusOut} />
                        </div>
                        <div>
                          <label style={lbl}>Email</label>
                          <input value={profileForm.email} disabled style={{ ...inp, opacity: 0.45, cursor: 'not-allowed' }} />
                          <p className="text-xs mt-1.5" style={{ color: T.muted, fontFamily: 'DM Sans, sans-serif' }}>O email não pode ser alterado por aqui</p>
                        </div>
                        <div>
                          <label style={lbl}>Telefone</label>
                          <input value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} placeholder="(00) 00000-0000" style={inp} onFocus={focusIn} onBlur={focusOut} />
                        </div>
                        <ShimmerButton onClick={saveProfile} disabled={saving}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold self-start"
                          style={{ background: 'linear-gradient(135deg, #7c6ef7, #a06ef7)', color: 'white', boxShadow: '0 0 24px rgba(124,110,247,0.38)', border: '1px solid rgba(255,255,255,0.1)', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                          {saving ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <Save size={14} />}
                          Salvar perfil
                        </ShimmerButton>
                      </div>
                    </div>
                  )}

                  {/* ── NEGÓCIO ── */}
                  {tab === 'negocio' && (
                    <div className="p-6">
                      <h2 className="font-bold text-base mb-5" style={{ fontFamily: 'Syne, sans-serif', color: T.text }}>Dados do negócio</h2>
                      {!biz ? (
                        <div className="py-10 text-center">
                          <Building2 size={32} className="mx-auto mb-3" style={{ color: T.muted }} />
                          <p className="text-sm" style={{ color: T.muted, fontFamily: 'DM Sans, sans-serif' }}>Nenhum negócio encontrado</p>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-4">
                          <div>
                            <label style={lbl}>Nome do negócio</label>
                            <input value={bizForm.name} onChange={e => setBizForm({ ...bizForm, name: e.target.value })} placeholder="Nome da empresa" style={inp} onFocus={focusIn} onBlur={focusOut} />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label style={lbl}>Segmento</label>
                              <input value={bizForm.segment} onChange={e => setBizForm({ ...bizForm, segment: e.target.value })} placeholder="Ex: Confeitaria" style={inp} onFocus={focusIn} onBlur={focusOut} />
                            </div>
                            <div>
                              <label style={lbl}>CNPJ</label>
                              <input value={bizForm.cnpj} onChange={e => setBizForm({ ...bizForm, cnpj: e.target.value })} placeholder="00.000.000/0001-00" style={inp} onFocus={focusIn} onBlur={focusOut} />
                            </div>
                          </div>
                          <div>
                            <label style={lbl}>Endereço</label>
                            <input value={bizForm.address} onChange={e => setBizForm({ ...bizForm, address: e.target.value })} placeholder="Rua, número, cidade" style={inp} onFocus={focusIn} onBlur={focusOut} />
                          </div>
                          <div>
                            <label style={lbl}>Website</label>
                            <input value={bizForm.website} onChange={e => setBizForm({ ...bizForm, website: e.target.value })} placeholder="https://..." style={inp} onFocus={focusIn} onBlur={focusOut} />
                          </div>
                          <ShimmerButton onClick={saveBiz} disabled={saving}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold self-start"
                            style={{ background: 'linear-gradient(135deg, #7c6ef7, #a06ef7)', color: 'white', boxShadow: '0 0 24px rgba(124,110,247,0.38)', border: '1px solid rgba(255,255,255,0.1)', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                            {saving ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <Save size={14} />}
                            Salvar negócio
                          </ShimmerButton>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── NOTIFICAÇÕES ── */}
                  {tab === 'notif' && (
                    <div className="p-6">
                      <h2 className="font-bold text-base mb-5" style={{ fontFamily: 'Syne, sans-serif', color: T.text }}>Notificações</h2>
                      <div className="flex flex-col gap-3">
                        {[
                          { key: 'email_reports',  label: 'Relatórios semanais',     desc: 'Resumo semanal do seu negócio por email',         color: T.violet },
                          { key: 'task_reminders', label: 'Lembretes de tarefas',    desc: 'Alertas de tarefas com prazo próximo',             color: T.amber  },
                          { key: 'payment_alerts', label: 'Alertas de pagamentos',   desc: 'Notificações de transações pendentes',             color: T.green  },
                          { key: 'marketing',      label: 'Novidades do BossFlow',   desc: 'Atualizações e dicas de funcionalidades novas',    color: T.cyan   },
                        ].map(({ key, label, desc, color }) => (
                          <motion.div key={key} whileHover={{ x: 2 }}
                            className="flex items-center justify-between p-4 rounded-xl"
                            style={{ background: 'rgba(255,255,255,0.025)', border: `1px solid ${T.border}` }}>
                            <div className="flex items-start gap-3">
                              <div className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
                              <div>
                                <p className="text-sm font-medium" style={{ color: T.text, fontFamily: 'DM Sans, sans-serif' }}>{label}</p>
                                <p className="text-xs mt-0.5" style={{ color: T.muted, fontFamily: 'DM Sans, sans-serif' }}>{desc}</p>
                              </div>
                            </div>
                            <Toggle on={notifForm[key as keyof typeof notifForm]} onChange={() => setNotifForm({ ...notifForm, [key]: !notifForm[key as keyof typeof notifForm] })} />
                          </motion.div>
                        ))}
                        <ShimmerButton onClick={flash}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold self-start mt-1"
                          style={{ background: 'linear-gradient(135deg, #7c6ef7, #a06ef7)', color: 'white', boxShadow: '0 0 24px rgba(124,110,247,0.38)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>
                          <Save size={14} /> Salvar preferências
                        </ShimmerButton>
                      </div>
                    </div>
                  )}

                  {/* ── SEGURANÇA ── */}
                  {tab === 'seguranca' && (
                    <div className="p-6 flex flex-col gap-5">
                      <h2 className="font-bold text-base" style={{ fontFamily: 'Syne, sans-serif', color: T.text }}>Segurança</h2>

                      {/* Alterar senha */}
                      <SpotlightCard className="rounded-xl" spotlightColor={`${T.purple}12`}
                        style={{ background: 'rgba(255,255,255,0.025)', border: `1px solid ${T.border}`, backdropFilter: 'blur(8px)' }}>
                        <div className="p-5">
                          <div className="flex items-center gap-2 mb-4">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                              style={{ background: `${T.purple}14`, border: `1px solid ${T.purple}25` }}>
                              <Key size={13} style={{ color: T.violet }} />
                            </div>
                            <p className="text-sm font-semibold" style={{ color: T.text, fontFamily: 'DM Sans, sans-serif' }}>Alterar senha</p>
                          </div>
                          <div className="flex flex-col gap-3">
                            {(['new', 'confirm'] as const).map((f) => (
                              <div key={f}>
                                <label style={lbl}>{f === 'new' ? 'Nova senha' : 'Confirmar senha'}</label>
                                <div className="flex items-center gap-2 rounded-xl"
                                  style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.border}`, transition: 'border-color 0.15s', padding: '0 12px' }}
                                  onFocus={() => {}} >
                                  <input type={showPass[f] ? 'text' : 'password'} value={passForm[f]}
                                    onChange={e => setPassForm({ ...passForm, [f]: e.target.value })}
                                    placeholder={f === 'new' ? 'Mínimo 6 caracteres' : 'Repita a senha'}
                                    className="flex-1 bg-transparent py-2.5 text-sm outline-none"
                                    style={{ color: T.text, fontFamily: 'DM Sans, sans-serif' }}
                                    onFocus={e => (e.currentTarget.parentElement!.style.borderColor = T.borderP)}
                                    onBlur={e => (e.currentTarget.parentElement!.style.borderColor = T.border)} />
                                  <motion.button whileTap={{ scale: 0.9 }} type="button"
                                    onClick={() => setShowPass(p => ({ ...p, [f]: !p[f] }))}
                                    style={{ color: T.muted, cursor: 'pointer', background: 'none', border: 'none' }}>
                                    {showPass[f] ? <EyeOff size={14} /> : <Eye size={14} />}
                                  </motion.button>
                                </div>
                              </div>
                            ))}
                            <ShimmerButton onClick={savePassword} disabled={saving || !passForm.new}
                              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold self-start"
                              style={{ background: 'linear-gradient(135deg, #7c6ef7, #a06ef7)', color: 'white', boxShadow: '0 0 24px rgba(124,110,247,0.38)', border: '1px solid rgba(255,255,255,0.1)', cursor: (saving || !passForm.new) ? 'not-allowed' : 'pointer', opacity: (saving || !passForm.new) ? 0.5 : 1 }}>
                              {saving ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <Key size={14} />}
                              Atualizar senha
                            </ShimmerButton>
                          </div>
                        </div>
                      </SpotlightCard>

                      {/* Session info */}
                      <div className="flex items-center gap-3 p-4 rounded-xl"
                        style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${T.border}` }}>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: `${T.cyan}12`, border: `1px solid ${T.cyan}22` }}>
                          <Smartphone size={14} style={{ color: T.cyan }} />
                        </div>
                        <div>
                          <p className="text-sm font-medium" style={{ color: T.text, fontFamily: 'DM Sans, sans-serif' }}>Sessão atual</p>
                          <p className="text-xs mt-0.5" style={{ color: T.muted, fontFamily: 'DM Sans, sans-serif' }}>
                            {userAuth?.email} · Última atividade agora
                          </p>
                        </div>
                        <div className="ml-auto flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: T.green }} />
                          <span className="text-xs" style={{ color: T.green, fontFamily: 'DM Sans, sans-serif' }}>Ativo</span>
                        </div>
                      </div>

                      {/* Danger zone */}
                      <div className="p-4 rounded-xl" style={{ background: `${T.red}06`, border: `1px solid ${T.red}18` }}>
                        <p className="text-sm font-semibold mb-1" style={{ color: T.red, fontFamily: 'Syne, sans-serif' }}>Zona de perigo</p>
                        <p className="text-xs mb-4" style={{ color: T.muted, fontFamily: 'DM Sans, sans-serif' }}>Ações irreversíveis. Proceda com cuidado.</p>
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleLogout}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                          style={{ background: `${T.red}12`, color: T.red, border: `1px solid ${T.red}25`, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                          <LogOut size={14} /> Sair da conta
                        </motion.button>
                      </div>
                    </div>
                  )}

                </SpotlightCard>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </BackgroundGrid>
    </>
  )
}
