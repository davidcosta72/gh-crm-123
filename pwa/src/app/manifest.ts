import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CRM-123 Supervisor',
    short_name: 'CRM-123',
    description: 'Consulta rápida del estado del equipo comercial — CRM-123.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f5ead8',
    theme_color: '#7a8a5e',
    lang: 'es-ES',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
