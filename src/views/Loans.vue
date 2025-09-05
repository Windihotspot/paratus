<script setup>
import { ref, onMounted } from 'vue'
import MainLayout from '@/layouts/full/MainLayout.vue'
import { supabase } from '@/services/supabase.js'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const merchantId = authStore.merchant.id

const loans = ref([])
const showModal = ref(false)
const loading = ref(false)

const openModal = () => (showModal.value = true)
const closeModal = () => (showModal.value = false)

const fetchLoans = async () => {
  loading.value = true
  const { data, error } = await supabase.rpc('get_merchant_loans', {
    p_merchant_id: merchantId
  })

  console.log('merchant loans:', data)

  if (error) {
    console.log('Error fetching loans:', error)
  } else {
    loans.value = data
  }

  loading.value = false
}

const formatCurrency = (value) => {
  if (!value) return '₦0.00'
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(value)
}

onMounted(() => {
  fetchLoans()
})
</script>

<template>
  <MainLayout>
    <div>
      <!-- Header -->
      <div class="bg-white flex rounded shadow justify-between items-center border-b p-4 mb-4">
        <div class="mb-2">
          <h1 class="text-xl font-bold mt-4">Database</h1>
          <p class="text-gray-500 text-sm mt-1">View and Manage your loans records</p>
        </div>

        <v-btn
          @click="openModal"
          size="medium"
          class="normal-case custom-btn hover:bg-green-700 text-white text-sm font-semibold px-6 py-3 rounded-md shadow-md"
        >
          <span class="p-1 flex items-center justify-center w-4 h-4 mr-2">
            <i class="fa-solid fa-plus text-sm text-white"></i>
          </span>
          Add a new loan
        </v-btn>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex flex-col items-center justify-center min-h-[200px]">
        <v-progress-circular indeterminate color="#27bfa0" size="40" width="4" />
        <span class="mt-2 text-gray-600 text-sm">Loading Loans</span>
      </div>

      <!-- Loans Table -->
      <div v-else-if="loans.length > 0" class="overflow-x-auto">
        <div class="overflow-y-auto max-h-[500px] bg-white shadow rounded-lg">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-green-50 font-semibold sticky top-0 z-10">
              <tr>
                <th class="px-6 py-3 text-left text-xs uppercase tracking-wider">Customer</th>
                <th class="px-6 py-3 text-left text-xs uppercase tracking-wider">Loan Amount</th>
                <th class="px-6 py-3 text-left text-xs uppercase tracking-wider">Balance</th>
                <th class="px-6 py-3 text-left text-xs uppercase tracking-wider">Rate (%)</th>
                <th class="px-6 py-3 text-left text-xs uppercase tracking-wider">Disbursement Date</th>
                <th class="px-6 py-3 text-left text-xs uppercase tracking-wider">Expiry Date</th>
                <th class="px-6 py-3 text-left text-xs uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-center text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="loan in loans" :key="loan.id">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {{ loan.customer_name || 'N/A' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {{ formatCurrency(loan.loan_amount) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {{ formatCurrency(loan.outstanding_balance) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {{ loan.agreed_rate }}%
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {{ loan.disbursed_at }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {{ loan.expiry_date }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    :class="{
                      'px-2 inline-flex text-xs leading-5 font-semibold rounded-full': true,
                      'bg-green-100 text-green-800': loan.status === 'active',
                      'bg-blue-100 text-blue-800': loan.status === 'repaid',
                      'bg-red-100 text-red-800': loan.status === 'defaulted'
                    }"
                  >
                    {{ loan.status }}
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
          <div class="empty-text font-semibold mt-8">No Loans</div>
        </div>
      </div>
    </div>

    <!-- Add Loan Modal -->
    <v-dialog v-model="showModal" persistent max-width="800px">
      <div class="w-full mx-auto p-6 bg-white shadow-lg rounded-lg relative h-screen">
        <!-- Close button -->
        <button @click="closeModal" class="absolute top-4 right-4 text-gray-600 hover:text-red-500">
          <i class="fas fa-times fa-lg"></i>
        </button>

        <p>Add a new loan</p>
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
