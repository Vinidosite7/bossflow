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
      whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
      onClick={onRestart}
      className="fixed bottom-20 right-4 z-50 flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-bold shadow-lg md:bottom-6"
      style={{
        background: 'rgba(8,8,14,0.92)',
        border: '1px solid rgba(124,110,247,0.25)',
        color: '#9d8fff',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(124,110,247,0.1)',
        fontFamily: 'Syne, sans-serif',
      }}>
      <HelpCircle size={13} />
      {label}
    </motion.button>
  )
}
