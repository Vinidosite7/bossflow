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

  return (
    <div className="flex flex-col gap-8">

      {/* Logo mobile */}
      <div className="flex items-center gap-2 lg:hidden">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #7c6ef7, #9d8fff)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="white" />
          </svg>
        </div>
        <span className="font-bold text-base" style={{ color: '#e8e8f0', fontFamily: 'Syne, sans-serif' }}>BossFlow</span>
      </div>

      {/* Heading */}
      <div>
        <h1 className="text-3xl font-bold mb-2"
          style={{ fontFamily: 'Syne, sans-serif', color: '#e8e8f0', letterSpacing: '-0.02em' }}>
          Bem-vindo de volta
        </h1>
        <p className="text-sm" style={{ color: '#4a4a6a' }}>
          Entre com seu e-mail e senha para acessar.
        </p>
      </div>

      {/* Google */}
      <button type="button" onClick={handleGoogle} disabled={googleLoading}
        className="flex items-center justify-center gap-3 w-full py-3.5 rounded-xl text-sm font-medium transition-all"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#a0a0c0' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#e8e8f0' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#a0a0c0' }}>
        {googleLoading ? <Loader2 size={15} className="animate-spin" /> : (
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
        )}
        Continuar com Google
      </button>

      {/* Divisor */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <span className="text-xs" style={{ color: '#2a2a3e' }}>ou entre com e-mail</span>
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
      </div>

      {/* Form */}
      <form onSubmit={handleLogin} className="flex flex-col gap-4">

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium" style={{ color: '#6b6b8a' }}>E-mail</label>
          <input type="email" placeholder="seu@email.com" value={email}
            onChange={e => setEmail(e.target.value)} required
            className="w-full px-4 py-3.5 rounded-xl text-sm outline-none transition-all"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#e8e8f0' }}
            onFocus={e => { e.currentTarget.style.borderColor = 'rgba(124,110,247,0.5)'; e.currentTarget.style.background = 'rgba(124,110,247,0.04)' }}
            onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium" style={{ color: '#6b6b8a' }}>Senha</label>
            <Link href="/forgot-password" className="text-xs transition-colors" style={{ color: '#4a4a6a' }}
              onMouseEnter={e => e.currentTarget.style.color = '#7c6ef7'}
              onMouseLeave={e => e.currentTarget.style.color = '#4a4a6a'}>
              Esqueceu a senha?
            </Link>
          </div>
          <div className="relative">
            <input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password}
              onChange={e => setPassword(e.target.value)} required
              className="w-full px-4 py-3.5 pr-11 rounded-xl text-sm outline-none transition-all"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#e8e8f0' }}
              onFocus={e => { e.currentTarget.style.borderColor = 'rgba(124,110,247,0.5)'; e.currentTarget.style.background = 'rgba(124,110,247,0.04)' }}
              onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
              style={{ color: '#3a3a5c' }}
              onMouseEnter={e => e.currentTarget.style.color = '#7c6ef7'}
              onMouseLeave={e => e.currentTarget.style.color = '#3a3a5c'}>
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
            style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)', color: '#f87171' }}>
            ⚠ {error}
          </div>
        )}

        <button type="submit" disabled={loading}
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-semibold text-sm transition-all mt-1"
          style={{
            background: loading ? 'rgba(124,110,247,0.3)' : 'linear-gradient(135deg, #7c6ef7, #9d8fff)',
            color: 'white',
            boxShadow: loading ? 'none' : '0 0 24px rgba(124,110,247,0.3)',
          }}>
          {loading ? <Loader2 size={15} className="animate-spin" /> : <>Entrar <ArrowRight size={15} /></>}
        </button>
      </form>

      <p className="text-center text-sm" style={{ color: '#3a3a5c' }}>
        Não tem uma conta?{' '}
        <Link href="/register" className="font-semibold transition-colors" style={{ color: '#7c6ef7' }}
          onMouseEnter={e => e.currentTarget.style.color = '#9d8fff'}
          onMouseLeave={e => e.currentTarget.style.color = '#7c6ef7'}>
          Criar grátis
        </Link>
      </p>
    </div>
  )
}
