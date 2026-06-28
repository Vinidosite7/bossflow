'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { RefreshCcw, Home, AlertTriangle } from 'lucide-react'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      {/* Glow vermelho-âmbar de fundo */}
      <div aria-hidden style={{
        position: 'fixed', top: '30%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 500, height: 500, pointerEvents: 'none',
        background: 'radial-gradient(circle, rgba(248,113,113,0.09), transparent 65%)',
        filter: 'blur(70px)',
      }} />

      <div style={{
        position: 'relative', textAlign: 'center', maxWidth: 420, zIndex: 1,
      }}>
        {/* Número */}
        <div style={{ position: 'relative', marginBottom: 32 }}>
          <p style={{
            fontSize: 'clamp(80px, 18vw, 140px)',
            fontWeight: 800, lineHeight: 1, margin: 0,
            fontFamily: 'Syne, sans-serif',
            background: 'linear-gradient(135deg, #f87171 20%, #fbbf24)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.04em',
          }}>
            500
          </p>
          <div aria-hidden style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse 60% 40% at 50% 60%, rgba(248,113,113,0.12), transparent)',
            pointerEvents: 'none', filter: 'blur(20px)',
          }} />
        </div>

        {/* Card glass */}
        <div style={{
          background: 'rgba(8,8,14,0.88)',
          border: '1px solid rgba(248,113,113,0.15)',
          borderRadius: 20, padding: '32px 28px',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 24px 70px rgba(0,0,0,0.55), 0 0 0 1px rgba(248,113,113,0.06)',
        }}>
          {/* Ícone */}
          <div style={{
            width: 48, height: 48, borderRadius: 14, margin: '0 auto 20px',
            background: 'rgba(248,113,113,0.08)',
            border: '1px solid rgba(248,113,113,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <AlertTriangle size={22} style={{ color: '#f87171' }} />
          </div>

          <h1 style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: 22, fontWeight: 700,
            color: '#dcdcf0', marginBottom: 10,
          }}>
            Algo deu errado
          </h1>
          <p style={{
            fontSize: 14, color: '#4a4a6a', lineHeight: 1.65,
            marginBottom: 28, fontFamily: 'DM Sans, sans-serif',
          }}>
            Ocorreu um erro inesperado. Você pode tentar novamente ou voltar ao painel.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={reset} style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 22px', borderRadius: 12, fontSize: 14,
              fontWeight: 700, color: 'white', cursor: 'pointer', border: 'none',
              background: 'linear-gradient(135deg, #7c6ef7, #a06ef7)',
              boxShadow: '0 4px 24px rgba(124,110,247,0.35)',
              fontFamily: 'Syne, sans-serif',
            }}>
              <RefreshCcw size={13} /> Tentar novamente
            </button>
            <Link href="/dashboard" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 22px', borderRadius: 12, fontSize: 14,
              fontWeight: 600, color: '#8a8aaa', textDecoration: 'none',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
              fontFamily: 'DM Sans, sans-serif',
            }}>
              <Home size={13} /> Voltar ao painel
            </Link>
          </div>
        </div>

        <p style={{
          marginTop: 20, fontSize: 12,
          color: 'rgba(255,255,255,0.1)',
          fontFamily: 'DM Sans, sans-serif',
        }}>
          BossFlow · © 2026
        </p>
      </div>
    </div>
  )
}
