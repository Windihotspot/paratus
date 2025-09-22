<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import MainLayout from '@/layouts/full/MainLayout.vue'
import { supabase } from '@/services/supabase.js'
import { useAuthStore } from '@/stores/auth'
import { useFormattedFields } from '@/composables/useFormmatedFields'

const authStore = useAuthStore()
const merchantId = authStore.merchant.id
const showModal = ref(false)
const facilities = computed(() => authStore.facilities)

const loading = ref(false)
const formRef = ref(null)
const valid = ref(false)
const formatCurrency = (value) => {
  if (!value) return '₦0.00'
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(value)
}

const isEditing = ref(false)
const editingFacilityId = ref(null)

const disburseMenu = ref(false)
const facilityTypes = [{ label: 'Overdraft', value: 'overdraft' }]

// Form state
const facilityForm = ref({
  bank_id: null,
  facility_type: '',
  facility_amount: null,
  borrowing_rate: null,
  drawdown_date: null, // string YYYY-MM-DD for API
  drawdown_date_obj: null, // Date object for internal use
  tenure_days: null
})

const formattedFacilityAmount = useFormattedFields(facilityForm, 'facility_amount', {
  currency: true
})

// Fetch all banks for selection
const banks = ref([])
const fetchBanks = async () => {
  const { data, error } = await supabase.from('banks').select('*')
  if (error) {
    console.error('Error fetching banks:', error)
  } else {
    banks.value = data
  }
}

// Fetch merchant facilities
const fetchFacilities = async () => {
  loading.value = true
  const { data, error } = await supabase.rpc('get_merchant_facilities', {
    p_merchant_id: merchantId
  })
  console.log('facilities:', data)
  if (error) console.error('Error fetching facilities:', error)
  else facilities.value = data
  loading.value = false
}

// Open/Close modal
// Open/Close modal for edit
const openFacilityModal = (facility = null) => {
  if (facility) {
    isEditing.value = true
    editingFacilityId.value = facility.id
    facilityForm.value = {
      bank_id: facility.bank_id,
      facility_type: facility.facility_type,
      facility_amount: facility.facility_amount,
      borrowing_rate: facility.borrowing_rate,
      drawdown_date: facility.drawdown_date,
      drawdown_date_obj: facility.drawdown_date ? new Date(facility.drawdown_date) : null,
      tenure_days: facility.tenure_days ? Number(facility.tenure_days) : null // ✅ ensure number
    }
  } else {
    isEditing.value = false
    editingFacilityId.value = null
    facilityForm.value = {
      bank_id: null,
      facility_type: '',
      facility_amount: null,
      borrowing_rate: null,
      drawdown_date: null,
      drawdown_date_obj: null,
      tenure_days: null
    }
  }
  showModal.value = true
}

// Submit facility form
const submitFacility = async () => {
  if (!formRef.value) return
  const formValid = await formRef.value.validate()
  if (!formValid) {
    ElMessage({ message: 'Please fix the form errors', type: 'error' })
    return
  }

  loading.value = true
  ElMessage({
    message: isEditing.value ? 'Updating facility...' : 'Adding facility...',
    type: 'info',
    duration: 1500
  })

  try {
    let data, error

    if (isEditing.value && editingFacilityId.value) {
      // ✅ Update facility
      ;({ data, error } = await supabase.rpc('update_facility', {
        p_facility_id: editingFacilityId.value,
        p_bank_id: facilityForm.value.bank_id,
        p_facility_type: facilityForm.value.facility_type,
        p_facility_amount: facilityForm.value.facility_amount,
        p_borrowing_rate: facilityForm.value.borrowing_rate,
        p_drawdown_date: facilityForm.value.drawdown_date,
        p_tenure_days: facilityForm.value.tenure_days
      }))
    } else {
      // ✅ Add facility
      ;({ data, error } = await supabase.rpc('add_facility', {
        p_merchant_id: merchantId,
        p_bank_id: facilityForm.value.bank_id,
        p_facility_type: facilityForm.value.facility_type,
        p_facility_amount: facilityForm.value.facility_amount,
        p_borrowing_rate: facilityForm.value.borrowing_rate,
        p_drawdown_date: facilityForm.value.drawdown_date,
        p_tenure_days: facilityForm.value.tenure_days
      }))
    }

    if (error) throw error
    if (!data) throw new Error('No data returned from RPC')

    ElNotification({
      title: 'Success',
      message: isEditing.value ? 'Facility updated successfully!' : 'Facility added successfully!',
      type: 'success'
    })
    await authStore.fetchFacilities()
    closeFacilityModal()
    await fetchFacilities()
  } catch (err) {
    console.error('Error saving facility:', err)
    ElNotification({ title: 'Error', message: err.message, type: 'error' })
  } finally {
    loading.value = false
  }
}

const closeFacilityModal = () => {
  showModal.value = false
  isEditing.value = false
  editingFacilityId.value = null
  if (formRef.value) formRef.value.reset()
  facilityForm.value = {
    bank_id: null,
    facility_type: '',
    facility_amount: null,
    borrowing_rate: null,
    drawdown_date: null,
    drawdown_date_obj: null,
    tenure_days: null
  }
}

// Delete modal state
const showDeleteFacilityModal = ref(false)
const facilityToDelete = ref(null)

// open the delete confirmation modal for a specific facility
const openDeleteFacilityModal = (facility) => {
  facilityToDelete.value = facility
  showDeleteFacilityModal.value = true
}

// cancel deletion
const cancelDeleteFacility = () => {
  showDeleteFacilityModal.value = false
  facilityToDelete.value = null
}

// confirm deletion (calls your RPC)
const confirmDeleteFacility = async () => {
  if (!facilityToDelete.value) return
  loading.value = true

  try {
    const { error } = await supabase.rpc('delete_facility', {
      p_facility_id: facilityToDelete.value.id
    })

    if (error) throw error

    ElNotification({
      title: 'Deleted',
      message: 'Facility deleted successfully!',
      type: 'success'
    })

    await fetchFacilities()
  } catch (err) {
    console.error('Error deleting facility:', err)
    ElNotification({
      title: 'Error',
      message: err.message || 'Failed to delete facility',
      type: 'error'
    })
  } finally {
    loading.value = false
    showDeleteFacilityModal.value = false
    facilityToDelete.value = null
  }
}

const selectedFacility = computed(() => authStore.selectedFacility)

watch(
  () => selectedFacility.value?.id,
  async (newVal, oldVal) => {
    if (newVal && newVal !== oldVal) {
      await fetchBanks()
    }
  }
)

// Submit facility form

onMounted(() => {
  fetchBanks()
  authStore.fetchFacilities()
})

</script>

<template>
  <MainLayout>
    <div>
      <!-- Header with Title and New credit search Button -->
      <div class="bg-white flex rounded shadow justify-between items-center border-b p-4 mb-4">
        <div class="mb-2">
          <h1 class="text-xl font-bold mt-4">Database</h1>
          <p class="text-gray-500 text-sm mt-1">View and Manage your facilities records</p>
        </div>

        <v-btn
          @click="openFacilityModal()"
          size="medium"
          class="normal-case custom-btn hover:bg-green-700 text-white text-sm font-semibold px-6 py-3 rounded-md shadow-md"
        >
          <span class="p-1 flex items-center justify-center w-4 h-4 mr-2">
            <i class="fa-solid fa-plus text-sm text-white"></i>
          </span>
          Add a new facility
        </v-btn>
      </div>

      <div v-if="loading" class="flex flex-col items-center justify-center min-h-[200px]">
        <v-progress-circular indeterminate color="#27bfa0" size="40" width="4" />
        <span class="mt-2 text-gray-600 text-sm">Loading Facilities</span>
      </div>

      <div v-else-if="facilities.length > 0" class="overflow-x-auto">
        <!-- Facilities Table -->
        <div class="overflow-x-auto bg-white shadow rounded-lg">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-green-50 font-semibold">
              <tr class="font-semibold">
                <th class="px-6 py-3 text-left text-xs uppercase tracking-wider">Bank</th>
                <th class="px-6 py-3 text-left text-xs uppercase tracking-wider">Type</th>
                <th class="px-6 py-3 text-left text-xs uppercase tracking-wider">Amount</th>
                <th class="px-6 py-3 text-left text-xs uppercase tracking-wider">Rate (%)</th>
                <th class="px-6 py-3 text-left text-xs uppercase tracking-wider">Drawdown Date</th>
                <th class="px-6 py-3 text-left text-xs uppercase tracking-wider">Expiry Date</th>
                <th class="px-6 py-3 text-left text-xs uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-center text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="facility in facilities" :key="facility.id">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {{ facility.bank_name || 'N/A' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize">
                  {{ facility.facility_type }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {{ formatCurrency(facility.facility_amount) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {{ facility.borrowing_rate }}%
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {{ facility.drawdown_date }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {{ facility.expiry_date }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    :class="{
                      'px-2 inline-flex text-xs leading-5 font-semibold rounded-full': true,
                      'bg-green-100 text-green-800': facility.status === 'active',
                      'bg-blue-100 text-blue-800': facility.status === 'repaid',
                      'bg-red-100 text-red-800': facility.status === 'defaulted'
                    }"
                  >
                    {{ facility.status }}
                  </span>
                </td>
                <td
                  class="px-6 flex gap-4 py-4 whitespace-nowrap text-center text-sm font-medium space-x-3"
                >
                  <button
                    @click="openFacilityModal(facility)"
                    class="text-indigo-600 hover:text-indigo-900 font-semibold"
                  >
                    <i class="fas fa-edit"></i>
                  </button>
                  <button
                    @click="openDeleteFacilityModal(facility)"
                    class="text-red-600 hover:text-red-900 font-semibold"
                  >
                    <i class="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-else class="fill-height align-center justify-center">
        <div class="mx-auto text-center align-center w-[200px] h-[200px]">
          <div class="empty-text font-semibold mt-8">No Facilities</div>
        </div>
      </div>
    </div>

    <!-- Add new record to database Modal -->
    <v-dialog v-model="showModal" persistent max-width="800px">
      <div class="w-full mx-auto p-6 bg-white shadow-lg rounded-lg relative h-screen">
        <!-- Close button -->
        <button
          @click="closeFacilityModal"
          class="absolute top-4 right-4 text-gray-600 hover:text-red-500"
        >
          <i class="fas fa-times fa-lg"></i>
        </button>

        <p class="mb-4">
          {{ isEditing ? 'Edit existing facility' : 'Add a new facility' }}
        </p>

        <v-form ref="formRef" v-model="valid" lazy-validation>
          <v-select
            variant="outlined"
            color="#27bfa0"
            v-model="facilityForm.bank_id"
            :items="banks"
            item-title="name"
            item-value="id"
            label="Select Bank"
            required
          />

          <v-select
            variant="outlined"
            color="#27bfa0"
            v-model="facilityForm.facility_type"
            :items="facilityTypes"
            item-title="label"
            item-value="value"
            label="Facility Type"
            :rules="[(v) => !!v || 'Facility type is required']"
            required
          />

          <v-text-field
            variant="outlined"
            color="#27bfa0"
            v-model="formattedFacilityAmount"
            label="Facility Amount"
            required
          />

          <v-text-field
            variant="outlined"
            color="#27bfa0"
            v-model="facilityForm.borrowing_rate"
            label="Borrowing Rate (%)"
            type="number"
            required
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
                :model-value="facilityForm.drawdown_date"
                label="Drawdown Date"
                readonly
                :rules="[(v) => !!v || 'Drawdown date is required']"
              />
            </template>

            <v-date-picker
              :model-value="facilityForm.drawdown_date_obj"
              @update:model-value="
                (val) => {
                  facilityForm.drawdown_date_obj = val
                  facilityForm.drawdown_date = val ? val.toISOString().split('T')[0] : null
                  disburseMenu = false
                }
              "
            />
          </v-menu>

          <v-text-field
            variant="outlined"
            color="#27bfa0"
            v-model="facilityForm.tenure_days"
            label="Tenure (Days)"
            required
          />

          <div class="flex justify-end mt-6">
            <v-btn text @click="closeFacilityModal">Cancel</v-btn>
            <v-btn
              color="green"
              class="ml-3"
              :loading="loading"
              :disabled="!valid"
              @click="submitFacility"
            >
              {{ isEditing ? 'Update' : 'Save' }}
            </v-btn>
          </div>
        </v-form>
      </div>
    </v-dialog>

    <v-dialog v-model="showDeleteFacilityModal" max-width="420px">
      <v-card>
        <v-card-title class="text-lg font-bold">Delete Facility</v-card-title>

        <v-card-text>
          Are you sure you want to delete the facility
          <strong>{{ facilityToDelete?.bank_name || 'this facility' }}</strong>
          <span v-if="facilityToDelete"> — {{ facilityToDelete.facility_type }}</span
          >?
        </v-card-text>

        <v-card-actions class="justify-end">
          <v-btn text color="gray" @click="cancelDeleteFacility">Cancel</v-btn>
          <v-btn color="red" dark @click="confirmDeleteFacility" :loading="loading">Delete</v-btn>
        </v-card-actions>
      </v-card>
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
