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
