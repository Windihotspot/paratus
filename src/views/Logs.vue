<template>
  <MainLayout>
    <div class="p-6 min-h-screen">
      <h1 class="text-md font-semibold mb-6">Audit Logs</h1>

      <div v-if="loading" class="flex flex-col items-center justify-center min-h-[200px]">
        <v-progress-circular indeterminate color="#27bfa0" size="40" width="4" />
        <span class="mt-2 text-gray-600 text-sm">Loading logs</span>
      </div>

      <div v-else-if="logs.length > 0" class="overflow-x-auto bg-white rounded-lg shadow-md">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Performed By
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>

              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Sent At
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Customer Name
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Customer Phone
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>

              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Loan Amount
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Loan Days Left
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Delivery Status
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="log in logs" :key="log.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {{ log.performed_by || '-' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                <v-chip
                  variant="text"
                  v-if="isSmsLog(log)"
                  color="blue"
                  text-color="white"
                  size="small"
                >
                  SMS
                </v-chip>

                <v-chip
                  v-else-if="isEmailLog(log)"
                  variant="text"
                  color="purple"
                  text-color="white"
                  size="small"
                >
                  EMAIL
                </v-chip>
              </td>

              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {{ formatDate(log.created_at) }}
              </td>

              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {{ log.metadata?.customer_name || '-' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {{ log.metadata?.customer_phone || '-' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                <span v-if="isEmailLog(log)">
                  {{ log.metadata?.customer_email || '-' }}
                </span>
                <span v-else>-</span>
              </td>

              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {{ formatCurrency(log.metadata?.loan_amount ?? '-') }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {{ log.metadata?.loan_days_left ?? '-' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                <!-- SMS -->
                <template v-if="isSmsLog(log)">
                  <v-chip
                    v-if="log.metadata?.sms_response?.status === 'success'"
                    color="green"
                    text-color="white"
                  >
                    success
                  </v-chip>
                  <v-chip v-else color="red" text-color="white"> failed </v-chip>
                </template>

                <!-- EMAIL -->
                <template v-else-if="isEmailLog(log)">
                  <v-chip
                    :color="getEmailStatus(log) === 'sent' ? 'green' : 'red'"
                    text-color="white"
                  >
                    {{ getEmailStatus(log) }}
                  </v-chip>
                </template>
              </td>

              <td class="px-6 py-4 whitespace-nowrap">
                <v-btn size="small" variant="outlined" color="primary" @click="openViewDialog(log)">
                  View
                </v-btn>
              </td>
            </tr>
          </tbody>
        </table>

        <v-dialog v-model="viewDialog" max-width="900">
          <v-card>
            <v-card-title class="font-semibold"> Audit Log Details </v-card-title>

            <v-card-text v-if="selectedLog">
              <v-row dense>
                <!-- ================= SHARED INFO ================= -->
                <v-col cols="12" md="6">
                  <v-text-field
                    label="Action"
                    :model-value="selectedLog.action"
                    readonly
                    variant="outlined"
                    prepend-inner-icon="mdi-flash"
                  />
                </v-col>

                <v-col cols="12" md="6">
                  <v-text-field
                    label="Performed By"
                    :model-value="selectedLog.performed_by"
                    readonly
                    variant="outlined"
                    prepend-inner-icon="mdi-account"
                  />
                </v-col>

                <v-col cols="12" md="6">
                  <v-text-field
                    label="Entity"
                    :model-value="selectedLog.entity"
                    readonly
                    variant="outlined"
                    prepend-inner-icon="mdi-database"
                  />
                </v-col>

                <v-col cols="12" md="6">
                  <v-text-field
                    label="Created At"
                    :model-value="formatDate(selectedLog.created_at)"
                    readonly
                    variant="outlined"
                    prepend-inner-icon="mdi-calendar"
                  />
                </v-col>

                <v-col cols="12" md="6">
                  <v-text-field
                    label="Customer Name"
                    :model-value="selectedLog.metadata?.customer_name"
                    readonly
                    variant="outlined"
                    prepend-inner-icon="mdi-account-circle"
                  />
                </v-col>

                <v-col cols="12" md="6">
                  <v-text-field
                    label="Loan Amount"
                    :model-value="formatCurrency(selectedLog.metadata?.loan_amount)"
                    readonly
                    variant="outlined"
                    prepend-inner-icon="mdi-cash"
                  />
                </v-col>

                <v-col cols="12" md="6">
                  <v-text-field
                    label="Days Left"
                    :model-value="selectedLog.metadata?.loan_days_left"
                    readonly
                    variant="outlined"
                    prepend-inner-icon="mdi-timer"
                  />
                </v-col>

                <v-col cols="12" md="6">
                  <v-text-field
                    label="Expiry Date"
                    :model-value="selectedLog.metadata?.loan_expiry_date"
                    readonly
                    variant="outlined"
                    prepend-inner-icon="mdi-calendar-alert"
                  />
                </v-col>

                <!-- ================= SMS SECTION ================= -->
                <template v-if="isSmsLog(selectedLog)">
                  <v-col cols="12">
                    <v-divider class="my-4" />
                    <h3 class="font-semibold mb-2">SMS Details</h3>
                  </v-col>

                  <v-col cols="12" md="6">
                    <v-text-field
                      label="Customer Phone"
                      :model-value="selectedLog.metadata?.customer_phone"
                      readonly
                      variant="outlined"
                      prepend-inner-icon="mdi-phone"
                    />
                  </v-col>

                  <v-col cols="12">
                    <v-textarea
                      label="SMS Message"
                      :model-value="selectedLog.metadata?.sms_message"
                      readonly
                      auto-grow
                      variant="outlined"
                      prepend-inner-icon="mdi-message-text"
                    />
                  </v-col>

                  <v-col cols="12" md="4">
                    <v-chip
                      v-if="selectedLog.metadata?.sms_response?.status === 'success'"
                      color="green"
                      text-color="white"
                    >
                      success
                    </v-chip>
                    <v-chip v-else color="red" text-color="white"> failed </v-chip>
                  </v-col>

                  <v-col cols="12" md="4">
                    <v-text-field
                      label="SMS Cost"
                      :model-value="selectedLog.metadata?.sms_response?.cost"
                      readonly
                      variant="outlined"
                      prepend-inner-icon="mdi-currency-ngn"
                    />
                  </v-col>

                  <v-col cols="12" md="4">
                    <v-text-field
                      label="Balance"
                      :model-value="selectedLog.metadata?.sms_response?.balance"
                      readonly
                      variant="outlined"
                      prepend-inner-icon="mdi-wallet"
                    />
                  </v-col>

                  <v-col cols="12">
                    <v-textarea
                      label="Raw Provider Data"
                      :model-value="
                        JSON.stringify(selectedLog.metadata?.sms_response?.data, null, 2)
                      "
                      readonly
                      auto-grow
                      variant="outlined"
                      prepend-inner-icon="mdi-code-json"
                    />
                  </v-col>
                </template>

                <!-- ================= EMAIL SECTION ================= -->
                <template v-if="isEmailLog(selectedLog)">
                  <v-col cols="12">
                    <v-divider class="my-4" />
                    <h3 class="font-semibold mb-2">Email Details</h3>
                  </v-col>

                  <v-col cols="12" md="6">
                    <v-text-field
                      label="Customer Email"
                      :model-value="selectedLog.metadata?.customer_email"
                      readonly
                      variant="outlined"
                      prepend-inner-icon="mdi-email"
                    />
                  </v-col>

                  <v-col cols="12">
                    <v-textarea
                      label="Email Message"
                      :model-value="selectedLog.metadata?.email_message"
                      readonly
                      auto-grow
                      variant="outlined"
                      prepend-inner-icon="mdi-email-outline"
                    />
                  </v-col>

                  <v-col cols="12" md="4">
                    <v-chip
                      :color="getEmailStatus(selectedLog) === 'sent' ? 'green' : 'red'"
                      text-color="white"
                    >
                      {{ getEmailStatus(selectedLog) }}
                    </v-chip>
                  </v-col>

                  <v-col cols="12" md="8">
                    <v-textarea
                      label="Provider Response"
                      :model-value="
                        JSON.stringify(selectedLog.metadata?.email_response?.response, null, 2)
                      "
                      readonly
                      auto-grow
                      variant="outlined"
                      prepend-inner-icon="mdi-information-outline"
                    />
                  </v-col>
                </template>
              </v-row>
            </v-card-text>

            <v-card-actions>
              <v-spacer />
              <v-btn variant="text" @click="viewDialog = false"> Close </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </div>
      <!-- Empty State -->
      <div v-else class="fill-height align-center justify-center">
        <div class="mx-auto text-center align-center w-[200px] h-[200px]">
          <div class="empty-text font-semibold mt-8">No logs</div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import MainLayout from '@/layouts/full/MainLayout.vue'
import { supabase } from '@/services/supabase.js'

const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || amount === '') return '-'

  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2
  }).format(Number(amount))
}

const logs = ref([])
const loading = ref(false)

const viewDialog = ref(false)
const selectedLog = ref(null)

const fetchLogs = async () => {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
    console.log('logs:', data)
    if (error) throw error
    logs.value = data || []
  } catch (err) {
    console.error('Error fetching audit logs:', err)
  } finally {
    loading.value = false
  }
}

const openViewDialog = (log) => {
  selectedLog.value = log
  viewDialog.value = true
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString()
}

const isSmsLog = (log) => log?.action?.includes('SMS') || !!log?.metadata?.sms_response

const isEmailLog = (log) => log?.action?.includes('EMAIL') || !!log?.metadata?.email_response

const getEmailStatus = (log) => {
  const status =
    log?.metadata?.email_response?.response?.status ||
    log?.metadata?.email_response?.status

  if (!status) return 'failed'

  if (['sent', 'success', 'ok'].includes(status.toLowerCase())) {
    return 'sent'
  }

  return 'failed'
}

onMounted(fetchLogs)
</script>
