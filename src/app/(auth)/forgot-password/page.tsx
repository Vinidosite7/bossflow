'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { Mail, ArrowRight, Loader2, ArrowLeft, CheckCircle } from 'lucide-react'
import Image from 'next/image'

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [focusedField, setFocusedField] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (error) {
      setError('Erro ao enviar email. Verifique o endereço e tente novamente.')
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <div className="w-full">
      {/* Logo */}
      <div className="mb-10">
        <div className="relative w-40 h-9">
          <Image src="/bossflow.png" alt="BossFlow" fill className="object-contain object-left" priority />
        </div>
      </div>

      {!sent ? (
        <>
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 leading-tight"
              style={{ fontFamily: 'Syne, sans-serif', color: '#e8e8f0', letterSpacing: '-0.02em' }}>
              Recuperar senha
            </h1>
            <p className="text-sm" style={{ color: '#4a4a6a' }}>
              Digite seu email e enviaremos um link para redefinir sua senha.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#4a4a6a' }}>
                E-mail
              </label>
              <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all"
                style={{
                  background: '#111118',
                  border: `1px solid ${focusedField === 'email' ? 'rgba(124,110,247,0.5)' : '#1e1e2e'}`,
                  boxShadow: focusedField === 'email' ? '0 0 0 3px rgba(124,110,247,0.08)' : 'none',
                }}>
                <Mail size={15} style={{ color: focusedField === 'email' ? '#7c6ef7' : '#3a3a5c', flexShrink: 0 }} />
                <input
                  type="email" placeholder="seu@email.com" value={email}
                  onChange={e => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  required
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#2a2a3e]"
                  style={{ color: '#e8e8f0' }}
                />
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
                letterSpacing: '0.02em',
              }}>
              {loading
                ? <Loader2 size={16} className="animate-spin" />
                : <><ArrowRight size={16} /> Enviar link de recuperação</>}
            </button>
          </form>
        </>
      ) : (
        /* Estado de sucesso */
        <div className="flex flex-col items-center text-center py-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
            style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)' }}>
            <CheckCircle size={32} style={{ color: '#34d399' }} />
          </div>
          <h2 className="text-2xl font-bold mb-3"
            style={{ fontFamily: 'Syne, sans-serif', color: '#e8e8f0' }}>
            Email enviado!
          </h2>
          <p className="text-sm leading-relaxed mb-2" style={{ color: '#4a4a6a' }}>
            Enviamos um link para <span style={{ color: '#9d8fff' }}>{email}</span>
          </p>
          <p className="text-xs mb-8" style={{ color: '#3a3a5c' }}>
            Verifique sua caixa de entrada e spam.
          </p>
          <button onClick={() => setSent(false)}
            className="text-sm transition-colors" style={{ color: '#4a4a6a' }}
            onMouseEnter={e => e.currentTarget.style.color = '#7c6ef7'}
            onMouseLeave={e => e.currentTarget.style.color = '#4a4a6a'}>
            Tentar outro email
          </button>
        </div>
      )}

      <div className="mt-8 flex justify-center">
        <Link href="/auth/login"
          className="flex items-center gap-2 text-sm transition-colors"
          style={{ color: '#4a4a6a' }}
          onMouseEnter={e => e.currentTarget.style.color = '#7c6ef7'}
          onMouseLeave={e => e.currentTarget.style.color = '#4a4a6a'}>
          <ArrowLeft size={14} /> Voltar pro login
        </Link>
      </div>
    </div>
  )
}
