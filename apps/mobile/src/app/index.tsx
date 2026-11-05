import { useEffect, useState } from 'react'
import { Text, View } from 'react-native'

import { supabase } from '@/lib/supabase'

type Status = { state: 'loading' } | { state: 'ok'; count: number } | { state: 'error'; message: string }

// Écran temporaire de l'étape 1 : vérifie NativeWind et la connexion à Supabase.
export default function Index() {
  const [status, setStatus] = useState<Status>({ state: 'loading' })

  useEffect(() => {
    supabase
      .from('exercises')
      .select('id', { count: 'exact', head: true })
      .then(({ count, error }) => {
        if (error) setStatus({ state: 'error', message: error.message })
        else setStatus({ state: 'ok', count: count ?? 0 })
      })
  }, [])

  return (
    <View className="flex-1 items-center justify-center gap-3 bg-white px-6 dark:bg-zinc-950">
      <Text className="text-3xl font-bold text-zinc-900 dark:text-white">Vigor</Text>
      <Text className="text-center text-zinc-500 dark:text-zinc-400">
        {status.state === 'loading' && 'Connexion à Supabase…'}
        {status.state === 'ok' && `Supabase OK (${status.count} exercice(s) visibles sans connexion)`}
        {status.state === 'error' && `Erreur Supabase : ${status.message}`}
      </Text>
    </View>
  )
}
