import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)        // supabase user object
  const merchant = ref(null)    // merchant details
  const token = ref(null)       // optional JWT or session token

  // Load from localStorage on init
  const init = () => {
    const storedUser = localStorage.getItem('user')
    const storedMerchant = localStorage.getItem('merchant')
    const storedToken = localStorage.getItem('token')

    if (storedUser) user.value = JSON.parse(storedUser)
    if (storedMerchant) merchant.value = JSON.parse(storedMerchant)
    if (storedToken) token.value = storedToken
  }

  const setAuth = (u, m, t = null) => {
    user.value = u
    merchant.value = m
    token.value = t

    localStorage.setItem('user', JSON.stringify(u))
    localStorage.setItem('merchant', JSON.stringify(m))
    if (t) localStorage.setItem('token', t)
  }

  const logout = () => {
    user.value = null
    merchant.value = null
    token.value = null
    localStorage.removeItem('user')
    localStorage.removeItem('merchant')
    localStorage.removeItem('token')
  }

  return { user, merchant, token, setAuth, logout, init }
})
