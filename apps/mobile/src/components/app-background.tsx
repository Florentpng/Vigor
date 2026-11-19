import { Image } from 'expo-image'
import { StyleSheet, useColorScheme, View } from 'react-native'

// Photo de salle de sport floutée, fixe derrière tous les écrans (comme le web) :
// voile clair en mode clair, photo assombrie en mode sombre.
export default function AppBackground() {
  const dark = useColorScheme() === 'dark'

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Image
        source={require('@/assets/images/background-blur.jpg')}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: dark ? 'rgba(0, 0, 0, 0.6)' : 'rgba(248, 250, 252, 0.72)' },
        ]}
      />
    </View>
  )
}
