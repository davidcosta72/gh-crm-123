import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CRM-123 Supervisor',
  description: 'CRM-123 — PWA de consulta rápida para supervisión del equipo.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CRM-123',
  },
}

export const viewport = {
  themeColor: '#7a8a5e',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
