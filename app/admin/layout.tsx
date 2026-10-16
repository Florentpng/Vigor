import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { logout } from '../(auth)/actions'

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
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      <header className="bg-slate-900 text-white p-4 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/admin" className="hover:text-blue-400 transition-colors">
            <h1 className="text-xl font-bold tracking-wide">⚙️ Vigor Admin</h1>
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium">
            <Link href="/admin/exercises" className="hover:text-blue-400 transition-colors">
              Exercices
            </Link>
            <Link href="/admin/workouts" className="hover:text-blue-400 transition-colors">
              Séances Modèles
            </Link>
            <Link href="/admin/users" className="hover:text-blue-400 transition-colors">
              Utilisateurs
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className="hover:text-red-400 transition-colors cursor-pointer"
              >
                Déconnexion
              </button>
            </form>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6">{children}</main>
    </div>
  )
}