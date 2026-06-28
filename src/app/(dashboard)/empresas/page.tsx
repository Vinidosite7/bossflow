'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import {
  Building2, Plus, Users, Crown, Shield, User,
  Edit2, Check, X, Copy, Mail, Trash2, ExternalLink,
  MapPin, Globe, Hash, Briefcase, ChevronRight,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  SpotlightCard, ShimmerButton, Skeleton,
  BackgroundGrid, FloatingOrbs, AcernityFonts, GlowCorner,
} from '@/components/ui/aceternity'

/* ─── design tokens ─────────────────────────── */
const T = {
  bg: 'rgba(8,8,14,0.92)', bgDeep: 'rgba(6,6,10,0.97)',
  border: 'rgba(255,255,255,0.055)', borderP: 'rgba(124,110,247,0.22)',
  text: '#dcdcf0', sub: '#8a8aaa', muted: '#4a4a6a',
  green: '#34d399', amber: '#fbbf24', purple: '#7c6ef7',
  red: '#f87171', cyan: '#22d3ee', violet: '#a78bfa', orange: '#f97316',
  blur: 'blur(20px)',
}
const card   = { background: T.bg, border: `1px solid ${T.border}`, backdropFilter: T.blur, boxShadow: '0 4px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)' }
const inp: React.CSSProperties = { background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.border}`, color: T.text, borderRadius: 12, padding: '10px 14px', fontSize: 13, outline: 'none', width: '100%', transition: 'border-color 0.15s', fontFamily: 'DM Sans, sans-serif' }
const lbl: React.CSSProperties = { fontSize: 11, color: T.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, display: 'block', fontFamily: 'Syne, sans-serif' }
const focusIn  = (e: any) => e.currentTarget.style.borderColor = T.borderP
const focusOut = (e: any) => e.currentTarget.style.borderColor = T.border
const fadeUp   = (delay = 0) => ({ initial: { opacity: 0, y: 16, filter: 'blur(4px)' }, animate: { opacity: 1, y: 0, filter: 'blur(0px)' }, transition: { duration: 0.46, delay, ease: [0.16, 1, 0.3, 1] as const } })

const ROLE_MAP: Record<string, { label: string; color: string; icon: any }> = {
  owner:  { label: 'Dono',       color: T.amber,  icon: Crown  },
  admin:  { label: 'Admin',      color: T.violet, icon: Shield },
  member: { label: 'Membro',     color: T.cyan,   icon: User   },
  viewer: { label: 'Visualizar', color: T.sub,    icon: User   },
}

export default function EmpresasPage() {
  const supabase = createClient()
  const router   = useRouter()

  const [loading, setLoading]     = useState(true)
  const [businesses, setBusinesses] = useState<any[]>([])
  const [members, setMembers]     = useState<any[]>([])
  const [selectedBiz, setSelectedBiz] = useState<any>(null)
  const [editMode, setEditMode]   = useState(false)
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [inviting, setInviting]   = useState(false)
  const [copied, setCopied]       = useState(false)
  const [tab, setTab]             = useState<'info' | 'equipe'>('info')
  const [userId, setUserId]       = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '', segment: '', cnpj: '', address: '', website: '', phone: '', description: '',
  })

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/login'); return }
    setUserId(user.id)

    const { data: owned } = await supabase.from('businesses').select('*').eq('owner_id', user.id)
    const { data: memberships } = await supabase.from('business_members')
      .select('business_id, role').eq('user_id', user.id).in('status', ['accepted', 'active'])
    const memberBizIds = (memberships || []).map((m: any) => m.business_id)
      .filter((id: string) => !(owned || []).find((o: any) => o.id === id))
    let memberBizzes: any[] = []
    if (memberBizIds.length > 0) {
      const { data: bd } = await supabase.from('businesses').select('*').in('id', memberBizIds)
      memberBizzes = bd || []
    }
    const all = [...(owned || []), ...memberBizzes]
    setBusinesses(all)

    const active = all[0]
    if (active) {
      setSelectedBiz(active)
      fillForm(active)
      await loadMembers(active.id)
    }
    setLoading(false)
  }

  async function loadMembers(bizId: string) {
    const { data } = await supabase.from('business_members')
      .select('*, profiles(full_name, email)')
      .eq('business_id', bizId)
      .order('created_at')
    setMembers(data || [])
  }

  function fillForm(b: any) {
    setForm({
      name: b.name || '', segment: b.segment || '', cnpj: b.cnpj || '',
      address: b.address || '', website: b.website || '', phone: b.phone || '',
      description: b.description || '',
    })
  }

  useEffect(() => { load() }, [])

  async function handleSave() {
    if (!selectedBiz) return
    setSaving(true)
    await supabase.from('businesses').update(form).eq('id', selectedBiz.id)
    setSaving(false); setSaved(true); setEditMode(false)
    setTimeout(() => setSaved(false), 2000)
    load()
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault(); setInviting(true)
    await supabase.from('business_members').insert({
      business_id: selectedBiz.id, email: inviteEmail,
      role: inviteRole, status: 'pending',
    })
    setInviting(false); setShowInvite(false); setInviteEmail('')
    loadMembers(selectedBiz.id)
  }

  async function handleRemoveMember(memberId: string) {
    await supabase.from('business_members').delete().eq('id', memberId)
    loadMembers(selectedBiz.id)
  }

  function copyId() {
    navigator.clipboard.writeText(selectedBiz?.id || '')
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  const isOwner = selectedBiz?.owner_id === userId

  if (loading) return (
    <><AcernityFonts /><BackgroundGrid><FloatingOrbs />
      <div className="flex flex-col gap-5">
        <Skeleton className="h-9 w-40 rounded-xl" />
        <div className="grid grid-cols-3 gap-3">{[0,1,2].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    </BackgroundGrid></>
  )

  return (
    <>
      <AcernityFonts />
      <BackgroundGrid>
        <FloatingOrbs />
        <div className="flex flex-col gap-5">

          {/* Header */}
          <motion.div {...fadeUp(0)} className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Syne, sans-serif', color: T.text }}>
                Empresas
              </h1>
              <p className="text-sm mt-0.5" style={{ color: T.muted, fontFamily: 'DM Sans, sans-serif' }}>
                {businesses.length} empresa{businesses.length !== 1 ? 's' : ''} vinculada{businesses.length !== 1 ? 's' : ''}
              </p>
            </div>
            <AnimatePresence>
              {saved && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold"
                  style={{ background: `${T.green}12`, color: T.green, border: `1px solid ${T.green}28` }}>
                  <Check size={14} /> Salvo!
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Empresas',  value: businesses.length, color: T.violet },
              { label: 'Membros',   value: members.length,    color: T.cyan   },
              { label: 'Segmento',  value: selectedBiz?.segment || '—', color: T.amber, isText: true },
              { label: 'Status',    value: 'Ativo', color: T.green, isText: true },
            ].map(({ label, value, color, isText }, i) => (
              <motion.div key={label} {...fadeUp(0.06 + i * 0.05)}>
                <SpotlightCard className="rounded-2xl" spotlightColor={`${color}18`} style={card}>
                  <div className="p-4 relative overflow-hidden">
                    <GlowCorner color={`${color}20`} position="bottom-right" />
                    <p className="text-xs font-semibold uppercase tracking-widest mb-2"
                      style={{ color: T.muted, fontFamily: 'Syne, sans-serif', letterSpacing: '0.1em' }}>{label}</p>
                    <p className={isText ? 'text-base font-bold truncate' : 'text-2xl font-bold'}
                      style={{ fontFamily: 'Syne, sans-serif', color, textShadow: `0 0 20px ${color}55` }}>
                      {value}
                    </p>
                  </div>
                </SpotlightCard>
              </motion.div>
            ))}
          </div>

          {/* Business selector (se tiver mais de uma) */}
          {businesses.length > 1 && (
            <motion.div {...fadeUp(0.18)} className="flex gap-2 flex-wrap">
              {businesses.map(biz => (
                <button key={biz.id} onClick={() => { setSelectedBiz(biz); fillForm(biz); loadMembers(biz.id); setEditMode(false) }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold"
                  style={{
                    background: selectedBiz?.id === biz.id ? `${T.purple}18` : 'rgba(255,255,255,0.03)',
                    color: selectedBiz?.id === biz.id ? T.violet : T.muted,
                    border: `1px solid ${selectedBiz?.id === biz.id ? `${T.purple}30` : T.border}`,
                    cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'DM Sans, sans-serif',
                  }}>
                  <Building2 size={13} />
                  {biz.name}
                </button>
              ))}
            </motion.div>
          )}

          {selectedBiz && (
            <motion.div {...fadeUp(0.22)}>
              <SpotlightCard className="rounded-2xl overflow-hidden" style={card}>

                {/* Card header */}
                <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: T.border }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: `${T.amber}14`, border: `1px solid ${T.amber}28`, boxShadow: `0 0 14px ${T.amber}22` }}>
                      <Building2 size={16} style={{ color: T.amber }} strokeWidth={1.8} />
                    </div>
                    <div>
                      <p className="font-bold text-sm" style={{ color: T.text, fontFamily: 'Syne, sans-serif' }}>{selectedBiz.name}</p>
                      <p className="text-xs" style={{ color: T.muted, fontFamily: 'DM Sans, sans-serif' }}>{selectedBiz.segment || 'Sem segmento'}</p>
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="flex gap-1">
                    {(['info', 'equipe'] as const).map(t => (
                      <button key={t} onClick={() => setTab(t)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                        style={{ background: tab === t ? `${T.purple}18` : 'rgba(255,255,255,0.03)', color: tab === t ? T.violet : T.muted, border: `1px solid ${tab === t ? `${T.purple}30` : T.border}`, cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'DM Sans, sans-serif' }}>
                        {t === 'info' ? 'Informações' : 'Equipe'}
                      </button>
                    ))}
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {tab === 'info' && (
                    <motion.div key="info" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
                      className="p-6">

                      {/* ID copy */}
                      <div className="flex items-center gap-2 mb-6 px-3 py-2.5 rounded-xl"
                        style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.border}` }}>
                        <Hash size={12} style={{ color: T.muted }} />
                        <span className="text-xs font-mono flex-1 truncate" style={{ color: T.muted }}>{selectedBiz.id}</span>
                        <motion.button whileTap={{ scale: 0.9 }} onClick={copyId}
                          className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg"
                          style={{ background: copied ? `${T.green}12` : `${T.purple}12`, color: copied ? T.green : T.violet, cursor: 'pointer', transition: 'all 0.2s' }}>
                          {copied ? <Check size={11} /> : <Copy size={11} />}
                          {copied ? 'Copiado' : 'Copiar ID'}
                        </motion.button>
                      </div>

                      {editMode ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="sm:col-span-2">
                            <label style={lbl}>Nome da empresa</label>
                            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inp} onFocus={focusIn} onBlur={focusOut} />
                          </div>
                          <div>
                            <label style={lbl}>Segmento</label>
                            <input value={form.segment} onChange={e => setForm({ ...form, segment: e.target.value })} placeholder="Ex: Confeitaria" style={inp} onFocus={focusIn} onBlur={focusOut} />
                          </div>
                          <div>
                            <label style={lbl}>CNPJ</label>
                            <input value={form.cnpj} onChange={e => setForm({ ...form, cnpj: e.target.value })} placeholder="00.000.000/0001-00" style={inp} onFocus={focusIn} onBlur={focusOut} />
                          </div>
                          <div>
                            <label style={lbl}>Telefone</label>
                            <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="(00) 00000-0000" style={inp} onFocus={focusIn} onBlur={focusOut} />
                          </div>
                          <div>
                            <label style={lbl}>Website</label>
                            <input value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} placeholder="https://..." style={inp} onFocus={focusIn} onBlur={focusOut} />
                          </div>
                          <div className="sm:col-span-2">
                            <label style={lbl}>Endereço</label>
                            <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Rua, número, cidade" style={inp} onFocus={focusIn} onBlur={focusOut} />
                          </div>
                          <div className="sm:col-span-2">
                            <label style={lbl}>Descrição</label>
                            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3}
                              style={{ ...inp, resize: 'none' }} onFocus={focusIn} onBlur={focusOut} />
                          </div>
                          <div className="sm:col-span-2 flex gap-2">
                            <ShimmerButton onClick={handleSave} disabled={saving}
                              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
                              style={{ background: 'linear-gradient(135deg, #7c6ef7, #a06ef7)', color: 'white', boxShadow: '0 0 24px rgba(124,110,247,0.38)', border: '1px solid rgba(255,255,255,0.1)', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                              {saving ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <Check size={14} />}
                              Salvar
                            </ShimmerButton>
                            <button onClick={() => { setEditMode(false); fillForm(selectedBiz) }}
                              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
                              style={{ background: 'rgba(255,255,255,0.04)', color: T.sub, border: `1px solid ${T.border}`, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                              <X size={14} /> Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                            {[
                              { icon: Briefcase, label: 'Segmento',  value: selectedBiz.segment,     color: T.amber  },
                              { icon: Hash,      label: 'CNPJ',      value: selectedBiz.cnpj,         color: T.violet },
                              { icon: MapPin,    label: 'Endereço',  value: selectedBiz.address,      color: T.cyan   },
                              { icon: Globe,     label: 'Website',   value: selectedBiz.website,      color: T.green  },
                            ].map(({ icon: Icon, label, value, color }) => (
                              <div key={label} className="flex items-start gap-3 p-3.5 rounded-xl"
                                style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${T.border}` }}>
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                                  style={{ background: `${color}12`, border: `1px solid ${color}22` }}>
                                  <Icon size={13} style={{ color }} />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs mb-0.5" style={{ color: T.muted, fontFamily: 'Syne, sans-serif', letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: 10 }}>{label}</p>
                                  {value ? (
                                    label === 'Website' ? (
                                      <a href={value} target="_blank" rel="noopener noreferrer"
                                        className="text-sm font-medium flex items-center gap-1 truncate"
                                        style={{ color: T.green, fontFamily: 'DM Sans, sans-serif' }}>
                                        {value} <ExternalLink size={10} />
                                      </a>
                                    ) : (
                                      <p className="text-sm font-medium truncate" style={{ color: T.text, fontFamily: 'DM Sans, sans-serif' }}>{value}</p>
                                    )
                                  ) : (
                                    <p className="text-sm" style={{ color: T.muted, fontFamily: 'DM Sans, sans-serif' }}>Não informado</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>

                          {selectedBiz.description && (
                            <div className="mb-6 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${T.border}` }}>
                              <p className="text-xs mb-1" style={{ color: T.muted, fontFamily: 'Syne, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 10 }}>Descrição</p>
                              <p className="text-sm" style={{ color: T.sub, fontFamily: 'DM Sans, sans-serif', lineHeight: 1.6 }}>{selectedBiz.description}</p>
                            </div>
                          )}

                          {isOwner && (
                            <button onClick={() => setEditMode(true)}
                              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
                              style={{ background: `${T.purple}12`, color: T.violet, border: `1px solid ${T.purple}25`, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                              <Edit2 size={13} /> Editar informações
                            </button>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )}

                  {tab === 'equipe' && (
                    <motion.div key="equipe" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>

                      {/* Owner row */}
                      <div className="px-5 py-4 flex items-center gap-3 border-b" style={{ borderColor: T.border }}>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm"
                          style={{ background: `${T.amber}14`, border: `1px solid ${T.amber}28`, color: T.amber, fontFamily: 'Syne, sans-serif' }}>
                          {selectedBiz.owner_email?.charAt(0)?.toUpperCase() || 'O'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium" style={{ color: T.text, fontFamily: 'DM Sans, sans-serif' }}>
                            {selectedBiz.owner_email || 'Proprietário'}
                            {selectedBiz.owner_id === userId && <span className="ml-1.5 text-xs" style={{ color: T.muted }}>(você)</span>}
                          </p>
                          <p className="text-xs" style={{ color: T.muted, fontFamily: 'DM Sans, sans-serif' }}>Proprietário da empresa</p>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-lg font-semibold shrink-0"
                          style={{ background: `${T.amber}14`, color: T.amber, border: `1px solid ${T.amber}28`, fontFamily: 'DM Sans, sans-serif' }}>
                          <Crown size={10} className="inline mr-1" />Dono
                        </span>
                      </div>

                      {/* Members */}
                      {members.map((m, i) => {
                        const roleInfo = ROLE_MAP[m.role] || ROLE_MAP.member
                        const RoleIcon = roleInfo.icon
                        const isPending = m.status === 'pending'
                        return (
                          <motion.div key={m.id}
                            initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2, delay: i * 0.04 }}
                            className="px-5 py-3.5 flex items-center gap-3 group"
                            style={{ borderBottom: i < members.length - 1 ? `1px solid rgba(255,255,255,0.04)` : 'none', transition: 'background 0.12s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm"
                              style={{ background: `${roleInfo.color}12`, border: `1px solid ${roleInfo.color}25`, color: roleInfo.color, fontFamily: 'Syne, sans-serif', opacity: isPending ? 0.6 : 1 }}>
                              {(m.profiles?.full_name || m.email || '?').charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate" style={{ color: T.text, fontFamily: 'DM Sans, sans-serif' }}>
                                {m.profiles?.full_name || m.email || 'Convidado'}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs" style={{ color: T.muted, fontFamily: 'DM Sans, sans-serif' }}>{m.email}</span>
                                {isPending && (
                                  <span className="text-xs px-1.5 py-0.5 rounded"
                                    style={{ background: `${T.amber}12`, color: T.amber, border: `1px solid ${T.amber}22`, fontFamily: 'DM Sans, sans-serif' }}>
                                    Pendente
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="text-xs px-2 py-0.5 rounded-lg font-semibold shrink-0"
                              style={{ background: `${roleInfo.color}12`, color: roleInfo.color, border: `1px solid ${roleInfo.color}25`, fontFamily: 'DM Sans, sans-serif' }}>
                              <RoleIcon size={10} className="inline mr-1" />{roleInfo.label}
                            </span>
                            {isOwner && (
                              <motion.button whileTap={{ scale: 0.88 }} onClick={() => handleRemoveMember(m.id)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                style={{ background: `${T.red}12`, color: T.red, cursor: 'pointer' }}>
                                <Trash2 size={12} />
                              </motion.button>
                            )}
                          </motion.div>
                        )
                      })}

                      {members.length === 0 && (
                        <div className="py-12 text-center">
                          <Users size={28} className="mx-auto mb-3" style={{ color: T.muted }} />
                          <p className="text-sm" style={{ color: T.muted, fontFamily: 'DM Sans, sans-serif' }}>Nenhum membro adicionado</p>
                        </div>
                      )}

                      {/* Invite button */}
                      {isOwner && (
                        <div className="px-5 py-4 border-t" style={{ borderColor: T.border }}>
                          <ShimmerButton onClick={() => setShowInvite(true)}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
                            style={{ background: 'linear-gradient(135deg, #7c6ef7, #a06ef7)', color: 'white', boxShadow: '0 0 24px rgba(124,110,247,0.35)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>
                            <Plus size={14} /> Convidar membro
                          </ShimmerButton>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </SpotlightCard>
            </motion.div>
          )}
        </div>

        {/* Invite modal */}
        <AnimatePresence>
          {showInvite && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
              style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)' }}
              onClick={e => { if (e.target === e.currentTarget) setShowInvite(false) }}>
              <motion.div initial={{ y: 60, opacity: 0, scale: 0.97 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 60, opacity: 0 }}
                transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] as const }}
                className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6"
                style={{ background: T.bgDeep, border: `1px solid ${T.borderP}`, backdropFilter: 'blur(28px)', boxShadow: `0 0 0 1px rgba(124,110,247,0.08), 0 -8px 48px rgba(0,0,0,0.8)` }}>
                <div className="w-10 h-1 rounded-full mx-auto mb-5 sm:hidden" style={{ background: 'rgba(255,255,255,0.1)' }} />
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-bold text-lg" style={{ fontFamily: 'Syne, sans-serif', color: T.text }}>Convidar membro</h2>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowInvite(false)}
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.05)', color: T.sub, border: `1px solid ${T.border}`, cursor: 'pointer' }}>
                    <X size={14} />
                  </motion.button>
                </div>
                <form onSubmit={handleInvite} className="flex flex-col gap-4">
                  <div>
                    <label style={lbl}>Email do convidado</label>
                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.border}` }}>
                      <Mail size={13} style={{ color: T.muted }} />
                      <input type="email" required value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                        placeholder="email@exemplo.com" className="flex-1 bg-transparent text-sm outline-none"
                        style={{ color: T.text, fontFamily: 'DM Sans, sans-serif' }} />
                    </div>
                  </div>
                  <div>
                    <label style={lbl}>Permissão</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['member', 'admin', 'viewer'] as const).map(r => {
                        const info = ROLE_MAP[r]; const RI = info.icon
                        return (
                          <button key={r} type="button" onClick={() => setInviteRole(r)}
                            className="flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-semibold"
                            style={{ background: inviteRole === r ? `${info.color}15` : 'rgba(255,255,255,0.03)', color: inviteRole === r ? info.color : T.muted, border: `1px solid ${inviteRole === r ? `${info.color}35` : T.border}`, cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'DM Sans, sans-serif' }}>
                            <RI size={14} />
                            {info.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  <ShimmerButton type="submit" disabled={inviting}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm w-full mt-1"
                    style={{ background: 'linear-gradient(135deg, #7c6ef7, #a06ef7)', color: 'white', boxShadow: inviting ? 'none' : '0 0 28px rgba(124,110,247,0.4)', border: '1px solid rgba(255,255,255,0.1)', cursor: inviting ? 'not-allowed' : 'pointer', opacity: inviting ? 0.7 : 1 }}>
                    {inviting ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <>Enviar convite</>}
                  </ShimmerButton>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </BackgroundGrid>
    </>
  )
}
