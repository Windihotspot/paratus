<script setup>
import { onMounted, ref, computed } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
const authStore = useAuthStore()
const savedAuth = localStorage.getItem('data') ? JSON.parse(localStorage.getItem('data')) : null


const token = savedAuth
  ? savedAuth?.token
  : computed(() => authStore.token)?.value;

const tenantId = savedAuth
  ? savedAuth.user?.business_name
    ? savedAuth.user?.id
    : savedAuth.user?.tenant_id
  : computed(() =>
      authStore.user?.business_name ? authStore.user.id : authStore.user.tenant_id
    )?.value;

const user = savedAuth?.user

const router = useRouter()
const buisnessName = ref('')

const getRoleLabelById = (id) => {
  return roles.value[id - 1]?.label || 'N/A'
}

const displayName = computed(() => {
  if (!user) return ''
  return user.business_name || `${user.firstname} ${user.lastname}`
})

const userInitials = computed(() => {
  if (!user) return ''

  if (user.business_name) {
    return user.business_name.slice(0, 2).toUpperCase()
  }

  const first = user.firstname?.charAt(0).toUpperCase() || ''
  const last = user.lastname?.charAt(0).toUpperCase() || ''
  return first + last
})

const displayRole = computed(() => {
  return getRoleLabelById(user?.role_id)
})

// Reactive variable to handle loading state
const isLoading = ref(false)
const errorMessage = ref(null)

// Logout function
const logout = async () => {
  isLoading.value = true
  errorMessage.value = null

  try {
    const response = await axios.post(
      `https://staging.getjupita.com/api/${tenantId}/logout`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )

    // Handle the successful logout
    console.log('Logged out successfully:', response.data)

    // Redirect to login page or any other page
    router.push('/')
  } catch (error) {
    // Handle errors
    errorMessage.value = error.response?.data?.message || error.message
    console.error('Logout failed:', errorMessage.value)
  } finally {
    isLoading.value = false
  }
}

const roles = ref([
  { value: 'tenant', label: 'Tenant' },
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'editor', label: 'Editor' },
  { value: 'credit_manager', label: 'Credit Manager' },
  { value: 'loan_manager', label: 'Loan Manager' },
  { value: 'analysis_manager', label: 'Analysis Manager' },
  { value: 'observer', label: 'Observer' }
])
const getRoleLabel = (roleValue) => {
  const found = roles.value.find((r) => r.value === roleValue)
  return found ? found.label : 'N/A'
}

onMounted(() => {
  getRoleLabel()

  if (user) {
    buisnessName.value = user.business_name
  }
})
</script>

<template>
  <div class="header items-center px-4 py-4 bg-white">
    <!-- Icons (Right) -->
    <div class="space-x-4">
      <!-- Notifications Icon -->
      <!-- <v-menu anchor="bottom end" origin="auto" min-width="300">
        <template v-slot:activator="{ props }">
          <v-btn class="min-w-0 w-4 h-4" v-bind="props" icon>
            <i class="fa-regular fa-bell font-light fa-2xl" style="color: #1f5aa3"></i>
          </v-btn>
        </template>
      </v-menu> -->

      <v-menu offset-y location="bottom left" origin="top left" min-width="200">
        <template v-slot:activator="{ props }">
          <div
            v-bind="props"
            class="flex items-center cursor-pointer bg-white rounded-md px-2 py-1 hover:bg-gray-100 transition"
          >
            <v-avatar start size="30" color="#1F5AA3" class="text-white font-bold p-4 text-sm">
              {{ userInitials }}
            </v-avatar>

            <div class="ml-2 text-left">
              <div class="font-semibold text-black text-sm">{{ displayName }}</div>
              <div class="text-xs text-gray-500">{{ displayRole }}</div>
            </div>
          </div>
        </template>

        <v-list>
          <v-list-item @click="logout" link class="text-gray-700 hover:text-red-500">
            <div class="flex items-center gap-2">
              <i class="fas fa-sign-out-alt text-gray-500 hover:text-red-500"></i>
              <v-list-item-title>Logout</v-list-item-title>
            </div>
          </v-list-item>
        </v-list>
      </v-menu>

      <!-- User Profile -->
      <!-- <v-menu anchor="bottom end" origin="auto" min-width="300">
        <template v-slot:activator="{ props }">
          <v-btn v-bind="props" class="user-btn p-0" elevation="0" variant="text" :ripple="false">
            <v-avatar size="40" class="mr-2">
              <img src="@/assets/images/users/black-user.jpg" alt="User Avatar" />
            </v-avatar>

            <div class="d-flex flex-column">
              <span class="font-normal text-sm">John Doe</span>
              <span class="font-light text-xs">Super admin</span>
            </div>
          </v-btn>
        </template>

        <v-list>
          <v-list-item @click="logout" link class="text-gray-700 hover:text-red-500">
            <div class="flex items-center gap-2">
              <i class="fas fa-sign-out-alt text-gray-500 hover:text-red-500"></i>
              <v-list-item-title>Logout</v-list-item-title>
            </div>
          </v-list-item>
        </v-list>
      </v-menu> -->
    </div>
  </div>
</template>

<style scoped>
v-btn {
  text-transform: none;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.icons-container {
  display: flex;
  justify-content: flex-end;
  flex-grow: 1;
}

.search {
  flex-grow: 0;
}
</style>
