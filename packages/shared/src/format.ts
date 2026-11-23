import { groupRest, groupSets, groupSupersets } from './supersets'

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

// Répétitions : null veut dire « max » (jusqu'à l'échec).
// 12 -> "12", null -> "max"
export function formatReps(reps: number | null): string {
  return reps === null ? 'max' : String(reps)
}

// Saisie -> valeur : "12" -> 12, "max" -> null (insensible à la casse), autre chose -> undefined (invalide)
export function parseRepsInput(value: string): number | null | undefined {
  const text = value.trim().toLowerCase()
  if (text === 'max') return null
  if (!/^\d+$/.test(text)) return undefined

  const reps = Number(text)
  return reps >= 1 ? reps : undefined
}

// Temps d'effort estimé par répétition (secondes)
const SECONDS_PER_REP = 4
// Nombre de répétitions retenu pour estimer une série « max »
const ESTIMATED_MAX_REPS = 12

// Pause entre deux exercices (2 min)
const TRANSITION_SECONDS = 120

// Durée estimée d'une séance : effort de chaque série + repos entre les tours
// (comme dans le déroulé de la séance, il n'y a pas de repos après la toute dernière série).
// Superset : un tour enchaîne tous les exercices du groupe, puis un seul repos (celui du dernier).
export function estimateWorkoutSeconds(
  exercises: { target_sets: number; target_reps: number | null; rest_time: number; linked_to_previous?: boolean }[]
): number {
  const groups = groupSupersets(exercises.map((e) => ({ ...e, linked_to_previous: Boolean(e.linked_to_previous) })))
  const total = groups.reduce((sum, group) => {
    const effort = group.reduce((s, e) => s + (e.target_reps ?? ESTIMATED_MAX_REPS) * SECONDS_PER_REP, 0)
    return sum + groupSets(group) * (effort + groupRest(group))
  }, 0)
  const lastGroup = groups[groups.length - 1]
  if (!lastGroup) return 0
  // Changement d'exercice (ou de superset) : installation du matériel, pas d'enchaînement immédiat
  return total - groupRest(lastGroup) + (groups.length - 1) * TRANSITION_SECONDS
}
