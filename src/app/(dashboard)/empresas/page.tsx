'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useTour } from '@/hooks/useTour'
import { usePlanLimits } from '@/hooks/usePlanLimits'
import { TourTooltip } from "@/components/TourTooltip"
import { Building2, Plus, X, Pencil, Trash2, Upload, Check, Users, Crown, Shield, Eye, UserMinus, Lock, Copy, Link2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { SpotlightCard, ShimmerButton, Skeleton, GlowCorner } from '@/components/ui/bossflow-ui'

// ── Design System ──────────────────────────────────────────────────────────
import { T, card, inp, inpLg, inpSm, SYNE } from '@/lib/design'
import { fadeUp, scaleIn } from '@/lib/animations'

import { PageBackground, SectionHeader, FormModal, ModalSubmitButton } from '@/components/core'
const ROLE_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  owner:  { label: 'Dono',         color: T.amber,  icon: Crown  },
  admin:  { label: 'Admin',        color: T.purple, icon: Shield },
  member: { label: 'Membro',       color: T.green,  icon: Users  },
  viewer: { label: 'Visualizador', color: T.muted,  icon: Eye    },
}

const TOUR_STEPS = [
  { target: '[data-tour="empresas-header"]', title: 'Suas empresas', description: 'Gerencie múltiplas empresas no BossFlow. Alterne entre elas pelo botão "Usar esta".', position: 'bottom' as const },
  { target: '[data-tour="empresas-lista"]',  title: 'Cards de empresa', description: 'A empresa ativa aparece com borda roxa. Clique em 👥 para gerenciar membros.', position: 'top' as const },
]

function EmpresasSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-2"><Skeleton className="h-8 w-36 rounded-xl" /><Skeleton className="h-4 w-52 rounded-lg" /></div>
        <Skeleton className="h-10 w-40 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[0,1,2].map(i => <Skeleton key={i} className="h-40 rounded-2xl" />)}
      </div>
    </div>
  )
}

// ── FIX: supabase client criado fora do componente (evita recriação a cada render)
const supabase = createClient()

export default function EmpresasPage() {
  const { plan, loading: planLoading, limits } = usePlanLimits()
  const tour = useTour('empresas', TOUR_STEPS)

  const [businesses, setBusinesses]     = useState<any[]>([])
  const [loading, setLoading]           = useState(true)
  const [showForm, setShowForm]         = useState(false)
  const [editBiz, setEditBiz]           = useState<any>(null)
  const [saving, setSaving]             = useState(false)
  const [name, setName]                 = useState('')
  const [logoFile, setLogoFile]         = useState<File | null>(null)
  const [logoPreview, setLogoPreview]   = useState('')
  const [showConfirm, setShowConfirm]   = useState<string | null>(null)
  const [activeBizId, setActiveBizId]   = useState<string>('')
  const [membersModal, setMembersModal] = useState<any | null>(null)
  const [members, setMembers]           = useState<any[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [inviteEmail, setInviteEmail]   = useState('')
  const [inviteRole, setInviteRole]     = useState('member')
  const [sendingInvite, setSendingInvite] = useState(false)
  const [inviteSuccess, setInviteSuccess] = useState(false)
  const [inviteUrl, setInviteUrl]       = useState('')
  const [copied, setCopied]             = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string>('')

  useEffect(() => { if (typeof window !== 'undefined') setActiveBizId(localStorage.getItem('activeBizId') || '') }, [])

  async function load() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      setCurrentUserId(user.id)
      const { data: owned } = await supabase.from('businesses').select('*').eq('owner_id', user.id).order('created_at', { ascending: false })
      const { data: memberships } = await supabase.from('business_members').select('business_id, role').eq('user_id', user.id).in('status', ['accepted', 'active'])
      const memberBizIds = (memberships || []).map((m: any) => m.business_id).filter((id: string) => !(owned || []).find((o: any) => o.id === id))
      let memberBizzes: any[] = []
      if (memberBizIds.length > 0) {
        const { data: bizData } = await supabase.from('businesses').select('*').in('id', memberBizIds)
        memberBizzes = (bizData || []).map((b: any) => ({ ...b, _memberRole: memberships?.find((m: any) => m.business_id === b.id)?.role }))
      }
      const all = [...(owned || []), ...memberBizzes]
      setBusinesses(all)
      const saved = typeof window !== 'undefined' ? localStorage.getItem('activeBizId') : null
      if (!saved && all[0]) { localStorage.setItem('activeBizId', all[0].id); setActiveBizId(all[0].id) }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function loadMembers(biz: any) {
    setLoadingMembers(true); setMembersModal(biz); setInviteEmail(''); setInviteRole('member')
    setInviteSuccess(false); setInviteUrl(''); setCopied(false)
    try {
      const { data } = await supabase.from('business_members').select('*').eq('business_id', biz.id).order('created_at', { ascending: true })
      setMembers(data || [])
    } catch (err) { console.error(err) }
    finally { setLoadingMembers(false) }
  }

  async function handleInvite() {
    if (!membersModal || !inviteEmail) return
    setSendingInvite(true); setInviteSuccess(false); setInviteUrl('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res  = await fetch('/api/invite/create', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` }, body: JSON.stringify({ email: inviteEmail, role: inviteRole, businessId: membersModal.id }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao gerar convite')
      setInviteUrl(data.inviteUrl); setInviteSuccess(true); setInviteEmail('')
      const { data: membersData } = await supabase.from('business_members').select('*').eq('business_id', membersModal.id).order('created_at', { ascending: true })
      setMembers(membersData || [])
    } catch (err: any) { console.error(err) }
    finally { setSendingInvite(false) }
  }

  async function handleCopy() { if (!inviteUrl) return; await navigator.clipboard.writeText(inviteUrl); setCopied(true); setTimeout(() => setCopied(false), 2500) }
  async function handleRemoveMember(memberId: string) { if (!confirm('Remover este membro?')) return; await supabase.from('business_members').update({ status: 'removed' }).eq('id', memberId); loadMembers(membersModal) }

  function openCreate() { setEditBiz(null); setName(''); setLogoFile(null); setLogoPreview(''); setShowForm(true) }
  function openEdit(biz: any) { setEditBiz(biz); setName(biz.name); setLogoFile(null); setLogoPreview(biz.logo_url || ''); setShowForm(true) }
  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) { const file = e.target.files?.[0]; if (!file) return; setLogoFile(file); setLogoPreview(URL.createObjectURL(file)) }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      let logo_url = editBiz?.logo_url || null
      if (logoFile) {
        const ext = logoFile.name.split('.').pop()
        const path = `logos/${user.id}-${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage.from('business-logos').upload(path, logoFile, { upsert: true })
        if (!uploadError) { const { data: urlData } = supabase.storage.from('business-logos').getPublicUrl(path); logo_url = urlData.publicUrl }
      }
      if (editBiz) { await supabase.from('businesses').update({ name, logo_url }).eq('id', editBiz.id) }
      else {
        const { data: newBiz, error: insertErr } = await supabase.from('businesses').insert({ name, logo_url, owner_id: user.id }).select().single()
        if (insertErr) throw insertErr
        if (newBiz) { localStorage.setItem('activeBizId', newBiz.id); setActiveBizId(newBiz.id) }
      }
      setShowForm(false); setEditBiz(null); load()
    } catch (err: any) { console.error('[Empresas] save:', err) } finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    await supabase.from('businesses').delete().eq('id', id)
    if (activeBizId === id) { localStorage.removeItem('activeBizId'); setActiveBizId('') }
    setShowConfirm(null); load()
  }

  function activateBiz(id: string) { localStorage.setItem('activeBizId', id); setActiveBizId(id); window.location.reload() }

  const ownedCount = businesses.filter((b: any) => !b._memberRole).length
  const planLimit  = limits.businesses
  const atLimit    = ownedCount >= planLimit

  if (loading) return <PageBackground><EmpresasSkeleton /></PageBackground>

  return (
    <PageBackground>
      <div className="flex flex-col gap-5">
        <TourTooltip active={tour.active} step={tour.step} current={tour.current} total={tour.total} onNext={tour.next} onPrev={tour.prev} onFinish={tour.finish} />

        {/* Header */}
        <SectionHeader
          title="Empresas"
          subtitle={`${businesses.length} ${businesses.length === 1 ? 'empresa cadastrada' : 'empresas cadastradas'}${planLimit !== Infinity ? ` · máx ${planLimit} no plano atual` : ''}`}
          live liveColor={T.purple}
          cta={atLimit ? undefined : { label: 'Nova empresa', labelMobile: 'Nova', icon: Plus, onClick: () => setShowModal(true) }}
          tourId="empresas-header"
        />

        {/* Alerta de limite */}
        {atLimit && (
          <motion.div {...fadeUp(0.05)}>
            <SpotlightCard className="rounded-xl" spotlightColor={`${T.purple}08`} style={{ ...card, padding: 0 }}>
              <div className="flex items-center gap-3 px-4 py-3.5">
                <Lock size={14} style={{ color: T.violet }} />
                <p className="text-sm flex-1" style={{ color: T.violet }}>
                  Limite de {planLimit} empresa{planLimit > 1 ? 's' : ''} atingido no plano {plan}.
                </p>
                <a href="/assinatura" className="text-xs font-bold px-2.5 py-1.5 rounded-lg shrink-0"
                  style={{ background: `${T.purple}14`, color: T.violet, border: `1px solid ${T.purple}28` }}>
                  Fazer upgrade
                </a>
              </div>
            </SpotlightCard>
          </motion.div>
        )}

        {/* Empty */}
        {businesses.length === 0 ? (
          <motion.div {...fadeUp(0.1)} className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: `${T.purple}08`, border: `1px solid ${T.purple}18`, boxShadow: `0 0 32px ${T.purple}10` }}>
              <Building2 size={28} style={{ color: T.purple }} />
            </div>
            <h2 className="text-xl font-bold" style={{ fontFamily: SYNE, color: T.text }}>Nenhuma empresa ainda</h2>
            <p className="text-sm" style={{ color: T.muted }}>Crie sua primeira empresa para começar</p>
            <ShimmerButton onClick={openCreate} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm mt-2"
              style={{ background: 'linear-gradient(135deg, #7c6ef7, #a06ef7)', color: 'white', boxShadow: '0 0 24px rgba(124,110,247,0.4)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>
              <Plus size={14} /> Criar empresa
            </ShimmerButton>
          </motion.div>
        ) : (
          <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08 }}
            data-tour="empresas-lista">
            <AnimatePresence initial={false}>
              {businesses.map((biz, i) => {
                const isActive = activeBizId === biz.id
                return (
                  <motion.div key={biz.id}
                    initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3, delay: i * 0.06 }} layout>
                    <SpotlightCard className="rounded-2xl h-full" spotlightColor={isActive ? `${T.purple}10` : 'rgba(124,110,247,0.06)'}
                      style={{ ...card, border: `1px solid ${isActive ? `${T.purple}38` : T.border}`, boxShadow: isActive ? `0 0 24px ${T.purple}12, 0 4px 32px rgba(0,0,0,0.4)` : '0 4px 32px rgba(0,0,0,0.4)', padding: 0 }}>
                      <div className="p-5 flex flex-col gap-4 relative overflow-hidden h-full">
                        {isActive && <GlowCorner color={`${T.purple}18`} position="bottom-right" />}

                        {/* Info */}
                        <div className="flex items-center gap-3" style={{ position: 'relative', zIndex: 1 }}>
                          <motion.div whileHover={{ scale: 1.06 }}
                            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
                            style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}` }}>
                            {biz.logo_url
                              ? <img src={biz.logo_url} alt={biz.name} className="w-full h-full object-cover" />
                              : <Building2 size={20} style={{ color: T.muted }} />}
                          </motion.div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold truncate" style={{ color: T.text, fontFamily: SYNE }}>{biz.name}</p>
                              <AnimatePresence>
                                {isActive && (
                                  <motion.span initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                                    className="text-xs px-1.5 py-0.5 rounded-full font-semibold shrink-0"
                                    style={{ background: `${T.purple}18`, color: T.violet, border: `1px solid ${T.purple}30` }}>
                                    Ativa
                                  </motion.span>
                                )}
                              </AnimatePresence>
                              {biz._memberRole && (
                                <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold shrink-0"
                                  style={{ background: `${T.green}10`, color: T.green, border: `1px solid ${T.green}22` }}>
                                  {ROLE_CONFIG[biz._memberRole]?.label ?? biz._memberRole}
                                </span>
                              )}
                            </div>
                            <p className="text-xs mt-0.5" style={{ color: T.muted }}>
                              {new Date(biz.created_at).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2" style={{ position: 'relative', zIndex: 1 }}>
                          {!isActive ? (
                            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => activateBiz(biz.id)}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold"
                              style={{ background: `${T.purple}10`, color: T.violet, border: `1px solid ${T.purple}25`, cursor: 'pointer' }}>
                              <Check size={12} /> Usar esta
                            </motion.button>
                          ) : (
                            <div className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold"
                              style={{ background: `${T.green}08`, color: T.green, border: `1px solid ${T.green}20` }}>
                              <Check size={12} /> Em uso
                            </div>
                          )}
                          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => loadMembers(biz)}
                            className="w-8 h-8 rounded-xl flex items-center justify-center"
                            style={{ background: `${T.amber}10`, color: T.amber, border: `1px solid ${T.amber}22`, cursor: 'pointer' }}>
                            <Users size={13} />
                          </motion.button>
                          {!biz._memberRole && (
                            <>
                              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => openEdit(biz)}
                                className="w-8 h-8 rounded-xl flex items-center justify-center"
                                style={{ background: `${T.purple}10`, color: T.purple, border: `1px solid ${T.purple}22`, cursor: 'pointer' }}>
                                <Pencil size={13} />
                              </motion.button>
                              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setShowConfirm(biz.id)}
                                className="w-8 h-8 rounded-xl flex items-center justify-center"
                                style={{ background: `${T.red}10`, color: T.red, border: `1px solid ${T.red}22`, cursor: 'pointer' }}>
                                <Trash2 size={13} />
                              </motion.button>
                            </>
                          )}
                        </div>
                      </div>
                    </SpotlightCard>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Modal Form empresa */}
                <FormModal
          open={showForm}
          onClose={() => { setShowForm(false); setEditBiz(null) }}
          title={editBiz ? 'Editar empresa' : 'Nova empresa'}
          size="sm"
        >
          <form onSubmit={handleSave} className="flex flex-col gap-5">
            <div className="flex flex-col items-center gap-3">
              <motion.div whileHover={{ scale: 1.04 }}
                className="w-24 h-24 rounded-2xl flex items-center justify-center overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.03)', border: `2px dashed ${T.border}` }}>
                {logoPreview ? <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" /> : <Building2 size={32} style={{ color: T.muted }} />}
              </motion.div>
              <label className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer"
                style={{ background: `${T.purple}10`, color: T.violet, border: `1px solid ${T.purple}22` }}>
                <Upload size={11} /> {logoPreview ? 'Trocar logo' : 'Enviar logo'}
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
              </label>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: T.muted, letterSpacing: '0.06em', fontFamily: SYNE, textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>
                Nome da empresa
              </label>
              <input type="text" placeholder="Ex: Minha Loja" value={name} onChange={e => setName(e.target.value)} required
                style={inp} onFocus={e => e.currentTarget.style.borderColor = T.borderP} onBlur={e => e.currentTarget.style.borderColor = T.border} />
            </div>
            <ModalSubmitButton loading={saving}>Salvar</ModalSubmitButton>
          </form>
        </FormModal>

        {/* Modal Membros */}
        <FormModal
          open={!!membersModal}
          onClose={() => setMembersModal(null)}
          title="Membros da empresa"
          size="md"
        >
          <div className="flex flex-col gap-4">
            {/* Lista membros */}
            <div className="flex flex-col gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: T.muted, fontFamily: SYNE, letterSpacing: '0.1em' }}>Membros</h3>
              {loadingMembers ? (
                <div className="flex justify-center py-8"><div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: T.purple, borderTopColor: 'transparent' }} /></div>
              ) : members.length === 0 ? (
                <p className="text-sm py-4 text-center" style={{ color: T.muted }}>Nenhum membro ainda.</p>
              ) : members.map((m, i) => {
                const cfg   = ROLE_CONFIG[m.role] ?? ROLE_CONFIG.member
                const Icon  = cfg.icon
                const isMe  = m.user_id === currentUserId
                const isActive = m.status === 'accepted' || m.status === 'active'
                return (
                  <motion.div key={m.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${T.border}` }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                      style={{ background: `${cfg.color}14`, color: cfg.color, fontFamily: SYNE }}>
                      {(m.email?.[0] ?? '?').toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: T.text }}>
                        {m.email} {isMe && <span style={{ color: T.muted }}>(você)</span>}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="flex items-center gap-1 text-xs" style={{ color: cfg.color }}>
                          <Icon size={9} /> {cfg.label}
                        </span>
                        <span className="text-xs px-1.5 py-0.5 rounded-md"
                          style={{ background: isActive ? `${T.green}08` : m.status === 'pending' ? `${T.amber}08` : `${T.red}08`, color: isActive ? T.green : m.status === 'pending' ? T.amber : T.red }}>
                          {isActive ? 'Ativo' : m.status === 'pending' ? 'Pendente' : 'Removido'}
                        </span>
                      </div>
                    </div>
                    {!isMe && m.role !== 'owner' && m.status !== 'removed' && (
                      <div className="flex gap-1.5 shrink-0">
                        <select value={m.role}
                          onChange={async e => { await supabase.from('business_members').update({ role: e.target.value }).eq('id', m.id); loadMembers(membersModal) }}
                          className="text-xs px-2 py-1 rounded-lg outline-none cursor-pointer"
                          style={{ background: 'rgba(255,255,255,0.04)', color: T.violet, border: `1px solid ${T.border}` }}>
                          <option value="admin" style={{ background: '#0d0d14' }}>Admin</option>
                          <option value="member" style={{ background: '#0d0d14' }}>Membro</option>
                          <option value="viewer" style={{ background: '#0d0d14' }}>Visualizador</option>
                        </select>
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => handleRemoveMember(m.id)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: `${T.red}10`, color: T.red, border: `1px solid ${T.red}22`, cursor: 'pointer' }}>
                          <UserMinus size={12} />
                        </motion.button>
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </div>
        </FormModal>

        {/* Modal Confirm */}
                <FormModal
          open={!!showConfirm}
          onClose={() => setShowConfirm(null)}
          title="Excluir empresa?"
          size="sm"
        >
          <p className="text-sm text-center mb-5" style={{ color: T.muted }}>
            Esta ação não pode ser desfeita.
          </p>
          <div className="flex gap-3">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => setShowConfirm(null)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}`, color: T.sub, cursor: 'pointer' }}>
              Cancelar
            </motion.button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => handleDelete(showConfirm!)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: `${T.red}12`, color: T.red, border: `1px solid ${T.red}28`, cursor: 'pointer' }}>
              Excluir
            </motion.button>
          </div>
        </FormModal>
      </div>
    </PageBackground>
  )
}
