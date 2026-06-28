import type { Metadata, Viewport } from 'next'
import './globals.css'
import Script from 'next/script'
import { ToastContainer } from '@/components/ToastContainer'

export const viewport: Viewport = {
  themeColor: '#7c6ef7',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: {
    default: 'BossFlow — Gestão financeira para pequenas empresas',
    template: '%s · BossFlow',
  },
  description: 'Controle financeiro, vendas, clientes e tarefas para pequenas empresas brasileiras. Simples, rápido e feito para o dia a dia.',
  keywords: ['gestão financeira', 'controle de despesas', 'pequenas empresas', 'fluxo de caixa', 'gestão empresarial'],
  authors: [{ name: 'BossFlow', url: 'https://bossflow.pro' }],
  creator: 'BossFlow',
  metadataBase: new URL('https://app.bossflow.pro'),
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'BossFlow' },
  icons: { icon: '/icon-192.png', apple: '/icon-192.png' },
  openGraph: {
    type: 'website', locale: 'pt_BR',
    url: 'https://app.bossflow.pro', siteName: 'BossFlow',
    title: 'BossFlow — Gestão financeira para pequenas empresas',
    description: 'Controle financeiro, vendas, clientes e tarefas para pequenas empresas brasileiras.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'BossFlow' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BossFlow — Gestão financeira para pequenas empresas',
    description: 'Controle financeiro, vendas, clientes e tarefas para pequenas empresas brasileiras.',
    images: ['/og-image.png'],
  },
  robots: { index: false, follow: false },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* Anti-flash síncrono — roda antes de qualquer CSS */}
        <script dangerouslySetInnerHTML={{ __html: `document.documentElement.style.backgroundColor='#070812'` }} />
        <meta name="color-scheme" content="dark" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        {/* Fallback inline para garantir escuro antes do Tailwind */}
        <style>{`html,body{background-color:#070812!important;color:#dcdcf0}`}</style>
      </head>

      <body
        suppressHydrationWarning
        style={{ background: 'var(--bg)', color: 'var(--text)' }}
        className="min-h-screen relative overflow-x-hidden"
      >
        {/* ── Background ambiental fixo ───────────────────────────── */}
        <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
          {/* Base */}
          <div className="absolute inset-0" style={{ background: '#070812' }} />

          {/* Glow roxo — topo centro */}
          <div className="absolute -top-32 left-1/2 h-[600px] w-[900px] -translate-x-1/2"
            style={{
              background: 'radial-gradient(ellipse 70% 60% at 50% 20%, rgba(124,110,247,0.28), transparent 65%)',
              filter: 'blur(90px)',
              pointerEvents: 'none',
            }} />

          {/* Glow ciano — canto inferior esquerdo */}
          <div className="absolute bottom-[-160px] left-[-140px] h-[500px] w-[500px]"
            style={{
              background: 'radial-gradient(circle, rgba(34,211,238,0.12), transparent 65%)',
              filter: 'blur(100px)',
              pointerEvents: 'none',
            }} />

          {/* Glow verde — canto superior direito */}
          <div className="absolute top-[15%] right-[-180px] h-[500px] w-[500px]"
            style={{
              background: 'radial-gradient(circle, rgba(52,211,153,0.10), transparent 65%)',
              filter: 'blur(100px)',
              pointerEvents: 'none',
            }} />
        </div>

        {/* ── Conteúdo ─────────────────────────────────────────────── */}
        <div className="relative z-10 flex flex-col min-h-screen">
          {children}
        </div>

        {/* ── Toasts ───────────────────────────────────────────────── */}
        <ToastContainer />

        {/* ── Service Worker ───────────────────────────────────────── */}
        <Script src="/register-sw.js" strategy="afterInteractive" />
      </body>
    </html>
  )
}
