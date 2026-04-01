'use client'

import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { OnboardingModal } from '@/components/onboarding/OnboardingModal'
import { ToastContainer } from '@/components/ToastContainer'
import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { BusinessProvider } from '@/lib/business-context'

const supabase = createClient()

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [mobileMenuOpen,  setMobileMenuOpen]  = useState(false)
  const [showOnboarding,  setShowOnboarding]  = useState(false)
  const [authChecked,     setAuthChecked]     = useState(false)
  const checkedRef = useRef(false)

  const handleNoUser = useCallback(() => {
    router.replace('/login')
  }, [router])

  const checkAuth = useCallback(async () => {
    if (checkedRef.current) return
    checkedRef.current = true
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) { router.replace('/login'); return }

      // Busca perfil em paralelo — não bloqueia o render do layout
      supabase
        .from('profiles').select('onboarding_done').eq('id', user.id).single()
        .then(({ data: profile }) => {
          if (!profile || !profile.onboarding_done) setShowOnboarding(true)
        })

      setAuthChecked(true)
    } catch {
      router.replace('/login')
    }
  }, [router])

  useEffect(() => {
    checkAuth()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || (!session && event !== 'INITIAL_SESSION')) {
        router.replace('/login')
      }
    })
    return () => subscription.unsubscribe()
  }, [checkAuth, router])

  function handleOnboardingComplete() {
    setShowOnboarding(false)
    router.refresh()
  }

  if (!authChecked) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: '#0a0a0f' }}>
        <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: '#7c6ef7', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return (
    <BusinessProvider onNoUser={handleNoUser}>
      <div className="flex h-screen overflow-hidden" style={{ background: '#0a0a0f' }}>
        {/* Sidebar — só desktop */}
        <div className="hidden md:flex">
          <Sidebar />
        </div>

        {/* Drawer mobile */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-[55] md:hidden"
                style={{ background: 'rgba(0,0,0,0.75)' }}
                onClick={() => setMobileMenuOpen(false)}
              />
              <motion.div
                initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
                transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="fixed left-0 top-0 bottom-0 z-[60] md:hidden"
              >
                <Sidebar onClose={() => setMobileMenuOpen(false)} />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <div style={{ position: 'sticky', top: 0, zIndex: 50 }}>
            <Header onMenuClick={() => setMobileMenuOpen(true)} />
          </div>
          <main className="flex-1 overflow-y-auto p-4 md:p-6" style={{ background: '#0a0a0f' }}>
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>

        <ToastContainer />

        <AnimatePresence>
          {showOnboarding && <OnboardingModal onComplete={handleOnboardingComplete} />}
        </AnimatePresence>
      </div>
    </BusinessProvider>
  )
}
