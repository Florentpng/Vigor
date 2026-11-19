import '../../global.css'

import {
  BarlowCondensed_600SemiBold,
  BarlowCondensed_700Bold,
  BarlowCondensed_800ExtraBold,
} from '@expo-google-fonts/barlow-condensed'
import { useFonts } from 'expo-font'
import { SplashScreen, Stack, ThemeProvider } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { useColorScheme, View } from 'react-native'

import AppBackground from '@/components/app-background'
import { SessionProvider, useSession } from '@/lib/auth'
import { applyStoredTheme, darkNavTheme, darkVars, lightNavTheme, lightVars } from '@/lib/theme'

// Le splash reste affiché tant qu'on ne sait pas si l'utilisateur est connecté.
SplashScreen.preventAutoHideAsync()
applyStoredTheme()

export default function RootLayout() {
  // Clair par défaut ; l'interrupteur de l'en-tête change le thème (appliqué via NativeWind)
  const dark = useColorScheme() === 'dark'
  return (
    <ThemeProvider value={dark ? darkNavTheme : lightNavTheme}>
      {/* Les variables donnent l'accent bronze (clair) ou orange (sombre) aux classes « blue-… » */}
      <View style={[{ flex: 1 }, dark ? darkVars : lightVars]}>
        <AppBackground />
        <SessionProvider>
          <RootNavigator />
        </SessionProvider>
      </View>
      <StatusBar style={dark ? 'light' : 'dark'} />
    </ThemeProvider>
  )
}

function RootNavigator() {
  const { session, isLoading } = useSession()
  // Police des titres ; en cas d'erreur de chargement, on continue avec la police du système
  const [fontsLoaded, fontsError] = useFonts({
    BarlowCondensed_600SemiBold,
    BarlowCondensed_700Bold,
    BarlowCondensed_800ExtraBold,
  })
  const ready = !isLoading && (fontsLoaded || fontsError)

  useEffect(() => {
    if (ready) SplashScreen.hide()
  }, [ready])

  if (!ready) return null

  // Connecté : seul (app) est accessible ; sinon login et signup. Un écran inaccessible
  // renvoie vers le premier écran accessible de la liste (login quand on est déconnecté).
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="login" options={{ animation: 'fade' }} />
        <Stack.Screen name="signup" options={{ animation: 'fade' }} />
      </Stack.Protected>
    </Stack>
  )
}
