import AuthForm from '../auth-form'
import { signup } from '../actions'

export default function SignupPage() {
  return (
    <AuthForm
      title="Inscription"
      submitLabel="Créer mon compte"
      action={signup}
      altText="Déjà un compte ?"
      altLabel="Se connecter"
      altHref="/login"
      passwordAutoComplete="new-password"
    />
  )
}
