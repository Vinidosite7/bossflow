'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, TrendingUp, CreditCard, ShoppingCart,
  Users, Package, CheckSquare, Calendar, Building2,
  Settings, Target, ShieldCheck,
} from 'lucide-react'
import { useState, useEffect, createContext, useContext } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Aceternity Sidebar Context ───────────────────────────────────────────────
const SidebarContext = createContext<{
  open: boolean
  setOpen: (v: boolean) => void
  animate: boolean
}>({ open: false, setOpen: () => {}, animate: true })

const useSidebar = () => useContext(SidebarContext)

// ─── Nav items ────────────────────────────────────────────────────────────────
const navMain = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, color: '#9d8fff' },
  { label: 'Financeiro', href: '/financeiro', icon: TrendingUp,     color: '#34d399' },
  { label: 'Despesas',   href: '/despesas',   icon: CreditCard,     color: '#f87171' },
  { label: 'Vendas',     href: '/vendas',     icon: ShoppingCart,   color: '#22d3ee' },
  { label: 'Clientes',   href: '/clientes',   icon: Users,          color: '#fbbf24' },
  { label: 'Produtos',   href: '/produtos',   icon: Package,        color: '#a78bfa' },
  { label: 'Metas',      href: '/metas',      icon: Target,         color: '#f97316' },
]

const navOperacional = [
  { label: 'Tarefas',        href: '/tarefas',        icon: CheckSquare, color: '#34d399' },
  { label: 'Agenda',         href: '/agenda',         icon: Calendar,    color: '#22d3ee' },
  { label: 'Empresas',       href: '/empresas',       icon: Building2,   color: '#fbbf24' },
  { label: 'Assinatura',     href: '/assinatura',     icon: CreditCard,  color: '#9d8fff' },
  { label: 'Configurações',  href: '/configuracoes',  icon: Settings,    color: '#6b6b8a' },
]

// ─── Annual Goal Widget ───────────────────────────────────────────────────────
function AnnualGoalWidget() {
  const { open, animate } = useSidebar()
  const collapsed = animate ? !open : false
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
        setTarget(t); setRevenue(r)
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

  // Collapsed — só o círculo
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

  // Expanded — widget completo
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

// ─── Nav Item ─────────────────────────────────────────────────────────────────
function NavItem({ href, icon: Icon, label, color, onClose }: {
  href: string; icon: any; label: string; color: string; onClose?: () => void
}) {
  const pathname = usePathname()
  const { open, animate } = useSidebar()
  const active = pathname === href

  return (
    <Link href={href} onClick={onClose}
      className="flex items-center gap-3 rounded-xl text-sm font-medium transition-colors duration-150 px-3 py-2.5"
      style={{ background: active ? `${color}18` : 'transparent' }}>
      {/* Ícone sempre visível */}
      <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
        style={{ background: active ? `${color}25` : 'transparent' }}>
        <Icon size={15} style={{ color: active ? color : '#5a5a7a' }} />
      </div>

      {/* Label — aparece/some com AnimatePresence (mecânica Aceternity) */}
      <AnimatePresence>
        {(open || !animate) && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="whitespace-nowrap overflow-hidden"
            style={{ color: active ? color : '#6b6b8a' }}>
            {label}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Dot ativo */}
      <AnimatePresence>
        {(open || !animate) && active && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className="ml-auto w-1.5 h-1.5 rounded-full shrink-0"
            style={{ background: color }}
          />
        )}
      </AnimatePresence>
    </Link>
  )
}

// ─── Section Label ─────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: string }) {
  const { open, animate } = useSidebar()
  if (!open && animate) return <div className="h-4" /> // espaçador quando collapsed
  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="text-xs px-3 mb-1.5 font-semibold uppercase tracking-widest block"
      style={{ color: '#3a3a5c' }}>
      {children}
    </motion.span>
  )
}

// ─── Desktop Sidebar ──────────────────────────────────────────────────────────
function DesktopSidebar({ isAdmin, pathname }: { isAdmin: boolean; pathname: string }) {
  const { open, setOpen, animate } = useSidebar()

  return (
    <motion.aside
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      animate={{ width: animate ? (open ? '224px' : '64px') : '224px' }}
      transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative flex flex-col h-screen border-r shrink-0 overflow-hidden"
      style={{ background: '#0d0d14', borderColor: '#1a1a2e' }}>

      {/* Logo */}
      <div className="flex items-center px-4 py-5 border-b shrink-0" style={{ borderColor: '#1a1a2e' }}>
        <div className="relative w-full h-10">
          <Image src="/bossflow.png" alt="BossFlow Logo" fill className="object-contain object-left" priority />
        </div>
      </div>

      {/* Nav */}
      <div className="flex flex-col gap-0.5 p-2 mt-2 flex-1 overflow-y-auto overflow-x-hidden">
        <SectionLabel>Principal</SectionLabel>
        {navMain.map(({ href, icon, label, color }) => (
          <NavItem key={href} href={href} icon={icon} label={label} color={color} />
        ))}

        <div className="mx-2 my-2" style={{ borderTop: '1px solid #1a1a2e' }} />

        <SectionLabel>Operacional</SectionLabel>
        {navOperacional.map(({ href, icon, label, color }) => (
          <NavItem key={href} href={href} icon={icon} label={label} color={color} />
        ))}

        {isAdmin && (
          <>
            <div className="mx-2 my-2" style={{ borderTop: '1px solid #1a1a2e' }} />
            <SectionLabel>Admin</SectionLabel>
            <NavItem href="/admin" icon={ShieldCheck} label="Painel Admin" color="#9d8fff" />
          </>
        )}
      </div>

      {/* Meta anual widget */}
      <AnnualGoalWidget />

      {/* Versão */}
      <AnimatePresence>
        {(open || !animate) && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="px-5 py-2 border-t" style={{ borderColor: '#1a1a2e' }}>
            <span className="text-xs" style={{ color: '#2a2a4a' }}>v0.1 beta</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  )
}

// ─── Mobile Sidebar ───────────────────────────────────────────────────────────
function MobileSidebar({ isAdmin, onClose }: { isAdmin: boolean; onClose: () => void }) {
  return (
    <aside
      className="flex flex-col h-screen border-r w-[240px]"
      style={{ background: '#0d0d14', borderColor: '#1a1a2e' }}>

      {/* Logo */}
      <div className="flex items-center px-4 py-5 border-b" style={{ borderColor: '#1a1a2e' }}>
        <div className="relative w-full h-10">
          <Image src="/bossflow.png" alt="BossFlow Logo" fill className="object-contain object-left" priority />
        </div>
      </div>

      {/* Nav */}
      <div className="flex flex-col gap-0.5 p-2 mt-2 flex-1 overflow-y-auto">
        <span className="text-xs px-3 mb-1.5 font-semibold uppercase tracking-widest" style={{ color: '#3a3a5c' }}>Principal</span>
        {navMain.map(({ href, icon, label, color }) => (
          <NavItem key={href} href={href} icon={icon} label={label} color={color} onClose={onClose} />
        ))}

        <div className="mx-2 my-2" style={{ borderTop: '1px solid #1a1a2e' }} />

        <span className="text-xs px-3 mb-1.5 font-semibold uppercase tracking-widest" style={{ color: '#3a3a5c' }}>Operacional</span>
        {navOperacional.map(({ href, icon, label, color }) => (
          <NavItem key={href} href={href} icon={icon} label={label} color={color} onClose={onClose} />
        ))}

        {isAdmin && (
          <>
            <div className="mx-2 my-2" style={{ borderTop: '1px solid #1a1a2e' }} />
            <span className="text-xs px-3 mb-1.5 font-semibold uppercase tracking-widest" style={{ color: '#3a3a5c' }}>Admin</span>
            <NavItem href="/admin" icon={ShieldCheck} label="Painel Admin" color="#9d8fff" onClose={onClose} />
          </>
        )}
      </div>

      <AnnualGoalWidget />

      <div className="px-5 py-2 border-t" style={{ borderColor: '#1a1a2e' }}>
        <span className="text-xs" style={{ color: '#2a2a4a' }}>v0.1 beta</span>
      </div>
    </aside>
  )
}

// ─── Sidebar principal (export) ───────────────────────────────────────────────
export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()
  const isMobile = !!onClose
  const [open, setOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

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

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate: !isMobile }}>
      {isMobile
        ? <MobileSidebar isAdmin={isAdmin} onClose={onClose!} />
        : <DesktopSidebar isAdmin={isAdmin} pathname={pathname} />
      }
    </SidebarContext.Provider>
  )
}
