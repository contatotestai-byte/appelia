import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { useAuth } from './useAuth'
import { COLLECTIONS } from '@/lib/firebase/firestore'
import type { UserProfile } from '@/types'

const defaultProfile = (uid: string, nome: string, email: string): Partial<UserProfile> => ({
  nome,
  email,
  regimeTributario: 'simples_nacional',
  conexoes: { whatsapp: false, googleCalendar: false, metaAds: false, googleAds: false },
  preferenciasNotificacao: { push: false, impostos: true, contratos: true, agenda: true },
  ownerId: uid,
})

export function useProfile() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['profile', user?.uid],
    enabled: !!user,
    queryFn: async () => {
      const ref = doc(db, COLLECTIONS.users, user!.uid)
      const snap = await getDoc(ref)
      if (!snap.exists()) {
        const base = defaultProfile(user!.uid, user!.displayName ?? '', user!.email ?? '')
        await setDoc(ref, { ...base, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
        return { id: user!.uid, ...base } as UserProfile
      }
      return { id: snap.id, ...(snap.data() as object) } as UserProfile
    },
  })
}

export function useUpdateProfile() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<UserProfile>) => {
      const ref = doc(db, COLLECTIONS.users, user!.uid)
      await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile', user?.uid] }),
  })
}
