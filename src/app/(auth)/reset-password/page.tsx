'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Loader2, Eye, EyeOff, CheckCircle, ArrowLeft } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function ResetPasswordPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [loading, setLoading]   = useState(false)
  const [done, setDone]         = useState(false)
  const [ready, setReady]       = useState(false)
  const [error, setError]       = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm]   = useState(false)
  const [focused, setFocused]   = useState('')

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(event => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError('')
    if (password !== confirm) { setError('As senhas não coincidem.'); return }
    if (password.length < 6)  { setError('A senha deve ter pelo menos 6 caracteres.'); return }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })

    if (error) { setError('Erro ao redefinir senha. O link pode ter expirado.'); setLoading(false); return }
    setDone(true); setLoading(false)
    setTimeout(() => router.push('/dashboard'), 2500)
  }

  function wrap(field: string): React.CSSProperties {
    const on = focused === field
    return {
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '12px 14px', borderRadius: 12,
      background: 'rgba(255,255,255,0.025)',
      border: `1px solid ${on ? 'rgba(124,110,247,0.55)' : 'rgba(255,255,255,0.08)'}`,
      boxShadow: on ? '0 0 0 3px rgba(124,110,247,0.1), 0 0 18px rgba(124,110,247,0.07)' : 'none',
      transition: 'border-color 0.15s, box-shadow 0.15s',
    }
  }

  const base: React.CSSProperties = {
    flex: 1, background: 'transparent', border: 'none', outline: 'none',
    fontSize: 14, color: '#e8e8f0', fontFamily: 'inherit',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 11, color: '#4a4a6a', fontWeight: 600,
    textTransform: 'uppercase', letterSpacing: '0.08em',
  }

  // Strength
  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : password.length < 14 ? 3 : 4
  const strengthColors = ['', '#f87171', '#fbbf24', '#34d399', '#7c6ef7']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Logo mobile */}
      <div className="lg:hidden">
        <img src="/bossflow.png" alt="BossFlow" style={{ height: 30, objectFit: 'contain' }} />
      </div>

      <AnimatePresence mode="wait">
        {!done ? (
          <motion.div key="form"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>

            <div>
              <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 700,
                letterSpacing: '-0.02em', color: '#e8e8f0', marginBottom: 6, lineHeight: 1.15 }}>
                Nova senha
              </h1>
              <p style={{ fontSize: 14, color: '#4a4a6a', lineHeight: 1.5 }}>Escolha uma senha segura para sua conta.</p>
            </div>

            {/* Validating link badge */}
            <AnimatePresence>
              {!ready && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10,
                    fontSize: 13, background: 'rgba(124,110,247,0.07)', border: '1px solid rgba(124,110,247,0.2)',
                    color: '#9d8fff' }}>
                  <Loader2 size={13} className="animate-spin" style={{ flexShrink: 0 }} /> Validando link...
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* New password */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                <label style={labelStyle}>Nova senha</label>
                <div style={wrap('password')}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={focused==='password'?'#9d8fff':'#3a3a5c'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <input type={showPassword ? 'text' : 'password'} placeholder="Mínimo 6 caracteres" value={password}
                    onChange={e => setPassword(e.target.value)} required minLength={6} style={base}
                    onFocus={() => setFocused('password')} onBlur={() => setFocused('')} />
                  <motion.button type="button" whileTap={{ scale: 0.88 }} onClick={() => setShowPassword(v => !v)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3a3a5c', padding: 0, display: 'flex', flexShrink: 0 }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#9d8fff'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#3a3a5c'}>
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </motion.button>
                </div>
                <AnimatePresence>
                  {password.length > 0 && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {[1,2,3,4].map(i => (
                          <div key={i} style={{ flex: 1, height: 3, borderRadius: 999,
                            background: i <= strength ? strengthColors[strength] : 'rgba(255,255,255,0.06)',
                            boxShadow: i <= strength ? `0 0 6px ${strengthColors[strength]}80` : 'none',
                            transition: 'all 0.3s' }} />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Confirm password */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                <label style={labelStyle}>Confirmar senha</label>
                <div style={wrap('confirm')}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={focused==='confirm'?'#9d8fff':'#3a3a5c'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <input type={showConfirm ? 'text' : 'password'} placeholder="Repita a senha" value={confirm}
                    onChange={e => setConfirm(e.target.value)} required style={base}
                    onFocus={() => setFocused('confirm')} onBlur={() => setFocused('')} />
                  <motion.button type="button" whileTap={{ scale: 0.88 }} onClick={() => setShowConfirm(v => !v)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3a3a5c', padding: 0, display: 'flex', flexShrink: 0 }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#9d8fff'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#3a3a5c'}>
                    {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                  </motion.button>
                </div>
                {confirm.length > 0 && (
                  <p style={{ fontSize: 12, margin: 0, color: password === confirm ? '#34d399' : '#f87171' }}>
                    {password === confirm ? '✓ Senhas coincidem' : '✗ Senhas não coincidem'}
                  </p>
                )}
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

              <motion.button type="submit" disabled={loading || !ready}
                whileHover={!loading && ready ? { scale: 1.015 } : {}} whileTap={!loading && ready ? { scale: 0.975 } : {}}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  width: '100%', padding: '13px 16px', borderRadius: 12, marginTop: 4,
                  background: loading || !ready ? 'rgba(124,110,247,0.18)' : 'linear-gradient(135deg, #7c6ef7, #9d8fff)',
                  color: loading || !ready ? '#6b6b8a' : 'white', fontWeight: 700, fontSize: 14,
                  border: `1px solid ${loading || !ready ? 'transparent' : 'rgba(255,255,255,0.12)'}`,
                  cursor: loading || !ready ? 'not-allowed' : 'pointer',
                  boxShadow: loading || !ready ? 'none' : '0 0 32px rgba(124,110,247,0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
                  transition: 'all 0.2s' }}>
                {loading ? <Loader2 size={15} className="animate-spin" /> : <><ArrowRight size={15} /><span>Redefinir senha</span></>}
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
          <motion.div key="done"
            initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', paddingTop: 24, gap: 18 }}>

            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
              style={{ width: 68, height: 68, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.22)',
                boxShadow: '0 0 36px rgba(52,211,153,0.15)' }}>
              <CheckCircle size={32} style={{ color: '#34d399' }} />
            </motion.div>

            <div>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 700, color: '#e8e8f0', marginBottom: 8 }}>
                Senha redefinida!
              </h2>
              <p style={{ fontSize: 14, color: '#4a4a6a', lineHeight: 1.6 }}>Redirecionando para o painel...</p>
            </div>

            {/* Progress bar */}
            <div style={{ width: '100%', height: 2, background: 'rgba(255,255,255,0.05)', borderRadius: 999, overflow: 'hidden', marginTop: 8 }}>
              <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 2.3, ease: 'linear' }}
                style={{ height: '100%', background: 'linear-gradient(90deg, #7c6ef7, #34d399)', borderRadius: 999, boxShadow: '0 0 8px rgba(124,110,247,0.5)' }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
