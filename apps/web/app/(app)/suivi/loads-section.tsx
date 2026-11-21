import { Collapsible } from '@/components/ui/collapsible'
import { formatLoad, type LoadSession, type LoadSummary } from '@vigor/shared/loads'
import WeightChart from './weight-chart'

// Charges de chaque exercice : charge actuelle et record ; un clic ouvre la courbe d'évolution
export default function LoadsSection({
  loads,
  histories,
}: {
  loads: LoadSummary[]
  histories: Record<string, LoadSession[]>
}) {
  return (
    <Collapsible title="Charges">
      {loads.length === 0 ? (
        <p className="px-4 py-3 text-sm text-gray-500">
          Tes charges apparaîtront ici après ta première séance enregistrée.
        </p>
      ) : (
        // Hauteur limitée : seul ce bloc défile
        <ul className="max-h-[28rem] space-y-3 overflow-y-auto p-3">
          {loads.map((item) => {
            const bodyweight = item.equipment === 'PDC'
            // La courbe réutilise celle du poids de corps : une valeur = la charge la plus lourde d'une séance
            const points = (histories[item.exercise_id] ?? []).map((s) => ({
              id: s.session_id,
              measured_on: s.date,
              weight_kg: s.max_kg,
              created_at: s.date,
            }))

            return (
              <li key={item.exercise_id}>
                <details className="group glass overflow-hidden rounded-xl border shadow-sm">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-gray-900">{item.name}</span>
                      {item.muscle_group && (
                        <span className="block text-xs text-gray-500">
                          {item.muscle_group} · {item.equipment}
                        </span>
                      )}
                    </span>
                    <span className="flex shrink-0 items-center gap-3">
                      <span className="text-right">
                        <span className="block font-display text-2xl font-bold text-gray-900">
                          {item.weight_kg > 0 ? formatLoad(item.weight_kg) : bodyweight ? 'PDC' : '-'}
                        </span>
                        {item.record_kg > item.weight_kg && (
                          <span className="block text-xs text-gray-500">Record {formatLoad(item.record_kg)}</span>
                        )}
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
                    </span>
                  </summary>
                  <div className="border-t bg-gray-50 px-4 py-3">
                    {points.length >= 2 ? (
                      <WeightChart entries={points} />
                    ) : (
                      <p className="text-sm text-gray-500">Il faut au moins 2 séances pour tracer la courbe.</p>
                    )}
                  </div>
                </details>
              </li>
            )
          })}
        </ul>
      )}
    </Collapsible>
  )
}
