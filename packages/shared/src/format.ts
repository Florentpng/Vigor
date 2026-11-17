// Jour de la semaine actuel, de 1 (lundi) à 7 (dimanche), à l'heure de Paris.
export function getTodayWeekday(): number {
  const short = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'Europe/Paris' }).format(
    new Date()
  )
  return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(short) + 1
}

// 65000 -> "01:05", 3725000 -> "1:02:05"
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  const pad = (n: number) => String(n).padStart(2, '0')

  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`
}

// 45 -> "45 s", 120 -> "2 min", 90 -> "1 min 30 s"
export function formatRestTime(seconds: number): string {
  if (seconds < 60) return `${seconds} s`

  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return rest === 0 ? `${minutes} min` : `${minutes} min ${rest} s`
}

// "Push Day - Débutant" -> { title: "Push Day", level: "Débutant" }.
// La difficulté n'est extraite que pour les séances Vigor (sans propriétaire) : le nom d'une séance perso reste tel quel.
const LEVEL_SUFFIX = /^(.*?)\s*[-–—]\s*(Débutant|Intermédiaire|Avancé)\s*$/i

export function parseWorkoutTitle(
  name: string,
  userId: string | null
): { title: string; level: string | null } {
  if (userId !== null) return { title: name, level: null }

  const match = LEVEL_SUFFIX.exec(name)
  if (!match || !match[1]) return { title: name, level: null }
  return { title: match[1], level: match[2] }
}

// Temps d'effort estimé par répétition (secondes)
const SECONDS_PER_REP = 4

// Durée estimée d'une séance : effort de chaque série + repos entre les séries
// (comme dans le déroulé de la séance, il n'y a pas de repos après la toute dernière série).
export function estimateWorkoutSeconds(
  exercises: { target_sets: number; target_reps: number; rest_time: number }[]
): number {
  const total = exercises.reduce(
    (sum, e) => sum + e.target_sets * (e.target_reps * SECONDS_PER_REP + e.rest_time),
    0
  )
  const last = exercises[exercises.length - 1]
  return last ? total - last.rest_time : 0
}
