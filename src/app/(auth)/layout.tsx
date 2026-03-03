export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#080810', fontFamily: 'Inter, sans-serif' }}>

      {/* LEFT - Visual */}
      <div style={{
        display: 'none', width: '52%', position: 'relative', overflow: 'hidden',
        flexDirection: 'column', padding: '48px 56px', background: '#080810',
        borderRight: '1px solid rgba(255,255,255,0.05)',
      }} className="lg:flex">

        {/* Glows */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: 600, height: 600, pointerEvents: 'none',
          background: 'radial-gradient(circle at 15% 15%, rgba(124,110,247,0.14) 0%, transparent 60%)', }} />
        <div style={{ position: 'absolute', bottom: 0, right: 0, width: 400, height: 400, pointerEvents: 'none',
          background: 'radial-gradient(circle at 85% 85%, rgba(52,211,153,0.08) 0%, transparent 60%)', }} />
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.025, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(124,110,247,1) 1px, transparent 1px), linear-gradient(90deg, rgba(124,110,247,1) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
        }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative', zIndex: 1 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #7c6ef7, #9d8fff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(124,110,247,0.4)' }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="white" />
            </svg>
          </div>
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 17, color: '#e8e8f0' }}>BossFlow</span>
        </div>

        {/* Center content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 36, position: 'relative', zIndex: 1 }}>

          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 999,
              background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.15)', marginBottom: 20 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize: 12, fontWeight: 500, color: '#34d399' }}>Sistema ativo · 100% online</span>
            </div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 42, fontWeight: 700, letterSpacing: '-0.03em',
              color: '#e8e8f0', lineHeight: 1.1, marginBottom: 14 }}>
              Controle total<br />
              <span style={{ background: 'linear-gradient(135deg, #7c6ef7 30%, #b8a8ff)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>do seu negócio</span>
            </h2>
            <p style={{ fontSize: 15, color: '#3a3a5c', lineHeight: 1.6, maxWidth: 300 }}>
              Financeiro, clientes, tarefas — tudo num só lugar com dados em tempo real.
            </p>
          </div>

          {/* Dashboard mock */}
          <div style={{ maxWidth: 400, borderRadius: 16, overflow: 'hidden',
            background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {['#f87171','#fbbf24','#34d399'].map(c => (
                  <div key={c} style={{ width: 9, height: 9, borderRadius: '50%', background: c }} />
                ))}
              </div>
              <span style={{ fontSize: 11, color: '#2a2a3e' }}>Dashboard · Março 2026</span>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              {[
                { label: 'Receita', value: 'R$ 12.840', color: '#34d399', trend: '+18%' },
                { label: 'Despesas', value: 'R$ 4.210', color: '#f87171', trend: '-5%' },
                { label: 'Lucro', value: 'R$ 8.630', color: '#7c6ef7', trend: '+24%' },
              ].map(({ label, value, color, trend }, i) => (
                <div key={label} style={{ padding: '12px 14px', borderRight: i < 2 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                  <p style={{ fontSize: 10, color: '#2a2a3e', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</p>
                  <p style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 2 }}>{value}</p>
                  <p style={{ fontSize: 10, color: color + '99' }}>{trend}</p>
                </div>
              ))}
            </div>
            <div style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 44 }}>
                {[28,48,35,68,44,78,58,84,52,88,66,100].map((h, i) => (
                  <div key={i} style={{ flex: 1, borderRadius: '3px 3px 0 0', height: `${h}%`,
                    background: i === 11 ? 'linear-gradient(180deg, #7c6ef7, #9d8fff)' : `rgba(124,110,247,${0.1 + i*0.04})` }} />
                ))}
              </div>
              <p style={{ fontSize: 10, color: '#2a2a3e', marginTop: 8 }}>Faturamento — últimos 12 meses</p>
            </div>
          </div>

          {/* Features */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              ['📊', 'Dashboard financeiro em tempo real'],
              ['🎯', 'Metas mensais com progresso visual'],
              ['🏢', 'Múltiplas empresas num só login'],
              ['📱', 'Funciona como app no celular'],
            ].map(([icon, text]) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 14, width: 20, textAlign: 'center' }}>{icon}</span>
                <span style={{ fontSize: 13, color: '#3a3a5c' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p style={{ fontSize: 11, color: '#1e1e2e', position: 'relative', zIndex: 1 }}>© 2026 BossFlow · Feito no Brasil 🇧🇷</p>
      </div>

      {/* RIGHT - Form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', padding: '48px 32px', background: '#07070e' }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(124,110,247,0.06) 0%, transparent 70%)' }} />
        <div style={{ position: 'relative', width: '100%', maxWidth: 360 }}>
          {children}
        </div>
      </div>

    </div>
  )
}
