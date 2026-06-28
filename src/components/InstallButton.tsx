'use client'

import { useEffect, useState } from 'react'
import { Download, X, Share } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showIOSGuide, setShowIOSGuide] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) { setIsInstalled(true); return }
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
    setIsIOS(ios)
    const handler = (e: any) => { e.preventDefault(); setDeferredPrompt(e) }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (isInstalled) return null

  async function handleInstall() {
    if (isIOS) { setShowIOSGuide(true); return }
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') setDeferredPrompt(null)
    }
  }

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
        onClick={handleInstall}
        className="fixed bottom-20 right-4 z-50 flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-bold shadow-lg md:bottom-6"
        style={{
          background: 'rgba(10,10,18,0.92)',
          border: '1px solid rgba(124,110,247,0.25)',
          color: '#9d8fff',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(124,110,247,0.08)',
        }}
      >
        <Download size={13} />
        Instalar app
      </motion.button>

      {/* Modal iOS */}
      <AnimatePresence>
        {showIOSGuide && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
            onClick={() => setShowIOSGuide(false)}
          >
            <motion.div
              initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }} transition={{ type: 'spring', damping: 26, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: 'rgba(8,8,14,0.97)',
                border: '1px solid rgba(124,110,247,0.2)',
                borderRadius: 24, padding: 24,
                width: '100%', maxWidth: 400,
                backdropFilter: 'blur(20px)',
                boxShadow: '0 -8px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(124,110,247,0.08)',
              }}
            >
              {/* Handle */}
              <div style={{
                width: 36, height: 4, borderRadius: 99, margin: '-8px auto 20px',
                background: 'rgba(124,110,247,0.3)',
              }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 17, fontWeight: 700, color: '#dcdcf0' }}>
                  Instalar BossFlow
                </p>
                <button onClick={() => setShowIOSGuide(false)}
                  style={{
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 8, cursor: 'pointer', color: '#4a4a6a', padding: '4px 6px',
                    display: 'flex', alignItems: 'center',
                  }}>
                  <X size={16} />
                </button>
              </div>

              {[
                {
                  icon: <Share size={16} color="#9d8fff" />,
                  text: <>Toca no ícone de <strong style={{ color: '#dcdcf0' }}>compartilhar</strong> (quadrado com seta ↑) no Safari</>,
                },
                {
                  icon: <span style={{ fontSize: 16 }}>➕</span>,
                  text: <>Rola e toca em <strong style={{ color: '#dcdcf0' }}>"Adicionar à Tela de Início"</strong></>,
                },
                {
                  icon: <span style={{ fontSize: 16 }}>✅</span>,
                  text: <>Toca em <strong style={{ color: '#dcdcf0' }}>"Adicionar"</strong> no canto superior direito</>,
                },
              ].map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 16 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: 'rgba(124,110,247,0.08)',
                    border: '1px solid rgba(124,110,247,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {step.icon}
                  </div>
                  <p style={{ fontSize: 13.5, color: '#6b6b8a', lineHeight: 1.55, paddingTop: 6 }}>
                    {step.text}
                  </p>
                </div>
              ))}

              <p style={{ fontSize: 11, color: '#3a3a5c', textAlign: 'center', marginTop: 8 }}>
                Funciona apenas no Safari do iPhone
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
