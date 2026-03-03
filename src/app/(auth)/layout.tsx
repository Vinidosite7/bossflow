export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex" style={{ background: '#080810', fontFamily: 'Inter, sans-serif' }}>

      {/* Left - Form centralizado */}
      <div className="w-full lg:w-[480px] flex items-center justify-center relative z-10 px-8 sm:px-12 py-12">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(124,110,247,0.12) 0%, transparent 70%)' }} />

        <div className="relative w-full">
          {children}
        </div>
      </div>

      {/* Right - Visual */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0d0d1a 0%, #0a0a14 50%, #080810 100%)' }}>
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(#7c6ef7 1px, transparent 1px), linear-gradient(90deg, #7c6ef7 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }} />
        <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(124,110,247,0.15) 0%, transparent 70%)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.08) 0%, transparent 70%)' }} />

        <div className="relative z-10 flex flex-col justify-center px-16 py-12 w-full">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#34d399' }} />
            <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: '#34d399' }}>Sistema ativo</span>
          </div>
          <h2 className="text-4xl font-bold mb-4 leading-tight" style={{ fontFamily: 'Syne, sans-serif', color: '#e8e8f0' }}>
            Controle total<br />
            <span style={{ color: '#7c6ef7' }}>do seu negócio</span>
          </h2>
          <p className="text-base mb-12 max-w-sm leading-relaxed" style={{ color: '#4a4a6a' }}>
            Financeiro, clientes, tarefas e agenda — tudo num só lugar, com dados em tempo real.
          </p>
          <div className="rounded-2xl p-5 mb-4 max-w-md"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(124,110,247,0.15)', backdropFilter: 'blur(10px)' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: '#f87171' }} />
                <div className="w-2 h-2 rounded-full" style={{ background: '#fbbf24' }} />
                <div className="w-2 h-2 rounded-full" style={{ background: '#34d399' }} />
              </div>
              <span className="text-xs font-semibold" style={{ color: '#3a3a5c' }}>BossFlow</span>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: 'Receita', value: 'R$ 12.840', color: '#34d399', up: true },
                { label: 'Despesas', value: 'R$ 4.210', color: '#f87171', up: false },
                { label: 'Lucro', value: 'R$ 8.630', color: '#7c6ef7', up: true },
              ].map(({ label, value, color, up }) => (
                <div key={label} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <p className="text-xs mb-1" style={{ color: '#3a3a5c' }}>{label}</p>
                  <p className="text-sm font-bold" style={{ color }}>{value}</p>
                  <p className="text-xs mt-1" style={{ color: up ? '#34d399' : '#f87171' }}>{up ? '↑' : '↓'} 12%</p>
                </div>
              ))}
            </div>
            <div className="flex items-end gap-1 h-16 mb-2">
              {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 100].map((h, i) => (
                <div key={i} className="flex-1 rounded-t-sm"
                  style={{ height: `${h}%`, background: i === 11 ? '#7c6ef7' : `rgba(124,110,247,${0.2 + i * 0.05})` }} />
              ))}
            </div>
            <p className="text-xs" style={{ color: '#3a3a5c' }}>Fluxo de caixa — últimos 12 meses</p>
          </div>
          <div className="flex flex-col gap-2 max-w-md">
            {['✓ Financeiro com gráficos em tempo real', '✓ Gestão de clientes e vendas', '✓ Tarefas, agenda e relatórios'].map(f => (
              <p key={f} className="text-sm" style={{ color: '#3a3a5c' }}>{f}</p>
            ))}
          </div>
        </div>
        <div className="absolute left-0 top-0 bottom-0 w-px"
          style={{ background: 'linear-gradient(to bottom, transparent, rgba(124,110,247,0.3), transparent)' }} />
      </div>
    </div>
  )
}
