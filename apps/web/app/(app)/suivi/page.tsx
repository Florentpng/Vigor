import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Collapsible } from '@/components/ui/collapsible'
import { DumbbellIcon, FlameIcon, TimerIcon } from '@/components/ui/icons'
import { getLoadHistory, getLoadSummaries, type LoadSession } from '@vigor/shared/loads'
import { getHistory, getHistoryTotals } from '@vigor/shared/queries'
import { getTodayDate, getWeightEntries } from '@vigor/shared/weights'
import DeleteEntryButton from './delete-entry-button'
import LoadsSection from './loads-section'
import WeightChart from './weight-chart'
import WeightForm from './weight-form'

export const revalidate = 0

// 45 -> "45 min", 135 -> "2 h 15"
function formatTotalMinutes(minutes: number) {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest === 0 ? `${hours} h` : `${hours} h ${String(rest).padStart(2, '0')}`
}

function StatTile({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <Card className="text-center">
      <div className="flex justify-center">{icon}</div>
      <p className="mt-1 font-display text-3xl font-bold text-gray-900">{value}</p>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
    </Card>
  )
}

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

  const userId = user?.id ?? ''
  const [{ data: entries, error }, { data: history, error: historyError }, { data: totals }, loads] = await Promise.all([
    getWeightEntries(supabase, userId),
    getHistory(supabase, userId),
    getHistoryTotals(supabase, userId),
    getLoadSummaries(supabase, userId),
  ])
  // Historique de chaque exercice pour sa courbe
  const histories: Record<string, LoadSession[]> = {}
  await Promise.all(
    loads.data.map(async (item) => {
      histories[item.exercise_id] = (await getLoadHistory(supabase, userId, item.exercise_id)).data
    })
  )

  return (
    <div className="space-y-6">
      <h1 className="text-4xl sm:text-5xl font-extrabold leading-none text-gray-900">Suivi</h1>

      <div className="grid grid-cols-3 gap-3">
        <StatTile
          icon={<DumbbellIcon className="h-6 w-6 text-blue-600" />}
          value={String(totals.sessions)}
          label={totals.sessions > 1 ? 'Séances' : 'Séance'}
        />
        <StatTile
          icon={<TimerIcon className="h-6 w-6 text-blue-600" />}
          value={formatTotalMinutes(totals.minutes)}
          label="Temps total"
        />
        <StatTile
          icon={<FlameIcon className="h-7 w-7 text-orange-600" />}
          value={String(totals.calories)}
          label="kcal brûlées"
        />
      </div>

      <Card>
        <WeightForm today={getTodayDate()} />
      </Card>

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

      {/* Bandeau déroulant : s'ouvre juste sous le formulaire d'enregistrement */}
      <details className="group glass overflow-hidden rounded-xl border shadow-sm">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
          <span className="font-display text-2xl font-bold text-gray-900">
            Historique
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


      <LoadsSection loads={loads.data} histories={histories} />

      <Collapsible title="Séances effectuées">
        {historyError && <div className="m-3 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{historyError}</div>}

        {history.length === 0 ? (
          <p className="px-4 py-3 text-sm text-gray-500">Aucune séance enregistrée pour l&apos;instant.</p>
        ) : (
          // Hauteur limitée : seul ce bloc défile, la page ne s'allonge pas avec le nombre de séances
          <ul className="max-h-[28rem] space-y-3 overflow-y-auto p-3">
            {history.map((log) => (
              <li
                key={log.id}
                className="glass flex items-center justify-between gap-3 rounded-xl border px-4 py-3 shadow-sm"
              >
                <div>
                  <p className="font-semibold text-gray-900">{log.workout_name ?? 'Séance supprimée'}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(log.completed_at).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      timeZone: 'Europe/Paris',
                    })}
                  </p>
                </div>
                <div className="shrink-0 space-y-0.5 text-right text-sm">
                  <p className="flex items-center justify-end gap-1.5 text-gray-600">
                    <TimerIcon className="h-4 w-4 text-blue-600" />
                    {log.duration_minutes} min
                  </p>
                  <p className="flex items-center justify-end gap-1.5 text-orange-600">
                    <FlameIcon className="h-4 w-4" />
                    {Math.round(log.calories_burned)} kcal
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Collapsible>
    </div>
  )
}
