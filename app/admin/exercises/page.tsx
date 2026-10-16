import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Exercise } from '@/lib/types'
import DeleteExerciseButton from './delete-button'

export const revalidate = 0

export default async function AdminExercisesPage() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('exercises')
    .select('id, name, description, muscle_group, equipment, video_url')
    .order('name', { ascending: true })

  const exercises = (data ?? []) as Exercise[]

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Gestion des Exercices</h2>
        <Link
          href="/admin/exercises/new"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Ajouter un exercice
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error.message}</div>
      )}

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <th className="p-4">Nom</th>
              <th className="p-4">Groupe Musculaire</th>
              <th className="p-4">Équipement</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {exercises.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-4 text-center text-gray-500">
                  Aucun exercice.
                </td>
              </tr>
            ) : (
              exercises.map((ex) => (
                <tr key={ex.id} className="hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-900">{ex.name}</td>
                  <td className="p-4">
                    <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-1 rounded-full font-medium">
                      {ex.muscle_group}
                    </span>
                  </td>
                  <td className="p-4 text-gray-600">{ex.equipment}</td>
                  <td className="p-4 text-right space-x-3">
                    <Link
                      href={`/admin/exercises/${ex.id}`}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      Modifier
                    </Link>
                    <DeleteExerciseButton id={ex.id} name={ex.name} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
