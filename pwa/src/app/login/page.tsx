import type { Metadata } from 'next'
import { LoginForm } from './LoginForm'

export const metadata: Metadata = { title: 'Entrar · CRM-123 Supervisor' }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: 'var(--space-8)',
        background: 'var(--color-bg)',
      }}
    >
      <div style={{ width: 'min(420px, 100%)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)' }}>
          <h2 style={{ margin: 0 }}>CRM-123</h2>
          <span className="tag tag-accent">Supervisor</span>
        </div>
        <p className="text-muted" style={{ margin: 0, fontSize: 14 }}>
          Accede con el correo y la contraseña de tu equipo.
        </p>
        <LoginForm showUnauthorized={error === 'unauthorized'} />
      </div>
    </div>
  )
}
