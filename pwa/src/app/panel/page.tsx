import type { Metadata } from 'next'
import { Users } from 'lucide-react'
import { getAuthenticatedProfile } from '@/lib/dal'
import { NavShell } from '@/components/NavShell'

export const metadata: Metadata = { title: 'Panel del equipo · CRM-123 Supervisor' }

const today = () =>
  new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Europe/Madrid',
  }).format(new Date())

export default async function PanelPage() {
  const profile = await getAuthenticatedProfile()

  return (
    <NavShell profile={profile} activeHref="/panel">
      <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div>
          <h3 style={{ margin: 0 }}>Panel del equipo</h3>
          <div className="text-muted" style={{ fontSize: 13 }}>
            {today()}
          </div>
        </div>

        <div
          className="card elev-sm"
          style={{ alignItems: 'flex-start', gap: 'var(--space-3)', padding: 'var(--space-8)', textAlign: 'left' }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'var(--color-accent-100)',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <Users size={22} strokeWidth={2.75} style={{ color: 'var(--color-accent-700)' }} />
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 20 }}>El equipo aún no tiene actividad</div>
          <p className="text-muted" style={{ margin: 0, fontSize: 14 }}>
            Cuando tus vendedores registren clientes y oportunidades, verás aquí el pipeline consolidado y las
            tareas pendientes por vendedor.
          </p>
        </div>
      </section>
    </NavShell>
  )
}
