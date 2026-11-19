import { Text, View } from 'react-native'

// Écran provisoire d'un onglet dont le contenu arrive à une étape suivante.
export default function ComingSoon({ title, step }: { title: string; step: number }) {
  return (
    <View className="flex-1 items-center justify-center gap-2 px-6">
      <Text className="font-display-xb text-4xl uppercase text-gray-900 dark:text-white">{title}</Text>
      <Text className="text-center text-gray-500 dark:text-zinc-400">À venir à l&apos;étape {step}.</Text>
    </View>
  )
}
