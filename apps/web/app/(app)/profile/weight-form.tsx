'use client'

import { useState, useTransition } from 'react'
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
      <label htmlFor="weight" className="block text-sm font-medium text-gray-700">
        Poids (kg)
      </label>
      <div className="flex gap-3">
        <input
          id="weight"
          type="number"
          inputMode="decimal"
          min={20}
          max={400}
          step="1"
          required
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-32 border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 cursor-pointer"
        >
          {pending ? 'Enregistrement...' : 'Enregistrer'}
        </button>
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
