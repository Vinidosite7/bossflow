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
          padding: 48px 40px;
          background: #07070e;
        }
        @media (min-width: 1024px) {
          .auth-left {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            width: 54%;
            position: relative;
            overflow: hidden;
            background: #06060c;
            border-right: 1px solid rgba(255,255,255,0.05);
            padding: 48px 56px;
            gap: 32px;
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
          <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: 500, height: 500, pointerEvents: 'none',
            background: 'radial-gradient(circle, rgba(124,110,247,0.12) 0%, transparent 60%)' }} />
          <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: 400, height: 400, pointerEvents: 'none',
            background: 'radial-gradient(circle, rgba(52,211,153,0.07) 0%, transparent 60%)' }} />
          <div style={{ position: 'absolute', inset: 0, opacity: 0.02, pointerEvents: 'none',
            backgroundImage: 'linear-gradient(rgba(124,110,247,1) 1px, transparent 1px), linear-gradient(90deg, rgba(124,110,247,1) 1px, transparent 1px)',
            backgroundSize: '52px 52px' }} />

          {/* Headline */}
          <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 460 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 12px',
              borderRadius: 999, marginBottom: 16,
              background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.15)' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 500, color: '#34d399' }}>Sistema ativo · 100% online</span>
            </div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 38, fontWeight: 700,
              letterSpacing: '-0.03em', lineHeight: 1.1, color: '#e8e8f0', margin: '0 0 10px' }}>
              Controle total do{' '}
              <span style={{ background: 'linear-gradient(135deg, #7c6ef7, #b8a8ff)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>seu negócio</span>
            </h2>
            <p style={{ fontSize: 14, color: '#3a3a5c', lineHeight: 1.6, margin: 0 }}>
              Financeiro, clientes e tarefas — tudo em tempo real.
            </p>
          </div>

          {/* Dashboard mock — CENTRALIZADO */}
          <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 460 }}>

            {/* Glow atrás do card */}
            <div style={{ position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 320, height: 320, pointerEvents: 'none',
              background: 'radial-gradient(circle, rgba(124,110,247,0.12) 0%, transparent 65%)',
              filter: 'blur(20px)' }} />

            <div style={{ borderRadius: 18, overflow: 'hidden',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(124,110,247,0.08)',
              position: 'relative' }}>

              {/* Topbar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '11px 18px', borderBottom: '1px solid rgba(255,255,255,0.05)',
                background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ display: 'flex', gap: 7 }}>
                  {['#f87171','#fbbf24','#34d399'].map(c => (
                    <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
                  ))}
                </div>
                <span style={{ fontSize: 11, color: '#3a3a5c', fontWeight: 500, letterSpacing: '0.02em' }}>
                  BossFlow · Dashboard
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399' }} />
                  <span style={{ fontSize: 10, color: '#34d399' }}>ao vivo</span>
                </div>
              </div>

              {/* KPIs */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
                borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                {[
                  { label: 'Receita',  value: 'R$ 12.840', color: '#34d399', trend: '↑ 18%' },
                  { label: 'Despesas', value: 'R$ 4.210',  color: '#f87171', trend: '↓ 5%' },
                  { label: 'Lucro',    value: 'R$ 8.630',  color: '#7c6ef7', trend: '↑ 24%' },
                ].map(({ label, value, color, trend }, i) => (
                  <div key={label} style={{ padding: '14px 16px',
                    borderRight: i < 2 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                    <p style={{ fontSize: 9, color: '#2a2a3e', margin: '0 0 6px',
                      textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</p>
                    <p style={{ fontSize: 15, fontWeight: 700, color, margin: '0 0 4px' }}>{value}</p>
                    <p style={{ fontSize: 10, color: color + '99', margin: 0 }}>{trend}</p>
                  </div>
                ))}
              </div>

              {/* Chart */}
              <div style={{ padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 60, marginBottom: 10 }}>
                  {[28,45,32,62,42,74,55,80,50,85,64,100].map((h, i) => (
                    <div key={i} style={{ flex: 1, borderRadius: '4px 4px 0 0', height: `${h}%`,
                      background: i === 11
                        ? 'linear-gradient(180deg, #9d8fff, #7c6ef7)'
                        : `rgba(124,110,247,${0.07 + i * 0.05})`,
                      transition: 'opacity 0.2s',
                    }} />
                  ))}
                </div>
                <p style={{ fontSize: 10, color: '#2a2a3e', margin: 0 }}>
                  Faturamento — últimos 12 meses
                </p>
              </div>

              {/* Bottom cards */}
              <div style={{ display: 'flex', gap: 8, padding: '0 18px 18px' }}>
                {[
                  { label: 'Clientes ativos',   value: '48',  color: '#34d399' },
                  { label: 'Tarefas pendentes', value: '12',  color: '#fbbf24' },
                  { label: 'Metas cumpridas',   value: '3/5', color: '#7c6ef7' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ flex: 1, padding: '10px 12px', borderRadius: 12,
                    background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <p style={{ fontSize: 9, color: '#2a2a3e', margin: '0 0 6px', lineHeight: 1.3 }}>{label}</p>
                    <p style={{ fontSize: 18, fontWeight: 700, color, margin: 0 }}>{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <p style={{ position: 'relative', zIndex: 1, fontSize: 11, color: '#1e1e2e', margin: 0 }}>
            © 2026 BossFlow · Feito no Brasil 🇧🇷
          </p>
        </div>

        {/* RIGHT */}
        <div className="auth-right">
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(124,110,247,0.05) 0%, transparent 70%)' }} />
          <div style={{ position: 'relative', width: '100%', maxWidth: 360 }}>
            {children}
          </div>
        </div>

      </div>
    </>
  )
}
