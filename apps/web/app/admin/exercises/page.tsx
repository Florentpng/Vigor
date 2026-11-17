import Link from 'next/link'
import { ButtonLink } from '@/components/ui/button'
import { Pill } from '@/components/ui/pill'
import { createClient } from '@/lib/supabase/server'
import type { Exercise } from '@vigor/shared/types'
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
        <h2 className="text-3xl sm:text-4xl font-extrabold leading-none text-gray-900">Gestion des Exercices</h2>
        <ButtonLink href="/admin/exercises/new">+ Ajouter un exercice</ButtonLink>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error.message}</div>
      )}

      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
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
                    <Pill>{ex.muscle_group}</Pill>
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
