'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import userMark from '../public/user-mark.png'
import { logout } from '@/app/(auth)/actions'

const iconProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  className: 'h-5 w-5 shrink-0',
} as const

function UserIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  )
}

// Pèse-personne
function ScaleIcon() {
  return (
    <svg {...iconProps}>
      <rect x="4" y="3" width="16" height="18" rx="3" />
      <path d="M8.5 10a3.5 3.5 0 0 1 7 0z" />
      <path d="M12 10V8M8 16h8" />
    </svg>
  )
}

// Médaille
function MedalIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="14" r="6" />
      <path d="M9 3h6l-1.5 5M9 3l1.5 5M12 11.5v5M10 14h4" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="4" width="18" height="14" rx="2" />
      <path d="M7 14l3-3 3 2 4-5" />
      <path d="M8 21h8" />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg {...iconProps}>
      <path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4" />
      <path d="M16 8l4 4-4 4" />
      <path d="M20 12H9" />
    </svg>
  )
}

export default function UserMenu({
  email,
  name,
  isAdmin,
}: {
  email: string
  name?: string
  isAdmin: boolean
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

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

  const itemBase =
    'relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors cursor-pointer'

  // Entrée de la page courante : fond orangé et barre à gauche
  const itemClass = (href: string, tone: string) => {
    const active = pathname === href || pathname.startsWith(`${href}/`)
    return `${itemBase} ${
      active
        ? 'bg-gradient-to-r from-blue-600/35 to-blue-600/10 text-gray-900 before:absolute before:inset-y-2 before:-left-2 before:w-0.5 before:rounded-full before:bg-blue-600'
        : `${tone} hover:bg-gray-100`
    }`
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Menu utilisateur"
        className="group flex items-center gap-3 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 cursor-pointer"
      >
        <span className="hidden text-right leading-tight sm:block">
          {/* Le nom, s'il est renseigné ; sinon l'adresse mail */}
          {name ? (
            <span className="block max-w-48 truncate text-sm font-bold text-gray-900">{name}</span>
          ) : (
            <span className="block max-w-48 truncate text-xs text-gray-500">{email}</span>
          )}
        </span>
        <span className="flex h-11 w-11 items-center justify-center transition duration-150 group-hover:scale-110 group-hover:brightness-110">
          <Image src={userMark} alt="" className="h-full w-full scale-110 object-contain" />
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="glass absolute right-0 z-20 mt-3 w-64 rounded-xl border p-2"
        >
          <div className="space-y-1 pl-2">
            <Link
              href="/profile"
              role="menuitem"
              onClick={() => setOpen(false)}
              className={itemClass('/profile', 'text-gray-700')}
            >
              <UserIcon />
              Profil
            </Link>

            <Link
              href="/suivi"
              role="menuitem"
              onClick={() => setOpen(false)}
              className={itemClass('/suivi', 'text-gray-700')}
            >
              <ScaleIcon />
              Suivi
            </Link>

            <Link
              href="/badges"
              role="menuitem"
              onClick={() => setOpen(false)}
              className={itemClass('/badges', 'text-gray-700')}
            >
              <MedalIcon />
              Badges
            </Link>

            {isAdmin && (
              <Link
                href="/admin"
                role="menuitem"
                onClick={() => setOpen(false)}
                className={itemClass('/admin', 'text-purple-600')}
              >
                <ShieldIcon />
                Administration
              </Link>
            )}
          </div>

          <form action={logout} className="mt-2 border-t pt-2 pl-2">
            <button
              type="submit"
              role="menuitem"
              className={`${itemBase} text-red-600 hover:bg-red-500/10`}
            >
              <LogoutIcon />
              Déconnexion
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
