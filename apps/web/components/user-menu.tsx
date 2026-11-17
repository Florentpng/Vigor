'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import ThemeToggle from '@/components/theme-toggle'
import userMark from '../public/user-mark.png'
import { logout } from '@/app/(auth)/actions'

export default function UserMenu({ email, isAdmin }: { email: string; isAdmin: boolean }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Fermeture au clic en dehors du menu ou avec Échap
  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const itemClass =
    'block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 cursor-pointer'

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Menu utilisateur"
        className="flex h-11 w-11 items-center justify-center rounded-full transition duration-150 hover:scale-110 hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 cursor-pointer"
      >
        <Image src={userMark} alt="" className="h-full w-full scale-110 object-contain" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-60 rounded-xl border bg-white py-1 shadow-lg z-20"
        >
          <p className="truncate border-b px-4 py-2 text-xs text-gray-500" title={email}>
            {email}
          </p>

          <Link href="/planning" role="menuitem" onClick={() => setOpen(false)} className={itemClass}>
            Planning
          </Link>

          <Link href="/profile" role="menuitem" onClick={() => setOpen(false)} className={itemClass}>
            Profil
          </Link>

          {isAdmin && (
            <Link
              href="/admin"
              role="menuitem"
              onClick={() => setOpen(false)}
              className={`${itemClass} text-purple-700`}
            >
              Administration
            </Link>
          )}

          <div className="flex items-center justify-between border-t px-4 py-2">
            <span className="text-sm text-gray-700">Mode sombre</span>
            <ThemeToggle />
          </div>

          <form action={logout} className="border-t">
            <button type="submit" role="menuitem" className={`${itemClass} hover:text-red-600`}>
              Déconnexion
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
