'use client'

// Dernier filet de sécurité : erreur dans le layout racine. Ce fichier remplace tout le document
// et ne reçoit pas les styles globaux, d'où les styles en ligne.
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0b0f19',
          color: '#f8fafc',
          fontFamily: 'Arial, Helvetica, sans-serif',
          textAlign: 'center',
          padding: 24,
        }}
      >
        <div style={{ maxWidth: 420 }}>
          <h1 style={{ fontSize: 32, margin: '0 0 12px' }}>Une erreur est survenue</h1>
          <p style={{ color: '#a9b6c9', margin: '0 0 8px' }}>
            Le site a rencontré un problème. Tu peux réessayer.
          </p>
          {error.digest && (
            <p style={{ color: '#64748b', fontSize: 12, margin: '0 0 16px' }}>
              Référence : {error.digest}
            </p>
          )}
          <button
            onClick={() => retry()}
            style={{
              background: '#ff6b00',
              color: '#fff',
              border: 0,
              borderRadius: 8,
              padding: '10px 20px',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  )
}
