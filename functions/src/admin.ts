import { initializeApp, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getMessaging } from 'firebase-admin/messaging'
import { HttpsError, type CallableRequest } from 'firebase-functions/v2/https'

if (getApps().length === 0) initializeApp()

export const db = getFirestore()
export const messaging = getMessaging()

/** Garante usuário autenticado e retorna o uid. */
export function requireAuth(req: CallableRequest): string {
  if (!req.auth?.uid) throw new HttpsError('unauthenticated', 'Faça login para usar este recurso.')
  return req.auth.uid
}

export const REGION = 'southamerica-east1'
