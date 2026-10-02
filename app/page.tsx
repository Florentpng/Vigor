import { supabase } from '@/lib/supabaseClient'

export const revalidate = 0 // Désactive le cache pour voir immédiatement les changements

export default async function HomePage() {
  // Récupération des exercices depuis Supabase
  const { data: exercises, error } = await supabase
    .from('exercises') // Remplace 'exercises' par le nom exact de ta table si différent
    .select('*')

  if (error) {
    return (
      <main className="p-8 font-sans">
        <h1 className="text-2xl font-bold text-red-600 mb-4">
          ❌ Erreur de connexion à Supabase
        </h1>
        <pre className="bg-gray-100 p-4 rounded text-sm text-red-800">
          {JSON.stringify(error, null, 2)}
        </pre>
      </main>
    )
  }

  return (
    <main className="p-8 max-w-4xl mx-auto font-sans">
      <h1 className="text-3xl font-bold mb-6">💪 Projet Vigor - Test Supabase</h1>
      
      <p className="mb-4 text-green-600 font-semibold">
        ✅ Connexion réussie ! ({exercises?.length || 0} exercice(s) trouvé(s))
      </p>

      <ul className="grid gap-4 md:grid-cols-2">
        {exercises && exercises.length > 0 ? (
          exercises.map((exercise: any) => (
            <li
              key={exercise.id}
              className="border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <h2 className="text-xl font-semibold mb-1">
                {exercise.name || exercise.title || 'Exercice sans nom'}
              </h2>
              {exercise.muscle_group && (
                <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 rounded font-medium">
                  {exercise.muscle_group}
                </span>
              )}
              {exercise.description && (
                <p className="text-gray-600 text-sm mt-2">{exercise.description}</p>
              )}
            </li>
          ))
        ) : (
          <p className="text-gray-500">Aucun exercice trouvé dans la table.</p>
        )}
      </ul>
    </main>
  )
}