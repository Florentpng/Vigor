'use client'

import { useTransition } from 'react'
import { TrashIcon } from '@/components/ui/icons'
import { deleteWeightEntry } from './actions'

export default function DeleteEntryButton({ id, label }: { id: string; label: string }) {
  const [pending, startTransition] = useTransition()

  return (
    <button
      type="button"
      disabled={pending}
      aria-label={`Supprimer la pesée ${label}`}
      title="Supprimer cette pesée"
      className="shrink-0 cursor-pointer rounded-lg p-2 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
      onClick={() => {
        if (!confirm(`Supprimer la pesée ${label} ?`)) return
        startTransition(async () => {
          await deleteWeightEntry(id)
        })
      }}
    >
      <TrashIcon className="h-5 w-5" />
    </button>
  )
}
