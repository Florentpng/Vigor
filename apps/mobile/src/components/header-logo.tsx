import { Image } from 'expo-image'
import { Text, View } from 'react-native'

// Logo V + « VIGOR », comme l'en-tête du web
export default function HeaderLogo() {
  return (
    <View className="flex-row items-center gap-2">
      <Image source={require('@/assets/images/logo-v.png')} style={{ width: 40, height: 40 }} />
      <Text className="font-display-xb text-2xl uppercase tracking-wider text-gray-900 dark:text-white">Vigor</Text>
    </View>
  )
}
