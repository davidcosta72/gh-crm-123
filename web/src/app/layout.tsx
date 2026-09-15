import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CRM-123 Ventas',
  description: 'CRM-123 — aplicación de escritorio para el equipo comercial.',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
