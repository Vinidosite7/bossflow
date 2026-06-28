import { AcernityFonts } from '@/components/ui/aceternity'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AcernityFonts />
      <style>{`
        /* Chrome autofill override */
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 1000px #08080f inset !important;
          -webkit-text-fill-color: #e8e8f0 !important;
          caret-color: #e8e8f0 !important;
          border-color: rgba(255,255,255,0.08) !important;
        }

        @keyframes auth-orb-a {
          0%,100% { transform: translate(0,0) scale(1); }
          50%      { transform: translate(40px,-30px) scale(1.08); }
        }
        @keyframes auth-orb-b {
          0%,100% { transform: translate(0,0) scale(1); }
          40%      { transform: translate(-30px,40px) scale(0.93); }
        }
        @keyframes auth-float {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-8px); }
        }
        @keyframes auth-bar-grow {
          from { width: 0; }
        }
        .auth-bar { animation: auth-bar-grow 1.2s ease forwards; }

        .auth-input:focus-within {
          border-color: rgba(124,110,247,0.55) !important;
          box-shadow: 0 0 0 3px rgba(124,110,247,0.1) !important;
        }
      `}</style>

      <div style={{ minHeight: '100vh', display: 'flex', background: '#07070e', fontFamily: 'Inter, system-ui, sans-serif', overflowX: 'hidden' }}>

        {/* ─── LEFT PANEL ─── desktop only */}
        <div className="hidden lg:flex" style={{
          width: '54%', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          position: 'relative', overflow: 'hidden',
          background: 'radial-gradient(ellipse 120% 100% at 50% 110%, rgba(124,110,247,0.06) 0%, #06060c 55%)',
          borderRight: '1px solid rgba(255,255,255,0.045)',
          padding: '48px 56px', gap: 36,
        }}>

          {/* Dot grid */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: 'radial-gradient(circle, rgba(124,110,247,0.09) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
            maskImage: 'radial-gradient(ellipse 75% 70% at 50% 40%, black, transparent)',
            WebkitMaskImage: 'radial-gradient(ellipse 75% 70% at 50% 40%, black, transparent)',
          }} />

          {/* Orbs */}
          <div style={{ position: 'absolute', top: '-8%', left: '-8%', width: 560, height: 560, pointerEvents: 'none',
            background: 'radial-gradient(circle at center, rgba(124,110,247,0.13) 0%, transparent 60%)',
            filter: 'blur(40px)', animation: 'auth-orb-a 18s ease-in-out infinite' }} />
          <div style={{ position: 'absolute', bottom: '-8%', right: '-5%', width: 420, height: 420, pointerEvents: 'none',
            background: 'radial-gradient(circle at center, rgba(52,211,153,0.09) 0%, transparent 60%)',
            filter: 'blur(36px)', animation: 'auth-orb-b 22s ease-in-out infinite' }} />

          {/* Logo */}
          <div style={{ position: 'relative', zIndex: 1, alignSelf: 'flex-start' }}>
            <img src="/bossflow.png" alt="BossFlow" style={{ height: 34, objectFit: 'contain' }} />
          </div>

          {/* Headline */}
          <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 460 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px',
              borderRadius: 999, marginBottom: 18,
              background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.15)' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 6px #34d399' }} />
              <span style={{ fontSize: 11, fontWeight: 500, color: '#34d399', letterSpacing: '0.04em' }}>Sistema ativo · 100% online</span>
            </div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 38, fontWeight: 700,
              letterSpacing: '-0.03em', lineHeight: 1.1, color: '#e8e8f0', margin: '0 0 12px' }}>
              Controle total do{' '}
              <span style={{ background: 'linear-gradient(135deg, #7c6ef7, #b8a8ff)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>seu negócio</span>
            </h2>
            <p style={{ fontSize: 14, color: '#3a3a58', lineHeight: 1.7, margin: 0 }}>
              Financeiro, clientes e tarefas — tudo em um painel.<br/>Feito para empreendedores brasileiros.
            </p>
          </div>

          {/* Dashboard mock card */}
          <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 460, animation: 'auth-float 6s ease-in-out infinite' }}>
            {/* Glow behind card */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
              width: 340, height: 280, pointerEvents: 'none',
              background: 'radial-gradient(circle, rgba(124,110,247,0.14) 0%, transparent 65%)',
              filter: 'blur(24px)' }} />

            <div style={{ borderRadius: 20, overflow: 'hidden',
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(255,255,255,0.07)',
              boxShadow: '0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(124,110,247,0.07)',
              position: 'relative' }}>

              {/* Topbar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '11px 18px', borderBottom: '1px solid rgba(255,255,255,0.05)',
                background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['#f87171','#fbbf24','#34d399'].map(c => (
                    <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c, opacity: 0.7 }} />
                  ))}
                </div>
                <span style={{ fontSize: 11, color: '#2a2a4a', fontWeight: 500, letterSpacing: '0.04em' }}>BossFlow · Dashboard</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 5px #34d399' }} />
                  <span style={{ fontSize: 10, color: '#34d399' }}>ao vivo</span>
                </div>
              </div>

              {/* KPIs */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                {[
                  { label: 'Receita',  value: 'R$ 12.840', color: '#34d399', trend: '↑ 18%' },
                  { label: 'Despesas', value: 'R$ 4.210',  color: '#f87171', trend: '↓ 5%' },
                  { label: 'Lucro',    value: 'R$ 8.630',  color: '#a78bfa', trend: '↑ 24%' },
                ].map(({ label, value, color, trend }, i) => (
                  <div key={label} style={{ padding: '14px 16px', borderRight: i < 2 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                    <p style={{ fontSize: 9, color: '#2a2a3e', margin: '0 0 5px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</p>
                    <p style={{ fontSize: 15, fontWeight: 700, color, margin: '0 0 3px', textShadow: `0 0 14px ${color}44` }}>{value}</p>
                    <p style={{ fontSize: 10, color: color + '88', margin: 0 }}>{trend}</p>
                  </div>
                ))}
              </div>

              {/* Bar chart */}
              <div style={{ padding: '16px 18px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 56, marginBottom: 10 }}>
                  {[28,45,32,62,42,74,55,80,50,85,64,100].map((h, i) => (
                    <div key={i} style={{ flex: 1, borderRadius: '3px 3px 0 0', height: `${h}%`,
                      background: i === 11
                        ? 'linear-gradient(180deg, #9d8fff, #7c6ef7)'
                        : `rgba(124,110,247,${0.06 + i * 0.045})`,
                      boxShadow: i === 11 ? '0 0 10px rgba(124,110,247,0.5)' : 'none',
                    }} />
                  ))}
                </div>
                <p style={{ fontSize: 10, color: '#2a2a3e', margin: 0 }}>Faturamento — últimos 12 meses</p>
              </div>

              {/* Mini cards */}
              <div style={{ display: 'flex', gap: 8, padding: '0 18px 18px' }}>
                {[
                  { label: 'Clientes ativos',   value: '48',  color: '#34d399' },
                  { label: 'Tarefas pendentes', value: '12',  color: '#fbbf24' },
                  { label: 'Metas cumpridas',   value: '3/5', color: '#7c6ef7' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ flex: 1, padding: '10px 12px', borderRadius: 12,
                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.055)',
                    boxShadow: `0 0 14px ${color}08` }}>
                    <p style={{ fontSize: 9, color: '#2a2a3e', margin: '0 0 5px', lineHeight: 1.3 }}>{label}</p>
                    <p style={{ fontSize: 18, fontWeight: 700, color, margin: 0, textShadow: `0 0 12px ${color}44` }}>{value}</p>
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

        {/* ─── RIGHT PANEL ─── */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', padding: '48px 32px',
          background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(124,110,247,0.04) 0%, transparent 70%)' }}>

          {/* Subtle right-side orb */}
          <div style={{ position: 'absolute', top: '20%', right: '-10%', width: 300, height: 300, pointerEvents: 'none',
            background: 'radial-gradient(circle at center, rgba(124,110,247,0.07) 0%, transparent 65%)',
            filter: 'blur(30px)', animation: 'auth-orb-b 24s ease-in-out infinite' }} />

          <div style={{ position: 'relative', width: '100%', maxWidth: 364 }}>
            {children}
          </div>
        </div>
      </div>
    </>
  )
}
