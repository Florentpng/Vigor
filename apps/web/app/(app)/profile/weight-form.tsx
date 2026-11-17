'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import { updateWeight } from './actions'

export default function WeightForm({ initialWeight }: { initialWeight: number | null }) {
  const [pending, startTransition] = useTransition()
  const [value, setValue] = useState(initialWeight === null ? '' : String(initialWeight))
  const [message, setMessage] = useState<{ type: 'error' | 'ok'; text: string } | null>(null)

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMessage(null)

    startTransition(async () => {
      const result = await updateWeight(Number(value.replace(',', '.')))
      setMessage(
        'error' in result
          ? { type: 'error', text: result.error }
          : { type: 'ok', text: 'Poids enregistré.' }
      )
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Label htmlFor="weight">Poids (kg)</Label>
      <div className="flex gap-3">
        <Input
          id="weight"
          type="number"
          inputMode="decimal"
          min={20}
          max={400}
          step="1"
          required
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-32"
        />
        <Button type="submit" disabled={pending}>
          {pending ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </div>
      <p className="text-xs text-gray-500">Sert au calcul des calories brûlées pendant tes séances.</p>
      {message && (
        <p className={`text-sm ${message.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
          {message.text}
        </p>
      )}
    </form>
  )
}
