import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'
import type { Profile } from '@/lib/dal'
import { logout } from '@/app/actions/auth'

// Pantallas ya construidas en este hito. Oportunidades/Clientes/Tareas se
// añaden aquí en Hito 3 (DESIGN_BRIEF.md secciones 2.3–2.5) — BUILD_PLAN.md
// Hito 2 detiene la construcción antes de esas pantallas.
const NAV_ITEMS = [{ href: '/tablero', label: 'Tablero del día' }]

const NAV = 'display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;text-align:left;font-family:var(--font-body);font-size:15px;cursor:pointer;padding:9px 14px;border:0;border-radius:999px;background:transparent;color:var(--color-text)'
const NAV_ON = 'display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;text-align:left;font-family:var(--font-body);font-size:15px;font-weight:700;cursor:pointer;padding:9px 14px;border:0;border-radius:999px;background:var(--color-accent);color:var(--color-bg)'

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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'stretch', background: 'var(--color-bg)', fontFamily: 'var(--font-body)' }}>
      <aside
        style={{
          width: 232,
          flex: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-6)',
          padding: 'var(--space-4)',
          background: 'var(--color-surface)',
          borderRadius: '0 calc(var(--radius-lg) * 1.15) calc(var(--radius-lg) * 1.15) 0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, padding: 'var(--space-2) var(--space-2) 0' }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 20 }}>CRM-123</div>
          <span className="tag tag-accent">Ventas</span>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{ textDecoration: 'none', ...styleFromString(item.href === activeHref ? NAV_ON : NAV) }}
            >
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div
          style={{
            marginTop: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-2)',
            padding: 'var(--space-3)',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-neutral-100)',
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700 }}>{profile.full_name}</div>
          <div className="text-muted" style={{ fontSize: 12 }}>
            {profile.email} · {profile.role === 'supervisor' ? 'Supervisora' : 'Vendedor/a'}
          </div>
          <form action={logout}>
            <button className="btn btn-secondary" type="submit" style={{ alignSelf: 'flex-start', fontSize: 12, padding: '4px 12px' }}>
              Salir
            </button>
          </form>
        </div>
      </aside>

      <main style={{ flex: 1, minWidth: 0, padding: 'var(--space-6) var(--space-8)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        {children}
      </main>
    </div>
  )
}
