import { createClient } from '@/lib/supabase/server'
import { badgeImageSrc } from '@/lib/badges'
import { Card } from '@/components/ui/card'
import { DumbbellIcon, FlameIcon, TimerIcon } from '@/components/ui/icons'
import { ProgressBar } from '@/components/ui/progress-bar'
import { getBadges, getHistory, getHistoryTotals, getProfile } from '@vigor/shared/queries'
import WeightForm from './weight-form'
import ResetBadgesButton from './reset-badges-button'
import BadgeCard from './badge-card'
export const revalidate = 0

// 45 -> "45 min", 135 -> "2 h 15"
function formatTotalMinutes(minutes: number) {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest === 0 ? `${hours} h` : `${hours} h ${String(rest).padStart(2, '0')}`
}

function StatTile({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode
  value: string
  label: string
}) {
  return (
    <Card className="text-center">
      <div className="flex justify-center">{icon}</div>
      <p className="mt-1 font-display text-3xl font-bold text-gray-900">{value}</p>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
    </Card>
  )
}

export default async function ProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const userId = user?.id ?? ''

  const [profile, { data: history, error }, { data: totals }, allBadges] = await Promise.all([
    getProfile(supabase, userId),
    getHistory(supabase, userId),
    getHistoryTotals(supabase, userId),
    getBadges(supabase, userId),
  ])

  const unlockedCount = allBadges.filter((b) => b.unlocked_at).length

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl sm:text-5xl font-extrabold leading-none text-gray-900">Profil</h1>
        <p className="mt-1 text-sm text-gray-600">{user?.email}</p>
      </div>

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
          icon={<FlameIcon className="h-6 w-6 text-orange-600" />}
          value={String(totals.calories)}
          label="kcal brûlées"
        />
      </div>

      <Card>
        <WeightForm initialWeight={profile.weight_kg} />
      </Card>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-3xl font-bold text-gray-900">
            Badges
            <span className="ml-3 font-sans text-sm font-normal text-gray-500">
              {unlockedCount} / {allBadges.length}
            </span>
          </h2>
          {profile.is_admin && <ResetBadgesButton />}
        </div>

        <ProgressBar
          value={allBadges.length > 0 ? (unlockedCount / allBadges.length) * 100 : 0}
          className="mb-4"
        />

        <ul className="stagger grid gap-3 sm:grid-cols-2">
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
        <h2 className="mb-3 text-3xl font-bold text-gray-900">Séances effectuées</h2>

        {error && (
          <div className="mb-3 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>
        )}

        {history.length === 0 ? (
          <p className="text-sm text-gray-500">Aucune séance enregistrée pour l&apos;instant.</p>
        ) : (
          <ul className="stagger space-y-3">
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
      </section>
    </div>
  )
}
