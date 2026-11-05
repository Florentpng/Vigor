'use client'

import { useTransition } from 'react'
import { resetMyBadges } from './actions'

export default function ResetBadgesButton() {
  const [pending, startTransition] = useTransition()

  const handleClick = () => {
    if (!confirm('Réinitialiser tous tes badges ? Ils pourront être débloqués à nouveau.')) return

    startTransition(async () => {
      const result = await resetMyBadges()
      if ('error' in result) alert(result.error)
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-xs font-medium disabled:opacity-50 cursor-pointer"
    >
      {pending ? 'Réinitialisation...' : 'Réinitialiser les badges'}
    </button>
  )
}
