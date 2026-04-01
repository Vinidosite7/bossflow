'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { usePushNotification } from '@/hooks/usePushNotification'
import {
  User, Bell, Shield, Camera, Upload, Check, X,
  BellOff, BellRing, Key, LogOut, Trash2, ChevronRight, Smartphone
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { SpotlightCard, ShimmerButton, Skeleton } from '@/components/ui/bossflow-ui'

// ── Design System ──────────────────────────────────────────────────────────
import { T, card, inp, inpLg, inpSm, SYNE } from '@/lib/design'
import { fadeUp, scaleIn } from '@/lib/animations'

import { PageBackground } from '@/components/core'
const DEFAULT_AVATARS = ['👤','😎','🧑‍💼','👩‍💼','🧑‍💻','👩‍💻','🦸','🧙','🤴','👸','🧑‍🎨','🥷']

type NotifKey = 'tasks' | 'payments' | 'weekly' | 'events'
const NOTIF_OPTIONS: { key: NotifKey; label: string; desc: string }[] = [
  { key: 'tasks',    label: 'Tarefas com prazo próximo', desc: 'Alerta 1 dia antes do prazo'          },
  { key: 'payments', label: 'Contas a pagar',            desc: 'Lembrete de transações pendentes'     },
  { key: 'events',   label: 'Eventos do dia',            desc: 'Aviso 30 min antes do evento'         },
  { key: 'weekly',   label: 'Relatório semanal',         desc: 'Resumo financeiro toda segunda-feira' },
]

type Tab = 'perfil' | 'notificacoes' | 'seguranca'

// ── supabase fora do componente ────────────────────────────────
const supabase = createClient()

// ─── Toggle ───────────────────────────────────────────────────
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <motion.button type="button" onClick={() => onChange(!on)}
      animate={{ background: on ? T.purple : 'rgba(255,255,255,0.06)' }}
      transition={{ duration: 0.2 }}
      style={{ width: 44, height: 24, borderRadius: 99, position: 'relative', flexShrink: 0,
        border: `1px solid ${on ? T.purple : T.border}`, cursor: 'pointer' }}>
      <motion.div animate={{ x: on ? 20 : 2 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        style={{ width: 16, height: 16, borderRadius: '50%', position: 'absolute', top: 3,
          background: on ? 'white' : T.sub, boxShadow: on ? `0 0 6px ${T.purple}60` : 'none' }} />
    </motion.button>
  )
}

// ─── Modal Senha ──────────────────────────────────────────────
function PasswordModal({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [email, setEmail] = useState('')
  useEffect(() => { supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? '')) }, [])

  async function handleReset() {
    if (!email) return
    setLoading(true)
    try {
      await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` })
      setSent(true)
    } catch(e) { console.error(e) } finally { setLoading(false) }
  }

  return (
    <FormModal open title="Alterar senha" onClose={onClose} size="sm">
      {sent ? (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: `${T.green}10`, border: `1px solid ${T.green}25` }}>
            <Check size={22} style={{ color: T.green }} />
          </div>
          <p className="font-semibold" style={{ color: T.text }}>Email enviado!</p>
          <p className="text-sm" style={{ color: T.muted }}>
            Link enviado para <strong style={{ color: T.violet }}>{email}</strong>
          </p>
          <ModalSubmitButton onClick={onClose}>Fechar</ModalSubmitButton>
        </div>
      ) : (
        <>
          <p className="text-sm mb-4" style={{ color: T.muted }}>
            Vamos enviar um link para <strong style={{ color: T.violet }}>{email}</strong>
          </p>
          <ModalSubmitButton loading={loading} loadingLabel="Enviando..." onClick={handleReset}>
            <Key size={14} /> Enviar link
          </ModalSubmitButton>
        </>
      )}
    </FormModal>
  )
}

// ─── Page ─────────────────────────────────────────────────────
export default function ConfiguracoesPage() {
  const { permission: pushPermissionHook, loading: pushLoadingHook, requestPermission: subscribePush } = usePushNotification()

  const [activeTab, setActiveTab] = useState<Tab>('perfil')
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
      } catch (err) { console.error(err) } finally { setLoading(false) }
    }
    load()
  }, [])

  useEffect(() => { if (pushPermissionHook) setPushPermission(pushPermissionHook) }, [pushPermissionHook])

  function saveNotifPrefs(next: Record<NotifKey, boolean>) {
    setNotifs(next); localStorage.setItem('bf_notif_prefs', JSON.stringify(next))
  }

  async function handleRequestPush() {
    if (!('Notification' in window)) return
    setRequestingPush(true)
    try { await subscribePush(); if ('Notification' in window) setPushPermission(Notification.permission) }
    catch (err) { console.error(err) } finally { setRequestingPush(false) }
  }

  function handleToggleNotif(key: NotifKey, val: boolean) {
    if (pushPermission !== 'granted' && val) { handleRequestPush(); return }
    saveNotifPrefs({ ...notifs, [key]: val })
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file || !user) return
    setUploadingAvatar(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `avatars/${user.id}.${ext}`
      const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
      if (!error) {
        const { data } = supabase.storage.from('avatars').getPublicUrl(path)
        await supabase.auth.updateUser({ data: { avatar_url: data.publicUrl } })
        setAvatarUrl(data.publicUrl); setSelectedEmoji(''); setAvatarMode('photo')
      }
    } catch(e) { console.error(e) } finally { setUploadingAvatar(false) }
  }

  async function handleSelectEmoji(emoji: string) {
    setSelectedEmoji(emoji); setAvatarMode('emoji'); setAvatarUrl(emoji)
    await supabase.auth.updateUser({ data: { avatar_url: emoji } })
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    try {
      await supabase.auth.updateUser({ data: { full_name: name } })
      await supabase.from('profiles').update({ full_name: name, email: user.email }).eq('id', user.id)
      setSaved(true); setTimeout(() => setSaved(false), 3000)
    } catch(e) { console.error(e) } finally { setSaving(false) }
  }

  async function handleSignOut() {
    await supabase.auth.signOut(); window.location.href = '/login'
  }

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
  const initials = userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
  const isEmoji  = avatarUrl && avatarUrl.length <= 4
  const isPhoto  = avatarUrl && avatarUrl.length > 4
  const pushBlocked = pushPermission === 'denied'
  const pushGranted = pushPermission === 'granted'

  const TABS: { id: Tab; label: string; icon: any }[] = [
    { id: 'perfil',       label: 'Perfil',         icon: User  },
    { id: 'notificacoes', label: 'Notificações',   icon: Bell  },
    { id: 'seguranca',    label: 'Segurança',      icon: Shield },
  ]

  if (loading) return (
    <PageBackground>
      <div className="flex flex-col gap-6 max-w-2xl">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-40 rounded-xl" />
          <Skeleton className="h-4 w-56 rounded-lg" />
        </div>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 16, background: 'rgba(255,255,255,0.025)', border: `1px solid ${T.border}` }}>
          {[1,2,3].map(i => <Skeleton key={i} className="flex-1 h-9 rounded-xl" />)}
        </div>
        {/* Card perfil skeleton */}
        <div style={{ ...card, borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Avatar */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, paddingBottom: 24, borderBottom: `1px solid ${T.border}` }}>
            <Skeleton className="w-24 h-24 rounded-2xl" />
            <Skeleton className="h-5 w-32 rounded-lg" />
            <Skeleton className="h-8 w-28 rounded-xl" />
          </div>
          {/* Campos */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[1,2].map(i => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Skeleton className="h-4 w-24 rounded-lg" />
                <Skeleton className="h-11 w-full rounded-xl" />
              </div>
            ))}
          </div>
          {/* Botão */}
          <Skeleton className="h-11 w-36 rounded-xl" />
        </div>
      </div>
    </PageBackground>
  )

  return (
    <PageBackground>
      <div className="flex flex-col gap-6 max-w-2xl">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <h1 className="text-2xl font-bold" style={{ fontFamily: SYNE, color: T.text }}>Configurações</h1>
          <p className="text-sm mt-1" style={{ color: T.muted }}>Gerencie sua conta e preferências</p>
        </motion.div>

        {/* Tab Selector */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.05 }}>
          <div style={{
            display: 'flex', gap: 4, padding: 4, borderRadius: 16,
            background: 'rgba(255,255,255,0.025)', border: `1px solid ${T.border}`,
          }}>
            {TABS.map(({ id, label, icon: Icon }) => {
              const active = activeTab === id
              return (
                <motion.button key={id} onClick={() => setActiveTab(id)}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    padding: '9px 12px', borderRadius: 12, cursor: 'pointer',
                    background: active ? 'rgba(124,110,247,0.15)' : 'transparent',
                    border: active ? `1px solid rgba(124,110,247,0.28)` : '1px solid transparent',
                    color: active ? T.violet : T.muted,
                    transition: 'all 0.18s ease',
                    boxShadow: active ? `0 0 16px rgba(124,110,247,0.12)` : 'none',
                  }}>
                  <Icon size={13} />
                  <span style={{ fontSize: 13, fontWeight: 600, fontFamily: SYNE }}>{label}</span>
                </motion.button>
              )
            })}
          </div>
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">

          {/* ── ABA PERFIL ── */}
          {activeTab === 'perfil' && (
            <motion.div key="perfil" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
              <SpotlightCard className="rounded-2xl" spotlightColor={`${T.purple}08`} style={{ ...card, padding: 0 }}>
                <div className="p-6 flex flex-col gap-6">

                  {/* Avatar */}
                  <div className="flex flex-col items-center gap-4 pb-6" style={{ borderBottom: `1px solid ${T.border}` }}>
                    <div style={{ position: 'relative' }}>
                      <motion.div whileHover={{ scale: 1.04 }}
                        style={{
                          width: 88, height: 88, borderRadius: 22, overflow: 'hidden',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: isPhoto ? 'transparent' : isEmoji ? 'rgba(255,255,255,0.04)' : `linear-gradient(135deg, ${T.purple}, #a06ef7)`,
                          border: `2px solid ${T.border}`,
                          boxShadow: `0 0 32px rgba(124,110,247,0.2)`,
                        }}>
                        {isPhoto
                          ? <img src={avatarUrl} alt={userName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : isEmoji ? <span style={{ fontSize: 40 }}>{avatarUrl}</span>
                          : <span style={{ fontSize: 28, fontWeight: 700, color: 'white' }}>{initials}</span>}
                      </motion.div>
                      <label style={{
                        position: 'absolute', bottom: -6, right: -6, width: 28, height: 28, borderRadius: 10,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                        background: T.purple, boxShadow: `0 0 12px ${T.purple}55`,
                      }}>
                        {uploadingAvatar
                          ? <div className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                          : <Camera size={12} color="white" />}
                        <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                      </label>
                    </div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: T.text, fontFamily: SYNE }}>{userName}</p>

                    {/* Mode switcher */}
                    <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 12,
                      background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.border}` }}>
                      {[['photo','📷 Foto'],['emoji','😎 Avatar']].map(([mode, label]) => (
                        <button key={mode} onClick={() => setAvatarMode(mode as 'photo' | 'emoji')}
                          style={{
                            padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                            background: avatarMode === mode ? 'rgba(255,255,255,0.07)' : 'transparent',
                            color: avatarMode === mode ? T.text : T.muted, border: 'none',
                          }}>{label}</button>
                      ))}
                    </div>

                    <AnimatePresence mode="wait">
                      {avatarMode === 'photo' && (
                        <motion.label key="photo" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 12,
                            background: `${T.purple}10`, color: T.violet, border: `1px solid ${T.purple}22`,
                            fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                          <Upload size={13} />
                          {uploadingAvatar ? 'Enviando...' : isPhoto ? 'Trocar foto' : 'Enviar foto'}
                          <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                        </motion.label>
                      )}
                      {avatarMode === 'emoji' && (
                        <motion.div key="emoji" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} style={{ width: '100%' }}>
                          <p style={{ fontSize: 12, color: T.muted, textAlign: 'center', marginBottom: 12 }}>Escolha um avatar</p>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 8 }}>
                            {DEFAULT_AVATARS.map((emoji, i) => (
                              <motion.button key={emoji} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.03 }} whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.9 }}
                                onClick={() => handleSelectEmoji(emoji)}
                                style={{
                                  aspectRatio: '1', borderRadius: 12, display: 'flex', alignItems: 'center',
                                  justifyContent: 'center', fontSize: 24, cursor: 'pointer',
                                  background: selectedEmoji === emoji ? `${T.purple}18` : 'rgba(255,255,255,0.03)',
                                  border: `1px solid ${selectedEmoji === emoji ? T.purple : T.border}`,
                                }}>{emoji}</motion.button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: '0.08em',
                        textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Nome completo</label>
                      <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome"
                        style={inp}
                        onFocus={e => e.currentTarget.style.borderColor = T.borderP}
                        onBlur={e => e.currentTarget.style.borderColor = T.border} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: '0.08em',
                        textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Email</label>
                      <input type="email" value={user?.email || ''} disabled
                        style={{ ...inp, opacity: 0.4, cursor: 'not-allowed' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                      <ModalSubmitButton loading={saving}>Salvar alterações</ModalSubmitButton>
                      <AnimatePresence>
                        {saved && (
                          <motion.span initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                            className="flex items-center gap-1.5 text-sm" style={{ color: T.green }}>
                            <Check size={13} /> Salvo!
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                  </form>
                </div>
              </SpotlightCard>
            </motion.div>
          )}

          {/* ── ABA NOTIFICAÇÕES ── */}
          {activeTab === 'notificacoes' && (
            <motion.div key="notificacoes" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
              <SpotlightCard className="rounded-2xl" spotlightColor={`${T.purple}06`} style={{ ...card, padding: 0 }}>
                <div className="p-6 flex flex-col gap-5">

                  {/* Push status banner */}
                  <div style={{
                    borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
                    background: pushGranted ? `${T.green}06` : pushBlocked ? `${T.red}06` : `${T.amber}06`,
                    border: `1px solid ${pushGranted ? `${T.green}20` : pushBlocked ? `${T.red}20` : `${T.amber}20`}`,
                  }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      background: pushGranted ? `${T.green}12` : pushBlocked ? `${T.red}12` : `${T.amber}12`,
                    }}>
                      {pushGranted ? <BellRing size={18} style={{ color: T.green }} />
                        : pushBlocked ? <BellOff size={18} style={{ color: T.red }} />
                        : <Smartphone size={18} style={{ color: T.amber }} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: pushGranted ? T.green : pushBlocked ? T.red : T.amber }}>
                        {pushGranted ? 'Notificações ativadas' : pushBlocked ? 'Notificações bloqueadas' : 'Notificações não ativadas'}
                      </p>
                      <p style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>
                        {pushGranted ? 'Você receberá alertas deste dispositivo'
                          : pushBlocked ? 'Desbloqueie nas configurações do navegador'
                          : 'Ative para receber alertas em tempo real'}
                      </p>
                    </div>
                    {!pushGranted && !pushBlocked && (
                      <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        onClick={handleRequestPush} disabled={requestingPush || pushLoadingHook}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700, flexShrink: 0,
                          background: `${T.amber}18`, color: T.amber, border: `1px solid ${T.amber}28`, cursor: 'pointer',
                        }}>
                        {requestingPush || pushLoadingHook
                          ? <div className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
                          : 'Ativar'}
                      </motion.button>
                    )}
                  </div>

                  {/* Toggle list */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {NOTIF_OPTIONS.map(({ key, label, desc }, i) => (
                      <motion.div key={key} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06 }}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '16px 0', opacity: pushBlocked ? 0.4 : 1,
                          borderBottom: i < NOTIF_OPTIONS.length - 1 ? `1px solid ${T.border}` : 'none',
                        }}>
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{label}</p>
                          <p style={{ fontSize: 12, color: T.muted, marginTop: 3 }}>{desc}</p>
                        </div>
                        <Toggle on={notifs[key] && pushGranted} onChange={v => handleToggleNotif(key, v)} />
                      </motion.div>
                    ))}
                  </div>
                </div>
              </SpotlightCard>
            </motion.div>
          )}

          {/* ── ABA SEGURANÇA ── */}
          {activeTab === 'seguranca' && (
            <motion.div key="seguranca" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
              <SpotlightCard className="rounded-2xl" spotlightColor={`${T.purple}06`} style={{ ...card, padding: 0 }}>
                <div className="p-6 flex flex-col" style={{ gap: 0 }}>

                  {/* Alterar senha */}
                  <motion.button whileHover={{ x: 3 }} onClick={() => setShowPasswordModal(true)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '18px 0', cursor: 'pointer', background: 'none', border: 'none', width: '100%',
                      borderBottom: `1px solid ${T.border}`,
                    }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}` }}>
                        <Key size={16} style={{ color: T.muted }} />
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: T.text }}>Alterar senha</p>
                        <p style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>Enviar link de redefinição por email</p>
                      </div>
                    </div>
                    <ChevronRight size={15} style={{ color: T.muted }} />
                  </motion.button>

                  {/* Sair */}
                  <motion.button whileHover={{ x: 3 }} onClick={handleSignOut}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '18px 0', cursor: 'pointer', background: 'none', border: 'none', width: '100%',
                      borderBottom: `1px solid ${T.border}`,
                    }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: `${T.red}08`, border: `1px solid ${T.red}18` }}>
                        <LogOut size={16} style={{ color: T.red }} />
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: T.red }}>Sair da conta</p>
                        <p style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>Encerrar sessão atual</p>
                      </div>
                    </div>
                    <ChevronRight size={15} style={{ color: T.muted }} />
                  </motion.button>

                  {/* Excluir conta */}
                  <div style={{ paddingTop: 18 }}>
                    <AnimatePresence>
                      {!showDeleteConfirm ? (
                        <motion.button exit={{ opacity: 0 }} whileHover={{ x: 3 }}
                          onClick={() => setShowDeleteConfirm(true)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer',
                            background: 'none', border: 'none', opacity: 0.55, width: '100%',
                          }}>
                          <div style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: `${T.red}06`, border: `1px solid ${T.red}12` }}>
                            <Trash2 size={16} style={{ color: T.red }} />
                          </div>
                          <div style={{ textAlign: 'left' }}>
                            <p style={{ fontSize: 14, fontWeight: 600, color: T.red }}>Excluir conta</p>
                            <p style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>Ação irreversível</p>
                          </div>
                        </motion.button>
                      ) : (
                        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                          style={{ borderRadius: 14, padding: 16, background: `${T.red}06`, border: `1px solid ${T.red}18` }}>
                          <p style={{ fontSize: 14, fontWeight: 700, color: T.red, marginBottom: 6 }}>Confirmar exclusão?</p>
                          <p style={{ fontSize: 12, color: T.muted, marginBottom: 16, lineHeight: 1.6 }}>
                            Todos os seus dados serão apagados permanentemente. Esta ação não pode ser desfeita.
                          </p>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => setShowDeleteConfirm(false)} style={{
                              flex: 1, padding: '10px 0', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                              background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}`, color: T.sub,
                            }}>Cancelar</button>
                            <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login' }} style={{
                              flex: 1, padding: '10px 0', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                              background: `${T.red}14`, color: T.red, border: `1px solid ${T.red}28`,
                            }}>Excluir conta</button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </SpotlightCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {showPasswordModal && <PasswordModal onClose={() => setShowPasswordModal(false)} />}
    </PageBackground>
  )
}
