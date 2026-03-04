'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useTour } from '@/hooks/useTour'
import { usePlanLimits } from '@/hooks/usePlanLimits'
import { TourTooltip } from "@/components/TourTooltip"
import { Building2, Plus, Loader2, X, Pencil, Trash2, Upload, Check, Users, Mail, Crown, Shield, Eye, UserMinus, Lock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay, ease: [0.25, 0.46, 0.45, 0.94] as const }
})

const ROLE_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  owner:  { label: 'Dono',         color: '#fbbf24', icon: Crown  },
  admin:  { label: 'Admin',        color: '#7c6ef7', icon: Shield },
  member: { label: 'Membro',       color: '#34d399', icon: Users  },
  viewer: { label: 'Visualizador', color: '#6b6b8a', icon: Eye    },
}

const PLAN_LIMITS: Record<string, number> = {
  free: 1, starter: 3, pro: Infinity, scale: Infinity,
}

const TOUR_STEPS = [
  {
    target: '[data-tour="empresas-header"]',
    title: 'Suas empresas',
    description: 'Gerencie múltiplas empresas no BossFlow. Alterne entre elas pelo botão "Usar esta".',
    position: 'bottom' as const,
  },
  {
    target: '[data-tour="empresas-lista"]',
    title: 'Cards de empresa',
    description: 'A empresa ativa aparece com borda roxa. Clique em 👥 para gerenciar membros e convidar colaboradores.',
    position: 'top' as const,
  },
]

export default function EmpresasPage() {
  const supabase = createClient()
  const { plan, loading: planLoading } = usePlanLimits()
  const tour = useTour('empresas', TOUR_STEPS)

  const [businesses, setBusinesses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editBiz, setEditBiz] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState('')
  const [showConfirm, setShowConfirm] = useState<string | null>(null)
  const [activeBizId, setActiveBizId] = useState<string>('')

  const [membersModal, setMembersModal] = useState<any | null>(null)
  const [members, setMembers] = useState<any[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [sendingInvite, setSendingInvite] = useState(false)
  const [inviteSuccess, setInviteSuccess] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string>('')

  useEffect(() => {
    if (typeof window !== 'undefined') setActiveBizId(localStorage.getItem('activeBizId') || '')
  }, [])

  async function load() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      setCurrentUserId(user.id)
      const { data } = await supabase.from('businesses').select('*').eq('owner_id', user.id).order('created_at', { ascending: false })
      setBusinesses(data || [])
      const saved = typeof window !== 'undefined' ? localStorage.getItem('activeBizId') : null
      if (!saved && data?.[0]) { localStorage.setItem('activeBizId', data[0].id); setActiveBizId(data[0].id) }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function loadMembers(biz: any) {
    setLoadingMembers(true); setMembersModal(biz); setInviteEmail(''); setInviteRole('member'); setInviteSuccess(false)
    try {
      const { data } = await supabase.from('business_members').select('*').eq('business_id', biz.id).order('created_at', { ascending: true })
      setMembers(data || [])
    } catch (err) { console.error(err) }
    finally { setLoadingMembers(false) }
  }

  async function handleInvite(e: React.FormEvent) {
  e.preventDefault()
  if (!membersModal) return
  setSendingInvite(true)
  try {
    const { data: { session } } = await supabase.auth.getSession() // ← adiciona
    const res = await fetch('/api/invite/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`, // ← adiciona
      },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole, businessId: membersModal.id }),
    })
    if (!res.ok) throw new Error('Erro ao enviar convite')
    setInviteSuccess(true); setInviteEmail(''); loadMembers(membersModal)
  } catch (err) { console.error(err) }
  finally { setSendingInvite(false) }
}

  async function handleRemoveMember(memberId: string) {
    if (!confirm('Remover este membro?')) return
    await supabase.from('business_members').update({ status: 'removed' }).eq('id', memberId)
    loadMembers(membersModal)
  }

  function openCreate() {
    setEditBiz(null); setName(''); setLogoFile(null); setLogoPreview(''); setShowForm(true)
  }

  function openEdit(biz: any) {
    setEditBiz(biz); setName(biz.name); setLogoFile(null); setLogoPreview(biz.logo_url || ''); setShowForm(true)
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file); setLogoPreview(URL.createObjectURL(file))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    let logo_url = editBiz?.logo_url || null
    if (logoFile) {
      const ext = logoFile.name.split('.').pop()
      const path = `logos/${user.id}-${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('business-logos').upload(path, logoFile, { upsert: true })
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('business-logos').getPublicUrl(path)
        logo_url = urlData.publicUrl
      }
    }
    if (editBiz) {
      await supabase.from('businesses').update({ name, logo_url }).eq('id', editBiz.id)
    } else {
      const { data: newBiz } = await supabase.from('businesses').insert({ name, logo_url, owner_id: user.id }).select().single()
      if (newBiz && !activeBizId) { localStorage.setItem('activeBizId', newBiz.id); setActiveBizId(newBiz.id) }
    }
    setShowForm(false); setEditBiz(null); setSaving(false); load()
  }

  async function handleDelete(id: string) {
    await supabase.from('businesses').delete().eq('id', id)
    if (activeBizId === id) { localStorage.removeItem('activeBizId'); setActiveBizId('') }
    setShowConfirm(null); load()
  }

  function activateBiz(id: string) {
    localStorage.setItem('activeBizId', id); setActiveBizId(id); window.location.reload()
  }

  const planLimit = PLAN_LIMITS[plan] || 1
  const atLimit = businesses.length >= planLimit

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: '#7c6ef7', borderTopColor: 'transparent' }} />
    </div>
  )

  return (
    <div className="flex flex-col gap-6">
      <TourTooltip active={tour.active} step={tour.step} current={tour.current} total={tour.total} onNext={tour.next} onPrev={tour.prev} onFinish={tour.finish} />

      <motion.div {...fadeUp(0)} className="flex items-center justify-between" data-tour="empresas-header">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>Empresas</h1>
          <p className="text-sm mt-1" style={{ color: '#4a4a6a' }}>
            {businesses.length} {businesses.length === 1 ? 'empresa cadastrada' : 'empresas cadastradas'}
            {planLimit !== Infinity && <span style={{ color: '#4a4a6a' }}> · máx {planLimit} no plano atual</span>}
          </p>
        </div>
        <motion.button whileHover={{ scale: atLimit ? 1 : 1.03 }} whileTap={{ scale: atLimit ? 1 : 0.97 }}
          onClick={atLimit ? undefined : openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
          style={{
            background: atLimit ? '#1e1e2e' : '#7c6ef7',
            color: atLimit ? '#4a4a6a' : 'white',
            boxShadow: atLimit ? 'none' : '0 0 20px rgba(124,110,247,0.3)',
            cursor: atLimit ? 'not-allowed' : 'pointer',
          }}>
          {atLimit ? <><Lock size={13} /> Limite atingido</> : <><Plus size={15} /><span className="hidden sm:inline">Nova empresa</span><span className="sm:hidden">Nova</span></>}
        </motion.button>
      </motion.div>

      {atLimit && (
        <motion.div {...fadeUp(0.05)} className="rounded-xl p-3.5 flex items-center gap-3"
          style={{ background: 'rgba(124,110,247,0.06)', border: '1px solid rgba(124,110,247,0.2)' }}>
          <Lock size={14} style={{ color: '#9d8fff' }} />
          <p className="text-sm flex-1" style={{ color: '#9d8fff' }}>
            Você atingiu o limite de {planLimit} empresa{planLimit > 1 ? 's' : ''} do plano {plan}.
          </p>
          <a href="/assinatura" className="text-xs font-bold px-2.5 py-1 rounded-lg"
            style={{ background: 'rgba(124,110,247,0.15)', color: '#9d8fff' }}>
            Fazer upgrade
          </a>
        </motion.div>
      )}

      {/* Modal form empresa */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            style={{ background: 'rgba(0,0,0,0.8)' }}
            onClick={e => { if (e.target === e.currentTarget) { setShowForm(false); setEditBiz(null) } }}>
            <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as const }}
              className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl border p-6"
              style={{ background: '#111118', borderColor: '#1e1e2e' }}>
              <div className="w-10 h-1 rounded-full mx-auto mb-5 sm:hidden" style={{ background: '#2a2a3e' }} />
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-lg" style={{ fontFamily: 'Syne, sans-serif' }}>{editBiz ? 'Editar empresa' : 'Nova empresa'}</h2>
                <button onClick={() => { setShowForm(false); setEditBiz(null) }} style={{ color: '#4a4a6a' }}><X size={18} /></button>
              </div>
              <form onSubmit={handleSave} className="flex flex-col gap-5">
                <div className="flex flex-col items-center gap-3">
                  <motion.div whileHover={{ scale: 1.04 }}
                    className="w-24 h-24 rounded-2xl flex items-center justify-center overflow-hidden"
                    style={{ background: '#0d0d14', border: '2px dashed #2a2a3e' }}>
                    {logoPreview ? <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" /> : <Building2 size={36} style={{ color: '#3a3a5c' }} />}
                  </motion.div>
                  <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
                    style={{ background: 'rgba(124,110,247,0.1)', color: '#9d8fff', border: '1px solid rgba(124,110,247,0.2)' }}>
                    <Upload size={12} /> {logoPreview ? 'Trocar logo' : 'Enviar logo'}
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                  </label>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium" style={{ color: '#6b6b8a' }}>Nome da empresa</label>
                  <input type="text" placeholder="Ex: Minha Loja" value={name}
                    onChange={e => setName(e.target.value)} required
                    className="px-3 py-3 rounded-xl border text-sm outline-none"
                    style={{ background: '#0d0d14', borderColor: '#1e1e2e', color: '#e8e8f0' }} />
                </div>
                <button type="submit" disabled={saving}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm"
                  style={{ background: '#7c6ef7', color: 'white' }}>
                  {saving ? <Loader2 size={16} className="animate-spin" /> : editBiz ? 'Salvar alterações' : 'Criar empresa'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal membros */}
      <AnimatePresence>
        {membersModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            style={{ background: 'rgba(0,0,0,0.85)' }}
            onClick={e => { if (e.target === e.currentTarget) setMembersModal(null) }}>
            <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as const }}
              className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl border flex flex-col"
              style={{ background: '#111118', borderColor: '#1e1e2e', maxHeight: '90vh' }}>
              <div className="flex items-center justify-between p-5 border-b shrink-0" style={{ borderColor: '#1a1a2a' }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden"
                    style={{ background: '#0d0d14', border: '1px solid #1e1e2e' }}>
                    {membersModal.logo_url ? <img src={membersModal.logo_url} alt="" className="w-full h-full object-cover" /> : <Building2 size={16} style={{ color: '#3a3a5c' }} />}
                  </div>
                  <div>
                    <h2 className="font-bold text-base leading-none" style={{ fontFamily: 'Syne, sans-serif' }}>{membersModal.name}</h2>
                    <p className="text-xs mt-0.5" style={{ color: '#4a4a6a' }}>{members.filter(m => m.status === 'active').length} membros ativos</p>
                  </div>
                </div>
                <button onClick={() => setMembersModal(null)} style={{ color: '#4a4a6a' }}><X size={18} /></button>
              </div>
              <div className="overflow-y-auto flex-1 p-5 flex flex-col gap-5">
                <div className="rounded-2xl p-4" style={{ background: '#0d0d14', border: '1px solid #1a1a2a' }}>
                  <h3 className="text-sm font-bold mb-3" style={{ color: '#e8eaf0' }}>Convidar membro</h3>
                  <form onSubmit={handleInvite} className="flex flex-col gap-3">
                    <input type="email" placeholder="email@exemplo.com" value={inviteEmail} required
                      onChange={e => { setInviteEmail(e.target.value); setInviteSuccess(false) }}
                      className="px-3 py-2.5 rounded-xl border text-sm outline-none w-full"
                      style={{ background: '#111118', borderColor: '#1e1e2e', color: '#e8e8f0' }} />
                    <div className="flex gap-2">
                      <div className="flex gap-1.5 flex-1 flex-wrap">
                        {(['admin', 'member', 'viewer'] as const).map(r => {
                          const cfg = ROLE_CONFIG[r]
                          const Icon = cfg.icon
                          return (
                            <button key={r} type="button" onClick={() => setInviteRole(r)}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                              style={{
                                background: inviteRole === r ? `${cfg.color}18` : 'transparent',
                                color: inviteRole === r ? cfg.color : '#4a4a6a',
                                border: `1px solid ${inviteRole === r ? `${cfg.color}40` : '#1e1e2e'}`,
                              }}>
                              <Icon size={11} /> {cfg.label}
                            </button>
                          )
                        })}
                      </div>
                      <button type="submit" disabled={sendingInvite}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold shrink-0"
                        style={{ background: '#7c6ef7', color: 'white' }}>
                        {sendingInvite ? <Loader2 size={12} className="animate-spin" /> : <><Mail size={12} /> Convidar</>}
                      </button>
                    </div>
                    <AnimatePresence>
                      {inviteSuccess && (
                        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          className="text-xs flex items-center gap-1.5" style={{ color: '#34d399' }}>
                          <Check size={12} /> Convite enviado!
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </form>
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#4a4a6a' }}>Membros</h3>
                  {loadingMembers ? (
                    <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin" style={{ color: '#7c6ef7' }} /></div>
                  ) : members.length === 0 ? (
                    <p className="text-sm py-4 text-center" style={{ color: '#4a4a6a' }}>Nenhum membro ainda.</p>
                  ) : members.map((m, i) => {
                    const cfg = ROLE_CONFIG[m.role] ?? ROLE_CONFIG.member
                    const Icon = cfg.icon
                    const isMe = m.user_id === currentUserId
                    return (
                      <motion.div key={m.id}
                        initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                        style={{ background: '#0d0d14', border: '1px solid #1a1a2a' }}>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                          style={{ background: `${cfg.color}18`, color: cfg.color }}>
                          {(m.email?.[0] ?? '?').toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: '#d0d0e0' }}>
                            {m.email} {isMe && <span style={{ color: '#4a4a6a' }}>(você)</span>}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="flex items-center gap-1 text-xs" style={{ color: cfg.color }}>
                              <Icon size={10} /> {cfg.label}
                            </span>
                            <span className="text-xs px-1.5 py-0.5 rounded-md"
                              style={{
                                background: m.status === 'active' ? 'rgba(52,211,153,0.08)' : 'rgba(251,191,36,0.08)',
                                color: m.status === 'active' ? '#34d399' : '#fbbf24',
                              }}>
                              {m.status === 'active' ? 'Ativo' : m.status === 'pending' ? 'Pendente' : 'Removido'}
                            </span>
                          </div>
                        </div>
                        {!isMe && m.role !== 'owner' && m.status !== 'removed' && (
                          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                            onClick={() => handleRemoveMember(m.id)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                            style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171' }}>
                            <UserMinus size={12} />
                          </motion.button>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm rounded-2xl border p-6" style={{ background: '#111118', borderColor: '#1e1e2e' }}>
              <h2 className="font-bold text-lg mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>Excluir empresa?</h2>
              <p className="text-sm mb-6" style={{ color: '#6b6b8a' }}>Todos os dados serão excluídos permanentemente.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowConfirm(null)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: '#0d0d14', border: '1px solid #1e1e2e', color: '#6b6b8a' }}>Cancelar</button>
                <button onClick={() => handleDelete(showConfirm!)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: 'rgba(248,113,113,0.15)', color: '#f87171', border: '1px solid rgba(248,113,113,0.3)' }}>Excluir</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {businesses.length === 0 ? (
        <motion.div {...fadeUp(0.1)} className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(124,110,247,0.1)', border: '1px solid rgba(124,110,247,0.2)' }}>
            <Building2 size={32} style={{ color: '#7c6ef7' }} />
          </div>
          <h2 className="text-xl font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>Nenhuma empresa ainda</h2>
          <p style={{ color: '#4a4a6a' }}>Crie sua primeira empresa para começar</p>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={openCreate} className="px-6 py-2.5 rounded-xl font-semibold text-sm"
            style={{ background: '#7c6ef7', color: 'white' }}>
            Criar empresa
          </motion.button>
        </motion.div>
      ) : (
        <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08 }}
          data-tour="empresas-lista">
          <AnimatePresence initial={false}>
            {businesses.map((biz, i) => (
              <motion.div key={biz.id}
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: i * 0.06 }}
                layout
                className="rounded-2xl p-5 flex flex-col gap-4"
                style={{
                  background: '#111118',
                  border: `1px solid ${activeBizId === biz.id ? 'rgba(124,110,247,0.4)' : '#1e1e2e'}`,
                  boxShadow: activeBizId === biz.id ? '0 0 20px rgba(124,110,247,0.1)' : 'none',
                }}>
                <div className="flex items-center gap-3">
                  <motion.div whileHover={{ scale: 1.08 }}
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
                    style={{ background: '#0d0d14', border: '1px solid #1e1e2e' }}>
                    {biz.logo_url ? <img src={biz.logo_url} alt={biz.name} className="w-full h-full object-cover" /> : <Building2 size={22} style={{ color: '#3a3a5c' }} />}
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold truncate" style={{ color: '#e8e8f0' }}>{biz.name}</p>
                      <AnimatePresence>
                        {activeBizId === biz.id && (
                          <motion.span initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                            className="text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0"
                            style={{ background: 'rgba(124,110,247,0.15)', color: '#9d8fff', border: '1px solid rgba(124,110,247,0.3)' }}>
                            Ativa
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: '#4a4a6a' }}>
                      {new Date(biz.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {activeBizId !== biz.id ? (
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      onClick={() => activateBiz(biz.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold"
                      style={{ background: 'rgba(124,110,247,0.1)', color: '#9d8fff', border: '1px solid rgba(124,110,247,0.2)' }}>
                      <Check size={12} /> Usar esta
                    </motion.button>
                  ) : (
                    <div className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold"
                      style={{ background: 'rgba(52,211,153,0.08)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }}>
                      <Check size={12} /> Em uso
                    </div>
                  )}
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    onClick={() => loadMembers(biz)}
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(251,191,36,0.1)', color: '#fbbf24' }}>
                    <Users size={13} />
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    onClick={() => openEdit(biz)}
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(124,110,247,0.1)', color: '#7c6ef7' }}>
                    <Pencil size={13} />
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    onClick={() => setShowConfirm(biz.id)}
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171' }}>
                    <Trash2 size={13} />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  )
}