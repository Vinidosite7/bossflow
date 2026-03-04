'use client'

import {
  Bell, ChevronDown, Building2, Check, LogOut,
  Settings, User, Camera, Menu, CheckCheck, X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { useNotifications } from '@/hooks/useNotifications'
import { motion, AnimatePresence } from 'framer-motion'

const typeIcons: Record<string, string> = {
  task: '📋', payment: '💸', event: '📅', sale: '🛍️', info: '📦',
}

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [avatarUrl, setAvatarUrl] = useState('')
  const [businesses, setBusinesses] = useState<any[]>([])
  const [activeBiz, setActiveBiz] = useState<any>(null)
  const [showBizMenu, setShowBizMenu] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifs, setShowNotifs] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [businessId, setBusinessId] = useState<string | null>(null)
  const bizRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  const { notifications, unreadCount, readNotification, readAll } = useNotifications(businessId)

  useEffect(() => {
    if (typeof window === 'undefined') return
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        setUser(user)
        setAvatarUrl(user.user_metadata?.avatar_url || '')
        const { data: owned } = await supabase
  .from('businesses').select('*').eq('owner_id', user.id).order('created_at')

const { data: memberships } = await supabase
  .from('business_members').select('business_id, role')
  .eq('user_id', user.id).in('status', ['accepted', 'active'])

const memberBizIds = (memberships || [])
  .map((m: any) => m.business_id)
  .filter((id: string) => !(owned || []).find((o: any) => o.id === id))

let memberBizzes: any[] = []
if (memberBizIds.length > 0) {
  const { data: bizData } = await supabase
    .from('businesses').select('*').in('id', memberBizIds)
  memberBizzes = (bizData || []).map((b: any) => ({
    ...b,
    _memberRole: memberships?.find((m: any) => m.business_id === b.id)?.role,
  }))
}

const bizList = [...(owned || []), ...memberBizzes]
setBusinesses(bizList)
const savedBizId = localStorage.getItem('activeBizId') || ''
const active = bizList.find(b => b.id === savedBizId) || bizList[0]
setActiveBiz(active || null)
setBusinessId(active?.id || null)
      } catch (err) { console.error(err) }
    }
    load()
  }, [])

  // Fecha dropdowns ao clicar fora (desktop)
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (bizRef.current && !bizRef.current.contains(e.target as Node)) setShowBizMenu(false)
      if (userRef.current && !userRef.current.contains(e.target as Node)) setShowUserMenu(false)
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Bloqueia scroll do body quando overlay mobile aberto
  useEffect(() => {
    const isOpen = showNotifs || showBizMenu || showUserMenu
    if (typeof window !== 'undefined') {
      document.body.style.overflow = isOpen ? 'hidden' : ''
    }
    return () => { document.body.style.overflow = '' }
  }, [showNotifs, showBizMenu, showUserMenu])

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
    }
    setUploadingAvatar(false)
  }

  function switchBiz(biz: any) {
    setActiveBiz(biz)
    localStorage.setItem('activeBizId', biz.id)
    setShowBizMenu(false)
    window.location.reload()
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
  const initials = userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
  const isEmoji = avatarUrl && avatarUrl.length <= 4
  const isPhoto = avatarUrl && avatarUrl.length > 4

  function UserAvatar({ size = 'sm' }: { size?: 'sm' | 'md' | 'lg' }) {
    const dims = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-14 h-14' }
    const textSizes = { sm: 'text-lg', md: 'text-2xl', lg: 'text-3xl' }
    const initialSizes = { sm: 'text-xs', md: 'text-sm', lg: 'text-lg' }
    return (
      <div className={`${dims[size]} rounded-xl overflow-hidden flex items-center justify-center font-bold shrink-0`}
        style={{ background: isEmoji ? '#1a1a2e' : isPhoto ? 'transparent' : 'linear-gradient(135deg, #7c6ef7, #9d8fff)', color: 'white' }}>
        {isEmoji
          ? <span className={textSizes[size]}>{avatarUrl}</span>
          : isPhoto
            ? <img src={avatarUrl} alt={userName} className="w-full h-full object-cover"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            : <span className={initialSizes[size]}>{initials}</span>}
      </div>
    )
  }

  function BizLogo({ biz, size = 'sm' }: { biz: any; size?: 'sm' | 'md' }) {
    const dim = size === 'sm' ? 'w-7 h-7' : 'w-8 h-8'
    const iconSize = size === 'sm' ? 13 : 14
    return (
      <div className={`${dim} rounded-lg overflow-hidden flex items-center justify-center shrink-0`}
        style={{ background: '#1a1a2e', border: '1px solid #2a2a3e' }}>
        {biz?.logo_url
          ? <img src={biz.logo_url} alt={biz.name} className="w-full h-full object-cover"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          : <Building2 size={iconSize} style={{ color: '#6b6b8a' }} />}
      </div>
    )
  }

  // ── Overlay mobile genérico ─────────────────────────────────────────────
  function MobileOverlay({ onClose }: { onClose: () => void }) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 md:hidden"
        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />
    )
  }

  // ── Painel mobile ───────────────────────────────────────────────────────
  function MobilePanel({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
    return (
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ duration: 0.32, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden rounded-t-3xl"
style={{
  background: '#111118',
  border: '1px solid #1e1e2e',
  maxHeight: '85dvh',
  paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)',
  overflowY: 'auto',
}}
      >
        {/* Handle bar */}
        <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-1" style={{ background: '#2a2a3e' }} />
        {children}
      </motion.div>
    )
  }

  return (
    <>
      <header className="h-14 flex items-center justify-between px-3 sm:px-4 border-b shrink-0"
        style={{ background: '#0d0d14', borderColor: '#1a1a2e' }}>

        {/* Left — menu + empresa */}
        <div className="flex items-center gap-2">
          <motion.button whileTap={{ scale: 0.9 }}
            onClick={onMenuClick}
            className="w-9 h-9 flex items-center justify-center rounded-xl md:hidden shrink-0"
            style={{ background: '#1a1a2e', color: '#6b6b8a' }}>
            <Menu size={18} />
          </motion.button>

          {/* Seletor empresa */}
          <div className="relative" ref={bizRef}>
            <motion.button whileTap={{ scale: 0.97 }}
              onClick={() => setShowBizMenu(!showBizMenu)}
              className="flex items-center gap-2 px-2 sm:px-3 py-2 rounded-xl transition-all"
              style={{
                background: showBizMenu ? '#1a1a2e' : 'transparent',
                border: `1px solid ${showBizMenu ? '#2a2a3e' : 'transparent'}`,
              }}>
              <BizLogo biz={activeBiz} />
              <div className="text-left">
                <p className="text-sm font-semibold leading-none truncate"
                  style={{ color: '#d0d0e0', maxWidth: '90px' }}>
                  {activeBiz?.name || 'Empresa'}
                </p>
                <p className="text-xs mt-0.5 hidden sm:block" style={{ color: '#4a4a6a' }}>Empresa ativa</p>
              </div>
              <motion.div animate={{ rotate: showBizMenu ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown size={12} style={{ color: '#4a4a6a' }} />
              </motion.div>
            </motion.button>

            {/* Dropdown empresa — desktop */}
            <AnimatePresence>
              {showBizMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ duration: 0.18 }}
                  className="absolute left-0 top-12 rounded-xl border p-1.5 z-50 hidden md:block"
                  style={{ background: '#111118', borderColor: '#1e1e2e', boxShadow: '0 12px 40px rgba(0,0,0,0.6)', minWidth: '220px' }}>
                  <p className="text-xs font-semibold uppercase tracking-widest px-3 py-2" style={{ color: '#3a3a5c' }}>
                    Suas empresas
                  </p>
                  {businesses.map(biz => (
                    <button key={biz.id} onClick={() => switchBiz(biz)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left"
                      style={{ background: activeBiz?.id === biz.id ? '#1a1a2e' : 'transparent' }}
                      onMouseEnter={e => { if (activeBiz?.id !== biz.id) e.currentTarget.style.background = '#161622' }}
                      onMouseLeave={e => { if (activeBiz?.id !== biz.id) e.currentTarget.style.background = 'transparent' }}>
                      <BizLogo biz={biz} size="md" />
                      <span className="text-sm font-medium flex-1 truncate" style={{ color: '#d0d0e0' }}>{biz.name}</span>
                      {activeBiz?.id === biz.id && <Check size={13} style={{ color: '#7c6ef7' }} />}
                    </button>
                  ))}
                  <div className="my-1.5" style={{ borderTop: '1px solid #1e1e2e' }} />
                  <button onClick={() => { setShowBizMenu(false); router.push('/empresas') }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all"
                    style={{ color: '#7c6ef7' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#1a1a2e'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    + Gerenciar empresas
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right — notificações + avatar */}
        <div className="flex items-center gap-1">

          {/* Notificações */}
          <div className="relative" ref={notifRef}>
            <motion.button whileTap={{ scale: 0.9 }}
              onClick={() => setShowNotifs(!showNotifs)}
              className="relative w-9 h-9 flex items-center justify-center rounded-xl transition-all"
              style={{
                background: showNotifs ? '#1a1a2e' : 'transparent',
                border: `1px solid ${showNotifs ? '#2a2a3e' : 'transparent'}`,
              }}>
              <Bell size={16} style={{ color: unreadCount > 0 ? '#9d8fff' : '#6b6b8a' }} />
              <AnimatePresence>
                {unreadCount > 0 && (
                  <motion.span
                    key="badge"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ background: '#f87171', fontSize: '9px' }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Dropdown notificações — desktop */}
            <AnimatePresence>
              {showNotifs && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ duration: 0.18 }}
                  className="absolute right-0 top-12 rounded-xl border z-50 overflow-hidden hidden md:block"
                  style={{ background: '#111118', borderColor: '#1e1e2e', boxShadow: '0 12px 40px rgba(0,0,0,0.6)', width: '320px' }}>
                  <NotifContent
                    notifications={notifications}
                    unreadCount={unreadCount}
                    readNotification={readNotification}
                    readAll={readAll}
                    onClose={() => setShowNotifs(false)}
                    router={router}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Avatar */}
          <div className="relative" ref={userRef}>
            <motion.button whileTap={{ scale: 0.95 }}
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-xl transition-all"
              style={{
                background: showUserMenu ? '#1a1a2e' : 'transparent',
                border: `1px solid ${showUserMenu ? '#2a2a3e' : 'transparent'}`,
              }}>
              <UserAvatar size="sm" />
              <div className="text-left hidden sm:block">
                <p className="text-sm font-semibold leading-none" style={{ color: '#d0d0e0' }}>
                  {userName.split(' ')[0]}
                </p>
                <p className="text-xs mt-0.5" style={{ color: '#4a4a6a' }}>Minha conta</p>
              </div>
              <ChevronDown size={11} style={{ color: '#4a4a6a' }} className="hidden sm:block" />
            </motion.button>

            {/* Dropdown user — desktop */}
            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ duration: 0.18 }}
                  className="absolute right-0 top-12 rounded-xl border p-1.5 w-52 z-50 hidden md:block"
                  style={{ background: '#111118', borderColor: '#1e1e2e', boxShadow: '0 12px 40px rgba(0,0,0,0.6)' }}>
                  <div className="flex items-center gap-3 px-3 py-3 mb-1 border-b" style={{ borderColor: '#1e1e2e' }}>
                    <label className="relative cursor-pointer group shrink-0">
                      <UserAvatar size="md" />
                      {!isEmoji && (
                        <div className="absolute inset-0 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ background: 'rgba(0,0,0,0.6)' }}>
                          {uploadingAvatar
                            ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                            : <Camera size={13} className="text-white" />}
                        </div>
                      )}
                      <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                    </label>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: '#d0d0e0' }}>{userName}</p>
                      <p className="text-xs truncate mt-0.5" style={{ color: '#4a4a6a' }}>{user?.email}</p>
                    </div>
                  </div>
                  {[
                    { icon: Settings, label: 'Configurações', href: '/configuracoes' },
                    { icon: User, label: 'Perfil', href: '/configuracoes' },
                  ].map(({ icon: Icon, label, href }) => (
                    <button key={label}
                      onClick={() => { setShowUserMenu(false); router.push(href) }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all"
                      style={{ color: '#8a8aaa' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#1a1a2e'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <Icon size={14} /> {label}
                    </button>
                  ))}
                  <div className="my-1" style={{ borderTop: '1px solid #1e1e2e' }} />
                  <button onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all"
                    style={{ color: '#f87171' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <LogOut size={14} /> Sair
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* ── Overlays e painéis mobile ───────────────────────────────────── */}
      <AnimatePresence>
        {showNotifs && (
          <>
            <MobileOverlay onClose={() => setShowNotifs(false)} />
            <MobilePanel onClose={() => setShowNotifs(false)}>
              <div className="flex items-center justify-between px-5 py-3">
                <p className="font-bold text-base" style={{ fontFamily: 'Syne, sans-serif', color: '#e8e8f0' }}>
                  Notificações
                </p>
                <motion.button whileTap={{ scale: 0.9 }}
                  onClick={() => setShowNotifs(false)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: '#1a1a2e', color: '#6b6b8a' }}>
                  <X size={15} />
                </motion.button>
              </div>
              <div className="overflow-y-auto" style={{ maxHeight: 'calc(85vh - 80px)' }}>
                <NotifContent
                  notifications={notifications}
                  unreadCount={unreadCount}
                  readNotification={readNotification}
                  readAll={readAll}
                  onClose={() => setShowNotifs(false)}
                  router={router}
                  mobile
                />
              </div>
            </MobilePanel>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBizMenu && (
          <>
            <MobileOverlay onClose={() => setShowBizMenu(false)} />
            <MobilePanel onClose={() => setShowBizMenu(false)}>
              <div className="flex items-center justify-between px-5 py-3">
                <p className="font-bold text-base" style={{ fontFamily: 'Syne, sans-serif', color: '#e8e8f0' }}>
                  Suas empresas
                </p>
                <motion.button whileTap={{ scale: 0.9 }}
                  onClick={() => setShowBizMenu(false)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: '#1a1a2e', color: '#6b6b8a' }}>
                  <X size={15} />
                </motion.button>
              </div>
              <div className="px-3 pb-4 flex flex-col gap-2">
                {businesses.map(biz => (
                  <motion.button key={biz.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => switchBiz(biz)}
                    className="flex items-center gap-3 p-4 rounded-2xl w-full text-left"
                    style={{
                      background: activeBiz?.id === biz.id ? 'rgba(124,110,247,0.1)' : '#0d0d14',
                      border: `1px solid ${activeBiz?.id === biz.id ? 'rgba(124,110,247,0.3)' : '#1e1e2e'}`,
                    }}>
                    <BizLogo biz={biz} size="md" />
                    <span className="text-sm font-semibold flex-1 truncate" style={{ color: '#d0d0e0' }}>{biz.name}</span>
                    {activeBiz?.id === biz.id && (
                      <Check size={14} style={{ color: '#7c6ef7' }} />
                    )}
                  </motion.button>
                ))}
                <motion.button whileTap={{ scale: 0.98 }}
                  onClick={() => { setShowBizMenu(false); router.push('/empresas') }}
                  className="flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold mt-1"
                  style={{ background: 'rgba(124,110,247,0.1)', color: '#9d8fff', border: '1px solid rgba(124,110,247,0.2)' }}>
                  + Gerenciar empresas
                </motion.button>
              </div>
            </MobilePanel>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showUserMenu && (
          <>
            <MobileOverlay onClose={() => setShowUserMenu(false)} />
            <MobilePanel onClose={() => setShowUserMenu(false)}>
              {/* Avatar grande */}
              <div className="flex flex-col items-center gap-3 px-5 py-4 border-b" style={{ borderColor: '#1e1e2e' }}>
                <label className="relative cursor-pointer group">
                  <UserAvatar size="lg" />
                  {!isEmoji && (
                    <div className="absolute inset-0 rounded-xl flex items-center justify-center opacity-0 group-active:opacity-100 transition-opacity"
                      style={{ background: 'rgba(0,0,0,0.6)' }}>
                      <Camera size={18} className="text-white" />
                    </div>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                </label>
                <div className="text-center">
                  <p className="font-bold text-base" style={{ color: '#e8e8f0' }}>{userName}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#4a4a6a' }}>{user?.email}</p>
                </div>
              </div>
              <div className="p-3 flex flex-col gap-1 pb-2">
                {[
                  { icon: Settings, label: 'Configurações', href: '/configuracoes' },
                  { icon: User, label: 'Perfil', href: '/configuracoes' },
                ].map(({ icon: Icon, label, href }) => (
                  <motion.button key={label} whileTap={{ scale: 0.98 }}
                    onClick={() => { setShowUserMenu(false); router.push(href) }}
                    className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium w-full text-left"
                    style={{ color: '#8a8aaa', background: '#0d0d14', border: '1px solid #1e1e2e' }}>
                    <Icon size={16} /> {label}
                  </motion.button>
                ))}
                <div className="my-1" style={{ borderTop: '1px solid #1e1e2e' }} />
                <motion.button whileTap={{ scale: 0.98 }}
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold w-full"
                  style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}>
                  <LogOut size={16} /> Sair da conta
                </motion.button>
              </div>
            </MobilePanel>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

// ── Conteúdo das notificações (reutilizado em desktop e mobile) ─────────────
function NotifContent({
  notifications, unreadCount, readNotification, readAll, onClose, router, mobile = false
}: any) {
  return (
    <>
      {/* Header interno */}
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: '#1a1a2a' }}>
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#6b6b8a' }}>
            {mobile ? 'Todas' : 'Notificações'}
          </p>
          {unreadCount > 0 && (
            <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
              style={{ background: 'rgba(248,113,113,0.15)', color: '#f87171' }}>
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <motion.button whileTap={{ scale: 0.95 }}
            onClick={readAll}
            className="flex items-center gap-1 text-xs transition-colors"
            style={{ color: '#4a4a6a' }}
            onMouseEnter={e => e.currentTarget.style.color = '#7c6ef7'}
            onMouseLeave={e => e.currentTarget.style.color = '#4a4a6a'}>
            <CheckCheck size={12} /> Marcar todas
          </motion.button>
        )}
      </div>

      {/* Lista */}
      <div>
        {notifications.length === 0 ? (
          <div className="px-4 py-10 text-sm text-center" style={{ color: '#4a4a6a' }}>
            <motion.p
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-3xl mb-3">🎉</motion.p>
            Tudo em dia!
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {notifications.map((n: any, i: number) => (
              <motion.button key={n.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => { readNotification(n.id); onClose(); router.push(n.href) }}
                className="w-full flex items-start gap-3 px-4 py-3.5 text-left transition-all"
                style={{
                  background: n.read ? 'transparent' : 'rgba(124,110,247,0.04)',
                  borderBottom: i < notifications.length - 1 ? '1px solid #1a1a2a' : 'none',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#161622'}
                onMouseLeave={e => e.currentTarget.style.background = n.read ? 'transparent' : 'rgba(124,110,247,0.04)'}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-base"
                  style={{ background: `${n.color}15` }}>
                  {typeIcons[n.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold" style={{ color: n.color }}>{n.title}</p>
                    {!n.read && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ background: n.color }} />
                    )}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: '#6b6b8a' }}>{n.message}</p>
                </div>
                {mobile && (
                  <ChevronDown size={14} style={{ color: '#3a3a5c', transform: 'rotate(-90deg)', marginTop: '2px' }} />
                )}
              </motion.button>
            ))}
          </AnimatePresence>
        )}
      </div>
    </>
  )
}
