import { Stack } from 'expo-router'

// Pile de l'onglet Profil : le profil, puis l'écran des badges.
// Pas d'en-tête propre : on garde celui des onglets (logo), identique partout.
export default function ProfileLayout() {
  return <Stack screenOptions={{ headerShown: false }} />
}
