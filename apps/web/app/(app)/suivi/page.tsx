import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { getTodayDate, getWeightEntries } from '@vigor/shared/weights'
import DeleteEntryButton from './delete-entry-button'
import WeightForm from './weight-form'

export const revalidate = 0

// "2026-11-19" -> "jeudi 19 novembre 2026"
function formatDate(value: string) {
  return new Date(`${value}T12:00:00Z`).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Paris',
  })
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

      {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}

      <section>
        <h2 className="mb-3 text-3xl font-bold text-gray-900">Historique</h2>
        {entries.length === 0 ? (
          <p className="text-sm text-gray-600">Aucune pesée enregistrée pour l&apos;instant.</p>
        ) : (
          <ul className="space-y-3">
            {entries.map((entry) => (
              <li key={entry.id}>
                <Card className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-display text-2xl font-bold text-gray-900">{entry.weight_kg} kg</p>
                    <p className="text-xs text-gray-500">{formatDate(entry.measured_on)}</p>
                  </div>
                  <DeleteEntryButton id={entry.id} />
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
