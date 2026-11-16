import { Image } from 'expo-image'
import { Text, View } from 'react-native'

// Logo + « Vigor », comme l'en-tête du web
export default function HeaderLogo() {
  return (
    <View className="flex-row items-center gap-2">
      <Image source={require('@/assets/images/logo-mark.png')} style={{ width: 34, height: 32 }} />
      <Text className="text-xl font-bold tracking-wide text-gray-900 dark:text-white">Vigor</Text>
    </View>
  )
}
