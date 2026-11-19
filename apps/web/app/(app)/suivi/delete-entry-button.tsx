'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { deleteWeightEntry } from './actions'

export default function DeleteEntryButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition()

  return (
    <Button
      variant="danger"
      className="px-3 py-1.5"
      disabled={pending}
      onClick={() => {
        if (!confirm('Supprimer cette pesée ?')) return
        startTransition(async () => {
          await deleteWeightEntry(id)
        })
      }}
    >
      {pending ? '...' : 'Supprimer'}
    </Button>
  )
}
