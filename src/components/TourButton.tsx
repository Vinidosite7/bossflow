'use client'

import { HelpCircle } from 'lucide-react'
import { motion } from 'framer-motion'

interface Props {
  onRestart: () => void
  label?: string
}

export function TourButton({ onRestart, label = 'Tour' }: Props) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onRestart}
      className="fixed bottom-20 right-4 z-50 flex items-center gap-2 px-3 py-2.5 rounded-2xl text-xs font-bold shadow-lg md:bottom-6"
      style={{
        background: 'rgba(124,110,247,0.15)',
        border: '1px solid rgba(124,110,247,0.3)',
        color: '#9d8fff',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(124,110,247,0.1)',
      }}>
      <HelpCircle size={14} />
      {label}
    </motion.button>
  )
}
