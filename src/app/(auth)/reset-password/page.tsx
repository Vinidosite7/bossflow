'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Lock, ArrowRight, Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react'
import Image from 'next/image'

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirm) { setError('As senhas não coincidem.'); return }
    if (password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres.'); return }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError('Erro ao redefinir senha. O link pode ter expirado.')
      setLoading(false)
      return
    }

    setDone(true)
    setLoading(false)
    setTimeout(() => router.push('/dashboard'), 2500)
  }

  const inputStyle = (field: string) => ({
    background: '#111118',
    border: `1px solid ${focusedField === field ? 'rgba(124,110,247,0.5)' : '#1e1e2e'}`,
    boxShadow: focusedField === field ? '0 0 0 3px rgba(124,110,247,0.08)' : 'none',
  })

  return (
    <div className="w-full">
      <div className="mb-10">
        <div className="relative w-40 h-9">
          <Image src="/bossflow.png" alt="BossFlow" fill className="object-contain object-left" priority />
        </div>
      </div>

      {!done ? (
        <>
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 leading-tight"
              style={{ fontFamily: 'Syne, sans-serif', color: '#e8e8f0', letterSpacing: '-0.02em' }}>
              Nova senha
            </h1>
            <p className="text-sm" style={{ color: '#4a4a6a' }}>
              Escolha uma senha segura para sua conta.
            </p>
          </div>

          {!ready && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-2xl text-sm mb-4"
              style={{ background: 'rgba(124,110,247,0.08)', border: '1px solid rgba(124,110,247,0.2)', color: '#9d8fff' }}>
              <Loader2 size={14} className="animate-spin" /> Validando link...
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#4a4a6a' }}>
                Nova senha
              </label>
              <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all" style={inputStyle('password')}>
                <Lock size={15} style={{ color: focusedField === 'password' ? '#7c6ef7' : '#3a3a5c', flexShrink: 0 }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  required minLength={6}
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

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#4a4a6a' }}>
                Confirmar senha
              </label>
              <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all" style={inputStyle('confirm')}>
                <Lock size={15} style={{ color: focusedField === 'confirm' ? '#7c6ef7' : '#3a3a5c', flexShrink: 0 }} />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Repita a senha"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  onFocus={() => setFocusedField('confirm')}
                  onBlur={() => setFocusedField(null)}
                  required
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#2a2a3e]"
                  style={{ color: '#e8e8f0' }}
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{ color: '#3a3a5c' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#7c6ef7'}
                  onMouseLeave={e => e.currentTarget.style.color = '#3a3a5c'}>
                  {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {confirm.length > 0 && (
                <p className="text-xs" style={{ color: password === confirm ? '#34d399' : '#f87171' }}>
                  {password === confirm ? '✓ Senhas coincidem' : '✗ Senhas não coincidem'}
                </p>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-2xl text-sm"
                style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171' }}>
                <span>⚠</span> {error}
              </div>
            )}

            <button type="submit" disabled={loading || !ready}
              className="flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm transition-all mt-1"
              style={{
                background: loading || !ready ? '#1e1e2e' : 'linear-gradient(135deg, #7c6ef7 0%, #9d8fff 100%)',
                color: loading || !ready ? '#4a4a6a' : 'white',
                boxShadow: loading || !ready ? 'none' : '0 0 32px rgba(124,110,247,0.35)',
                letterSpacing: '0.02em',
                cursor: loading || !ready ? 'not-allowed' : 'pointer',
              }}>
              {loading
                ? <Loader2 size={16} className="animate-spin" />
                : <><ArrowRight size={16} /> Redefinir senha</>}
            </button>
          </form>
        </>
      ) : (
        <div className="flex flex-col items-center text-center py-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
            style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)' }}>
            <CheckCircle size={32} style={{ color: '#34d399' }} />
          </div>
          <h2 className="text-2xl font-bold mb-3"
            style={{ fontFamily: 'Syne, sans-serif', color: '#e8e8f0' }}>
            Senha redefinida!
          </h2>
          <p className="text-sm" style={{ color: '#4a4a6a' }}>
            Redirecionando para o painel...
          </p>
        </div>
      )}

      {!done && (
        <div className="mt-8 flex justify-center">
          <Link href="/login"
            className="text-sm transition-colors"
            style={{ color: '#4a4a6a' }}
            onMouseEnter={e => e.currentTarget.style.color = '#7c6ef7'}
            onMouseLeave={e => e.currentTarget.style.color = '#4a4a6a'}>
            Voltar pro login
          </Link>
        </div>
      )}
    </div>
  )
}
