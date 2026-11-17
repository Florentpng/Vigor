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

import { ACCENT } from '@/lib/theme'

// Composants de base des écrans, alignés sur les classes Tailwind du web (mode sombre en zinc).

export const inputClass =
  'rounded-lg border border-gray-300 bg-white p-3 text-base text-gray-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white'

export function Label({ children }: PropsWithChildren) {
  return <Text className="mb-1 text-sm font-medium text-gray-700 dark:text-zinc-300">{children}</Text>
}

type ScreenProps = PropsWithChildren<{
  refreshing?: boolean
  onRefresh?: () => void
}>

// Fond de page défilant avec « tirer pour rafraîchir » optionnel
export function Screen({ children, refreshing = false, onRefresh }: ScreenProps) {
  return (
    <ScrollView
      className="flex-1 bg-gray-50 dark:bg-zinc-950"
      contentContainerClassName="gap-5 p-4 pb-10"
      keyboardShouldPersistTaps="handled"
      // iOS : décale le contenu sous l'en-tête transparent des piles (Séances), sinon il passe dessous
      contentInsetAdjustmentBehavior="automatic"
      // iOS : le clavier ne masque pas le champ en cours de saisie
      automaticallyAdjustKeyboardInsets
      refreshControl={
        onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} /> : undefined
      }
    >
      {children}
    </ScrollView>
  )
}

// Indicateur plein écran du premier chargement
export function Loading() {
  return (
    <View className="flex-1 items-center justify-center bg-gray-50 dark:bg-zinc-950">
      <ActivityIndicator color={ACCENT} />
    </View>
  )
}

export function Title({ children, subtitle }: PropsWithChildren<{ subtitle?: ReactNode }>) {
  return (
    <View>
      <Text className="text-2xl font-bold text-gray-900 dark:text-white">{children}</Text>
      {subtitle ? <Text className="mt-1 text-sm text-gray-600 dark:text-zinc-400">{subtitle}</Text> : null}
    </View>
  )
}

export function SectionTitle({ children, right }: PropsWithChildren<{ right?: ReactNode }>) {
  return (
    <View className="flex-row items-center justify-between gap-3">
      <Text className="text-lg font-semibold text-gray-800 dark:text-zinc-100">{children}</Text>
      {right}
    </View>
  )
}

const cardClass = 'rounded-xl border border-gray-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900'

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
  primary: { box: 'bg-blue-600 active:bg-blue-700', text: 'text-white', spinner: 'white' },
  secondary: {
    box: 'border border-gray-300 bg-white active:bg-gray-100 dark:border-zinc-700 dark:bg-zinc-900 dark:active:bg-zinc-800',
    text: 'text-gray-700 dark:text-zinc-200',
    spinner: ACCENT,
  },
  danger: { box: 'border border-red-300 bg-white active:bg-red-50 dark:border-red-900 dark:bg-zinc-900', text: 'text-red-600', spinner: '#dc2626' },
} as const

type ButtonProps = Omit<PressableProps, 'children'> & {
  label: string
  variant?: keyof typeof buttonClasses
  pending?: boolean
  className?: string
}

export function Button({ label, variant = 'primary', pending = false, disabled, className = '', ...props }: ButtonProps) {
  const style = buttonClasses[variant]
  return (
    <Pressable
      {...props}
      disabled={disabled || pending}
      className={`items-center rounded-lg px-4 py-3 disabled:opacity-50 ${style.box} ${className}`}
    >
      {pending ? (
        <ActivityIndicator color={style.spinner} />
      ) : (
        <Text className={`text-base font-medium ${style.text}`}>{label}</Text>
      )}
    </Pressable>
  )
}
