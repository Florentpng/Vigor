import { Stack } from 'expo-router'

// Pile de l'onglet Séances : liste, puis détail (et plus tard création / modification).
// Pas d'en-tête propre : on garde celui des onglets (logo), identique partout ;
// le retour se fait par le lien en haut du détail ou par le geste de balayage.
export default function WorkoutsLayout() {
  return <Stack screenOptions={{ headerShown: false }} />
}
