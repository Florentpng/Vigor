import { Image } from 'expo-image'
import { Link, type Href } from 'expo-router'
import { useRef, useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  type TextInputInstance,
  View,
} from 'react-native'

import type { AuthResult } from '@vigor/shared/auth'

import { inputClass } from '@/components/ui'

type Props = {
  title: string
  submitLabel: string
  action: (email: string, password: string) => Promise<AuthResult>
  altText: string
  altLabel: string
  altHref: Href
  isSignup?: boolean
}

export default function AuthForm({ title, submitLabel, action, altText, altLabel, altHref, isSignup }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)
  const [result, setResult] = useState<AuthResult | null>(null)
  const passwordRef = useRef<TextInputInstance>(null)

  async function submit() {
    if (pending) return
    if (!email.trim() || !password) {
      setResult({ error: 'Renseigne ton email et ton mot de passe.' })
      return
    }
    setPending(true)
    setResult(null)
    // En cas de succès, la session change et la navigation bascule toute seule vers l'app.
    const res = await action(email, password)
    setResult(res)
    setPending(false)
  }

  return (
    <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerClassName="flex-grow items-center justify-center gap-6 p-6"
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-row items-center gap-3">
          <Image source={require('@/assets/images/logo-v.png')} style={{ width: 96, height: 96 }} />
          <Text className="text-3xl font-bold tracking-wide text-gray-900 dark:text-white">Vigor</Text>
        </View>

        <View className="w-full max-w-sm rounded-xl border border-gray-200 bg-white/90 p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
          <Text className="mb-6 font-display-xb text-4xl uppercase leading-none text-gray-900 dark:text-white">{title}</Text>

          {result && 'error' in result && (
            <Text className="mb-4 rounded-lg bg-red-100 p-3 text-sm text-red-700">{result.error}</Text>
          )}
          {result && 'message' in result && (
            <Text className="mb-4 rounded-lg bg-green-100 p-3 text-sm text-green-700">{result.message}</Text>
          )}

          <View className="gap-5">
            <View>
              <Text className="mb-1 text-sm font-medium text-gray-700 dark:text-zinc-300">Email</Text>
              <TextInput
                className={inputClass}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="next"
                submitBehavior="submit"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />
            </View>

            <View>
              <Text className="mb-1 text-sm font-medium text-gray-700 dark:text-zinc-300">Mot de passe</Text>
              <TextInput
                ref={passwordRef}
                className={inputClass}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                textContentType={isSignup ? 'newPassword' : 'password'}
                returnKeyType="go"
                onSubmitEditing={submit}
              />
            </View>

            <Pressable
              onPress={submit}
              disabled={pending}
              className="items-center rounded-lg bg-blue-600 px-4 py-3 active:bg-blue-700 disabled:opacity-50"
            >
              {pending ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-base font-medium text-white">{submitLabel}</Text>
              )}
            </Pressable>
          </View>

          <View className="mt-6 flex-row flex-wrap justify-center">
            <Text className="text-sm text-gray-600 dark:text-zinc-400">{altText} </Text>
            <Link href={altHref} replace>
              <Text className="text-sm font-medium text-blue-600">{altLabel}</Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
