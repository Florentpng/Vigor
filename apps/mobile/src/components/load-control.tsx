import Ionicons from '@expo/vector-icons/Ionicons'
import { type ReactNode, useState } from 'react'
import { Modal, Pressable, Text, TextInput, View } from 'react-native'

import {
  type ExerciseLoadInfo,
  formatLoad,
  isValidLoad,
  lastLoadForSet,
  LOAD_STEPS,
  SUGGEST_AFTER_SESSIONS,
} from '@vigor/shared/loads'
import type { SessionExercise } from '@vigor/shared/types'

import { Button, inputClass } from '@/components/ui'
import { useAccent } from '@/lib/theme'

const round = (kg: number) => Math.round(kg * 100) / 100

// En-tête d'un exercice pendant la séance : `header` (nom, muscle) à gauche, charge en haut à droite.
// Toucher la charge ouvre une petite fenêtre (comme les paramètres) : −2,5 / +2,5 / +10 kg ou saisie libre.
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
  // Exercice seul (grand titre) : charge plus grande que dans un superset
  large?: boolean
  header: ReactNode
  exercise: SessionExercise
  info: ExerciseLoadInfo | undefined
  value: number
  onChange: (kg: number) => void
}) {
  const accent = useAccent()
  const bodyweight = exercise.equipment === 'PDC'
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')

  const known = info?.weight_kg ?? null
  const unchanged = known !== null && value === known
  const past = unchanged ? (info?.sessions ?? 0) : 0
  // Pas de suggestion de surcharge pour les exercices au poids du corps (PDC)
  const suggest = unchanged && past >= SUGGEST_AFTER_SESSIONS && !bodyweight && value > 0

  // Charge plus lourde qu'à la dernière séance : effet de flèches derrière la valeur
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
  function draft(): number | null {
    if (text.trim() === '') return 0
    const kg = Number(text.replace(',', '.'))
    return isValidLoad(kg) ? round(kg) : null
  }

  // Les boutons −2,5 / +2,5 / +10 modifient le champ ; rien n'est appliqué avant « Valider »
  function step(delta: number) {
    const base = draft() ?? value
    setText(format(round(Math.max(0, base + delta))))
  }

  function validate() {
    const kg = draft()
    if (kg === null) return
    onChange(kg)
    setOpen(false)
  }

  return (
    <View className="flex-row items-start justify-between gap-3">
      <View className="shrink flex-1">{header}</View>

      {/* Charge actuelle, en haut à droite : un appui ouvre la fenêtre de modification */}
      <Pressable
        onPress={() => {
          // Le champ s'ouvre rempli avec la valeur actuelle
          setText(format(value))
          setOpen(true)
        }}
        accessibilityRole="button"
        accessibilityLabel={`${bodyweight ? 'Lest' : 'Charge'} : ${formatLoad(value, bodyweight)}. Modifier`}
        hitSlop={8}
        className="items-end active:opacity-60"
      >
        <View className="flex-row items-center gap-1">
          {suggest ? <Ionicons name="arrow-up-circle" size={large ? 22 : 18} color={accent} /> : null}
          <Text
            className={`font-display text-gray-900 dark:text-white ${large ? 'text-4xl' : 'text-3xl'}`}
            numberOfLines={1}
          >
            {formatLoad(value, bodyweight)}
          </Text>
        </View>
        {/* Charge différente de la dernière séance : l'écart, sous la charge (accent si plus lourde, gris si plus légère) */}
        {increased || decreased ? (
          <View
            className={`mt-0.5 flex-row items-center gap-0.5 rounded-full px-2 py-0.5 ${
              increased ? 'bg-blue-600' : 'bg-gray-500 dark:bg-zinc-600'
            }`}
          >
            <Ionicons name={increased ? 'arrow-up' : 'arrow-down'} size={11} color="#ffffff" />
            <Text className="text-xs font-bold text-white">
              {increased ? '+' : '−'}
              {formatLoad(delta)}
            </Text>
          </View>
        ) : null}
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 items-center justify-center bg-black/60 p-6" onPress={() => setOpen(false)}>
          {/* Un appui sur la carte ne ferme pas la fenêtre */}
          <Pressable
            className="w-full max-w-sm gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            onPress={() => {}}
          >
            <View>
              <Text className="font-display-xb text-2xl uppercase leading-none text-gray-900 dark:text-white">
                {bodyweight ? 'Lest' : 'Charge'}
              </Text>
              <Text className="mt-1 text-sm text-gray-500 dark:text-zinc-400">{exercise.name}</Text>
            </View>

            <TextInput
              className={`${inputClass} h-10 py-0`}
              value={text}
              onChangeText={setText}
              placeholder="Charge (kg)"
              placeholderTextColor="#94a3b8"
              keyboardType="decimal-pad"
              maxLength={6}
              selectTextOnFocus
              onSubmitEditing={validate}
              accessibilityLabel="Charge en kilogrammes"
            />

            <View className="gap-1">
              {status ? <Text className="text-sm text-gray-600 dark:text-zinc-300">{status}</Text> : null}
              {suggest ? (
                <Text className="text-sm font-semibold text-blue-600">Prêt pour une surcharge progressive ?</Text>
              ) : null}
            </View>

            <View className="flex-row items-center gap-2">
              <StepButton label="−10" disabled={(draft() ?? value) <= 0} onPress={() => step(-LOAD_STEPS[1])} />
              <StepButton label="−2,5" disabled={(draft() ?? value) <= 0} onPress={() => step(-LOAD_STEPS[0])} />
              <StepButton label="+2,5" highlight={suggest} onPress={() => step(LOAD_STEPS[0])} />
              <StepButton label="+10" onPress={() => step(LOAD_STEPS[1])} />
            </View>

            <View className="flex-row gap-3">
              <Button label="Annuler" variant="secondary" className="flex-1" onPress={() => setOpen(false)} />
              <Button label="Valider" className="flex-1" onPress={validate} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  )
}

function StepButton({
  label,
  onPress,
  disabled = false,
  highlight = false,
}: {
  label: string
  onPress: () => void
  disabled?: boolean
  highlight?: boolean
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`${label} kg`}
      className={`h-10 flex-1 items-center justify-center rounded-lg border ${
        highlight
          ? 'border-blue-600 bg-blue-600 active:opacity-80'
          : 'border-gray-300 bg-white active:bg-gray-100 dark:border-zinc-600 dark:bg-zinc-900 dark:active:bg-zinc-700'
      } ${disabled ? 'opacity-30' : ''}`}
    >
      <Text className={`text-sm font-bold ${highlight ? 'text-white' : 'text-gray-800 dark:text-zinc-100'}`}>{label}</Text>
    </Pressable>
  )
}
