import Ionicons from '@expo/vector-icons/Ionicons'
import { Image } from 'expo-image'
import { useState } from 'react'
import { Modal, Pressable, Text, TextInput, useColorScheme, View } from 'react-native'

import { getBadges, getHistory, getHistoryTotals, getProfile, type BadgeStatus } from '@vigor/shared/queries'
import { updateWeight } from '@vigor/shared/profile'

import { Button, Card, ErrorBox, glassClass, glassSurface, inputClass, Loading, Muted, Screen, SectionTitle, Title } from '@/components/ui'
import { useSession } from '@/lib/auth'
import { badgeImage } from '@/lib/badges'
import { supabase } from '@/lib/supabase'
import { useAccent } from '@/lib/theme'
import { useFocusQuery } from '@/lib/use-focus-query'

// 45 -> "45 min", 135 -> "2 h 15"
function formatTotalMinutes(minutes: number) {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest === 0 ? `${hours} h` : `${hours} h ${String(rest).padStart(2, '0')}`
}

export default function ProfileScreen() {
  const { session } = useSession()
  const userId = session?.user.id ?? ''
  const dark = useColorScheme() === 'dark'
  const accent = useAccent()
  const flame = dark ? '#fb923c' : '#ea580c'

  const { data, loading, refreshing, refresh, error } = useFocusQuery(async () => {
    const [profile, history, totals, badges] = await Promise.all([
      getProfile(supabase, userId),
      getHistory(supabase, userId),
      getHistoryTotals(supabase, userId),
      getBadges(supabase, userId),
    ])
    return { profile, history, totals: totals.data, badges }
  })

  if (loading) return <Loading />

  const badges = data?.badges ?? []
  const unlockedCount = badges.filter((b) => b.unlocked_at).length
  const history = data?.history.data ?? []
  const totals = data?.totals ?? { sessions: 0, minutes: 0, calories: 0 }
  const errorMessage = error ?? data?.history.error

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <Title subtitle={session?.user.email}>Profil</Title>

      {errorMessage ? <ErrorBox>{errorMessage}</ErrorBox> : null}

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

      <WeightCard key={data?.profile.weight_kg ?? 'none'} initialWeight={data?.profile.weight_kg ?? null} onSaved={refresh} />

      <View className="gap-3">
        <SectionTitle
          right={
            <Text className="text-sm text-gray-500 dark:text-zinc-400">
              {unlockedCount} / {badges.length}
            </Text>
          }
        >
          Badges
        </SectionTitle>
        <View className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-zinc-800">
          <View
            className="h-full rounded-full bg-blue-600"
            style={{ width: `${badges.length > 0 ? (unlockedCount / badges.length) * 100 : 0}%` }}
          />
        </View>
        {badges.map((badge) => (
          <BadgeCard key={badge.id} badge={badge} />
        ))}
      </View>

      <View className="gap-3">
        <SectionTitle>Séances effectuées</SectionTitle>
        {history.length === 0 ? (
          <Muted>Aucune séance enregistrée pour l&apos;instant.</Muted>
        ) : (
          history.map((log) => (
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
          ))
        )}
      </View>
    </Screen>
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

function WeightCard({ initialWeight, onSaved }: { initialWeight: number | null; onSaved: () => void }) {
  const [value, setValue] = useState(initialWeight === null ? '' : String(initialWeight))
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'ok'; text: string } | null>(null)

  async function save() {
    setMessage(null)
    setPending(true)
    const result = await updateWeight(supabase, Number(value.replace(',', '.')))
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
      <Text className="mb-1 text-sm font-medium text-gray-700 dark:text-zinc-300">Poids (kg)</Text>
      <View className="flex-row items-center gap-3">
        <TextInput
          className={`${inputClass} w-28`}
          value={value}
          onChangeText={setValue}
          keyboardType="decimal-pad"
          maxLength={6}
          selectTextOnFocus
        />
        <Button label="Enregistrer" onPress={save} pending={pending} />
      </View>
      <Text className="mt-3 text-xs text-gray-500 dark:text-zinc-400">
        Sert au calcul des calories brûlées pendant tes séances.
      </Text>
      {message ? (
        <Text className={`mt-2 text-sm ${message.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>{message.text}</Text>
      ) : null}
    </Card>
  )
}

function BadgeImage({ code, size, unlocked }: { code: string; size: number; unlocked: boolean }) {
  const source = badgeImage(code, unlocked)
  if (source) {
    // Badge verrouillé : version en niveaux de gris, comme sur le web
    return <Image source={source} contentFit="contain" style={{ width: size, height: size }} />
  }
  // Pas d'image : une étoile
  return (
    <View
      className={`items-center justify-center rounded-full ${unlocked ? 'bg-amber-400' : 'bg-gray-300'}`}
      style={{ width: size, height: size }}
    >
      <Ionicons name="star" size={size / 2} color="#ffffff" />
    </View>
  )
}

// Carte de badge ; un appui ouvre le badge en grand
function BadgeCard({ badge }: { badge: BadgeStatus }) {
  const accent = useAccent()
  const [open, setOpen] = useState(false)
  const unlocked = Boolean(badge.unlocked_at)
  const status = unlocked
    ? `Débloqué le ${new Date(badge.unlocked_at as string).toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris' })}`
    : 'Verrouillé'

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityLabel={`Voir le badge ${badge.title} en grand`}
        className={`flex-row items-start gap-3 p-4 ${glassSurface} ${
          unlocked ? 'border-blue-600' : 'border-gray-200 opacity-60 dark:border-zinc-800'
        }`}
        // Badge débloqué : halo orange (elevation : l'ombre colorée d'Android)
        style={
          unlocked
            ? {
                shadowColor: accent,
                shadowOpacity: 0.5,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 0 },
                elevation: 8,
              }
            : undefined
        }
      >
        <BadgeImage code={badge.code} size={64} unlocked={unlocked} />
        <View className="shrink flex-1">
          <Text className="font-display text-xl uppercase leading-tight text-gray-900 dark:text-white">{badge.title}</Text>
          <Text className="text-sm text-gray-600 dark:text-zinc-400">{badge.description}</Text>
          <Text className="mt-1 text-xs text-gray-500 dark:text-zinc-400">{status}</Text>
        </View>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 items-center justify-center bg-black/60 p-6" onPress={() => setOpen(false)}>
          <View className="w-full max-w-sm items-center gap-4 rounded-2xl border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <BadgeImage code={badge.code} size={240} unlocked={unlocked} />
            <View className="items-center">
              <Text className="font-display text-2xl uppercase text-gray-900 dark:text-white">{badge.title}</Text>
              <Text className="mt-1 text-center text-sm text-gray-600 dark:text-zinc-400">{badge.description}</Text>
              <Text className="mt-3 text-xs font-medium text-gray-500 dark:text-zinc-400">{status}</Text>
            </View>
            <Button label="Fermer" variant="secondary" className="px-6" onPress={() => setOpen(false)} />
          </View>
        </Pressable>
      </Modal>
    </>
  )
}
