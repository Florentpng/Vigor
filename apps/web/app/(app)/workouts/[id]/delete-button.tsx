'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
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
    <Button variant="danger" onClick={handleDelete} disabled={pending}>
      {pending ? 'Suppression...' : 'Supprimer'}
    </Button>
  )
}
