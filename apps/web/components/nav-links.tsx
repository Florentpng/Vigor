'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export type NavLink = { href: string; label: string }

const APP_LINKS: NavLink[] = [
  { href: '/', label: 'Accueil' },
  { href: '/workouts', label: 'Séances' },
]

export default function NavLinks({
  className,
  links = APP_LINKS,
}: {
  className?: string
  links?: NavLink[]
}) {
  const pathname = usePathname()

  return (
    <nav className={className}>
      {links.map(({ href, label }) => {
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href)

        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={`px-3 py-2 text-sm font-medium transition-colors ${
              active ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
