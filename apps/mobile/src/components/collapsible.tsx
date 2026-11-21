import Ionicons from '@expo/vector-icons/Ionicons'
import { type PropsWithChildren, useState } from 'react'
import { Pressable, Text, View } from 'react-native'

import { glassClass } from '@/components/ui'

// Bandeau déroulant : un titre et un chevron, le contenu s'ouvre dessous (replié par défaut)
export default function Collapsible({ title, children }: PropsWithChildren<{ title: string }>) {
  const [open, setOpen] = useState(false)

  return (
    <View className={`overflow-hidden ${glassClass}`}>
      <Pressable
        onPress={() => setOpen((value) => !value)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        className="flex-row items-center justify-between px-4 py-3"
      >
        <Text className="font-display text-2xl text-gray-900 dark:text-white">{title}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={20} color="#94a3b8" />
      </Pressable>
      {open ? (
        <View className="border-t border-gray-200 bg-[#f8fafc] dark:border-zinc-800 dark:bg-[#0b0f19]">{children}</View>
      ) : null}
    </View>
  )
}
