import Ionicons from '@expo/vector-icons/Ionicons'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { Image } from 'expo-image'
import { Alert, Pressable, Text, View } from 'react-native'

import {
  disconnectSpotify,
  openSpotify,
  SPOTIFY_CLIENT_ID,
  useNowPlaying,
  useSpotifyConnected,
  useSpotifyLogin,
} from '@/lib/spotify'

const SPOTIFY_GREEN = '#1DB954'

// Bandeau de l'en-tête : musique en cours dans Spotify, avec précédent / pause / suivant.
// Sans connexion ou sans lecture : une petite icône (se connecter, ou ouvrir Spotify).
export default function SpotifyBanner() {
  // Pas d'identifiant Spotify configuré : rien n'est affiché
  if (!SPOTIFY_CLIENT_ID) return null
  return <Banner />
}

function Banner() {
  const connected = useSpotifyConnected()
  const { connect, ready, error } = useSpotifyLogin()
  const { state, send } = useNowPlaying(connected)

  function askDisconnect() {
    Alert.alert('Spotify', 'Déconnecter ton compte Spotify de Vigor ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnecter', style: 'destructive', onPress: disconnectSpotify },
    ])
  }

  async function control(action: 'previous' | 'toggle' | 'next') {
    try {
      const message = await send(action)
      if (message) Alert.alert('Spotify', message)
    } catch {
      // réseau coupé ou réponse illisible de Spotify
      Alert.alert('Spotify', 'Impossible de joindre Spotify. Vérifie ta connexion.')
    }
  }

  // Pas connecté : un appui renvoie vers Spotify pour autoriser l'accès
  if (!connected) {
    return (
      <ClosedBanner
        label={error ?? 'Connecter Spotify'}
        error={Boolean(error)}
        disabled={!ready}
        onPress={() => {
          connect()
        }}
      />
    )
  }

  // Connecté, rien en lecture : le bandeau reste ouvert avec une invitation à reprendre.
  // Un appui ouvre l'app Spotify ; appui long pour se déconnecter.
  if (state.kind !== 'playing') {
    return <ClosedBanner label="Continuer la lecture" onPress={openSpotify} onLongPress={askDisconnect} />
  }

  const { track } = state
  return (
    <View className="shrink flex-1 flex-row items-center gap-2 rounded-full border border-gray-200 bg-white/80 py-0.5 pl-0.5 pr-2.5 dark:border-zinc-700 dark:bg-zinc-900/80">
      {/* Pochette et titre : un appui ouvre Spotify, un appui long déconnecte le compte */}
      <Pressable
        onPress={openSpotify}
        onLongPress={askDisconnect}
        accessibilityRole="button"
        accessibilityLabel={`${track.title}, ${track.artist}. Ouvrir Spotify. Appui long pour déconnecter.`}
        className="shrink flex-1 flex-row items-center gap-2 active:opacity-60"
      >
        {track.cover ? (
          <Image source={{ uri: track.cover }} style={{ width: 28, height: 28, borderRadius: 14 }} />
        ) : (
          <MaterialCommunityIcons name="spotify" size={28} color={SPOTIFY_GREEN} />
        )}

        <View className="shrink flex-1">
          <Text numberOfLines={1} className="text-xs font-semibold text-gray-900 dark:text-white">
            {track.title}
          </Text>
          <Text numberOfLines={1} className="text-[11px] text-gray-500 dark:text-zinc-400">
            {track.artist}
          </Text>
        </View>
      </Pressable>

      <Control icon="play-skip-back" label="Morceau précédent" onPress={() => control('previous')} />
      <Control
        icon={track.isPlaying ? 'pause' : 'play'}
        label={track.isPlaying ? 'Pause' : 'Lecture'}
        onPress={() => control('toggle')}
      />
      <Control icon="play-skip-forward" label="Morceau suivant" onPress={() => control('next')} />
    </View>
  )
}

function Control({
  icon,
  label,
  onPress,
}: {
  icon: 'play-skip-back' | 'play-skip-forward' | 'play' | 'pause'
  label: string
  onPress: () => void
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} hitSlop={8} className="active:opacity-50">
      <Ionicons name={icon} size={22} color={SPOTIFY_GREEN} />
    </Pressable>
  )
}

// Bandeau sans morceau : même forme que le bandeau de lecture, avec une invitation à la place du titre
function ClosedBanner({
  label,
  onPress,
  onLongPress,
  disabled = false,
  error = false,
}: {
  label: string
  onPress: () => void
  onLongPress?: () => void
  disabled?: boolean
  error?: boolean
}) {
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="shrink flex-1 flex-row items-center gap-2 rounded-full border border-gray-200 bg-white/80 py-1 pl-2 pr-3 active:opacity-60 dark:border-zinc-700 dark:bg-zinc-900/80"
    >
      <MaterialCommunityIcons name="spotify" size={24} color={SPOTIFY_GREEN} />
      <Text
        numberOfLines={1}
        className={`shrink flex-1 text-center text-sm font-bold ${error ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}
      >
        {label}
      </Text>
      {/* Même largeur que l'icône à gauche, pour que le texte soit centré dans le bandeau */}
      <View style={{ width: 24 }} />
    </Pressable>
  )
}
