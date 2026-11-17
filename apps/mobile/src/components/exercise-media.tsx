import { Image } from 'expo-image'
import * as WebBrowser from 'expo-web-browser'
import { Pressable, Text } from 'react-native'

// Média d'un exercice : un GIF s'affiche directement ; une vidéo s'ouvre dans le navigateur intégré
// (lecture intégrée possible plus tard avec expo-video, qui demande une nouvelle dépendance native).
export default function ExerciseMedia({ url, name }: { url: string; name: string }) {
  if (url.toLowerCase().endsWith('.gif')) {
    return (
      <Image
        source={{ uri: url }}
        accessibilityLabel={name}
        contentFit="contain"
        style={{ width: '100%', height: 224, borderRadius: 8 }}
      />
    )
  }

  return (
    <Pressable onPress={() => WebBrowser.openBrowserAsync(url)} className="self-start active:opacity-60">
      <Text className="text-sm font-medium text-blue-600">▶ Voir la vidéo</Text>
    </Pressable>
  )
}
