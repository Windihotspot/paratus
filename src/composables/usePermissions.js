import {computed} from "vue"
import { useAuthStore } from '@/stores/auth'

export function usePermissions() {
  const auth = useAuthStore()
  return {
    canWrite: computed(() => ['staff', 'super_admin'].includes(auth.role)),
    isStaff: computed(() => auth.role === 'staff'),
    isAdmin: computed(() => auth.role === 'super_admin')
  }
}