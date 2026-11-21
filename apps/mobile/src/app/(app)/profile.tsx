import Ionicons from '@expo/vector-icons/Ionicons'
import { router } from 'expo-router'
import { useState } from 'react'
import { Text, TextInput, View } from 'react-native'

import { getIdentity, updateEmail, updateIdentity } from '@vigor/shared/profile'
import { getBadges } from '@vigor/shared/queries'

import { Button, Card, ErrorBox, inputClass, Label, Loading, Screen, SectionTitle, Title } from '@/components/ui'
import { useSession } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { useAccent } from '@/lib/theme'
import { useFocusQuery } from '@/lib/use-focus-query'

export default function ProfileScreen() {
  const { session } = useSession()
  const userId = session?.user.id ?? ''
  const accent = useAccent()

  const { data, loading, refreshing, refresh, error } = useFocusQuery(async () => {
    const [badges, identity] = await Promise.all([getBadges(supabase, userId), getIdentity(supabase, userId)])
    return { badges, identity }
  })

  if (loading) return <Loading />

  const badges = data?.badges ?? []
  const unlockedCount = badges.filter((b) => b.unlocked_at).length

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <Title subtitle={session?.user.email}>Profil</Title>

      {error ? <ErrorBox>{error}</ErrorBox> : null}

      <View className="gap-3">
        <SectionTitle>Informations</SectionTitle>
        <IdentityCard
          key={`${data?.identity.first_name ?? ''}|${data?.identity.last_name ?? ''}`}
          firstName={data?.identity.first_name ?? ''}
          lastName={data?.identity.last_name ?? ''}
          onSaved={refresh}
        />
      </View>

      <View className="gap-3">
        <SectionTitle>Adresse mail</SectionTitle>
        {/* Compte créé avec Google (ou autre) : l'adresse mail dépend de ce fournisseur */}
        {(session?.user.app_metadata?.provider ?? 'email') !== 'email' ? (
          <Card>
            <Text className="text-sm text-gray-600 dark:text-zinc-400">
              {session?.user.email} · ton compte est connecté via {String(session?.user.app_metadata?.provider)}, l&apos;adresse
              ne peut pas être changée ici.
            </Text>
          </Card>
        ) : (
          <EmailCard currentEmail={session?.user.email ?? ''} />
        )}
      </View>

      {/* Les badges ont leur propre écran */}
      <Card onPress={() => router.navigate('/badges')}>
        <View className="flex-row items-center gap-3">
          <Ionicons name="ribbon-outline" size={26} color={accent} />
          <View className="shrink flex-1">
            <Text className="font-display text-xl text-gray-900 dark:text-white">Badges</Text>
            <Text className="text-xs text-gray-500 dark:text-zinc-400">
              {unlockedCount} / {badges.length} débloqués
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
        </View>
      </Card>
    </Screen>
  )
}

function IdentityCard({ firstName, lastName, onSaved }: { firstName: string; lastName: string; onSaved: () => void }) {
  const [first, setFirst] = useState(firstName)
  const [last, setLast] = useState(lastName)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'ok'; text: string } | null>(null)

  async function save() {
    setMessage(null)
    setPending(true)
    const result = await updateIdentity(supabase, { firstName: first, lastName: last })
    setPending(false)
    if ('error' in result) {
      setMessage({ type: 'error', text: result.error })
      return
    }
    setMessage({ type: 'ok', text: 'Informations enregistrées.' })
    onSaved()
  }

  return (
    <Card>
      <View className="gap-3">
        <View>
          <Label>Prénom</Label>
          <TextInput className={inputClass} value={first} onChangeText={setFirst} maxLength={60} autoComplete="given-name" />
        </View>
        <View>
          <Label>Nom</Label>
          <TextInput className={inputClass} value={last} onChangeText={setLast} maxLength={60} autoComplete="family-name" />
        </View>
        <Text className="text-xs text-gray-500 dark:text-zinc-400">Facultatif.</Text>
        <Button label="Enregistrer" onPress={save} pending={pending} />
        {message ? (
          <Text className={`text-sm ${message.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>{message.text}</Text>
        ) : null}
      </View>
    </Card>
  )
}

function EmailCard({ currentEmail }: { currentEmail: string }) {
  const [email, setEmail] = useState(currentEmail)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'ok'; text: string } | null>(null)

  async function save() {
    setMessage(null)
    setPending(true)
    const result = await updateEmail(supabase, email)
    setPending(false)
    setMessage(
      'error' in result
        ? { type: 'error', text: result.error }
        : { type: 'ok', text: 'Un mail de confirmation a été envoyé. Clique sur le lien qu’il contient pour valider la nouvelle adresse.' }
    )
  }

  return (
    <Card>
      <View className="gap-3">
        <View>
          <Label>Adresse mail</Label>
          <TextInput
            className={inputClass}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
          />
        </View>
        <Button label="Changer l’adresse" onPress={save} pending={pending} disabled={email.trim() === currentEmail} />
        <Text className="text-xs text-gray-500 dark:text-zinc-400">
          L’ancienne adresse reste valable tant que tu n’as pas confirmé la nouvelle par mail.
        </Text>
        {message ? (
          <Text className={`text-sm ${message.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>{message.text}</Text>
        ) : null}
      </View>
    </Card>
  )
}
