'use client'

import { useTransition } from 'react'
import { deleteWorkout } from './actions'

export default function DeleteWorkoutButton({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = useTransition()

  const handleDelete = () => {
    if (!confirm(`Supprimer la séance "${name}" ?`)) return

    startTransition(async () => {
      const result = await deleteWorkout(id)
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
