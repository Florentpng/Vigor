import 'expo-sqlite/localStorage/install'

import { DarkTheme, DefaultTheme, type Theme } from 'expo-router'
import { colorScheme, vars } from 'nativewind'
import { useColorScheme } from 'react-native'

export type ThemePreference = 'light' | 'dark'

const STORAGE_KEY = 'vigor-theme'

// Accent du web : bronze en mode clair, orange en mode sombre
export const ACCENT_LIGHT = '#b85c00'
export const ACCENT_DARK = '#ff6b00'

// Variables de couleur de l'accent (classes « blue-… » de Tailwind, voir tailwind.config.js)
export const lightVars = vars({
  '--blue-50': '253 243 231',
  '--blue-100': '251 229 204',
  '--blue-400': '217 139 74',
  '--blue-500': '194 110 40',
  '--blue-600': '184 92 0',
  '--blue-700': '154 77 0',
  '--blue-800': '122 63 0',
  '--blue-950': '58 36 18',
})

export const darkVars = vars({
  '--blue-50': '58 36 18',
  '--blue-100': '74 44 20',
  '--blue-400': '255 138 61',
  '--blue-500': '255 133 51',
  '--blue-600': '255 107 0',
  '--blue-700': '224 95 0',
  '--blue-800': '255 178 122',
  '--blue-950': '58 36 18',
})

// Couleur d'accent pour les icônes et indicateurs, qui ne passent pas par des classes
export function useAccent() {
  return useColorScheme() === 'dark' ? ACCENT_DARK : ACCENT_LIGHT
}

// Navigation : fonds transparents pour laisser voir la photo de fond ; en-têtes et barre d'onglets opaques
export const lightNavTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: ACCENT_LIGHT,
    background: 'transparent',
    card: '#ffffff',
    border: '#e2e8f0',
  },
}

export const darkNavTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: ACCENT_DARK,
    background: 'transparent',
    card: '#111827',
    border: '#334155',
  },
}

// Lecture synchrone (stockage local du téléphone) : le thème est appliqué avant le premier affichage.
// Mode clair par défaut, comme le web.
export function getThemePreference(): ThemePreference {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
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
  colorScheme.set(getThemePreference())
}
