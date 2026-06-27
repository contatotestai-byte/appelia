import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import {
  COLLECTIONS,
  listByOwner,
  createDoc,
  updateDocById,
  deleteDocById,
} from '@/lib/firebase/firestore'
import type { Invoice } from '@/types'

export function useInvoices() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['invoices', user?.uid],
    enabled: !!user,
    queryFn: () => listByOwner<Invoice>(COLLECTIONS.invoices, user!.uid),
  })
}

export function useCreateInvoice() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Invoice>) => createDoc(COLLECTIONS.invoices, user!.uid, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices', user?.uid] }),
  })
}

export function useUpdateInvoice() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Invoice> }) =>
      updateDocById(COLLECTIONS.invoices, id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices', user?.uid] }),
  })
}

export function useDeleteInvoice() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteDocById(COLLECTIONS.invoices, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices', user?.uid] }),
  })
}
