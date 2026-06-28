'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { ArrowRight, Loader2, ArrowLeft, CheckCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [email, setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]     = useState(false)
  const [error, setError]   = useState('')
  const [focused, setFocused] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://app.bossflow.pro/reset-password',
    })

    if (error) { setError('Erro ao enviar email. Verifique o endereço e tente novamente.'); setLoading(false); return }
    setSent(true); setLoading(false)
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 11, color: '#4a4a6a', fontWeight: 600,
    textTransform: 'uppercase', letterSpacing: '0.08em',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Logo mobile */}
      <div className="lg:hidden">
        <img src="/bossflow.png" alt="BossFlow" style={{ height: 30, objectFit: 'contain' }} />
      </div>

      <AnimatePresence mode="wait">
        {!sent ? (
          <motion.div key="form"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>

            <div>
              <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 700,
                letterSpacing: '-0.02em', color: '#e8e8f0', marginBottom: 6, lineHeight: 1.15 }}>
                Recuperar senha
              </h1>
              <p style={{ fontSize: 14, color: '#4a4a6a', lineHeight: 1.5 }}>
                Digite seu email e enviaremos um link para redefinir sua senha.
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                <label style={labelStyle}>E-mail</label>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '12px 14px', borderRadius: 12,
                  background: 'rgba(255,255,255,0.025)',
                  border: `1px solid ${focused ? 'rgba(124,110,247,0.55)' : 'rgba(255,255,255,0.08)'}`,
                  boxShadow: focused ? '0 0 0 3px rgba(124,110,247,0.1), 0 0 18px rgba(124,110,247,0.07)' : 'none',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={focused?'#9d8fff':'#3a3a5c'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                  </svg>
                  <input type="email" placeholder="seu@email.com" value={email}
                    onChange={e => setEmail(e.target.value)} required
                    style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 14, color: '#e8e8f0', fontFamily: 'inherit' }}
                    onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10,
                      fontSize: 13, background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.18)',
                      color: '#f87171', boxShadow: '0 0 14px rgba(248,113,113,0.08)' }}>
                    ⚠ {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button type="submit" disabled={loading}
                whileHover={!loading ? { scale: 1.015 } : {}} whileTap={!loading ? { scale: 0.975 } : {}}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  width: '100%', padding: '13px 16px', borderRadius: 12, marginTop: 2,
                  background: loading ? 'rgba(124,110,247,0.18)' : 'linear-gradient(135deg, #7c6ef7, #9d8fff)',
                  color: loading ? '#6b6b8a' : 'white', fontWeight: 700, fontSize: 14,
                  border: `1px solid ${loading ? 'transparent' : 'rgba(255,255,255,0.12)'}`,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: loading ? 'none' : '0 0 32px rgba(124,110,247,0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
                  transition: 'all 0.2s' }}>
                {loading ? <Loader2 size={15} className="animate-spin" /> : <><ArrowRight size={15} /><span>Enviar link de recuperação</span></>}
              </motion.button>
            </form>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Link href="/login"
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#4a4a6a', textDecoration: 'none' }}
                onMouseEnter={e => e.currentTarget.style.color = '#9d8fff'}
                onMouseLeave={e => e.currentTarget.style.color = '#4a4a6a'}>
                <ArrowLeft size={13} /> Voltar pro login
              </Link>
            </div>
          </motion.div>
        ) : (
          <motion.div key="success"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', paddingTop: 16, gap: 16 }}>

            <div style={{ width: 64, height: 64, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)',
              boxShadow: '0 0 32px rgba(52,211,153,0.12)' }}>
              <CheckCircle size={30} style={{ color: '#34d399' }} />
            </div>

            <div>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 700, color: '#e8e8f0', marginBottom: 8 }}>
                Email enviado!
              </h2>
              <p style={{ fontSize: 14, color: '#4a4a6a', lineHeight: 1.6 }}>
                Enviamos um link para{' '}
                <span style={{ color: '#9d8fff', fontWeight: 500 }}>{email}</span>
              </p>
              <p style={{ fontSize: 12, color: '#2a2a3e', marginTop: 6 }}>Verifique sua caixa de entrada e spam.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginTop: 8 }}>
              <motion.button onClick={() => setSent(false)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                style={{ fontSize: 13, color: '#4a4a6a', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#9d8fff'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#4a4a6a'}>
                Tentar outro email
              </motion.button>
              <Link href="/login"
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#4a4a6a', textDecoration: 'none' }}
                onMouseEnter={e => e.currentTarget.style.color = '#9d8fff'}
                onMouseLeave={e => e.currentTarget.style.color = '#4a4a6a'}>
                <ArrowLeft size={13} /> Voltar pro login
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
