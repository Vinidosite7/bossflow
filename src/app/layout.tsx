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
    default: 'BossFlow',
    template: '%s · BossFlow',
  },
  description: 'O financeiro da sua empresa na palma da mão',
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
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="dark" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
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
            style={{
              background:
                'radial-gradient(circle at 50% 30%, rgba(124,110,247,0.35), transparent 60%)',
            }}
          />
          <div
            className="absolute bottom-[-140px] left-[-120px] h-[520px] w-[520px] blur-[130px]"
            style={{
              background:
                'radial-gradient(circle at 50% 50%, rgba(34,211,238,0.18), transparent 60%)',
            }}
          />
          <div
            className="absolute top-[20%] right-[-160px] h-[520px] w-[520px] blur-[130px]"
            style={{
              background:
                'radial-gradient(circle at 50% 50%, rgba(52,211,153,0.14), transparent 60%)',
            }}
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
