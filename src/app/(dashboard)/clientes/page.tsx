'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Users, Plus, Search, X, Edit2, Trash2, Phone, Mail, MapPin } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { SpotlightCard, ShimmerButton, Skeleton, BackgroundGrid, FloatingOrbs, AcernityFonts, GlowCorner } from '@/components/ui/aceternity'

const T = {
  bg: 'rgba(8,8,14,0.92)', bgDeep: 'rgba(6,6,10,0.97)',
  border: 'rgba(255,255,255,0.055)', borderP: 'rgba(124,110,247,0.22)',
  text: '#dcdcf0', sub: '#8a8aaa', muted: '#4a4a6a',
  green: '#34d399', purple: '#7c6ef7', red: '#f87171', cyan: '#22d3ee', violet: '#a78bfa', blur: 'blur(20px)',
}
const card = { background: T.bg, border: `1px solid ${T.border}`, backdropFilter: T.blur, boxShadow: '0 4px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)' }
const inp: React.CSSProperties = { background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.border}`, color: T.text, borderRadius: 12, padding: '10px 14px', fontSize: 13, outline: 'none', width: '100%', transition: 'border-color 0.15s', fontFamily: 'DM Sans, sans-serif' }
const focus = (e: any) => e.currentTarget.style.borderColor = T.borderP
const blurEv = (e: any) => e.currentTarget.style.borderColor = T.border
const fadeUp = (delay = 0) => ({ initial: { opacity: 0, y: 16, filter: 'blur(4px)' }, animate: { opacity: 1, y: 0, filter: 'blur(0px)' }, transition: { duration: 0.46, delay, ease: [0.16, 1, 0.3, 1] as const } })
const EMPTY = { name: '', email: '', phone: '', address: '', notes: '', tags: '' }

export default function ClientesPage() {
  const supabase = createClient(); const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [biz, setBiz] = useState<any>(null)
  const [clients, setClients] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false); const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState(EMPTY); const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/login'); return }
    const { data: owned } = await supabase.from('businesses').select('*').eq('owner_id', user.id)
    const business = (owned || [])[0]; if (!business) { setLoading(false); return }
    setBiz(business)
    const { data } = await supabase.from('clients').select('*').eq('business_id', business.id).order('name')
    setClients(data || []); setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    const payload = { ...form, business_id: biz.id }
    if (editing) await supabase.from('clients').update(payload).eq('id', editing.id)
    else await supabase.from('clients').insert(payload)
    setSaving(false); setShowModal(false); setEditing(null); setForm(EMPTY); load()
  }
  async function handleDelete(id: string) { setDeleting(id); await supabase.from('clients').delete().eq('id', id); setDeleting(null); load() }
  function openEdit(c: any) { setEditing(c); setForm({ name: c.name || '', email: c.email || '', phone: c.phone || '', address: c.address || '', notes: c.notes || '', tags: c.tags || '' }); setShowModal(true) }

  const filtered = clients.filter(c => !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search))

  if (loading) return <><AcernityFonts /><BackgroundGrid><FloatingOrbs /><div className="flex flex-col gap-5"><div className="flex justify-between"><Skeleton className="h-9 w-32 rounded-xl" /><Skeleton className="h-10 w-36 rounded-xl" /></div><div className="grid grid-cols-3 gap-3">{[0,1,2].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div><Skeleton className="h-64 rounded-2xl" /></div></BackgroundGrid></>

  return (
    <>
      <AcernityFonts />
      <BackgroundGrid>
        <FloatingOrbs />
        <div className="flex flex-col gap-5">

          <motion.div {...fadeUp(0)} className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Syne, sans-serif', color: T.text }}>Clientes</h1>
              <p className="text-sm mt-0.5" style={{ color: T.muted, fontFamily: 'DM Sans, sans-serif' }}>{clients.length} cadastrado{clients.length !== 1 ? 's' : ''}</p>
            </div>
            <ShimmerButton onClick={() => { setEditing(null); setForm(EMPTY); setShowModal(true) }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: 'linear-gradient(135deg, #7c6ef7, #a06ef7)', color: 'white', boxShadow: '0 0 28px rgba(124,110,247,0.45)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>
              <Plus size={15} /> Novo cliente
            </ShimmerButton>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total',     value: clients.length, color: T.purple },
              { label: 'Este mês',  value: clients.filter(c => c.created_at?.startsWith(new Date().toISOString().slice(0,7))).length, color: T.green },
              { label: 'Com email', value: clients.filter(c => c.email).length, color: T.cyan },
            ].map(({ label, value, color }, i) => (
              <motion.div key={label} {...fadeUp(0.08 + i * 0.05)}>
                <SpotlightCard className="rounded-2xl" spotlightColor={`${color}18`} style={card}>
                  <div className="p-4 relative overflow-hidden">
                    <GlowCorner color={`${color}20`} position="bottom-right" />
                    <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: T.muted, fontFamily: 'Syne, sans-serif', letterSpacing: '0.1em' }}>{label}</p>
                    <p className="text-3xl font-bold" style={{ fontFamily: 'Syne, sans-serif', color, textShadow: `0 0 22px ${color}55` }}>{value}</p>
                  </div>
                </SpotlightCard>
              </motion.div>
            ))}
          </div>

          {/* List */}
          <motion.div {...fadeUp(0.2)}>
            <SpotlightCard className="rounded-2xl overflow-hidden" style={card}>
              <div className="p-4 border-b" style={{ borderColor: T.border }}>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.border}` }}>
                  <Search size={13} style={{ color: T.muted }} />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome, email ou telefone..."
                    className="text-sm outline-none flex-1 bg-transparent" style={{ color: T.text, fontFamily: 'DM Sans, sans-serif' }} />
                  {search && <motion.button whileTap={{ scale: 0.9 }} onClick={() => setSearch('')}><X size={13} style={{ color: T.muted }} /></motion.button>}
                </div>
              </div>

              {filtered.length === 0 ? (
                <div className="py-16 text-center">
                  <Users size={32} className="mx-auto mb-3" style={{ color: T.muted }} />
                  <p className="text-sm mb-1" style={{ color: T.muted, fontFamily: 'DM Sans, sans-serif' }}>{search ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}</p>
                  {!search && <p className="text-xs" style={{ color: T.muted, fontFamily: 'DM Sans, sans-serif' }}>Adicione seu primeiro cliente</p>}
                </div>
              ) : (
                <div>
                  {filtered.map((c, i) => (
                    <motion.div key={c.id}
                      initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.22, delay: i * 0.03 }}
                      className="flex items-center gap-4 px-5 py-4 group"
                      style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${T.border}` : 'none', transition: 'background 0.12s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold"
                        style={{ background: `${T.purple}14`, border: `1px solid ${T.purple}28`, color: T.violet, boxShadow: `0 0 14px ${T.purple}18`, fontFamily: 'Syne, sans-serif' }}>
                        {c.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold" style={{ color: T.text, fontFamily: 'DM Sans, sans-serif' }}>{c.name}</p>
                        <div className="flex items-center flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                          {c.email && <span className="text-xs flex items-center gap-1" style={{ color: T.muted, fontFamily: 'DM Sans, sans-serif' }}><Mail size={10} />{c.email}</span>}
                          {c.phone && <span className="text-xs flex items-center gap-1" style={{ color: T.muted, fontFamily: 'DM Sans, sans-serif' }}><Phone size={10} />{c.phone}</span>}
                          {c.address && <span className="text-xs flex items-center gap-1 truncate max-w-40" style={{ color: T.muted, fontFamily: 'DM Sans, sans-serif' }}><MapPin size={10} />{c.address}</span>}
                        </div>
                        {c.tags && (
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {c.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean).map((tag: string) => (
                              <span key={tag} className="text-xs px-1.5 py-0.5 rounded-md"
                                style={{ background: `${T.purple}12`, color: T.violet, border: `1px solid ${T.purple}22`, fontFamily: 'DM Sans, sans-serif' }}>
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <motion.button whileTap={{ scale: 0.88 }} onClick={() => openEdit(c)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ background: `${T.purple}14`, color: T.violet, cursor: 'pointer' }}>
                          <Edit2 size={13} />
                        </motion.button>
                        <motion.button whileTap={{ scale: 0.88 }} onClick={() => handleDelete(c.id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ background: `${T.red}12`, color: T.red, cursor: 'pointer' }}>
                          {deleting === c.id ? <div className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" /> : <Trash2 size={13} />}
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </SpotlightCard>
          </motion.div>
        </div>

        <AnimatePresence>
          {showModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
              style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)' }}
              onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
              <motion.div initial={{ y: 60, opacity: 0, scale: 0.97 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 60, opacity: 0 }}
                transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] as const }}
                className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6"
                style={{ background: T.bgDeep, border: `1px solid ${T.borderP}`, backdropFilter: 'blur(28px)', boxShadow: `0 0 0 1px rgba(124,110,247,0.08), 0 -8px 48px rgba(0,0,0,0.8)` }}>
                <div className="w-10 h-1 rounded-full mx-auto mb-5 sm:hidden" style={{ background: 'rgba(255,255,255,0.1)' }} />
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-bold text-lg" style={{ fontFamily: 'Syne, sans-serif', color: T.text }}>{editing ? 'Editar cliente' : 'Novo cliente'}</h2>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => { setShowModal(false); setEditing(null) }}
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.05)', color: T.sub, border: `1px solid ${T.border}`, cursor: 'pointer' }}>
                    <X size={14} />
                  </motion.button>
                </div>
                <form onSubmit={handleSave} className="flex flex-col gap-3">
                  <input placeholder="Nome *" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inp} onFocus={focus} onBlur={blurEv} />
                  <div className="grid grid-cols-2 gap-3">
                    <input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inp} onFocus={focus} onBlur={blurEv} />
                    <input placeholder="Telefone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={inp} onFocus={focus} onBlur={blurEv} />
                  </div>
                  <input placeholder="Endereço" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} style={inp} onFocus={focus} onBlur={blurEv} />
                  <input placeholder="Tags (separadas por vírgula)" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} style={inp} onFocus={focus} onBlur={blurEv} />
                  <textarea placeholder="Observações" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} style={{ ...inp, resize: 'none' }} onFocus={focus} onBlur={blurEv} />
                  <ShimmerButton type="submit" disabled={saving} className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm w-full mt-1"
                    style={{ background: 'linear-gradient(135deg, #7c6ef7, #a06ef7)', color: 'white', boxShadow: saving ? 'none' : '0 0 28px rgba(124,110,247,0.4)', border: '1px solid rgba(255,255,255,0.1)', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                    {saving ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : editing ? 'Salvar alterações' : 'Cadastrar cliente'}
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
