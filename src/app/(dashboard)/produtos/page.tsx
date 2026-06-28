'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Package, Plus, Search, X, Edit2, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { SpotlightCard, ShimmerButton, Skeleton, BackgroundGrid, FloatingOrbs, AcernityFonts, GlowCorner } from '@/components/ui/aceternity'

const T = {
  bg: 'rgba(8,8,14,0.92)', bgDeep: 'rgba(6,6,10,0.97)',
  border: 'rgba(255,255,255,0.055)', borderP: 'rgba(124,110,247,0.22)',
  text: '#dcdcf0', sub: '#8a8aaa', muted: '#4a4a6a',
  green: '#34d399', amber: '#fbbf24', purple: '#7c6ef7',
  red: '#f87171', cyan: '#22d3ee', violet: '#a78bfa', blur: 'blur(20px)',
}
const card = { background: T.bg, border: `1px solid ${T.border}`, backdropFilter: T.blur, boxShadow: '0 4px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)' }
const inp: React.CSSProperties = { background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.border}`, color: T.text, borderRadius: 12, padding: '10px 14px', fontSize: 13, outline: 'none', width: '100%', transition: 'border-color 0.15s', fontFamily: 'DM Sans, sans-serif' }
const focus = (e: any) => e.currentTarget.style.borderColor = T.borderP
const blur  = (e: any) => e.currentTarget.style.borderColor = T.border
const fadeUp = (delay = 0) => ({ initial: { opacity: 0, y: 16, filter: 'blur(4px)' }, animate: { opacity: 1, y: 0, filter: 'blur(0px)' }, transition: { duration: 0.46, delay, ease: [0.16, 1, 0.3, 1] as const } })
const EMPTY = { name: '', price: '', cost: '', stock: '', category: '', description: '', active: true }

export default function ProdutosPage() {
  const supabase = createClient(); const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [biz, setBiz] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [search, setSearch] = useState(''); const [filterCat, setFilterCat] = useState('')
  const [showModal, setShowModal] = useState(false); const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState(EMPTY); const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/login'); return }
    const { data: owned } = await supabase.from('businesses').select('*').eq('owner_id', user.id)
    const business = (owned || [])[0]; if (!business) { setLoading(false); return }
    setBiz(business)
    const { data } = await supabase.from('products').select('*').eq('business_id', business.id).order('name')
    setProducts(data || []); setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    const payload = { name: form.name, price: parseFloat(form.price) || 0, cost: parseFloat(form.cost) || null, stock: parseInt(form.stock) || null, category: form.category || null, description: form.description || null, active: form.active, business_id: biz.id }
    if (editing) await supabase.from('products').update(payload).eq('id', editing.id)
    else await supabase.from('products').insert(payload)
    setSaving(false); setShowModal(false); setEditing(null); setForm(EMPTY); load()
  }
  async function handleDelete(id: string) { setDeleting(id); await supabase.from('products').delete().eq('id', id); setDeleting(null); load() }
  function openEdit(p: any) { setEditing(p); setForm({ name: p.name || '', price: String(p.price || ''), cost: String(p.cost || ''), stock: String(p.stock || ''), category: p.category || '', description: p.description || '', active: p.active !== false }); setShowModal(true) }

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))]
  const filtered = products.filter(p => (!search || p.name?.toLowerCase().includes(search.toLowerCase())) && (!filterCat || p.category === filterCat))
  const totalValue = products.reduce((a, p) => a + (Number(p.price) * (Number(p.stock) || 0)), 0)

  if (loading) return <><AcernityFonts /><BackgroundGrid><FloatingOrbs /><div className="flex flex-col gap-5"><Skeleton className="h-9 w-32 rounded-xl" /><div className="grid grid-cols-4 gap-3">{[0,1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div><div className="grid grid-cols-3 gap-4">{[0,1,2,3,4,5].map(i => <Skeleton key={i} className="h-40 rounded-2xl" />)}</div></div></BackgroundGrid></>

  return (
    <>
      <AcernityFonts />
      <BackgroundGrid>
        <FloatingOrbs />
        <div className="flex flex-col gap-5">

          <motion.div {...fadeUp(0)} className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Syne, sans-serif', color: T.text }}>Produtos</h1>
              <p className="text-sm mt-0.5" style={{ color: T.muted, fontFamily: 'DM Sans, sans-serif' }}>{products.length} produto{products.length !== 1 ? 's' : ''} cadastrado{products.length !== 1 ? 's' : ''}</p>
            </div>
            <ShimmerButton onClick={() => { setEditing(null); setForm(EMPTY); setShowModal(true) }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: 'linear-gradient(135deg, #7c6ef7, #a06ef7)', color: 'white', boxShadow: '0 0 28px rgba(124,110,247,0.45)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>
              <Plus size={15} /> Novo produto
            </ShimmerButton>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total',        value: products.length,                              color: T.violet, fmt: (v: number) => String(v) },
              { label: 'Ativos',       value: products.filter(p => p.active !== false).length, color: T.green,  fmt: (v: number) => String(v) },
              { label: 'Valor estoque', value: totalValue,                                  color: T.amber,  fmt: (v: number) => v >= 1e3 ? `R$ ${(v/1e3).toFixed(1)}k` : fmt(v) },
              { label: 'Categorias',   value: categories.length,                            color: T.cyan,   fmt: (v: number) => String(v) },
            ].map(({ label, value, color, fmt: f }, i) => (
              <motion.div key={label} {...fadeUp(0.06 + i * 0.05)}>
                <SpotlightCard className="rounded-2xl" spotlightColor={`${color}18`} style={card}>
                  <div className="p-4 relative overflow-hidden">
                    <GlowCorner color={`${color}20`} position="bottom-right" />
                    <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: T.muted, fontFamily: 'Syne, sans-serif', letterSpacing: '0.1em' }}>{label}</p>
                    <p className="text-2xl font-bold" style={{ fontFamily: 'Syne, sans-serif', color, textShadow: `0 0 20px ${color}55` }}>{f(value)}</p>
                  </div>
                </SpotlightCard>
              </motion.div>
            ))}
          </div>

          {/* Filters */}
          <motion.div {...fadeUp(0.2)} className="flex flex-wrap gap-2 items-center">
            <div className="flex items-center gap-2 flex-1 min-w-48 px-3 py-2 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.border}` }}>
              <Search size={13} style={{ color: T.muted }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar produto..."
                className="text-sm outline-none flex-1 bg-transparent" style={{ color: T.text, fontFamily: 'DM Sans, sans-serif' }} />
              {search && <motion.button whileTap={{ scale: 0.9 }} onClick={() => setSearch('')}><X size={13} style={{ color: T.muted }} /></motion.button>}
            </div>
            {categories.map(cat => (
              <button key={cat} onClick={() => setFilterCat(filterCat === cat ? '' : cat)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{ background: filterCat === cat ? `${T.violet}18` : 'rgba(255,255,255,0.03)', color: filterCat === cat ? T.violet : T.sub, border: `1px solid ${filterCat === cat ? `${T.violet}30` : T.border}`, cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'DM Sans, sans-serif' }}>
                {cat}
              </button>
            ))}
          </motion.div>

          {/* Grid */}
          {filtered.length === 0 ? (
            <motion.div {...fadeUp(0.25)} className="py-20 text-center">
              <Package size={40} className="mx-auto mb-4" style={{ color: T.muted }} />
              <p className="text-sm" style={{ color: T.muted, fontFamily: 'DM Sans, sans-serif' }}>Nenhum produto encontrado</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((p, i) => (
                <motion.div key={p.id} {...fadeUp(0.22 + i * 0.04)}>
                  <SpotlightCard className="rounded-2xl" spotlightColor={`${T.violet}14`}
                    style={{ ...card, opacity: p.active === false ? 0.6 : 1 }}>
                    <div className="p-5 relative overflow-hidden">
                      <GlowCorner color={`${T.violet}18`} position="top-right" />
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ background: `${T.violet}14`, border: `1px solid ${T.violet}28`, boxShadow: `0 0 14px ${T.violet}22` }}>
                          <Package size={16} style={{ color: T.violet }} strokeWidth={1.8} />
                        </div>
                        {p.active === false && (
                          <span className="text-xs px-2 py-0.5 rounded-lg"
                            style={{ background: `${T.red}12`, color: T.red, border: `1px solid ${T.red}25` }}>
                            Inativo
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-sm mb-0.5 truncate" style={{ color: T.text, fontFamily: 'DM Sans, sans-serif' }}>{p.name}</h3>
                      {p.category && <p className="text-xs mb-2" style={{ color: T.muted, fontFamily: 'DM Sans, sans-serif' }}>{p.category}</p>}
                      {p.description && <p className="text-xs mb-3 line-clamp-2" style={{ color: T.muted, fontFamily: 'DM Sans, sans-serif' }}>{p.description}</p>}
                      <div className="flex items-center justify-between mt-auto pt-3 border-t" style={{ borderColor: T.border }}>
                        <div>
                          <p className="text-lg font-bold" style={{ fontFamily: 'Syne, sans-serif', color: T.green, textShadow: `0 0 16px ${T.green}45` }}>
                            {fmt(Number(p.price))}
                          </p>
                          {p.stock !== null && p.stock !== undefined && (
                            <p className="text-xs" style={{ color: T.muted, fontFamily: 'DM Sans, sans-serif' }}>{p.stock} em estoque</p>
                          )}
                        </div>
                        <div className="flex gap-1.5">
                          <motion.button whileTap={{ scale: 0.88 }} onClick={() => openEdit(p)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: `${T.purple}14`, color: T.violet, cursor: 'pointer' }}>
                            <Edit2 size={13} />
                          </motion.button>
                          <motion.button whileTap={{ scale: 0.88 }} onClick={() => handleDelete(p.id)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: `${T.red}12`, color: T.red, cursor: 'pointer' }}>
                            {deleting === p.id ? <div className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" /> : <Trash2 size={13} />}
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </SpotlightCard>
                </motion.div>
              ))}
            </div>
          )}
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
                  <h2 className="font-bold text-lg" style={{ fontFamily: 'Syne, sans-serif', color: T.text }}>{editing ? 'Editar produto' : 'Novo produto'}</h2>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => { setShowModal(false); setEditing(null) }}
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.05)', color: T.sub, border: `1px solid ${T.border}`, cursor: 'pointer' }}>
                    <X size={14} />
                  </motion.button>
                </div>
                <form onSubmit={handleSave} className="flex flex-col gap-3">
                  <input placeholder="Nome do produto *" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inp} onFocus={focus} onBlur={blur} />
                  <div className="grid grid-cols-2 gap-3">
                    <input type="number" step="0.01" placeholder="Preço *" required value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} style={inp} onFocus={focus} onBlur={blur} />
                    <input type="number" step="0.01" placeholder="Custo" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} style={inp} onFocus={focus} onBlur={blur} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="number" placeholder="Estoque" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} style={inp} onFocus={focus} onBlur={blur} />
                    <input placeholder="Categoria" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={inp} onFocus={focus} onBlur={blur} />
                  </div>
                  <textarea placeholder="Descrição" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} style={{ ...inp, resize: 'none' }} onFocus={focus} onBlur={blur} />
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} style={{ accentColor: T.purple }} />
                    <span className="text-sm" style={{ color: T.sub, fontFamily: 'DM Sans, sans-serif' }}>Produto ativo</span>
                  </label>
                  <ShimmerButton type="submit" disabled={saving} className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm w-full mt-1"
                    style={{ background: 'linear-gradient(135deg, #7c6ef7, #a06ef7)', color: 'white', boxShadow: saving ? 'none' : '0 0 28px rgba(124,110,247,0.4)', border: '1px solid rgba(255,255,255,0.1)', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                    {saving ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : editing ? 'Salvar alterações' : 'Cadastrar produto'}
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
