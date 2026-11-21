'use client'

import { type ReactNode, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  type ExerciseLoadInfo,
  formatLoad,
  isValidLoad,
  lastLoadForSet,
  LOAD_STEPS,
  SUGGEST_AFTER_SESSIONS,
} from '@vigor/shared/loads'
import type { SessionExercise } from '@vigor/shared/types'

const round = (kg: number) => Math.round(kg * 100) / 100

function ArrowUp({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  )
}

// En-tête d'un exercice pendant la séance : `header` (nom, muscle) à gauche, charge en haut à droite.
// Un clic sur la charge ouvre une petite fenêtre : −2,5 / +2,5 / +10 kg ou saisie libre, appliqués à « Valider ».
export default function LoadControl({
  header,
  exercise,
  info,
  value,
  onChange,
  setNumber,
  large = false,
}: {
  // Numéro de la série en cours : la comparaison se fait avec la même série de la dernière séance
  setNumber: number
  header: ReactNode
  exercise: SessionExercise
  info: ExerciseLoadInfo | undefined
  value: number
  onChange: (kg: number) => void
  // Exercice seul (grand titre) : charge plus grande que dans un superset
  large?: boolean
}) {
  const bodyweight = exercise.equipment === 'PDC'
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')

  const known = info?.weight_kg ?? null
  const unchanged = known !== null && value === known
  const past = unchanged ? (info?.sessions ?? 0) : 0
  // Pas de suggestion de surcharge pour les exercices au poids du corps (PDC)
  const suggest = unchanged && past >= SUGGEST_AFTER_SESSIONS && !bodyweight && value > 0

  // Charge plus lourde qu'à la dernière séance : flèches transparentes derrière la valeur
  const previous = lastLoadForSet(info, setNumber)
  const increased = previous !== null && value > previous
  const decreased = previous !== null && value < previous
  // Écart avec la dernière séance, affiché sous la charge
  const delta = increased || decreased ? round(Math.abs(value - (previous ?? 0))) : 0

  let status: string | null = null
  if (known === null && value === 0) {
    status = bodyweight ? 'Au poids du corps : ajoute un lest si besoin.' : 'Pas encore de charge : renseigne-la.'
  } else if (unchanged) {
    // Pas de « 1 séance » : le compteur ne s'affiche qu'à partir de 2
    status = past > 1 ? `${past} séances de suite à cette charge.` : past === 1 ? null : 'Première séance à cette charge.'
  }

  const format = (kg: number) => (kg > 0 ? String(kg).replace('.', ',') : '')

  // Charge saisie dans le champ (brouillon), ou null si elle n'est pas valide
  const draft = (): number | null => {
    if (text.trim() === '') return 0
    const kg = Number(text.replace(',', '.'))
    return isValidLoad(kg) ? round(kg) : null
  }

  // Les boutons modifient le champ ; rien n'est appliqué avant « Valider »
  const step = (delta: number) => setText(format(round(Math.max(0, (draft() ?? value) + delta))))

  const validate = () => {
    const kg = draft()
    if (kg === null) return
    onChange(kg)
    setOpen(false)
  }

  // Échap ferme la fenêtre sans rien appliquer
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  const label = bodyweight ? 'Lest' : 'Charge'

  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">{header}</div>

      {/* Charge actuelle, en haut à droite : un clic ouvre la fenêtre de modification */}
      <button
        type="button"
        onClick={() => {
          setText(format(value))
          setOpen(true)
        }}
        aria-label={`${label} : ${formatLoad(value, bodyweight)}. Modifier`}
        className="relative shrink-0 cursor-pointer text-right transition hover:opacity-70"
      >
        <span className="relative flex items-center justify-end gap-1">
          {suggest && <ArrowUp className={`${large ? 'h-5 w-5' : 'h-4 w-4'} text-blue-600`} />}
          <span className={`font-display font-bold text-gray-900 ${large ? 'text-4xl' : 'text-3xl'}`}>
            {formatLoad(value, bodyweight)}
          </span>
        </span>
        {/* Charge différente de la dernière séance : l'écart, sous la charge (accent si plus lourde, gris si plus légère) */}
        {(increased || decreased) && (
          <span
            className={`relative mt-0.5 inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-bold text-white ${
              increased ? 'bg-blue-600' : 'bg-gray-500'
            }`}
          >
            <ArrowUp className={`h-3 w-3 ${increased ? '' : 'rotate-180'}`} />
            {increased ? '+' : '−'}
            {formatLoad(delta)}
          </span>
        )}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
          onClick={() => setOpen(false)}
        >
          {/* Un clic dans la carte ne ferme pas la fenêtre */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label={label}
            className="w-full max-w-sm space-y-4 rounded-xl border bg-white p-6 shadow-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h2 className="font-display text-2xl font-extrabold uppercase leading-none text-gray-900">{label}</h2>
              <p className="mt-1 text-sm text-gray-500">{exercise.name}</p>
            </div>

            <Input
              type="text"
              inputMode="decimal"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Charge (kg)"
              maxLength={6}
              autoFocus
              onFocus={(e) => e.currentTarget.select()}
              onKeyDown={(e) => {
                if (e.key === 'Enter') validate()
              }}
              aria-label="Charge en kilogrammes"
            />

            <div className="space-y-1 text-sm">
              {status && <p className="text-gray-600">{status}</p>}
              {suggest && <p className="font-semibold text-blue-600">Prêt pour une surcharge progressive ?</p>}
            </div>

            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="flex-1"
                disabled={(draft() ?? value) <= 0}
                onClick={() => step(-LOAD_STEPS[1])}
              >
                −10
              </Button>
              <Button
                variant="secondary"
                className="flex-1"
                disabled={(draft() ?? value) <= 0}
                onClick={() => step(-LOAD_STEPS[0])}
              >
                −2,5
              </Button>
              <Button variant={suggest ? 'primary' : 'secondary'} className="flex-1" onClick={() => step(LOAD_STEPS[0])}>
                +2,5
              </Button>
              <Button variant="secondary" className="flex-1" onClick={() => step(LOAD_STEPS[1])}>
                +10
              </Button>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button className="flex-1" onClick={validate}>
                Valider
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
