import 'expo-sqlite/localStorage/install'

import { useMemo, useSyncExternalStore } from 'react'

import type { LoggedSet } from '@vigor/shared/loads'

export type StoredSession = {
  workoutId: string
  startedAt: number
  index: number // exercice en cours
  setIndex: number // série en cours dans cet exercice (0 = première)
  restEndsAt?: number // présent pendant un repos
  restSeconds?: number // durée totale du repos en cours
  endedAt?: number
  sessionId: string // regroupe les séries de la séance au moment de l'enregistrement
  loads: Record<string, number> // charge choisie pendant la séance, par exercice
  sets: LoggedSet[] // séries déjà terminées (charge et répétitions)
  // présent une fois la séance enregistrée
  logged?: {
    calories: number
    minutes: number
    badges?: { code?: string; title: string; description: string }[]
    badgesError?: string
    setsError?: string
  }
}

const KEY = 'vigor-session'

// La séance en cours est gardée sur le téléphone : fermer l'app ne perd ni le chrono ni la progression.
let cache: string | null | undefined
const listeners = new Set<() => void>()

function getSnapshot(): string | null {
  if (cache === undefined) {
    try {
      cache = localStorage.getItem(KEY)
    } catch {
      cache = null
    }
  }
  return cache
}

function subscribe(callback: () => void) {
  listeners.add(callback)
  return () => {
    listeners.delete(callback)
  }
}

export function writeSession(session: StoredSession | null) {
  cache = session ? JSON.stringify(session) : null
  try {
    if (cache) localStorage.setItem(KEY, cache)
    else localStorage.removeItem(KEY)
  } catch {
    // stockage indisponible : la valeur reste en mémoire
  }
  listeners.forEach((listener) => listener())
}

function parseSession(raw: string | null): StoredSession | null {
  if (!raw) return null
  try {
    const value = JSON.parse(raw)
    if (
      typeof value?.workoutId !== 'string' ||
      typeof value?.startedAt !== 'number' ||
      typeof value?.index !== 'number'
    ) {
      return null
    }
    return {
      ...value,
      setIndex: typeof value.setIndex === 'number' ? value.setIndex : 0,
      // Séance commencée avant l'arrivée des charges : pas de série à enregistrer
      sessionId: typeof value.sessionId === 'string' ? value.sessionId : '',
      loads: value.loads && typeof value.loads === 'object' ? value.loads : {},
      sets: Array.isArray(value.sets) ? value.sets : [],
    }
  } catch {
    return null
  }
}

// Séance en cours enregistrée (de n'importe quelle séance), ou null
export function useStoredSession(): StoredSession | null {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  return useMemo(() => parseSession(raw), [raw])
}
