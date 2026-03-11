'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useTour } from '@/hooks/useTour'
import { usePushNotification } from '@/hooks/usePushNotification'
import { TourTooltip } from "@/components/TourTooltip"
import { Settings, User, Bell, Shield, Loader2, Camera, Upload, Check, X, BellOff, BellRing, Key, LogOut, Trash2, ChevronRight, Smartphone } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  SpotlightCard, ShimmerButton, Skeleton, BackgroundGrid, FloatingOrbs,
} from '@/components/ui/bossflow-ui'

// ─── Design tokens ────────────────────────────────────────────
const T = {
  bg: 'rgba(8,8,14,0.92)', bgDeep: 'rgba(6,6,10,0.97)',
  border: 'rgba(255,255,255,0.055)', borderP: 'rgba(124,110,247,0.22)',
  text: '#dcdcf0', sub: '#8a8aaa', muted: '#4a4a6a',
  green: '#34d399', red: '#f87171', amber: '#fbbf24',
  purple: '#7c6ef7', violet: '#a78bfa', cyan: '#22d3ee',
  blur: 'blur(20px)',
}
const card = { background: T.bg, border: `1px solid ${T.border}`, backdropFilter: T.blur, boxShadow: '0 4px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)' }
const inp: React.CSSProperties = { background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.border}`, color: T.text, borderRadius: 12, padding: '10px 14px', fontSize: 13, outline: 'none', width: '100%', transition: 'border-color 0.15s' }

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16, filter: 'blur(4px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  transition: { duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] as const },
})

const DEFAULT_AVATARS = ['👤', '😎', '🧑‍💼', '👩‍💼', '🧑‍💻', '👩‍💻', '🦸', '🧙', '🤴', '👸', '🧑‍🎨', '🥷']

type NotifKey = 'tasks' | 'payments' | 'weekly' | 'events'
const NOTIF_OPTIONS: { key: NotifKey; label: string; desc: string }[] = [
  { key: 'tasks',    label: 'Tarefas com prazo próximo', desc: 'Alerta 1 dia antes do prazo'              },
  { key: 'payments', label: 'Contas a pagar',            desc: 'Lembrete de transações pendentes'         },
  { key: 'events',   label: 'Eventos do dia',            desc: 'Aviso 30 min antes do evento'             },
  { key: 'weekly',   label: 'Relatório semanal',         desc: 'Resumo financeiro toda segunda-feira'     },
]

const TOUR_STEPS = [
  { target: '[data-tour="config-perfil"]',        title: 'Seu perfil',         description: 'Atualize seu nome e foto de perfil aqui.',                           position: 'bottom' as const },
  { target: '[data-tour="config-notificacoes"]',  title: 'Notificações push',  description: 'Ative para receber alertas mesmo com o app fechado.',               position: 'bottom' as const },
  { target: '[data-tour="config-seguranca"]',     title: 'Segurança',          description: 'Altere sua senha ou encerre sua sessão por aqui.',                  position: 'top' as const },
]

// ─── Toggle ──────────────────────────────────────────────────
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <motion.button type="button" onClick={() => onChange(!on)}
      animate={{ background: on ? T.purple : 'rgba(255,255,255,0.06)' }}
      transition={{ duration: 0.2 }}
      className="w-11 h-6 rounded-full relative shrink-0"
      style={{ border: `1px solid ${on ? T.purple : T.border}`, cursor: 'pointer' }}>
      <motion.div animate={{ x: on ? 18 : 2 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="w-4 h-4 rounded-full absolute top-0.5"
        style={{ background: on ? 'white' : T.sub, boxShadow: on ? `0 0 6px ${T.purple}60` : 'none' }} />
    </motion.button>
  )
}

// ── FIX: supabase client criado fora dos componentes
const supabase = createClient()

// ─── Modal Senha ─────────────────────────────────────────────
function PasswordModal({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)
  const [email, setEmail]     = useState('')

  useEffect(() => { supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? '')) }, [])

  async function handleReset() {
    if (!email) return
    setLoading(true)
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` })
    setSent(true)
    setLoading(false)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <motion.div initial={{ scale: 0.93, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.93, opacity: 0 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] as const }}
        className="w-full max-w-sm rounded-2xl p-6 flex flex-col gap-4"
        style={{ background: T.bgDeep, border: `1px solid ${T.borderP}`, boxShadow: '0 24px 64px rgba(0,0,0,0.8)', backdropFilter: 'blur(28px)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${T.purple}14`, border: `1px solid ${T.purple}28` }}>
              <Key size={14} style={{ color: T.violet }} />
            </div>
            <h2 className="font-bold" style={{ fontFamily: 'Syne, sans-serif', color: T.text }}>Alterar senha</h2>
          </div>
          <motion.button whileTap={{ scale: 0.9 }} onClick={onClose}
            className="w-7 h-7 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.05)', color: T.sub, border: `1px solid ${T.border}`, cursor: 'pointer' }}>
            <X size={13} />
          </motion.button>
        </div>

        {sent ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: `${T.green}10`, border: `1px solid ${T.green}25` }}>
              <Check size={22} style={{ color: T.green }} />
            </div>
            <p className="font-semibold" style={{ color: T.text }}>Email enviado!</p>
            <p className="text-sm leading-relaxed" style={{ color: T.muted }}>
              Enviamos um link de redefinição para <strong style={{ color: T.violet }}>{email}</strong>. Verifique sua caixa de entrada.
            </p>
            <ShimmerButton onClick={onClose} className="w-full py-2.5 rounded-xl text-sm font-semibold mt-2"
              style={{ background: `linear-gradient(135deg, ${T.purple}, #a06ef7)`, color: 'white', boxShadow: `0 0 24px ${T.purple}35`, border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>
              Fechar
            </ShimmerButton>
          </div>
        ) : (
          <>
            <p className="text-sm leading-relaxed" style={{ color: T.muted }}>
              Vamos enviar um link de redefinição para <strong style={{ color: T.violet }}>{email}</strong>.
            </p>
            <ShimmerButton onClick={handleReset} disabled={loading}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: `linear-gradient(135deg, ${T.purple}, #a06ef7)`, color: 'white', boxShadow: loading ? 'none' : `0 0 24px ${T.purple}35`, border: '1px solid rgba(255,255,255,0.1)', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <><Key size={14} /> Enviar link</>}
            </ShimmerButton>
          </>
        )}
      </motion.div>
    </motion.div>
  )
}

// ─── Page ────────────────────────────────────────────────────
export default function ConfiguracoesPage() {
  const tour     = useTour('configuracoes', TOUR_STEPS)
  const { permission: pushPermissionHook, loading: pushLoadingHook, requestPermission: subscribePush } = usePushNotification()

  const [user, setUser]               = useState<any>(null)
  const [loading, setLoading]         = useState(true)
  const [saving, setSaving]           = useState(false)
  const [name, setName]               = useState('')
  const [saved, setSaved]             = useState(false)
  const [avatarUrl, setAvatarUrl]     = useState('')
  const [selectedEmoji, setSelectedEmoji] = useState('')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarMode, setAvatarMode]   = useState<'photo' | 'emoji'>('photo')
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [pushPermission, setPushPermission]       = useState<NotificationPermission>('default')
  const [requestingPush, setRequestingPush]       = useState(false)
  const [notifs, setNotifs] = useState<Record<NotifKey, boolean>>({ tasks: true, payments: true, events: true, weekly: false })

  useEffect(() => {
    if (typeof window === 'undefined') return
    const savedNotifs = localStorage.getItem('bf_notif_prefs')
    if (savedNotifs) setNotifs(JSON.parse(savedNotifs))
    if ('Notification' in window) setPushPermission(Notification.permission)
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setLoading(false); return }
        setUser(user); setName(user?.user_metadata?.full_name || '')
        const url = user?.user_metadata?.avatar_url || ''
        setAvatarUrl(url)
        if (url && url.length <= 4) { setSelectedEmoji(url); setAvatarMode('emoji') } else { setAvatarMode('photo') }
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  useEffect(() => { if (pushPermissionHook) setPushPermission(pushPermissionHook) }, [pushPermissionHook])

  function saveNotifPrefs(next: Record<NotifKey, boolean>) { setNotifs(next); localStorage.setItem('bf_notif_prefs', JSON.stringify(next)) }

  async function handleRequestPush() {
    if (!('Notification' in window)) return
    setRequestingPush(true)
    try { await subscribePush(); if ('Notification' in window) setPushPermission(Notification.permission) }
    catch (err) { console.error(err) }
    finally { setRequestingPush(false) }
  }

  function handleToggleNotif(key: NotifKey, val: boolean) {
    if (pushPermission !== 'granted' && val) { handleRequestPush(); return }
    saveNotifPrefs({ ...notifs, [key]: val })
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploadingAvatar(true)
    const ext = file.name.split('.').pop()
    const path = `avatars/${user.id}.${ext}`
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (!error) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      await supabase.auth.updateUser({ data: { avatar_url: data.publicUrl } })
      setAvatarUrl(data.publicUrl); setSelectedEmoji(''); setAvatarMode('photo')
    }
    setUploadingAvatar(false)
  }

  async function handleSelectEmoji(emoji: string) {
    setSelectedEmoji(emoji); setAvatarMode('emoji'); setAvatarUrl(emoji)
    await supabase.auth.updateUser({ data: { avatar_url: emoji } })
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    await supabase.auth.updateUser({ data: { full_name: name } })
    if (user) await supabase.from('profiles').update({ full_name: name, email: user.email }).eq('id', user.id)
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 3000)
  }

  async function handleSignOut() { await supabase.auth.signOut(); window.location.href = '/login' }

  const userName  = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
  const initials  = userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
  const isEmoji   = avatarUrl && avatarUrl.length <= 4
  const isPhoto   = avatarUrl && avatarUrl.length > 4
  const pushBlocked = pushPermission === 'denied'
  const pushGranted = pushPermission === 'granted'

  const SECTION_ICON_STYLE = { background: `${T.purple}12`, border: `1px solid ${T.purple}28`, color: T.violet }

  if (loading) return <BackgroundGrid><FloatingOrbs /><div className="max-w-2xl flex flex-col gap-5">{[0,1,2].map(i => <Skeleton key={i} className="h-48 rounded-2xl" />)}</div></BackgroundGrid>

  return (
    <BackgroundGrid>
      <FloatingOrbs />
      <div className="flex flex-col gap-5 max-w-2xl">
        <TourTooltip active={tour.active} step={tour.step} current={tour.current} total={tour.total} onNext={tour.next} onPrev={tour.prev} onFinish={tour.finish} />

        {/* Header */}
        <motion.div {...fadeUp(0)}>
          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Syne, sans-serif', color: T.text }}>Configurações</h1>
          <div className="flex items-center gap-2 mt-1">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: T.purple, animationDuration: '1.4s' }} />
              <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: T.purple, boxShadow: `0 0 6px ${T.purple}` }} />
            </div>
            <p className="text-sm" style={{ color: T.muted }}>Gerencie sua conta e preferências</p>
          </div>
        </motion.div>

        {/* ── Perfil ── */}
        <motion.div {...fadeUp(0.07)}>
          <SpotlightCard className="rounded-2xl" spotlightColor={`${T.purple}08`} style={{ ...card, padding: 0 }}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={SECTION_ICON_STYLE}><User size={15} /></div>
                <h2 className="font-bold" data-tour="config-perfil" style={{ fontFamily: 'Syne, sans-serif', color: T.text }}>Perfil</h2>
              </div>

              <div className="flex flex-col items-center gap-4 mb-6 pb-6" style={{ borderBottom: `1px solid ${T.border}` }}>
                {/* Avatar */}
                <div className="relative group">
                  <motion.div whileHover={{ scale: 1.05 }}
                    className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center text-3xl font-bold"
                    style={{ background: isPhoto ? 'transparent' : isEmoji ? 'rgba(255,255,255,0.04)' : `linear-gradient(135deg, ${T.purple}, #a06ef7)`, color: 'white', border: `2px solid ${T.border}` }}>
                    {isPhoto
                      ? <img src={avatarUrl} alt={userName} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                      : isEmoji ? <span>{avatarUrl}</span>
                      : <span className="text-2xl">{initials}</span>}
                  </motion.div>
                  <label className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer"
                    style={{ background: T.purple, boxShadow: `0 0 16px ${T.purple}50` }}>
                    {uploadingAvatar ? <div className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <Camera size={13} className="text-white" />}
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                  </label>
                </div>

                {/* Mode switcher */}
                <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.border}` }}>
                  {[['photo', '📷 Foto'], ['emoji', '😎 Avatar']].map(([mode, label]) => (
                    <motion.button key={mode} type="button" whileTap={{ scale: 0.95 }}
                      onClick={() => setAvatarMode(mode as 'photo' | 'emoji')}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{ background: avatarMode === mode ? 'rgba(255,255,255,0.07)' : 'transparent', color: avatarMode === mode ? T.text : T.muted, cursor: 'pointer' }}>
                      {label}
                    </motion.button>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  {avatarMode === 'photo' && (
                    <motion.label key="photo" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium cursor-pointer"
                      style={{ background: `${T.purple}10`, color: T.violet, border: `1px solid ${T.purple}22` }}>
                      <Upload size={13} />
                      {uploadingAvatar ? 'Enviando...' : isPhoto ? 'Trocar foto' : 'Enviar foto'}
                      <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                    </motion.label>
                  )}
                  {avatarMode === 'emoji' && (
                    <motion.div key="emoji" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="w-full">
                      <p className="text-xs font-medium mb-3 text-center" style={{ color: T.muted }}>Escolha um avatar</p>
                      <div className="grid grid-cols-6 gap-2">
                        {DEFAULT_AVATARS.map((emoji, i) => (
                          <motion.button key={emoji} type="button"
                            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.03 }} whileHover={{ scale: 1.14 }} whileTap={{ scale: 0.9 }}
                            onClick={() => handleSelectEmoji(emoji)}
                            className="w-full aspect-square rounded-xl flex items-center justify-center text-2xl"
                            style={{ background: selectedEmoji === emoji ? `${T.purple}18` : 'rgba(255,255,255,0.03)', border: `1px solid ${selectedEmoji === emoji ? T.purple : T.border}`, cursor: 'pointer' }}>
                            {emoji}
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Form */}
              <form onSubmit={handleSave} className="flex flex-col gap-4">
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: T.muted, letterSpacing: '0.06em', fontFamily: 'Syne, sans-serif', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Nome completo</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome"
                    style={inp} onFocus={e => e.currentTarget.style.borderColor = T.borderP} onBlur={e => e.currentTarget.style.borderColor = T.border} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: T.muted, letterSpacing: '0.06em', fontFamily: 'Syne, sans-serif', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Email</label>
                  <input type="email" value={user?.email || ''} disabled
                    style={{ ...inp, opacity: 0.4, cursor: 'not-allowed' }} />
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <ShimmerButton type="submit" disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm"
                    style={{ background: `linear-gradient(135deg, ${T.purple}, #a06ef7)`, color: 'white', boxShadow: saving ? 'none' : `0 0 24px ${T.purple}35`, border: '1px solid rgba(255,255,255,0.1)', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                    {saving ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : 'Salvar alterações'}
                  </ShimmerButton>
                  <AnimatePresence>
                    {saved && (
                      <motion.span initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                        className="text-sm flex items-center gap-1.5" style={{ color: T.green }}>
                        <Check size={13} /> Salvo!
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </form>
            </div>
          </SpotlightCard>
        </motion.div>

        {/* ── Notificações ── */}
        <motion.div {...fadeUp(0.12)}>
          <SpotlightCard className="rounded-2xl" spotlightColor={`${T.purple}06`} style={{ ...card, padding: 0 }}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={SECTION_ICON_STYLE}><Bell size={15} /></div>
                <h2 className="font-bold" data-tour="config-notificacoes" style={{ fontFamily: 'Syne, sans-serif', color: T.text }}>Notificações</h2>
              </div>

              {/* Push status */}
              <div className="rounded-xl p-3 mb-5 flex items-center gap-3"
                style={{ background: pushGranted ? `${T.green}06` : pushBlocked ? `${T.red}06` : `${T.amber}06`, border: `1px solid ${pushGranted ? `${T.green}20` : pushBlocked ? `${T.red}20` : `${T.amber}20`}` }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: pushGranted ? `${T.green}10` : pushBlocked ? `${T.red}10` : `${T.amber}10` }}>
                  {pushGranted ? <BellRing size={14} style={{ color: T.green }} /> : pushBlocked ? <BellOff size={14} style={{ color: T.red }} /> : <Smartphone size={14} style={{ color: T.amber }} />}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold" style={{ color: pushGranted ? T.green : pushBlocked ? T.red : T.amber }}>
                    {pushGranted ? 'Notificações ativadas' : pushBlocked ? 'Notificações bloqueadas' : 'Notificações não ativadas'}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: T.muted }}>
                    {pushGranted ? 'Você receberá alertas deste dispositivo' : pushBlocked ? 'Desbloqueie nas configurações do navegador' : 'Ative para receber alertas em tempo real'}
                  </p>
                </div>
                {!pushGranted && !pushBlocked && (
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={handleRequestPush} disabled={requestingPush || pushLoadingHook}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0"
                    style={{ background: `${T.amber}18`, color: T.amber, border: `1px solid ${T.amber}28`, cursor: 'pointer' }}>
                    {requestingPush || pushLoadingHook ? <div className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" /> : 'Ativar'}
                  </motion.button>
                )}
              </div>

              {/* Toggle list */}
              <div className="flex flex-col gap-4">
                {NOTIF_OPTIONS.map(({ key, label, desc }, i) => (
                  <motion.div key={key} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.18 + i * 0.05 }}
                    className="flex items-center justify-between"
                    style={{ opacity: pushBlocked ? 0.4 : 1 }}>
                    <div>
                      <p className="text-sm font-medium" style={{ color: T.text }}>{label}</p>
                      <p className="text-xs mt-0.5" style={{ color: T.muted }}>{desc}</p>
                    </div>
                    <Toggle on={notifs[key] && pushGranted} onChange={v => handleToggleNotif(key, v)} />
                  </motion.div>
                ))}
              </div>
            </div>
          </SpotlightCard>
        </motion.div>

        {/* ── Segurança ── */}
        <motion.div {...fadeUp(0.17)}>
          <SpotlightCard className="rounded-2xl" spotlightColor={`${T.purple}06`} style={{ ...card, padding: 0 }}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={SECTION_ICON_STYLE}><Shield size={15} /></div>
                <h2 className="font-bold" data-tour="config-seguranca" style={{ fontFamily: 'Syne, sans-serif', color: T.text }}>Segurança</h2>
              </div>

              <div className="flex flex-col" style={{ borderTop: `1px solid ${T.border}` }}>
                {/* Alterar senha */}
                <motion.button whileHover={{ x: 3, backgroundColor: 'rgba(255,255,255,0.018)' }}
                  onClick={() => setShowPasswordModal(true)}
                  className="flex items-center justify-between py-4 w-full text-left rounded-xl px-2 -mx-2"
                  style={{ cursor: 'pointer', transition: 'background 0.15s, transform 0.15s' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}` }}>
                      <Key size={13} style={{ color: T.muted }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: T.text }}>Alterar senha</p>
                      <p className="text-xs mt-0.5" style={{ color: T.muted }}>Enviar link de redefinição por email</p>
                    </div>
                  </div>
                  <ChevronRight size={14} style={{ color: T.muted }} />
                </motion.button>

                <div style={{ height: 1, background: T.border }} />

                {/* Sair */}
                <motion.button whileHover={{ x: 3, backgroundColor: 'rgba(248,113,113,0.04)' }}
                  onClick={handleSignOut}
                  className="flex items-center justify-between py-4 w-full text-left rounded-xl px-2 -mx-2"
                  style={{ cursor: 'pointer', transition: 'background 0.15s, transform 0.15s' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${T.red}08`, border: `1px solid ${T.red}18` }}>
                      <LogOut size={13} style={{ color: T.red }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: T.red }}>Sair da conta</p>
                      <p className="text-xs mt-0.5" style={{ color: T.muted }}>Encerrar sessão atual</p>
                    </div>
                  </div>
                  <ChevronRight size={14} style={{ color: T.muted }} />
                </motion.button>

                <div style={{ height: 1, background: T.border }} />

                {/* Excluir conta */}
                <div className="pt-4">
                  <AnimatePresence>
                    {!showDeleteConfirm ? (
                      <motion.button exit={{ opacity: 0 }} whileHover={{ x: 3 }}
                        onClick={() => setShowDeleteConfirm(true)}
                        className="flex items-center gap-3 w-full text-left"
                        style={{ cursor: 'pointer', opacity: 0.6 }}>
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${T.red}06`, border: `1px solid ${T.red}12` }}>
                          <Trash2 size={13} style={{ color: T.red }} />
                        </div>
                        <div>
                          <p className="text-sm font-medium" style={{ color: T.red }}>Excluir conta</p>
                          <p className="text-xs mt-0.5" style={{ color: T.muted }}>Ação irreversível</p>
                        </div>
                      </motion.button>
                    ) : (
                      <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl p-4" style={{ background: `${T.red}06`, border: `1px solid ${T.red}18` }}>
                        <p className="text-sm font-semibold mb-1" style={{ color: T.red }}>Confirmar exclusão?</p>
                        <p className="text-xs mb-4 leading-relaxed" style={{ color: T.muted }}>
                          Todos os seus dados serão apagados permanentemente. Esta ação não pode ser desfeita.
                        </p>
                        <div className="flex gap-2">
                          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => setShowDeleteConfirm(false)}
                            className="flex-1 py-2 rounded-xl text-xs font-semibold"
                            style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}`, color: T.sub, cursor: 'pointer' }}>Cancelar</motion.button>
                          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                            onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login' }}
                            className="flex-1 py-2 rounded-xl text-xs font-semibold"
                            style={{ background: `${T.red}14`, color: T.red, border: `1px solid ${T.red}28`, cursor: 'pointer' }}>Excluir conta</motion.button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </SpotlightCard>
        </motion.div>

        <AnimatePresence>{showPasswordModal && <PasswordModal onClose={() => setShowPasswordModal(false)} />}</AnimatePresence>
      </div>
    </BackgroundGrid>
  )
}
