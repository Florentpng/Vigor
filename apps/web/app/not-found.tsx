import { ButtonLink } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="app-shell min-h-screen p-6 flex items-center justify-center">
      <div className="max-w-md text-center space-y-4">
        <p className="font-display text-8xl font-extrabold leading-none text-blue-600">404</p>
        <h1 className="text-5xl font-extrabold leading-none text-gray-900">Page introuvable</h1>
        <p className="text-gray-600">
          Cette page n&apos;existe pas, ou la séance a été supprimée.
        </p>
        <div className="pt-2">
          <ButtonLink href="/">Retour à l&apos;accueil</ButtonLink>
        </div>
      </div>
    </div>
  )
}
