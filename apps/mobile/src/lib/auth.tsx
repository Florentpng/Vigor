import type { Session } from '@supabase/supabase-js'
import { createContext, type PropsWithChildren, use, useEffect, useState } from 'react'

import { supabase } from '@/lib/supabase'

type AuthContextValue = {
  session: Session | null
  // true tant que la session enregistrée sur le téléphone n'a pas été lue
  isLoading: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function useSession() {
  const value = use(AuthContext)
  if (!value) throw new Error('useSession doit être utilisé dans <SessionProvider />')
  return value
}

// Id de l'utilisateur connecté (les écrans de (app) ne s'affichent que connecté)
export function useUserId(): string {
  return useSession().session?.user.id ?? ''
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setIsLoading(false)
    })

    // Connexion, déconnexion, rafraîchissement du jeton
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => setSession(newSession))
    return () => subscription.unsubscribe()
  }, [])

  return <AuthContext.Provider value={{ session, isLoading }}>{children}</AuthContext.Provider>
}
