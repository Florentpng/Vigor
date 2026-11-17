'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ErrorMessage, Input, Label } from '@/components/ui/input'
import type { AuthState } from './actions'

type Props = {
  title: string
  submitLabel: string
  action: (prev: AuthState, formData: FormData) => Promise<AuthState>
  altText: string
  altLabel: string
  altHref: string
  passwordAutoComplete: 'current-password' | 'new-password'
}

export default function AuthForm({
  title,
  submitLabel,
  action,
  altText,
  altLabel,
  altHref,
  passwordAutoComplete,
}: Props) {
  const [state, formAction, pending] = useActionState(action, null)

  return (
    <div className="w-full max-w-sm glass p-8 rounded-xl shadow-sm border">
      <h1 className="text-4xl font-extrabold leading-none mb-6 text-gray-900">{title}</h1>

      {state && 'error' in state && (
        <div className="mb-4">
          <ErrorMessage>{state.error}</ErrorMessage>
        </div>
      )}
      {state && 'message' in state && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm">
          {state.message}
        </div>
      )}

      <form action={formAction} className="space-y-5">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>

        <div>
          <Label htmlFor="password">Mot de passe</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            autoComplete={passwordAutoComplete}
          />
        </div>

        <Button type="submit" size="lg" disabled={pending}>
          {pending ? 'Chargement...' : submitLabel}
        </Button>
      </form>

      <p className="mt-6 text-sm text-gray-600 text-center">
        {altText}{' '}
        <Link href={altHref} className="text-blue-600 hover:underline font-medium">
          {altLabel}
        </Link>
      </p>
    </div>
  )
}
