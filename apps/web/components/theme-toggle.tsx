'use client'

import { useSyncExternalStore } from 'react'

const STORAGE_KEY = 'vigor-theme'
const EVENT = 'vigor-theme-change'

function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback)
  return () => window.removeEventListener(EVENT, callback)
}

function getSnapshot() {
  return document.documentElement.classList.contains('dark')
}

function getServerSnapshot() {
  return false
}

// Interrupteur clair / sombre. Le choix est gardé dans le navigateur ; le script de app/layout.tsx
// l'applique avant l'affichage pour éviter un flash de la mauvaise couleur.
export default function ThemeToggle({ className = '' }: { className?: string }) {
  const isDark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const toggle = () => {
    const next = !isDark
    document.documentElement.classList.toggle('dark', next)
    try {
      localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light')
    } catch {
      // stockage indisponible : le choix vaut pour la page en cours
    }
    window.dispatchEvent(new Event(EVENT))
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label="Mode sombre"
      onClick={toggle}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
        isDark ? 'bg-blue-600' : 'bg-gray-300'
      } ${className}`}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-[#ffffff] shadow transition-transform ${
          isDark ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}
