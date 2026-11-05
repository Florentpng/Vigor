import { signUp } from '@vigor/shared/auth'

import AuthForm from '@/components/auth-form'
import { supabase } from '@/lib/supabase'

export default function SignupScreen() {
  return (
    <AuthForm
      title="Inscription"
      submitLabel="Créer mon compte"
      action={(email, password) => signUp(supabase, email, password)}
      altText="Déjà un compte ?"
      altLabel="Se connecter"
      altHref="/login"
      isSignup
    />
  )
}
