import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'

import { WEEKDAYS } from '@vigor/shared/constants'
import { setWorkoutDays } from '@vigor/shared/planning'

import { Button, Card } from '@/components/ui'
import { supabase } from '@/lib/supabase'

type Props = {
  workoutId: string
  initialDays: number[]
  // jour -> nom de la séance qui l'occupe déjà (autre que celle-ci)
  takenBy: Record<number, string>
}

// Choix des jours où la séance est proposée en accueil (même logique que le web)
export default function DaysPicker({ workoutId, initialDays, takenBy }: Props) {
  const [days, setDays] = useState<number[]>(initialDays)
  const [saved, setSaved] = useState<number[]>(initialDays)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'ok'; text: string } | null>(null)

  const dirty = days.length !== saved.length || days.some((d) => !saved.includes(d))
  const replaced = days.filter((d) => takenBy[d])

  function toggle(day: number) {
    setMessage(null)
    setDays((current) => (current.includes(day) ? current.filter((d) => d !== day) : [...current, day].sort()))
  }

  async function save() {
    setPending(true)
    const result = await setWorkoutDays(supabase, workoutId, days)
    setPending(false)
    if ('error' in result) {
      setMessage({ type: 'error', text: result.error })
      return
    }
    setSaved(days)
    setMessage({ type: 'ok', text: 'Planning mis à jour.' })
  }

  return (
    <Card>
      <Text className="font-semibold text-gray-900 dark:text-white">Jours de la semaine</Text>
      <Text className="mt-1 text-sm text-gray-600 dark:text-zinc-400">
        Cette séance sera proposée en page d&apos;accueil les jours cochés.
      </Text>

      <View className="mt-3 flex-row flex-wrap gap-2">
        {WEEKDAYS.map(({ value, label, short }) => {
          const active = days.includes(value)
          return (
            <Pressable
              key={value}
              onPress={() => toggle(value)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: active }}
              accessibilityLabel={label}
              className={`min-w-12 items-center rounded-lg border px-3 py-2 ${
                active
                  ? 'border-blue-600 bg-blue-600'
                  : 'border-gray-300 bg-white active:bg-gray-100 dark:border-zinc-700 dark:bg-zinc-800'
              }`}
            >
              <Text className={`text-sm font-medium ${active ? 'text-white' : 'text-gray-700 dark:text-zinc-200'}`}>
                {short}
              </Text>
            </Pressable>
          )
        })}
      </View>

      {replaced.length > 0 ? (
        <Text className="mt-3 text-sm text-amber-700 dark:text-amber-500">
          {replaced.map((d) => `${WEEKDAYS.find((w) => w.value === d)?.label} remplacera « ${takenBy[d]} »`).join(' · ')}
          .
        </Text>
      ) : null}

      <View className="mt-4 flex-row flex-wrap items-center gap-3">
        <Button label="Enregistrer les jours" onPress={save} pending={pending} disabled={!dirty} />
        {message ? (
          <Text className={`text-sm ${message.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>{message.text}</Text>
        ) : null}
      </View>
    </Card>
  )
}
