import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions'
import { app } from './config'

const functions = app ? getFunctions(app, 'southamerica-east1') : null

if (functions && import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
  connectFunctionsEmulator(functions, '127.0.0.1', 5001)
}

/**
 * Wrapper tipado para chamar uma Cloud Function callable.
 * Lança erro amigável se o Firebase não estiver configurado.
 */
export async function callFunction<TReq, TRes>(name: string, data: TReq): Promise<TRes> {
  if (!functions) {
    throw new Error('Firebase não configurado — funções de IA indisponíveis.')
  }
  const fn = httpsCallable<TReq, TRes>(functions, name)
  const res = await fn(data)
  return res.data
}
