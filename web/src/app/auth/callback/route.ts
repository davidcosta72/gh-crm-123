import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// TECHNICAL_SPEC.md sección 4: tras el OAuth de Google, verifica en el
// servidor que exista un `profile` activo para este usuario. Si no,
// cierra la sesión y muestra "acceso no autorizado" — nunca se confía
// solo en el login de Google.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (!exchangeError) {
      const { data: claimsData } = await supabase.auth.getClaims()

      if (claimsData?.claims) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('active')
          .eq('id', claimsData.claims.sub)
          .single()

        if (profile?.active) {
          return NextResponse.redirect(`${origin}/tablero`)
        }
      }

      await supabase.auth.signOut()
    }
  }

  return NextResponse.redirect(`${origin}/login?error=unauthorized`)
}
