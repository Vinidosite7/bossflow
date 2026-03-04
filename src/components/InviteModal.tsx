'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase'
import {
  X, UserPlus, Copy, Check, ChevronDown,
  Eye, Pencil, Settings, Crown, Loader2, Link2,
} from 'lucide-react'

const ROLES = [
  {
    value: 'admin',
    label: 'Admin',
    desc: 'Acesso total exceto deletar a empresa',
    icon: <Settings size={14} />,
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.1)',
    border: 'rgba(167,139,250,0.2)',
  },
  {
    value: 'member',
    label: 'Membro',
    desc: 'Lança transações, vendas, tarefas e clientes',
    icon: <Pencil size={14} />,
    color: '#34d399',
    bg: 'rgba(52,211,153,0.1)',
    border: 'rgba(52,211,153,0.2)',
  },
  {
    value: 'viewer',
    label: 'Visualizador',
    desc: 'Apenas visualiza, não pode editar nada',
    icon: <Eye size={14} />,
    color: '#60a5fa',
    bg: 'rgba(96,165,250,0.1)',
    border: 'rgba(96,165,250,0.2)',
  },
]

const PERMISSIONS_INFO: Record<string, string[]> = {
  admin:  ['Dashboard', 'Financeiro', 'Despesas', 'Metas (editar)', 'Vendas', 'Clientes', 'Tarefas', 'Agenda', 'Produtos', 'Configurações'],
  member: ['Dashboard', 'Financeiro', 'Despesas', 'Metas (só ver)', 'Vendas', 'Clientes', 'Tarefas', 'Agenda'],
  viewer: ['Dashboard (só ver)', 'Financeiro (só ver)', 'Despesas (só ver)', 'Metas (só ver)', 'Vendas (só ver)'],
}

interface Props {
  businessId: string
  businessName: string
  onClose: () => void
}

export function InviteModal({ businessId, businessName, onClose }: Props) {
  const supabase = createClient()

  const [email,         setEmail]         = useState('')
  const [role,          setRole]          = useState('member')
  const [loading,       setLoading]       = useState(false)
  const [inviteUrl,     setInviteUrl]     = useState('')
  const [copied,        setCopied]        = useState(false)
  const [error,         setError]         = useState('')
  const [showPerms,     setShowPerms]     = useState(false)
  const [step,          setStep]          = useState<'form' | 'success'>('form')

  async function handleGenerate() {
    if (!email.trim()) { setError('Informe o email do convidado'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Email inválido'); return }

    setLoading(true)
    setError('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/invite/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ businessId, email: email.trim().toLowerCase(), role }),
      })

      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Erro ao gerar convite'); return }

      setInviteUrl(data.inviteUrl)
      setStep('success')
    } catch {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const selectedRole = ROLES.find(r => r.value === role)!

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md rounded-2xl border flex flex-col overflow-hidden"
        style={{ background: '#0d0d14', borderColor: '#1e1e2e' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid #1e1e2e' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(124,110,247,0.1)', border: '1px solid rgba(124,110,247,0.2)' }}>
              <UserPlus size={15} style={{ color: '#9d8fff' }} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: '#e8e8f0', fontFamily: 'Syne, sans-serif' }}>
                Convidar para equipe
              </p>
              <p className="text-xs" style={{ color: '#4a4a6a' }}>{businessName}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.04)', color: '#4a4a6a' }}>
            <X size={14} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <AnimatePresence mode="wait">

            {/* ── STEP: FORM ── */}
            {step === 'form' && (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col gap-4">

                {/* Email */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold" style={{ color: '#6b6b8a' }}>
                    EMAIL DO CONVIDADO
                  </label>
                  <input
                    type="email"
                    placeholder="email@exemplo.com"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError('') }}
                    onKeyDown={e => e.key === 'Enter' && handleGenerate()}
                    autoFocus
                    style={{
                      width: '100%', padding: '11px 14px', borderRadius: 12,
                      background: 'rgba(255,255,255,0.03)',
                      border: `1px solid ${error ? 'rgba(248,113,113,0.4)' : 'rgba(255,255,255,0.08)'}`,
                      color: '#e8e8f0', fontSize: 14, outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  {error && (
                    <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>
                  )}
                </div>

                {/* Seletor de role */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold" style={{ color: '#6b6b8a' }}>
                    NÍVEL DE ACESSO
                  </label>
                  <div className="flex flex-col gap-2">
                    {ROLES.map(r => (
                      <motion.button
                        key={r.value}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setRole(r.value)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '12px 14px', borderRadius: 12, cursor: 'pointer',
                          background: role === r.value ? r.bg : 'rgba(255,255,255,0.02)',
                          border: `1px solid ${role === r.value ? r.border : 'rgba(255,255,255,0.06)'}`,
                          transition: 'all 0.15s', textAlign: 'left',
                        }}
                      >
                        <div style={{
                          width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                          background: role === r.value ? r.bg : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${role === r.value ? r.border : 'rgba(255,255,255,0.06)'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: role === r.value ? r.color : '#4a4a6a',
                        }}>
                          {r.icon}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold"
                            style={{ color: role === r.value ? r.color : '#d0d0e0' }}>
                            {r.label}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: '#4a4a6a' }}>{r.desc}</p>
                        </div>
                        {role === r.value && (
                          <div style={{
                            width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                            background: r.bg, border: `1px solid ${r.border}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <Check size={10} style={{ color: r.color }} />
                          </div>
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Expandir permissões */}
                <button
                  onClick={() => setShowPerms(v => !v)}
                  className="flex items-center gap-1.5 text-xs"
                  style={{ color: '#4a4a6a', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  <motion.div animate={{ rotate: showPerms ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown size={13} />
                  </motion.div>
                  {showPerms ? 'Ocultar' : 'Ver'} permissões detalhadas
                </button>

                <AnimatePresence>
                  {showPerms && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{
                        padding: '12px 14px', borderRadius: 12,
                        background: `${selectedRole.bg}`,
                        border: `1px solid ${selectedRole.border}`,
                      }}>
                        <p className="text-xs font-semibold mb-2" style={{ color: selectedRole.color }}>
                          {selectedRole.label} tem acesso a:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {PERMISSIONS_INFO[role]?.map(p => (
                            <span key={p} className="text-xs px-2 py-0.5 rounded-full"
                              style={{ background: 'rgba(255,255,255,0.05)', color: '#6b6b8a' }}>
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Botão gerar */}
                <motion.button
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                  onClick={handleGenerate} disabled={loading}
                  style={{
                    width: '100%', height: 46, borderRadius: 13, border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    background: 'linear-gradient(135deg, #7c6ef7, #9d6ef7)',
                    color: 'white', fontWeight: 700, fontSize: 14,
                    boxShadow: '0 4px 24px rgba(124,110,247,0.3)',
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  {loading
                    ? <Loader2 size={15} className="animate-spin" />
                    : <><Link2 size={15} /> Gerar link de convite</>}
                </motion.button>
              </motion.div>
            )}

            {/* ── STEP: SUCCESS ── */}
            {step === 'success' && (
              <motion.div key="success" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-4">

                {/* Ícone de sucesso */}
                <div className="flex flex-col items-center gap-3 py-2">
                  <motion.div
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    style={{
                      width: 56, height: 56, borderRadius: 18,
                      background: 'rgba(52,211,153,0.1)',
                      border: '1px solid rgba(52,211,153,0.25)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                    <Check size={24} style={{ color: '#34d399' }} />
                  </motion.div>
                  <div className="text-center">
                    <p className="font-bold text-sm" style={{ color: '#e8e8f0' }}>Link gerado!</p>
                    <p className="text-xs mt-1" style={{ color: '#4a4a6a' }}>
                      Válido por <strong style={{ color: '#fbbf24' }}>48 horas</strong>. Envie para <strong style={{ color: '#9d8fff' }}>{email}</strong>
                    </p>
                  </div>
                </div>

                {/* Link */}
                <div style={{
                  padding: '12px 14px', borderRadius: 13,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}>
                  <p className="text-xs mb-2" style={{ color: '#4a4a6a' }}>Link de convite</p>
                  <p className="text-xs font-mono break-all" style={{ color: '#7c6ef7' }}>
                    {inviteUrl}
                  </p>
                </div>

                {/* Nível de acesso */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', borderRadius: 12,
                  background: selectedRole.bg,
                  border: `1px solid ${selectedRole.border}`,
                }}>
                  <div style={{ color: selectedRole.color }}>{selectedRole.icon}</div>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: selectedRole.color }}>{selectedRole.label}</p>
                    <p className="text-xs" style={{ color: '#4a4a6a' }}>{selectedRole.desc}</p>
                  </div>
                </div>

                {/* Botão copiar */}
                <motion.button
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                  onClick={handleCopy}
                  style={{
                    width: '100%', height: 46, borderRadius: 13,  cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    background: copied ? 'rgba(52,211,153,0.15)' : 'linear-gradient(135deg, #7c6ef7, #9d6ef7)',
                    color: copied ? '#34d399' : 'white', fontWeight: 700, fontSize: 14,
                    transition: 'all 0.3s',
                  }}
                >
                  {copied ? <><Check size={15} /> Copiado!</> : <><Copy size={15} /> Copiar link</>}
                </motion.button>

                {/* Novo convite */}
                <button
                  onClick={() => { setStep('form'); setEmail(''); setInviteUrl('') }}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#4a4a6a', fontSize: 13, padding: '4px 0',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#6b6b8a'}
                  onMouseLeave={e => e.currentTarget.style.color = '#4a4a6a'}
                >
                  Convidar outra pessoa
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  )
}
