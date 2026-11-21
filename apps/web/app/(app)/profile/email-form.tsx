'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import { changeEmail } from './actions'

export default function EmailForm({ currentEmail }: { currentEmail: string }) {
  const [pending, startTransition] = useTransition()
  const [email, setEmail] = useState(currentEmail)
  const [message, setMessage] = useState<{ type: 'error' | 'ok'; text: string } | null>(null)

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMessage(null)
    startTransition(async () => {
      const result = await changeEmail(email)
      setMessage(
        'error' in result
          ? { type: 'error', text: result.error }
          : { type: 'ok', text: 'Un mail de confirmation a été envoyé. Clique sur le lien qu\'il contient pour valider la nouvelle adresse.' }
      )
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <Label htmlFor="email">Adresse mail</Label>
        <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending || email.trim() === currentEmail}>
          {pending ? 'Envoi...' : 'Changer l\'adresse'}
        </Button>
      </div>
      <p className="text-xs text-gray-500">
        L&apos;ancienne adresse reste valable tant que tu n&apos;as pas confirmé la nouvelle par mail.
      </p>
      {message && (
        <p className={`text-sm ${message.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>{message.text}</p>
      )}
    </form>
  )
}
