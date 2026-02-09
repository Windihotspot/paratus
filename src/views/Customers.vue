<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import MainLayout from '@/layouts/full/MainLayout.vue'
import { supabase } from '@/services/supabase.js'
import { useAuthStore } from '@/stores/auth'
import { ElMessage, ElNotification, ElMessageBox } from 'element-plus'
import { usePhoneNumber } from '@/composables/usePhoneNumber.js'
const authStore = useAuthStore()
const merchantId = authStore.merchant.id
const errorMessage = ref(null)
const customers = ref([])
const showModal = ref(false)
const loading = ref(false)

const formRef = ref(null)
const valid = ref(false)

const customer = ref({
  first_name: '',
  last_name: '',
  primary_email: '',
  other_emails: [], // array of strings
  phone: '',
  account_number: '',
  facility_id: null,
  notification_preference: 'none'
})

const notificationOptions = [
  { label: 'SMS', value: 'sms' },
  { label: 'Email', value: 'email' },
  { label: 'Email & SMS', value: 'email_sms' },
  { label: 'None', value: 'none' }
]

const { phone, validate: validatePhone } = usePhoneNumber(customer.value.phone)

watch(
  () => customer.value.phone,
  (val) => {
    if (val !== phone.value) phone.value = val
  }
)

watch(phone, (val) => {
  if (customer.value.phone !== val) customer.value.phone = val
})

const facilities = computed(() => authStore.facilities)
const closeModal = () => {
  showModal.value = false
  if (formRef.value) formRef.value.reset()
  // Reset the customer form
  customer.value = {
    first_name: '',
    last_name: '',
    email: '',
    other_emails: [],
    phone: '',
    account_number: '',
    facility_id: null
  }

  // Reset edit state
  isEditingCustomer.value = false
  editingCustomerId.value = null
}

// Fetch available banks
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

const submitCustomer = async () => {
  if (!formRef.value) return
  const formValid = await formRef.value.validate()
  if (!formValid) {
    ElMessage({
      message: 'Please fix the form errors',
      type: 'error',
      duration: 2000
    })
    return
  }

  loading.value = true

  try {
    if (isEditingCustomer.value) {
      ElMessage({ message: 'Updating customer...', type: 'info', duration: 1500 })

      const emailsPayload = []

      if (customer.value.primary_email) {
        emailsPayload.push({
          email: customer.value.primary_email.trim(),
          is_primary: true
        })
      }

      customer.value.other_emails
        .filter((e) => e && e.trim())
        .forEach((e) => {
          emailsPayload.push({
            email: e.trim(),
            is_primary: false
          })
        })

      const { data, error } = await supabase.rpc('update_customer_with_emails', {
        p_customer_id: editingCustomerId.value,
        p_first_name: customer.value.first_name,
        p_last_name: customer.value.last_name,
        p_middle_name: customer.value.middle_name ?? null,
        p_gender: customer.value.gender ?? null,
        p_dob: customer.value.dob ?? null,
        p_phone: customer.value.phone?.trim() || null,
        p_national_id_type: customer.value.national_id_type ?? null,
        p_national_id_number: customer.value.national_id_number ?? null,
        p_marital_status: customer.value.marital_status ?? null,
        p_account_number: customer.value.account_number,
        p_status: customer.value.status || 'active',
        p_address: customer.value.address ?? null,
        p_bank_id: customer.value.bank_id ?? null,
        p_notification_preference: customer.value.notification_preference,
        p_emails: emailsPayload
      })

      if (error) throw error
      ElNotification({
        title: 'Success',
        message: 'Customer updated successfully!',
        type: 'success'
      })
    } else {
      // 🟢 Add new customer
      ElMessage({ message: 'Adding customer...', type: 'info', duration: 1500 })

      const emailsPayload = []

      if (customer.value.primary_email) {
        emailsPayload.push({
          email: customer.value.primary_email.trim(),
          is_primary: true
        })
      }

      customer.value.other_emails
        .filter((e) => e && e.trim())
        .forEach((e) => {
          emailsPayload.push({
            email: e.trim(),
            is_primary: false
          })
        })

      const { data, error } = await supabase.rpc('add_customer_with_emails', {
        p_merchant_id: merchantId,
        p_first_name: customer.value.first_name,
        p_last_name: customer.value.last_name,
        p_phone: customer.value.phone?.trim() || null,
        p_account_number: customer.value.account_number,
        p_facility_id: customer.value.facility_id,
        p_notification_preference: customer.value.notification_preference,
        p_emails: emailsPayload
      })

      if (error) throw error

      ElNotification({
        title: 'Success',
        message: 'Customer added successfully!',
        type: 'success'
      })
    }

    closeModal()
    fetchCustomers()
  } catch (err) {
    console.error('Error saving customer:', err)
    ElNotification({
      title: 'Error',
      message: err.message || 'Failed to save customer',
      type: 'error'
    })
  } finally {
    loading.value = false
  }
}

const agent = ref({
  id: null,
  full_name: '',
  email: '',
  phone: ''
})

onMounted(() => {
  fetchCustomers()
  authStore.fetchFacilities()
})

const fetchCustomers = async () => {
  loading.value = true
  errorMessage.value = null

  try {
    const { data, error } = await supabase.rpc('get_merchant_customers_email', {
      p_merchant_id: authStore.merchant.id,
      p_facility_id: authStore.selectedFacility?.id || null
    })
    console.log('merchant customers:', data)
    if (error) throw error
    customers.value = (data || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  } catch (err) {
    console.error('fetchCustomers error:', err)
    errorMessage.value = 'Failed to load customers'
  } finally {
    loading.value = false
  }
}

const showDeleteModal = ref(false)
const customerToDelete = ref(null)

const openDeleteModal = (customerData) => {
  customerToDelete.value = customerData
  showDeleteModal.value = true
}

const confirmDeleteCustomer = async () => {
  if (!customerToDelete.value) return
  loading.value = true

  try {
    const { data, error } = await supabase.rpc('delete_customer', {
      p_customer_id: customerToDelete.value.id
    })
    if (error) throw error

    ElNotification({
      title: 'Deleted',
      message: 'Customer deleted successfully!',
      type: 'success'
    })
    await fetchCustomers()
  } catch (err) {
    console.error('Error deleting customer:', err)
    ElNotification({
      title: 'Error',
      message: err.message,
      type: 'error'
    })
  } finally {
    loading.value = false
    showDeleteModal.value = false
    customerToDelete.value = null
  }
}

const cancelDelete = () => {
  showDeleteModal.value = false
  customerToDelete.value = null
}

const isEditingCustomer = ref(false)
const editingCustomerId = ref(null)
const editCustomer = (customerData) => {
  isEditingCustomer.value = true
  editingCustomerId.value = customerData.id

  const primary = customerData.emails?.find((e) => e.is_primary)

  customer.value = {
    first_name: customerData.first_name,
    last_name: customerData.last_name,
    primary_email: primary?.email || '',
    other_emails: (customerData.emails || []).filter((e) => !e.is_primary).map((e) => e.email),
    phone: customerData.phone,
    account_number: customerData.account_number,
    facility_id: customerData.facility_id
  }

  showModal.value = true
}

const openModal = () => {
  isEditingCustomer.value = false
  editingCustomerId.value = null
  showModal.value = true
}

const selectedFacility = computed(() => authStore.selectedFacility)

watch(
  () => selectedFacility.value?.id,
  async (newVal, oldVal) => {
    console.log('🔄 Facility changed in store:', oldVal, '➡️', newVal)
    if (newVal && newVal !== oldVal) {
      await fetchCustomers()
    }
  },
  { immediate: true }
)

const sendExpirySMS = async (customer) => {
  if (!customer.phone) {
    ElMessage({
      message: 'Customer has no phone number',
      type: 'warning'
    })
    return
  }

  // Confirm sending SMS
  const confirmed = await ElMessageBox.confirm(
    `Send expiry SMS to ${customer.full_name}?`,
    'Confirm SMS',
    { type: 'warning' }
  ).catch(() => false) // cancel returns false

  if (!confirmed) return

  try {
    ElMessage({
      message: 'Sending SMS...',
      type: 'info',
      duration: 1500
    })

    // Replace URL with your deployed Supabase Edge Function
    const EDGE_FUNCTION_URL =
      'https://ytvqldflnqwflahxjjzu.functions.supabase.co/send-sms-on-demand'

    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ customer_id: customer.id })
    })

    const result = await response.json()

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Failed to send SMS')
    }

    ElNotification({
      title: 'SMS Sent',
      message: `Expiry reminder sent successfully (${result.daysLeft} day${result.daysLeft !== 1 ? 's' : ''} left)`,
      type: 'success'
    })

    console.log('SMS response:', result.smsResponse)
  } catch (err) {
    console.error(err)
    ElNotification({
      title: 'Error',
      message: err.message || 'Failed to send SMS',
      type: 'error'
    })
  }
}

const sendTestSMS = async () => {
  try {
    ElMessage({
      message: 'Sending test SMS...',
      type: 'info',
      duration: 1500
    })

    const response = await fetch('http://localhost:4000/sms/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phone: '2349132378328'
      })
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'SMS failed')
    }

    ElNotification({
      title: 'Success',
      message: 'Test SMS sent successfully!',
      type: 'success'
    })

    console.log('SMS response:', result)
  } catch (err) {
    console.error(err)
    ElNotification({
      title: 'Error',
      message: err.message || 'Failed to send test SMS',
      type: 'error'
    })
  }
}

onMounted(() => {
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
        <!-- <v-btn color="green" class="ml-3" @click="sendTestSMS"> Send Test SMS </v-btn> -->

        <div class="overflow-x-auto bg-white shadow rounded-lg">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-green-50 font-semibold">
              <tr>
                <th class="px-6 py-3 text-left text-xs uppercase tracking-wider">Name</th>
                <th class="px-6 py-3 text-left text-xs uppercase tracking-wider">Primary Email</th>
                <th class="px-6 py-3 text-left text-xs uppercase tracking-wider">Phone</th>
                <th class="px-6 py-3 text-left text-xs uppercase tracking-wider">Created Date</th>
                <th class="px-6 py-3 text-left text-xs uppercase tracking-wider">Notifications</th>
                <th class="px-6 py-3 text-left text-xs uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-center text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="customer in customers" :key="customer.id">
                <!-- Name -->
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {{ customer.full_name }}
                </td>

                <!-- Primary Email -->
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {{ customer.email || 'N/A' }}
                </td>

                <!-- Other Emails -->
                <!-- <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
  <div v-if="customer.emails && customer.emails.length > 1">
    <ul class="list-disc list-inside text-xs text-gray-500">
      <li
        v-for="(email, i) in customer.emails.filter(e => !e.is_primary)"
        :key="i"
      >
        {{ email.email }}
      </li>
    </ul>
  </div>
  <div v-else class="text-xs text-gray-400">None</div>
</td> -->

                <!-- Phone -->
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {{ customer.phone || 'N/A' }}
                </td>

                <!-- Created Date -->
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {{ customer.created_at }}
                </td>

                <!-- Notifications -->
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                  <span
                    :class="{
                      'px-2 inline-flex text-xs leading-5 font-semibold rounded-full': true,
                      'bg-blue-100 text-blue-800': customer.notification_preference === 'sms',
                      'bg-yellow-100 text-yellow-800': customer.notification_preference === 'email',
                      'bg-green-100 text-green-800':
                        customer.notification_preference === 'email_sms',
                      'bg-gray-100 text-gray-800': customer.notification_preference === 'none'
                    }"
                  >
                    {{ customer.notification_preference.replace('_', ' & ').toUpperCase() }}
                  </span>
                </td>

                <!-- Status -->
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

                <!-- Actions -->
                <td
                  class="px-6 flex gap-4 py-4 whitespace-nowrap text-center text-sm font-medium justify-center"
                >
                  <button
                    class="text-indigo-600 hover:text-indigo-900 font-semibold"
                    @click="editCustomer(customer)"
                  >
                    <i class="fas fa-edit"></i>
                  </button>
                  <button
                    class="text-red-600 hover:text-red-900"
                    @click="openDeleteModal(customer)"
                  >
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
          <div class="empty-text font-semibold mt-8">No Customers</div>
        </div>
      </div>
    </div>

    <!-- Delete Customer Modal -->
    <v-dialog v-model="showDeleteModal" max-width="400px">
      <v-card>
        <v-card-title class="text-lg font-bold">Delete Customer</v-card-title>
        <v-card-text>
          Are you sure you want to delete
          <strong>{{ customerToDelete?.full_name }}</strong
          >?
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn text color="gray" @click="cancelDelete">Cancel</v-btn>
          <v-btn color="red" dark @click="confirmDeleteCustomer" :loading="loading">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Add/ edit Customer Modal -->
  <v-dialog v-model="showModal" persistent scrollable max-width="800px">
  <div class="w-full mx-auto p-6 bg-white shadow-lg rounded-lg relative">
    <!-- Close button -->
    <button @click="closeModal" class="absolute top-4 right-4 text-gray-600 hover:text-red-500">
      <i class="fas fa-times fa-lg"></i>
    </button>

    <h2 class="text-lg font-bold mb-4">
      {{ isEditingCustomer ? 'Edit Customer' : 'Add a new customer' }}
    </h2>

    <v-form ref="formRef" v-model="valid" lazy-validation>
      <v-row dense>
        <!-- First Name -->
        <v-col cols="6">
          <v-text-field
            variant="outlined"
            color="#27bfa0"
            v-model="customer.first_name"
            label="First Name"
            :rules="[(v) => !!v || 'First name is required']"
            required
          />
        </v-col>

        <!-- Last Name -->
        <v-col cols="6">
          <v-text-field
            variant="outlined"
            color="#27bfa0"
            v-model="customer.last_name"
            label="Last Name"
            :rules="[(v) => !!v || 'Last name is required']"
            required
          />
        </v-col>

        <!-- Primary Email -->
        <v-col cols="6">
          <v-text-field
            variant="outlined"
            color="#27bfa0"
            v-model="customer.primary_email"
            label="Primary Email"
            type="email"
          />
        </v-col>

        <!-- Phone -->
        <v-col cols="6">
          <v-text-field
            variant="outlined"
            color="#27bfa0"
            v-model="phone"
            label="Phone"
            :rules="[
              (v) => !!v || 'Phone number is required',
              (v) => validatePhone() || 'Phone must start with 234'
            ]"
          />
        </v-col>

        <!-- Account Number -->
        <v-col cols="6">
          <v-text-field
            variant="outlined"
            color="#27bfa0"
            v-model="customer.account_number"
            label="Account Number"
          />
        </v-col>

        <!-- Facility -->
        <v-col cols="6">
          <v-select
            :disabled="isEditingCustomer"
            variant="outlined"
            color="#27bfa0"
            v-model="customer.facility_id"
            :items="facilities"
            item-title="bank_name"
            item-value="id"
            label="Facility"
            :rules="[(v) => !!v || 'Bank is required']"
            required
          />
        </v-col>

        <!-- Notification Preference -->
        <v-col cols="6">
          <v-select
            v-model="customer.notification_preference"
            :items="notificationOptions"
            label="Notification Preference"
            item-title="label"
            item-value="value"
            variant="outlined"
            color="#27bfa0"
            dense
            class="mb-4 mt-4"
          />
        </v-col>

        <!-- Spacer to balance grid if needed -->
        <v-col cols="6"></v-col>

        <!-- Other Emails (Full width for better UX) -->
        <v-col cols="12">
          <v-combobox
            v-model="customer.other_emails"
            label="Other Emails"
            multiple
            chips
            clearable
            variant="outlined"
            color="#27bfa0"
            hint="Press enter after each email"
            persistent-hint
          />
        </v-col>
      </v-row>

      <!-- Action Buttons -->
      <div class="flex justify-end mt-6">
        <v-btn text @click="closeModal">Cancel</v-btn>
        <v-btn
          color="green"
          class="ml-3"
          @click="submitCustomer"
          :loading="loading"
          :disabled="loading"
        >
          {{ isEditingCustomer ? 'Update' : 'Save' }}
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
