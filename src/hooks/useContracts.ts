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
import type { Contract } from '@/types'

export function useContracts() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['contracts', user?.uid],
    enabled: !!user,
    queryFn: () => listByOwner<Contract>(COLLECTIONS.contracts, user!.uid),
  })
}

export function useCreateContract() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Contract>) => createDoc(COLLECTIONS.contracts, user!.uid, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contracts', user?.uid] }),
  })
}

export function useUpdateContract() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Contract> }) =>
      updateDocById(COLLECTIONS.contracts, id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contracts', user?.uid] }),
  })
}

export function useDeleteContract() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteDocById(COLLECTIONS.contracts, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contracts', user?.uid] }),
  })
}

export function useUploadContractPdf() {
  const { user } = useAuth()
  return useMutation({
    mutationFn: async (file: File) => {
      const path = `contratos/${user!.uid}/${Date.now()}_${file.name}`
      const snap = await uploadBytes(ref(storage, path), file)
      return getDownloadURL(snap.ref)
    },
  })
}
