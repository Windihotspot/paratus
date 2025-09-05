<script setup>
import { ref, onMounted } from 'vue'
import MainLayout from '@/layouts/full/MainLayout.vue'
import { supabase } from '@/services/supabase.js'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const merchantId = authStore.merchant.id

const customers = ref([])
const showModal = ref(false)
const loading = ref(false)

const openModal = () => (showModal.value = true)
const closeModal = () => (showModal.value = false)

const fetchCustomers = async () => {
  loading.value = true
  const { data, error } = await supabase.rpc('get_merchant_customers', {
    p_merchant_id: merchantId
  })

  console.log('merchant customers:', data)

  if (error) {
    console.log('Error fetching customers:', error)
  } else {
    customers.value = data
  }

  loading.value = false
}

onMounted(() => {
  fetchCustomers()
})
</script>

<template>
  <MainLayout>
    <div>
      <!-- Header -->
      <div class="bg-white flex rounded shadow justify-between items-center border-b p-4 mb-4">
        <div class="mb-2">
          <h1 class="text-xl font-bold mt-4">Database</h1>
          <p class="text-gray-500 text-sm mt-1">View and Manage your customers records</p>
        </div>

        <v-btn
          @click="openModal"
          size="medium"
          class="normal-case custom-btn hover:bg-green-700 text-white text-sm font-semibold px-6 py-3 rounded-md shadow-md"
        >
          <span class="p-1 flex items-center justify-center w-4 h-4 mr-2">
            <i class="fa-solid fa-plus text-sm text-white"></i>
          </span>
          Add a new customer
        </v-btn>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex flex-col items-center justify-center min-h-[200px]">
        <v-progress-circular indeterminate color="#27bfa0" size="40" width="4" />
        <span class="mt-2 text-gray-600 text-sm">Loading Customers</span>
      </div>

      <!-- Customers Table -->
      <div v-else-if="customers.length > 0" class="overflow-x-auto">
        <div class="overflow-x-auto bg-white shadow rounded-lg">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-green-50 font-semibold">
              <tr>
                <th class="px-6 py-3 text-left text-xs uppercase tracking-wider">Name</th>
                <th class="px-6 py-3 text-left text-xs uppercase tracking-wider">Email</th>
                <th class="px-6 py-3 text-left text-xs uppercase tracking-wider">Phone</th>
                <th class="px-6 py-3 text-left text-xs uppercase tracking-wider">Created Date</th>
                <th class="px-6 py-3 text-left text-xs uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-center text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="customer in customers" :key="customer.id">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {{ customer.full_name }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {{ customer.email || 'N/A' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {{ customer.phone || 'N/A' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {{ customer.created_at }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    :class="{
                      'px-2 inline-flex text-xs leading-5 font-semibold rounded-full': true,
                      'bg-green-100 text-green-800': customer.status === 'active',
                      'bg-red-100 text-red-800': customer.status === 'inactive'
                    }"
                  >
                    {{ customer.status || 'active' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                  <button class="text-indigo-600 hover:text-indigo-900 font-semibold">
                    View
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="fill-height align-center justify-center">
        <div class="mx-auto text-center align-center w-[200px] h-[200px]">
          <div class="empty-text font-semibold mt-8">No Customers</div>
        </div>
      </div>
    </div>

    <!-- Add Customer Modal -->
    <v-dialog v-model="showModal" persistent max-width="800px">
      <div class="w-full mx-auto p-6 bg-white shadow-lg rounded-lg relative h-screen">
        <!-- Close button -->
        <button @click="closeModal" class="absolute top-4 right-4 text-gray-600 hover:text-red-500">
          <i class="fas fa-times fa-lg"></i>
        </button>

        <p>Add a new customer</p>
      </div>
    </v-dialog>
  </MainLayout>
</template>
<style scoped>
.el-message.el-message-top-left {
  left: 20px; /* push from the left */
  right: auto; /* override default center */
  transform: none; /* remove centering */
}

.custom-btn {
  background-color: #27bfa0;
}
.v-slider {
  --v-slider-track-size: 4px;
  --v-slider-thumb-size: 12px;
}

.v-tab {
  text-transform: none;
}
.v-btn {
  text-transform: none;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
:deep(.v-tab__slider) {
  height: 4px !important; /* Adjust thickness */
  background-color: #15803d !important; /* Change color if needed */
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
