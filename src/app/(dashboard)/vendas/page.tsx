'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useBusiness } from '@/hooks/useBusiness'
import { ShoppingCart, Plus, Loader2, X, Pencil, Trash2, Search } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay, ease: [0.25, 0.46, 0.45, 0.94] as const }
})

const statusConfig = {
  pending: { label: 'Pendente', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
  paid: { label: 'Pago', color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
  cancelled: { label: 'Cancelado', color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
}

export default function VendasPage() {
  const supabase = createClient()
  const { businessId, loading: bizLoading } = useBusiness()
  const [sales, setSales] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editSale, setEditSale] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [showConfirm, setShowConfirm] = useState<string | null>(null)
  const [form, setForm] = useState({ client_id: '', status: 'pending', date: new Date().toISOString().split('T')[0], notes: '' })
  const [items, setItems] = useState([{ product_id: '', name: '', quantity: 1, unit_price: 0 }])

  async function load() {
    if (!businessId) return
    try {
      const [{ data: s }, { data: c }, { data: p }] = await Promise.all([
        supabase.from('sales').select('*, clients(name), sale_items(*)').eq('business_id', businessId).order('date', { ascending: false }),
        supabase.from('clients').select('*').eq('business_id', businessId).order('name'),
        supabase.from('products').select('*').eq('business_id', businessId).order('name'),
      ])
      setSales(s || [])
      setClients(c || [])
      setProducts(p || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { if (businessId) load() }, [businessId])
  useEffect(() => { if (!bizLoading && !businessId) setLoading(false) }, [bizLoading, businessId])

  function openCreate() {
    setEditSale(null)
    setForm({ client_id: '', status: 'pending', date: new Date().toISOString().split('T')[0], notes: '' })
    setItems([{ product_id: '', name: '', quantity: 1, unit_price: 0 }])
    setShowForm(true)
  }

  async function openEdit(sale: any) {
    setEditSale(sale)
    setForm({ client_id: sale.client_id || '', status: sale.status, date: sale.date, notes: sale.notes || '' })
    const { data: saleItems } = await supabase.from('sale_items').select('*').eq('sale_id', sale.id)
    setItems(saleItems?.length ? saleItems.map((i: any) => ({ product_id: i.product_id || '', name: i.name, quantity: i.quantity, unit_price: i.unit_price })) : [{ product_id: '', name: '', quantity: 1, unit_price: 0 }])
    setShowForm(true)
  }

  function addItem() { setItems([...items, { product_id: '', name: '', quantity: 1, unit_price: 0 }]) }
  function removeItem(i: number) { setItems(items.filter((_, idx) => idx !== i)) }

  function updateItem(i: number, field: string, value: any) {
    const updated = [...items]
    updated[i] = { ...updated[i], [field]: value }
    if (field === 'product_id') {
      const p = products.find(p => p.id === value)
      if (p) { updated[i].name = p.name; updated[i].unit_price = p.price }
    }
    setItems(updated)
  }

  const total = items.reduce((a, i) => a + (Number(i.unit_price) * Number(i.quantity)), 0)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (editSale) {
      await supabase.from('sales').update({ client_id: form.client_id || null, status: form.status, date: form.date, notes: form.notes || null, total }).eq('id', editSale.id)
      await supabase.from('sale_items').delete().eq('sale_id', editSale.id)
      await supabase.from('sale_items').insert(items.filter(i => i.name).map(i => ({ sale_id: editSale.id, ...i, product_id: i.product_id || null })))
    } else {
      const { data: sale } = await supabase.from('sales').insert({ client_id: form.client_id || null, status: form.status, date: form.date, notes: form.notes || null, total, business_id: businessId, created_by: user?.id }).select().single()
      if (sale) await supabase.from('sale_items').insert(items.filter(i => i.name).map(i => ({ sale_id: sale.id, ...i, product_id: i.product_id || null })))
    }
    setShowForm(false); setEditSale(null); setSaving(false); load()
  }

  async function handleDelete(id: string) {
    await supabase.from('sale_items').delete().eq('sale_id', id)
    await supabase.from('sales').delete().eq('id', id)
    setShowConfirm(null); load()
  }

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const totalPaid = sales.filter(s => s.status === 'paid').reduce((a, s) => a + Number(s.total), 0)
  const filtered = sales.filter(s =>
    s.clients?.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.status.toLowerCase().includes(search.toLowerCase())
  )

  if (loading || bizLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: '#7c6ef7', borderTopColor: 'transparent' }} />
    </div>
  )

  return (
    <div className="flex flex-col gap-6">
      <motion.div {...fadeUp(0)} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>Vendas</h1>
          <p className="text-sm mt-1" style={{ color: '#4a4a6a' }}>{sales.length} vendas registradas</p>
        </div>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ background: '#7c6ef7', color: 'white', boxShadow: '0 0 20px rgba(124,110,247,0.3)' }}>
          <Plus size={15} /> <span className="hidden sm:inline">Nova venda</span><span className="sm:hidden">Novo</span>
        </motion.button>
      </motion.div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Recebido', value: fmt(totalPaid), color: '#34d399' },
          { label: 'Pagas', value: String(sales.filter(s => s.status === 'paid').length), color: '#34d399' },
          { label: 'Pendentes', value: String(sales.filter(s => s.status === 'pending').length), color: '#fbbf24' },
        ].map(({ label, value, color }, i) => (
          <motion.div key={label} {...fadeUp(0.08 + i * 0.06)}
            className="rounded-2xl p-3 sm:p-4" style={{ background: '#111118', border: '1px solid #1e1e2e' }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#4a4a6a' }}>{label}</p>
            <p className="text-lg sm:text-2xl font-bold leading-tight" style={{ fontFamily: 'Syne, sans-serif', color }}>{value}</p>
          </motion.div>
        ))}
      </div>

      {/* Search */}
      <motion.div {...fadeUp(0.22)}
        className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl"
        style={{ background: '#111118', border: '1px solid #1e1e2e' }}>
        <Search size={14} style={{ color: '#4a4a6a' }} />
        <input type="text" placeholder="Buscar por cliente ou status..." value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-transparent text-sm outline-none" style={{ color: '#e8e8f0' }} />
        <AnimatePresence>
          {search && (
            <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => setSearch('')} style={{ color: '#4a4a6a' }}>
              <X size={13} />
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            style={{ background: 'rgba(0,0,0,0.8)' }}
            onClick={e => { if (e.target === e.currentTarget) { setShowForm(false); setEditSale(null) } }}>
            <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as const }}
              className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl border p-6 max-h-[90vh] overflow-y-auto"
              style={{ background: '#111118', borderColor: '#1e1e2e' }}>
              <div className="w-10 h-1 rounded-full mx-auto mb-5 sm:hidden" style={{ background: '#2a2a3e' }} />
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-lg" style={{ fontFamily: 'Syne, sans-serif' }}>{editSale ? 'Editar venda' : 'Nova venda'}</h2>
                <button onClick={() => { setShowForm(false); setEditSale(null) }} style={{ color: '#4a4a6a' }}><X size={18} /></button>
              </div>
              <form onSubmit={handleSave} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium" style={{ color: '#6b6b8a' }}>Cliente</label>
                    <select value={form.client_id} onChange={e => setForm({ ...form, client_id: e.target.value })}
                      className="px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ background: '#0d0d14', borderColor: '#1e1e2e', color: '#e8e8f0' }}>
                      <option value="">Sem cliente</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium" style={{ color: '#6b6b8a' }}>Data</label>
                    <input type="date" value={form.date} required onChange={e => setForm({ ...form, date: e.target.value })}
                      className="px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ background: '#0d0d14', borderColor: '#1e1e2e', color: '#e8e8f0' }} />
                  </div>
                </div>
                <div className="flex gap-2">
                  {Object.entries(statusConfig).map(([key, { label, color }]) => (
                    <button key={key} type="button" onClick={() => setForm({ ...form, status: key })}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                      style={{
                        background: form.status === key ? `${color}20` : '#0d0d14',
                        color: form.status === key ? color : '#4a4a6a',
                        border: `1px solid ${form.status === key ? color : '#1e1e2e'}`,
                      }}>
                      {label}
                    </button>
                  ))}
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-medium" style={{ color: '#6b6b8a' }}>Itens</label>
                  <AnimatePresence initial={false}>
                    {items.map((item, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
                        className="flex gap-2 items-center">
                        <select value={item.product_id} onChange={e => updateItem(i, 'product_id', e.target.value)}
                          className="flex-1 px-2 py-2 rounded-xl border text-xs outline-none" style={{ background: '#0d0d14', borderColor: '#1e1e2e', color: '#e8e8f0' }}>
                          <option value="">Produto</option>
                          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        {!item.product_id && (
                          <input type="text" placeholder="Nome" value={item.name} onChange={e => updateItem(i, 'name', e.target.value)}
                            className="flex-1 px-2 py-2 rounded-xl border text-xs outline-none" style={{ background: '#0d0d14', borderColor: '#1e1e2e', color: '#e8e8f0' }} />
                        )}
                        <input type="number" step="0.01" placeholder="R$" value={item.unit_price} onChange={e => updateItem(i, 'unit_price', e.target.value)}
                          className="w-20 px-2 py-2 rounded-xl border text-xs outline-none" style={{ background: '#0d0d14', borderColor: '#1e1e2e', color: '#e8e8f0' }} />
                        <input type="number" min="1" placeholder="Qtd" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)}
                          className="w-14 px-2 py-2 rounded-xl border text-xs outline-none" style={{ background: '#0d0d14', borderColor: '#1e1e2e', color: '#e8e8f0' }} />
                        {items.length > 1 && (
                          <motion.button whileTap={{ scale: 0.9 }} type="button" onClick={() => removeItem(i)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                            style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171' }}>
                            <X size={12} />
                          </motion.button>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  <button type="button" onClick={addItem} className="flex items-center gap-1.5 text-xs font-medium py-1" style={{ color: '#7c6ef7' }}>
                    <Plus size={12} /> Adicionar item
                  </button>
                </div>
                <textarea placeholder="Observações (opcional)" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2}
                  className="px-3 py-2.5 rounded-xl border text-sm outline-none resize-none" style={{ background: '#0d0d14', borderColor: '#1e1e2e', color: '#e8e8f0' }} />
                <div className="flex items-center justify-between py-3 border-t" style={{ borderColor: '#1e1e2e' }}>
                  <span className="text-sm font-medium" style={{ color: '#6b6b8a' }}>Total</span>
                  <motion.span key={total} initial={{ scale: 1.1, color: '#9d8fff' }} animate={{ scale: 1, color: '#34d399' }}
                    className="text-xl font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>{fmt(total)}</motion.span>
                </div>
                <button type="submit" disabled={saving}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm"
                  style={{ background: '#7c6ef7', color: 'white' }}>
                  {saving ? <Loader2 size={16} className="animate-spin" /> : editSale ? 'Salvar alterações' : 'Registrar venda'}
                </button>
              </form>
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
              <h2 className="font-bold text-lg mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>Excluir venda?</h2>
              <p className="text-sm mb-6" style={{ color: '#6b6b8a' }}>Esta ação não pode ser desfeita.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowConfirm(null)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: '#0d0d14', border: '1px solid #1e1e2e', color: '#6b6b8a' }}>Cancelar</button>
                <button onClick={() => handleDelete(showConfirm)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: 'rgba(248,113,113,0.15)', color: '#f87171', border: '1px solid rgba(248,113,113,0.3)' }}>Excluir</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {filtered.length === 0 ? (
        <motion.div {...fadeUp(0.28)} className="flex flex-col items-center justify-center py-24 gap-4">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.4, delay: 0.3 }}
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(124,110,247,0.1)', border: '1px solid rgba(124,110,247,0.2)' }}>
            <ShoppingCart size={32} style={{ color: '#7c6ef7' }} />
          </motion.div>
          <h2 className="text-xl font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>
            {search ? 'Nenhum resultado' : 'Nenhuma venda ainda'}
          </h2>
          <p style={{ color: '#4a4a6a' }}>{search ? 'Tente outro termo' : 'Registre sua primeira venda'}</p>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
          className="rounded-2xl overflow-hidden" style={{ background: '#111118', border: '1px solid #1e1e2e' }}>
          <AnimatePresence initial={false}>
            {filtered.map((sale, i) => {
              const s = statusConfig[sale.status as keyof typeof statusConfig]
              return (
                <motion.div key={sale.id}
                  initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.25, delay: i * 0.03 }}
                  className="flex items-center gap-3 px-4 py-3.5"
                  style={{ borderBottom: i < filtered.length - 1 ? '1px solid #1a1a2a' : 'none' }}>
                  <motion.div whileHover={{ scale: 1.1 }}
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(34,211,238,0.1)' }}>
                    <ShoppingCart size={13} style={{ color: '#22d3ee' }} />
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: '#e8e8f0' }}>
                      {sale.clients?.name || 'Venda avulsa'}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: '#4a4a6a' }}>
                      {new Date(sale.date).toLocaleDateString('pt-BR')}
                      {sale.sale_items?.length ? ` · ${sale.sale_items.length} iten${sale.sale_items.length > 1 ? 's' : ''}` : ''}
                    </p>
                  </div>
                  <motion.span whileHover={{ scale: 1.05 }}
                    className="text-xs font-medium px-2 py-1 rounded-full shrink-0"
                    style={{ background: s.bg, color: s.color }}>
                    {s.label}
                  </motion.span>
                  <span className="text-sm font-semibold shrink-0" style={{ color: '#34d399' }}>
                    {fmt(Number(sale.total))}
                  </span>
                  <div className="flex gap-2 shrink-0">
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      onClick={() => openEdit(sale)} className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ background: 'rgba(124,110,247,0.1)', color: '#7c6ef7' }}>
                      <Pencil size={12} />
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      onClick={() => setShowConfirm(sale.id)} className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171' }}>
                      <Trash2 size={12} />
                    </motion.button>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  )
}
