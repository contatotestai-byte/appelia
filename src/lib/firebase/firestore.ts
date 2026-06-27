import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  type QueryConstraint,
  type DocumentData,
} from 'firebase/firestore'
import { db } from './config'
import type { BaseDoc } from '@/types'

/** Nomes das coleções do Firestore. */
export const COLLECTIONS = {
  users: 'users',
  clients: 'clients',
  expenses: 'expenses',
  invoices: 'invoices',
  taxes: 'taxes',
  deliveries: 'deliveries',
  timeEntries: 'timeEntries',
  contracts: 'contracts',
  appointments: 'appointments',
  posts: 'posts',
  adCampaigns: 'adCampaigns',
  emailCampaigns: 'emailCampaigns',
  notifications: 'notifications',
} as const

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS]

/** Lê todos os documentos de uma coleção pertencentes ao usuário. */
export async function listByOwner<T extends BaseDoc>(
  name: CollectionName,
  ownerId: string,
  extra: QueryConstraint[] = [],
): Promise<T[]> {
  const q = query(collection(db, name), where('ownerId', '==', ownerId), ...extra)
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as DocumentData) })) as T[]
}

/** Cria um documento carimbando ownerId/createdAt/updatedAt. */
export async function createDoc<T extends DocumentData>(
  name: CollectionName,
  ownerId: string,
  data: T,
): Promise<string> {
  const ref = await addDoc(collection(db, name), {
    ...data,
    ownerId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

/** Atualiza um documento e carimba updatedAt. */
export async function updateDocById<T extends DocumentData>(
  name: CollectionName,
  id: string,
  data: Partial<T>,
): Promise<void> {
  await updateDoc(doc(db, name, id), { ...data, updatedAt: serverTimestamp() })
}

/** Remove um documento. */
export async function deleteDocById(name: CollectionName, id: string): Promise<void> {
  await deleteDoc(doc(db, name, id))
}

export { where, orderBy }
