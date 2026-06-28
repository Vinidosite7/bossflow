'use client'

import { SidebarDesktop, SidebarMobile, SidebarProvider, useSidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { OnboardingModal } from '@/components/onboarding/OnboardingModal'
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { T, BossFlowFonts, GrainFilter, PageBackground } from '@/components/ui/bossflow-ui'
import * as Tooltip from '@radix-ui/react-tooltip'

// ─── Inner layout (tem acesso ao SidebarContext) ─────────────
function DashboardInner({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const { collapsed } = useSidebar()

  const checkAuth = useCallback(async () => {
    try {
      const supabase = createClient()
      await supabase.auth.refreshSession()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }
      const { data: profile } = await supabase.from('profiles').select('onboarding_done').eq('id', user.id).single()
      if (!profile || !profile.onboarding_done) setShowOnboarding(true)
      setAuthChecked(true)
    } catch { router.replace('/login') }
  }, [router])

  useEffect(() => {
    checkAuth()
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || (!session && event !== 'INITIAL_SESSION')) router.replace('/login')
    })
    return () => subscription.unsubscribe()
  }, [checkAuth])

  function handleOnboardingComplete() { setShowOnboarding(false); router.refresh() }

  if (!authChecked) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: T.base }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: `${T.emerald}25`, borderTopColor: T.emerald }} />
          <p style={{ fontSize: 12, color: T.textMuted, fontFamily: 'DM Sans, sans-serif' }}>Carregando...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: T.base }}>

      {/* ── Sidebar desktop ────────────────────────────────── */}
      <div className="hidden md:flex shrink-0">
        <SidebarDesktop />
      </div>

      {/* ── Mobile drawer ──────────────────────────────────── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 md:hidden"
              style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }}
              transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
              className="fixed left-0 top-0 bottom-0 z-50 md:hidden"
              style={{ boxShadow: '8px 0 40px rgba(0,0,0,0.5)' }}>
              <SidebarMobile onClose={() => setMobileMenuOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Conteúdo — ocupa TODO o espaço restante ────────── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header onMenuClick={() => setMobileMenuOpen(true)} />

        {/*
          O main usa flex-1 e overflow-y-auto.
          O conteúdo dentro usa max-w centralizado.
          Quando a sidebar anima de 56px→224px o flex-1
          se ajusta automaticamente junto com a animação.
        */}
        <main
          className="flex-1 overflow-y-auto"
          style={{ background: T.base, padding: '24px' }}>
          <div style={{
            maxWidth: 1200,
            margin: '0 auto',
            width: '100%',
          }}>
            {children}
          </div>
        </main>
      </div>

      {/* ── Onboarding ────────────────────────────────────── */}
      <AnimatePresence>
        {showOnboarding && <OnboardingModal onComplete={handleOnboardingComplete} />}
      </AnimatePresence>
    </div>
  )
}

// ─── Layout wrapper com providers ─────────────────────────────
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <Tooltip.Provider>
        <BossFlowFonts />
        <GrainFilter />
        <PageBackground />
        <DashboardInner>{children}</DashboardInner>
      </Tooltip.Provider>
    </SidebarProvider>
  )
}
