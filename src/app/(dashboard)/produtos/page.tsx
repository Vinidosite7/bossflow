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
import { SpotlightCard, ShimmerButton, Skeleton, GlowCorner } from '@/components/ui/bossflow-ui'

// ── Design System ──────────────────────────────────────────────────────────
import { T, card, inp, inpLg, inpSm, SYNE } from '@/lib/design'
import { fadeUp, scaleIn } from '@/lib/animations'

import { PageBackground, SectionHeader, FilterBar, FormModal, ModalSubmitButton } from '@/components/core'
const lbl: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: T.muted,
  letterSpacing: '0.06em',
  fontFamily: SYNE,
  textTransform: 'uppercase',
  marginBottom: 6,
  display: 'block',
}

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
    <PageBackground><ProdutosSkeleton /></PageBackground>
  )

  return (
    <PageBackground>
      <div className="flex flex-col gap-5">

        <TourTooltip active={tour.active} step={tour.step} current={tour.current} total={tour.total} onNext={tour.next} onPrev={tour.prev} onFinish={tour.finish} />

        {/* ── Header ─────────────────────────────────────────── */}
        <SectionHeader
          title="Produtos"
          subtitle={`${products.length} produto${products.length !== 1 ? 's' : ''} cadastrado${products.length !== 1 ? 's' : ''}`}
          live liveColor={T.violet}
          cta={{ label: 'Novo produto', labelMobile: 'Novo', icon: Plus, onClick: openCreate }}
          tourId="produtos-header"
        />

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
          <FilterBar
            value={search}
            onChange={setSearch}
            placeholder="Buscar produto..."
          />
        </motion.div>

        {/* ── Lista / Empty ───────────────────────────────────── */}
        {filtered.length === 0 ? (
          <motion.div {...fadeUp(0.12)} className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.18)', boxShadow: '0 0 32px rgba(167,139,250,0.1)' }}>
              <Package size={28} style={{ color: T.violet }} />
            </div>
            <h2 className="text-xl font-bold" style={{ fontFamily: SYNE, color: T.text }}>
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
                  style={{ color: T.muted, fontFamily: SYNE, letterSpacing: '0.1em' }}>
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
                      style={{ fontFamily: SYNE, color: T.green, textShadow: `0 0 14px ${T.green}40` }}>
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
                <FormModal
          open={showForm}
          onClose={() => { setShowForm(false); setEditProduct(null) }}
          title={editProduct ? 'Editar produto' : 'Novo produto'}
          size="sm"
        >
          <form onSubmit={handleSave} className="flex flex-col gap-4">
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

            <ModalSubmitButton loading={saving}>
              editProduct ? 'Salvar alterações' : 'Criar produto'
            </ModalSubmitButton>
          </form>
        </FormModal>

        {/* ── Modal: Confirmar exclusão ───────────────────────── */}
                <FormModal
          open={!!showConfirm}
          onClose={() => setShowConfirm(null)}
          title="Excluir produto?"
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
