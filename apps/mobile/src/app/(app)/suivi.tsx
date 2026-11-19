import Ionicons from '@expo/vector-icons/Ionicons'
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker'
import { useState } from 'react'
import { Alert, Platform, Pressable, Text, TextInput, View } from 'react-native'

import { deleteWeightEntry, getTodayDate, getWeightEntries, saveWeightEntry, type WeightEntry } from '@vigor/shared/weights'

import { Button, Card, ErrorBox, glassClass, inputClass, Label, Loading, Muted, Screen, SectionTitle, Title } from '@/components/ui'
import { useUserId } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import WeightChart from '@/components/weight-chart'
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

// "2026-11-19" -> "19 nov. 2026"
function formatShortDate(value: string) {
  return fromIsoDate(value).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

// Heure de saisie, à Paris
function formatTime(value: string) {
  return new Date(value).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' })
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

      <History entries={entries} onDeleted={refresh} />

      {errorMessage ? <ErrorBox>{errorMessage}</ErrorBox> : null}

      <View className="gap-3">
        <SectionTitle>Évolution</SectionTitle>
        {entries.length < 2 ? (
          <Muted>Enregistre au moins deux pesées pour voir la courbe.</Muted>
        ) : (
          <Card className="pt-2">
            <WeightChart entries={[...entries].reverse()} />
          </Card>
        )}
      </View>
    </Screen>
  )
}

// Bandeau déroulant, sous le formulaire : replié par défaut
function History({ entries, onDeleted }: { entries: WeightEntry[]; onDeleted: () => void }) {
  const [open, setOpen] = useState(false)

  return (
    <View className={`overflow-hidden ${glassClass}`}>
      <Pressable
        onPress={() => setOpen((value) => !value)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        className="flex-row items-center justify-between px-4 py-3"
      >
        <Text className="font-display text-2xl text-gray-900 dark:text-white">
          Historique
          <Text className="font-sans text-sm text-gray-500 dark:text-zinc-400">{`  ${entries.length}`}</Text>
        </Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={20} color="#94a3b8" />
      </Pressable>
      {open ? (
        <View className="border-t border-gray-200 bg-gray-50 px-4 dark:border-zinc-800 dark:bg-zinc-950/40">
          {entries.length === 0 ? (
            <Text className="py-3 text-sm text-gray-500 dark:text-zinc-400">Aucune pesée enregistrée pour l&apos;instant.</Text>
          ) : (
            entries.map((entry, i) => <EntryRow key={entry.id} entry={entry} first={i === 0} onDeleted={onDeleted} />)
          )}
        </View>
      ) : null}
    </View>
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
      {/* Une seule ligne : date, poids, bouton */}
      <View className="flex-row items-end gap-3">
        <View>
          <Label>Date</Label>
          {Platform.OS === 'ios' ? (
            <View className="h-12 flex-row items-center" style={{ marginLeft: -10 }}>
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
              className={`${inputClass} h-12 flex-row items-center gap-2`}
              onPress={() =>
                DateTimePickerAndroid.open({
                  value: date,
                  mode: 'date',
                  maximumDate: today,
                  onChange: (_, selected) => selected && setDate(selected),
                })
              }
            >
              <Text className="text-base text-gray-900 dark:text-white">{formatShortDate(toIsoDate(date))}</Text>
              <Ionicons name="calendar-outline" size={18} color={accent} />
            </Pressable>
          )}
        </View>

        <View>
          <Label>Poids (kg)</Label>
          <TextInput
            className={`${inputClass} h-12 w-20`}
            value={value}
            onChangeText={setValue}
            keyboardType="decimal-pad"
            maxLength={6}
          />
        </View>

        <Button label="Enregistrer" onPress={save} pending={pending} disabled={!value} className="h-12 flex-1" />
      </View>
      <Text className="mt-3 text-xs text-gray-500 dark:text-zinc-400">
        La pesée la plus récente sert au calcul des calories brûlées pendant tes séances.
      </Text>
      {message ? (
        <Text className={`mt-2 text-sm ${message.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>{message.text}</Text>
      ) : null}
    </Card>
  )
}

// Même panneau que le détail d'un exercice : petite ligne grise, puis le texte
function EntryRow({ entry, first, onDeleted }: { entry: WeightEntry; first: boolean; onDeleted: () => void }) {
  const label = `${entry.weight_kg} kg du ${formatShortDate(entry.measured_on)}`

  function confirmDelete() {
    Alert.alert('Supprimer cette pesée ?', label, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          const result = await deleteWeightEntry(supabase, entry.id)
          if ('error' in result) Alert.alert('Erreur', result.error)
          else onDeleted()
        },
      },
    ])
  }

  return (
    <View
      className={`flex-row items-center justify-between gap-3 py-3 ${
        first ? '' : 'border-t border-gray-200 dark:border-zinc-800'
      }`}
    >
      <View className="shrink gap-1">
        <Text className="text-xs uppercase text-gray-500 dark:text-zinc-400">
          {formatShortDate(entry.measured_on)} · saisi à {formatTime(entry.created_at)}
        </Text>
        <Text className="font-display text-xl text-gray-900 dark:text-white">{entry.weight_kg} kg</Text>
      </View>
      <Pressable onPress={confirmDelete} hitSlop={8} accessibilityLabel={`Supprimer la pesée ${label}`} className="p-2">
        <Ionicons name="trash-outline" size={20} color="#dc2626" />
      </Pressable>
    </View>
  )
}
