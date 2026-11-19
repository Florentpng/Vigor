import { Image } from 'expo-image'
import { View } from 'react-native'

// Logo V seul : la place à côté sert au bandeau de musique
export default function HeaderLogo() {
  return (
    <View className="flex-row items-center">
      <Image
        source={require('@/assets/images/logo-v.png')}
        accessibilityLabel="Vigor"
        style={{ width: 40, height: 40 }}
      />
    </View>
  )
}
