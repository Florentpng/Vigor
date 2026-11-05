import AuthForm from '../auth-form'
import { login } from '../actions'

export default function LoginPage() {
  return (
    <AuthForm
      title="Connexion"
      submitLabel="Se connecter"
      action={login}
      altText="Pas encore de compte ?"
      altLabel="S'inscrire"
      altHref="/signup"
      passwordAutoComplete="current-password"
    />
  )
}
