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
    // Já está instalado como PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Detecta iOS
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
    setIsIOS(ios)

    // Android/Chrome — captura o prompt nativo
    const handler = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  // Já instalado — não mostra nada
  if (isInstalled) return null

  async function handleInstall() {
    if (isIOS) {
      setShowIOSGuide(true)
      return
    }
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') setDeferredPrompt(null)
    }
  }

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleInstall}
        className="fixed bottom-20 right-4 z-50 flex items-center gap-2 px-3 py-2.5 rounded-2xl text-xs font-bold shadow-lg md:bottom-6"
        style={{
          background: 'rgba(124,110,247,0.15)',
          border: '1px solid rgba(124,110,247,0.3)',
          color: '#9d8fff',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(124,110,247,0.1)',
        }}>
        <Download size={14} />
        Instalar app
      </motion.button>

      {/* Modal iOS */}
      <AnimatePresence>
        {showIOSGuide && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={() => setShowIOSGuide(false)}>
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: '#111118',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 24,
                padding: 24,
                width: '100%',
                maxWidth: 400,
              }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#e8e8f0' }}>
                  Instalar BossFlow
                </p>
                <button onClick={() => setShowIOSGuide(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4a4a6a', padding: 4 }}>
                  <X size={18} />
                </button>
              </div>

              {/* Steps */}
              {[
                {
                  icon: <Share size={18} color="#9d8fff" />,
                  text: <>Toca no ícone de <strong style={{ color: '#e8e8f0' }}>compartilhar</strong> (quadrado com seta ↑) no Safari</>,
                },
                {
                  icon: <span style={{ fontSize: 18 }}>➕</span>,
                  text: <>Rola e toca em <strong style={{ color: '#e8e8f0' }}>"Adicionar à Tela de Início"</strong></>,
                },
                {
                  icon: <span style={{ fontSize: 18 }}>✅</span>,
                  text: <>Toca em <strong style={{ color: '#e8e8f0' }}>"Adicionar"</strong> no canto superior direito</>,
                },
              ].map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 16 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: 'rgba(124,110,247,0.1)', border: '1px solid rgba(124,110,247,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {step.icon}
                  </div>
                  <p style={{ fontSize: 14, color: '#6b6b8a', lineHeight: 1.5, paddingTop: 6 }}>
                    {step.text}
                  </p>
                </div>
              ))}

              <p style={{ fontSize: 12, color: '#3a3a5c', textAlign: 'center', marginTop: 8 }}>
                Funciona apenas no Safari do iPhone
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
