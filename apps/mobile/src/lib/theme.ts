import 'expo-sqlite/localStorage/install'

import { DarkTheme, DefaultTheme, type Theme } from 'expo-router'
import { colorScheme } from 'nativewind'

export type ThemePreference = 'system' | 'light' | 'dark'

const STORAGE_KEY = 'vigor-theme'

// Bleu des liens et boutons du web (blue-600)
export const ACCENT = '#2563eb'

// Couleurs de la navigation (en-têtes, barre d'onglets), alignées sur les classes Tailwind des écrans.
export const lightNavTheme: Theme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, primary: ACCENT, background: '#f9fafb', card: '#ffffff', border: '#e5e7eb' },
}

export const darkNavTheme: Theme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, primary: ACCENT, background: '#09090b', card: '#18181b', border: '#27272a' },
}

// Lecture synchrone (stockage local du téléphone) : le thème est appliqué avant le premier affichage.
export function getThemePreference(): ThemePreference {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value === 'light' || value === 'dark' ? value : 'system'
  } catch {
    return 'system'
  }
}

export function setThemePreference(preference: ThemePreference) {
  colorScheme.set(preference)
  try {
    localStorage.setItem(STORAGE_KEY, preference)
  } catch {
    // stockage indisponible : le choix vaut jusqu'à la fermeture de l'app
  }
}

// À appeler une fois au démarrage.
export function applyStoredTheme() {
  const preference = getThemePreference()
  if (preference !== 'system') colorScheme.set(preference)
}
