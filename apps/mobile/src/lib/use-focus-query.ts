import { useFocusEffect } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from 'react'

type FocusQuery<T> = {
  data: T | undefined
  // Premier chargement (rien à afficher encore)
  loading: boolean
  // Rechargement demandé par le geste « tirer pour rafraîchir »
  refreshing: boolean
  error: string | null
  refresh: () => Promise<void>
}

// Charge des données à chaque fois que l'écran reprend le focus (retour depuis un autre écran,
// changement d'onglet). C'est l'équivalent mobile de `revalidate = 0` / `revalidatePath` du web.
// `key` relance le chargement quand il change (ex. l'id de la route).
export function useFocusQuery<T>(load: () => Promise<T>, key?: string): FocusQuery<T> {
  const [data, setData] = useState<T>()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadRef = useRef(load)
  useEffect(() => {
    loadRef.current = load
  })

  // Ignore les réponses d'un chargement dépassé par un plus récent
  const requestId = useRef(0)

  const run = useCallback(async () => {
    const id = ++requestId.current
    try {
      const result = await loadRef.current()
      if (id !== requestId.current) return
      setData(result)
      setError(null)
    } catch (e) {
      if (id !== requestId.current) return
      setError(e instanceof Error ? e.message : 'Erreur de chargement')
    } finally {
      if (id === requestId.current) setLoading(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      run()
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [run, key])
  )

  const refresh = useCallback(async () => {
    setRefreshing(true)
    await run()
    setRefreshing(false)
  }, [run])

  return { data, loading, refreshing, error, refresh }
}
