export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex" style={{ background: '#07070f', fontFamily: 'Inter, sans-serif' }}>

      {/* ── Esquerda — Visual ───────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden flex-col justify-between p-16"
        style={{ background: 'linear-gradient(135deg, #0c0c1d 0%, #09091a 100%)' }}>

        {/* Grid de fundo */}
        <div className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: 'linear-gradient(#7c6ef7 1px, transparent 1px), linear-gradient(90deg, #7c6ef7 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }} />

        {/* Glows */}
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(124,110,247,0.18) 0%, transparent 65%)', filter: 'blur(40px)' }} />
        <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.1) 0%, transparent 65%)', filter: 'blur(40px)' }} />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #7c6ef7, #9d8fff)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="white" strokeWidth="1.5" />
            </svg>
          </div>
          <span className="font-bold text-base tracking-tight" style={{ color: '#e8e8f0', fontFamily: 'Syne, sans-serif' }}>BossFlow</span>
        </div>

        {/* Conteúdo central */}
        <div className="relative z-10 flex flex-col gap-8">
          {/* Badge */}
          <div className="flex items-center gap-2 w-fit px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}>
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#34d399' }} />
            <span className="text-xs font-semibold" style={{ color: '#34d399' }}>Sistema ativo</span>
          </div>

          <div>
            <h2 className="text-5xl font-bold leading-[1.1] mb-4"
              style={{ fontFamily: 'Syne, sans-serif', color: '#e8e8f0', letterSpacing: '-0.03em' }}>
              Controle total<br />
              <span style={{
                background: 'linear-gradient(135deg, #7c6ef7, #9d8fff)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>do seu negócio</span>
            </h2>
            <p className="text-base leading-relaxed max-w-xs" style={{ color: '#4a4a6a' }}>
              Financeiro, clientes, tarefas e agenda — tudo num só lugar.
            </p>
          </div>

          {/* Mock dashboard card */}
          <div className="rounded-2xl overflow-hidden max-w-sm"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)' }}>
            {/* Topbar do card */}
            <div className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: '#f87171' }} />
                <div className="w-2 h-2 rounded-full" style={{ background: '#fbbf24' }} />
                <div className="w-2 h-2 rounded-full" style={{ background: '#34d399' }} />
              </div>
              <span className="text-xs font-semibold" style={{ color: '#2a2a3e' }}>Dashboard · Março 2026</span>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-3 gap-px" style={{ background: 'rgba(255,255,255,0.04)' }}>
              {[
                { label: 'Receita', value: 'R$ 12.840', color: '#34d399', trend: '+18%' },
                { label: 'Despesas', value: 'R$ 4.210', color: '#f87171', trend: '-5%' },
                { label: 'Lucro', value: 'R$ 8.630', color: '#7c6ef7', trend: '+24%' },
              ].map(({ label, value, color, trend }) => (
                <div key={label} className="px-4 py-3" style={{ background: '#0c0c1d' }}>
                  <p className="text-xs mb-1" style={{ color: '#3a3a5c' }}>{label}</p>
                  <p className="text-sm font-bold mb-0.5" style={{ color }}>{value}</p>
                  <p className="text-xs" style={{ color: color + 'aa' }}>{trend}</p>
                </div>
              ))}
            </div>

            {/* Gráfico de barras */}
            <div className="px-4 py-4">
              <div className="flex items-end gap-1 h-14">
                {[35, 55, 40, 75, 50, 85, 65, 90, 60, 95, 72, 100].map((h, i) => (
                  <div key={i} className="flex-1 rounded-sm transition-all"
                    style={{
                      height: `${h}%`,
                      background: i === 11
                        ? 'linear-gradient(180deg, #7c6ef7, #9d8fff)'
                        : `rgba(124,110,247,${0.12 + i * 0.04})`,
                    }} />
                ))}
              </div>
              <p className="text-xs mt-2" style={{ color: '#2a2a3e' }}>Faturamento — últimos 12 meses</p>
            </div>
          </div>

          {/* Features */}
          <div className="flex flex-col gap-2.5">
            {[
              { icon: '📊', text: 'Dashboard financeiro em tempo real' },
              { icon: '🎯', text: 'Metas mensais com progresso visual' },
              { icon: '🏢', text: 'Múltiplas empresas num só login' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <span className="text-base">{icon}</span>
                <span className="text-sm" style={{ color: '#3a3a5c' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Rodapé */}
        <div className="relative z-10">
          <p className="text-xs" style={{ color: '#2a2a3e' }}>© 2026 BossFlow · Feito no Brasil 🇧🇷</p>
        </div>

        {/* Linha separadora direita */}
        <div className="absolute right-0 top-0 bottom-0 w-px"
          style={{ background: 'linear-gradient(to bottom, transparent, rgba(124,110,247,0.2) 50%, transparent)' }} />
      </div>

      {/* ── Direita — Form ──────────────────────────────────────────────── */}
      <div className="w-full lg:w-[480px] flex items-center justify-center relative px-8 sm:px-12 py-12"
        style={{ background: '#07070f' }}>

        {/* Glow sutil atrás do form */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(124,110,247,0.07) 0%, transparent 70%)', filter: 'blur(40px)' }} />

        <div className="relative w-full max-w-sm">
          {children}
        </div>
      </div>

    </div>
  )
}
