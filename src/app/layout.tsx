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
  keywords: ['gestão financeira', 'controle de despesas', 'pequenas empresas', 'fluxo de caixa', 'gestão empresarial', 'software de gestão'],
  authors: [{ name: 'BossFlow', url: 'https://bossflow.pro' }],
  creator: 'BossFlow',
  metadataBase: new URL('https://app.bossflow.pro'),
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'BossFlow',
  },
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-192.png',
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://app.bossflow.pro',
    siteName: 'BossFlow',
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
  robots: {
    index: false,
    follow: false,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
  {/* PRIMEIRA LINHA — roda síncrono antes de tudo */}
  <script dangerouslySetInnerHTML={{ __html: `document.documentElement.style.backgroundColor='#070812';document.documentElement.style.background='#070812'` }} />
  
  <meta name="color-scheme" content="dark" />
  {/* iOS PWA */}
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <link rel="apple-touch-icon" href="/icon-192.png" />
  {/* Anti-flash branco: fundo escuro antes do JS carregar */}
  <style>{`html,body{background-color:#070812!important}`}</style>
</head>

      <body
        suppressHydrationWarning
        style={{
          background: 'var(--bf-bg)',
          color: 'var(--bf-text)',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        }}
        className="min-h-screen relative overflow-x-hidden"
      >
        {/* ===== BOSSFLOW SIGNATURE BACKGROUND ===== */}
        <div className="pointer-events-none fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-[#070812]" />
          <div
            className="absolute -top-24 left-1/2 h-[520px] w-[900px] -translate-x-1/2 blur-[120px]"
            style={{ background: 'radial-gradient(circle at 50% 30%, rgba(124,110,247,0.35), transparent 60%)' }}
          />
          <div
            className="absolute bottom-[-140px] left-[-120px] h-[520px] w-[520px] blur-[130px]"
            style={{ background: 'radial-gradient(circle at 50% 50%, rgba(34,211,238,0.18), transparent 60%)' }}
          />
          <div
            className="absolute top-[20%] right-[-160px] h-[520px] w-[520px] blur-[130px]"
            style={{ background: 'radial-gradient(circle at 50% 50%, rgba(52,211,153,0.14), transparent 60%)' }}
          />
        </div>

        {/* ===== CONTEÚDO ===== */}
        <div className="relative z-10 flex flex-col min-h-screen">
          {children}
        </div>

        {/* ===== TOASTS ===== */}
        <ToastContainer />

        {/* ===== SERVICE WORKER ===== */}
        <Script src="/register-sw.js" strategy="afterInteractive" />
      </body>
    </html>
  )
}
