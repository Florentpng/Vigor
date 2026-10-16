// 45 -> "45 s", 120 -> "2 min", 90 -> "1 min 30 s"
export function formatRestTime(seconds: number): string {
  if (seconds < 60) return `${seconds} s`

  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return rest === 0 ? `${minutes} min` : `${minutes} min ${rest} s`
}
