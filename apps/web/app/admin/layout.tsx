import Image from 'next/image'
import Link from 'next/link'
import logo from '../icon.png'
import { redirect } from 'next/navigation'
import NavLinks, { type NavLink } from '@/components/nav-links'
import UserMenu from '@/components/user-menu'
import { fullName, getIdentity } from '@vigor/shared/profile'
import { userName } from '@/lib/user-name'
import { createClient } from '@/lib/supabase/server'

const ADMIN_LINKS: NavLink[] = [
  { href: '/admin/exercises', label: 'Exercices' },
  { href: '/admin/workouts', label: 'Séances Modèles' },
  { href: '/admin/users', label: 'Utilisateurs' },
]

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()
  if (!profile?.is_admin) redirect('/')

  return (
    <div className="app-shell min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              aria-label="Retour à l'accueil"
              title="Retour à l'accueil"
              className="flex h-10 w-10 items-center justify-center rounded-full text-gray-700 hover:text-blue-600 transition-colors"
            >
              <svg
                className="h-7 w-7"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 5l-5 5 5 5" />
              </svg>
            </Link>
            <Link
              href="/admin"
              className="group flex items-center gap-2 text-xl font-bold tracking-wide text-gray-900"
            >
              <Image src={logo} alt="" priority className="h-12 w-12 transition duration-150 group-hover:scale-110 group-hover:brightness-110" />
              Vigor Admin
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <NavLinks links={ADMIN_LINKS} className="hidden md:flex items-center" />
            <UserMenu email={user.email ?? ''} name={fullName(await getIdentity(supabase, user.id)) ?? userName(user.user_metadata)} isAdmin />
          </div>
        </div>      </header>

      <main className="page-enter flex-1 max-w-7xl w-full mx-auto px-4 py-6 pb-28 md:pb-20">{children}</main>

      <NavLinks
        links={ADMIN_LINKS}
        className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t flex justify-around py-1"
      />
    </div>
  )
}
