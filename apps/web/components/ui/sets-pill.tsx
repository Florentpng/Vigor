import { formatReps, formatRestTime } from '@vigor/shared/format'
import { HourglassIcon, TimerIcon } from './icons'

// « 4 SÉRIES × 10 REPS » dans une pastille avec un chrono
// `repsLabel` : texte à la place du nombre (superset : « 10 / 8 »)
export function SetsPill({ sets, reps, repsLabel }: { sets: number; reps: number | null; repsLabel?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-600/40 bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-gray-900">
      <TimerIcon className="h-3.5 w-3.5 text-blue-600" />
      {sets} séries × {repsLabel ?? formatReps(reps)} reps
    </span>
  )
}

// « REPOS : 2 MIN » avec un sablier
export function RestLabel({ seconds }: { seconds: number }) {
  return (
    <span className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-gray-500">
      <HourglassIcon className="h-3 w-3 text-blue-600" />
      Repos : {formatRestTime(seconds)}
    </span>
  )
}
