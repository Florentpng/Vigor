import Ionicons from '@expo/vector-icons/Ionicons'
import { Image } from 'expo-image'
import type { PropsWithChildren, ReactNode } from 'react'
import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native'

import { formatReps, formatRestTime } from '@vigor/shared/format'

import { useAccent } from '@/lib/theme'

// Composants de base des écrans, alignés sur les classes Tailwind du web (mode sombre en zinc).

export const inputClass =
  'rounded-lg border border-gray-300 bg-white p-3 text-base text-gray-900 dark:border-zinc-700 dark:bg-slate-900 dark:text-white'

export function Label({ children }: PropsWithChildren) {
  return <Text className="mb-1 text-sm font-medium text-gray-700 dark:text-zinc-300">{children}</Text>
}

type ScreenProps = PropsWithChildren<{
  refreshing?: boolean
  onRefresh?: () => void
}>

// Fond de page défilant avec « tirer pour rafraîchir » optionnel
export function Screen({ children, refreshing = false, onRefresh }: ScreenProps) {
  const accent = useAccent()
  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="gap-5 p-4 pb-10"
      keyboardShouldPersistTaps="handled"
      // iOS : décale le contenu sous l'en-tête transparent des piles (Séances), sinon il passe dessous
      contentInsetAdjustmentBehavior="automatic"
      // iOS : le clavier ne masque pas le champ en cours de saisie
      automaticallyAdjustKeyboardInsets
      refreshControl={
        onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accent} /> : undefined
      }
    >
      {children}
    </ScrollView>
  )
}

// Indicateur plein écran du premier chargement
export function Loading() {
  const accent = useAccent()
  return (
    <View className="flex-1 items-center justify-center">
      <ActivityIndicator color={accent} />
    </View>
  )
}

export function Title({ children, subtitle }: PropsWithChildren<{ subtitle?: ReactNode }>) {
  return (
    <View>
      <Text className="font-display-xb text-4xl uppercase leading-none text-gray-900 dark:text-white">{children}</Text>
      {subtitle ? <Text className="mt-1 text-sm text-gray-600 dark:text-zinc-400">{subtitle}</Text> : null}
    </View>
  )
}

export function SectionTitle({ children, right }: PropsWithChildren<{ right?: ReactNode }>) {
  return (
    <View className="flex-row items-center justify-between gap-3">
      <Text className="font-display text-2xl text-gray-800 dark:text-zinc-100">{children}</Text>
      {right}
    </View>
  )
}

// Carte très légèrement transparente : laisse deviner la photo de fond
// Sans couleur de bordure : pour les cartes dont la bordure change (badge débloqué, jour courant),
// car deux classes de couleur de bordure sur le même élément se contredisent.
export const glassSurface = 'rounded-xl border bg-white/90 shadow-sm dark:bg-zinc-900/80'
export const glassClass = `${glassSurface} border-gray-200 dark:border-zinc-800`
const cardClass = `${glassClass} p-4`

// Carte ; devient touchable si onPress est fourni
export function Card({ children, onPress, className = '' }: PropsWithChildren<{ onPress?: () => void; className?: string }>) {
  if (!onPress) return <View className={`${cardClass} ${className}`}>{children}</View>
  return (
    <Pressable onPress={onPress} className={`${cardClass} active:opacity-70 ${className}`}>
      {children}
    </Pressable>
  )
}

export function ErrorBox({ children }: PropsWithChildren) {
  return <Text className="rounded-lg bg-red-100 p-3 text-sm text-red-700">{children}</Text>
}

export function Muted({ children }: PropsWithChildren) {
  return <Text className="text-sm text-gray-500 dark:text-zinc-400">{children}</Text>
}

const chipClasses = {
  blue: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  purple: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
  accent: 'bg-blue-600 text-white',
} as const

export function Chip({ children, color = 'blue' }: PropsWithChildren<{ color?: keyof typeof chipClasses }>) {
  return (
    <Text className={`self-start overflow-hidden rounded-full px-2 py-0.5 text-xs font-medium ${chipClasses[color]}`}>
      {children}
    </Text>
  )
}

const buttonClasses = {
  success: { box: 'bg-green-600 active:bg-green-700', text: 'text-white', spinner: 'white' },
  primary: { box: 'bg-blue-600 active:bg-blue-700', text: 'text-white', spinner: 'white' },
  secondary: {
    box: 'border border-gray-300 bg-white active:bg-gray-100 dark:border-zinc-700 dark:bg-zinc-900 dark:active:bg-zinc-800',
    text: 'text-gray-700 dark:text-zinc-200',
    spinner: '',
  },
  danger: { box: 'border border-red-300 bg-white active:bg-red-50 dark:border-red-900 dark:bg-zinc-900', text: 'text-red-600', spinner: '#dc2626' },
}

type ButtonProps = Omit<PressableProps, 'children'> & {
  label: string
  variant?: keyof typeof buttonClasses
  size?: 'md' | 'lg'
  pending?: boolean
  className?: string
}

export function Button({ label, variant = 'primary', size = 'md', pending = false, disabled, className = '', ...props }: ButtonProps) {
  const accent = useAccent()
  const style = buttonClasses[variant]
  const spinner = style.spinner || accent
  return (
    <Pressable
      {...props}
      disabled={disabled || pending}
      className={`items-center rounded-lg px-4 disabled:opacity-50 ${size === 'lg' ? 'py-4' : 'py-3'} ${style.box} ${className}`}
    >
      {pending ? (
        <ActivityIndicator color={spinner} />
      ) : (
        <Text className={`font-medium ${size === 'lg' ? 'text-lg' : 'text-base'} ${style.text}`}>{label}</Text>
      )}
    </Pressable>
  )
}

// Pastille de difficulté (Débutant, Intermédiaire, Avancé) : contour orange avec halo
export function LevelBadge({ children, size = 'lg' }: PropsWithChildren<{ size?: 'sm' | 'lg' }>) {
  const accent = useAccent()
  const large = size === 'lg'
  return (
    <View
      className={`self-start rounded-lg border-blue-600 bg-blue-50 ${large ? 'border-2 px-3 py-0.5' : 'border px-2 py-0.5'}`}
      style={{ shadowColor: accent, shadowOpacity: 0.45, shadowRadius: large ? 8 : 5, shadowOffset: { width: 0, height: 0 } }}
    >
      <Text className={`font-display-sb text-blue-600 ${large ? 'text-xl' : 'text-base'}`}>{children}</Text>
    </View>
  )
}

// « 4 SÉRIES × 10 REPS » dans une pastille avec un chrono
export function SetsPill({ sets, reps }: { sets: number; reps: number | null }) {
  const accent = useAccent()
  return (
    <View className="flex-row items-center gap-1.5 self-start rounded-full border border-blue-600/40 bg-blue-50 px-3 py-1">
      <Ionicons name="timer-outline" size={14} color={accent} />
      <Text className="text-xs font-bold uppercase tracking-wide text-gray-900 dark:text-white">
        {sets} séries × {formatReps(reps)} reps
      </Text>
    </View>
  )
}

// « REPOS : 2 MIN » avec un sablier
export function RestLabel({ seconds }: { seconds: number }) {
  const accent = useAccent()
  return (
    <View className="flex-row items-center gap-1">
      <Ionicons name="hourglass-outline" size={12} color={accent} />
      <Text className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-zinc-400">
        Repos : {formatRestTime(seconds)}
      </Text>
    </View>
  )
}

// Vignette d'un exercice : image sur toute la hauteur de la carte, ou une altère à défaut
export function ExerciseThumb({ url }: { url: string | null }) {
  return (
    <View className="w-24 items-center justify-center self-stretch overflow-hidden bg-gray-100 dark:bg-zinc-800">
      {url ? (
        <Image source={{ uri: url }} contentFit="contain" style={{ position: 'absolute', top: 0, right: '-16%', bottom: 0, left: '-16%' }} />
      ) : (
        <Ionicons name="barbell-outline" size={24} color="#94a3b8" />
      )}
    </View>
  )
}

// Barre de progression (0 à 100) ; « success » pour un repos terminé
export function ProgressBar({ value, tone = 'accent' }: { value: number; tone?: 'accent' | 'success' }) {
  return (
    <View className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-zinc-800">
      <View
        className={`h-full rounded-full ${tone === 'success' ? 'bg-green-600' : 'bg-blue-600'}`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </View>
  )
}
