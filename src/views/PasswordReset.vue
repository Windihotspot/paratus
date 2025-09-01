<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <div class="w-full max-w-md bg-white shadow-lg rounded-2xl p-8">
      <div class="flex flex-col items-center text-center">
        <p class="text-gray-500 text-sm mt-1">Create a new password for your account</p>
      </div>

      <!-- Alert -->
      <transition name="fade">
        <!-- Password Strength Message -->
        <div v-if="password" class="fixed top-4 right-4 p-2 rounded-lg shadow-lg z-50">
          <div class="flex items-center gap-2">
            <div class="flex-shrink-0">
              <svg
                v-if="hasUppercase"
                class="w-4 h-4 text-green-500"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                  stroke="currentColor"
                  stroke-width="2"
                />
                <path
                  d="M8 12L11 15L16 9"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <svg
                v-else
                class="w-4 h-4 text-red-500"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                  stroke="currentColor"
                  stroke-width="2"
                />
                <path
                  d="M15 9L9 15M9 9L15 15"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                />
              </svg>
            </div>
            <span class="text-sm" :class="hasUppercase ? 'text-green-500' : 'text-red-500'">
              Uppercase letters
            </span>
          </div>
          <div class="flex items-center gap-2">
            <div class="flex-shrink-0">
              <svg
                v-if="hasLowercase"
                class="w-4 h-4 text-green-500"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                  stroke="currentColor"
                  stroke-width="2"
                />
                <path
                  d="M8 12L11 15L16 9"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <svg
                v-else
                class="w-4 h-4 text-red-500"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                  stroke="currentColor"
                  stroke-width="2"
                />
                <path
                  d="M15 9L9 15M9 9L15 15"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                />
              </svg>
            </div>
            <span class="text-sm" :class="hasLowercase ? 'text-green-500' : 'text-red-500'">
              Lowercase letters
            </span>
          </div>
          <div class="flex items-center gap-2">
            <div class="flex-shrink-0">
              <svg
                v-if="hasNumber"
                class="w-4 h-4 text-green-500"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                  stroke="currentColor"
                  stroke-width="2"
                />
                <path
                  d="M8 12L11 15L16 9"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <svg
                v-else
                class="w-4 h-4 text-red-500"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                  stroke="currentColor"
                  stroke-width="2"
                />
                <path
                  d="M15 9L9 15M9 9L15 15"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                />
              </svg>
            </div>
            <span class="text-sm" :class="hasNumber ? 'text-green-500' : 'text-red-500'">
              Numbers
            </span>
          </div>
          <div class="flex items-center gap-2">
            <div class="flex-shrink-0">
              <svg
                v-if="hasSpecialChar"
                class="w-4 h-4 text-green-500"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                  stroke="currentColor"
                  stroke-width="2"
                />
                <path
                  d="M8 12L11 15L16 9"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <svg
                v-else
                class="w-4 h-4 text-red-500"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                  stroke="currentColor"
                  stroke-width="2"
                />
                <path
                  d="M15 9L9 15M9 9L15 15"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                />
              </svg>
            </div>
            <span class="text-sm" :class="hasSpecialChar ? 'text-green-500' : 'text-red-500'">
              Special characters
            </span>
          </div>
        </div>
      </transition>

      <form @submit.prevent="onSubmit" class="mt-6">
        <div class="mb-4">
          <v-text-field
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            label="Enter new password"
            placeholder="Enter new password"
            variant="outlined"
            color="blue"
            class="mt-4"
            :error-messages="passwordError"
          >
            <template #append-inner>
              <i
                :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"
                @click="togglePasswordVisibility"
                class="cursor-pointer text-black"
              ></i>
            </template>
          </v-text-field>

          <v-text-field
            v-model="confirmPassword"
            :type="showPassword ? 'text' : 'password'"
            label="Confirm new password"
            placeholder="Confirm new password"
            variant="outlined"
            color="blue"
            class="mt-4"
            :error-messages="confirmPasswordError"
          >
            <template #append-inner>
              <i
                :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"
                @click="togglePasswordVisibility"
                class="cursor-pointer text-black"
              ></i>
            </template>
          </v-text-field>
        </div>

        <v-btn
          type="submit"
          class="w-full custom-btn hover:bg-blue-700 text-white font-medium py-2.5 rounded-md transition"
        >
          Reset Password
        </v-btn>
      </form>

      <div class="text-center mt-6">
        <RouterLink to="/">
          <v-btn
            no-uppercase
            variant="text"
            size="small"
            color="#1f5aa3"
            class="normal-case mb-1 text-none"
          >
            Back to Login
          </v-btn>
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import axios from 'axios'
import { useRouter, useRoute } from 'vue-router'
const router = useRouter()
import { ElNotification } from 'element-plus'

const route = useRoute()
const token = route.query.token
console.log('Reset token from URL:', token)
const password = ref('')
const confirmPassword = ref('')
const passwordError = ref('')
const confirmPasswordError = ref('')
const showPassword = ref(false)

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

// Validation checks
const hasUppercase = computed(() => /[A-Z]/.test(password.value))
const hasLowercase = computed(() => /[a-z]/.test(password.value))
const hasNumber = computed(() => /\d/.test(password.value))
const hasSpecialChar = computed(() => /[!@#$%^&*(),.?":{}|<>]/.test(password.value))

const isPasswordValid = computed(
  () =>
    hasUppercase.value &&
    hasLowercase.value &&
    hasNumber.value &&
    hasSpecialChar.value &&
    password.value.length >= 8
)

const validateForm = () => {
  let valid = true
  passwordError.value = ''
  confirmPasswordError.value = ''

  if (!password.value) {
    passwordError.value = 'Password is required'
    valid = false
  } else if (!isPasswordValid.value) {
    passwordError.value =
      'Password must include uppercase, lowercase, number, special character, and be at least 8 characters long'
    valid = false
  }

  if (confirmPassword.value !== password.value) {
    confirmPasswordError.value = 'Passwords do not match'
    valid = false
  }

  return valid
}

const onSubmit = async () => {
   console.log('Submitting form...');
    console.log('Password:', password);
    console.log('Confirm Password:', confirmPassword);
    console.log('Token from route:', token);
       const payload = {
      token: token,
      password: password.value,
      password_confirmation: confirmPassword.value,
    }

    console.log('Payload:', payload);

  const API_URL = `https://staging.getjupita.com/api/reset-password`
  if (!validateForm()) {
    return
  }

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
    ;(password.value = ''), (confirmPassword.value = '')
    ElNotification({
      title: 'Success',
      message: response.data.message || 'Password reset successfully!',
      type: 'success',
      duration: 4000
    })
    router.push('/')
  } catch (error) {
    console.error('Error Response Data:', error.data);
      console.error('Error Response Status:', error.status);
    ElNotification({
      title: 'Error',
      message: error.response?.data?.message || 'Failed to reset password.',
      type: 'error'
    })
  }
}
</script>

<style scoped>
.custom-btn {
  background-color: #1f5aa3;
  text-transform: none;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
