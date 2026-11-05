import Image from 'next/image'
import Link from 'next/link'
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
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-wide text-gray-900">
            <Image src="/logo-mark.png" alt="" width={38} height={36} priority className="h-9 w-auto" />
            Vigor
          </Link>

          <div className="flex items-center gap-3">
            <NavLinks className="hidden md:flex items-center" />
            <UserMenu email={user.email ?? ''} isAdmin={Boolean(profile?.is_admin)} />
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-6 pb-24 md:pb-6">{children}</main>

      <NavLinks className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t flex justify-around py-1" />
    </div>
  )
}
