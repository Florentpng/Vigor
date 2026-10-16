'use client'

import { useTransition } from 'react'
import { deleteUser } from './actions'

export default function DeleteUserButton({ id, email }: { id: string; email: string }) {
  const [pending, startTransition] = useTransition()

  const handleDelete = () => {
    const message = `Supprimer le compte "${email}" ?\n\nSes séances, son historique et ses badges seront aussi supprimés. Cette action est irréversible.`
    if (!confirm(message)) return

    startTransition(async () => {
      const result = await deleteUser(id)
      if ('error' in result) alert(result.error)
    })
  }

  return (
    <button
      onClick={handleDelete}
      disabled={pending}
      className="text-red-600 hover:underline font-medium cursor-pointer disabled:opacity-50"
    >
      {pending ? 'Suppression...' : 'Supprimer'}
    </button>
  )
}
