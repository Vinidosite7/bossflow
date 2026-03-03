'use client'
// DESPESAS PAGE
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useBusiness } from '@/hooks/useBusiness'
import { useTour } from '@/hooks/useTour'
import { TourTooltip } from "@/components/TourTooltip"
import { TrendingUp, TrendingDown, Plus, Loader2, X, Pencil, Trash2, Search } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay, ease: [0.25, 0.46, 0.45, 0.94] as const }
})

const TOUR_STEPS = [
  {
    target: '[data-tour="lancamentos-header"]',
    title: 'Lançamentos financeiros',
    description: 'Registre entradas e saídas de forma rápida. Clique em "Novo lançamento" para começar.',
    position: 'bottom' as const,
  },
  {
    target: '[data-tour="lancamentos-kpis"]',
    title: 'Resumo financeiro',
    description: 'Veja o total de entradas, saídas e o saldo atual em tempo real.',
    position: 'bottom' as const,
  },
  {
    target: '[data-tour="lancamentos-lista"]',
    title: 'Histórico de lançamentos',
    description: 'Lançamentos com status "Pendente" ainda não foram pagos ou recebidos. Edite para marcar como pago.',
    position: 'top' as const,
  },
]

export default function DespesasPage() {
  const supabase = createClient()
  const { businessId, loading: bizLoading } = useBusiness()
  const tour = useTour('lancamentos', TOUR_STEPS)

  const [transactions, setTransactions] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editTx, setEditTx] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [showConfirm, setShowConfirm] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: '', amount: '', date: new Date().toISOString().split('T')[0],
    type: 'expense', category_id: '', description: '', paid: true,
  })

  async function load() {
    if (!businessId) return
    try {
      const [{ data: txs }, { data: cats }] = await Promise.all([
        supabase.from('transactions').select('*, categories(name, color)').eq('business_id', businessId).order('date', { ascending: false }),
        supabase.from('categories').select('*').eq('business_id', businessId).order('name'),
      ])
      setTransactions(txs || [])
      setCategories(cats || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { if (businessId) load() }, [businessId])
  useEffect(() => { if (!bizLoading && !businessId) setLoading(false) }, [bizLoading, businessId])

  function openCreate() {
    setEditTx(null)
    setForm({ title: '', amount: '', date: new Date().toISOString().split('T')[0], type: 'expense', category_id: '', description: '', paid: true })
    setShowForm(true)
  }

  function openEdit(tx: any) {
    setEditTx(tx)
    setForm({ title: tx.title, amount: String(tx.amount), date: tx.date, type: tx.type, category_id: tx.category_id || '', description: tx.description || '', paid: tx.paid })
    setShowForm(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const payload = {
      title: form.title, amount: parseFloat(form.amount), date: form.date,
      type: form.type, category_id: form.category_id || null,
      description: form.description || null, paid: form.paid,
      paid_at: form.paid ? new Date().toISOString() : null,
    }
    if (editTx) {
      await supabase.from('transactions').update(payload).eq('id', editTx.id)
    } else {
      await supabase.from('transactions').insert({ ...payload, business_id: businessId, created_by: user?.id })
    }
    setShowForm(false); setEditTx(null); setSaving(false); load()
  }

  async function handleDelete(id: string) {
    await supabase.from('transactions').delete().eq('id', id)
    setShowConfirm(null); load()
  }

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const income = transactions.filter(t => t.type === 'income').reduce((a, t) => a + Number(t.amount), 0)
  const expense = transactions.filter(t => t.type === 'expense').reduce((a, t) => a + Number(t.amount), 0)
  const filtered = transactions.filter(t => t.title.toLowerCase().includes(search.toLowerCase()))

  if (loading || bizLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: '#7c6ef7', borderTopColor: 'transparent' }} />
    </div>
  )

  return (
    <div className="flex flex-col gap-6">
      <TourTooltip active={tour.active} step={tour.step} current={tour.current} total={tour.total} onNext={tour.next} onPrev={tour.prev} onFinish={tour.finish} />

      <motion.div {...fadeUp(0)} className="flex items-center justify-between" data-tour="lancamentos-header">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>Lançamentos</h1>
          <p className="text-sm mt-1" style={{ color: '#4a4a6a' }}>{transactions.length} lançamentos</p>
        </div>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ background: '#7c6ef7', color: 'white', boxShadow: '0 0 20px rgba(124,110,247,0.3)' }}>
          <Plus size={15} /> <span className="hidden sm:inline">Novo lançamento</span><span className="sm:hidden">Novo</span>
        </motion.button>
      </motion.div>

      <div className="grid grid-cols-3 gap-3" data-tour="lancamentos-kpis">
        {[
          { label: 'Entradas', value: fmt(income), color: '#34d399', icon: TrendingUp },
          { label: 'Saídas', value: fmt(expense), color: '#f87171', icon: TrendingDown },
          { label: 'Saldo', value: fmt(income - expense), color: income - expense >= 0 ? '#34d399' : '#f87171', icon: income - expense >= 0 ? TrendingUp : TrendingDown },
        ].map(({ label, value, color, icon: Icon }, i) => (
          <motion.div key={label} {...fadeUp(0.08 + i * 0.06)}
            className="rounded-2xl p-3 sm:p-4 flex flex-col gap-2"
            style={{ background: '#111118', border: '1px solid #1e1e2e' }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
              <Icon size={14} style={{ color }} />
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#4a4a6a' }}>{label}</p>
            <p className="text-base sm:text-lg font-bold leading-tight" style={{ fontFamily: 'Syne, sans-serif', color }}>{value}</p>
          </motion.div>
        ))}
      </div>

      <motion.div {...fadeUp(0.22)}
        className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl"
        style={{ background: '#111118', border: '1px solid #1e1e2e' }}>
        <Search size={14} style={{ color: '#4a4a6a' }} />
        <input type="text" placeholder="Buscar lançamento..." value={search}
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

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            style={{ background: 'rgba(0,0,0,0.8)' }}
            onClick={e => { if (e.target === e.currentTarget) { setShowForm(false); setEditTx(null) } }}>
            <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as const }}
              className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl border p-6"
              style={{ background: '#111118', borderColor: '#1e1e2e' }}>
              <div className="w-10 h-1 rounded-full mx-auto mb-5 sm:hidden" style={{ background: '#2a2a3e' }} />
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-lg" style={{ fontFamily: 'Syne, sans-serif' }}>{editTx ? 'Editar lançamento' : 'Novo lançamento'}</h2>
                <button onClick={() => { setShowForm(false); setEditTx(null) }} style={{ color: '#4a4a6a' }}><X size={18} /></button>
              </div>
              <form onSubmit={handleSave} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-2">
                  {['expense', 'income'].map(t => (
                    <button key={t} type="button" onClick={() => setForm({ ...form, type: t })}
                      className="py-2.5 rounded-xl text-sm font-semibold transition-all"
                      style={{
                        background: form.type === t ? (t === 'income' ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)') : '#0d0d14',
                        color: form.type === t ? (t === 'income' ? '#34d399' : '#f87171') : '#4a4a6a',
                        border: `1px solid ${form.type === t ? (t === 'income' ? '#34d399' : '#f87171') : '#1e1e2e'}`,
                      }}>
                      {t === 'income' ? '↑ Entrada' : '↓ Saída'}
                    </button>
                  ))}
                </div>
                <input type="text" placeholder="Título *" value={form.title} required onChange={e => setForm({ ...form, title: e.target.value })}
                  className="px-3 py-3 rounded-xl border text-sm outline-none" style={{ background: '#0d0d14', borderColor: '#1e1e2e', color: '#e8e8f0' }} />
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" step="0.01" placeholder="Valor *" value={form.amount} required onChange={e => setForm({ ...form, amount: e.target.value })}
                    className="px-3 py-3 rounded-xl border text-sm outline-none" style={{ background: '#0d0d14', borderColor: '#1e1e2e', color: '#e8e8f0' }} />
                  <input type="date" value={form.date} required onChange={e => setForm({ ...form, date: e.target.value })}
                    className="px-3 py-3 rounded-xl border text-sm outline-none" style={{ background: '#0d0d14', borderColor: '#1e1e2e', color: '#e8e8f0' }} />
                </div>
                <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}
                  className="px-3 py-3 rounded-xl border text-sm outline-none" style={{ background: '#0d0d14', borderColor: '#1e1e2e', color: '#e8e8f0' }}>
                  <option value="">Sem categoria</option>
                  {categories.filter(c => c.type === form.type).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.paid} onChange={e => setForm({ ...form, paid: e.target.checked })} />
                  <span className="text-sm" style={{ color: '#6b6b8a' }}>Já foi pago/recebido</span>
                </label>
                <button type="submit" disabled={saving}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm mt-2"
                  style={{ background: '#7c6ef7', color: 'white' }}>
                  {saving ? <Loader2 size={16} className="animate-spin" /> : editTx ? 'Salvar alterações' : 'Salvar lançamento'}
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
              <h2 className="font-bold text-lg mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>Excluir lançamento?</h2>
              <p className="text-sm mb-6" style={{ color: '#6b6b8a' }}>Esta ação não pode ser desfeita.</p>
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

      {filtered.length === 0 ? (
        <motion.div {...fadeUp(0.28)} className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(124,110,247,0.1)', border: '1px solid rgba(124,110,247,0.2)' }}>
            <TrendingUp size={32} style={{ color: '#7c6ef7' }} />
          </div>
          <h2 className="text-xl font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>
            {search ? 'Nenhum resultado' : 'Nenhum lançamento ainda'}
          </h2>
          <p style={{ color: '#4a4a6a' }}>{search ? 'Tente outro termo' : 'Registre seu primeiro lançamento'}</p>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
          className="rounded-2xl overflow-hidden" style={{ background: '#111118', border: '1px solid #1e1e2e' }}
          data-tour="lancamentos-lista">
          <AnimatePresence initial={false}>
            {filtered.map((tx, i) => (
              <motion.div key={tx.id}
                initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12, height: 0 }}
                transition={{ duration: 0.25, delay: i * 0.025 }}
                className="flex items-center gap-3 px-4 py-3.5"
                style={{ borderBottom: i < filtered.length - 1 ? '1px solid #1a1a2a' : 'none' }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: tx.type === 'income' ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)' }}>
                  {tx.type === 'income'
                    ? <TrendingUp size={13} style={{ color: '#34d399' }} />
                    : <TrendingDown size={13} style={{ color: '#f87171' }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: '#e8e8f0' }}>{tx.title}</p>
                  <p className="text-xs mt-0.5 truncate" style={{ color: '#4a4a6a' }}>
                    {tx.categories?.name || 'Sem categoria'} · {new Date(tx.date).toLocaleDateString('pt-BR')}
                    {!tx.paid && <span className="ml-1.5 px-1.5 py-0.5 rounded text-xs" style={{ background: 'rgba(251,191,36,0.1)', color: '#fbbf24' }}>Pendente</span>}
                  </p>
                </div>
                <span className="text-sm font-semibold shrink-0" style={{ color: tx.type === 'income' ? '#34d399' : '#f87171' }}>
                  {tx.type === 'income' ? '+' : '-'}{fmt(Number(tx.amount))}
                </span>
                <div className="flex gap-2 shrink-0">
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    onClick={() => openEdit(tx)} className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(124,110,247,0.1)', color: '#7c6ef7' }}>
                    <Pencil size={12} />
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    onClick={() => setShowConfirm(tx.id)} className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171' }}>
                    <Trash2 size={12} />
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