import '../../global.css'

import { DarkTheme, DefaultTheme, SplashScreen, Stack, ThemeProvider } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { useColorScheme } from 'react-native'

import { SessionProvider, useSession } from '@/lib/auth'

// Le splash reste affiché tant qu'on ne sait pas si l'utilisateur est connecté.
SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const colorScheme = useColorScheme()
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <SessionProvider>
        <RootNavigator />
      </SessionProvider>
      <StatusBar style="auto" />
    </ThemeProvider>
  )
}

function RootNavigator() {
  const { session, isLoading } = useSession()

  useEffect(() => {
    if (!isLoading) SplashScreen.hide()
  }, [isLoading])

  if (isLoading) return null

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
