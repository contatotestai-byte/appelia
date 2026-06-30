import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import {
  COLLECTIONS,
  listByOwner,
  createDoc,
  updateDocById,
  deleteDocById,
} from '@/lib/firebase/firestore'
import type { TimeEntry } from '@/types'

export function useTimeEntries() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['timeEntries', user?.uid],
    enabled: !!user,
    queryFn: () => listByOwner<TimeEntry>(COLLECTIONS.timeEntries, user!.uid),
  })
}

export function useCreateTimeEntry() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<TimeEntry>) => createDoc(COLLECTIONS.timeEntries, user!.uid, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['timeEntries', user?.uid] }),
  })
}

export function useDeleteTimeEntry() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteDocById(COLLECTIONS.timeEntries, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['timeEntries', user?.uid] }),
  })
}

export { updateDocById }
