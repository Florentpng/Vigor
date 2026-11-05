'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteMyWorkout } from '../actions'

export default function DeleteMyWorkoutButton({ id, name }: { id: string; name: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const handleDelete = () => {
    if (!confirm(`Supprimer la séance "${name}" ? Son historique est conservé.`)) return

    startTransition(async () => {
      const result = await deleteMyWorkout(id)
      if ('error' in result) {
        alert(result.error)
        return
      }
      router.push('/workouts')
    })
  }

  return (
    <button
      onClick={handleDelete}
      disabled={pending}
      className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium disabled:opacity-50 cursor-pointer"
    >
      {pending ? 'Suppression...' : 'Supprimer'}
    </button>
  )
}
