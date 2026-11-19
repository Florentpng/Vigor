import 'expo-sqlite/localStorage/install'

import * as AuthSession from 'expo-auth-session'
import * as WebBrowser from 'expo-web-browser'
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { AppState, Linking } from 'react-native'

// Ferme la fenêtre de connexion quand Spotify renvoie vers l'app
WebBrowser.maybeCompleteAuthSession()

// Identifiant de l'application créée sur developer.spotify.com (public, sans secret). Absent : bandeau désactivé.
export const SPOTIFY_CLIENT_ID = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID

const SCOPES = ['user-read-playback-state', 'user-modify-playback-state']
const API = 'https://api.spotify.com/v1'

const discovery = {
  authorizationEndpoint: 'https://accounts.spotify.com/authorize',
  tokenEndpoint: 'https://accounts.spotify.com/api/token',
}

// À enregistrer tel quel dans le tableau de bord Spotify (« Redirect URIs »).
// Expo Go : exp://adresse-du-pc:8081/--/spotify-callback ; app installée : vigor://spotify-callback
export const SPOTIFY_REDIRECT_URI = AuthSession.makeRedirectUri({ scheme: 'vigor', path: 'spotify-callback' })

// Ouvre l'app Spotify (ou le site si elle n'est pas installée)
// Ne lève jamais d'erreur : si rien ne peut s'ouvrir, on ne fait simplement rien.
export async function openSpotify(): Promise<void> {
  try {
    await Linking.openURL('spotify://')
  } catch {
    try {
      await Linking.openURL('https://open.spotify.com')
    } catch {
      // aucun navigateur ni app Spotify disponible
    }
  }
}

// --- Jetons, gardés sur le téléphone (comme la séance en cours) ---

type Tokens = { accessToken: string; refreshToken: string; expiresAt: number }

const TOKENS_KEY = 'vigor-spotify'
let cache: string | null | undefined
const listeners = new Set<() => void>()

function getSnapshot(): string | null {
  if (cache === undefined) {
    try {
      cache = localStorage.getItem(TOKENS_KEY)
    } catch {
      cache = null
    }
  }
  return cache
}

function subscribe(callback: () => void) {
  listeners.add(callback)
  return () => {
    listeners.delete(callback)
  }
}

function writeTokens(tokens: Tokens | null) {
  cache = tokens ? JSON.stringify(tokens) : null
  try {
    if (cache) localStorage.setItem(TOKENS_KEY, cache)
    else localStorage.removeItem(TOKENS_KEY)
  } catch {
    // stockage indisponible : les jetons restent en mémoire
  }
  listeners.forEach((listener) => listener())
}

function readTokens(): Tokens | null {
  const raw = getSnapshot()
  if (!raw) return null
  try {
    const value = JSON.parse(raw)
    if (typeof value?.accessToken === 'string' && typeof value?.refreshToken === 'string') return value as Tokens
  } catch {
    // jetons illisibles : on repart d'une connexion
  }
  return null
}

export function useSpotifyConnected(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot) !== null
}

export function disconnectSpotify() {
  writeTokens(null)
}

function saveResponse(response: AuthSession.TokenResponse, previousRefresh?: string) {
  writeTokens({
    accessToken: response.accessToken,
    // Spotify ne renvoie pas toujours un nouveau jeton de renouvellement : on garde l'ancien
    refreshToken: response.refreshToken ?? previousRefresh ?? '',
    expiresAt: Date.now() + (response.expiresIn ?? 3600) * 1000,
  })
}

// Jeton d'accès valide (renouvelé si besoin), ou null si on n'est pas connecté
async function getAccessToken(force = false): Promise<string | null> {
  const tokens = readTokens()
  if (!tokens || !SPOTIFY_CLIENT_ID) return null
  if (!force && tokens.expiresAt - Date.now() > 60_000) return tokens.accessToken
  try {
    const refreshed = await AuthSession.refreshAsync(
      { clientId: SPOTIFY_CLIENT_ID, refreshToken: tokens.refreshToken },
      discovery
    )
    saveResponse(refreshed, tokens.refreshToken)
    return refreshed.accessToken
  } catch {
    // Accès retiré ou jeton périmé : il faudra se reconnecter
    writeTokens(null)
    return null
  }
}

// --- Connexion : on est renvoyé vers Spotify pour autoriser, puis de retour dans l'app ---

export function useSpotifyLogin() {
  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: SPOTIFY_CLIENT_ID ?? 'missing',
      scopes: SCOPES,
      redirectUri: SPOTIFY_REDIRECT_URI,
      usePKCE: true,
    },
    discovery
  )
  const [exchangeError, setError] = useState<string | null>(null)
  // Refus ou échec côté Spotify : le message vient directement de la réponse
  const responseError =
    response?.type === 'error'
      ? (response.params?.error_description ?? response.error?.message ?? 'Connexion à Spotify impossible.')
      : null

  useEffect(() => {
    if (response?.type !== 'success' || !request || !SPOTIFY_CLIENT_ID) return

    AuthSession.exchangeCodeAsync(
      {
        clientId: SPOTIFY_CLIENT_ID,
        code: response.params.code,
        redirectUri: SPOTIFY_REDIRECT_URI,
        extraParams: { code_verifier: request.codeVerifier ?? '' },
      },
      discovery
    )
      .then((tokens) => {
        saveResponse(tokens)
        setError(null)
      })
      .catch(() => setError('Connexion à Spotify impossible.'))
  }, [response, request])

  const connect = useCallback(() => {
    setError(null)
    promptAsync().catch(() => setError('Connexion à Spotify impossible.'))
  }, [promptAsync])

  return { connect, ready: Boolean(request), error: exchangeError ?? responseError }
}

// --- Lecture en cours ---

export type NowPlaying = {
  title: string
  artist: string
  cover: string | null
  isPlaying: boolean
  deviceId: string | null // appareil Spotify qui joue : sert à relancer la lecture après une longue pause
}

type PlayerState = { kind: 'idle' } | { kind: 'playing'; track: NowPlaying }

async function call(path: string, init?: RequestInit): Promise<Response | null> {
  let token = await getAccessToken()
  if (!token) return null
  let res = await fetch(`${API}${path}`, { ...init, headers: { ...init?.headers, Authorization: `Bearer ${token}` } })
  if (res.status === 401) {
    token = await getAccessToken(true)
    if (!token) return null
    res = await fetch(`${API}${path}`, { ...init, headers: { ...init?.headers, Authorization: `Bearer ${token}` } })
  }
  return res
}

// Raison d'un refus renvoyée par Spotify (NO_ACTIVE_DEVICE, PREMIUM_REQUIRED…), ou null
async function failureReason(res: Response): Promise<string | null> {
  try {
    const body = await res.clone().json()
    return typeof body?.error?.reason === 'string' ? body.error.reason : null
  } catch {
    return null
  }
}

// Spotify limite le nombre de requêtes : s'il dit d'attendre (429), on suspend la vérification
let slowDownUntil = 0

async function fetchPlayer(): Promise<PlayerState | null> {
  if (Date.now() < slowDownUntil) return null
  const res = await call('/me/player')
  if (!res) return null
  if (res.status === 429) {
    const wait = Number(res.headers.get('retry-after'))
    slowDownUntil = Date.now() + (Number.isFinite(wait) && wait > 0 ? wait : 5) * 1000
    return null
  }
  // 204 : aucun appareil actif, rien en lecture
  if (res.status === 204) return { kind: 'idle' }
  if (res.status === 429) return null // trop de requêtes : on garde l'état précédent
  if (!res.ok) return { kind: 'idle' }
  const data = await res.json()
  const item = data?.item
  if (!item || item.type === 'ad') return { kind: 'idle' }
  return {
    kind: 'playing',
    track: {
      title: String(item.name ?? ''),
      artist: Array.isArray(item.artists) ? item.artists.map((a: { name: string }) => a.name).join(', ') : '',
      cover: item.album?.images?.[item.album.images.length - 1]?.url ?? item.album?.images?.[0]?.url ?? null,
      isPlaying: Boolean(data.is_playing),
      deviceId: typeof data.device?.id === 'string' ? data.device.id : null,
    },
  }
}

const POLL_MS = 2000
// Sans lecture depuis ce temps, le bandeau se cache : l'API ne dit pas si l'app Spotify a été fermée
const PAUSE_HIDE_MS = 3 * 60_000

// Morceau en cours, mis à jour toutes les 2 s quand l'app est au premier plan.
// `send` : précédent / pause-lecture / suivant, avec le message d'erreur à afficher le cas échéant.
export function useNowPlaying(enabled: boolean) {
  const [state, setState] = useState<PlayerState>({ kind: 'idle' })
  const busy = useRef(false)
  // Pendant un changement de morceau, Spotify répond un court instant « rien en lecture » ;
  // après une longue pause, il oublie même l'appareil. On compte les réponses vides de suite.
  const misses = useRef(0)
  // Dernier morceau vu : le bandeau le garde (en pause) au lieu de disparaître
  const last = useRef<NowPlaying | null>(null)
  // Dernière fois qu'on a vu de la musique jouer (ou qu'on a utilisé un bouton)
  const lastActiveAt = useRef(0) // renseignée à la connexion

  const hide = useCallback(() => {
    last.current = null
    misses.current = 0
    setState({ kind: 'idle' })
  }, [])

  const refresh = useCallback(async () => {
    if (busy.current) return
    busy.current = true
    try {
      const next = await fetchPlayer()
      if (!next) return
      const idleTooLong = Date.now() - lastActiveAt.current > PAUSE_HIDE_MS
      if (next.kind === 'playing') {
        if (next.track.isPlaying) lastActiveAt.current = Date.now()
        // En pause depuis longtemps : on ne sait pas si Spotify est fermé, on cache le bandeau
        if (!next.track.isPlaying && idleTooLong) {
          hide()
          return
        }
        misses.current = 0
        last.current = next.track
        setState(next)
      } else {
        misses.current += 1
        const track = last.current
        if (!track) return
        if (track.isPlaying) {
          // Ça jouait puis plus rien (3 réponses vides de suite) : Spotify a été fermé ou arrêté
          if (misses.current >= 3) hide()
        } else if (idleTooLong) {
          hide()
        } else {
          // Pause : Spotify oublie le lecteur au bout de quelques secondes, mais l'app peut être ouverte.
          // On garde le bandeau (en pause) pendant un moment.
          setState({ kind: 'playing', track })
        }
      }
    } catch {
      // réseau coupé : on garde l'état précédent
    } finally {
      busy.current = false
    }
  }, [hide])

  useEffect(() => {
    if (!enabled) {
      // Déconnecté : on oublie le dernier morceau
      last.current = null
      misses.current = 0
      return
    }
    lastActiveAt.current = Date.now()
    let timer: ReturnType<typeof setInterval> | null = null
    const start = () => {
      refresh()
      timer = setInterval(refresh, POLL_MS)
    }
    const stop = () => {
      if (timer) clearInterval(timer)
      timer = null
    }
    start()
    const sub = AppState.addEventListener('change', (appState) => {
      stop()
      if (appState === 'active') {
        start()
      }
    })
    return () => {
      stop()
      sub.remove()
    }
  }, [enabled, refresh])

  const send = useCallback(
    async (action: 'previous' | 'toggle' | 'next'): Promise<string | null> => {
      const current = state.kind === 'playing' ? state.track : null
      lastActiveAt.current = Date.now()
      // On vise l'appareil du dernier morceau : Spotify peut ne plus en avoir d'actif après une pause
      const device = current?.deviceId ? `?device_id=${encodeURIComponent(current.deviceId)}` : ''

      const wait = () => new Promise((resolve) => setTimeout(resolve, 600))
      // La lecture marche même quand Spotify a oublié le lecteur (appareil visé) : on s'en sert pour le réveiller
      const resume = () => call(`/me/player/play${device}`, { method: 'PUT' })
      const command = () => {
        if (action === 'previous') return call(`/me/player/previous${device}`, { method: 'POST' })
        if (action === 'next') return call(`/me/player/next${device}`, { method: 'POST' })
        if (current?.isPlaying) return call(`/me/player/pause${device}`, { method: 'PUT' })
        return resume()
      }

      let res: Response | null
      if (action !== 'toggle' && current && !current.isPlaying) {
        // Précédent / suivant en pause : on relance d'abord la lecture, puis on change de morceau
        res = await resume()
        if (res?.ok) {
          // Spotify met un instant à être prêt après le réveil : on réessaie quelques fois
          for (const delay of [600, 900, 1200]) {
            await new Promise((resolve) => setTimeout(resolve, delay))
            res = await command()
            if (res?.ok) break
          }
          // La lecture est relancée même si le changement de morceau a échoué : pas besoin d'ouvrir Spotify
          if (res && !res.ok) return null
        }
      } else {
        res = await command()
        // Appareil oublié par Spotify : on le réveille par la lecture, puis on réessaie une fois
        if (res && !res.ok && current?.deviceId) {
          const reason = await failureReason(res)
          if (res.status === 404 || reason === 'NO_ACTIVE_DEVICE') {
            const woke = await resume()
            if (woke?.ok) {
              await wait()
              if (action !== 'toggle') res = (await command()) ?? res
              else res = woke
            }
          }
        }
      }
      if (!res) return 'Spotify est déconnecté.'

      if (!res.ok) {
        const reason = await failureReason(res)
        if (reason === 'PREMIUM_REQUIRED') return 'Cette commande demande un compte Spotify Premium.'
        // Seul le Premium est un vrai refus. Tout autre échec (appareil inactif, « suivant » refusé quand
        // Spotify est fermé, serveur Spotify indisponible…) : on ouvre Spotify, sans message d'erreur.
        openSpotify()
        return null
      }

      // Mise à jour immédiate de l'icône, puis relecture réelle un instant plus tard
      if (current) {
        // Après un changement de morceau, la musique joue ; après un toggle, l'état s'inverse
        const toggled = { ...current, isPlaying: action === 'toggle' ? !current.isPlaying : true }
        last.current = toggled
        misses.current = 0
        setState({ kind: 'playing', track: toggled })
      }
      setTimeout(refresh, 700)
      return null
    },
    [state, refresh]
  )

  // Déconnecté : rien à afficher, même si un ancien état est encore en mémoire
  return useMemo(
    () => ({ state: enabled ? state : ({ kind: 'idle' } as PlayerState), send }),
    [enabled, state, send]
  )
}
