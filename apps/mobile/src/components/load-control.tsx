import Ionicons from '@expo/vector-icons/Ionicons'
import { type ReactNode, useEffect, useState } from 'react'
import { Modal, Pressable, Text, TextInput, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated'

import {
  type ExerciseLoadInfo,
  formatLoad,
  isValidLoad,
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
  large = false,
}: {
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
  const suggest = unchanged && past >= SUGGEST_AFTER_SESSIONS && (value > 0 || bodyweight)

  // Charge plus lourde qu'à la dernière séance : effet de flèches derrière la valeur
  const previous = info && info.lastSets.length > 0 ? Math.max(...info.lastSets.map((set) => set.weight_kg)) : null
  const increased = previous !== null && value > previous

  let status: string | null = null
  if (known === null && value === 0) {
    status = bodyweight ? 'Au poids du corps : ajoute un lest si besoin.' : 'Pas encore de charge : renseigne-la.'
  } else if (unchanged) {
    status = past > 0 ? `${past} séance${past > 1 ? 's' : ''} de suite à cette charge.` : 'Première séance à cette charge.'
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
          {increased ? <RiseArrows large={large} /> : null}
          {suggest ? <Ionicons name="arrow-up-circle" size={large ? 22 : 18} color={accent} /> : null}
          <Text
              className={`font-display text-gray-900 dark:text-white ${large ? 'text-4xl' : 'text-3xl'}`}
              numberOfLines={1}
            >
            {formatLoad(value, bodyweight)}
          </Text>
        </View>
        {unchanged && past > 0 ? (
          <Text className="text-xs text-gray-500 dark:text-zinc-400">
            {past} séance{past > 1 ? 's' : ''}
          </Text>
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

// Flèches vers le haut, très transparentes, qui montent doucement derrière la charge quand elle a augmenté
function RiseArrows({ large }: { large: boolean }) {
  const accent = useAccent()
  const progress = useSharedValue(0)

  // Boucle douce : aller-retour de 0 à 1
  useEffect(() => {
    progress.set(withRepeat(withSequence(withTiming(1, { duration: 1400 }), withTiming(0, { duration: 1400 })), -1))
  }, [progress])

  const style = useAnimatedStyle(() => ({
    opacity: 0.1 + progress.get() * 0.2,
    transform: [{ translateY: 6 - progress.get() * 12 }],
  }))

  const size = large ? 34 : 26
  return (
    <View pointerEvents="none" className="absolute inset-0 flex-row items-center justify-around">
      {[0, 1, 2].map((i) => (
        <Animated.View key={i} style={style}>
          <Ionicons name="arrow-up" size={size} color={accent} />
        </Animated.View>
      ))}
    </View>
  )
}
