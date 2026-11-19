import { router, usePreventRemove } from 'expo-router'
import { useState } from 'react'
import { Alert, Pressable, Text, TextInput, View } from 'react-native'

import { formatReps, formatRestTime, parseRepsInput } from '@vigor/shared/format'
import type { EditableWorkout } from '@vigor/shared/queries'
import type { ActionResult } from '@vigor/shared/result'
import type { Exercise, WorkoutInput } from '@vigor/shared/types'

import BackLink from '@/components/back-link'
import ExercisePicker from '@/components/exercise-picker'
import { Button, Card, ErrorBox, inputClass, Label, Muted, Screen, Title } from '@/components/ui'

// Valeur de `reps` quand le bouton « Max » est activé (jusqu'à l'échec)
const MAX_REPS = 'max'

// `lastReps` : dernier nombre saisi, rétabli quand on désactive « Max »
type Item = { exercise_id: string; sets: string; reps: string; rest: string; lastReps?: string }

type Props = {
  title: string
  submitLabel: string
  exercises: Exercise[]
  initial?: EditableWorkout
  // Enregistre la séance (création ou modification)
  onSubmit: (input: WorkoutInput) => Promise<ActionResult>
  // Où aller une fois enregistré
  onDone: () => void
}

function toItems(initial?: EditableWorkout): Item[] {
  return (initial?.items ?? []).map((i) => ({
    exercise_id: i.exercise_id,
    sets: String(i.sets),
    reps: formatReps(i.reps),
    rest: String(i.rest),
  }))
}

// Formulaire de séance perso, adapté du formulaire web au tactile
export default function WorkoutForm({ title, submitLabel, exercises, initial, onSubmit, onDone }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [items, setItems] = useState<Item[]>(() => toItems(initial))
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Changements non enregistrés : on demande confirmation avant de quitter l'écran
  const [snapshot] = useState(() => JSON.stringify([initial?.name ?? '', initial?.description ?? '', toItems(initial)]))
  const dirty = JSON.stringify([name, description, items]) !== snapshot
  const [discarded, setDiscarded] = useState(false)
  const disablePrevention = usePreventRemove(dirty && !pending && !discarded, ({ repeat }) => {
    Alert.alert('Abandonner les modifications ?', 'Les changements non enregistrés seront perdus.', [
      { text: 'Continuer la saisie', style: 'cancel' },
      {
        text: 'Abandonner',
        style: 'destructive',
        onPress: () => {
          setDiscarded(true)
          repeat()
        },
      },
    ])
  })

  const exerciseById = new Map(exercises.map((e) => [e.id, e]))
  const addedIds = new Set(items.map((i) => i.exercise_id))

  function addExercise(id: string) {
    // Valeurs par défaut de la table workout_exercises (comme le web)
    setItems((current) => [...current, { exercise_id: id, sets: '4', reps: '12', rest: '90' }])
  }

  function updateItem(index: number, field: keyof Omit<Item, 'exercise_id' | 'lastReps'>, value: string) {
    setItems((current) => current.map((item, i) => (i === index ? { ...item, [field]: value } : item)))
  }

  // Bouton « Max » : remplace le nombre de répétitions par MAX, et le rétablit au second appui
  function toggleMax(index: number) {
    setItems((current) =>
      current.map((item, i) => {
        if (i !== index) return item
        return item.reps === MAX_REPS
          ? { ...item, reps: item.lastReps ?? '12' }
          : { ...item, reps: MAX_REPS, lastReps: item.reps }
      })
    )
  }

  function moveItem(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= items.length) return
    const next = [...items]
    ;[next[index], next[target]] = [next[target], next[index]]
    setItems(next)
  }

  function removeItem(index: number) {
    setItems((current) => current.filter((_, i) => i !== index))
  }

  async function submit() {
    setErrorMsg('')
    setPending(true)
    const result = await onSubmit({
      name,
      description,
      exercises: items.map((i) => {
        // "max" -> null ; saisie invalide -> NaN (refusée par la validation)
        const reps = parseRepsInput(i.reps)

        return {
          exercise_id: i.exercise_id,
          target_sets: Number(i.sets),
          target_reps: reps === undefined ? NaN : reps,
          rest_time: Number(i.rest),
        }
      }),
    })

    if ('error' in result) {
      setPending(false)
      setErrorMsg(result.error)
      return
    }
    disablePrevention()
    onDone()
  }

  return (
    <Screen>
      <BackLink label="Retour" fallback="/workouts" />
      <Title>{title}</Title>

      {errorMsg ? <ErrorBox>{errorMsg}</ErrorBox> : null}

      <View>
        <Label>Nom de la séance *</Label>
        <TextInput
          className={inputClass}
          value={name}
          onChangeText={setName}
          placeholder="Ex : Push Day - Débutant"
          placeholderTextColor="#9ca3af"
          returnKeyType="next"
        />
      </View>

      <View>
        <Label>Description</Label>
        <TextInput
          className={`${inputClass} min-h-20`}
          value={description}
          onChangeText={setDescription}
          multiline
          textAlignVertical="top"
        />
      </View>

      <View className="gap-3">
        <Label>Exercices</Label>

        <Button label="+ Ajouter des exercices" variant="secondary" onPress={() => setPickerOpen(true)} />
        {exercises.length === 0 ? <Muted>Aucun exercice disponible.</Muted> : null}

        {items.length === 0 ? (
          <View className="rounded-lg border border-dashed border-gray-300 p-4 dark:border-zinc-700">
            <Text className="text-center text-sm text-gray-500 dark:text-zinc-400">Aucun exercice pour l&apos;instant.</Text>
          </View>
        ) : (
          items.map((item, index) => {
            const exercise = exerciseById.get(item.exercise_id)
            const restSeconds = Number(item.rest)

            return (
              <Card key={item.exercise_id}>
                <View className="mb-3 flex-row items-start justify-between gap-2">
                  <View className="shrink">
                    <Text className="font-medium text-gray-900 dark:text-white">
                      {index + 1}. {exercise?.name ?? 'Exercice introuvable'}
                    </Text>
                    {exercise ? (
                      <Text className="text-xs text-gray-500 dark:text-zinc-400">{exercise.muscle_group}</Text>
                    ) : null}
                  </View>
                  <View className="flex-row items-center gap-1">
                    <IconButton label="↑" accessibilityLabel="Monter" disabled={index === 0} onPress={() => moveItem(index, -1)} />
                    <IconButton
                      label="↓"
                      accessibilityLabel="Descendre"
                      disabled={index === items.length - 1}
                      onPress={() => moveItem(index, 1)}
                    />
                    <Pressable onPress={() => removeItem(index)} hitSlop={6} className="px-2 py-1 active:opacity-60">
                      <Text className="text-sm text-red-600">Retirer</Text>
                    </Pressable>
                  </View>
                </View>

                {/* Séries, répétitions et repos sur une seule ligne */}
                <View className="flex-row items-start gap-2">
                  <NumberField
                    label="Séries"
                    value={item.sets}
                    onChange={(v) => updateItem(index, 'sets', v)}
                    fieldWidth={FIELD_WIDTH}
                  />

                  <View>
                    <Text className="mb-1 text-xs text-gray-600 dark:text-zinc-400">Répétitions</Text>
                    {/* Champ des répétitions avec le bouton Max à l'intérieur, à droite */}
                    <View
                      className="h-12 flex-row items-center overflow-hidden rounded-lg border border-gray-300 bg-white dark:border-zinc-700 dark:bg-slate-900"
                      style={{ width: FIELD_WIDTH + MAX_WIDTH }}
                    >
                      {item.reps === MAX_REPS ? (
                        // « Max » remplace le nombre : le champ n'est plus modifiable
                        <View
                          className="h-full flex-1 items-center justify-center"
                          accessibilityLabel="Répétitions : max, jusqu'à l'échec"
                        >
                          <Text className="text-sm font-bold text-blue-600">MAX</Text>
                        </View>
                      ) : (
                        <TextInput
                          className="h-full flex-1 p-0 text-center text-[16px] text-gray-900 dark:text-white"
                          value={item.reps}
                          // Chiffres uniquement
                          onChangeText={(v) => updateItem(index, 'reps', v.replace(/[^0-9]/g, ''))}
                          keyboardType="number-pad"
                          selectTextOnFocus
                          maxLength={4}
                        />
                      )}
                      <Pressable
                        onPress={() => toggleMax(index)}
                        accessibilityRole="button"
                        accessibilityLabel="Max : jusqu'à l'échec"
                        accessibilityState={{ selected: item.reps === MAX_REPS }}
                        className={`h-full items-center justify-center border-l ${
                          item.reps === MAX_REPS
                            ? 'border-blue-600 bg-blue-600'
                            : 'border-gray-300 active:bg-gray-100 dark:border-zinc-700 dark:active:bg-zinc-800'
                        }`}
                        style={{ width: MAX_WIDTH }}
                      >
                        <Text
                          className={`text-xs font-bold ${
                            item.reps === MAX_REPS ? 'text-white' : 'text-gray-700 dark:text-zinc-200'
                          }`}
                        >
                          Max
                        </Text>
                      </Pressable>
                    </View>
                  </View>

                  <NumberField
                    label="Repos (s)"
                    value={item.rest}
                    onChange={(v) => updateItem(index, 'rest', v)}
                    hint={Number.isInteger(restSeconds) && restSeconds >= 60 ? `= ${formatRestTime(restSeconds)}` : undefined}
                  />
                </View>
              </Card>
            )
          })
        )}

      </View>

      <View className="flex-row gap-3 pt-2">
        <Button label="Annuler" variant="secondary" className="flex-1" onPress={() => router.back()} disabled={pending} />
        <Button label={submitLabel} className="flex-1" onPress={submit} pending={pending} />
      </View>

      <ExercisePicker
        visible={pickerOpen}
        exercises={exercises}
        addedIds={addedIds}
        onAdd={addExercise}
        onClose={() => setPickerOpen(false)}
      />
    </Screen>
  )
}

// Largeur des champs Séries et Répétitions (identique) ; le repos prend ce qui reste
const FIELD_WIDTH = 64
// Largeur du bouton Max, placé à l'intérieur du champ des répétitions
const MAX_WIDTH = 52

function NumberField({
  label,
  value,
  onChange,
  hint,
  fieldWidth,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  hint?: string
  fieldWidth?: number
}) {
  return (
    <View className={fieldWidth ? undefined : 'flex-1'} style={fieldWidth ? { width: fieldWidth } : undefined}>
      <Text className="mb-1 text-xs text-gray-600 dark:text-zinc-400">{label}</Text>
      <TextInput
        className={`${inputClass} h-12 py-0 text-center`}
        value={value}
        // Chiffres uniquement (le clavier numérique peut proposer d'autres caractères)
        onChangeText={(v) => onChange(v.replace(/[^0-9]/g, ''))}
        keyboardType="number-pad"
        selectTextOnFocus
        maxLength={4}
      />
      {hint ? <Text className="mt-1 text-xs text-gray-500 dark:text-zinc-400">{hint}</Text> : null}
    </View>
  )
}

function IconButton({
  label,
  accessibilityLabel,
  disabled,
  onPress,
}: {
  label: string
  accessibilityLabel: string
  disabled: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      className="h-8 w-8 items-center justify-center rounded border border-gray-300 bg-white active:bg-gray-100 disabled:opacity-30 dark:border-zinc-700 dark:bg-zinc-800"
    >
      <Text className="text-sm text-gray-700 dark:text-zinc-200">{label}</Text>
    </Pressable>
  )
}
