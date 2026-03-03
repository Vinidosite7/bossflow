'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react'
import Image from "next/image"

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Email ou senha incorretos.')
      setLoading(false)
      return
    }
    router.push('/dashboard')
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` }
    })
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Logo */}
      <div className="mb-10">
        <div className="relative w-40 h-9">
          <Image src="/bossflow.png" alt="BossFlow" fill className="object-contain object-left" priority />
        </div>
      </div>

      {/* Heading */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 leading-tight"
          style={{ fontFamily: 'Syne, sans-serif', color: '#e8e8f0', letterSpacing: '-0.02em' }}>
          Bem-vindo de volta
        </h1>
        <p className="text-sm" style={{ color: '#4a4a6a' }}>
          Acesse o painel e acompanhe sua operação.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#4a4a6a' }}>E-mail</label>
          <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all"
            style={{
              background: '#111118',
              border: `1px solid ${focusedField === 'email' ? 'rgba(124,110,247,0.5)' : '#1e1e2e'}`,
              boxShadow: focusedField === 'email' ? '0 0 0 3px rgba(124,110,247,0.08)' : 'none',
            }}>
            <Mail size={15} style={{ color: focusedField === 'email' ? '#7c6ef7' : '#3a3a5c', flexShrink: 0 }} />
            <input type="email" placeholder="seu@email.com" value={email}
              onChange={e => setEmail(e.target.value)}
              onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField(null)}
              required className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#2a2a3e]"
              style={{ color: '#e8e8f0' }} />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#4a4a6a' }}>Senha</label>
            <Link href="/forgot-password" className="text-xs transition-colors" style={{ color: '#4a4a6a' }}
              onMouseEnter={e => e.currentTarget.style.color = '#7c6ef7'}
              onMouseLeave={e => e.currentTarget.style.color = '#4a4a6a'}>
              Esqueceu a senha?
            </Link>
          </div>
          <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all"
            style={{
              background: '#111118',
              border: `1px solid ${focusedField === 'password' ? 'rgba(124,110,247,0.5)' : '#1e1e2e'}`,
              boxShadow: focusedField === 'password' ? '0 0 0 3px rgba(124,110,247,0.08)' : 'none',
            }}>
            <Lock size={15} style={{ color: focusedField === 'password' ? '#7c6ef7' : '#3a3a5c', flexShrink: 0 }} />
            <input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password}
              onChange={e => setPassword(e.target.value)}
              onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField(null)}
              required className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#2a2a3e]"
              style={{ color: '#e8e8f0' }} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ color: '#3a3a5c' }}
              onMouseEnter={e => e.currentTarget.style.color = '#7c6ef7'}
              onMouseLeave={e => e.currentTarget.style.color = '#3a3a5c'}>
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-2xl text-sm"
            style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171' }}>
            <span>⚠</span> {error}
          </div>
        )}

        <button type="submit" disabled={loading}
          className="flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm transition-all mt-1"
          style={{
            background: loading ? '#1e1e2e' : 'linear-gradient(135deg, #7c6ef7 0%, #9d8fff 100%)',
            color: loading ? '#4a4a6a' : 'white',
            boxShadow: loading ? 'none' : '0 0 32px rgba(124,110,247,0.35)',
          }}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : <><ArrowRight size={16} /> Entrar na conta</>}
        </button>

        <div className="flex items-center gap-3 my-1">
          <div className="flex-1 h-px" style={{ background: '#1e1e2e' }} />
          <span className="text-xs" style={{ color: '#2a2a3e' }}>ou</span>
          <div className="flex-1 h-px" style={{ background: '#1e1e2e' }} />
        </div>

        <button type="button" onClick={handleGoogle}
          className="flex items-center justify-center gap-3 py-3.5 rounded-2xl text-sm font-medium transition-all"
          style={{ background: '#111118', border: '1px solid #1e1e2e', color: '#8a8aaa' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#2a2a3e'; e.currentTarget.style.color = '#d0d0e0' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e1e2e'; e.currentTarget.style.color = '#8a8aaa' }}>
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continuar com Google
        </button>
      </form>

      <p className="text-center text-sm mt-8" style={{ color: '#3a3a5c' }}>
        Não tem conta?{' '}
        <Link href="/register" className="font-semibold transition-colors" style={{ color: '#7c6ef7' }}
          onMouseEnter={e => e.currentTarget.style.color = '#9d8fff'}
          onMouseLeave={e => e.currentTarget.style.color = '#7c6ef7'}>
          Criar grátis
        </Link>
      </p>
    </div>
  )
}
