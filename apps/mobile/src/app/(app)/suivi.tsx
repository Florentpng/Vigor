import Ionicons from '@expo/vector-icons/Ionicons'
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker'
import { useState } from 'react'
import { Alert, Platform, Pressable, Text, TextInput, View } from 'react-native'

import { deleteWeightEntry, getTodayDate, getWeightEntries, saveWeightEntry } from '@vigor/shared/weights'

import { Button, Card, ErrorBox, glassClass, inputClass, Label, Loading, Muted, Screen, SectionTitle, Title } from '@/components/ui'
import { useUserId } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { useAccent } from '@/lib/theme'
import { useFocusQuery } from '@/lib/use-focus-query'

const pad = (n: number) => String(n).padStart(2, '0')

// Date locale -> "AAAA-MM-JJ"
function toIsoDate(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

// "2026-11-19" -> Date (midi, pour éviter tout décalage de fuseau)
function fromIsoDate(value: string) {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d, 12)
}

// "2026-11-19" -> "jeudi 19 novembre 2026"
function formatDate(value: string) {
  return fromIsoDate(value).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// Suivi du poids : une pesée par jour, la plus récente sert au calcul des calories
export default function WeightScreen() {
  const userId = useUserId()
  const { data, loading, refreshing, refresh, error } = useFocusQuery(() => getWeightEntries(supabase, userId))

  if (loading) return <Loading />

  const entries = data?.data ?? []
  const errorMessage = error ?? data?.error

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <Title>Suivi</Title>

      <WeightForm onSaved={refresh} />

      {errorMessage ? <ErrorBox>{errorMessage}</ErrorBox> : null}

      <View className="gap-3">
        <SectionTitle>Historique</SectionTitle>
        {entries.length === 0 ? (
          <Muted>Aucune pesée enregistrée pour l&apos;instant.</Muted>
        ) : (
          entries.map((entry) => <EntryRow key={entry.id} id={entry.id} date={entry.measured_on} kg={entry.weight_kg} onDeleted={refresh} />)
        )}
      </View>
    </Screen>
  )
}

function WeightForm({ onSaved }: { onSaved: () => void }) {
  const accent = useAccent()
  const [date, setDate] = useState(() => fromIsoDate(getTodayDate()))
  const [value, setValue] = useState('')
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'ok'; text: string } | null>(null)
  const today = fromIsoDate(getTodayDate())

  async function save() {
    setMessage(null)
    setPending(true)
    const result = await saveWeightEntry(supabase, toIsoDate(date), Number(value.replace(',', '.')))
    setPending(false)
    if ('error' in result) {
      setMessage({ type: 'error', text: result.error })
      return
    }
    setValue('')
    setMessage({ type: 'ok', text: 'Poids enregistré.' })
    onSaved()
  }

  return (
    <Card>
      <Label>Date</Label>
      {Platform.OS === 'ios' ? (
        <View className="mb-3 flex-row">
          <DateTimePicker
            value={date}
            mode="date"
            display="compact"
            maximumDate={today}
            locale="fr-FR"
            accentColor={accent}
            onChange={(_, selected) => selected && setDate(selected)}
          />
        </View>
      ) : (
        <Pressable
          className={`${inputClass} mb-3 flex-row items-center justify-between`}
          onPress={() =>
            DateTimePickerAndroid.open({
              value: date,
              mode: 'date',
              maximumDate: today,
              onChange: (_, selected) => selected && setDate(selected),
            })
          }
        >
          <Text className="text-base text-gray-900 dark:text-white">{formatDate(toIsoDate(date))}</Text>
          <Ionicons name="calendar-outline" size={20} color={accent} />
        </Pressable>
      )}

      <Label>Poids (kg)</Label>
      <View className="flex-row items-center gap-3">
        <TextInput
          className={`${inputClass} w-28`}
          value={value}
          onChangeText={setValue}
          keyboardType="decimal-pad"
          maxLength={6}
        />
        <Button label="Enregistrer" onPress={save} pending={pending} disabled={!value} />
      </View>
      <Text className="mt-3 text-xs text-gray-500 dark:text-zinc-400">
        La pesée la plus récente sert au calcul des calories brûlées pendant tes séances. Une nouvelle saisie le même
        jour remplace la précédente.
      </Text>
      {message ? (
        <Text className={`mt-2 text-sm ${message.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>{message.text}</Text>
      ) : null}
    </Card>
  )
}

function EntryRow({ id, date, kg, onDeleted }: { id: string; date: string; kg: number; onDeleted: () => void }) {
  function confirmDelete() {
    Alert.alert('Supprimer cette pesée ?', `${kg} kg · ${formatDate(date)}`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          const result = await deleteWeightEntry(supabase, id)
          if ('error' in result) Alert.alert('Erreur', result.error)
          else onDeleted()
        },
      },
    ])
  }

  return (
    <View className={`flex-row items-center justify-between gap-3 px-4 py-3 ${glassClass}`}>
      <View className="shrink">
        <Text className="font-display text-2xl text-gray-900 dark:text-white">{kg} kg</Text>
        <Text className="text-xs text-gray-500 dark:text-zinc-400">{formatDate(date)}</Text>
      </View>
      <Pressable onPress={confirmDelete} hitSlop={10} accessibilityLabel="Supprimer cette pesée" className="p-2">
        <Ionicons name="trash-outline" size={20} color="#dc2626" />
      </Pressable>
    </View>
  )
}
