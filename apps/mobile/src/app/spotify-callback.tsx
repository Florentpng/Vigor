import { Redirect } from 'expo-router'

// Adresse de retour de la connexion Spotify : l'app termine l'échange puis revient à l'accueil.
export default function SpotifyCallback() {
  return <Redirect href="/" />
}
