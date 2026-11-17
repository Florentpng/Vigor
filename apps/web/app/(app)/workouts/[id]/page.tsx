import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ButtonLink } from '@/components/ui/button'
import { LevelBadge } from '@/components/ui/level-badge'
import { RestLabel, SetsPill } from '@/components/ui/sets-pill'
import { parseWorkoutTitle } from '@vigor/shared/format'
import { getWeeklyPlan } from '@vigor/shared/queries'
import { getSessionWorkout } from '@vigor/shared/workouts'
import DaysPicker from './days-picker'
import DeleteMyWorkoutButton from './delete-button'

export const revalidate = 0

export default async function WorkoutDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [detail, { data: plan }] = await Promise.all([
    getSessionWorkout(supabase, id),
    getWeeklyPlan(supabase, user?.id ?? ''),
  ])

  if (!detail) notFound()

  const isMine = detail.user_id !== null && detail.user_id === user?.id
  const { exercises } = detail
  const { title, level } = parseWorkoutTitle(detail.name, detail.user_id)

  const initialDays = plan.filter((r) => r.workout_id === id).map((r) => r.weekday)
  const takenBy: Record<number, string> = {}
  for (const row of plan) {
    if (row.workout_id !== id && row.workout_name) takenBy[row.weekday] = row.workout_name
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/workouts" className="text-sm text-blue-600 hover:underline">
          ← Toutes les séances
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-none text-gray-900">{title}</h1>
          {level && <LevelBadge>{level}</LevelBadge>}
        </div>
        {detail.description && <p className="mt-3 text-gray-600">{detail.description}</p>}
        <div className="mt-4 flex flex-wrap gap-3">
          <ButtonLink href={`/?workout=${id}`}>Faire cette séance aujourd&apos;hui</ButtonLink>
          {isMine && (
            <>
              <ButtonLink href={`/workouts/${id}/edit`} variant="secondary">
                Modifier
              </ButtonLink>
              <DeleteMyWorkoutButton id={id} name={detail.name} />
            </>
          )}
        </div>
      </div>

      <DaysPicker workoutId={id} initialDays={initialDays} takenBy={takenBy} />

      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-800">
          Exercices ({exercises.length})
        </h2>

        {exercises.length === 0 ? (
          <p className="text-sm text-gray-500">Cette séance ne contient aucun exercice.</p>
        ) : (
          <ol className="stagger space-y-4">
            {exercises.map((exercise, index) => {
              const isGif = exercise.video_url?.toLowerCase().endsWith('.gif')

              return (
                <li key={index} className="glass border rounded-xl p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium text-gray-500">
                        Exercice {String(index + 1).padStart(2, '0')}
                      </p>
                      <h3 className="text-xl font-bold text-gray-900">{exercise.name}</h3>
                      {exercise.muscle_group && (
                        <p className="mt-1 text-xs text-gray-500">
                          {exercise.muscle_group} · {exercise.equipment}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-1">
                      <SetsPill sets={exercise.target_sets} reps={exercise.target_reps} />
                      <RestLabel seconds={exercise.rest_time} />
                    </div>
                  </div>

                  {exercise.description && (
                    <p className="mt-3 text-sm text-gray-600">{exercise.description}</p>
                  )}

                  {exercise.video_url &&
                    (isGif ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={exercise.video_url}
                        alt={exercise.name}
                        className="mt-3 max-h-56 rounded-lg border"
                      />
                    ) : (
                      <video
                        src={exercise.video_url}
                        controls
                        muted
                        playsInline
                        className="mt-3 max-h-56 rounded-lg border"
                      />
                    ))}
                </li>
              )
            })}
          </ol>
        )}
      </section>
    </div>
  )
}
