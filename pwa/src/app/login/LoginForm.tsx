'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { CircleAlert } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type LoginError = 'credentials' | 'unconfirmed' | null

export function LoginForm({ showUnauthorized }: { showUnauthorized: boolean }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)
  const [loginError, setLoginError] = useState<LoginError>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setPending(true)
    setLoginError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      // error.code es más fiable que error.message (que puede cambiar de
      // redacción); ver @supabase/auth-js GoTrueClient para los valores.
      setLoginError(error.code === 'email_not_confirmed' ? 'unconfirmed' : 'credentials')
      setPending(false)
      return
    }

    router.push('/panel')
    router.refresh()
  }

  const errorTitle =
    loginError === 'unconfirmed'
      ? 'Cuenta sin confirmar'
      : loginError === 'credentials'
        ? 'Correo o contraseña incorrectos'
        : 'Acceso no autorizado'

  const errorMessage =
    loginError === 'unconfirmed'
      ? 'Tu cuenta existe pero no está confirmada. Confírmala desde el panel de Supabase.'
      : loginError === 'credentials'
        ? 'Revisa que el correo y la contraseña sean correctos e inténtalo de nuevo.'
        : showUnauthorized
          ? 'Esta cuenta no pertenece al equipo.'
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
      <button className="btn btn-primary btn-block" type="submit" disabled={pending} style={{ minHeight: 48, fontSize: 16 }}>
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
            background: 'var(--color-accent-2-200)',
          }}
        >
          <CircleAlert
            size={18}
            strokeWidth={2.75}
            style={{ flex: 'none', marginTop: 2, color: 'var(--color-accent-2-700)' }}
          />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-accent-2-800)' }}>{errorTitle}</div>
            <div style={{ fontSize: 13, color: 'var(--color-accent-2-800)', opacity: 0.85 }}>{errorMessage}</div>
          </div>
        </div>
      )}
    </form>
  )
}
