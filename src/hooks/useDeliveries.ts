import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import {
  COLLECTIONS,
  listByOwner,
  createDoc,
  updateDocById,
  deleteDocById,
} from '@/lib/firebase/firestore'
import type { Delivery } from '@/types'

export function useDeliveries() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['deliveries', user?.uid],
    enabled: !!user,
    queryFn: () => listByOwner<Delivery>(COLLECTIONS.deliveries, user!.uid),
  })
}

export function useCreateDelivery() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Delivery>) => createDoc(COLLECTIONS.deliveries, user!.uid, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['deliveries', user?.uid] }),
  })
}

export function useUpdateDelivery() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Delivery> }) =>
      updateDocById(COLLECTIONS.deliveries, id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['deliveries', user?.uid] }),
  })
}

export function useDeleteDelivery() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteDocById(COLLECTIONS.deliveries, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['deliveries', user?.uid] }),
  })
}
