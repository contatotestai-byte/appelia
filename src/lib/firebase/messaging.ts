import { getMessaging, getToken, onMessage, isSupported, type Messaging } from 'firebase/messaging'
import { app } from './config'

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY

const fcmSwConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

/** Registra o SW do FCM passando a config por query string. */
async function registerFcmSw(): Promise<ServiceWorkerRegistration | undefined> {
  if (!('serviceWorker' in navigator)) return undefined
  const qs = new URLSearchParams(fcmSwConfig as Record<string, string>).toString()
  return navigator.serviceWorker.register(`/firebase-messaging-sw.js?${qs}`)
}

let messagingPromise: Promise<Messaging | null> | null = null

async function getMessagingInstance(): Promise<Messaging | null> {
  if (!app) return null
  if (!messagingPromise) {
    messagingPromise = isSupported().then((ok) => (ok ? getMessaging(app) : null))
  }
  return messagingPromise
}

/**
 * Solicita permissão de notificação e retorna o token FCM do dispositivo.
 * O token deve ser salvo no perfil do usuário para envio de push pelas Functions.
 */
export async function requestPushToken(): Promise<string | null> {
  try {
    const messaging = await getMessagingInstance()
    if (!messaging || !VAPID_KEY) return null

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return null

    const registration = (await registerFcmSw()) ?? (await navigator.serviceWorker.ready)
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    })
    return token || null
  } catch (err) {
    console.warn('[ELIÁ] Falha ao obter token de push:', err)
    return null
  }
}

/** Escuta mensagens recebidas com o app em foreground. */
export async function onForegroundMessage(cb: (title: string, body: string) => void) {
  const messaging = await getMessagingInstance()
  if (!messaging) return () => {}
  return onMessage(messaging, (payload) => {
    cb(payload.notification?.title ?? 'ELIÁ', payload.notification?.body ?? '')
  })
}
