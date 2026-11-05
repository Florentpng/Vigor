import { Pressable, Text, View } from 'react-native'

import { useSession } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

// Accueil temporaire de l'étape 3 : remplacé par la séance du jour à l'étape 5.
export default function HomeScreen() {
  const { session } = useSession()

  return (
    <View className="flex-1 items-center justify-center gap-4 bg-gray-100 px-6 dark:bg-zinc-950">
      <Text className="text-3xl font-bold text-gray-900 dark:text-white">Vigor</Text>
      <Text className="text-center text-gray-600 dark:text-zinc-400">
        Connecté en tant que {session?.user.email}
      </Text>
      <Pressable
        onPress={() => supabase.auth.signOut()}
        className="rounded-lg border border-gray-300 px-4 py-2.5 active:bg-gray-200 dark:border-zinc-700 dark:active:bg-zinc-800"
      >
        <Text className="text-sm font-medium text-gray-800 dark:text-zinc-200">Se déconnecter</Text>
      </Pressable>
    </View>
  )
}
