import { Image } from 'expo-image'
import { useVideoPlayer, VideoView } from 'expo-video'
import { View } from 'react-native'

// Média d'un exercice : un GIF s'affiche directement, une vidéo se lit dans l'écran (muette, en boucle)
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

  return <ExerciseVideo url={url} />
}

function ExerciseVideo({ url }: { url: string }) {
  const player = useVideoPlayer(url, (p) => {
    p.loop = true
    p.muted = true
  })

  return (
    <View className="overflow-hidden rounded-lg border border-gray-200 bg-black dark:border-zinc-700">
      <VideoView player={player} nativeControls contentFit="contain" style={{ width: '100%', height: 224 }} />
    </View>
  )
}
