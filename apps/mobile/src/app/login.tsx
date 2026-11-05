import { signIn } from '@vigor/shared/auth'

import AuthForm from '@/components/auth-form'
import { supabase } from '@/lib/supabase'

export default function LoginScreen() {
  return (
    <AuthForm
      title="Connexion"
      submitLabel="Se connecter"
      action={(email, password) => signIn(supabase, email, password)}
      altText="Pas encore de compte ?"
      altLabel="S'inscrire"
      altHref="/signup"
    />
  )
}
