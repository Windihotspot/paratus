<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const router = useRouter()
const authStore = useAuthStore()

// ------------------------
// SAFE ACCESS (IMPORTANT)
// ------------------------
const merchant = computed(() => authStore.merchant || {})
const profile = computed(() => authStore.profile || {})

// ------------------------
// INITIALS (FROM PROFILE OR BUSINESS)
// ------------------------
const userInitials = computed(() => {
  const name =
    profile.value.full_name ||
    merchant.value.business_name ||
    'U'

  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
})

// ------------------------
// DISPLAY NAME (PRIORITY: PROFILE)
// ------------------------
const displayName = computed(() => {
  return (
    profile.value.full_name ||
    merchant.value.business_name ||
    ''
  )
})

// ------------------------
// DISPLAY ROLE (FROM PROFILE - FIXED)
// ------------------------
const displayRole = computed(() => {
  const role = profile.value.role || 'viewer'

  const map = {
    admin: 'Admin',
    staff: 'Staff',
    viewer: 'Viewer'
  }

  return map[role] || 'Viewer'
})

// ------------------------
// FACILITY SELECT
// ------------------------
const selectedFacilityId = computed({
  get: () => authStore.selectedFacility?.id || null,
  set: (val) => authStore.setSelectedFacility(val)
})

const logFacilityChange = (facility) => {
  console.log('🏦 Facility switched:', facility)
  console.log('🔎 Selected Facility in store:', authStore.selectedFacility)
}

// ------------------------
// LOGOUT
// ------------------------
const logout = async () => {
  authStore.logout()
  router.push('/')
}
</script>

<template>
  <div class="header items-center px-4 py-4 bg-white">
    <!-- Facility Dropdown -->
    <div class="w-60">
      <v-select
        v-model="selectedFacilityId"
        :items="authStore.facilities"
        item-title="bank_name"
        item-value="id"
        label="Select Facility"
        variant="outlined"
        density="compact"
        hide-details
        color="#27bfa0"
        @update:modelValue="logFacilityChange"
      />
    </div>

    
    <!-- User Menu -->
    <div class="space-x-4">
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
