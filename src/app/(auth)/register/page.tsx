'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, User, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react'
import Image from "next/image"

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } }
    })
    if (error) {
      setError('Erro ao criar conta. Tente novamente.')
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

  const inputStyle = (field: string) => ({
    background: '#111118',
    border: `1px solid ${focusedField === field ? 'rgba(124,110,247,0.5)' : '#1e1e2e'}`,
    boxShadow: focusedField === field ? '0 0 0 3px rgba(124,110,247,0.08)' : 'none',
  })

  const iconColor = (field: string) => ({
    color: focusedField === field ? '#7c6ef7' : '#3a3a5c',
    flexShrink: 0 as const,
  })

  return (
    <div className="flex flex-col min-h-screen px-8 sm:px-12 py-10">
      {/* Logo — fixo no topo */}
      <div className="mb-auto pb-8">
        <div className="relative w-44 h-10">
          <Image src="/bossflow.png" alt="BossFlow" fill className="object-contain object-left" priority />
        </div>
      </div>

      {/* Form — centralizado */}
      <div className="flex flex-col justify-center flex-1 max-w-sm w-full mx-auto">
        <div className="mb-7">
          <h1 className="text-3xl font-bold mb-2 leading-tight"
            style={{ fontFamily: 'Syne, sans-serif', color: '#e8e8f0', letterSpacing: '-0.02em' }}>
            Criar conta grátis
          </h1>
          <p className="text-sm" style={{ color: '#4a4a6a' }}>
            Comece a gerenciar sua empresa hoje mesmo.
          </p>
        </div>

        <form onSubmit={handleRegister} className="flex flex-col gap-3.5">
          {/* Nome */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#4a4a6a' }}>
              Nome completo
            </label>
            <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all" style={inputStyle('name')}>
              <User size={15} style={iconColor('name')} />
              <input
                type="text"
                placeholder="Seu nome"
                value={name}
                onChange={e => setName(e.target.value)}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
                required
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#2a2a3e]"
                style={{ color: '#e8e8f0' }}
              />
            </div>
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#4a4a6a' }}>
              E-mail
            </label>
            <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all" style={inputStyle('email')}>
              <Mail size={15} style={iconColor('email')} />
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                required
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#2a2a3e]"
                style={{ color: '#e8e8f0' }}
              />
            </div>
          </div>

          {/* Senha */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#4a4a6a' }}>
              Senha
            </label>
            <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all" style={inputStyle('password')}>
              <Lock size={15} style={iconColor('password')} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                required
                minLength={6}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#2a2a3e]"
                style={{ color: '#e8e8f0' }}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ color: '#3a3a5c' }}
                onMouseEnter={e => e.currentTarget.style.color = '#7c6ef7'}
                onMouseLeave={e => e.currentTarget.style.color = '#3a3a5c'}>
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* Strength indicator */}
          {password.length > 0 && (
            <div className="flex gap-1">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex-1 h-1 rounded-full transition-all"
                  style={{
                    background: password.length >= (i + 1) * 3
                      ? i < 1 ? '#f87171' : i < 2 ? '#fbbf24' : i < 3 ? '#34d399' : '#7c6ef7'
                      : '#1e1e2e'
                  }} />
              ))}
            </div>
          )}

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
              letterSpacing: '0.02em',
            }}>
            {loading
              ? <Loader2 size={16} className="animate-spin" />
              : <><ArrowRight size={16} /> Criar minha conta</>}
          </button>

          <div className="flex items-center gap-3 my-0.5">
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

          <p className="text-xs text-center mt-1" style={{ color: '#2a2a3e' }}>
            Ao criar uma conta, você concorda com os{' '}
            <span style={{ color: '#4a4a6a' }}>Termos de Uso</span>
          </p>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: '#3a3a5c' }}>
          Já tem conta?{' '}
          <Link href="/login" className="font-semibold transition-colors" style={{ color: '#7c6ef7' }}
            onMouseEnter={e => e.currentTarget.style.color = '#9d8fff'}
            onMouseLeave={e => e.currentTarget.style.color = '#7c6ef7'}>
            Entrar
          </Link>
        </p>
      </div>

      {/* Spacer bottom */}
      <div className="mt-auto pt-8" />
    </div>
  )
}
