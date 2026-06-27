import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import {
  COLLECTIONS,
  listByOwner,
  createDoc,
  updateDocById,
  deleteDocById,
  orderBy,
} from '@/lib/firebase/firestore'
import type { Tax } from '@/types'

export function useTaxes() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['taxes', user?.uid],
    enabled: !!user,
    queryFn: () => listByOwner<Tax>(COLLECTIONS.taxes, user!.uid, [orderBy('vencimento', 'asc')]),
  })
}

export function useCreateTax() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Tax>) => createDoc(COLLECTIONS.taxes, user!.uid, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['taxes', user?.uid] }),
  })
}

export function useUpdateTax() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Tax> }) =>
      updateDocById(COLLECTIONS.taxes, id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['taxes', user?.uid] }),
  })
}

export function useDeleteTax() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteDocById(COLLECTIONS.taxes, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['taxes', user?.uid] }),
  })
}
