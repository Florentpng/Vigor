'use client'

import { useEffect } from 'react'
import { Button, ButtonLink } from '@/components/ui/button'

// Écran d'erreur commun. `retry` relance le rendu du segment (convention de cette version de Next.js).
export default function ErrorView({
  error,
  retry,
  homeHref = '/',
}: {
  error: Error & { digest?: string }
  retry: () => void
  homeHref?: string
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="mx-auto max-w-md py-16 text-center space-y-4">
      <h1 className="text-5xl font-extrabold leading-none text-gray-900">Une erreur est survenue</h1>
      <p className="text-gray-600">
        Quelque chose s&apos;est mal passé de notre côté. Tu peux réessayer, ou revenir à l&apos;accueil.
      </p>
      {error.digest && <p className="text-xs text-gray-500">Référence : {error.digest}</p>}
      <div className="flex flex-wrap justify-center gap-3 pt-2">
        <Button onClick={() => retry()}>Réessayer</Button>
        <ButtonLink href={homeHref} variant="secondary">
          Retour à l&apos;accueil
        </ButtonLink>
      </div>
    </div>
  )
}
