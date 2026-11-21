import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'

// Notification de fin de repos : programmée au début du repos, c'est le système qui la déclenche à l'heure,
// même téléphone verrouillé ou app en arrière-plan.

const CHANNEL_ID = 'rest'

// App ouverte : l'écran de repos et la vibration suffisent, on n'affiche pas la notification en plus
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: false,
    shouldShowList: false,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
})

// À appeler au démarrage d'une séance : crée le canal Android et demande l'autorisation (une seule fois)
export async function prepareRestNotifications(): Promise<void> {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: 'Fin de repos',
        // eslint-disable-next-line import/namespace -- l'énumération est bien exportée (vérifié par tsc)
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 120, 250],
        sound: 'default',
      })
    }
    const current = await Notifications.getPermissionsAsync()
    if (!current.granted && current.canAskAgain) await Notifications.requestPermissionsAsync()
  } catch {
    // notifications indisponibles : la vibration dans l'app reste le seul signal
  }
}

// Programme « Repos terminé » dans `seconds` secondes ; remplace une éventuelle notification précédente
export async function scheduleRestEnd(seconds: number, body: string): Promise<void> {
  try {
    await cancelRestNotification()
    await Notifications.scheduleNotificationAsync({
      content: { title: 'Repos terminé', body, sound: 'default' },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.max(1, Math.round(seconds)),
        channelId: CHANNEL_ID,
      },
    })
  } catch {
    // autorisation refusée ou notifications indisponibles : sans conséquence
  }
}

// Repos passé, séance abandonnée ou terminée : plus de notification à venir, et on retire celle déjà affichée
export async function cancelRestNotification(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync()
    await Notifications.dismissAllNotificationsAsync()
  } catch {
    // rien à annuler
  }
}
