import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { getTodayDate, getWeightEntries } from '@vigor/shared/weights'
import DeleteEntryButton from './delete-entry-button'
import WeightChart from './weight-chart'
import WeightForm from './weight-form'

export const revalidate = 0

// "2026-11-19" -> "19 nov. 2026"
function formatShortDate(value: string) {
  return new Date(`${value}T12:00:00Z`).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

// Heure de saisie, à Paris
function formatTime(value: string) {
  return new Date(value).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' })
}

export default async function WeightPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: entries, error } = await getWeightEntries(supabase, user?.id ?? '')

  return (
    <div className="space-y-6">
      <h1 className="text-4xl sm:text-5xl font-extrabold leading-none text-gray-900">Suivi</h1>

      <Card>
        <WeightForm today={getTodayDate()} />
      </Card>

      {/* Bandeau déroulant : s'ouvre juste sous le formulaire d'enregistrement */}
      <details className="group glass overflow-hidden rounded-xl border shadow-sm">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
          <span className="font-display text-2xl font-bold text-gray-900">
            Historique
            <span className="ml-3 font-sans text-sm font-normal text-gray-500">{entries.length}</span>
          </span>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="h-5 w-5 text-gray-500 transition-transform group-open:rotate-180"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </summary>
        {/* Même panneau que le détail d'un exercice : fond plus sombre, petite ligne grise puis le texte */}
        <div className="border-t bg-gray-50 px-4 py-2">
          {entries.length === 0 ? (
            <p className="py-2 text-sm text-gray-500">Aucune pesée enregistrée pour l&apos;instant.</p>
          ) : (
            <ul className="max-h-[28rem] divide-y overflow-y-auto">
              {entries.map((entry) => (
                <li key={entry.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div className="space-y-1">
                    <p className="text-xs uppercase text-gray-500">
                      {formatShortDate(entry.measured_on)} · saisi à {formatTime(entry.created_at)}
                    </p>
                    <p className="font-display text-xl font-bold text-gray-900">{entry.weight_kg} kg</p>
                  </div>
                  <DeleteEntryButton
                    id={entry.id}
                    label={`${entry.weight_kg} kg du ${formatShortDate(entry.measured_on)}`}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </details>

      {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}

      <section>
        <h2 className="mb-3 text-3xl font-bold text-gray-900">Évolution</h2>
        {entries.length < 2 ? (
          <p className="text-sm text-gray-600">Enregistre au moins deux pesées pour voir la courbe.</p>
        ) : (
          <Card>
            <WeightChart entries={[...entries].reverse()} />
          </Card>
        )}
      </section>
    </div>
  )
}
