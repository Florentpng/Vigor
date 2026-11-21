import Ionicons from '@expo/vector-icons/Ionicons'
import { useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'

import { formatLoad, getLoadHistory, type LoadSummary } from '@vigor/shared/loads'

import Collapsible from '@/components/collapsible'
import { glassClass, Muted } from '@/components/ui'
import WeightChart from '@/components/weight-chart'
import { useUserId } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { useFocusQuery } from '@/lib/use-focus-query'

// Charges de chaque exercice : charge actuelle et record ; un appui ouvre l'historique et la courbe
export default function LoadsSection({ loads }: { loads: LoadSummary[] }) {
  return (
    <Collapsible title="Charges">
      {loads.length === 0 ? (
        <View className="p-3">
          <Muted>Tes charges apparaîtront ici après ta première séance enregistrée.</Muted>
        </View>
      ) : (
        // Hauteur limitée : seul ce bloc défile (barre visible)
        <ScrollView
          nestedScrollEnabled
          showsVerticalScrollIndicator
          persistentScrollbar
          style={{ maxHeight: 440 }}
          contentContainerClassName="gap-3 p-3 pr-4"
        >
          {loads.map((item) => (
            <LoadRow key={item.exercise_id} item={item} />
          ))}
        </ScrollView>
      )}
    </Collapsible>
  )
}

function LoadRow({ item }: { item: LoadSummary }) {
  const [open, setOpen] = useState(false)
  const bodyweight = item.equipment === 'PDC'
  const showRecord = item.record_kg > item.weight_kg

  return (
    <View className={`overflow-hidden ${glassClass}`}>
      <Pressable
        onPress={() => setOpen((value) => !value)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        className="flex-row items-center justify-between gap-3 px-4 py-3 active:opacity-70"
      >
        <View className="shrink flex-1">
          <Text className="font-semibold text-gray-900 dark:text-white" numberOfLines={1}>
            {item.name}
          </Text>
          {item.muscle_group ? (
            <Text className="text-xs text-gray-500 dark:text-zinc-400">
              {item.muscle_group} · {item.equipment}
            </Text>
          ) : null}
        </View>
        <View className="items-end">
          <Text className="font-display text-2xl text-gray-900 dark:text-white">
            {item.weight_kg > 0 ? formatLoad(item.weight_kg) : bodyweight ? 'PDC' : '-'}
          </Text>
          {showRecord ? (
            <Text className="text-xs text-gray-500 dark:text-zinc-400">Record {formatLoad(item.record_kg)}</Text>
          ) : null}
        </View>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color="#94a3b8" />
      </Pressable>

      {open ? <LoadHistory exerciseId={item.exercise_id} /> : null}
    </View>
  )
}

// Courbe d'évolution d'un exercice (chargée à l'ouverture)
function LoadHistory({ exerciseId }: { exerciseId: string }) {
  const userId = useUserId()
  const { data, loading } = useFocusQuery(() => getLoadHistory(supabase, userId, exerciseId), exerciseId)

  if (loading) {
    return (
      <View className="border-t border-gray-200 px-4 py-3 dark:border-zinc-800">
        <Muted>Chargement…</Muted>
      </View>
    )
  }

  const sessions = data?.data ?? []
  if (sessions.length === 0) {
    return (
      <View className="border-t border-gray-200 px-4 py-3 dark:border-zinc-800">
        <Muted>Aucune séance enregistrée pour cet exercice.</Muted>
      </View>
    )
  }

  // La courbe réutilise celle du poids de corps : une pesée = la charge la plus lourde d'une séance
  const points = sessions.map((s) => ({
    id: s.session_id,
    measured_on: s.date,
    weight_kg: s.max_kg,
    created_at: s.date,
  }))

  return (
    <View className="border-t border-gray-200 bg-[#f8fafc] px-4 py-3 dark:border-zinc-800 dark:bg-[#0b0f19]">
      {points.length >= 2 ? (
        <WeightChart entries={points} />
      ) : (
        <Muted>Il faut au moins 2 séances pour tracer la courbe.</Muted>
      )}
    </View>
  )
}
