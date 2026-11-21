'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import { saveIdentity } from './actions'

export default function IdentityForm({ firstName, lastName }: { firstName: string; lastName: string }) {
  const [pending, startTransition] = useTransition()
  const [first, setFirst] = useState(firstName)
  const [last, setLast] = useState(lastName)
  const [message, setMessage] = useState<{ type: 'error' | 'ok'; text: string } | null>(null)

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMessage(null)
    startTransition(async () => {
      const result = await saveIdentity(first, last)
      setMessage('error' in result ? { type: 'error', text: result.error } : { type: 'ok', text: 'Informations enregistrées.' })
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="first-name">Prénom</Label>
          <Input id="first-name" value={first} onChange={(e) => setFirst(e.target.value)} maxLength={60} autoComplete="given-name" />
        </div>
        <div>
          <Label htmlFor="last-name">Nom</Label>
          <Input id="last-name" value={last} onChange={(e) => setLast(e.target.value)} maxLength={60} autoComplete="family-name" />
        </div>
      </div>
      <p className="text-xs text-gray-500">Facultatif. Ton nom s&apos;affiche à côté de ton avatar, à la place de l&apos;adresse mail.</p>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
        {message && (
          <p className={`text-sm ${message.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>{message.text}</p>
        )}
      </div>
    </form>
  )
}
