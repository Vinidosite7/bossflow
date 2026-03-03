'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, TrendingUp, CreditCard, ShoppingCart,
  Users, Package, CheckSquare, Calendar, Building2,
  Settings, ChevronLeft, ChevronRight, Target, ShieldCheck,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'
import { motion } from 'framer-motion'

const navMain = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, color: '#9d8fff' },
  { label: 'Financeiro', href: '/financeiro', icon: TrendingUp, color: '#34d399' },
  { label: 'Despesas', href: '/despesas', icon: CreditCard, color: '#f87171' },
  { label: 'Vendas', href: '/vendas', icon: ShoppingCart, color: '#22d3ee' },
  { label: 'Clientes', href: '/clientes', icon: Users, color: '#fbbf24' },
  { label: 'Produtos', href: '/produtos', icon: Package, color: '#a78bfa' },
  { label: 'Metas', href: '/metas', icon: Target, color: '#f97316' },
]

const navOperacional = [
  { label: 'Tarefas', href: '/tarefas', icon: CheckSquare, color: '#34d399' },
  { label: 'Agenda', href: '/agenda', icon: Calendar, color: '#22d3ee' },
  { label: 'Empresas', href: '/empresas', icon: Building2, color: '#fbbf24' },
  { label: 'Assinatura', href: '/assinatura', icon: CreditCard, color: '#9d8fff' },
  { label: 'Configurações', href: '/configuracoes', icon: Settings, color: '#6b6b8a' },
]

function AnnualGoalWidget({ collapsed }: { collapsed: boolean }) {
  const supabase = createClient()
  const [pct, setPct] = useState(0)
  const [revenue, setRevenue] = useState(0)
  const [target, setTarget] = useState(0)

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const bizId = typeof window !== 'undefined' ? localStorage.getItem('activeBizId') : null
        if (!bizId) return

        const year = new Date().getFullYear()
        const { data: goals } = await supabase
          .from('goals').select('target').eq('business_id', bizId).eq('year', year)
        const { data: txs } = await supabase
          .from('transactions').select('amount')
          .eq('business_id', bizId).eq('type', 'income')
          .gte('date', `${year}-01-01`).lte('date', `${year}-12-31`)

        const t = (goals || []).reduce((a, g) => a + Number(g.target), 0)
        const r = (txs || []).reduce((a, tx) => a + Number(tx.amount), 0)
        setTarget(t)
        setRevenue(r)
        setPct(t > 0 ? Math.min((r / t) * 100, 100) : 0)
      } catch {}
    }
    load()
  }, [])

  const fmtShort = (v: number) => {
    if (v >= 1000000) return `R$ ${(v / 1000000).toFixed(1)}M`
    if (v >= 1000) return `R$ ${(v / 1000).toFixed(0)}k`
    return `R$ ${v.toFixed(0)}`
  }

  const color = pct >= 100 ? '#34d399' : pct >= 60 ? '#fbbf24' : '#f97316'

  if (collapsed) {
    return (
      <div className="px-3 py-3 border-t flex justify-center" style={{ borderColor: '#1a1a2e' }}>
        <div className="relative w-8 h-8">
          <svg viewBox="0 0 32 32" className="w-8 h-8 -rotate-90">
            <circle cx="16" cy="16" r="12" fill="none" stroke="#1e1e2e" strokeWidth="3" />
            <circle cx="16" cy="16" r="12" fill="none" stroke={color} strokeWidth="3"
              strokeDasharray={`${2 * Math.PI * 12}`}
              strokeDashoffset={`${2 * Math.PI * 12 * (1 - pct / 100)}`}
              strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold" style={{ color }}>
            {Math.round(pct)}%
          </span>
        </div>
      </div>
    )
  }

  return (
    <Link href="/metas" className="block mx-3 mb-3 mt-1 p-3 rounded-xl border transition-all"
      style={{ background: 'rgba(249,115,22,0.05)', borderColor: 'rgba(249,115,22,0.2)' }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(249,115,22,0.08)'}
      onMouseLeave={e => e.currentTarget.style.background = 'rgba(249,115,22,0.05)'}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Target size={11} style={{ color: '#f97316' }} />
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#f97316' }}>Meta Anual</span>
        </div>
        <span className="text-xs font-bold" style={{ color }}>{Math.round(pct)}%</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden mb-2" style={{ background: '#1e1e2e' }}>
        <motion.div
          initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}, ${color}cc)` }}
        />
      </div>
      {target > 0 ? (
        <p className="text-xs" style={{ color: '#4a4a6a' }}>
          {fmtShort(revenue)} <span style={{ color: '#3a3a5c' }}>/ {fmtShort(target)}</span>
        </p>
      ) : (
        <p className="text-xs" style={{ color: '#3a3a5c' }}>Definir meta anual →</p>
      )}
    </Link>
  )
}

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const isMobile = !!onClose

  useEffect(() => {
    async function checkAdmin() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data } = await supabase
          .from('profiles').select('is_admin').eq('id', user.id).single()
        setIsAdmin(!!data?.is_admin)
      } catch {}
    }
    checkAdmin()
  }, [])

  const renderNavItem = (href: string, icon: any, label: string, color: string) => {
    const Icon = icon
    const active = pathname === href
    return (
      <Link key={href} href={href} onClick={onClose}
        className={`flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-150 ${
          collapsed && !isMobile ? 'justify-center py-3 px-0' : 'px-3 py-2.5'
        }`}
        style={{ background: active ? `${color}18` : 'transparent' }}>
        <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
          style={{ background: active ? `${color}25` : 'transparent' }}>
          <Icon size={15} style={{ color: active ? color : '#5a5a7a' }} />
        </div>
        {(!collapsed || isMobile) && (
          <>
            <span style={{ color: active ? color : '#6b6b8a' }}>{label}</span>
            {active && <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: color }} />}
          </>
        )}
      </Link>
    )
  }

  return (
    <aside
      style={{ background: '#0d0d14', borderColor: '#1a1a2e' }}
      className={`relative flex flex-col h-screen border-r transition-all duration-300 ease-in-out shrink-0 ${
        isMobile ? 'w-[240px]' : collapsed ? 'w-[64px]' : 'w-[224px]'
      }`}>

      {/* Logo */}
      <div className={`flex items-center px-4 py-5 border-b ${collapsed && !isMobile ? 'justify-center' : ''}`}
        style={{ borderColor: '#1a1a2e' }}>
        <div className="relative w-full h-10">
          <Image src="/bossflow.png" alt="BossFlow Logo" fill className="object-contain object-left" priority />
        </div>
      </div>

      {/* Nav */}
      <div className="flex flex-col gap-0.5 p-2 mt-2 flex-1 overflow-y-auto">
        {(!collapsed || isMobile) && (
          <span className="text-xs px-3 mb-1.5 font-semibold uppercase tracking-widest" style={{ color: '#3a3a5c' }}>
            Principal
          </span>
        )}
        {navMain.map(({ href, icon, label, color }) => renderNavItem(href, icon, label, color))}

        <div className="mx-2 my-2" style={{ borderTop: '1px solid #1a1a2e' }} />

        {(!collapsed || isMobile) && (
          <span className="text-xs px-3 mb-1.5 font-semibold uppercase tracking-widest" style={{ color: '#3a3a5c' }}>
            Operacional
          </span>
        )}
        {navOperacional.map(({ href, icon, label, color }) => renderNavItem(href, icon, label, color))}

        {/* Admin — só aparece se is_admin */}
        {isAdmin && (
          <>
            <div className="mx-2 my-2" style={{ borderTop: '1px solid #1a1a2e' }} />
            {(!collapsed || isMobile) && (
              <span className="text-xs px-3 mb-1.5 font-semibold uppercase tracking-widest" style={{ color: '#3a3a5c' }}>
                Admin
              </span>
            )}
            <Link href="/admin" onClick={onClose}
              className={`flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-150 ${
                collapsed && !isMobile ? 'justify-center py-3 px-0' : 'px-3 py-2.5'
              }`}
              style={{ background: pathname === '/admin' ? 'rgba(124,110,247,0.12)' : 'transparent' }}>
              <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                style={{ background: pathname === '/admin' ? 'rgba(124,110,247,0.2)' : 'transparent' }}>
                <ShieldCheck size={15} style={{ color: pathname === '/admin' ? '#9d8fff' : '#5a5a7a' }} />
              </div>
              {(!collapsed || isMobile) && (
                <>
                  <span style={{ color: pathname === '/admin' ? '#9d8fff' : '#6b6b8a' }}>Painel Admin</span>
                  {pathname === '/admin' && <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: '#9d8fff' }} />}
                </>
              )}
            </Link>
          </>
        )}
      </div>

      {/* Meta anual widget */}
      <AnnualGoalWidget collapsed={collapsed && !isMobile} />

      {(!collapsed || isMobile) && (
        <div className="px-5 py-2 border-t" style={{ borderColor: '#1a1a2e' }}>
          <span className="text-xs" style={{ color: '#2a2a4a' }}>v0.1 beta</span>
        </div>
      )}

      {/* Botão colapsar — só desktop */}
      {!isMobile && (
        <button onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-14 w-6 h-6 rounded-full flex items-center justify-center border z-10"
          style={{ background: '#0d0d14', borderColor: '#2a2a3e', color: '#5a5a7a' }}>
          {collapsed ? <ChevronRight size={11} /> : <ChevronLeft size={11} />}
        </button>
      )}
    </aside>
  )
}
