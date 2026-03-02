'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Settings, User, Bell, Shield, Loader2, Camera, Upload } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay, ease: [0.25, 0.46, 0.45, 0.94] as const }
})

const DEFAULT_AVATARS = ['👤', '😎', '🧑‍💼', '👩‍💼', '🧑‍💻', '👩‍💻', '🦸', '🧙', '🤴', '👸', '🧑‍🎨', '🥷']

export default function ConfiguracoesPage() {
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [saved, setSaved] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState('')
  const [selectedEmoji, setSelectedEmoji] = useState('')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarMode, setAvatarMode] = useState<'photo' | 'emoji'>('photo')

  useEffect(() => {
    if (typeof window === 'undefined') return
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
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
  const initials = userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
  const isEmoji = avatarUrl && avatarUrl.length <= 4
  const isPhoto = avatarUrl && avatarUrl.length > 4

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: '#7c6ef7', borderTopColor: 'transparent' }} />
    </div>
  )

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <motion.div {...fadeUp(0)}>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>Configurações</h1>
        <p className="text-sm mt-1" style={{ color: '#4a4a6a' }}>Gerencie sua conta e preferências</p>
      </motion.div>

      {/* Perfil */}
      <motion.div {...fadeUp(0.08)} className="rounded-2xl border p-6" style={{ background: '#111118', borderColor: '#1e1e2e' }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(124,110,247,0.1)', border: '1px solid rgba(124,110,247,0.3)' }}>
            <User size={16} style={{ color: '#9d8fff' }} />
          </div>
          <h2 className="font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>Perfil</h2>
        </div>

        {/* Avatar */}
        <div className="flex flex-col items-center gap-4 mb-6 pb-6 border-b" style={{ borderColor: '#1e1e2e' }}>
          <div className="relative group">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center text-3xl font-bold"
              style={{
                background: isPhoto ? 'transparent' : isEmoji ? '#1a1a2e' : 'linear-gradient(135deg, #7c6ef7, #9d8fff)',
                color: 'white',
                border: '2px solid #2a2a3e',
              }}>
              {isPhoto
                ? <img src={avatarUrl} alt={userName} className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                : isEmoji
                  ? <span>{avatarUrl}</span>
                  : <span className="text-2xl">{initials}</span>}
            </motion.div>
            <label className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer"
              style={{ background: '#7c6ef7', boxShadow: '0 0 12px rgba(124,110,247,0.4)' }}>
              {uploadingAvatar
                ? <Loader2 size={13} className="animate-spin text-white" />
                : <Camera size={13} className="text-white" />}
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </label>
          </div>

          <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#0d0d14', border: '1px solid #1e1e2e' }}>
            {[['photo', '📷 Foto'], ['emoji', '😎 Avatar']].map(([mode, label]) => (
              <motion.button key={mode} type="button" whileTap={{ scale: 0.95 }}
                onClick={() => setAvatarMode(mode as 'photo' | 'emoji')}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: avatarMode === mode ? '#1e1e2e' : 'transparent',
                  color: avatarMode === mode ? '#e8e8f0' : '#4a4a6a',
                }}>
                {label}
              </motion.button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {avatarMode === 'photo' && (
              <motion.label key="photo"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition-all"
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
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.03 }}
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleSelectEmoji(emoji)}
                      className="w-full aspect-square rounded-xl flex items-center justify-center text-2xl transition-all"
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
            <input type="text" value={name} onChange={e => setName(e.target.value)}
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
                  className="text-sm" style={{ color: '#34d399' }}>✓ Salvo!</motion.span>
              )}
            </AnimatePresence>
          </div>
        </form>
      </motion.div>

      {/* Notificações */}
      <motion.div {...fadeUp(0.16)} className="rounded-2xl border p-6" style={{ background: '#111118', borderColor: '#1e1e2e' }}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(124,110,247,0.1)', border: '1px solid rgba(124,110,247,0.3)' }}>
            <Bell size={16} style={{ color: '#9d8fff' }} />
          </div>
          <h2 className="font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>Notificações</h2>
        </div>
        <div className="flex flex-col gap-4">
          {[
            { label: 'Tarefas com prazo próximo', desc: 'Receba alertas 1 dia antes do prazo' },
            { label: 'Contas a pagar', desc: 'Lembrete de transações pendentes' },
            { label: 'Relatório semanal', desc: 'Resumo financeiro toda segunda-feira' },
          ].map(({ label, desc }, i) => (
            <motion.div key={label}
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.06 }}
              className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: '#d0d0e0' }}>{label}</p>
                <p className="text-xs mt-0.5" style={{ color: '#4a4a6a' }}>{desc}</p>
              </div>
              <motion.button whileTap={{ scale: 0.9 }}
                className="w-11 h-6 rounded-full relative transition-all" style={{ background: '#7c6ef7' }}>
                <div className="w-4 h-4 rounded-full bg-white absolute right-1 top-1 transition-all" />
              </motion.button>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Segurança */}
      <motion.div {...fadeUp(0.24)} className="rounded-2xl border p-6" style={{ background: '#111118', borderColor: '#1e1e2e' }}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(124,110,247,0.1)', border: '1px solid rgba(124,110,247,0.3)' }}>
            <Shield size={16} style={{ color: '#9d8fff' }} />
          </div>
          <h2 className="font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>Segurança</h2>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: '#1e1e2e' }}>
            <div>
              <p className="text-sm font-medium" style={{ color: '#d0d0e0' }}>Alterar senha</p>
              <p className="text-xs mt-0.5" style={{ color: '#4a4a6a' }}>Atualize sua senha de acesso</p>
            </div>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className="px-4 py-2 rounded-xl text-sm font-medium"
              style={{ background: '#0d0d14', border: '1px solid #1e1e2e', color: '#6b6b8a' }}>
              Alterar
            </motion.button>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium" style={{ color: '#f87171' }}>Sair da conta</p>
              <p className="text-xs mt-0.5" style={{ color: '#4a4a6a' }}>Encerrar sessão atual</p>
            </div>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login' }}
              className="px-4 py-2 rounded-xl text-sm font-medium"
              style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171' }}>
              Sair
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
