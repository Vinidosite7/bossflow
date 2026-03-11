'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useBusiness } from '@/hooks/useBusiness'
import { sendPush } from '@/lib/push'
import { useTour } from '@/hooks/useTour'
import { usePlanLimits } from '@/hooks/usePlanLimits'
import { TourTooltip } from "@/components/TourTooltip"
import { PlanGate } from '@/components/PlanGate'
import { Package, Plus, X, Pencil, Trash2, Search, BarChart2, AlertTriangle, Tag, Layers } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  SpotlightCard,
  ShimmerButton,
  Skeleton,
  BackgroundGrid,
  FloatingOrbs,
  GlowCorner,
} from '@/components/ui/bossflow-ui'

// ─── Design tokens ────────────────────────────────────────────
const T = {
  bg: 'rgba(8,8,14,0.92)', bgDeep: 'rgba(6,6,10,0.97)',
  border: 'rgba(255,255,255,0.055)', borderP: 'rgba(124,110,247,0.22)',
  text: '#dcdcf0', sub: '#8a8aaa', muted: '#4a4a6a',
  green: '#34d399', red: '#f87171', amber: '#fbbf24',
  purple: '#7c6ef7', violet: '#a78bfa', cyan: '#22d3ee',
  blur: 'blur(20px)',
}
const card = {
  background: T.bg,
  border: `1px solid ${T.border}`,
  backdropFilter: T.blur,
  boxShadow: '0 4px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)',
}
const inp: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: `1px solid ${T.border}`,
  color: T.text,
  borderRadius: 12,
  padding: '10px 14px',
  fontSize: 13,
  outline: 'none',
  width: '100%',
  transition: 'border-color 0.15s',
}
const lbl: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: T.muted,
  letterSpacing: '0.06em',
  fontFamily: 'Syne, sans-serif',
  textTransform: 'uppercase',
  marginBottom: 6,
  display: 'block',
}

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16, filter: 'blur(4px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  transition: { duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] as const },
})

const units = ['un', 'kg', 'l', 'm', 'cx', 'hr']

const TOUR_STEPS = [
  { target: '[data-tour="produtos-header"]', title: 'Catálogo de produtos', description: 'Cadastre seus produtos e serviços. Ficam disponíveis ao registrar vendas.', position: 'bottom' as const },
  { target: '[data-tour="produtos-busca"]', title: 'Busca rápida', description: 'Filtre produtos pelo nome instantaneamente.', position: 'bottom' as const },
  { target: '[data-tour="produtos-lista"]', title: 'Lista de produtos', description: 'Produtos com estoque abaixo de 5 unidades mostram alerta "Baixo" em vermelho.', position: 'top' as const },
]

// ─── Skeleton ─────────────────────────────────────────────────
function ProdutosSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-32 rounded-xl" />
          <Skeleton className="h-4 w-52 rounded-lg" />
        </div>
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>
      <Skeleton className="h-16 w-full rounded-2xl" />
      <Skeleton className="h-11 w-full rounded-xl" />
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  )
}

// ── FIX: supabase client criado fora do componente
const supabase = createClient()

export default function ProdutosPage() {
  const { businessId, loading: bizLoading } = useBusiness()
  const { plan } = usePlanLimits()
  const tour = useTour('produtos', TOUR_STEPS)

  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editProduct, setEditProduct] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [showConfirm, setShowConfirm] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', price: '', unit: 'un', stock: '' })

  async function load() {
    if (!businessId) return
    try {
      const { data } = await supabase.from('products').select('*').eq('business_id', businessId).order('name')
      setProducts(data || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { if (businessId) load() }, [businessId])
  useEffect(() => { if (!bizLoading && !businessId) setLoading(false) }, [bizLoading, businessId])

  function openCreate() {
    setEditProduct(null)
    setForm({ name: '', price: '', unit: 'un', stock: '' })
    setShowForm(true)
  }

  function openEdit(p: any) {
    setEditProduct(p)
    setForm({ name: p.name, price: String(p.price), unit: p.unit || 'un', stock: String(p.stock || '') })
    setShowForm(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        name: form.name, price: parseFloat(form.price),
        unit: form.unit, stock: form.stock ? parseInt(form.stock) : null,
      }
      if (editProduct) {
        const { error } = await supabase.from('products').update(payload).eq('id', editProduct.id)
        if (error) throw error
        if (payload.stock != null && payload.stock < 5) {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) await sendPush(user.id, '⚠️ Estoque baixo!', `${form.name} · ${payload.stock} unidades restantes`, '/produtos')
        }
      } else {
        const { error } = await supabase.from('products').insert({ ...payload, business_id: businessId, active: true })
        if (error) throw error
        const { data: { user } } = await supabase.auth.getUser()
        if (user) await sendPush(user.id, '📦 Produto cadastrado!', form.name, '/produtos')
      }
      setShowForm(false); setEditProduct(null); load()
    } catch (err: any) {
      console.error('[Produtos] save:', err)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    await supabase.from('products').delete().eq('id', id)
    setShowConfirm(null); load()
  }

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
  const lowStock = products.filter(p => p.stock != null && p.stock < 5).length

  if (loading || bizLoading) return (
    <BackgroundGrid><FloatingOrbs /><ProdutosSkeleton /></BackgroundGrid>
  )

  return (
    <BackgroundGrid>
      <FloatingOrbs />
      <div className="flex flex-col gap-5">

        <TourTooltip active={tour.active} step={tour.step} current={tour.current} total={tour.total} onNext={tour.next} onPrev={tour.prev} onFinish={tour.finish} />

        {/* ── Header ─────────────────────────────────────────── */}
        <motion.div {...fadeUp(0)} className="flex items-start justify-between gap-4" data-tour="produtos-header">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Syne, sans-serif', color: T.text }}>
              Produtos
            </h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  style={{ background: T.violet, animationDuration: '1.4s' }} />
                <span className="relative inline-flex rounded-full h-2 w-2"
                  style={{ background: T.violet, boxShadow: `0 0 6px ${T.violet}` }} />
              </div>
              <p className="text-sm" style={{ color: T.muted }}>
                {products.length} produto{products.length !== 1 ? 's' : ''} cadastrado{products.length !== 1 ? 's' : ''}
              </p>
              {lowStock > 0 && (
                <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: `${T.red}10`, color: T.red, border: `1px solid ${T.red}25` }}>
                  <AlertTriangle size={10} />
                  {lowStock} estoque baixo
                </motion.span>
              )}
            </div>
          </div>

          <ShimmerButton
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold shrink-0"
            style={{ background: 'linear-gradient(135deg, #7c6ef7 0%, #a06ef7 100%)', color: 'white', boxShadow: '0 0 28px rgba(124,110,247,0.45), inset 0 1px 0 rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>
            <Plus size={15} />
            <span className="hidden sm:inline">Novo produto</span>
            <span className="sm:hidden">Novo</span>
          </ShimmerButton>
        </motion.div>

        {/* ── PlanGate: Relatórios ────────────────────────────── */}
        <motion.div {...fadeUp(0.05)}>
          <PlanGate currentPlan={plan} requiredPlan="starter" feature="Relatórios de produtos"
            description="Veja os produtos mais vendidos, margem de lucro e análise de estoque." mode="hide">
            <SpotlightCard className="rounded-2xl" spotlightColor="rgba(124,110,247,0.08)" style={{ ...card, padding: 0 }}>
              <div className="flex items-center gap-3 px-4 py-3.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${T.purple}12`, border: `1px solid ${T.purple}22`, boxShadow: `0 0 14px ${T.purple}16` }}>
                  <BarChart2 size={15} style={{ color: T.violet }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: T.text }}>Análise de produtos</p>
                  <p className="text-xs mt-0.5" style={{ color: T.muted }}>Mais vendidos, margem e estoque crítico</p>
                </div>
                <span className="text-xs px-2 py-1 rounded-lg font-semibold"
                  style={{ background: `${T.green}10`, color: T.green, border: `1px solid ${T.green}22` }}>
                  Em breve
                </span>
              </div>
            </SpotlightCard>
          </PlanGate>
        </motion.div>

        {/* ── Busca ──────────────────────────────────────────── */}
        <motion.div {...fadeUp(0.08)} data-tour="produtos-busca">
          <SpotlightCard className="rounded-xl" spotlightColor="rgba(124,110,247,0.08)" style={{ ...card, padding: 0 }}>
            <div className="flex items-center gap-3 px-4 py-3">
              <Search size={14} style={{ color: T.muted, flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Buscar produto..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: T.text }}
              />
              <AnimatePresence>
                {search && (
                  <motion.button initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }}
                    onClick={() => setSearch('')}
                    className="w-5 h-5 rounded-md flex items-center justify-center"
                    style={{ color: T.muted, background: 'rgba(255,255,255,0.05)', border: `1px solid ${T.border}`, cursor: 'pointer' }}>
                    <X size={11} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </SpotlightCard>
        </motion.div>

        {/* ── Lista / Empty ───────────────────────────────────── */}
        {filtered.length === 0 ? (
          <motion.div {...fadeUp(0.12)} className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.18)', boxShadow: '0 0 32px rgba(167,139,250,0.1)' }}>
              <Package size={28} style={{ color: T.violet }} />
            </div>
            <h2 className="text-xl font-bold" style={{ fontFamily: 'Syne, sans-serif', color: T.text }}>
              {search ? 'Nenhum resultado' : 'Nenhum produto ainda'}
            </h2>
            <p className="text-sm" style={{ color: T.muted }}>
              {search ? 'Tente outro termo de busca' : 'Cadastre seu primeiro produto'}
            </p>
            {!search && (
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={openCreate}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold mt-2"
                style={{ background: `${T.violet}12`, color: T.violet, border: `1px solid ${T.violet}28`, cursor: 'pointer' }}>
                <Plus size={14} /> Adicionar produto
              </motion.button>
            )}
          </motion.div>
        ) : (
          <motion.div {...fadeUp(0.1)} data-tour="produtos-lista">
            <SpotlightCard className="rounded-2xl overflow-hidden" style={{ ...card, padding: 0 }}>
              {/* Cabeçalho */}
              <div className="flex items-center gap-3 px-5 py-3 border-b" style={{ borderColor: T.border }}>
                <span className="text-xs font-semibold uppercase tracking-widest flex-1"
                  style={{ color: T.muted, fontFamily: 'Syne, sans-serif', letterSpacing: '0.1em' }}>
                  {filtered.length} {filtered.length !== 1 ? 'produtos' : 'produto'}{search ? ` para "${search}"` : ''}
                </span>
              </div>

              <AnimatePresence initial={false}>
                {filtered.map((product, i) => (
                  <motion.div key={product.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12, height: 0, overflow: 'hidden' }}
                    transition={{ duration: 0.22, delay: i * 0.03 }}
                    className="flex items-center gap-3 px-5 py-3.5"
                    style={{ borderBottom: i < filtered.length - 1 ? `1px solid rgba(255,255,255,0.035)` : 'none', transition: 'background 0.12s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.018)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                    {/* Ícone */}
                    <motion.div whileHover={{ rotate: 8, scale: 1.08 }}
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${T.violet}12`, border: `1px solid ${T.violet}22`, boxShadow: `0 0 12px ${T.violet}10` }}>
                      <Package size={14} style={{ color: T.violet }} />
                    </motion.div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: T.text }}>{product.name}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="flex items-center gap-1 text-xs" style={{ color: T.muted }}>
                          <Tag size={9} />
                          {fmt(product.price)} / {product.unit}
                        </span>
                        {product.stock != null && (
                          <span className="flex items-center gap-1 text-xs" style={{ color: T.muted }}>
                            <Layers size={9} />
                            Estoque: {product.stock}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Preço */}
                    <span className="text-sm font-bold shrink-0 tabular-nums hidden sm:block"
                      style={{ fontFamily: 'Syne, sans-serif', color: T.green, textShadow: `0 0 14px ${T.green}40` }}>
                      {fmt(product.price)}
                    </span>

                    {/* Badge estoque baixo */}
                    {product.stock != null && product.stock < 5 && (
                      <motion.span initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold shrink-0"
                        style={{ background: `${T.red}10`, color: T.red, border: `1px solid ${T.red}25` }}>
                        <AlertTriangle size={9} /> Baixo
                      </motion.span>
                    )}

                    {/* Ações */}
                    <div className="flex gap-2 shrink-0">
                      <motion.button whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.9 }}
                        onClick={() => openEdit(product)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: `${T.purple}10`, color: T.purple, border: `1px solid ${T.purple}22`, cursor: 'pointer' }}>
                        <Pencil size={12} />
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.9 }}
                        onClick={() => setShowConfirm(product.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: `${T.red}10`, color: T.red, border: `1px solid ${T.red}22`, cursor: 'pointer' }}>
                        <Trash2 size={12} />
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </SpotlightCard>
          </motion.div>
        )}

        {/* ── Modal: Form ─────────────────────────────────────── */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
              style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)' }}
              onClick={e => { if (e.target === e.currentTarget) { setShowForm(false); setEditProduct(null) } }}>

              <motion.div
                initial={{ y: 60, opacity: 0, scale: 0.97 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 60, opacity: 0 }}
                transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] as const }}
                className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6"
                style={{ background: T.bgDeep, border: `1px solid ${T.borderP}`, boxShadow: '0 0 0 1px rgba(124,110,247,0.08), 0 -8px 48px rgba(0,0,0,0.8)', backdropFilter: 'blur(28px)' }}>

                <div className="w-10 h-1 rounded-full mx-auto mb-5 sm:hidden" style={{ background: 'rgba(255,255,255,0.1)' }} />

                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{ background: `${T.violet}14`, border: `1px solid ${T.violet}28` }}>
                      <Package size={14} style={{ color: T.violet }} />
                    </div>
                    <h2 className="font-bold text-lg" style={{ fontFamily: 'Syne, sans-serif', color: T.text }}>
                      {editProduct ? 'Editar produto' : 'Novo produto'}
                    </h2>
                  </div>
                  <motion.button whileTap={{ scale: 0.9 }}
                    onClick={() => { setShowForm(false); setEditProduct(null) }}
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.05)', color: T.sub, border: `1px solid ${T.border}`, cursor: 'pointer' }}>
                    <X size={14} />
                  </motion.button>
                </div>

                <form onSubmit={handleSave} className="flex flex-col gap-3">
                  <div>
                    <label style={lbl}>Nome do produto *</label>
                    <input type="text" placeholder="Ex: Bolo de cenoura" value={form.name} required
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      style={inp}
                      onFocus={e => e.currentTarget.style.borderColor = T.borderP}
                      onBlur={e => e.currentTarget.style.borderColor = T.border} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label style={lbl}>Preço *</label>
                      <input type="number" step="0.01" placeholder="0,00" value={form.price} required
                        onChange={e => setForm({ ...form, price: e.target.value })}
                        style={inp}
                        onFocus={e => e.currentTarget.style.borderColor = T.borderP}
                        onBlur={e => e.currentTarget.style.borderColor = T.border} />
                    </div>
                    <div>
                      <label style={lbl}>Unidade</label>
                      <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}
                        style={{ ...inp, cursor: 'pointer' }}>
                        {units.map(u => <option key={u} value={u} style={{ background: '#0d0d14' }}>{u}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={lbl}>Estoque <span style={{ color: T.muted, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(opcional)</span></label>
                    <input type="number" placeholder="Quantidade em estoque" value={form.stock}
                      onChange={e => setForm({ ...form, stock: e.target.value })}
                      style={inp}
                      onFocus={e => e.currentTarget.style.borderColor = T.borderP}
                      onBlur={e => e.currentTarget.style.borderColor = T.border} />
                  </div>

                  <ShimmerButton type="submit" disabled={saving}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm w-full mt-1"
                    style={{ background: 'linear-gradient(135deg, #7c6ef7, #a06ef7)', color: 'white', boxShadow: saving ? 'none' : '0 0 28px rgba(124,110,247,0.4)', border: '1px solid rgba(255,255,255,0.1)', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                    {saving
                      ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      : editProduct ? 'Salvar alterações' : 'Criar produto'}
                  </ShimmerButton>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Modal: Confirmar exclusão ───────────────────────── */}
        <AnimatePresence>
          {showConfirm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)' }}>
              <motion.div
                initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] as const }}
                className="w-full max-w-sm rounded-2xl p-6"
                style={{ background: T.bgDeep, border: `1px solid rgba(248,113,113,0.22)`, boxShadow: '0 0 0 1px rgba(248,113,113,0.06), 0 24px 64px rgba(0,0,0,0.8)' }}>

                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)' }}>
                  <Trash2 size={20} style={{ color: T.red }} />
                </div>

                <h2 className="font-bold text-lg text-center mb-2" style={{ fontFamily: 'Syne, sans-serif', color: T.text }}>
                  Excluir produto?
                </h2>
                <p className="text-sm text-center mb-6" style={{ color: T.muted }}>
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
                    style={{ background: 'rgba(248,113,113,0.12)', color: T.red, border: '1px solid rgba(248,113,113,0.28)', cursor: 'pointer' }}>
                    Excluir
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </BackgroundGrid>
  )
}
