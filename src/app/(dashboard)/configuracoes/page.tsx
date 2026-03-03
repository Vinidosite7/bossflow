'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useTour } from '@/hooks/useTour'
import { usePushNotification } from '@/hooks/usePushNotification'
import { TourTooltip } from "@/components/TourTooltip"
import { Settings, User, Bell, Shield, Loader2, Camera, Upload, Check, X, BellOff, BellRing, Key, LogOut, Trash2, ChevronRight, Smartphone } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay, ease: [0.25, 0.46, 0.45, 0.94] as const }
})

const DEFAULT_AVATARS = ['👤', '😎', '🧑‍💼', '👩‍💼', '🧑‍💻', '👩‍💻', '🦸', '🧙', '🤴', '👸', '🧑‍🎨', '🥷']

type NotifKey = 'tasks' | 'payments' | 'weekly' | 'events'

const NOTIF_OPTIONS: { key: NotifKey; label: string; desc: string }[] = [
  { key: 'tasks',    label: 'Tarefas com prazo próximo', desc: 'Alerta 1 dia antes do prazo' },
  { key: 'payments', label: 'Contas a pagar',            desc: 'Lembrete de transações pendentes' },
  { key: 'events',   label: 'Eventos do dia',            desc: 'Aviso 30 min antes do evento' },
  { key: 'weekly',   label: 'Relatório semanal',         desc: 'Resumo financeiro toda segunda-feira' },
]

const TOUR_STEPS = [
  {
    target: '[data-tour="config-perfil"]',
    title: 'Seu perfil',
    description: 'Atualize seu nome e foto de perfil aqui.',
    position: 'bottom' as const,
  },
  {
    target: '[data-tour="config-notificacoes"]',
    title: 'Notificações push',
    description: 'Ative para receber alertas mesmo com o app fechado.',
    position: 'bottom' as const,
  },
  {
    target: '[data-tour="config-seguranca"]',
    title: 'Segurança',
    description: 'Altere sua senha ou encerre sua sessão por aqui.',
    position: 'top' as const,
  },
]

/* ─── Toggle ── */
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <motion.button
      type="button"
      onClick={() => onChange(!on)}
      animate={{ background: on ? '#7c6ef7' : '#1e1e2e' }}
      transition={{ duration: 0.2 }}
      className="w-11 h-6 rounded-full relative shrink-0"
      style={{ border: `1px solid ${on ? '#7c6ef7' : '#2a2a3e'}` }}>
      <motion.div
        animate={{ x: on ? 18 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="w-4 h-4 rounded-full bg-white absolute top-0.5"
      />
    </motion.button>
  )
}

/* ─── Modal senha ── */
function PasswordModal({ onClose }: { onClose: () => void }) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [email, setEmail] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ''))
  }, [])

  async function handleReset() {
    if (!email) return
    setLoading(true)
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setSent(true)
    setLoading(false)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-sm rounded-2xl border p-6 flex flex-col gap-4"
        style={{ background: '#111118', borderColor: '#1e1e2e' }}>
        <div className="flex items-center justify-between">
          <h2 className="font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>Alterar senha</h2>
          <button onClick={onClose} style={{ color: '#4a4a6a' }}><X size={16} /></button>
        </div>

        {sent ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)' }}>
              <Check size={22} style={{ color: '#34d399' }} />
            </div>
            <p className="font-semibold" style={{ color: '#e8eaf0' }}>Email enviado!</p>
            <p className="text-sm" style={{ color: '#4a4a6a' }}>
              Enviamos um link de redefinição para <strong style={{ color: '#9d8fff' }}>{email}</strong>.
              Verifique sua caixa de entrada.
            </p>
            <button onClick={onClose}
              className="w-full py-2.5 rounded-xl text-sm font-semibold mt-2"
              style={{ background: '#7c6ef7', color: 'white' }}>
              Fechar
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm" style={{ color: '#6b6b8a' }}>
              Vamos enviar um link de redefinição para <strong style={{ color: '#9d8fff' }}>{email}</strong>.
            </p>
            <button onClick={handleReset} disabled={loading}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: '#7c6ef7', color: 'white' }}>
              {loading ? <Loader2 size={15} className="animate-spin" /> : <><Key size={14} /> Enviar link</>}
            </button>
          </>
        )}
      </motion.div>
    </motion.div>
  )
}

/* ─── Page ── */
export default function ConfiguracoesPage() {
  const supabase = createClient()
  const tour = useTour('configuracoes', TOUR_STEPS)
  const { permission: pushPermissionHook, loading: pushLoadingHook, requestPermission: subscribePush } = usePushNotification()

  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [saved, setSaved] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState('')
  const [selectedEmoji, setSelectedEmoji] = useState('')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarMode, setAvatarMode] = useState<'photo' | 'emoji'>('photo')
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default')
  const [requestingPush, setRequestingPush] = useState(false)
  const [notifs, setNotifs] = useState<Record<NotifKey, boolean>>({
    tasks: true, payments: true, events: true, weekly: false,
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const savedNotifs = localStorage.getItem('bf_notif_prefs')
    if (savedNotifs) setNotifs(JSON.parse(savedNotifs))

    if ('Notification' in window) setPushPermission(Notification.permission)

    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setLoading(false); return }
        setUser(user)
        setName(user?.user_metadata?.full_name || '')
        const url = user?.user_metadata?.avatar_url || ''
        setAvatarUrl(url)
        if (url && url.length <= 4) {
          setSelectedEmoji(url)
          setAvatarMode('emoji')
        } else {
          setAvatarMode('photo')
        }
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  // Sincroniza permissão com o hook
  useEffect(() => {
    if (pushPermissionHook) setPushPermission(pushPermissionHook)
  }, [pushPermissionHook])

  function saveNotifPrefs(next: Record<NotifKey, boolean>) {
    setNotifs(next)
    localStorage.setItem('bf_notif_prefs', JSON.stringify(next))
  }

  async function handleRequestPush() {
    if (!('Notification' in window)) return
    setRequestingPush(true)
    try {
      await subscribePush() // pede permissão + salva subscription no Supabase
      if ('Notification' in window) setPushPermission(Notification.permission)
    } catch (err) { console.error(err) }
    finally { setRequestingPush(false) }
  }

  function handleToggleNotif(key: NotifKey, val: boolean) {
    if (pushPermission !== 'granted' && val) {
      handleRequestPush()
      return
    }
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
      setAvatarUrl(data.publicUrl)
      setSelectedEmoji('')
      setAvatarMode('photo')
    }
    setUploadingAvatar(false)
  }

  async function handleSelectEmoji(emoji: string) {
    setSelectedEmoji(emoji)
    setAvatarMode('emoji')
    setAvatarUrl(emoji)
    await supabase.auth.updateUser({ data: { avatar_url: emoji } })
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await supabase.auth.updateUser({ data: { full_name: name } })
    if (user) {
      await supabase.from('profiles').update({ full_name: name, email: user.email }).eq('id', user.id)
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
  const initials = userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
  const isEmoji = avatarUrl && avatarUrl.length <= 4
  const isPhoto = avatarUrl && avatarUrl.length > 4
  const pushBlocked = pushPermission === 'denied'
  const pushGranted = pushPermission === 'granted'

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: '#7c6ef7', borderTopColor: 'transparent' }} />
    </div>
  )

  return (
    <div className="flex flex-col gap-6 max-w-2xl">

      <TourTooltip
        active={tour.active}
        step={tour.step}
        current={tour.current}
        total={tour.total}
        onNext={tour.next}
        onPrev={tour.prev}
        onFinish={tour.finish}
      />

      <motion.div {...fadeUp(0)}>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>Configurações</h1>
        <p className="text-sm mt-1" style={{ color: '#4a4a6a' }}>Gerencie sua conta e preferências</p>
      </motion.div>

      {/* ── Perfil ── */}
      <motion.div {...fadeUp(0.08)} className="rounded-2xl border p-6"
        style={{ background: '#111118', borderColor: '#1e1e2e' }}
        >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(124,110,247,0.1)', border: '1px solid rgba(124,110,247,0.3)' }}>
            <User size={16} style={{ color: '#9d8fff' }} />
          </div>
          <h2 className="font-bold" data-tour="config-perfil" style={{ fontFamily: 'Syne, sans-serif' }}>Perfil</h2>
        </div>

        <div className="flex flex-col items-center gap-4 mb-6 pb-6 border-b" style={{ borderColor: '#1e1e2e' }}>
          <div className="relative group">
            <motion.div whileHover={{ scale: 1.05 }}
              className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center text-3xl font-bold"
              style={{
                background: isPhoto ? 'transparent' : isEmoji ? '#1a1a2e' : 'linear-gradient(135deg, #7c6ef7, #9d8fff)',
                color: 'white', border: '2px solid #2a2a3e',
              }}>
              {isPhoto
                ? <img src={avatarUrl} alt={userName} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                : isEmoji ? <span>{avatarUrl}</span>
                : <span className="text-2xl">{initials}</span>}
            </motion.div>
            <label className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer"
              style={{ background: '#7c6ef7', boxShadow: '0 0 12px rgba(124,110,247,0.4)' }}>
              {uploadingAvatar ? <Loader2 size={13} className="animate-spin text-white" /> : <Camera size={13} className="text-white" />}
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </label>
          </div>

          <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#0d0d14', border: '1px solid #1e1e2e' }}>
            {[['photo', '📷 Foto'], ['emoji', '😎 Avatar']].map(([mode, label]) => (
              <motion.button key={mode} type="button" whileTap={{ scale: 0.95 }}
                onClick={() => setAvatarMode(mode as 'photo' | 'emoji')}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{ background: avatarMode === mode ? '#1e1e2e' : 'transparent', color: avatarMode === mode ? '#e8e8f0' : '#4a4a6a' }}>
                {label}
              </motion.button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {avatarMode === 'photo' && (
              <motion.label key="photo"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium cursor-pointer"
                style={{ background: 'rgba(124,110,247,0.1)', color: '#9d8fff', border: '1px solid rgba(124,110,247,0.2)' }}>
                <Upload size={14} />
                {uploadingAvatar ? 'Enviando...' : isPhoto ? 'Trocar foto' : 'Enviar foto'}
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </motion.label>
            )}
            {avatarMode === 'emoji' && (
              <motion.div key="emoji" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="w-full">
                <p className="text-xs font-medium mb-3 text-center" style={{ color: '#4a4a6a' }}>Escolha um avatar</p>
                <div className="grid grid-cols-6 gap-2">
                  {DEFAULT_AVATARS.map((emoji, i) => (
                    <motion.button key={emoji} type="button"
                      initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.03 }} whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                      onClick={() => handleSelectEmoji(emoji)}
                      className="w-full aspect-square rounded-xl flex items-center justify-center text-2xl"
                      style={{
                        background: selectedEmoji === emoji ? 'rgba(124,110,247,0.2)' : '#0d0d14',
                        border: `1px solid ${selectedEmoji === emoji ? '#7c6ef7' : '#1e1e2e'}`,
                      }}>
                      {emoji}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: '#6b6b8a' }}>Nome completo</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome"
              className="px-3 py-2.5 rounded-xl border text-sm outline-none"
              style={{ background: '#0d0d14', borderColor: '#1e1e2e', color: '#e8e8f0' }} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: '#6b6b8a' }}>Email</label>
            <input type="email" value={user?.email || ''} disabled
              className="px-3 py-2.5 rounded-xl border text-sm outline-none opacity-40"
              style={{ background: '#0d0d14', borderColor: '#1e1e2e', color: '#e8e8f0' }} />
          </div>
          <div className="flex items-center gap-3">
            <motion.button type="submit" disabled={saving}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm"
              style={{ background: '#7c6ef7', color: 'white' }}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : 'Salvar alterações'}
            </motion.button>
            <AnimatePresence>
              {saved && (
                <motion.span initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                  className="text-sm flex items-center gap-1" style={{ color: '#34d399' }}>
                  <Check size={13} /> Salvo!
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </form>
      </motion.div>

      {/* ── Notificações ── */}
      <motion.div {...fadeUp(0.16)} className="rounded-2xl border p-6"
        style={{ background: '#111118', borderColor: '#1e1e2e' }}
        >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(124,110,247,0.1)', border: '1px solid rgba(124,110,247,0.3)' }}>
            <Bell size={16} style={{ color: '#9d8fff' }} />
          </div>
          <h2 className="font-bold" data-tour="config-notificacoes" style={{ fontFamily: 'Syne, sans-serif' }}>Notificações</h2>
        </div>

        <div className="rounded-xl p-3 mb-5 flex items-center gap-3"
          style={{
            background: pushGranted ? 'rgba(52,211,153,0.06)' : pushBlocked ? 'rgba(248,113,113,0.06)' : 'rgba(251,191,36,0.06)',
            border: `1px solid ${pushGranted ? 'rgba(52,211,153,0.2)' : pushBlocked ? 'rgba(248,113,113,0.2)' : 'rgba(251,191,36,0.2)'}`,
          }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: pushGranted ? 'rgba(52,211,153,0.1)' : pushBlocked ? 'rgba(248,113,113,0.1)' : 'rgba(251,191,36,0.1)' }}>
            {pushGranted ? <BellRing size={15} style={{ color: '#34d399' }} />
              : pushBlocked ? <BellOff size={15} style={{ color: '#f87171' }} />
              : <Smartphone size={15} style={{ color: '#fbbf24' }} />}
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold"
              style={{ color: pushGranted ? '#34d399' : pushBlocked ? '#f87171' : '#fbbf24' }}>
              {pushGranted ? 'Notificações ativadas'
                : pushBlocked ? 'Notificações bloqueadas'
                : 'Notificações não ativadas'}
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#4a4a6a' }}>
              {pushGranted ? 'Você receberá alertas deste dispositivo'
                : pushBlocked ? 'Desbloqueie nas configurações do navegador'
                : 'Ative para receber alertas em tempo real'}
            </p>
          </div>
          {!pushGranted && !pushBlocked && (
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={handleRequestPush} disabled={requestingPush || pushLoadingHook}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shrink-0"
              style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}>
              {requestingPush || pushLoadingHook ? <Loader2 size={11} className="animate-spin" /> : 'Ativar'}
            </motion.button>
          )}
        </div>

        <div className="flex flex-col gap-4">
          {NOTIF_OPTIONS.map(({ key, label, desc }, i) => (
            <motion.div key={key}
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.06 }}
              className="flex items-center justify-between"
              style={{ opacity: pushBlocked ? 0.4 : 1 }}>
              <div>
                <p className="text-sm font-medium" style={{ color: '#d0d0e0' }}>{label}</p>
                <p className="text-xs mt-0.5" style={{ color: '#4a4a6a' }}>{desc}</p>
              </div>
              <Toggle on={notifs[key] && pushGranted} onChange={v => handleToggleNotif(key, v)} />
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── Segurança ── */}
      <motion.div {...fadeUp(0.24)} className="rounded-2xl border p-6"
        style={{ background: '#111118', borderColor: '#1e1e2e' }}
        >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(124,110,247,0.1)', border: '1px solid rgba(124,110,247,0.3)' }}>
            <Shield size={16} style={{ color: '#9d8fff' }} />
          </div>
          <h2 className="font-bold" data-tour="config-seguranca" style={{ fontFamily: 'Syne, sans-serif' }}>Segurança</h2>
        </div>

        <div className="flex flex-col divide-y" style={{ ['--tw-divide-opacity' as any]: 1 }}>
          <motion.button whileHover={{ x: 2 }} onClick={() => setShowPasswordModal(true)}
            className="flex items-center justify-between py-3.5 w-full text-left">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: '#0d0d14', border: '1px solid #1e1e2e' }}>
                <Key size={14} style={{ color: '#6b6b8a' }} />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: '#d0d0e0' }}>Alterar senha</p>
                <p className="text-xs mt-0.5" style={{ color: '#4a4a6a' }}>Enviar link de redefinição por email</p>
              </div>
            </div>
            <ChevronRight size={15} style={{ color: '#4a4a6a' }} />
          </motion.button>

          <motion.button whileHover={{ x: 2 }} onClick={handleSignOut}
            className="flex items-center justify-between py-3.5 w-full text-left">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)' }}>
                <LogOut size={14} style={{ color: '#f87171' }} />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: '#f87171' }}>Sair da conta</p>
                <p className="text-xs mt-0.5" style={{ color: '#4a4a6a' }}>Encerrar sessão atual</p>
              </div>
            </div>
            <ChevronRight size={15} style={{ color: '#4a4a6a' }} />
          </motion.button>

          <div className="pt-3.5">
            <AnimatePresence>
              {!showDeleteConfirm ? (
                <motion.button exit={{ opacity: 0 }} whileHover={{ x: 2 }}
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-3 w-full text-left">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.1)' }}>
                    <Trash2 size={14} style={{ color: '#f87171', opacity: 0.6 }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#f87171', opacity: 0.6 }}>Excluir conta</p>
                    <p className="text-xs mt-0.5" style={{ color: '#4a4a6a' }}>Ação irreversível</p>
                  </div>
                </motion.button>
              ) : (
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl p-3"
                  style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)' }}>
                  <p className="text-sm font-semibold mb-1" style={{ color: '#f87171' }}>Confirmar exclusão?</p>
                  <p className="text-xs mb-3" style={{ color: '#4a4a6a' }}>
                    Todos os seus dados serão apagados permanentemente. Esta ação não pode ser desfeita.
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold"
                      style={{ background: '#1a1a2a', color: '#6b6b8a' }}>
                      Cancelar
                    </button>
                    <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login' }}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold"
                      style={{ background: 'rgba(248,113,113,0.15)', color: '#f87171', border: '1px solid rgba(248,113,113,0.3)' }}>
                      Excluir conta
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showPasswordModal && <PasswordModal onClose={() => setShowPasswordModal(false)} />}
      </AnimatePresence>

    </div>
  )
}
