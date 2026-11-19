import Ionicons from '@expo/vector-icons/Ionicons'
import { useState } from 'react'
import { Modal, Pressable, Switch, Text, useColorScheme, View } from 'react-native'

import { Button } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { ACCENT_DARK, setThemePreference } from '@/lib/theme'

// Engrenage à droite de l'en-tête : ouvre les paramètres (mode sombre, déconnexion)
export default function SettingsButton() {
  const [open, setOpen] = useState(false)
  const dark = useColorScheme() === 'dark'

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Paramètres"
        hitSlop={8}
        className="active:opacity-60"
      >
        <Ionicons name="settings-outline" size={24} color={dark ? '#e2e8f0' : '#334155'} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 items-center justify-center bg-black/60 p-6" onPress={() => setOpen(false)}>
          {/* Un appui sur la carte ne ferme pas la fenêtre */}
          <Pressable className="w-full max-w-sm gap-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900" onPress={() => {}}>
            <Text className="font-display-xb text-3xl uppercase leading-none text-gray-900 dark:text-white">Paramètres</Text>

            <View className="flex-row items-center justify-between">
              <Text className="text-base font-medium text-gray-900 dark:text-white">Mode sombre</Text>
              <Switch
                value={dark}
                onValueChange={(value) => setThemePreference(value ? 'dark' : 'light')}
                accessibilityLabel="Mode sombre"
                trackColor={{ false: '#cbd5e1', true: ACCENT_DARK }}
                thumbColor="#ffffff"
              />
            </View>

            <Button
              label="Se déconnecter"
              variant="danger"
              onPress={() => {
                setOpen(false)
                supabase.auth.signOut()
              }}
            />
            <Button label="Fermer" variant="secondary" onPress={() => setOpen(false)} />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  )
}
