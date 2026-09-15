'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { CircleAlert } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function LoginForm({ showUnauthorized }: { showUnauthorized: boolean }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)
  const [credentialsError, setCredentialsError] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setPending(true)
    setCredentialsError(false)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setCredentialsError(true)
      setPending(false)
      return
    }

    router.push('/tablero')
    router.refresh()
  }

  const errorMessage = credentialsError
    ? 'Revisa que el correo y la contraseña sean correctos e inténtalo de nuevo.'
    : showUnauthorized
      ? 'Esta cuenta no pertenece al equipo. Pide a tu supervisor que te dé de alta.'
      : null

  return (
    <form
      onSubmit={handleSubmit}
      className="card elev-sm"
      style={{ gap: 'var(--space-3)', padding: 'var(--space-6)' }}
    >
      <div className="field">
        <label htmlFor="email">Correo</label>
        <input
          id="email"
          type="email"
          className="input"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="password">Contraseña</label>
        <input
          id="password"
          type="password"
          className="input"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <button className="btn btn-primary btn-block" type="submit" disabled={pending} style={{ minHeight: 44, fontSize: 15 }}>
        {pending ? 'Entrando…' : 'Entrar'}
      </button>
      {errorMessage && (
        <div
          style={{
            display: 'flex',
            gap: 'var(--space-2)',
            alignItems: 'flex-start',
            padding: 'var(--space-3)',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-accent-100)',
          }}
        >
          <CircleAlert
            size={18}
            strokeWidth={2.75}
            style={{ flex: 'none', marginTop: 2, color: 'var(--color-accent-700)' }}
          />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-accent-800)' }}>
              {credentialsError ? 'Correo o contraseña incorrectos' : 'Acceso no autorizado'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--color-accent-800)', opacity: 0.85 }}>{errorMessage}</div>
          </div>
        </div>
      )}
    </form>
  )
}
