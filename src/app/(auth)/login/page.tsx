'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [focused, setFocused] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError('Email ou senha incorretos.'); setLoading(false); return }
    router.push('/dashboard')
  }

  async function handleGoogle() {
    setGoogleLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` }
    })
  }

  function inputStyle(field: string): React.CSSProperties {
    const active = focused === field
    return {
      width: '100%', padding: '13px 16px', borderRadius: 12, fontSize: 14,
      outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s',
      background: 'transparent',
      border: `1px solid ${active ? 'rgba(124,110,247,0.6)' : 'rgba(255,255,255,0.1)'}`,
      color: '#e8e8f0',
      boxShadow: active ? '0 0 0 3px rgba(124,110,247,0.1)' : 'none',
    }
  }

  return (
    <>
      {/* Fix autofill branco do Chrome */}
      <style>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 1000px #0d0d1a inset !important;
          -webkit-text-fill-color: #e8e8f0 !important;
          caret-color: #e8e8f0 !important;
          border-color: rgba(255,255,255,0.1) !important;
        }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>

        {/* Logo mobile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }} className="lg:hidden">
          <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(135deg, #7c6ef7, #9d8fff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="white" />
            </svg>
          </div>
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: '#e8e8f0', fontSize: 16 }}>BossFlow</span>
        </div>

        {/* Heading */}
        <div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 700,
            letterSpacing: '-0.02em', color: '#e8e8f0', marginBottom: 6 }}>
            Bem-vindo de volta
          </h1>
          <p style={{ fontSize: 14, color: '#4a4a6a' }}>Entre com sua conta para acessar o painel.</p>
        </div>

        {/* Google */}
        <button type="button" onClick={handleGoogle} disabled={googleLoading}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            width: '100%', padding: '12px 16px', borderRadius: 12, cursor: 'pointer',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            color: '#8a8aaa', fontSize: 14, fontWeight: 500, transition: 'all 0.15s' }}
          onMouseEnter={e => { const b = e.currentTarget; b.style.background = 'rgba(255,255,255,0.09)'; b.style.color = '#d0d0e8' }}
          onMouseLeave={e => { const b = e.currentTarget; b.style.background = 'rgba(255,255,255,0.05)'; b.style.color = '#8a8aaa' }}>
          {googleLoading ? <Loader2 size={15} className="animate-spin" /> : (
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          )}
          Continuar com Google
        </button>

        {/* Divisor */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
          <span style={{ fontSize: 12, color: '#2a2a3e', whiteSpace: 'nowrap' }}>ou continue com e-mail</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <label style={{ fontSize: 13, color: '#5a5a7a', fontWeight: 500 }}>E-mail</label>
            <input type="email" placeholder="seu@email.com" value={email}
              onChange={e => setEmail(e.target.value)} required
              style={inputStyle('email')}
              onFocus={() => setFocused('email')}
              onBlur={() => setFocused('')}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ fontSize: 13, color: '#5a5a7a', fontWeight: 500 }}>Senha</label>
              <Link href="/forgot-password"
                style={{ fontSize: 12, color: '#4a4a6a', textDecoration: 'none' }}
                onMouseEnter={e => e.currentTarget.style.color = '#7c6ef7'}
                onMouseLeave={e => e.currentTarget.style.color = '#4a4a6a'}>
                Esqueceu a senha?
              </Link>
            </div>
            <div style={{ position: 'relative' }}>
              <input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password}
                onChange={e => setPassword(e.target.value)} required
                style={{ ...inputStyle('password'), paddingRight: 44 }}
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused('')}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#3a3a5c',
                  padding: 0, display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = '#7c6ef7'}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = '#3a3a5c'}>
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 14px', borderRadius: 10, fontSize: 13,
              background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)', color: '#f87171' }}>
              ⚠ {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              width: '100%', padding: '13px 16px', borderRadius: 12, marginTop: 4,
              background: loading ? 'rgba(124,110,247,0.25)' : 'linear-gradient(135deg, #7c6ef7, #9d8fff)',
              color: 'white', fontWeight: 600, fontSize: 14, border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 4px 28px rgba(124,110,247,0.35)',
              transition: 'all 0.15s' }}>
            {loading ? <Loader2 size={15} className="animate-spin" /> : <>Entrar <ArrowRight size={15} /></>}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 13, color: '#3a3a5c' }}>
          Não tem uma conta?{' '}
          <Link href="/register"
            style={{ color: '#7c6ef7', fontWeight: 600, textDecoration: 'none' }}
            onMouseEnter={e => e.currentTarget.style.color = '#9d8fff'}
            onMouseLeave={e => e.currentTarget.style.color = '#7c6ef7'}>
            Criar grátis
          </Link>
        </p>

      </div>
    </>
  )
}
