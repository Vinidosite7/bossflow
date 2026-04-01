'use client'

/**
 * FilterBar — barra de busca + tabs de filtro
 *
 * Componente controlado: não filtra dados internamente.
 * A lógica de filtragem fica na página.
 *
 * Exemplos:
 *
 * Só busca:
 *   <FilterBar
 *     value={search}
 *     onChange={setSearch}
 *     placeholder="Buscar cliente..."
 *   />
 *
 * Com tabs de tipo (financeiro):
 *   <FilterBar
 *     value={txSearch}
 *     onChange={setTxSearch}
 *     placeholder="Buscar lançamento..."
 *     tabs={[
 *       { value: 'all',     label: 'Todos',    color: T.purple },
 *       { value: 'income',  label: 'Entradas', color: T.green  },
 *       { value: 'expense', label: 'Saídas',   color: T.red    },
 *     ]}
 *     activeTab={txTypeF}
 *     onTabChange={v => setTxTypeF(v as 'all' | 'income' | 'expense')}
 *   />
 *
 * Com tabs e select de categoria:
 *   <FilterBar
 *     value={search}
 *     onChange={setSearch}
 *     placeholder="Buscar..."
 *     tabs={typeTabs}
 *     activeTab={typeF}
 *     onTabChange={setTypeF}
 *     extra={
 *       <select
 *         value={catF}
 *         onChange={e => setCatF(e.target.value)}
 *         style={{ ...inp, width: 'auto', minWidth: 140, cursor: 'pointer' }}
 *       >
 *         <option value="">Todas as categorias</option>
 *         {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
 *       </select>
 *     }
 *   />
 *
 * Com tabs 4 opções (vendas):
 *   const statusTabs = [
 *     { value: 'all',       label: 'Todos'     },
 *     { value: 'paid',      label: 'Pagas',     color: T.green },
 *     { value: 'pending',   label: 'Pendentes', color: T.amber },
 *     { value: 'cancelled', label: 'Canceladas',color: T.red   },
 *   ]
 *   <FilterBar
 *     value={search}
 *     onChange={setSearch}
 *     placeholder="Buscar por cliente..."
 *     tabs={statusTabs}
 *     activeTab={statusFilter}
 *     onTabChange={setStatusFilter}
 *   />
 */

import React from 'react'
import { Search, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { T, SYNE } from '@/lib/design'

// ─── Types ────────────────────────────────────────────────────────────────────
export interface FilterTab {
  value:  string
  label:  string
  /** Cor ao ativar. Default: T.purple */
  color?: string
}

export interface FilterBarProps {
  // ── Busca ──────────────────────────────────────────────────────────────────
  value:        string
  onChange:     (v: string) => void
  placeholder?: string

  // ── Tabs ───────────────────────────────────────────────────────────────────
  tabs?:        FilterTab[]
  activeTab?:   string
  onTabChange?: (v: string) => void

  // ── Slot adicional (selects, botões, date pickers) ──────────────────────────
  extra?: React.ReactNode

  // ── Layout ─────────────────────────────────────────────────────────────────
  /** data-tour para o sistema de tour guiado */
  tourId?:    string
  className?: string
}

// ─── FilterBar ────────────────────────────────────────────────────────────────
export function FilterBar({
  value,
  onChange,
  placeholder = 'Buscar...',
  tabs,
  activeTab,
  onTabChange,
  extra,
  tourId,
  className = '',
}: FilterBarProps) {
  const hasTabs = tabs && tabs.length > 0

  return (
    <div
      className={`flex flex-col sm:flex-row gap-2.5 ${className}`}
      {...(tourId ? { 'data-tour': tourId } : {})}
    >
      {/* ── Input de busca ────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-2.5 flex-1 px-3.5 py-2.5 rounded-xl"
        style={{
          background:     'rgba(8,8,14,0.92)',
          border:         `1px solid ${T.border}`,
          backdropFilter: 'blur(20px)',
          minWidth:       0,
        }}
      >
        <Search size={13} style={{ color: T.muted, flexShrink: 0 }} />

        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{
            background: 'transparent',
            border:     'none',
            outline:    'none',
            flex:       1,
            color:      T.text,
            fontSize:   13,
            fontFamily: SYNE,
            minWidth:   0,
          }}
        />

        <AnimatePresence>
          {value && (
            <motion.button
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.1 }}
              whileTap={{ scale: 0.85 }}
              onClick={() => onChange('')}
              style={{
                color:      T.muted,
                cursor:     'pointer',
                display:    'flex',
                flexShrink: 0,
                background: 'none',
                border:     'none',
                padding:    0,
                lineHeight: 1,
              }}
              aria-label="Limpar busca"
            >
              <X size={12} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* ── Tabs de filtro ────────────────────────────────────────────────── */}
      {hasTabs && (
        <div
          className="flex gap-1 p-1 rounded-xl overflow-x-auto"
          style={{
            background:      'rgba(8,8,14,0.92)',
            border:          `1px solid ${T.border}`,
            backdropFilter:  'blur(20px)',
            scrollbarWidth:  'none',
            flexShrink:      0,
          }}
        >
          {tabs!.map(tab => {
            const active = activeTab === tab.value
            const color  = tab.color ?? T.purple
            return (
              <motion.button
                key={tab.value}
                whileTap={{ scale: 0.92 }}
                onClick={() => onTabChange?.(tab.value)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{
                  background:  active ? `${color}14` : 'transparent',
                  color:       active ? color : T.muted,
                  border:      active ? `1px solid ${color}32` : '1px solid transparent',
                  cursor:      'pointer',
                  fontFamily:  SYNE,
                  whiteSpace:  'nowrap',
                  transition:  'background 0.15s, color 0.15s, border-color 0.15s',
                  flexShrink:  0,
                }}
              >
                {tab.label}
              </motion.button>
            )
          })}
        </div>
      )}

      {/* ── Slot extra ────────────────────────────────────────────────────── */}
      {extra}
    </div>
  )
}
