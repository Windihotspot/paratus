<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
const authStore = useAuthStore()
import { supabase } from '@/services/supabase.js'
import { useRouter } from 'vue-router'
const router = useRouter()
const merchantData = ref(null) // <-- this will hold the merchant details
// User auth data ref
const userData = ref(null)
const loginForm = ref({
  email: '',
  password: '',
  remember: false,
  errors: {
    email: '',
    password: ''
  },
  processing: false
})
const showPassword = ref(false)

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}
// Handle Login Submission
const submitForm = async () => {
  loginForm.value.processing = true
  loginForm.value.errors = {}

  try {
    // 1. Authenticate user
    const { data: userResponse, error } = await supabase.auth.signInWithPassword({
      email: loginForm.value.email,
      password: loginForm.value.password
    })

    if (error) {
      if (error.message.toLowerCase().includes('email')) {
        loginForm.value.errors.email = error.message
      } else if (error.message.toLowerCase().includes('password')) {
        loginForm.value.errors.password = error.message
      } else {
        loginForm.value.errors.email = 'Invalid login credentials'
      }
      return
    }

    userData.value = userResponse.user

    // 2. Fetch merchant details
    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select('*')
      .eq('user_id', userData.value.id)
      .single()

    if (merchantError) {
      console.log('Merchant fetch error:', merchantError)
      loginForm.value.errors.email = 'Failed to fetch merchant details'
      return
    }

    merchantData.value = merchant

    // 3. Fetch merchant facilities via RPC
    const { data: facilities, error: facilitiesError } = await supabase.rpc(
      'get_merchant_facilities',
      { p_merchant_id: merchant.id }
    )

    if (facilitiesError) {
      console.error('Facilities fetch error:', facilitiesError)
    }

    // 4. Save everything into Pinia + localStorage
    authStore.setAuth(userData.value, merchant)
    authStore.setFacilities(facilities || [])

    // 5. Redirect to dashboard
    router.push('/dashboard')
  } catch (err) {
    console.error('Login error:', err)
    loginForm.value.errors.email = 'Something went wrong. Try again.'
  } finally {
    loginForm.value.processing = false
  }
}
</script>

<template>
  <!-- Login Form Section -->
  <div class="w-full min-h-screen flex items-center justify-center bg-white">
    <div class="max-w-md w-full px-4 sm:px-6 lg:px-8 py-8">
      <!-- Heading -->

      <p class="text-gray-600 mt-2 text-center">Login to access your account</p>

      <!-- Login Form -->
      <form @submit.prevent="submitForm" class="mt-6 space-y-4">
        <!-- Email Error -->
        <p v-if="loginForm.errors.email" class="text-red-500 text-sm">
          {{ loginForm.errors.email }}
        </p>

        <!-- Email Input -->
        <v-text-field
          type="email"
          label="Email address"
          v-model="loginForm.email"
          variant="outlined"
          color="#27bfa0"
        />

        <!-- Password Error -->
        <p v-if="loginForm.errors.password" class="text-red-500 text-sm">
          {{ loginForm.errors.password }}
        </p>

        <!-- Password Input -->
        <v-text-field
          :type="showPassword ? 'text' : 'password'"
          v-model="loginForm.password"
          label="Password"
          variant="outlined"
          color="#27bfa0"
        >
          <template #append-inner>
            <i
              :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"
              @click="togglePasswordVisibility"
              class="cursor-pointer text-black"
            ></i>
          </template>
        </v-text-field>

        <!-- Remember me + Reset -->
        <div class="flex items-center justify-between">
          <label class="flex items-center space-x-2">
            <el-checkbox v-model="loginForm.remember" size="large" />
            <span class="text-sm text-gray-700">Remember me</span>
          </label>

          <v-btn
            no-uppercase
            variant="text"
            size="small"
            color="#27bfa0"
            class="normal-case text-none"
          >
            Forgot password?
          </v-btn>
        </div>

        <!-- Submit Button -->
        <v-btn
          type="submit"
          :loading="loginForm.processing"
          class="w-full text-white font-semibold text-sm custom-btn"
          height="40"
        >
          {{ loginForm.processing ? 'Signing in...' : 'Sign in' }}
        </v-btn>
      </form>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
  transform: translateX(0);
}
/* Slide Transition */
.slide-enter-active,
.slide-leave-active {
  transition:
    transform 0.4s ease-in-out,
    opacity 0.4s;
}
.slide-enter-from {
  transform: translateX(100%);
  opacity: 0;
}
.slide-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}
.custom-btn {
  background-color: #27bfa0;
}
.v-btn {
  text-transform: none;
}
</style>
