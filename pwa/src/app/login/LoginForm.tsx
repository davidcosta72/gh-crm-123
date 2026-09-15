'use client'

import { useState } from 'react'
import { CircleAlert } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function LoginForm({ showError }: { showError: boolean }) {
  const [pending, setPending] = useState(false)

  async function login() {
    setPending(true)
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <div className="card elev-sm" style={{ gap: 'var(--space-3)', padding: 'var(--space-6)' }}>
      <button
        className="btn btn-primary btn-block"
        onClick={login}
        disabled={pending}
        style={{ minHeight: 48, fontSize: 16 }}
      >
        {pending ? 'Conectando…' : 'Entrar con Google'}
      </button>
      {showError && (
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
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-accent-2-800)' }}>
              Acceso no autorizado
            </div>
            <div style={{ fontSize: 13, color: 'var(--color-accent-2-800)', opacity: 0.85 }}>
              Esta cuenta no pertenece al equipo.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
