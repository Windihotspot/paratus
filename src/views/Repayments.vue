<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import MainLayout from '@/layouts/full/MainLayout.vue'
import { supabase } from '@/services/supabase.js'
import { useAuthStore } from '@/stores/auth'

import { useFormattedFields } from '@/composables/useFormmatedFields'
const authStore = useAuthStore()
const merchantId = authStore.merchant.id

const repayments = ref([])
const loans = ref([])
const customers = ref([])
const showModal = ref(false)
const showDeleteModal = ref(false)
const formRef = ref(null)
const valid = ref(false)
const loading = ref(false)
const errorMessage = ref(null)

const formatCurrency = (value) => {
  if (!value) return '₦0.00'
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(value)
}

const repayment = ref({
  loan_id: '',
  amount: '',
  payment_date: '',
  method: 'cash'
})

const repaymentMenu = ref(false)
const formattedLoanAmount = useFormattedFields(repayment, 'amount', { currency: true })
const isEditing = ref(false)
const editingRepaymentId = ref(null)
const repaymentToDelete = ref(null)

const fetchLoans = async () => {
  try {
    const { data, error } = await supabase.rpc('get_merchant_loans', {
      p_merchant_id: merchantId,
      p_facility_id: authStore.selectedFacility?.id || null
    })
    if (error) throw error
    loans.value = data || []
  } catch (err) {
    console.error(err)
    errorMessage.value = 'Failed to load loans'
  } 
}

const fetchCustomers = async () => {
  try {
    const { data, error } = await supabase.rpc('get_merchant_customers', {
      p_merchant_id: merchantId
    })
    if (error) throw error
    customers.value = data || []
  } catch (err) {
    console.error(err)
    errorMessage.value = 'Failed to load customers'
  } 
}

const fetchRepayments = async () => {
  try {
    const { data, error } = await supabase.rpc('get_merchant_repayments', {
      p_merchant_id: merchantId,
        p_facility_id: authStore.selectedFacility?.id || null
    })
    if (error) throw error
    repayments.value = data || []
  } catch (err) {
    console.error(err)
    errorMessage.value = 'Failed to load repayments'
  }
}

const openModal = (rep = null) => {
  if (rep) {
    isEditing.value = true
    editingRepaymentId.value = rep.id
    repayment.value = { ...rep }
  } else {
    isEditing.value = false
    editingRepaymentId.value = null
    repayment.value = {
      loan_id: '',
      amount: '',
      principal_component: '',
      interest_component: '',
      fees_component: '',
      payment_date: '',
      method: 'cash'
    }
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  isEditing.value = false
  editingRepaymentId.value = null
  if (formRef.value) formRef.value.reset()
}

const submitRepayment = async () => {
  if (!formRef.value) return
  const formValid = await formRef.value.validate()
  if (!formValid) {
    ElMessage({ message: 'Please fix form errors', type: 'error' })
    return
  }

  loading.value = true
  try {
    if (isEditing.value) {
      const { error } = await supabase.rpc('edit_repayment', {
        p_id: editingRepaymentId.value,
        p_amount: repayment.value.amount,
        p_payment_date: repayment.value.payment_date,
        p_method: repayment.value.method
      })
      if (error) throw error
      ElNotification({ title: 'Success', message: 'Repayment updated!', type: 'success' })
    } else {
      const { error } = await supabase.rpc('add_repayment', {
        p_loan_id: repayment.value.loan_id,
        p_amount: repayment.value.amount,
        p_payment_date: repayment.value.payment_date,
        p_method: repayment.value.method
      })
      if (error) throw error
      ElNotification({ title: 'Success', message: 'Repayment added!', type: 'success' })
    }

    await fetchRepayments()
    closeModal()
  } catch (err) {
    console.error(err)
    ElNotification({ title: 'Error', message: err.message, type: 'error' })
  } finally {
    loading.value = false
  }
}

const openDeleteModal = (rep) => {
  repaymentToDelete.value = rep
  showDeleteModal.value = true
}

const cancelDelete = () => {
  repaymentToDelete.value = null
  showDeleteModal.value = false
}

const confirmDeleteRepayment = async () => {
  if (!repaymentToDelete.value) return
  loading.value = true
  try {
    const { error } = await supabase.rpc('delete_repayment', {
      p_id: repaymentToDelete.value.id
    })
    if (error) throw error
    ElNotification({ title: 'Deleted', message: 'Repayment deleted!', type: 'success' })
    await fetchRepayments()
  } catch (err) {
    console.error(err)
    ElNotification({ title: 'Error', message: err.message, type: 'error' })
  } finally {
    loading.value = false
    cancelDelete()
  }
}


const selectedFacility = computed(() => authStore.selectedFacility)
watch(
  () => selectedFacility.value?.id,
  async (newVal, oldVal) => {
    if (newVal && newVal !== oldVal) {
      await loadAllData()
    }
  }
)


const loadAllData = async () => {
  loading.value = true
  try {
    await Promise.all([fetchLoans(), fetchCustomers(), fetchRepayments()])
  } finally {
    loading.value = false
  }
}

watch(
  () => repayment.value.loan_id,
  (loanId) => {
    const selectedLoan = loans.value.find((l) => l.id === loanId)
    if (selectedLoan) {
      repayment.value.amount = selectedLoan.loan_amount || 0 // make sure your API returns loan_amount
    } else {
      repayment.value.amount = ''
    }
  }
)


watch(
  () => authStore.selectedFacility?.id,
  (newId, oldId) => {
    if (newId && newId !== oldId) loadAllData()
  }
)

onMounted(() => {
  loadAllData()
})

</script>

<template>
  <MainLayout>
    <div v-if="loading" class="flex flex-col items-center justify-center min-h-[200px]">
        <v-progress-circular indeterminate color="#27bfa0" size="40" width="4" />
      </div>
    <div v-else class="p-4">
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-xl font-bold">Repayments</h1>
        <v-btn color="green" @click="openModal()">Add Repayment</v-btn>
      </div>

      <!-- Repayments Table -->
      <table class="min-w-full bg-white rounded shadow overflow-x-auto">
        <thead class="bg-green-50">
          <tr>
            <th class="px-4 py-2 text-center">Customer</th>
            <th class="px-4 py-2 text-center">Loan Amount</th>
            <th class="px-4 py-2 text-center">Interest</th>
            <th class="px-4 py-2 text-center">Payment Date</th>
            <th class="px-4 py-2 text-center">Method</th>
            <th class="px-4 py-2 text-center">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
  <tr v-if="!loading && repayments.length === 0">
    <td colspan="6" class="px-4 py-6 text-center text-gray-500">
      No repayments found.
    </td>
  </tr>

  <tr
    v-for="rep in repayments"
    v-else
    :key="rep.id"
    class="hover:bg-gray-50"
  >
    <td class="px-4 py-2 text-center">{{ rep.customer_name || 'N/A' }}</td>
    <td class="px-4 py-2 text-center">{{ formatCurrency(rep.amount) }}</td>
    <td class="px-4 py-2 text-center">
  {{ formatCurrency(loans.find(l => l.id === rep.loan_id)?.interest_payable || 0) }}
</td>

    <td class="px-4 py-2 text-center">{{ rep.payment_date }}</td>
    <td class="px-4 py-2 text-center capitalize">{{ rep.method }}</td>
    <td class="px-4 py-2 flex justify-center gap-2 text-center">
      <button class="text-blue-600 hover:text-blue-900" @click="openModal(rep)">
        <i class="fas fa-edit"></i>
      </button>
      <button class="text-red-600 hover:text-red-900" @click="openDeleteModal(rep)">
        <i class="fas fa-trash"></i>
      </button>
    </td>
  </tr>
</tbody>

      </table>

      <!-- Add/Edit Modal -->
      <v-dialog v-model="showModal" max-width="600px">
        <v-card>
          <v-card-title>{{ isEditing ? 'Edit Repayment' : 'Add Repayment' }}</v-card-title>
          <v-card-text>
            <v-form ref="formRef" v-model="valid" lazy-validation>
              <v-select
                class="mb-4"
                variant="outlined"
                color="#27bfa0"
                v-model="repayment.loan_id"
                :items="loans"
                item-value="id"
                item-title="customer_name"
                label="Select Loan"
                :rules="[(v) => !!v || 'Loan is required']"
                required
              />
              <v-text-field
                class="mb-4"
                variant="outlined"
                color="#27bfa0"
                v-model="formattedLoanAmount"
                label="Amount"
                :rules="[(v) => !!v || 'Amount is required']"
                required
              />

              <v-menu
                v-model="repaymentMenu"
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
                    :model-value="repayment.payment_date"
                    label="Repayment Date"
                    readonly
                    :rules="[(v) => !!v || 'Repayment date is required']"
                  />
                </template>

                <v-date-picker
                  :model-value="repayment.payment_date ? new Date(repayment.payment_date) : null"
                  @update:model-value="
                    (val) => {
                      repayment.payment_date = val ? val.toISOString().split('T')[0] : null
                      repaymentMenu = false
                    }
                  "
                />
              </v-menu>
              <v-select
                class="mt-4"
                variant="outlined"
                color="#27bfa0"
                v-model="repayment.method"
                :items="['cash', 'bank_transfer', 'cheque']"
                label="Payment Method"
              />
            </v-form>
          </v-card-text>
          <v-card-actions class="justify-end">
            <v-btn text @click="closeModal">Cancel</v-btn>
            <v-btn color="green" @click="submitRepayment" :loading="loading">{{
              isEditing ? 'Update' : 'Save'
            }}</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Delete Modal -->
      <v-dialog v-model="showDeleteModal" max-width="400px">
        <v-card>
          <v-card-title>Delete Repayment</v-card-title>
          <v-card-text> Are you sure you want to delete this repayment? </v-card-text>
          <v-card-actions class="justify-end">
            <v-btn text @click="cancelDelete">Cancel</v-btn>
            <v-btn color="red" @click="confirmDeleteRepayment" :loading="loading">Delete</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </div>
  </MainLayout>
</template>

<style scoped>
.v-btn{
    text-transform: none;
}
</style>