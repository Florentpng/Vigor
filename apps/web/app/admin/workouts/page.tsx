import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatRestTime } from '@vigor/shared/format'
import DeleteWorkoutButton from './delete-button'

export const revalidate = 0

type WorkoutRow = {
  id: string
  name: string
  description: string | null
  workout_exercises: {
    order_index: number
    target_sets: number
    target_reps: number
    rest_time: number
    exercises: { name: string; muscle_group: string; equipment: string } | null
  }[]
}

const ROW_GRID = 'grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)_minmax(0,1fr)_11rem] items-center gap-4'

export default async function AdminWorkoutsPage() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('workouts')
    .select(
      'id, name, description, workout_exercises(order_index, target_sets, target_reps, rest_time, exercises(name, muscle_group, equipment))'
    )
    .is('user_id', null)
    .order('created_at', { ascending: false })

  const workouts = (data ?? []) as unknown as WorkoutRow[]

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Séances Modèles</h2>
        <Link
          href="/admin/workouts/new"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Ajouter une séance
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error.message}</div>
      )}

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div
          className={`${ROW_GRID} bg-gray-50 border-b px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider`}
        >
          <span>Nom</span>
          <span>Description</span>
          <span>Exercices</span>
          <span className="text-right">Actions</span>
        </div>

        {workouts.length === 0 ? (
          <p className="p-4 text-center text-sm text-gray-500">Aucune séance modèle.</p>
        ) : (
          <div className="divide-y text-sm">
            {workouts.map((workout) => {
              const exercises = [...workout.workout_exercises].sort(
                (a, b) => a.order_index - b.order_index
              )

              return (
                <details key={workout.id} className="group">
                  <summary
                    className={`${ROW_GRID} px-4 py-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden hover:bg-gray-50`}
                  >
                    <span className="flex items-center gap-2 font-medium text-gray-900">
                      <svg
                        className="h-4 w-4 shrink-0 text-gray-400 transition-transform group-open:rotate-180"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {workout.name}
                    </span>
                    <span className="text-gray-600">{workout.description}</span>
                    <span className="text-gray-600">{exercises.length}</span>
                    <span className="text-right space-x-3">
                      <Link
                        href={`/admin/workouts/${workout.id}`}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        Modifier
                      </Link>
                      <DeleteWorkoutButton id={workout.id} name={workout.name} />
                    </span>
                  </summary>

                  <div className="bg-gray-50 border-t px-4 py-3 pl-10">
                    {exercises.length === 0 ? (
                      <p className="text-gray-500">Aucun exercice dans cette séance.</p>
                    ) : (
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            <th className="py-2 pr-4">#</th>
                            <th className="py-2 pr-4">Exercice</th>
                            <th className="py-2 pr-4">Groupe</th>
                            <th className="py-2 pr-4">Équipement</th>
                            <th className="py-2 pr-4">Séries</th>
                            <th className="py-2 pr-4">Répétitions</th>
                            <th className="py-2">Repos</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {exercises.map((item, index) => (
                            <tr key={index}>
                              <td className="py-2 pr-4 text-gray-500">{index + 1}</td>
                              <td className="py-2 pr-4 font-medium text-gray-900">
                                {item.exercises?.name ?? 'Exercice supprimé'}
                              </td>
                              <td className="py-2 pr-4 text-gray-600">
                                {item.exercises?.muscle_group}
                              </td>
                              <td className="py-2 pr-4 text-gray-600">
                                {item.exercises?.equipment}
                              </td>
                              <td className="py-2 pr-4 text-gray-600">{item.target_sets}</td>
                              <td className="py-2 pr-4 text-gray-600">{item.target_reps}</td>
                              <td className="py-2 text-gray-600">{formatRestTime(item.rest_time)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </details>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
