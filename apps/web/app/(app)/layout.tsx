import Image from 'next/image'
import Link from 'next/link'
import logo from '../icon.png'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NavLinks from '@/components/nav-links'
import UserMenu from '@/components/user-menu'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle()

  return (
    <div className="app-shell min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="bg-white border-b sticky top-0 z-10">
        {/* Logo à gauche, liens centrés, menu utilisateur à droite */}
        <div className="max-w-6xl mx-auto px-4 h-14 grid grid-cols-[1fr_auto_1fr] items-center">
          <Link
            href="/"
            className="group justify-self-start flex items-center gap-2 font-display text-2xl font-extrabold uppercase tracking-wider text-gray-900"
          >
            <Image src={logo} alt="" priority className="h-12 w-12 transition duration-150 group-hover:scale-110 group-hover:brightness-110" />
            Vigor
          </Link>

          <NavLinks className="hidden md:flex items-center gap-1" />

          <div className="justify-self-end col-start-3">
            <UserMenu email={user.email ?? ''} isAdmin={Boolean(profile?.is_admin)} />
          </div>
        </div>      </header>

      <main className="page-enter flex-1 w-full max-w-3xl mx-auto px-4 py-6 pb-28 md:pb-20">{children}</main>

      <NavLinks className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t flex justify-around py-1" />
    </div>
  )
}
