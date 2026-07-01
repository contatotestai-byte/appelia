import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '@/lib/firebase/config'
import { useAuth } from './useAuth'
import {
  COLLECTIONS,
  listByOwner,
  createDoc,
  updateDocById,
  deleteDocById,
} from '@/lib/firebase/firestore'
import type { Despesa } from '@/types'

export function useExpenses() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['expenses', user?.uid],
    enabled: !!user,
    // Ordena no cliente (evita índice composto no Firestore).
    queryFn: async () => {
      const items = await listByOwner<Despesa>(COLLECTIONS.expenses, user!.uid)
      return items.sort((a, b) => (b.data?.toMillis() ?? 0) - (a.data?.toMillis() ?? 0))
    },
  })
}

export function useCreateExpense() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Despesa>) => createDoc(COLLECTIONS.expenses, user!.uid, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses', user?.uid] }),
  })
}

export function useUpdateExpense() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Despesa> }) =>
      updateDocById(COLLECTIONS.expenses, id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses', user?.uid] }),
  })
}

export function useDeleteExpense() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteDocById(COLLECTIONS.expenses, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses', user?.uid] }),
  })
}

/** Faz upload do comprovante para o Storage e retorna a URL. */
export function useUploadComprovante() {
  const { user } = useAuth()
  return useMutation({
    mutationFn: async (file: File) => {
      const path = `comprovantes/${user!.uid}/${Date.now()}_${file.name}`
      const snap = await uploadBytes(ref(storage, path), file)
      return getDownloadURL(snap.ref)
    },
  })
}
