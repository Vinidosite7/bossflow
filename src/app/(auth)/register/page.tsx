'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function RegisterPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [name, setName]                 = useState('')
  const [email, setEmail]               = useState('')
  const [password, setPassword]         = useState('')
  const [loading, setLoading]           = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError]               = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [focused, setFocused]           = useState('')

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')

    const { data, error } = await supabase.auth.signUp({
      email, password, options: { data: { full_name: name } }
    })

    if (error) { setError('Erro ao criar conta. Tente novamente.'); setLoading(false); return }

    if (data.session) {
      router.push('/dashboard')
    } else {
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })
      if (loginError) { setError('Conta criada! Faça login para continuar.'); setLoading(false); router.push('/login'); return }
      router.push('/dashboard')
    }

    // Welcome email (non-blocking)
    fetch('/api/auth/welcome', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email }),
    })
  }

  async function handleGoogle() {
    setGoogleLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    })
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

  // Password strength
  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : password.length < 14 ? 3 : 4
  const strengthColors = ['', '#f87171', '#fbbf24', '#34d399', '#7c6ef7']
  const strengthLabels = ['', 'Fraca', 'Regular', 'Boa', 'Forte']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Logo mobile */}
      <div className="lg:hidden">
        <img src="/bossflow.png" alt="BossFlow" style={{ height: 30, objectFit: 'contain' }} />
      </div>

      {/* Heading */}
      <div>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 700,
          letterSpacing: '-0.02em', color: '#e8e8f0', marginBottom: 6, lineHeight: 1.15 }}>
          Criar conta grátis
        </h1>
        <p style={{ fontSize: 14, color: '#4a4a6a', lineHeight: 1.5 }}>Comece a gerenciar sua empresa hoje mesmo.</p>
      </div>

      {/* Google */}
      <motion.button type="button" onClick={handleGoogle} disabled={googleLoading}
        whileHover={{ scale: 1.012 }} whileTap={{ scale: 0.98 }}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          width: '100%', padding: '12px 16px', borderRadius: 12,
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
          color: '#8a8aaa', fontSize: 14, fontWeight: 500, cursor: 'pointer',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)', transition: 'all 0.15s' }}>
        {googleLoading ? <Loader2 size={15} className="animate-spin" /> : (
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
        )}
        Continuar com Google
      </motion.button>

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
        <span style={{ fontSize: 12, color: '#2a2a3e', whiteSpace: 'nowrap' }}>ou cadastre com e-mail</span>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
      </div>

      {/* Form */}
      <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>

        {/* Name */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <label style={labelStyle}>Nome completo</label>
          <div style={wrap('name')}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={focused==='name'?'#9d8fff':'#3a3a5c'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
            <input type="text" placeholder="Seu nome" value={name}
              onChange={e => setName(e.target.value)} required style={base}
              onFocus={() => setFocused('name')} onBlur={() => setFocused('')} />
          </div>
        </div>

        {/* Email */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <label style={labelStyle}>E-mail</label>
          <div style={wrap('email')}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={focused==='email'?'#9d8fff':'#3a3a5c'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            </svg>
            <input type="email" placeholder="seu@email.com" value={email}
              onChange={e => setEmail(e.target.value)} required style={base}
              onFocus={() => setFocused('email')} onBlur={() => setFocused('')} />
          </div>
        </div>

        {/* Password */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <label style={labelStyle}>Senha</label>
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

          {/* Password strength */}
          <AnimatePresence>
            {password.length > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 5 }}>
                  {[1,2,3,4].map(i => (
                    <div key={i} style={{ flex: 1, height: 3, borderRadius: 999,
                      background: i <= strength ? strengthColors[strength] : 'rgba(255,255,255,0.06)',
                      boxShadow: i <= strength ? `0 0 6px ${strengthColors[strength]}80` : 'none',
                      transition: 'background 0.3s, box-shadow 0.3s' }} />
                  ))}
                </div>
                <p style={{ fontSize: 11, color: strengthColors[strength], margin: 0, transition: 'color 0.3s' }}>
                  {strengthLabels[strength]}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
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
            width: '100%', padding: '13px 16px', borderRadius: 12, marginTop: 6,
            background: loading ? 'rgba(124,110,247,0.18)' : 'linear-gradient(135deg, #7c6ef7, #9d8fff)',
            color: loading ? '#6b6b8a' : 'white', fontWeight: 700, fontSize: 14,
            border: `1px solid ${loading ? 'transparent' : 'rgba(255,255,255,0.12)'}`,
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: loading ? 'none' : '0 0 32px rgba(124,110,247,0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
            transition: 'all 0.2s' }}>
          {loading ? <Loader2 size={15} className="animate-spin" /> : <><span>Criar minha conta</span><ArrowRight size={15} /></>}
        </motion.button>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#2a2a3e', margin: 0 }}>
          Ao criar, você concorda com os{' '}
          <Link href="/terms" style={{ color: '#4a4a6a', textDecoration: 'none' }}
            onMouseEnter={e => e.currentTarget.style.color = '#7c6ef7'}
            onMouseLeave={e => e.currentTarget.style.color = '#4a4a6a'}>
            Termos de Uso
          </Link>
        </p>
      </form>

      <p style={{ textAlign: 'center', fontSize: 13, color: '#3a3a5c', margin: 0 }}>
        Já tem uma conta?{' '}
        <Link href="/login"
          style={{ color: '#7c6ef7', fontWeight: 600, textDecoration: 'none' }}
          onMouseEnter={e => e.currentTarget.style.color = '#b8a8ff'}
          onMouseLeave={e => e.currentTarget.style.color = '#7c6ef7'}>
          Entrar
        </Link>
      </p>
    </div>
  )
}
