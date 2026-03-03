'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useBusiness } from '@/hooks/useBusiness'
import { useTour } from '@/hooks/useTour'
import { TourTooltip } from "@/components/TourTooltip"
import { Users, Plus, Loader2, X, Pencil, Trash2, Search } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay, ease: [0.25, 0.46, 0.45, 0.94] as const }
})

const TOUR_STEPS = [
  {
    target: '[data-tour="clientes-header"]',
    title: 'Cadastro de clientes',
    description: 'Mantenha seu cadastro de clientes atualizado. Eles ficarão disponíveis ao registrar vendas.',
    position: 'bottom' as const,
  },
  {
    target: '[data-tour="clientes-busca"]',
    title: 'Busca de clientes',
    description: 'Pesquise por nome ou email. O resultado aparece instantaneamente.',
    position: 'bottom' as const,
  },
  {
    target: '[data-tour="clientes-lista"]',
    title: 'Lista de clientes',
    description: 'Clique no lápis para editar ou na lixeira para excluir um cliente.',
    position: 'top' as const,
  },
]

export default function ClientesPage() {
  const supabase = createClient()
  const { businessId, loading: bizLoading } = useBusiness()
  const tour = useTour('clientes', TOUR_STEPS)

  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editClient, setEditClient] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [showConfirm, setShowConfirm] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '', document: '' })

  async function load() {
    if (!businessId) return
    try {
      const { data } = await supabase.from('clients').select('*').eq('business_id', businessId).order('name')
      setClients(data || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { if (businessId) load() }, [businessId])
  useEffect(() => { if (!bizLoading && !businessId) setLoading(false) }, [bizLoading, businessId])

  function openCreate() {
    setEditClient(null)
    setForm({ name: '', email: '', phone: '', document: '' })
    setShowForm(true)
  }

  function openEdit(client: any) {
    setEditClient(client)
    setForm({ name: client.name, email: client.email || '', phone: client.phone || '', document: client.document || '' })
    setShowForm(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    if (editClient) {
      await supabase.from('clients').update({
        name: form.name, email: form.email || null,
        phone: form.phone || null, document: form.document || null,
      }).eq('id', editClient.id)
    } else {
      await supabase.from('clients').insert({
        name: form.name, email: form.email || null,
        phone: form.phone || null, document: form.document || null,
        business_id: businessId, active: true,
      })
    }
    setShowForm(false); setEditClient(null); setSaving(false); load()
  }

  async function handleDelete(id: string) {
    await supabase.from('clients').delete().eq('id', id)
    setShowConfirm(null); load()
  }

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  )

  function initials(name: string) {
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const colors = ['#7c6ef7', '#34d399', '#f87171', '#fbbf24', '#22d3ee', '#a78bfa', '#fb923c']
  function colorFor(name: string) { return colors[name.charCodeAt(0) % colors.length] }

  if (loading || bizLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: '#7c6ef7', borderTopColor: 'transparent' }} />
    </div>
  )

  return (
    <div className="flex flex-col gap-6">
      <TourTooltip active={tour.active} step={tour.step} current={tour.current} total={tour.total} onNext={tour.next} onPrev={tour.prev} onFinish={tour.finish} />

      <motion.div {...fadeUp(0)} className="flex items-center justify-between" data-tour="clientes-header">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>Clientes</h1>
          <p className="text-sm mt-1" style={{ color: '#4a4a6a' }}>{clients.length} clientes cadastrados</p>
        </div>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ background: '#7c6ef7', color: 'white', boxShadow: '0 0 20px rgba(124,110,247,0.3)' }}>
          <Plus size={15} /> <span className="hidden sm:inline">Novo cliente</span><span className="sm:hidden">Novo</span>
        </motion.button>
      </motion.div>

      <motion.div {...fadeUp(0.06)} data-tour="clientes-busca"
        className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl"
        style={{ background: '#111118', border: '1px solid #1e1e2e' }}>
        <Search size={14} style={{ color: '#4a4a6a' }} />
        <input type="text" placeholder="Buscar por nome ou email..." value={search}
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
            onClick={e => { if (e.target === e.currentTarget) { setShowForm(false); setEditClient(null) } }}>
            <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as const }}
              className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl border p-6"
              style={{ background: '#111118', borderColor: '#1e1e2e' }}>
              <div className="w-10 h-1 rounded-full mx-auto mb-5 sm:hidden" style={{ background: '#2a2a3e' }} />
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-lg" style={{ fontFamily: 'Syne, sans-serif' }}>
                  {editClient ? 'Editar cliente' : 'Novo cliente'}
                </h2>
                <button onClick={() => { setShowForm(false); setEditClient(null) }} style={{ color: '#4a4a6a' }}><X size={18} /></button>
              </div>
              <form onSubmit={handleSave} className="flex flex-col gap-4">
                <input type="text" placeholder="Nome completo *" value={form.name} required
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="px-3 py-3 rounded-xl border text-sm outline-none"
                  style={{ background: '#0d0d14', borderColor: '#1e1e2e', color: '#e8e8f0' }} />
                <input type="email" placeholder="Email" value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="px-3 py-3 rounded-xl border text-sm outline-none"
                  style={{ background: '#0d0d14', borderColor: '#1e1e2e', color: '#e8e8f0' }} />
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" placeholder="Telefone" value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="px-3 py-3 rounded-xl border text-sm outline-none"
                    style={{ background: '#0d0d14', borderColor: '#1e1e2e', color: '#e8e8f0' }} />
                  <input type="text" placeholder="CPF/CNPJ" value={form.document}
                    onChange={e => setForm({ ...form, document: e.target.value })}
                    className="px-3 py-3 rounded-xl border text-sm outline-none"
                    style={{ background: '#0d0d14', borderColor: '#1e1e2e', color: '#e8e8f0' }} />
                </div>
                <button type="submit" disabled={saving}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm mt-2"
                  style={{ background: '#7c6ef7', color: 'white' }}>
                  {saving ? <Loader2 size={16} className="animate-spin" /> : editClient ? 'Salvar alterações' : 'Criar cliente'}
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
              <h2 className="font-bold text-lg mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>Excluir cliente?</h2>
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
        <motion.div {...fadeUp(0.12)} className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(124,110,247,0.1)', border: '1px solid rgba(124,110,247,0.2)' }}>
            <Users size={32} style={{ color: '#7c6ef7' }} />
          </div>
          <h2 className="text-xl font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>
            {search ? 'Nenhum resultado' : 'Nenhum cliente ainda'}
          </h2>
          <p style={{ color: '#4a4a6a' }}>{search ? 'Tente outro termo' : 'Cadastre seu primeiro cliente'}</p>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.1 }}
          className="rounded-2xl overflow-hidden" style={{ background: '#111118', border: '1px solid #1e1e2e' }}
          data-tour="clientes-lista">
          <AnimatePresence initial={false}>
            {filtered.map((client, i) => (
              <motion.div key={client.id}
                initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12, height: 0 }}
                transition={{ duration: 0.25, delay: i * 0.03 }}
                className="flex items-center gap-3 px-4 py-3.5"
                style={{ borderBottom: i < filtered.length - 1 ? '1px solid #1a1a2a' : 'none' }}>
                <motion.div whileHover={{ scale: 1.1 }}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: `${colorFor(client.name)}20`, color: colorFor(client.name) }}>
                  {initials(client.name)}
                </motion.div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: '#e8e8f0' }}>{client.name}</p>
                  <p className="text-xs mt-0.5 truncate" style={{ color: '#4a4a6a' }}>
                    {[client.email, client.phone].filter(Boolean).join(' · ') || 'Sem contato'}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    onClick={() => openEdit(client)} className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(124,110,247,0.1)', color: '#7c6ef7' }}>
                    <Pencil size={12} />
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    onClick={() => setShowConfirm(client.id)} className="w-7 h-7 rounded-lg flex items-center justify-center"
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