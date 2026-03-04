'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase'
import { Building2, Check, Loader2, LogIn, UserPlus, X, Eye, Pencil, Settings } from 'lucide-react'

const ROLE_INFO: Record<string, { label: string; desc: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  admin:  { label: 'Admin',         desc: 'Acesso total exceto deletar a empresa', color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.2)', icon: <Settings size={16} /> },
  member: { label: 'Membro',        desc: 'Lança transações, vendas, tarefas e clientes', color: '#34d399', bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.2)', icon: <Pencil size={16} /> },
  viewer: { label: 'Visualizador',  desc: 'Apenas visualiza, não pode editar nada', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.2)', icon: <Eye size={16} /> },
}

type InviteInfo = {
  businessName: string
  role: string
  email: string
  inviterName?: string
}

export default function InvitePage() {
  const params    = useParams()
  const router    = useRouter()
  const supabase  = createClient()
  const token     = params?.token as string

  const [invite,    setInvite]    = useState<InviteInfo | null>(null)
  const [authUser,  setAuthUser]  = useState<any>(null)
  const [loading,   setLoading]   = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error,     setError]     = useState('')
  const [done,      setDone]      = useState(false)
  const [mode,      setMode]      = useState<'choice' | 'login' | 'register'>('choice')

  const [loginEmail,    setLoginEmail]    = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [authLoading,   setAuthLoading]   = useState(false)
  const [authError,     setAuthError]     = useState('')

  useEffect(() => {
    async function init() {
      // Verifica se já está logado
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setAuthUser(user)

      // Busca info do convite (sem aceitar ainda)
      const res = await fetch(`/api/invite/info?token=${token}`)
      if (res.ok) {
        const data = await res.json()
        setInvite(data)
      } else {
        setError('Convite inválido ou expirado.')
      }
      setLoading(false)
    }
    if (token) init()
  }, [token])

  async function acceptInvite(accessToken: string) {
    setAccepting(true)
    try {
      const res = await fetch('/api/invite/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ token }),
      })
      const data = await res.json()
      console.log('invite response:', res.status, data) // ← adiciona
      if (!res.ok) { setError(data.error); return }

      localStorage.setItem('activeBizId', data.businessId)
      setDone(true)
      setTimeout(() => router.push('/dashboard'), 2000)
    } catch {
      setError('Erro ao aceitar convite.')
    } finally {
      setAccepting(false)
    }
  }

  async function handleLogin() {
    setAuthLoading(true)
    setAuthError('')
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    })
    if (error) { setAuthError('Email ou senha incorretos'); setAuthLoading(false); return }
    if (data.session) {
      setAuthUser(data.user)
      await acceptInvite(data.session.access_token)
    }
    setAuthLoading(false)
  }

  async function handleRegister() {
    setAuthLoading(true)
    setAuthError('')
    const { data, error } = await supabase.auth.signUp({
      email: loginEmail,
      password: loginPassword,
      options: { emailRedirectTo: `${window.location.origin}/invite/${token}` },
    })
    if (error) { setAuthError(error.message); setAuthLoading(false); return }
    if (data.session) {
      setAuthUser(data.user)
      await acceptInvite(data.session.access_token)
    } else {
      setAuthError('Verifique seu email para confirmar o cadastro.')
    }
    setAuthLoading(false)
  }

  async function handleAcceptLoggedIn() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    await acceptInvite(session.access_token)
  }

  const roleInfo = invite ? ROLE_INFO[invite.role] ?? ROLE_INFO.member : null

  if (loading) return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ background: '#06060c' }}>
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: '#7c6ef7', borderTopColor: 'transparent' }} />
    </div>
  )

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ background: '#06060c' }}>

      {/* Grid pontilhado */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }} />
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(124,110,247,0.1), transparent)',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm relative z-10"
        style={{ background: '#0d0d14', borderRadius: 24, border: '1px solid #1e1e2e', overflow: 'hidden' }}
      >
        {/* Logo */}
        <div className="px-6 pt-6 pb-4" style={{ borderBottom: '1px solid #1e1e2e' }}>
          <img src="/bossflow.png" alt="BossFlow" style={{ height: 22, objectFit: 'contain' }} />
        </div>

        <div className="p-6 flex flex-col gap-5">

          {/* Erro */}
          {error && !done && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>
              <X size={16} style={{ color: '#f87171', flexShrink: 0 }} />
              <p className="text-sm" style={{ color: '#f87171' }}>{error}</p>
            </motion.div>
          )}

          {/* Sucesso */}
          {done && (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center gap-3 py-4 text-center">
              <div style={{
                width: 56, height: 56, borderRadius: 18,
                background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Check size={24} style={{ color: '#34d399' }} />
              </div>
              <p className="font-bold" style={{ color: '#e8e8f0', fontFamily: 'Syne, sans-serif' }}>Acesso liberado!</p>
              <p className="text-sm" style={{ color: '#4a4a6a' }}>Redirecionando para o dashboard...</p>
            </motion.div>
          )}

          {/* Info do convite */}
          {invite && !done && !error && (
            <>
              {/* Card da empresa */}
              <div className="flex flex-col gap-3">
                <p className="text-xs font-semibold" style={{ color: '#4a4a6a' }}>VOCÊ FOI CONVIDADO PARA</p>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '14px 16px', borderRadius: 14,
                  background: 'rgba(124,110,247,0.06)',
                  border: '1px solid rgba(124,110,247,0.15)',
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                    background: 'rgba(124,110,247,0.1)', border: '1px solid rgba(124,110,247,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Building2 size={18} style={{ color: '#9d8fff' }} />
                  </div>
                  <div>
                    <p className="font-bold text-sm" style={{ color: '#e8e8f0', fontFamily: 'Syne, sans-serif' }}>
                      {invite.businessName}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: '#4a4a6a' }}>Empresa no BossFlow</p>
                  </div>
                </div>

                {/* Nível de acesso */}
                {roleInfo && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px', borderRadius: 12,
                    background: roleInfo.bg, border: `1px solid ${roleInfo.border}`,
                  }}>
                    <div style={{ color: roleInfo.color }}>{roleInfo.icon}</div>
                    <div>
                      <p className="text-xs font-semibold" style={{ color: roleInfo.color }}>
                        Acesso como {roleInfo.label}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: '#4a4a6a' }}>{roleInfo.desc}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Se já tá logado */}
              {authUser && (
                <div className="flex flex-col gap-3">
                  <div style={{
                    padding: '10px 14px', borderRadius: 12,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                  }}>
                    <p className="text-xs" style={{ color: '#4a4a6a' }}>
                      Logado como <strong style={{ color: '#9d8fff' }}>{authUser.email}</strong>
                    </p>
                  </div>
                  <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                    onClick={handleAcceptLoggedIn} disabled={accepting}
                    style={{
                      width: '100%', height: 46, borderRadius: 13, border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      background: 'linear-gradient(135deg, #7c6ef7, #9d6ef7)',
                      color: 'white', fontWeight: 700, fontSize: 14,
                    }}>
                    {accepting ? <Loader2 size={15} className="animate-spin" /> : <><Check size={15} /> Aceitar convite</>}
                  </motion.button>
                </div>
              )}

              {/* Se não tá logado — escolha */}
              {!authUser && mode === 'choice' && (
                <div className="flex flex-col gap-3">
                  <p className="text-sm text-center" style={{ color: '#6b6b8a' }}>
                    Para acessar a empresa, faça login ou crie sua conta
                  </p>
                  <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                    onClick={() => setMode('login')}
                    style={{
                      width: '100%', height: 44, borderRadius: 13, border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      background: 'linear-gradient(135deg, #7c6ef7, #9d6ef7)',
                      color: 'white', fontWeight: 700, fontSize: 14,
                    }}>
                    <LogIn size={15} /> Já tenho cadastro
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                    onClick={() => setMode('register')}
                    style={{
                      width: '100%', height: 44, borderRadius: 13, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: '#d0d0e0', fontWeight: 700, fontSize: 14,
                    }}>
                    <UserPlus size={15} /> Criar conta grátis
                  </motion.button>
                </div>
              )}

              {/* Form login/register */}
              {!authUser && (mode === 'login' || mode === 'register') && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col gap-3">
                  <p className="text-sm font-semibold" style={{ color: '#e8e8f0', fontFamily: 'Syne, sans-serif' }}>
                    {mode === 'login' ? 'Entrar na conta' : 'Criar conta'}
                  </p>

                  {authError && (
                    <p className="text-xs p-2.5 rounded-lg" style={{ color: '#f87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)' }}>
                      {authError}
                    </p>
                  )}

                  <input type="email" placeholder="Seu email" value={loginEmail}
                    onChange={e => { setLoginEmail(e.target.value); setAuthError('') }}
                    style={{
                      width: '100%', padding: '11px 14px', borderRadius: 12, outline: 'none',
                      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                      color: '#e8e8f0', fontSize: 14, boxSizing: 'border-box',
                    }} />
                  <input type="password" placeholder="Senha" value={loginPassword}
                    onChange={e => { setLoginPassword(e.target.value); setAuthError('') }}
                    onKeyDown={e => e.key === 'Enter' && (mode === 'login' ? handleLogin() : handleRegister())}
                    style={{
                      width: '100%', padding: '11px 14px', borderRadius: 12, outline: 'none',
                      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                      color: '#e8e8f0', fontSize: 14, boxSizing: 'border-box',
                    }} />

                  <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                    onClick={mode === 'login' ? handleLogin : handleRegister}
                    disabled={authLoading}
                    style={{
                      width: '100%', height: 44, borderRadius: 13, border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      background: 'linear-gradient(135deg, #7c6ef7, #9d6ef7)',
                      color: 'white', fontWeight: 700, fontSize: 14,
                      opacity: authLoading ? 0.7 : 1,
                    }}>
                    {authLoading
                      ? <Loader2 size={15} className="animate-spin" />
                      : mode === 'login' ? <><LogIn size={15} /> Entrar e aceitar</> : <><UserPlus size={15} /> Cadastrar e aceitar</>}
                  </motion.button>

                  <button onClick={() => { setMode('choice'); setAuthError('') }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4a4a6a', fontSize: 13, padding: '2px 0' }}>
                    ← Voltar
                  </button>
                </motion.div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}
