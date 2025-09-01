<template>
  <div class="flex flex-col items-center justify-center min-h-screen bg-white text-center px-4">
    <div ref="confettiContainer" class="absolute inset-0 z-0"></div>

    <!-- Check Icon -->
    <i class="fas fa-check-circle text-green-500 text-6xl mb-4"></i>

    <h2 class="text-xl font-semibold text-gray-800">Invitation Accepted</h2>

    <div
      class="mt-4 bg-orange-50 border border-orange-200 text-sm text-gray-700 px-6 py-4 rounded max-w-md"
    >
      <div class="flex items-start">
        <i class="fas fa-info-circle text-blue-500 mr-2 mt-1"></i>
        <p>You have successfully accepted to join Jupita</p>
      </div>
    </div>

    <v-btn class="mt-6" variant="plain" color="primary" @click="goToLogin">
      Click here to login
    </v-btn>
  </div>
</template>

<script setup>
import axios from 'axios'
import { ref, onMounted, computed } from 'vue'
import confetti from 'canvas-confetti'
import { useRouter, useRoute } from 'vue-router'
const route = useRoute()
const token = route.query.token
const email = route.query.email
const tenantId = route.query.tenant_id

console.log('Token:', token)
console.log('Email:', email)
console.log('Tenant ID:', tenantId)
import { useAuthStore } from '@/stores/auth'
import { ElNotification, ElLoading } from 'element-plus'

const authStore = useAuthStore()

const confettiContainer = ref(null)
const router = useRouter()

onMounted(() => {
  // Fire confetti once on page load
  confetti({
    particleCount: 150,
    spread: 70,
    origin: { y: 0.6 }
  })
})

const acceptInvite = async () => {

  const payload = {
    token: token,
    email: email
  }

  console.log('Payload:', payload)

  const API_URL = `https://staging.getjupita.com/api/${tenantId}/accept-invite`

  try {
    const response = await axios.post(
      API_URL,
      payload,

      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )
   
    ElNotification({
      title: 'Success',
      message: response.data.message || 'Invite accepted successfully!',
      type: 'success',
      duration: 4000
    })
    router.push('/')
  } catch (error) {
    console.log('Error Response Data:', error)
    console.log('Error Response Status:', error.status)
    ElNotification({
      title: 'Error',
      message: error.response?.data?.message || 'Failed to accept invite.',
      type: 'error'
    })
  }
}

const goToLogin = () => {
  router.push('/')
}

onMounted(() => {
  acceptInvite()
})
</script>

<style scoped>
.v-btn {
  text-transform: none;
}
</style>
