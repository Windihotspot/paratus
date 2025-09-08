<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth' // your Pinia auth store
import { useRouter } from 'vue-router'

const router = useRouter()
const authStore = useAuthStore()

// Computed properties for the header
const userInitials = computed(() => {
  if (!authStore.merchant?.business_name) return ''
  return authStore.merchant.business_name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
})
console.log("store:", authStore)
const displayName = computed(() => {
  return authStore.merchant?.business_name || authStore.user?.full_name || ''
})

const displayRole = computed(() => {
  return authStore.user ? 'Super Admin' : ''
})

// Logout function
const logout = async () => {
  authStore.logout()  // call the correct Pinia store method
  router.push('/')
}
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
            <v-avatar start size="30" color="#27bfa0" class="text-white font-bold p-4 text-sm">
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
