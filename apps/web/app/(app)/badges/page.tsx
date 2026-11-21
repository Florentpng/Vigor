import { createClient } from '@/lib/supabase/server'
import { badgeImageSrc } from '@/lib/badges'
import { ProgressBar } from '@/components/ui/progress-bar'
import { getBadges, getProfile } from '@vigor/shared/queries'
import ResetBadgesButton from './reset-badges-button'
import BadgeCard from './badge-card'

export const revalidate = 0

export default async function BadgesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const userId = user?.id ?? ''

  const [profile, allBadges] = await Promise.all([getProfile(supabase, userId), getBadges(supabase, userId)])
  const unlockedCount = allBadges.filter((b) => b.unlocked_at).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-4xl sm:text-5xl font-extrabold leading-none text-gray-900">
          Badges
          <span className="ml-3 font-sans text-sm font-normal text-gray-500">
            {unlockedCount} / {allBadges.length}
          </span>
        </h1>
        {profile.is_admin && <ResetBadgesButton />}
      </div>

      <ProgressBar value={allBadges.length > 0 ? (unlockedCount / allBadges.length) * 100 : 0} />

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
    </div>
  )
}
