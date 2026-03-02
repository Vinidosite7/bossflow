'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function ConvitePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<'loading' | 'ok' | 'error' | 'login'>('loading')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (!token) { setStatus('error'); setMsg('Token inválido.'); return }
    accept()
  }, [token])

  async function accept() {
    const supabase = createClient()

    // Verifica se está logado
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      // Salva token e redireciona pro login
      localStorage.setItem('pending_invite', token!)
      router.push(`/login?redirect=/convite?token=${token}`)
      return
    }

    // Busca o convite
    const { data: invite, error } = await supabase
      .from('business_members')
      .select('*, businesses(name)')
      .eq('invite_token', token)
      .eq('status', 'pending')
      .single()

    if (error || !invite) {
      setStatus('error')
      setMsg('Convite inválido ou já utilizado.')
      return
    }

    // Verifica se expirou (7 dias)
    const invitedAt = new Date(invite.invited_at)
    const diff = (Date.now() - invitedAt.getTime()) / 1000 / 60 / 60 / 24
    if (diff > 7) {
      setStatus('error')
      setMsg('Este convite expirou. Peça um novo convite.')
      return
    }

    // Ativa o membro
    const { error: updateErr } = await supabase
      .from('business_members')
      .update({
        user_id: user.id,
        status: 'active',
        accepted_at: new Date().toISOString(),
        invite_token: null,
      })
      .eq('id', invite.id)

    if (updateErr) {
      setStatus('error')
      setMsg('Erro ao aceitar convite. Tente novamente.')
      return
    }

    // Salva empresa ativa e redireciona
    localStorage.setItem('activeBizId', invite.business_id)
    setStatus('ok')
    setMsg(invite.businesses?.name ?? 'sua empresa')
    setTimeout(() => router.push('/dashboard'), 2500)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: '#0a0a12' }}>
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm rounded-2xl border p-8 text-center"
        style={{ background: '#111118', borderColor: '#1e1e2e' }}
      >
        {status === 'loading' && (
          <>
            <Loader2 size={40} className="animate-spin mx-auto mb-4" style={{ color: '#7c6ef7' }} />
            <h2 className="font-bold text-lg" style={{ fontFamily: 'Syne, sans-serif' }}>Verificando convite...</h2>
            <p className="text-sm mt-2" style={{ color: '#4a4a6a' }}>Aguarde um momento</p>
          </>
        )}

        {status === 'ok' && (
          <>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
              <CheckCircle size={48} className="mx-auto mb-4" style={{ color: '#34d399' }} />
            </motion.div>
            <h2 className="font-bold text-lg" style={{ fontFamily: 'Syne, sans-serif', color: '#e8eaf0' }}>
              Convite aceito! 🎉
            </h2>
            <p className="text-sm mt-2" style={{ color: '#4a4a6a' }}>
              Você agora faz parte de <strong style={{ color: '#e8eaf0' }}>{msg}</strong>.<br />
              Redirecionando para o dashboard...
            </p>
            <div className="mt-4 h-1 rounded-full overflow-hidden" style={{ background: '#1e1e2e' }}>
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 2.5, ease: 'linear' }}
                style={{ background: '#34d399' }}
              />
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle size={48} className="mx-auto mb-4" style={{ color: '#f87171' }} />
            <h2 className="font-bold text-lg" style={{ fontFamily: 'Syne, sans-serif', color: '#e8eaf0' }}>
              Ops!
            </h2>
            <p className="text-sm mt-2" style={{ color: '#4a4a6a' }}>{msg}</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="mt-6 w-full py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: '#1e1e2e', color: '#9d8fff' }}
            >
              Ir para o dashboard
            </button>
          </>
        )}
      </motion.div>
    </div>
  )
}