'use client'

import ErrorView from '@/components/error-view'

// Erreurs hors de l'app connectée et de l'admin (pages de connexion, etc.)
export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  return (
    <div className="app-shell min-h-screen p-6">
      <ErrorView error={error} retry={retry} />
    </div>
  )
}
