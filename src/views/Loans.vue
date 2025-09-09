<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import MainLayout from '@/layouts/full/MainLayout.vue'
import { supabase } from '@/services/supabase.js'
import { useAuthStore } from '@/stores/auth'
import { useFormattedFields } from '@/composables/useFormmatedFields'
const authStore = useAuthStore()
const merchantId = authStore.merchant.id
const loans = ref([])
const customers = ref([])
const facilities = ref([])
const showModal = ref(false)
const loading = ref(false)
const formRef = ref(null)
const valid = ref(false)
const merchant = authStore.merchant
const errorMessage = ref(null)


const disburseMenu = ref(false)

const loan = ref({
  customer_id: '',
  facility_id: '',
  loan_amount: '',
  agreed_rate: '',
  tenure_days: '',
  disbursed_at: ''
})
const fetchFacilities = async () => {
  loading.value = true
  const { data, error } = await supabase.rpc('get_merchant_facilities', {
    p_merchant_id: merchantId
  })
  console.log('merchant facilities:', data)
  facilities.value = data

  if (error) {
    console.log('Error fetching facilities:', error)
  } else {
    facilities.value = (data || []).map((f) => ({
      id: f.id, // facility UUID
      name: f.name || f.bank_name || 'Unnamed Facility' // adjust to your column name
    }))
  }

  loading.value = false // set loading to false when done
}

const submitLoan = async () => {
  if (!formRef.value) return
  const formValid = await formRef.value.validate()
  if (!formValid) {
    ElMessage({ message: 'Please fix the form errors', type: 'error' })
    return
  }

  loading.value = true
  ElMessage({ message: 'Adding loan...', type: 'info', duration: 1500 })

  try {
    const payload = {
      p_merchant_id: merchantId,
      p_customer_id: loan.value.customer_id,
      p_facility_id: loan.value.facility_id = authStore.selectedFacility?.id,
      p_loan_amount: loan.value.loan_amount,
      p_agreed_rate: loan.value.agreed_rate,
      p_tenure_days: loan.value.tenure_days,
      p_disbursed_at: loan.value.disbursed_at
    }
    console.log('📤 Submitting loan payload:', payload)
    const { data, error } = await supabase.rpc('add_loan', {
      p_merchant_id: merchantId,
      p_customer_id: loan.value.customer_id,
      p_facility_id: loan.value.facility_id = authStore.selectedFacility?.id,
      p_loan_amount: loan.value.loan_amount,
      p_agreed_rate: loan.value.agreed_rate,
      p_tenure_days: loan.value.tenure_days,
      p_disbursed_at: loan.value.disbursed_at
    })

    if (error) throw error
    if (!data) throw new Error('No data returned from add_loan')

    ElNotification({ title: 'Success', message: 'Loan added successfully!', type: 'success' })
    await fetchLoans()
    // ✅ Reset fields after success
    if (formRef.value) {
      formRef.value.reset() // resets Vuetify form validation + values
    }

    loan.value = {
      customer_id: null,
      facility_id: null,
      loan_amount: null,
      agreed_rate: null,
      tenure_days: null,
      disbursed_at: null
    }

    closeModal()
  } catch (err) {
    console.error('Error adding loan:', err)
    ElNotification({ title: 'Error', message: err.message, type: 'error' })
  } finally {
    loading.value = false
  }
}
const formattedLoanAmount = useFormattedFields(loan.value, 'loan_amount', { currency: true })
const openModal = () => (showModal.value = true)
const closeModal = () => (showModal.value = false)

const fetchCustomers = async () => {
  loading.value = true
  errorMessage.value = null

  try {
    const { data, error } = await supabase.rpc('get_merchant_customers', {
      p_merchant_id: authStore.merchant.id,
      p_facility_id: authStore.selectedFacility?.id || null
    })

    if (error) throw error

    // Sort latest first
    customers.value = (data || []).sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    )

    console.log("Sorted customers:", customers.value)
  } catch (err) {
    console.error('fetchCustomers error:', err)
    errorMessage.value = 'Failed to load customers'
  } finally {
    loading.value = false
  }
}


// fetch merchant loans
const fetchLoans = async () => {
  loading.value = true
  errorMessage.value = null

  const facilityId = authStore.selectedFacility?.id || null
  console.log("📥 Fetching loans for Merchant:", authStore.merchant.id)
  console.log("🏦 With Facility ID:", facilityId)

  try {
    const { data, error } = await supabase.rpc('get_merchant_loans', {
      p_merchant_id: authStore.merchant.id,
      p_facility_id: facilityId
    })

    if (error) throw error

    console.log("✅ Loans fetched:", data)
    loans.value = data || []
  } catch (err) {
    console.error('❌ fetchLoans error:', err)
    errorMessage.value = 'Failed to load loans'
  } finally {
    loading.value = false
  }
}

const formatCurrency = (value) => {
  if (!value) return '₦0.00'
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(value)
}

const selectedFacility = computed(() => authStore.selectedFacility)

watch(
  () => selectedFacility.value?.id,
  async (newVal, oldVal) => {
    console.log("🔄 Facility changed in store:", oldVal, "➡️", newVal)
    if (newVal && newVal !== oldVal) {
      await fetchLoans()
      await fetchCustomers()
    }
  },
  { immediate: true }
)


onMounted(() => {
  fetchLoans()
  fetchCustomers()
  fetchFacilities()
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
                <th class="px-6 py-3 text-left text-xs uppercase tracking-wider">Rate (%)</th>
                <th class="px-6 py-3 text-left text-xs uppercase tracking-wider">Disbursed</th>
                <th class="px-6 py-3 text-left text-xs uppercase tracking-wider">Interest</th>
                <th class="px-6 py-3 text-left text-xs uppercase tracking-wider">Rate / Yr</th>
                <th class="px-6 py-3 text-left text-xs uppercase tracking-wider">Rate / Mo</th>
                <th class="px-6 py-3 text-left text-xs uppercase tracking-wider">Rate / Dy</th>
                <th class="px-6 py-3 text-left text-xs uppercase tracking-wider">Expiry Date</th>
                <th class="px-6 py-3 text-left text-xs uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-center text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>

            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="loan in loans" :key="loan.id">
                <!-- Customer -->
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {{ loan.customer_name || 'N/A' }}
                </td>

                <!-- Loan Amount -->
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {{ formatCurrency(loan.loan_amount) }}
                </td>

                <!-- Agreed Rate -->
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {{ loan.agreed_rate != null ? loan.agreed_rate.toFixed(2) : '0.00' }}%
                </td>

                <!-- Disbursement Date -->
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {{ loan.disbursed_at }}
                </td>

                <!-- Interest Payable -->
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {{
                    loan.interest_payable != null
                      ? formatCurrency(loan.interest_payable)
                      : formatCurrency(0)
                  }}
                </td>

                <!-- Rate / Year -->
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {{ loan.rate_year != null ? loan.rate_year.toFixed(2) : '0.00' }}%
                </td>

                <!-- Rate / Month -->
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {{ loan.rate_month != null ? loan.rate_month.toFixed(2) : '0.00' }}%
                </td>

                <!-- Rate / Day -->
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {{ loan.rate_day != null ? loan.rate_day.toFixed(4) : '0.0000' }}
                </td>

                <!-- Expiry Date -->
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {{ loan.expiry_date }}
                </td>

                <!-- Status -->
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

                <!-- Actions -->
                <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                  <button class="text-indigo-600 hover:text-indigo-900 font-semibold">View</button>
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
      <div class="w-full mx-auto p-6 bg-white shadow-lg rounded-lg relative">
        <button @click="closeModal" class="absolute top-4 right-4 text-gray-600 hover:text-red-500">
          <i class="fas fa-times fa-lg"></i>
        </button>

        <h2 class="text-lg font-bold mb-4">Add a new loan</h2>

        <v-form ref="formRef" v-model="valid" lazy-validation>
          <v-select
            variant="outlined"
            color="#27bfa0"
            v-model="loan.customer_id"
            :items="customers"
            item-value="id"
            item-title="full_name"
            label="Select Customer"
            required
          ></v-select>
          <v-select
            variant="outlined"
            color="#27bfa0"
            v-model="loan.facility_id"
            :items="facilities"
            item-value="id"
            item-title="name"
            label="Select Facility"
            :rules="[(v) => !!v || 'Facility is required']"
          />

          <v-text-field
            variant="outlined"
            color="#27bfa0"
            v-model="formattedLoanAmount"
            label="Loan Amount"
            :rules="[(v) => !!v || 'Loan amount is required']"
          />
          <v-text-field
            variant="outlined"
            color="#27bfa0"
            v-model="loan.agreed_rate"
            label="Agreed Rate (%)"
            type="number"
            :rules="[(v) => !!v || 'Rate is required']"
          />
          <v-text-field
            variant="outlined"
            color="#27bfa0"
            v-model="loan.tenure_days"
            label="Tenure (Days)"
            type="number"
            :rules="[(v) => !!v || 'Tenure is required']"
          />
          <v-menu
            v-model="disburseMenu"
            :close-on-content-click="false"
            transition="scale-transition"
            offset-y
            min-width="290px"
          >
            <template v-slot:activator="{ props }">
              <v-text-field
                v-bind="props"
                variant="outlined"
                color="#27bfa0"
                :model-value="loan.disbursed_at"
                label="Disbursement Date"
                readonly
                :rules="[(v) => !!v || 'Disbursement date is required']"
              />
            </template>

            <v-date-picker
              :model-value="loan.disbursed_at ? new Date(loan.disbursed_at) : null"
              @update:model-value="
                (val) => {
                  loan.disbursed_at = val ? val.toISOString().split('T')[0] : null
                  disburseMenu = false
                }
              "
            />
          </v-menu>

          <div class="flex justify-end mt-6">
            <v-btn text @click="closeModal">Cancel</v-btn>
            <v-btn
              color="green"
              class="ml-3"
              :disabled="!valid"
              :loading="loading"
              @click="submitLoan"
            >
              Save
            </v-btn>
          </div>
        </v-form>
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
