// Codes des badges qui ont une image dans public/badges/<code en minuscules>.png
const BADGES_WITH_IMAGE = new Set([
  'FIRST_WORKOUT',
  'CENTURY_CLUB_SESSIONS',
  'EARLY_BIRD',
  'NIGHT_OWL',
  'WEEKLY_STREAK_3',
  'FULL_BODY_WEEK',
  'MOVER_10T',
  'BENCH_100KG',
  'OVERLOAD_PRO',
  'LOG_MASTER',
  'WORKOUT_BUDDY',
])

export function badgeImageSrc(code: string): string | null {
  return BADGES_WITH_IMAGE.has(code) ? `/badges/${code.toLowerCase()}.png` : null
}
