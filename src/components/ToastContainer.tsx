'use client'

import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useToast, Toast } from '@/hooks/useToast'

const typeIcons: Record<string, string> = {
  task: '📋',
  payment: '💸',
  event: '📅',
  sale: '🛍️',
  info: '📦',
  success: '✅',
  warning: '⚠️',
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const router = useRouter()

  function handleClick() {
    onDismiss(toast.id)
    if (toast.href) router.push(toast.href)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92, y: -8 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="flex items-start gap-3 p-3.5 rounded-2xl cursor-pointer select-none"
      style={{
        background: '#13131f',
        border: `1px solid ${toast.color}30`,
        boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${toast.color}15`,
        backdropFilter: 'blur(12px)',
        maxWidth: '340px',
        width: '100%',
      }}
      onClick={handleClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Ícone */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 400, damping: 20 }}
        className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
        style={{ background: `${toast.color}18` }}
      >
        {typeIcons[toast.type] ?? '🔔'}
      </motion.div>

      {/* Texto */}
      <div className="flex-1 min-w-0 pt-0.5">
        <p className="text-xs font-bold leading-none" style={{ color: toast.color }}>
          {toast.title}
        </p>
        <p className="text-xs mt-1 leading-relaxed" style={{ color: '#8a8aaa' }}>
          {toast.message}
        </p>
      </div>

      {/* Fechar */}
      <motion.button
        whileHover={{ scale: 1.2 }}
        whileTap={{ scale: 0.85 }}
        onClick={e => { e.stopPropagation(); onDismiss(toast.id) }}
        className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: '#1e1e2e', color: '#4a4a6a' }}
      >
        <X size={10} />
      </motion.button>

      {/* Barra de progresso */}
      <motion.div
        className="absolute bottom-0 left-0 h-0.5 rounded-full"
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: (toast.duration ?? 5500) / 1000, ease: 'linear' }}
        style={{
          background: toast.color,
          opacity: 0.4,
          borderRadius: '0 0 16px 16px',
        }}
      />
    </motion.div>
  )
}

export function ToastContainer() {
  const { toasts, dismiss } = useToast()

  return (
    // Fixo no topo, centralizado, acima de tudo
    <div
      className="fixed top-4 left-0 right-0 flex flex-col items-center gap-2.5 z-[9999] pointer-events-none px-4"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <AnimatePresence initial={false}>
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto w-full flex justify-center">
            <ToastItem toast={toast} onDismiss={dismiss} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}
