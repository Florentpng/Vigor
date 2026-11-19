import type { ImageSource } from 'expo-image'

// Images des badges (assets/badges/<code en minuscules>.png). Les `require` doivent être statiques.
const BADGE_IMAGES: Record<string, ImageSource> = {
  FIRST_WORKOUT: require('@/assets/badges/first_workout.png'),
  CENTURY_CLUB_SESSIONS: require('@/assets/badges/century_club_sessions.png'),
  EARLY_BIRD: require('@/assets/badges/early_bird.png'),
  NIGHT_OWL: require('@/assets/badges/night_owl.png'),
  WEEKLY_STREAK_3: require('@/assets/badges/weekly_streak_3.png'),
  FULL_BODY_WEEK: require('@/assets/badges/full_body_week.png'),
  MOVER_10T: require('@/assets/badges/mover_10t.png'),
  BENCH_100KG: require('@/assets/badges/bench_100kg.png'),
  OVERLOAD_PRO: require('@/assets/badges/overload_pro.png'),
  LOG_MASTER: require('@/assets/badges/log_master.png'),
  WORKOUT_BUDDY: require('@/assets/badges/workout_buddy.png'),
}

// Versions en niveaux de gris, pour les badges verrouillés (le filtre d'image ne marche pas partout)
const GRAY_BADGE_IMAGES: Record<string, ImageSource> = {
  FIRST_WORKOUT: require('@/assets/badges-gray/first_workout.png'),
  CENTURY_CLUB_SESSIONS: require('@/assets/badges-gray/century_club_sessions.png'),
  EARLY_BIRD: require('@/assets/badges-gray/early_bird.png'),
  NIGHT_OWL: require('@/assets/badges-gray/night_owl.png'),
  WEEKLY_STREAK_3: require('@/assets/badges-gray/weekly_streak_3.png'),
  FULL_BODY_WEEK: require('@/assets/badges-gray/full_body_week.png'),
  MOVER_10T: require('@/assets/badges-gray/mover_10t.png'),
  BENCH_100KG: require('@/assets/badges-gray/bench_100kg.png'),
  OVERLOAD_PRO: require('@/assets/badges-gray/overload_pro.png'),
  LOG_MASTER: require('@/assets/badges-gray/log_master.png'),
  WORKOUT_BUDDY: require('@/assets/badges-gray/workout_buddy.png'),
}

// null : pas d'image pour ce badge (une étoile est affichée à la place)
export function badgeImage(code: string, unlocked = true): ImageSource | null {
  return (unlocked ? BADGE_IMAGES : GRAY_BADGE_IMAGES)[code] ?? null
}
