'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])

  return (
    <div style={{
      minHeight: '100vh', background: '#080810',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px', fontFamily: 'sans-serif',
    }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <p style={{ fontSize: 80, fontWeight: 800, margin: '0 0 8px',
          background: 'linear-gradient(135deg, #f87171, #fbbf24)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          fontFamily: 'Syne, sans-serif', lineHeight: 1 }}>
          500
        </p>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e8e8f0',
          margin: '0 0 10px', fontFamily: 'Syne, sans-serif' }}>
          Algo deu errado
        </h1>
        <p style={{ fontSize: 14, color: '#4a4a6a', margin: '0 0 32px', lineHeight: 1.6 }}>
          Ocorreu um erro inesperado. Tente novamente ou volte ao painel.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={reset} style={{
            padding: '12px 24px', borderRadius: 12, fontSize: 14,
            fontWeight: 600, color: 'white', cursor: 'pointer', border: 'none',
            background: 'linear-gradient(135deg, #7c6ef7, #9d8fff)',
            boxShadow: '0 4px 24px rgba(124,110,247,0.35)',
          }}>
            Tentar novamente
          </button>
          <Link href="/dashboard" style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '12px 24px', borderRadius: 12, fontSize: 14,
            fontWeight: 600, color: '#6b6b8a', textDecoration: 'none',
            background: '#111118', border: '1px solid #1e1e2e',
          }}>
            Voltar ao painel
          </Link>
        </div>
      </div>
    </div>
  )
}
