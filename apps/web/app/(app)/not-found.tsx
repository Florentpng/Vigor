import { ButtonLink } from '@/components/ui/button'

// Séance introuvable ou supprimée : on garde la barre de navigation de l'app
export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-16 text-center space-y-4">
      <p className="font-display text-8xl font-extrabold leading-none text-blue-600">404</p>
      <h1 className="text-5xl font-extrabold leading-none text-gray-900">Page introuvable</h1>
      <p className="text-gray-600">Cette page n&apos;existe pas, ou la séance a été supprimée.</p>
      <div className="pt-2">
        <ButtonLink href="/">Retour à l&apos;accueil</ButtonLink>
      </div>
    </div>
  )
}
