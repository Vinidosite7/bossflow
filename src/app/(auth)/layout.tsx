export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        .auth-wrapper {
          min-height: 100vh;
          display: flex;
          background: #07070e;
          font-family: Inter, sans-serif;
        }
        .auth-left {
          display: none;
        }
        .auth-right {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          padding: 48px 32px;
          background: #07070e;
        }
        @media (min-width: 1024px) {
          .auth-left {
            display: flex;
            flex-direction: column;
            width: 52%;
            position: relative;
            overflow: hidden;
            background: #07070e;
            border-right: 1px solid rgba(255,255,255,0.05);
            padding: 48px 56px;
          }
        }
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px #0d0d1a inset !important;
          -webkit-text-fill-color: #e8e8f0 !important;
          caret-color: #e8e8f0 !important;
        }
      `}</style>

      <div className="auth-wrapper">

        {/* LEFT */}
        <div className="auth-left">

          {/* Glows */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: 600, height: 600, pointerEvents: 'none',
            background: 'radial-gradient(circle at 15% 20%, rgba(124,110,247,0.15) 0%, transparent 55%)' }} />
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: 400, height: 400, pointerEvents: 'none',
            background: 'radial-gradient(circle at 80% 80%, rgba(52,211,153,0.07) 0%, transparent 60%)' }} />
          <div style={{ position: 'absolute', inset: 0, opacity: 0.025, pointerEvents: 'none',
            backgroundImage: 'linear-gradient(rgba(124,110,247,1) 1px, transparent 1px), linear-gradient(90deg, rgba(124,110,247,1) 1px, transparent 1px)',
            backgroundSize: '56px 56px' }} />

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative', zIndex: 1 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: 'linear-gradient(135deg, #7c6ef7, #9d8fff)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(124,110,247,0.4)' }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="white" />
              </svg>
            </div>
            <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 17, color: '#e8e8f0' }}>BossFlow</span>
          </div>

          {/* Center */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 32, position: 'relative', zIndex: 1 }}>

            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px',
                borderRadius: 999, marginBottom: 20,
                background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.15)' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399' }} />
                <span style={{ fontSize: 11, fontWeight: 500, color: '#34d399' }}>Sistema ativo · 100% online</span>
              </div>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 44, fontWeight: 700,
                letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: 14, color: '#e8e8f0' }}>
                Controle total<br />
                <span style={{ background: 'linear-gradient(135deg, #7c6ef7 30%, #b8a8ff)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>do seu negócio</span>
              </h2>
              <p style={{ fontSize: 15, color: '#3a3a5c', lineHeight: 1.65, maxWidth: 310, margin: 0 }}>
                Financeiro, clientes, tarefas e agenda — tudo num só lugar com dados em tempo real.
              </p>
            </div>

            {/* Dashboard mock */}
            <div style={{ maxWidth: 420, borderRadius: 16, overflow: 'hidden',
              background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }}>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['#f87171','#fbbf24','#34d399'].map(c => (
                    <div key={c} style={{ width: 9, height: 9, borderRadius: '50%', background: c }} />
                  ))}
                </div>
                <span style={{ fontSize: 11, color: '#2a2a3e', fontWeight: 500 }}>BossFlow · Dashboard</span>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
                borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                {[
                  { label: 'Receita',  value: 'R$ 12.840', color: '#34d399', trend: '↑ 18%' },
                  { label: 'Despesas', value: 'R$ 4.210',  color: '#f87171', trend: '↓ 5%' },
                  { label: 'Lucro',    value: 'R$ 8.630',  color: '#7c6ef7', trend: '↑ 24%' },
                ].map(({ label, value, color, trend }, i) => (
                  <div key={label} style={{ padding: '12px 14px',
                    borderRight: i < 2 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                    <p style={{ fontSize: 10, color: '#2a2a3e', marginBottom: 5,
                      textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px' }}>{label}</p>
                    <p style={{ fontSize: 14, fontWeight: 700, color, margin: '0 0 3px' }}>{value}</p>
                    <p style={{ fontSize: 10, color: color + '99', margin: 0 }}>{trend}</p>
                  </div>
                ))}
              </div>

              <div style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 52, marginBottom: 8 }}>
                  {[28,48,35,68,44,78,58,84,52,88,66,100].map((h, i) => (
                    <div key={i} style={{ flex: 1, borderRadius: '3px 3px 0 0', height: `${h}%`,
                      background: i === 11
                        ? 'linear-gradient(180deg, #9d8fff, #7c6ef7)'
                        : `rgba(124,110,247,${0.08 + i * 0.045})` }} />
                  ))}
                </div>
                <p style={{ fontSize: 10, color: '#2a2a3e', margin: 0 }}>Faturamento — últimos 12 meses</p>
              </div>

              <div style={{ display: 'flex', gap: 8, padding: '0 16px 16px' }}>
                {[
                  { label: 'Clientes ativos', value: '48', color: '#34d399' },
                  { label: 'Tarefas pendentes', value: '12', color: '#fbbf24' },
                  { label: 'Metas cumpridas', value: '3/5', color: '#7c6ef7' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ flex: 1, padding: '10px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <p style={{ fontSize: 9, color: '#2a2a3e', marginBottom: 4, margin: '0 0 4px' }}>{label}</p>
                    <p style={{ fontSize: 16, fontWeight: 700, color, margin: 0 }}>{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Features */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                ['📊', 'Dashboard financeiro em tempo real'],
                ['🎯', 'Metas mensais com progresso visual'],
                ['🏢', 'Múltiplas empresas num só login'],
                ['📱', 'Funciona como app no celular'],
              ].map(([icon, text]) => (
                <div key={String(text)} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 14, width: 20, textAlign: 'center', flexShrink: 0 }}>{icon}</span>
                  <span style={{ fontSize: 13, color: '#3a3a5c' }}>{text}</span>
                </div>
              ))}
            </div>
          </div>

          <p style={{ fontSize: 11, color: '#1e1e2e', position: 'relative', zIndex: 1, margin: 0 }}>
            © 2026 BossFlow · Feito no Brasil 🇧🇷
          </p>
        </div>

        {/* RIGHT */}
        <div className="auth-right">
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(124,110,247,0.06) 0%, transparent 70%)' }} />
          <div style={{ position: 'relative', width: '100%', maxWidth: 360 }}>
            {children}
          </div>
        </div>

      </div>
    </>
  )
}
