import { supabase } from '@/services/supabase.js'
import { useAuthStore } from '@/stores/auth'

export function useGatedRpc() {
  const auth = useAuthStore()

  const gatedRpc = async (fn, params, meta = {}) => {
    if (auth.role === 'viewer') throw new Error('You have read-only access')

    if (auth.role === 'staff') {
      const { error } = await supabase.rpc('submit_approval_request', {
        p_fn: fn, p_args: params,
        p_entity: meta.entity ?? null, p_entity_id: meta.entityId ?? null,
        p_action: meta.action ?? null, p_summary: meta.summary ?? fn
      })
      if (error) throw error
      return { pending: true }
    }

    const { data, error } = await supabase.rpc(fn, params)
    if (error) throw error
    return { data, pending: false }
  }

  return { gatedRpc }
}