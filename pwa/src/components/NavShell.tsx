import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'
import type { Profile } from '@/lib/dal'
import { logout } from '@/app/actions/auth'

// Pantallas ya construidas en este hito. Vendedores/Usuarios/Resumen se
// añaden aquí en Hito 4 (DESIGN_BRIEF.md secciones 3.3–3.5) — BUILD_PLAN.md
// Hito 2 detiene la construcción antes de esas pantallas.
const NAV_ITEMS = [{ href: '/panel', label: 'Panel del equipo' }]

const PILL = 'font-family:var(--font-body);font-size:14px;cursor:pointer;padding:8px 16px;border-radius:999px;border:1px solid var(--color-divider);background:transparent;color:var(--color-text)'
const PILL_ON = 'font-family:var(--font-body);font-size:14px;cursor:pointer;padding:8px 16px;border-radius:999px;border:1px solid var(--color-accent);background:var(--color-accent);color:var(--color-bg)'

function styleFromString(css: string): CSSProperties {
  const style: Record<string, string> = {}
  for (const rule of css.split(';')) {
    const [prop, value] = rule.split(':')
    if (!prop || !value) continue
    const camel = prop.trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase())
    style[camel] = value.trim()
  }
  return style
}

export function NavShell({
  profile,
  activeHref,
  children,
}: {
  profile: Profile
  activeHref: string
  children: ReactNode
}) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', fontFamily: 'var(--font-body)' }}>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 5,
          background: 'var(--color-bg)',
          padding: 'var(--space-4) var(--space-6) var(--space-3)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
          borderBottom: '1px solid var(--color-divider)',
        }}
      >
        <div style={{ maxWidth: 980, margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 20 }}>CRM-123</div>
          <span className="tag tag-accent">Supervisor</span>
          <div className="text-muted" style={{ marginLeft: 'auto', fontSize: 13 }}>
            {profile.full_name}
          </div>
          <form action={logout}>
            <button className="btn btn-secondary" type="submit" style={{ fontSize: 12, padding: '4px 12px' }}>
              Salir
            </button>
          </form>
        </div>
        <nav style={{ maxWidth: 980, margin: '0 auto', width: '100%', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{ textDecoration: 'none', ...styleFromString(item.href === activeHref ? PILL_ON : PILL) }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <main style={{ maxWidth: 980, margin: '0 auto', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
        {children}
      </main>
    </div>
  )
}
