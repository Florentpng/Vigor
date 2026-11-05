'use client'

import { useTransition } from 'react'
import { setUserRole } from './actions'

export default function RoleButton({
  id,
  email,
  isAdmin,
}: {
  id: string
  email: string
  isAdmin: boolean
}) {
  const [pending, startTransition] = useTransition()

  const handleClick = () => {
    const message = isAdmin
      ? `Retirer le rôle admin à "${email}" ?`
      : `Donner le rôle admin à "${email}" ? Ce compte pourra gérer les exercices, les séances et supprimer des comptes.`
    if (!confirm(message)) return

    startTransition(async () => {
      const result = await setUserRole(id, !isAdmin)
      if ('error' in result) alert(result.error)
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="text-blue-600 hover:underline font-medium cursor-pointer disabled:opacity-50"
    >
      {pending ? 'Modification...' : isAdmin ? 'Retirer admin' : 'Passer admin'}
    </button>
  )
}
