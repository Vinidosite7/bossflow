'use client'

import {
  Bell, ChevronDown, Building2, Check, LogOut,
  Settings, User, Camera, Menu, CheckCheck, X, ChevronRight,
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { useNotifications } from '@/hooks/useNotifications'
import { motion, AnimatePresence } from 'framer-motion'
import {
  SpotlightCard,
  ShimmerButton,
  GlowingEffect,
  LiveDot,
} from '@/components/ui/bossflow-ui'

// ── Constantes ──────────────────────────────────────────────────
const typeIcons: Record<string, string> = {
  task: '📋', payment: '💸', event: '📅', sale: '🛍️', info: '📦',
}

const popAnim = {
  initial:    { opacity: 0, y: -10, scale: 0.96, filter: 'blur(4px)' },
  animate:    { opacity: 1, y: 0,   scale: 1,    filter: 'blur(0px)' },
  exit:       { opacity: 0, y: -10, scale: 0.96 },
  transition: { duration: 0.16, ease: [0.16, 1, 0.3, 1] as const },
}

// Estilo base dos botões do header — abre/fecha ativo
function btnStyle(open: boolean): React.CSSProperties {
  return {
    background:  open ? 'rgba(124,110,247,0.1)'       : 'transparent',
    border:      open ? '1px solid rgba(124,110,247,0.24)' : '1px solid transparent',
    boxShadow:   open ? '0 0 20px rgba(124,110,247,0.12)' : 'none',
    borderRadius: 9,
    cursor:      'pointer',
    transition:  'all 0.15s ease',
  }
}

// ── Componente Principal ─────────────────────────────────────────
export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const router   = useRouter()
  const supabase = createClient()
  const [user, setUser]                     = useState<any>(null)
  const [avatarUrl, setAvatarUrl]           = useState('')
  const [businesses, setBusinesses]         = useState<any[]>([])
  const [activeBiz, setActiveBiz]           = useState<any>(null)
  const [showBizMenu, setShowBizMenu]       = useState(false)
  const [showUserMenu, setShowUserMenu]     = useState(false)
  const [showNotifs, setShowNotifs]         = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [businessId, setBusinessId]         = useState<string | null>(null)
  const bizRef   = useRef<HTMLDivElement>(null)
  const userRef  = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)
  const { notifications, unreadCount, readNotification, readAll } = useNotifications(businessId)

  // Carrega dados do usuário
  useEffect(() => {
    if (typeof window === 'undefined') return
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        setUser(user)
        setAvatarUrl(user.user_metadata?.avatar_url || '')
        const { data: owned } = await supabase.from('businesses').select('*').eq('owner_id', user.id).order('created_at')
        const { data: memberships } = await supabase.from('business_members').select('business_id, role').eq('user_id', user.id).in('status', ['accepted', 'active'])
        const memberBizIds = (memberships || []).map((m: any) => m.business_id).filter((id: string) => !(owned || []).find((o: any) => o.id === id))
        let memberBizzes: any[] = []
        if (memberBizIds.length > 0) {
          const { data: bizData } = await supabase.from('businesses').select('*').in('id', memberBizIds)
          memberBizzes = (bizData || []).map((b: any) => ({ ...b, _memberRole: memberships?.find((m: any) => m.business_id === b.id)?.role }))
        }
        const bizList = [...(owned || []), ...memberBizzes]
        setBusinesses(bizList)
        const active = bizList.find(b => b.id === (localStorage.getItem('activeBizId') || '')) || bizList[0]
        setActiveBiz(active || null)
        setBusinessId(active?.id || null)
      } catch (err) { console.error(err) }
    }
    load()
  }, [])

  // Fecha dropdowns ao clicar fora
  useEffect(() => {
    function h(e: MouseEvent) {
      if (bizRef.current   && !bizRef.current.contains(e.target as Node))   setShowBizMenu(false)
      if (userRef.current  && !userRef.current.contains(e.target as Node))  setShowUserMenu(false)
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  // Bloqueia scroll quando algum overlay mobile está aberto
  useEffect(() => {
    const open = showNotifs || showBizMenu || showUserMenu
    if (typeof window !== 'undefined') document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [showNotifs, showBizMenu, showUserMenu])

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file || !user) return
    setUploadingAvatar(true)
    const path = `avatars/${user.id}.${file.name.split('.').pop()}`
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
  const isEmoji  = avatarUrl && avatarUrl.length <= 4
  const isPhoto  = avatarUrl && avatarUrl.length > 4

  // ── Sub-componentes internos ───────────────────────────────────

  function UserAvatar({ size = 'sm' }: { size?: 'sm' | 'md' | 'lg' }) {
    const dims   = { sm: 30, md: 38, lg: 56 }
    const radii  = { sm: 8,  md: 10, lg: 14 }
    const d = dims[size], r = radii[size]
    return (
      <div style={{
        width: d, height: d, borderRadius: r,
        overflow: 'hidden', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: isPhoto
          ? 'transparent'
          : isEmoji
            ? 'rgba(124,110,247,0.1)'
            : 'linear-gradient(135deg, #7c6ef7 0%, #a06ef7 100%)',
        border: `1px solid ${isPhoto ? 'rgba(255,255,255,0.08)' : 'rgba(124,110,247,0.28)'}`,
        boxShadow: isPhoto ? 'none' : '0 0 14px rgba(124,110,247,0.22)',
      }}>
        {isEmoji
          ? <span style={{ fontSize: size === 'lg' ? 28 : 16 }}>{avatarUrl}</span>
          : isPhoto
            ? <img src={avatarUrl} alt={userName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: size === 'lg' ? 20 : 11, fontWeight: 700, color: '#fff', fontFamily: 'Syne, sans-serif' }}>{initials}</span>
        }
      </div>
    )
  }

  function BizLogo({ biz }: { biz: any }) {
    return (
      <div style={{
        width: 26, height: 26, borderRadius: 7, flexShrink: 0,
        overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: biz?.logo_url ? 'transparent' : 'rgba(124,110,247,0.12)',
        border: '1px solid rgba(124,110,247,0.22)',
      }}>
        {biz?.logo_url
          ? <img src={biz.logo_url} alt={biz.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <Building2 size={12} style={{ color: '#9d8fff' }} />}
      </div>
    )
  }

  // ── MobileSheet — bottom sheet compartilhado ───────────────────
  function MobileSheet({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
    return (
      <>
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)' }}
          onClick={onClose}
        />
        <motion.div
          initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] as const }}
          className="fixed bottom-0 left-0 right-0 z-50 md:hidden rounded-t-2xl"
          style={{
            background: 'rgba(8,8,16,0.99)',
            border: '1px solid rgba(124,110,247,0.18)',
            borderBottom: 'none',
            boxShadow: '0 -12px 60px rgba(0,0,0,0.8), 0 0 40px rgba(124,110,247,0.08)',
            maxHeight: '85dvh', overflowY: 'auto',
            paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)',
          }}>
          {/* Handle bar com glow */}
          <div style={{
            width: 36, height: 4, borderRadius: 99,
            margin: '12px auto 4px',
            background: 'linear-gradient(90deg, rgba(124,110,247,0.4), rgba(160,110,247,0.6), rgba(124,110,247,0.4))',
            boxShadow: '0 0 8px rgba(124,110,247,0.4)',
          }} />
          {children}
        </motion.div>
      </>
    )
  }

  // Handlers de hover para botões sem SpotlightCard
  function onHoverIn(e: React.MouseEvent<HTMLElement>) {
    e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
    e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)'
  }
  function onHoverOut(e: React.MouseEvent<HTMLElement>, open: boolean) {
    if (!open) {
      e.currentTarget.style.background = 'transparent'
      e.currentTarget.style.border = '1px solid transparent'
    }
  }

  // ── Render ─────────────────────────────────────────────────────
  return (
    <>
      {/* ══ HEADER BAR ══════════════════════════════════════════ */}
      <header
        className="h-12 flex items-center justify-between px-3 sm:px-4 shrink-0"
        style={{
          background:    'rgba(7,7,13,0.9)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom:  '1px solid rgba(255,255,255,0.05)',
          boxShadow:     '0 1px 0 rgba(124,110,247,0.12), 0 4px 30px rgba(0,0,0,0.4)',
          position:      'relative',
          zIndex:        50,
          overflow:      'visible',
        }}>

        {/* Linha gradiente roxa no fundo do header */}
        <div aria-hidden style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 1,
          background: 'linear-gradient(90deg, transparent 0%, rgba(124,110,247,0.5) 25%, rgba(157,143,255,0.65) 50%, rgba(124,110,247,0.5) 75%, transparent 100%)',
          pointerEvents: 'none',
        }} />

        {/* ── LEFT — Hamburger + Seletor de Empresa ─────────── */}
        <div className="flex items-center gap-1.5">

          {/* Hamburguer (mobile only) */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onMenuClick}
            className="w-8 h-8 flex items-center justify-center rounded-lg md:hidden"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
              color: '#6b6b8a',
            }}>
            <Menu size={16} />
          </motion.button>

          {/* Seletor empresa */}
          <div className="relative" ref={bizRef} style={{ zIndex: 100 }}>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowBizMenu(!showBizMenu)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg"
              style={btnStyle(showBizMenu)}
              onMouseEnter={e => onHoverIn(e as any)}
              onMouseLeave={e => onHoverOut(e as any, showBizMenu)}>
              <BizLogo biz={activeBiz} />
              <span className="text-sm font-semibold hidden sm:block"
                style={{
                  color: '#dcdcf0',
                  maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  fontFamily: 'Syne, sans-serif',
                }}>
                {activeBiz?.name || 'Empresa'}
              </span>
              <motion.div animate={{ rotate: showBizMenu ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown size={11} style={{ color: '#4a4a6a' }} />
              </motion.div>
            </motion.button>

            {/* ✅ Dropdown empresa — SpotlightCard (desktop) */}
            <AnimatePresence>
              {showBizMenu && (
                <motion.div {...popAnim}
                  className="absolute left-0 top-11 z-[200] hidden md:block"
                  style={{ minWidth: 220 }}>
                  <SpotlightCard
                    className="rounded-xl p-1.5"
                    spotlightColor="rgba(124,110,247,0.1)"
                    style={{
                      background: 'rgba(9,9,17,0.98)',
                      border: '1px solid rgba(124,110,247,0.15)',
                      boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 40px rgba(124,110,247,0.06)',
                    }}>
                    <p className="text-xs font-semibold uppercase tracking-widest px-3 pt-2 pb-1.5"
                      style={{ color: '#3a3a5c', fontFamily: 'Syne, sans-serif' }}>
                      Empresas
                    </p>
                    {businesses.map(biz => (
                      <button key={biz.id} onClick={() => switchBiz(biz)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left"
                        style={{
                          background: activeBiz?.id === biz.id ? 'rgba(124,110,247,0.1)' : 'transparent',
                          transition: 'background 0.12s',
                        }}
                        onMouseEnter={e => { if (activeBiz?.id !== biz.id) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                        onMouseLeave={e => { if (activeBiz?.id !== biz.id) e.currentTarget.style.background = 'transparent' }}>
                        <BizLogo biz={biz} />
                        <span className="text-sm font-medium flex-1 truncate" style={{ color: '#d0d0e0' }}>{biz.name}</span>
                        {activeBiz?.id === biz.id && <Check size={12} style={{ color: '#7c6ef7' }} />}
                      </button>
                    ))}
                    <div className="my-1.5 mx-1" style={{ height: 1, background: 'rgba(124,110,247,0.1)' }} />
                    {/* ✅ ShimmerButton — Gerenciar Empresas */}
                    <ShimmerButton
                      onClick={() => { setShowBizMenu(false); router.push('/empresas') }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
                      style={{
                        color: '#9d8fff',
                        background: 'transparent',
                        border: 'none',
                        justifyContent: 'flex-start',
                      }}>
                      + Gerenciar empresas
                    </ShimmerButton>
                  </SpotlightCard>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── RIGHT — Bell + Divisor + Avatar ───────────────── */}
        <div className="flex items-center gap-1">

          {/* ✅ Bell — GlowingEffect quando tem notificações */}
          <div className="relative" ref={notifRef} style={{ zIndex: 100 }}>
            <GlowingEffect
              disabled={unreadCount === 0}
              color="#f87171"
              spread={22}
              blur={12}
              className="rounded-lg"
            >
              <motion.button
                whileTap={{ scale: 0.91 }}
                onClick={() => setShowNotifs(!showNotifs)}
                className="relative w-8 h-8 flex items-center justify-center rounded-lg"
                style={btnStyle(showNotifs)}
                onMouseEnter={e => onHoverIn(e as any)}
                onMouseLeave={e => onHoverOut(e as any, showNotifs)}>

                <Bell size={15} style={{
                  color: unreadCount > 0 ? '#34d399' : '#4a4a6a',
                  filter: unreadCount > 0 ? 'drop-shadow(0 0 5px rgba(52,211,153,0.55))' : 'none',
                  transition: 'all 0.2s ease',
                }} />

                {/* Badge de contagem */}
                <AnimatePresence>
                  {unreadCount > 0 && (
                    <motion.span
                      key="badge"
                      initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                      className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold"
                      style={{
                        background: '#f87171',
                        fontSize: '8px', color: '#fff',
                        boxShadow: '0 0 8px rgba(248,113,113,0.75)',
                        zIndex: 10,
                      }}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* ✅ LiveDot — substituindo o ping manual */}
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 pointer-events-none" style={{ zIndex: 9 }}>
                    <LiveDot color="#f87171" />
                  </span>
                )}
              </motion.button>
            </GlowingEffect>

            {/* ✅ Dropdown notificações — SpotlightCard (desktop) */}
            <AnimatePresence>
              {showNotifs && (
                <motion.div {...popAnim}
                  className="absolute right-0 top-11 z-[200] overflow-hidden hidden md:block"
                  style={{ width: 320 }}>
                  <SpotlightCard
                    className="rounded-xl overflow-hidden"
                    spotlightColor="rgba(52,211,153,0.07)"
                    style={{
                      background: 'rgba(9,9,17,0.98)',
                      border: '1px solid rgba(52,211,153,0.12)',
                      boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 40px rgba(52,211,153,0.05)',
                    }}>
                    <NotifContent
                      notifications={notifications}
                      unreadCount={unreadCount}
                      readNotification={readNotification}
                      readAll={readAll}
                      onClose={() => setShowNotifs(false)}
                      router={router}
                    />
                  </SpotlightCard>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Separador vertical */}
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.07)', margin: '0 2px', flexShrink: 0 }} />

          {/* Avatar / User menu */}
          <div className="relative" ref={userRef} style={{ zIndex: 100 }}>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-lg"
              style={btnStyle(showUserMenu)}
              onMouseEnter={e => onHoverIn(e as any)}
              onMouseLeave={e => onHoverOut(e as any, showUserMenu)}>
              <UserAvatar size="sm" />
              <span className="text-xs font-semibold hidden sm:block"
                style={{ color: '#dcdcf0', fontFamily: 'Syne, sans-serif', lineHeight: 1 }}>
                {userName.split(' ')[0]}
              </span>
              <ChevronDown size={10} style={{ color: '#4a4a6a' }} className="hidden sm:block" />
            </motion.button>

            {/* ✅ Dropdown user — SpotlightCard (desktop) */}
            <AnimatePresence>
              {showUserMenu && (
                <motion.div {...popAnim}
                  className="absolute right-0 top-11 w-52 z-[200] hidden md:block">
                  <SpotlightCard
                    className="rounded-xl p-1.5"
                    spotlightColor="rgba(124,110,247,0.1)"
                    style={{
                      background: 'rgba(9,9,17,0.98)',
                      border: '1px solid rgba(124,110,247,0.15)',
                      boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 40px rgba(124,110,247,0.06)',
                    }}>
                    {/* Card do usuário */}
                    <div className="flex items-center gap-2.5 px-3 py-2.5 mb-1 rounded-lg"
                      style={{ background: 'rgba(124,110,247,0.07)', border: '1px solid rgba(124,110,247,0.12)' }}>
                      <label className="relative cursor-pointer group shrink-0">
                        <UserAvatar size="md" />
                        {!isEmoji && (
                          <div className="absolute inset-0 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ background: 'rgba(0,0,0,0.6)' }}>
                            {uploadingAvatar
                              ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                              : <Camera size={13} className="text-white" />}
                          </div>
                        )}
                        <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                      </label>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: '#e0e0f0', fontFamily: 'Syne, sans-serif' }}>{userName}</p>
                        <p className="text-xs truncate" style={{ color: '#3a3a5c' }}>{user?.email}</p>
                      </div>
                    </div>

                    {/* Links */}
                    {[
                      { icon: Settings, label: 'Configurações', href: '/configuracoes' },
                      { icon: User, label: 'Perfil', href: '/configuracoes' },
                    ].map(({ icon: Icon, label, href }) => (
                      <button key={label}
                        onClick={() => { setShowUserMenu(false); router.push(href) }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm"
                        style={{ color: '#8a8aaa', transition: 'all 0.12s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#d0d0e0' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#8a8aaa' }}>
                        <Icon size={13} /> {label}
                      </button>
                    ))}

                    <div className="my-1 mx-1" style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />

                    {/* ✅ ShimmerButton no logout */}
                    <ShimmerButton
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium"
                      style={{
                        background: 'rgba(248,113,113,0.08)',
                        color: '#f87171',
                        border: '1px solid rgba(248,113,113,0.18)',
                        justifyContent: 'flex-start',
                      }}>
                      <LogOut size={13} /> Sair
                    </ShimmerButton>
                  </SpotlightCard>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* ══ MOBILE SHEETS ════════════════════════════════════════ */}

      {/* Notificações */}
      <AnimatePresence>
        {showNotifs && (
          <MobileSheet onClose={() => setShowNotifs(false)}>
            <div className="flex items-center justify-between px-5 py-3.5">
              <p className="font-bold text-base" style={{ fontFamily: 'Syne, sans-serif', color: '#e0e0f0' }}>Notificações</p>
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowNotifs(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#6b6b8a' }}>
                <X size={14} />
              </motion.button>
            </div>
            <div style={{ overflowY: 'auto', maxHeight: 'calc(85dvh - 80px)' }}>
              <NotifContent
                notifications={notifications} unreadCount={unreadCount}
                readNotification={readNotification} readAll={readAll}
                onClose={() => setShowNotifs(false)} router={router} mobile
              />
            </div>
          </MobileSheet>
        )}
      </AnimatePresence>

      {/* Empresas */}
      <AnimatePresence>
        {showBizMenu && (
          <MobileSheet onClose={() => setShowBizMenu(false)}>
            <div className="flex items-center justify-between px-5 py-3.5">
              <p className="font-bold text-base" style={{ fontFamily: 'Syne, sans-serif', color: '#e0e0f0' }}>Empresas</p>
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowBizMenu(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#6b6b8a' }}>
                <X size={14} />
              </motion.button>
            </div>
            <div className="px-3 pb-4 flex flex-col gap-2">
              {businesses.map(biz => (
                <motion.button key={biz.id} whileTap={{ scale: 0.98 }} onClick={() => switchBiz(biz)}
                  className="flex items-center gap-3 p-3.5 rounded-xl w-full text-left"
                  style={{
                    background: activeBiz?.id === biz.id ? 'rgba(124,110,247,0.1)' : 'rgba(255,255,255,0.025)',
                    border: `1px solid ${activeBiz?.id === biz.id ? 'rgba(124,110,247,0.3)' : 'rgba(255,255,255,0.07)'}`,
                  }}>
                  <BizLogo biz={biz} />
                  <span className="text-sm font-semibold flex-1 truncate" style={{ color: '#d0d0e0', fontFamily: 'Syne, sans-serif' }}>{biz.name}</span>
                  {activeBiz?.id === biz.id && <Check size={13} style={{ color: '#7c6ef7' }} />}
                </motion.button>
              ))}
              {/* ✅ ShimmerButton mobile */}
              <ShimmerButton
                onClick={() => { setShowBizMenu(false); router.push('/empresas') }}
                className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold mt-1 w-full"
                style={{
                  background: 'rgba(124,110,247,0.1)',
                  color: '#9d8fff',
                  border: '1px solid rgba(124,110,247,0.24)',
                }}>
                + Gerenciar empresas
              </ShimmerButton>
            </div>
          </MobileSheet>
        )}
      </AnimatePresence>

      {/* Usuário */}
      <AnimatePresence>
        {showUserMenu && (
          <MobileSheet onClose={() => setShowUserMenu(false)}>
            {/* Avatar hero */}
            <div className="flex flex-col items-center gap-3 px-5 py-6"
              style={{ borderBottom: '1px solid rgba(124,110,247,0.1)' }}>
              <div style={{ position: 'relative' }}>
                {/* Glow atrás do avatar */}
                <div aria-hidden style={{
                  position: 'absolute', inset: -10, borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(124,110,247,0.2) 0%, transparent 70%)',
                  filter: 'blur(12px)', zIndex: 0,
                }} />
                <label className="relative cursor-pointer group" style={{ zIndex: 1, display: 'block' }}>
                  <UserAvatar size="lg" />
                  {!isEmoji && (
                    <div className="absolute inset-0 rounded-xl flex items-center justify-center opacity-0 group-active:opacity-100 transition-opacity"
                      style={{ background: 'rgba(0,0,0,0.6)' }}>
                      <Camera size={18} className="text-white" />
                    </div>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                </label>
              </div>
              <div className="text-center">
                <p className="font-bold text-base" style={{ color: '#e0e0f0', fontFamily: 'Syne, sans-serif' }}>{userName}</p>
                <p className="text-xs mt-0.5" style={{ color: '#3a3a5c' }}>{user?.email}</p>
              </div>
            </div>

            {/* Menu items */}
            <div className="p-3 flex flex-col gap-2">
              {[
                { icon: Settings, label: 'Configurações', href: '/configuracoes' },
                { icon: User, label: 'Perfil', href: '/configuracoes' },
              ].map(({ icon: Icon, label, href }) => (
                <motion.button key={label} whileTap={{ scale: 0.98 }}
                  onClick={() => { setShowUserMenu(false); router.push(href) }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium w-full text-left"
                  style={{
                    color: '#8a8aaa',
                    background: 'rgba(255,255,255,0.025)',
                    border: '1px solid rgba(255,255,255,0.07)',
                  }}>
                  <Icon size={15} /> {label}
                  <ChevronRight size={12} className="ml-auto" style={{ color: '#3a3a5c' }} />
                </motion.button>
              ))}

              <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '4px 0' }} />

              {/* ✅ ShimmerButton logout mobile */}
              <ShimmerButton
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold w-full"
                style={{
                  background: 'rgba(248,113,113,0.09)',
                  color: '#f87171',
                  border: '1px solid rgba(248,113,113,0.2)',
                  justifyContent: 'flex-start',
                }}>
                <LogOut size={15} /> Sair da conta
              </ShimmerButton>
            </div>
          </MobileSheet>
        )}
      </AnimatePresence>
    </>
  )
}

// ── NotifContent — reutilizado em desktop e mobile ───────────────
function NotifContent({
  notifications, unreadCount, readNotification, readAll, onClose, router, mobile = false
}: any) {
  return (
    <>
      {/* Header interno */}
      <div className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: '#3a3a5c', fontFamily: 'Syne, sans-serif', letterSpacing: '0.09em' }}>
            {mobile ? 'Todas' : 'Notificações'}
          </p>
          {unreadCount > 0 && (
            <span className="text-xs px-1.5 py-0.5 rounded-md font-bold"
              style={{
                background: 'rgba(248,113,113,0.12)',
                color: '#f87171',
                border: '1px solid rgba(248,113,113,0.22)',
              }}>
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <motion.button whileTap={{ scale: 0.95 }} onClick={readAll}
            className="flex items-center gap-1 text-xs"
            style={{ color: '#4a4a6a', transition: 'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#34d399'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#4a4a6a'}>
            <CheckCheck size={11} /> Marcar todas
          </motion.button>
        )}
      </div>

      {/* Lista */}
      <div>
        {notifications.length === 0 ? (
          <div className="px-4 py-12 text-sm text-center" style={{ color: '#4a4a6a' }}>
            <motion.p initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-3xl mb-3">🎉</motion.p>
            Tudo em dia!
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {notifications.map((n: any, i: number) => (
              <motion.button key={n.id}
                initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                onClick={() => { readNotification(n.id); onClose(); router.push(n.href) }}
                className="w-full flex items-start gap-3 px-4 py-3 text-left"
                style={{
                  background: n.read ? 'transparent' : 'rgba(124,110,247,0.03)',
                  borderBottom: i < notifications.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                onMouseLeave={e => e.currentTarget.style.background = n.read ? 'transparent' : 'rgba(124,110,247,0.03)'}>
                {/* Ícone */}
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm"
                  style={{ background: `${n.color}12`, border: `1px solid ${n.color}1e` }}>
                  {typeIcons[n.type]}
                </div>
                {/* Texto */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-semibold" style={{ color: n.color }}>{n.title}</p>
                    {!n.read && (
                      <span style={{
                        width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
                        background: n.color, boxShadow: `0 0 5px ${n.color}`,
                        display: 'inline-block',
                      }} />
                    )}
                  </div>
                  <p className="text-xs mt-0.5 line-clamp-2" style={{ color: '#4a4a6a' }}>{n.message}</p>
                </div>
                {mobile && <ChevronRight size={12} style={{ color: '#3a3a5c', marginTop: 2, flexShrink: 0 }} />}
              </motion.button>
            ))}
          </AnimatePresence>
        )}
      </div>
    </>
  )
}
