import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import {
  COLLECTIONS,
  listByOwner,
  createDoc,
  updateDocById,
  deleteDocById,
} from '@/lib/firebase/firestore'
import type { Appointment } from '@/types'

export function useAppointments() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['appointments', user?.uid],
    enabled: !!user,
    // Ordena no cliente (evita índice composto no Firestore).
    queryFn: async () => {
      const items = await listByOwner<Appointment>(COLLECTIONS.appointments, user!.uid)
      return items.sort((a, b) => (a.data?.toMillis() ?? Infinity) - (b.data?.toMillis() ?? Infinity))
    },
  })
}

export function useCreateAppointment() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Appointment>) => createDoc(COLLECTIONS.appointments, user!.uid, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments', user?.uid] }),
  })
}

export function useUpdateAppointment() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Appointment> }) =>
      updateDocById(COLLECTIONS.appointments, id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments', user?.uid] }),
  })
}

export function useDeleteAppointment() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteDocById(COLLECTIONS.appointments, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments', user?.uid] }),
  })
}
