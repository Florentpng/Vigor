import { createClient } from '@/lib/supabase/server'
import { badgeImageSrc } from '@/lib/badges'
import { getBadges, getHistory, getProfile } from '@vigor/shared/queries'
import WeightForm from './weight-form'
import ResetBadgesButton from './reset-badges-button'
import BadgeCard from './badge-card'
export const revalidate = 0

export default async function ProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const userId = user?.id ?? ''

  const [profile, { data: history, error }, allBadges] = await Promise.all([
    getProfile(supabase, userId),
    getHistory(supabase, userId),
    getBadges(supabase, userId),
  ])

  const unlockedCount = allBadges.filter((b) => b.unlocked_at).length

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profil</h1>
        <p className="mt-1 text-sm text-gray-600">{user?.email}</p>
      </div>

      <section className="bg-white border rounded-xl p-5 shadow-sm">
        <WeightForm initialWeight={profile.weight_kg} />
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-800">
            Badges
            <span className="ml-2 text-sm font-normal text-gray-500">
              {unlockedCount} / {allBadges.length}
            </span>
          </h2>
          {profile.is_admin && <ResetBadgesButton />}
        </div>

        <ul className="grid gap-3 sm:grid-cols-2">
          {allBadges.map((badge) => {
            const unlockedAt = badge.unlocked_at

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
          <div className="mb-3 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>
        )}

        {history.length === 0 ? (
          <p className="text-sm text-gray-500">Aucune séance enregistrée pour l&apos;instant.</p>
        ) : (
          <ul className="bg-white border rounded-xl shadow-sm divide-y overflow-hidden">
            {history.map((log) => (
              <li key={log.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <div>
                  <p className="font-medium text-gray-900">{log.workout_name ?? 'Séance supprimée'}</p>
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
