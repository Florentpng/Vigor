'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { WEEKDAYS } from '@vigor/shared/constants'
import { setWorkoutDays } from './actions'

type Props = {
  workoutId: string
  initialDays: number[]
  // jour -> nom de la séance qui l'occupe déjà (autre que celle-ci)
  takenBy: Record<number, string>
}

export default function DaysPicker({ workoutId, initialDays, takenBy }: Props) {
  const [pending, startTransition] = useTransition()
  const [days, setDays] = useState<number[]>(initialDays)
  const [saved, setSaved] = useState<number[]>(initialDays)
  const [message, setMessage] = useState<{ type: 'error' | 'ok'; text: string } | null>(null)

  const dirty = days.length !== saved.length || days.some((d) => !saved.includes(d))
  const replaced = days.filter((d) => takenBy[d])

  const toggle = (day: number) => {
    setMessage(null)
    setDays((current) =>
      current.includes(day) ? current.filter((d) => d !== day) : [...current, day].sort()
    )
  }

  const save = () => {
    startTransition(async () => {
      const result = await setWorkoutDays(workoutId, days)
      if ('error' in result) {
        setMessage({ type: 'error', text: result.error })
        return
      }
      setSaved(days)
      setMessage({ type: 'ok', text: 'Planning mis à jour.' })
    })
  }

  return (
    <Card>
      <h2 className="text-2xl font-bold text-gray-900">Jours de la semaine</h2>
      <p className="mt-1 text-sm text-gray-600">
        Cette séance sera proposée en page d&apos;accueil les jours cochés.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {WEEKDAYS.map(({ value, label, short }) => {
          const active = days.includes(value)

          return (
            <button
              key={value}
              type="button"
              onClick={() => toggle(value)}
              aria-pressed={active}
              aria-label={label}
              title={takenBy[value] ? `Actuellement : ${takenBy[value]}` : label}
              className={`px-3 py-2 rounded-lg text-sm font-medium border cursor-pointer transition-colors ${
                active
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {short}
            </button>
          )
        })}
      </div>

      {replaced.length > 0 && (
        <p className="mt-3 text-sm text-amber-700">
          {replaced
            .map((d) => `${WEEKDAYS.find((w) => w.value === d)?.label} remplacera « ${takenBy[d]} »`)
            .join(' · ')}
          .
        </p>
      )}

      <div className="mt-4 flex items-center gap-3">
        <Button onClick={save} disabled={!dirty || pending}>
          {pending ? 'Enregistrement...' : 'Enregistrer les jours'}
        </Button>
        {message && (
          <span className={`text-sm ${message.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
            {message.text}
          </span>
        )}
      </div>
    </Card>
  )
}
