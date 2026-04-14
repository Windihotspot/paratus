<script setup>
import { ref, computed } from 'vue'
import sidebarItems from './sidebarItem'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
const route = useRoute()
const router = useRouter()

// Function to check if the current route is active
const isActive = (path) => {
  return route.path === path
}
import { useAuthStore } from '@/stores/auth'
const authStore = useAuthStore()
const role = computed(() => authStore.role)
console.log('role:', role.value)

const sidebarMenu = ref(sidebarItems)
const filteredMenu = computed(() => {
  return sidebarItems.filter((item) => {
    if (role.value === 'admin') return true

    if (role.value === 'viewer') {
      return !['Users'].includes(item.title)
    }

    if (role.value === 'staff') {
      return ![
        'Users',
        'Logs',
        'Profit & Loss',
        'Dashboard',
        'Loans',
        'Agents',
        'Customers',
        'Banks',
        'Facilities'
      ].includes(item.title)
    }

    return true
  })
})
const logout = async () => {
  const savedAuth = JSON.parse(localStorage.getItem('data') || '{}')
  const token = savedAuth?.token || authStore.token
  const tenantId = savedAuth?.user?.tenant_id || authStore.tenant_id

  try {
    const response = await axios.post(
      `https://dev02201.getjupita.com/api/${tenantId}/logout`,
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

const goTo = (url) => {
  window.open(url, '_blank')
}
</script>

<template>
  <div class="side-bar mt-4 d-flex flex-column h-full justify-between overflow-hidden">
    <!-- Logo part -->
    <!-- <div class="logo pa-4">
      <img src="/src/assets/images/white.png" class="" />
    </div> -->
    <div class="flex mt-4 flex-col items-center">
      <span
        class="text-xs mt-2 font-medium text-red-600 hover:text-red-700 cursor-pointer transition"
        @click="goTo('https://cib.globusbank.com/')"
      >
        Globus Bank
      </span>
    </div>

    <div class="mt-4 flex flex-col items-center">
      <span
        class="text-xs mt-2 font-medium text-purple-600 hover:text-purple-700 cursor-pointer transition"
        @click="goTo('https://icorporate.parallexbank.com/auth/login')"
      >
        Parallex Bank
      </span>
    </div>

    <!-- Navigation -->
    <div class="flex-grow mt-4">
      <v-list class="pa-4">
        <template v-for="(item, i) in filteredMenu" :key="i">
          <v-list-item
            @click="router.push(item.path)"
            class="mb-4 pr-4 custom-btn no-uppercase relative"
            size="small"
            rounded="lg"
            block
            :class="{ 'custom-active': isActive(item.path) }"
          >
            <div class="flex items-center w-full">
              <v-icon left>{{ item.icon }}</v-icon>
              <span class="menu-item ml-4" v-text="item.title"></span>
            </div>

            <!-- Active bar INSIDE the v-list-item -->
          </v-list-item>
          <!-- <div v-if="isActive(item.path)" class="active-bar"></div> -->
        </template>
      </v-list>
    </div>

    <!-- FOOTER LOGO -->
  </div>
</template>

<style scoped>
.side-bar {
  width: 250px;
  position: fixed;
  top: 0;
  left: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100vh;
  background: #ffffff;
}

/* Default button state */
.custom-btn {
  text-align: left;
  justify-content: flex-start;
  transition: all 0.2s ease;
  border-radius: 8px;
  padding: 10px 12px;
  color: #1e1e1e;
}

/* Hover state */
.custom-btn:hover {
  background-color: rgba(39, 191, 160, 0.08); /* soft teal */
  color: #27bfa0;
}

.custom-btn .v-icon {
  margin-right: 10px;
  font-size: 18px;
  color: #6b7280; /* gray-500 */
}

.custom-btn .menu-item {
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  font-size: 15px;
  line-height: 22px;
  color: #374151; /* gray-700 */
}

/* Active state */
.custom-active {
  background-color: rgba(39, 191, 160, 0.12);
  border-left: 4px solid #27bfa0;
  color: #27bfa0 !important;
}

.custom-active .menu-item {
  color: #27bfa0 !important;
  font-weight: 600;
}

.custom-active .v-icon {
  color: #27bfa0 !important;
}

/* Logout hover */
.logout-btn:hover {
  background-color: #ffecec;
  color: #e63946;
}

.active-bar {
  display: none; /* no need if using border-left highlight */
}
.sidebar-footer {
  border-top: 1px solid #f1f5f9;
}

.footer-logo {
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.footer-logo img {
  max-height: 40px;
  object-fit: contain;
}

.footer-logo:hover {
  background-color: rgba(39, 191, 160, 0.08);
}
</style>
