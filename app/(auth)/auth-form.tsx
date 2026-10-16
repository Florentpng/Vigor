'use client'

import { useActionState } from 'react'
import Link from 'next/link'
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
    <div className="w-full max-w-sm bg-white p-8 rounded-xl shadow-sm border">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">{title}</h1>

      {state && 'error' in state && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{state.error}</div>
      )}
      {state && 'message' in state && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm">
          {state.message}
        </div>
      )}

      <form action={formAction} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Mot de passe
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete={passwordAutoComplete}
            className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 cursor-pointer"
        >
          {pending ? 'Chargement...' : submitLabel}
        </button>
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
