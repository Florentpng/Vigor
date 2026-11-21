import Ionicons from '@expo/vector-icons/Ionicons'
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker'
import { useState } from 'react'
import { Alert, Platform, Pressable, ScrollView, Text, TextInput, useColorScheme, View } from 'react-native'

import { getLoadSummaries } from '@vigor/shared/loads'
import { getHistory, getHistoryTotals } from '@vigor/shared/queries'
import { deleteWeightEntry, getTodayDate, getWeightEntries, saveWeightEntry, type WeightEntry } from '@vigor/shared/weights'

import { Button, Card, ErrorBox, glassClass, inputClass, Label, Loading, Muted, Screen, SectionTitle, Title } from '@/components/ui'
import { useUserId } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import Collapsible from '@/components/collapsible'
import LoadsSection from '@/components/loads-section'
import WeightChart from '@/components/weight-chart'
import { useAccent } from '@/lib/theme'
import { useFocusQuery } from '@/lib/use-focus-query'

// 45 -> "45 min", 135 -> "2 h 15"
function formatTotalMinutes(minutes: number) {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest === 0 ? `${hours} h` : `${hours} h ${String(rest).padStart(2, '0')}`
}

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
  const dark = useColorScheme() === 'dark'
  const accent = useAccent()
  const flame = dark ? '#fb923c' : '#ea580c'

  const { data, loading, refreshing, refresh, error } = useFocusQuery(async () => {
    const [weights, history, totals, loads] = await Promise.all([
      getWeightEntries(supabase, userId),
      getHistory(supabase, userId),
      getHistoryTotals(supabase, userId),
      getLoadSummaries(supabase, userId),
    ])
    return { weights, history, totals: totals.data, loads }
  })

  if (loading) return <Loading />

  const entries = data?.weights.data ?? []
  const history = data?.history.data ?? []
  const totals = data?.totals ?? { sessions: 0, minutes: 0, calories: 0 }
  const errorMessage = error ?? data?.weights.error ?? data?.history.error ?? data?.loads.error

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <Title>Suivi</Title>

      <View className="flex-row gap-3">
        <StatTile
          icon={<Ionicons name="barbell-outline" size={24} color={accent} />}
          value={String(totals.sessions)}
          label={totals.sessions > 1 ? 'Séances' : 'Séance'}
        />
        <StatTile
          icon={<Ionicons name="timer-outline" size={24} color={accent} />}
          value={formatTotalMinutes(totals.minutes)}
          label="Temps total"
        />
        <StatTile
          icon={<Ionicons name="flame" size={28} color={flame} />}
          value={String(totals.calories)}
          label="kcal brûlées"
        />
      </View>

      <WeightForm current={entries[0]} onSaved={refresh} />

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

      <History entries={entries} onDeleted={refresh} />

      <LoadsSection loads={data?.loads.data ?? []} />

      <Collapsible title="Séances effectuées">
        {history.length === 0 ? (
          <Text className="px-4 py-3 text-sm text-gray-500 dark:text-zinc-400">Aucune séance enregistrée pour l&apos;instant.</Text>
        ) : (
          // Hauteur limitée : seul ce bloc défile (barre visible), la page ne s'allonge pas avec le nombre de séances
          <ScrollView
            nestedScrollEnabled
            showsVerticalScrollIndicator
            persistentScrollbar
            style={{ maxHeight: 440 }}
            contentContainerClassName="gap-3 p-3 pr-4"
          >
            {history.map((log) => (
              <View key={log.id} className={`flex-row items-center justify-between gap-3 px-4 py-3 ${glassClass}`}>
                <View className="shrink">
                  <Text className="font-semibold text-gray-900 dark:text-white">{log.workout_name ?? 'Séance supprimée'}</Text>
                  <Text className="text-xs text-gray-500 dark:text-zinc-400">
                    {new Date(log.completed_at).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      timeZone: 'Europe/Paris',
                    })}
                  </Text>
                </View>
                <View className="items-end gap-0.5">
                  <View className="flex-row items-center gap-1.5">
                    <Ionicons name="timer-outline" size={16} color={accent} />
                    <Text className="text-sm text-gray-600 dark:text-zinc-400">{log.duration_minutes} min</Text>
                  </View>
                  <View className="flex-row items-center gap-1.5">
                    <Ionicons name="flame" size={16} color={flame} />
                    <Text className="text-sm text-orange-600 dark:text-orange-400">{Math.round(log.calories_burned)} kcal</Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </Collapsible>
    </Screen>
  )
}

// Historique des pesées : bandeau déroulant, replié par défaut
function History({ entries, onDeleted }: { entries: WeightEntry[]; onDeleted: () => void }) {
  return (
    <Collapsible title="Historique des pesées">
      {entries.length === 0 ? (
        <Text className="px-4 py-3 text-sm text-gray-500 dark:text-zinc-400">Aucune pesée enregistrée pour l&apos;instant.</Text>
      ) : (
        // Hauteur limitée : seul ce bloc défile (barre visible)
        <ScrollView
          nestedScrollEnabled
          showsVerticalScrollIndicator
          persistentScrollbar
          style={{ maxHeight: 440 }}
          contentContainerClassName="px-4 pr-5"
        >
          {entries.map((entry, i) => (
            <EntryRow key={entry.id} entry={entry} first={i === 0} onDeleted={onDeleted} />
          ))}
        </ScrollView>
      )}
    </Collapsible>
  )
}

function WeightForm({ current, onSaved }: { current: WeightEntry | undefined; onSaved: () => void }) {
  const accent = useAccent()
  const [date, setDate] = useState(() => fromIsoDate(getTodayDate()))
  // Le champ s'ouvre avec le poids actuel (la pesée la plus récente)
  const [value, setValue] = useState(current ? String(current.weight_kg) : '')
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

function StatTile({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <Card className="flex-1 items-center px-2">
      {icon}
      <Text className="mt-1 font-display text-3xl text-gray-900 dark:text-white">{value}</Text>
      <Text className="text-center text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-zinc-400">{label}</Text>
    </Card>
  )
}
