import Ionicons from '@expo/vector-icons/Ionicons'
import { type Href, router } from 'expo-router'
import { Pressable, Text } from 'react-native'

import { ACCENT } from '@/lib/theme'

// Lien « retour » en haut d'un écran de pile (les piles n'ont pas d'en-tête propre).
// Revient à l'écran précédent, ou à `fallback` si on est arrivé directement ici.
export default function BackLink({ label, fallback }: { label: string; fallback: Href }) {
  return (
    <Pressable
      onPress={() => (router.canGoBack() ? router.back() : router.navigate(fallback))}
      accessibilityRole="link"
      className="flex-row items-center gap-1 self-start active:opacity-60"
      hitSlop={8}
    >
      <Ionicons name="chevron-back" size={18} color={ACCENT} />
      <Text className="text-sm font-medium text-blue-600">{label}</Text>
    </Pressable>
  )
}
