import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

export const revalidate = 0

export default async function AdminDashboardPage() {
  const [{ count: exercisesCount }, { count: workoutsCount }, { count: usersCount }] =
    await Promise.all([
      supabase.from('exercises').select('*', { count: 'exact', head: true }),
      supabase.from('workouts').select('*', { count: 'exact', head: true }).is('user_id', null),
      supabase.from('profiles').select('*', { count: 'exact', head: true }), // ou table users selon ton schéma
    ])

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Tableau de bord Administration</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/admin/exercises"
          className="p-6 bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow"
        >
          <p className="text-gray-500 text-sm font-medium">Exercices prédéfinis</p>
          <p className="text-3xl font-extrabold text-blue-600 mt-2">{exercisesCount || 0}</p>
        </Link>

        <Link
          href="/admin/workouts"
          className="p-6 bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow"
        >
          <p className="text-gray-500 text-sm font-medium">Séances prédéfinies</p>
          <p className="text-3xl font-extrabold text-green-600 mt-2">{workoutsCount || 0}</p>
        </Link>

        <Link
          href="/admin/users"
          className="p-6 bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow"
        >
          <p className="text-gray-500 text-sm font-medium">Comptes enregistrés</p>
          <p className="text-3xl font-extrabold text-purple-600 mt-2">{usersCount || 0}</p>
        </Link>
      </div>
    </div>
  )
}