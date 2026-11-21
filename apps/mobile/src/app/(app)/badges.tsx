import Ionicons from '@expo/vector-icons/Ionicons'
import { Image } from 'expo-image'
import { useState } from 'react'
import { Modal, Pressable, Text, View } from 'react-native'

import { getBadges, type BadgeStatus } from '@vigor/shared/queries'

import BackLink from '@/components/back-link'
import { Button, ErrorBox, glassSurface, Loading, Screen, SectionTitle } from '@/components/ui'
import { useUserId } from '@/lib/auth'
import { badgeImage } from '@/lib/badges'
import { supabase } from '@/lib/supabase'
import { useAccent } from '@/lib/theme'
import { useFocusQuery } from '@/lib/use-focus-query'

// Badges : progression et liste (accessible depuis l'onglet Profil)
export default function BadgesScreen() {
  const userId = useUserId()
  const { data, loading, refreshing, refresh, error } = useFocusQuery(() => getBadges(supabase, userId))

  if (loading) return <Loading />

  const badges = data ?? []
  const unlockedCount = badges.filter((b) => b.unlocked_at).length

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <BackLink label="Profil" fallback="/profile" />

      {error ? <ErrorBox>{error}</ErrorBox> : null}

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
    </Screen>
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
