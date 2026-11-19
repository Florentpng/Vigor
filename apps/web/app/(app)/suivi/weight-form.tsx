'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import { saveWeightEntry } from './actions'

export default function WeightForm({ today }: { today: string }) {
  const [pending, startTransition] = useTransition()
  const [date, setDate] = useState(today)
  const [value, setValue] = useState('')
  const [message, setMessage] = useState<{ type: 'error' | 'ok'; text: string } | null>(null)

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMessage(null)

    startTransition(async () => {
      const result = await saveWeightEntry(date, Number(value.replace(',', '.')))
      if ('error' in result) {
        setMessage({ type: 'error', text: result.error })
        return
      }
      setValue('')
      setMessage({ type: 'ok', text: 'Poids enregistré.' })
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <Label htmlFor="weight-date">Date</Label>
          <Input
            id="weight-date"
            type="date"
            required
            max={today}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-44"
          />
        </div>
        <div>
          <Label htmlFor="weight-kg">Poids (kg)</Label>
          <Input
            id="weight-kg"
            type="number"
            inputMode="decimal"
            min={20}
            max={400}
            step="0.1"
            required
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-32"
          />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </div>
      <p className="text-xs text-gray-500">
        La pesée la plus récente sert au calcul des calories brûlées pendant tes séances.
      </p>
      {message && (
        <p className={`text-sm ${message.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
          {message.text}
        </p>
      )}
    </form>
  )
}
