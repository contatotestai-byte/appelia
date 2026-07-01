import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { COLLECTIONS, listByOwner, updateDocById } from '@/lib/firebase/firestore'
import type { AppNotification } from '@/types'

export function useNotifications() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['notifications', user?.uid],
    enabled: !!user,
    // Ordena no cliente (evita índice composto no Firestore).
    queryFn: async () => {
      const items = await listByOwner<AppNotification>(COLLECTIONS.notifications, user!.uid)
      return items.sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0))
    },
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
