import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { COLLECTIONS, listByOwner, updateDocById, orderBy } from '@/lib/firebase/firestore'
import type { AppNotification } from '@/types'

export function useNotifications() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['notifications', user?.uid],
    enabled: !!user,
    queryFn: () =>
      listByOwner<AppNotification>(COLLECTIONS.notifications, user!.uid, [orderBy('createdAt', 'desc')]),
  })
}

export function useMarkNotificationRead() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => updateDocById(COLLECTIONS.notifications, id, { lida: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications', user?.uid] }),
  })
}
