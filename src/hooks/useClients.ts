import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import {
  COLLECTIONS,
  listByOwner,
  createDoc,
  updateDocById,
  deleteDocById,
} from '@/lib/firebase/firestore'
import type { Cliente } from '@/types'

export function useClients() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['clients', user?.uid],
    enabled: !!user,
    queryFn: () => listByOwner<Cliente>(COLLECTIONS.clients, user!.uid),
  })
}

export function useCreateClient() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Cliente>) => createDoc(COLLECTIONS.clients, user!.uid, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients', user?.uid] }),
  })
}

export function useUpdateClient() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Cliente> }) =>
      updateDocById(COLLECTIONS.clients, id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients', user?.uid] }),
  })
}

export function useDeleteClient() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteDocById(COLLECTIONS.clients, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients', user?.uid] }),
  })
}

/** Mapa id->nome para exibição rápida. */
export function useClientMap() {
  const { data } = useClients()
  const map: Record<string, string> = {}
  for (const c of data ?? []) map[c.id] = c.nome
  return map
}
