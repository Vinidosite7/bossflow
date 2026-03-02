'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Building2, Plus, Loader2, X, Pencil, Trash2, Upload, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay, ease: [0.25, 0.46, 0.45, 0.94] as const }
})

export default function EmpresasPage() {
  const supabase = createClient()
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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setActiveBizId(localStorage.getItem('activeBizId') || '')
    }
  }, [])

  async function load() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data } = await supabase
        .from('businesses').select('*').eq('owner_id', user.id)
        .order('created_at', { ascending: false })
      setBusinesses(data || [])
      const saved = typeof window !== 'undefined' ? localStorage.getItem('activeBizId') : null
      if (!saved && data?.[0]) {
        localStorage.setItem('activeBizId', data[0].id)
        setActiveBizId(data[0].id)
      }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  function openCreate() {
    setEditBiz(null)
    setName('')
    setLogoFile(null)
    setLogoPreview('')
    setShowForm(true)
  }

  function openEdit(biz: any) {
    setEditBiz(biz)
    setName(biz.name)
    setLogoFile(null)
    setLogoPreview(biz.logo_url || '')
    setShowForm(true)
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let logo_url = editBiz?.logo_url || null
    if (logoFile) {
      const ext = logoFile.name.split('.').pop()
      const path = `logos/${user.id}-${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('business-logos').upload(path, logoFile, { upsert: true })
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('business-logos').getPublicUrl(path)
        logo_url = urlData.publicUrl
      }
    }

    if (editBiz) {
      await supabase.from('businesses').update({ name, logo_url }).eq('id', editBiz.id)
    } else {
      const { data: newBiz } = await supabase.from('businesses')
        .insert({ name, logo_url, owner_id: user.id }).select().single()
      if (newBiz && !activeBizId) {
        localStorage.setItem('activeBizId', newBiz.id)
        setActiveBizId(newBiz.id)
      }
    }

    setShowForm(false)
    setEditBiz(null)
    setSaving(false)
    load()
  }

  async function handleDelete(id: string) {
    await supabase.from('businesses').delete().eq('id', id)
    if (activeBizId === id) {
      localStorage.removeItem('activeBizId')
      setActiveBizId('')
    }
    setShowConfirm(null)
    load()
  }

  function activateBiz(id: string) {
    localStorage.setItem('activeBizId', id)
    setActiveBizId(id)
    window.location.reload()
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: '#7c6ef7', borderTopColor: 'transparent' }} />
    </div>
  )

  return (
    <div className="flex flex-col gap-6">
      <motion.div {...fadeUp(0)} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>Empresas</h1>
          <p className="text-sm mt-1" style={{ color: '#4a4a6a' }}>{businesses.length} empresas cadastradas</p>
        </div>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ background: '#7c6ef7', color: 'white', boxShadow: '0 0 20px rgba(124,110,247,0.3)' }}>
          <Plus size={15} /> <span className="hidden sm:inline">Nova empresa</span><span className="sm:hidden">Nova</span>
        </motion.button>
      </motion.div>

      {/* Modal form */}
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
                <h2 className="font-bold text-lg" style={{ fontFamily: 'Syne, sans-serif' }}>
                  {editBiz ? 'Editar empresa' : 'Nova empresa'}
                </h2>
                <button onClick={() => { setShowForm(false); setEditBiz(null) }} style={{ color: '#4a4a6a' }}><X size={18} /></button>
              </div>
              <form onSubmit={handleSave} className="flex flex-col gap-5">
                <div className="flex flex-col items-center gap-3">
                  <motion.div whileHover={{ scale: 1.04 }}
                    className="w-24 h-24 rounded-2xl flex items-center justify-center overflow-hidden"
                    style={{ background: '#0d0d14', border: '2px dashed #2a2a3e' }}>
                    {logoPreview
                      ? <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                      : <Building2 size={36} style={{ color: '#3a3a5c' }} />}
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

      {/* Modal confirm */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-sm rounded-2xl border p-6" style={{ background: '#111118', borderColor: '#1e1e2e' }}>
              <h2 className="font-bold text-lg mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>Excluir empresa?</h2>
              <p className="text-sm mb-6" style={{ color: '#6b6b8a' }}>Todos os dados serão excluídos permanentemente.</p>
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

      {businesses.length === 0 ? (
        <motion.div {...fadeUp(0.1)} className="flex flex-col items-center justify-center py-24 gap-4">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.4, delay: 0.15 }}
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(124,110,247,0.1)', border: '1px solid rgba(124,110,247,0.2)' }}>
            <Building2 size={32} style={{ color: '#7c6ef7' }} />
          </motion.div>
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
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08 }}>
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
                    {biz.logo_url
                      ? <img src={biz.logo_url} alt={biz.name} className="w-full h-full object-cover" />
                      : <Building2 size={22} style={{ color: '#3a3a5c' }} />}
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold truncate" style={{ color: '#e8e8f0' }}>{biz.name}</p>
                      <AnimatePresence>
                        {activeBizId === biz.id && (
                          <motion.span
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
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
