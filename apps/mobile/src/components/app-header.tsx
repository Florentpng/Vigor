import { useTheme } from 'expo-router'
import { Platform, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import HeaderLogo from '@/components/header-logo'
import SettingsButton from '@/components/settings-button'
import SpotifyBanner from '@/components/spotify-banner'

// Largeur des zones gauche (logo) et droite (engrenage) : identique, pour que le milieu soit centré
const SIDE = 56
// Écart entre ces zones et le bandeau Spotify, le même des deux côtés
const GAP = 14
// Hauteur de la barre de la navigation d'origine : 44 sur iPhone, 56 sur Android
const HEIGHT = Platform.select({ ios: 44, default: 56 })

// En-tête de l'app : logo à gauche, bandeau Spotify au milieu, engrenage à droite
export default function AppHeader() {
  const insets = useSafeAreaInsets()
  const { colors } = useTheme()

  return (
    <View
      style={{
        paddingTop: insets.top,
        backgroundColor: colors.card,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.border,
      }}
    >
      <View style={{ height: HEIGHT, flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: SIDE, paddingLeft: 16 }}>
          <HeaderLogo />
        </View>

        <View style={{ flex: 1, marginHorizontal: GAP, flexDirection: 'row', alignItems: 'center' }}>
          <SpotifyBanner />
        </View>

        <View style={{ width: SIDE, alignItems: 'flex-end', paddingRight: 16 }}>
          <SettingsButton />
        </View>
      </View>
    </View>
  )
}
