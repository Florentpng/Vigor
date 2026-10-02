import Link from 'next/link'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      <header className="bg-slate-900 text-white p-4 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-wide">⚙️ Vigor Admin</h1>
          <nav className="flex gap-6 text-sm font-medium">
            <Link href="/admin/exercises" className="hover:text-blue-400 transition-colors">
              Exercices
            </Link>
            <Link href="/admin/workouts" className="hover:text-blue-400 transition-colors">
              Séances Modèles
            </Link>
            <Link href="/admin/users" className="hover:text-blue-400 transition-colors">
              Utilisateurs
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6">{children}</main>
    </div>
  )
}