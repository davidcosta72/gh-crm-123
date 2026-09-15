import type { Metadata } from 'next'
import { ListChecks, Sparkles } from 'lucide-react'
import { getAuthenticatedProfile } from '@/lib/dal'
import { NavShell } from '@/components/NavShell'

export const metadata: Metadata = { title: 'Tablero del día · CRM-123 Ventas' }

const today = () =>
  new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Europe/Madrid',
  }).format(new Date())

export default async function TableroPage() {
  const profile = await getAuthenticatedProfile()
  const fecha = today()
  const fechaCapitalizada = fecha.charAt(0).toUpperCase() + fecha.slice(1)

  return (
    <NavShell profile={profile} activeHref="/tablero">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: 1080 }}>
        <header style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ margin: 0 }}>Tablero del día</h3>
            <div className="text-muted" style={{ fontSize: 13 }}>
              {fechaCapitalizada}
            </div>
          </div>
          <button className="btn btn-primary" disabled title="Disponible en el próximo hito">
            Nueva tarea
          </button>
        </header>

        <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <h6 style={{ margin: 0 }}>Tareas de hoy y vencidas</h6>
          <div
            className="card"
            style={{ alignItems: 'flex-start', gap: 'var(--space-3)', padding: 'var(--space-8)', textAlign: 'left' }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'var(--color-accent-2-200)',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <ListChecks size={22} strokeWidth={2.75} style={{ color: 'var(--color-accent-2-700)' }} />
            </div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 20 }}>No tienes tareas pendientes hoy</div>
            <p className="text-muted" style={{ margin: 0, fontSize: 14 }}>
              Cuando cierres una llamada o acuerdes una reunión, regístrala aquí.
            </p>
            <button className="btn btn-primary" disabled title="Disponible en el próximo hito">
              Crear una tarea
            </button>
          </div>
        </section>

        <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <h6 style={{ margin: 0 }}>Oportunidades sin actividad reciente</h6>
          <div
            className="card"
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
              <Sparkles size={22} strokeWidth={2.75} style={{ color: 'var(--color-accent-700)' }} />
            </div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 20 }}>Aún no hay oportunidades</div>
            <p className="text-muted" style={{ margin: 0, fontSize: 14 }}>
              Aquí aparecerán las oportunidades de tus clientes que lleven varios días sin actividad.
            </p>
          </div>
        </section>
      </div>
    </NavShell>
  )
}
