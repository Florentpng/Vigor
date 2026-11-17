import { useState } from 'react'
import { FlatList, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { MUSCLE_GROUPS } from '@vigor/shared/constants'
import type { Exercise } from '@vigor/shared/types'

import { inputClass } from '@/components/ui'

type Props = {
  visible: boolean
  // Exercices pas encore ajoutés à la séance
  exercises: Exercise[]
  onAdd: (exerciseId: string) => void
  onClose: () => void
}

// Feuille de choix des exercices : recherche par nom + filtre par muscle.
// Toucher un exercice l'ajoute (il disparaît de la liste) ; on peut en ajouter plusieurs d'affilée.
export default function ExercisePicker({ visible, exercises, onAdd, onClose }: Props) {
  const [search, setSearch] = useState('')
  const [muscle, setMuscle] = useState<string | null>(null)

  const query = normalize(search.trim())
  const shown = exercises.filter(
    (e) => (!muscle || e.muscle_group === muscle) && (!query || normalize(e.name).includes(query))
  )

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-gray-50 dark:bg-zinc-950">
        <View className="flex-row items-center justify-between px-4 pb-2 pt-4">
          <Text className="text-lg font-semibold text-gray-900 dark:text-white">Ajouter des exercices</Text>
          <Pressable onPress={onClose} hitSlop={8} className="active:opacity-60">
            <Text className="text-base font-semibold text-blue-600">Terminé</Text>
          </Pressable>
        </View>

        <View className="px-4 pb-3">
          <TextInput
            className={inputClass}
            value={search}
            onChangeText={setSearch}
            placeholder="Rechercher un exercice"
            placeholderTextColor="#9ca3af"
            autoCorrect={false}
            clearButtonMode="while-editing"
            returnKeyType="search"
          />
        </View>

        <View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 px-4 pb-3">
            <FilterChip label="Tous" active={muscle === null} onPress={() => setMuscle(null)} />
            {MUSCLE_GROUPS.map((m) => (
              <FilterChip key={m} label={m} active={muscle === m} onPress={() => setMuscle(muscle === m ? null : m)} />
            ))}
          </ScrollView>
        </View>

        <FlatList
          data={shown}
          keyExtractor={(e) => e.id}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerClassName="px-4 pb-8"
          ListEmptyComponent={
            <Text className="py-8 text-center text-sm text-gray-500 dark:text-zinc-400">
              {exercises.length === 0 ? 'Tous les exercices sont déjà dans la séance.' : 'Aucun exercice trouvé.'}
            </Text>
          }
          renderItem={({ item, index }) => (
            <Pressable
              onPress={() => onAdd(item.id)}
              className={`flex-row items-center justify-between gap-3 py-3 active:opacity-60 ${
                index > 0 ? 'border-t border-gray-200 dark:border-zinc-800' : ''
              }`}
            >
              <View className="shrink">
                <Text className="font-medium text-gray-900 dark:text-white">{item.name}</Text>
                <Text className="text-xs text-gray-500 dark:text-zinc-400">
                  {item.muscle_group} · {item.equipment}
                </Text>
              </View>
              <Text className="text-2xl font-light text-blue-600">+</Text>
            </Pressable>
          )}
        />
      </SafeAreaView>
    </Modal>
  )
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityState={{ selected: active }}
      className={`rounded-full border px-3 py-1.5 ${
        active ? 'border-blue-600 bg-blue-600' : 'border-gray-300 bg-white dark:border-zinc-700 dark:bg-zinc-900'
      }`}
    >
      <Text className={`text-xs font-medium ${active ? 'text-white' : 'text-gray-700 dark:text-zinc-200'}`}>{label}</Text>
    </Pressable>
  )
}

// Recherche insensible à la casse et aux accents (« developpe » trouve « Développé »)
function normalize(text: string) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}
