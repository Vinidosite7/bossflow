'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Loader2, Eye, EyeOff, Mail, CheckCircle } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [focused, setFocused] = useState('')
  const [emailSent, setEmailSent] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name } }
    })

    if (error) {
      setError('Erro ao criar conta. Tente novamente.')
      setLoading(false)
      return
    }

    // Dispara email de boas-vindas
    fetch(`${window.location.origin}/api/auth/welcome`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email }),
    })

    if (data.session) {
      router.push('/dashboard')
    } else {
      // Email confirmation required
      setEmailSent(true)
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
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

  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : password.length < 14 ? 3 : 4
  const strengthColor = ['#1e1e2e', '#f87171', '#fbbf24', '#34d399', '#7c6ef7'][strength]
  const strengthLabel = ['', 'Fraca', 'Regular', 'Boa', 'Forte'][strength]

  // ── Tela de confirmação de email ──────────────────────────────
  if (emailSent) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Logo mobile */}
        <div className="lg:hidden">
          <img src="/bossflow.png" alt="BossFlow" style={{ height: 32, objectFit: 'contain' }} />
        </div>

        {/* Card de confirmação */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          textAlign: 'center', gap: 20, padding: '8px 0',
        }}>
          {/* Ícone animado */}
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: 'linear-gradient(135deg, rgba(124,110,247,0.15), rgba(124,110,247,0.05))',
            border: '1px solid rgba(124,110,247,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Mail size={30} style={{ color: '#9d8fff' }} />
          </div>

          <div>
            <h1 style={{
              fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 700,
              letterSpacing: '-0.02em', color: '#e8e8f0', marginBottom: 8,
            }}>
              Confirme seu e-mail
            </h1>
            <p style={{ fontSize: 14, color: '#5a5a7a', lineHeight: 1.6, maxWidth: 320, margin: '0 auto' }}>
              Enviamos um link de confirmação para{' '}
              <strong style={{ color: '#9d8fff' }}>{email}</strong>.
              Clique no link para ativar sua conta.
            </p>
          </div>

          {/* Steps */}
          <div style={{
            width: '100%', padding: '16px 20px', borderRadius: 14,
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
            display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            {[
              { n: '1', text: 'Abra seu e-mail', done: true },
              { n: '2', text: 'Clique em "Confirmar email"', done: false },
              { n: '3', text: 'Você será redirecionado ao app', done: false },
            ].map(({ n, text, done }) => (
              <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: 99, flexShrink: 0,
                  background: done ? 'rgba(52,211,153,0.15)' : 'rgba(124,110,247,0.1)',
                  border: `1px solid ${done ? 'rgba(52,211,153,0.3)' : 'rgba(124,110,247,0.2)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700,
                  color: done ? '#34d399' : '#9d8fff',
                }}>
                  {done ? <CheckCircle size={13} /> : n}
                </div>
                <span style={{ fontSize: 13, color: done ? '#6a9a8a' : '#5a5a7a' }}>{text}</span>
              </div>
            ))}
          </div>

          {/* Dica spam */}
          <p style={{ fontSize: 12, color: '#3a3a5c', lineHeight: 1.5 }}>
            Não recebeu? Verifique a pasta de spam ou{' '}
            <button
              onClick={() => { setEmailSent(false) }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7c6ef7', fontSize: 12, fontWeight: 600, padding: 0 }}>
              tente outro e-mail
            </button>
          </p>

          <Link href="/login" style={{ fontSize: 13, color: '#3a3a5c', textDecoration: 'none' }}
            onMouseEnter={e => e.currentTarget.style.color = '#7c6ef7'}
            onMouseLeave={e => e.currentTarget.style.color = '#3a3a5c'}>
            ← Voltar para o login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <style>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 1000px #0d0d1a inset !important;
          -webkit-text-fill-color: #e8e8f0 !important;
          caret-color: #e8e8f0 !important;
        }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Logo mobile */}
        <div className="lg:hidden">
          <img src="/bossflow.png" alt="BossFlow" style={{ height: 32, objectFit: 'contain' }} />
        </div>

        {/* Heading */}
        <div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 700,
            letterSpacing: '-0.02em', color: '#e8e8f0', marginBottom: 6 }}>
            Criar conta grátis
          </h1>
          <p style={{ fontSize: 14, color: '#4a4a6a' }}>Comece a gerenciar sua empresa hoje mesmo.</p>
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
          <span style={{ fontSize: 12, color: '#2a2a3e', whiteSpace: 'nowrap' }}>ou cadastre com e-mail</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
        </div>

        {/* Form */}
        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <label style={{ fontSize: 13, color: '#5a5a7a', fontWeight: 500 }}>Nome completo</label>
            <input type="text" placeholder="Seu nome" value={name}
              onChange={e => setName(e.target.value)} required
              style={inputStyle('name')}
              onFocus={() => setFocused('name')} onBlur={() => setFocused('')} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <label style={{ fontSize: 13, color: '#5a5a7a', fontWeight: 500 }}>E-mail</label>
            <input type="email" placeholder="seu@email.com" value={email}
              onChange={e => setEmail(e.target.value)} required
              style={inputStyle('email')}
              onFocus={() => setFocused('email')} onBlur={() => setFocused('')} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <label style={{ fontSize: 13, color: '#5a5a7a', fontWeight: 500 }}>Senha</label>
            <div style={{ position: 'relative' }}>
              <input type={showPassword ? 'text' : 'password'} placeholder="Mínimo 6 caracteres" value={password}
                onChange={e => setPassword(e.target.value)} required minLength={6}
                style={{ ...inputStyle('password'), paddingRight: 44 }}
                onFocus={() => setFocused('password')} onBlur={() => setFocused('')} />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#3a3a5c',
                  padding: 0, display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = '#7c6ef7'}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = '#3a3a5c'}>
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {password.length > 0 && (
              <div>
                <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                  {[1,2,3,4].map(i => (
                    <div key={i} style={{ flex: 1, height: 3, borderRadius: 999, transition: 'background 0.3s',
                      background: i <= strength ? strengthColor : 'rgba(255,255,255,0.06)' }} />
                  ))}
                </div>
                <p style={{ fontSize: 11, color: strengthColor, margin: 0 }}>{strengthLabel}</p>
              </div>
            )}
          </div>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
              borderRadius: 10, fontSize: 13, background: 'rgba(248,113,113,0.08)',
              border: '1px solid rgba(248,113,113,0.15)', color: '#f87171' }}>
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
            {loading ? <Loader2 size={15} className="animate-spin" /> : <>Criar minha conta <ArrowRight size={15} /></>}
          </button>

          <p style={{ textAlign: 'center', fontSize: 12, color: '#2a2a3e', margin: 0 }}>
            Ao criar uma conta, você concorda com os{' '}
            <a href="https://bossflow.pro/termos" target="_blank" rel="noopener noreferrer"
              style={{ color: '#4a4a6a', textDecoration: 'none' }}
              onMouseEnter={e => e.currentTarget.style.color = '#7c6ef7'}
              onMouseLeave={e => e.currentTarget.style.color = '#4a4a6a'}>
              Termos de Uso
            </a>
          </p>
        </form>

        <p style={{ textAlign: 'center', fontSize: 13, color: '#3a3a5c' }}>
          Já tem uma conta?{' '}
          <Link href="/login" style={{ color: '#7c6ef7', fontWeight: 600, textDecoration: 'none' }}
            onMouseEnter={e => e.currentTarget.style.color = '#9d8fff'}
            onMouseLeave={e => e.currentTarget.style.color = '#7c6ef7'}>
            Entrar
          </Link>
        </p>
      </div>
    </>
  )
}
