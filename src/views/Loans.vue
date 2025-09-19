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
const facilities = computed(() => authStore.facilities)
const showModal = ref(false)
const loading = ref(false)
const formRef = ref(null)
const valid = ref(false)
const merchant = authStore.merchant
const errorMessage = ref(null)
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

const downloadLoanExcel = (loan) => {
  const data = [
    {
      'Loan ID': loan.id,
      'Customer Name': loan.customer_name || 'N/A',
      'Customer ID': loan.customer_id,
      'Customer Email': loan.customer_email || 'N/A',
      'Customer Phone': loan.customer_phone || 'N/A',
      'Account Number': loan.customer_account_number || 'N/A',
      'Facility Name': loan.facility_name || 'N/A',
      'Facility ID': loan.facility_id,
      'Facility Amount': loan.facility_amount,
      'Facility Status': loan.facility_status,
      'Facility Rate (%)': loan.facility_rate,
      'Facility Tenure (Days)': loan.facility_tenure_days,
      'Facility Drawdown Date': loan.facility_drawdown_date,
      'Loan Amount': loan.loan_amount,
      'Agreed Rate (%)': loan.agreed_rate,
      'Profit Rate (%)': loan.profit_rate,
      'Rate/Day': loan.rate_day,
      'Rate/Month': loan.rate_month,
      'Rate/Year': loan.rate_year,
      Profit: loan.profit,
      'Interest Payable': loan.interest_payable,
      'Tenure (Days)': loan.tenure_days,
      'Disbursed At': loan.disbursed_at,
      'Expiry Date': loan.expiry_date,
      Status: loan.status,
      'Created At': loan.created_at,
      'Updated At': loan.updated_at
    }
  ]

  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Loan')

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  saveAs(
    new Blob([wbout], { type: 'application/octet-stream' }),
    `${loan.customer_name || 'Unknown'}.xlsx`
  )
}

const downloadAllLoansExcel = () => {
  if (!loans.value || loans.value.length === 0) {
    ElMessage({ message: 'No loans available to export', type: 'warning' })
    return
  }

  const data = loans.value.map((loan) => ({
    'Loan ID': loan.id,
    'Customer Name': loan.customer_name || 'N/A',
    'Customer ID': loan.customer_id,
    'Customer Email': loan.customer_email || 'N/A',
    'Customer Phone': loan.customer_phone || 'N/A',
    'Account Number': loan.customer_account_number || 'N/A',
    'Facility Name': loan.facility_name || 'N/A',
    'Facility ID': loan.facility_id,
    'Facility Amount': loan.facility_amount,
    'Facility Status': loan.facility_status,
    'Facility Rate (%)': loan.facility_rate,
    'Facility Tenure (Days)': loan.facility_tenure_days,
    'Facility Drawdown Date': loan.facility_drawdown_date,
    'Loan Amount': loan.loan_amount,
    'Agreed Rate (%)': loan.agreed_rate,
    'Profit Rate (%)': loan.profit_rate,
    'Rate/Day': loan.rate_day,
    'Rate/Month': loan.rate_month,
    'Rate/Year': loan.rate_year,
    Profit: loan.profit,
    'Interest Payable': loan.interest_payable,
    'Tenure (Days)': loan.tenure_days,
    'Disbursed At': loan.disbursed_at,
    'Expiry Date': loan.expiry_date,
    Status: loan.status,
    'Created At': loan.created_at,
    'Updated At': loan.updated_at
  }))

  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Loans Report')

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  saveAs(
    new Blob([wbout], { type: 'application/octet-stream' }),
    `Loans_Report_${new Date().toISOString().split('T')[0]}.xlsx`
  )
}

const disburseMenu = ref(false)

const loan = ref({
  customer_id: '',
  facility_id: '',
  loan_amount: '',
  agreed_rate: '',
  tenure_days: '',
  disbursed_at: '',
  agent_name: ''
})


// const fetchFacilities = async () => {
//   loading.value = true
//   const { data, error } = await supabase.rpc('get_merchant_facilities', {
//     p_merchant_id: merchantId
//   })
//   console.log('merchant facilities:', data)
//   facilities.value = data

//   if (error) {
//     console.log('Error fetching facilities:', error)
//   } else {
//     facilities.value = (data || []).map((f) => ({
//       id: f.id, // facility UUID
//       name: f.name || f.bank_name || 'Unnamed Facility' // adjust to your column name
//     }))
//   }

//   loading.value = false // set loading to false when done
// }

const getLoanStatusWithDays = (loan) => {
  if (!loan.expiry_date || !loan.status) return loan.status || 'N/A'

  const today = new Date()
  const expiry = new Date(loan.expiry_date)

  const diffTime = expiry - today // milliseconds
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) // convert to days

  if (diffDays > 0) {
    return `${loan.status} - less ${diffDays} day${diffDays > 1 ? 's' : ''}`
  } else {
    return `${loan.status} - expired`
  }
}

const getStatusBadge = (loan) => {
  if (!loan.status || !loan.expiry_date) return { text: 'N/A', color: 'gray' }

  const today = new Date()
  const expiry = new Date(loan.expiry_date)
  const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24))

  if (loan.status === 'active') {
    if (diffDays > 0) {
      if (diffDays <= 5) {
        return { text: `active < ${diffDays} day${diffDays > 1 ? 's' : ''}`, color: 'red' }
      } else {
        return { text: 'active', color: 'green' } // more than 5 days left
      }
    } else {
      return { text: 'closed', color: 'red' } // expired → closed
    }
  }

  if (loan.status === 'completed') return { text: 'completed', color: 'red' }
  if (loan.status === 'defaulted') return { text: 'defaulted', color: 'blue' }

  return { text: loan.status, color: 'gray' }
}

const isEditing = ref(false)
const editingLoanId = ref(null)

const editLoan = (loanData) => {
  isEditing.value = true
  editingLoanId.value = loanData.id
  loan.value = {
    customer_id: loanData.customer_id,
    facility_id: loanData.facility_id,
    loan_amount: loanData.loan_amount,
    agreed_rate: loanData.agreed_rate,
    tenure_days: loanData.tenure_days,
    disbursed_at: loanData.disbursed_at
  }

  showModal.value = true
}

const submitLoan = async () => {
  if (!formRef.value) return
  const formValid = await formRef.value.validate()
  if (!formValid) {
    ElMessage({ message: 'Please fix the form errors', type: 'error' })
    return
  }

  loading.value = true
  ElMessage({
    message: isEditing.value ? 'Updating loan...' : 'Adding loan...',
    type: 'info',
    duration: 1500
  })

  try {
    if (isEditing.value) {
      // Update existing loan
      const { data, error } = await supabase.rpc('update_loan', {
        p_loan_id: editingLoanId.value,
        p_loan_amount: loan.value.loan_amount,
        p_agreed_rate: loan.value.agreed_rate,
        p_disbursed_at: loan.value.disbursed_at,
        p_status: loan.value.status || 'active', // default if not set
        p_tenure_days: loan.value.tenure_days,
        p_customer_id: loan.value.customer_id,
        p_facility_id: loan.value.facility_id,
         p_agent_name: loan.value.agent_name 
      })
      if (error) throw error
      ElNotification({ title: 'Success', message: 'Loan updated successfully!', type: 'success' })
    } else {
      // Add new loan (your existing logic)
      const { data, error } = await supabase.rpc('add_loan', {
        p_merchant_id: merchantId,
        p_customer_id: loan.value.customer_id,
        p_facility_id: loan.value.facility_id,
        p_loan_amount: loan.value.loan_amount,
        p_agreed_rate: loan.value.agreed_rate,
        p_tenure_days: loan.value.tenure_days,
        p_disbursed_at: loan.value.disbursed_at,
         p_agent_name: loan.value.agent_name 
      })
      if (error) throw error
      ElNotification({ title: 'Success', message: 'Loan added successfully!', type: 'success' })
    }

    await fetchLoans()
    closeModal()
    // Reset form
    loan.value = {
      customer_id: null,
      facility_id: null,
      loan_amount: null,
      agreed_rate: null,
      tenure_days: null,
      disbursed_at: null,
      agent_name: null
    }
    isEditing.value = false
    editingLoanId.value = null
    formRef.value.reset()
  } catch (err) {
    console.error('Error submitting loan:', err)
    ElNotification({ title: 'Error', message: err.message, type: 'error' })
  } finally {
    loading.value = false
  }
}

const formattedLoanAmount = useFormattedFields(loan, 'loan_amount', { currency: true })
const openModal = () => (showModal.value = true)
const closeModal = () => {
  showModal.value = false
  isEditing.value = false
  editingLoanId.value = null
  if (formRef.value) formRef.value.reset()
  loan.value = {
    customer_id: null,
    facility_id: null,
    loan_amount: null,
    agreed_rate: null,
    tenure_days: null,
    disbursed_at: null
  }
}

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
    customers.value = (data || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

    console.log('Sorted customers:', customers.value)
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
  console.log('📥 Fetching loans for Merchant:', authStore.merchant.id)
  console.log('🏦 With Facility ID:', facilityId)

  try {
    const { data, error } = await supabase.rpc('get_merchant_loans', {
      p_merchant_id: authStore.merchant.id,
      p_facility_id: facilityId
    })

    if (error) throw error

    console.log('✅ Loans fetched:', data)
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
    console.log('🔄 Facility changed in store:', oldVal, '➡️', newVal)
    if (newVal && newVal !== oldVal) {
      await fetchLoans()
      await fetchCustomers()
    }
  },
  { immediate: true }
)

const showDeleteModal = ref(false)
const loanToDelete = ref(null)

const openDeleteModal = (loanData) => {
  loanToDelete.value = loanData
  showDeleteModal.value = true
}

const confirmDeleteLoan = async () => {
  if (!loanToDelete.value) return
  loading.value = true

  try {
    const { data, error } = await supabase.rpc('delete_loan', {
      p_loan_id: loanToDelete.value.id
    })
    if (error) throw error

    ElNotification({ title: 'Deleted', message: 'Loan deleted successfully!', type: 'success' })
    await fetchLoans()
  } catch (err) {
    console.error('Error deleting loan:', err)
    ElNotification({ title: 'Error', message: err.message, type: 'error' })
  } finally {
    loading.value = false
    showDeleteModal.value = false
    loanToDelete.value = null
  }
}

const cancelDelete = () => {
  showDeleteModal.value = false
  loanToDelete.value = null
}

const searchQuery = ref('')

const filteredLoans = computed(() => {
  if (!searchQuery.value) return loans.value

  const query = searchQuery.value.toLowerCase()

  return loans.value.filter((loan) =>
    Object.values(loan).some((val) =>
      String(val || '')
        .toLowerCase()
        .includes(query)
    )
  )
})

onMounted(() => {
  fetchLoans()
  fetchCustomers()
  authStore.fetchFacilities()
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
        <div class="flex justify-between items-center mb-4 mt-4">
          <!-- Export Button -->
          <v-btn
            color="green"
            @click="downloadAllLoansExcel"
            size="medium"
            class="normal-case bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-6 py-3 rounded-md shadow-md"
          >
            <span class="p-1 flex items-center justify-center w-4 h-4 mr-2">
              <i class="fas fa-file-excel text-sm text-white"></i>
            </span>
            Export Loans
          </v-btn>

          <!-- Search Field -->
          <div class="w-64">
            <v-text-field
              v-model="searchQuery"
              rounded
              placeholder="Search for a loan"
              density="compact"
              hide-details
              variant="outlined"
              class="max-w-xs rounded-md"
              label="Search"
               color="#27bfa0"
              append-inner-icon=""
            >
              <!-- FontAwesome Search Icon inside append-inner slot -->
              <template #append-inner>
                <i class="fas fa-search text-[#27bfa0]"></i>
              </template>
            </v-text-field>
          </div>
        </div>
        <div class="overflow-y-auto max-h-[500px] bg-white shadow rounded-lg">
          <!-- Export All Loans -->

          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-green-50 font-semibold sticky top-0 z-10">
              <tr>
                <th class="px-6 py-3 text-left text-xs uppercase tracking-wider">Customer</th>
                <th class="px-6 py-3 text-left text-xs uppercase tracking-wider">Acc.number</th>
                <th class="px-6 py-3 text-left text-xs uppercase tracking-wider">Loan Amount</th>
                <th class="px-6 py-3 text-left text-xs uppercase tracking-wider">Agent name</th>
                <th class="px-6 py-3 text-left text-xs uppercase tracking-wider">Bank Rate</th>
                <th class="px-6 py-3 text-left text-xs uppercase tracking-wider">Disbursed</th>
                <th class="px-6 py-3 text-left text-xs uppercase tracking-wider">
                  Interest Payable
                </th>
                <th class="px-6 py-3 text-left text-xs uppercase tracking-wider">Profit</th>
                <th class="px-6 py-3 text-left text-xs uppercase tracking-wider">Duration</th>
                <th class="px-6 py-3 text-left text-xs uppercase tracking-wider">Rate / Dy</th>
                <th class="px-6 py-3 text-left text-xs uppercase tracking-wider">Expiry Date</th>
                <th class="px-6 py-3 text-left text-xs uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-center text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>

            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="loan in filteredLoans" :key="loan.id">
                <!-- Customer -->
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {{ loan.customer_name || 'N/A' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {{ loan.customer_account_number || 'N/A' }}
                </td>

                <!-- Loan Amount -->
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {{ formatCurrency(loan.loan_amount) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {{ loan.agent_name }}
                </td>

                <!-- Agreed Rate -->
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {{ loan.agreed_rate != null ? loan.agreed_rate.toFixed(1) : '0.00' }}%
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

                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {{ loan.profit != null ? formatCurrency(loan.profit) : formatCurrency(0) }}
                </td>

                <!-- Duration -->
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {{ loan.tenure_days }} days
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
                      'bg-green-100 text-green-800': getStatusBadge(loan).color === 'green',
                      'bg-red-100 text-red-800': getStatusBadge(loan).color === 'red',
                      'bg-blue-100 text-blue-800': getStatusBadge(loan).color === 'blue',
                      'bg-gray-100 text-gray-800': getStatusBadge(loan).color === 'gray'
                    }"
                  >
                    {{ getStatusBadge(loan).text }}
                  </span>
                </td>

                <!-- Actions -->
                <td class="px-8 flex gap-4 py-4 whitespace-nowrap text-center text-sm font-medium">
                  <button
                    class="text-green-600 hover:text-green-900"
                    @click="downloadLoanExcel(loan)"
                  >
                    <i class="fas fa-download"></i>
                  </button>

                  <button class="text-blue-600 hover:text-blue-900 mr-2" @click="editLoan(loan)">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="text-red-600 hover:text-red-900" @click="openDeleteModal(loan)">
                    <i class="fas fa-trash"></i>
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

    <!-- Delete loan modal -->
    <v-dialog v-model="showDeleteModal" max-width="400px">
      <v-card>
        <v-card-title class="text-lg font-bold">Delete Loan</v-card-title>
        <v-card-text>
          Are you sure you want to delete the loan for
          <strong>{{ loanToDelete?.customer_name }}</strong
          >?
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn text color="gray" @click="cancelDelete">Cancel</v-btn>
          <v-btn color="red" dark @click="confirmDeleteLoan" :loading="loading">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Add Loan Modal -->
    <v-dialog v-model="showModal" persistent max-width="800px">
      <div class="w-full mx-auto p-6 bg-white shadow-lg rounded-lg relative">
        <button @click="closeModal" class="absolute top-4 right-4 text-gray-600 hover:text-red-500">
          <i class="fas fa-times fa-lg"></i>
        </button>

        <h2 class="text-lg font-bold mb-4">
          {{ isEditing ? 'Edit Existing Loan' : 'Add a New Loan' }}
        </h2>

        <v-form ref="formRef" v-model="valid" lazy-validation>
          <v-select
            :disabled="isEditing"
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
            :disabled="isEditing"
            variant="outlined"
            color="#27bfa0"
            v-model="loan.facility_id"
            :items="facilities"
            item-value="id"
            item-title="bank_name"
            label="Select Facility"
            :rules="[(v) => !!v || 'Facility is required']"
          />

          <v-text-field
            variant="outlined"
            v-model="formattedLoanAmount"
            color="#27bfa0"
            label="Loan Amount"
            :rules="[(v) => !!v || 'Loan amount is required']"
          />
          <v-text-field
            variant="outlined"
            v-model="loan.agent_name"
            color="#27bfa0"
            label="Agent name"
            :rules="[(v) => !!v || 'Agent name is required']"
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
                  if (val) {
                    const year = val.getFullYear()
                    const month = String(val.getMonth() + 1).padStart(2, '0')
                    const day = String(val.getDate()).padStart(2, '0')
                    loan.disbursed_at = `${year}-${month}-${day}` // stays correct, no UTC shift
                  } else {
                    loan.disbursed_at = null
                  }
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
              {{ isEditing ? 'Update' : 'Save' }}
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
