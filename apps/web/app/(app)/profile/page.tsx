import { createClient } from '@/lib/supabase/server'
import { badgeImageSrc } from '@/lib/badges'
import WeightForm from './weight-form'
import ResetBadgesButton from './reset-badges-button'
import BadgeCard from './badge-card'
export const revalidate = 0

type LogRow = {
  id: string
  completed_at: string
  duration_minutes: number
  calories_burned: number
  workouts: { name: string } | null
}

export default async function ProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [{ data: profile }, { data: logs, error }, { data: badges }, { data: unlockedRows }] =
    await Promise.all([
    supabase.from('profiles').select('weight_kg, is_admin').eq('id', user?.id ?? '').maybeSingle(),
    supabase
      .from('workout_logs')
      .select('id, completed_at, duration_minutes, calories_burned, workouts(name)')
      .eq('user_id', user?.id ?? '')
      .order('completed_at', { ascending: false })
      .limit(20),
    supabase.from('badges').select('id, code, title, description, image_url').order('title'),
    supabase.from('user_badges').select('badge_id, unlocked_at').eq('user_id', user?.id ?? ''),
  ])

  const history = (logs ?? []) as unknown as LogRow[]
  const unlocked = new Map(
    ((unlockedRows ?? []) as { badge_id: string; unlocked_at: string }[]).map((r) => [
      r.badge_id,
      r.unlocked_at,
    ])
  )
  const allBadges = (badges ?? []) as {
    id: string
    code: string
    title: string
    description: string
    image_url: string | null
  }[]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profil</h1>
        <p className="mt-1 text-sm text-gray-600">{user?.email}</p>
      </div>

      <section className="bg-white border rounded-xl p-5 shadow-sm">
        <WeightForm initialWeight={profile?.weight_kg ?? null} />
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-800">
            Badges
            <span className="ml-2 text-sm font-normal text-gray-500">
              {unlocked.size} / {allBadges.length}
            </span>
          </h2>
          {profile?.is_admin && <ResetBadgesButton />}
        </div>

        <ul className="grid gap-3 sm:grid-cols-2">
          {allBadges.map((badge) => {
            const unlockedAt = unlocked.get(badge.id)

            return (
              <BadgeCard
                key={badge.id}
                title={badge.title}
                description={badge.description}
                imageSrc={badgeImageSrc(badge.code)}
                unlocked={Boolean(unlockedAt)}
                statusLabel={
                  unlockedAt
                    ? `Débloqué le ${new Date(unlockedAt).toLocaleDateString('fr-FR', {
                        timeZone: 'Europe/Paris',
                      })}`
                    : 'Verrouillé'
                }
              />
            )
          })}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-800">Séances effectuées</h2>

        {error && (
          <div className="mb-3 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error.message}</div>
        )}

        {history.length === 0 ? (
          <p className="text-sm text-gray-500">Aucune séance enregistrée pour l&apos;instant.</p>
        ) : (
          <ul className="bg-white border rounded-xl shadow-sm divide-y overflow-hidden">
            {history.map((log) => (
              <li key={log.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <div>
                  <p className="font-medium text-gray-900">{log.workouts?.name ?? 'Séance supprimée'}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(log.completed_at).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      timeZone: 'Europe/Paris',
                    })}
                  </p>
                </div>
                <p className="shrink-0 text-right text-gray-600">
                  {log.duration_minutes} min
                  <span className="block text-xs text-orange-600">
                    {Math.round(log.calories_burned)} kcal
                  </span>
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
