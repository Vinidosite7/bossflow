import Link from 'next/link'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      {/* Glow de fundo */}
      <div aria-hidden style={{
        position: 'fixed', top: '30%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 500, height: 500, pointerEvents: 'none',
        background: 'radial-gradient(circle, rgba(124,110,247,0.12), transparent 65%)',
        filter: 'blur(60px)',
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
            background: 'linear-gradient(135deg, rgba(124,110,247,0.9) 30%, rgba(160,110,247,0.5))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.04em',
          }}>
            404
          </p>
          {/* Glow no número */}
          <div aria-hidden style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse 60% 40% at 50% 60%, rgba(124,110,247,0.15), transparent)',
            pointerEvents: 'none', filter: 'blur(20px)',
          }} />
        </div>

        {/* Card glass */}
        <div style={{
          background: 'rgba(8,8,14,0.85)',
          border: '1px solid rgba(124,110,247,0.18)',
          borderRadius: 20, padding: '32px 28px',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 24px 70px rgba(0,0,0,0.55), 0 0 0 1px rgba(124,110,247,0.06)',
        }}>
          <h1 style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: 22, fontWeight: 700,
            color: '#dcdcf0', marginBottom: 10,
          }}>
            Página não encontrada
          </h1>
          <p style={{
            fontSize: 14, color: '#4a4a6a',
            lineHeight: 1.65, marginBottom: 28,
            fontFamily: 'DM Sans, sans-serif',
          }}>
            A página que você buscou não existe ou foi movida para outro endereço.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/dashboard" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 24px', borderRadius: 12, fontSize: 14,
              fontWeight: 700, color: 'white', textDecoration: 'none',
              background: 'linear-gradient(135deg, #7c6ef7, #a06ef7)',
              boxShadow: '0 4px 24px rgba(124,110,247,0.35)',
              fontFamily: 'Syne, sans-serif',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}>
              <Home size={14} /> Ir para o painel
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
