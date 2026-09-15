import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type Profile = {
  id: string
  email: string
  full_name: string
  role: 'vendedor' | 'supervisor'
  active: boolean
}

/**
 * Verifica sesión + perfil activo. El rol SIEMPRE se lee de `profiles`
 * (nunca del JWT) — CLAUDE.md sección 2. Si no hay perfil activo para el
 * usuario autenticado, cierra la sesión y redirige a "acceso no autorizado".
 */
export const getAuthenticatedProfile = cache(async (): Promise<Profile> => {
  const supabase = await createClient()

  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims()
  if (claimsError || !claimsData?.claims) {
    redirect('/login')
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, active')
    .eq('id', claimsData.claims.sub)
    .single()

  if (error || !profile || !profile.active) {
    await supabase.auth.signOut()
    redirect('/login?error=unauthorized')
  }

  return profile
})
