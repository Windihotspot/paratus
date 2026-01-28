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
          <!-- <thead class="bg-gray-50">
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
          </thead> -->
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="log in logs" :key="log.id" class="hover:bg-gray-50">
              <!-- Performed By + Entity -->
              <td class="px-4 py-3 text-sm">
                <div class="font-medium text-gray-900 line-clamp-1">
                  {{ log.performed_by || '-' }}
                </div>
              </td>
              <td class="px-4 py-3 text-xs">
                <div class="text-gray-500 line-clamp-1">
                  <div class="text-gray-500 line-clamp-1 mt-2">
                    <v-chip v-if="isSmsLog(log)" size="x-small" variant="text" color="blue">
                      SMS
                    </v-chip>

                    <v-chip
                      v-else-if="isEmailLog(log)"
                      size="x-small"
                      variant="text"
                      color="purple"
                    >
                      EMAIL
                    </v-chip>
                  </div>

                  <div>
                    {{ log.metadata?.provider || '-' }}
                  </div>
                </div>
              </td>

              <!-- Date + Time -->
              <td class="px-4 py-3 text-sm">
                <div class="font-medium text-gray-900">
                  {{ new Date(log.created_at).toLocaleDateString() }}
                </div>
                <div class="text-xs text-gray-500">
                  {{ new Date(log.created_at).toLocaleTimeString() }}
                </div>
              </td>

              <!-- Customer (Name + Phone) -->
              <td class="px-4 py-3 text-sm">
                <div v-if="isSmsLog(log)">
                  <div class="font-medium text-gray-900 line-clamp-1">
                    {{ log.metadata?.customer_name || '-' }}
                  </div>
                  <div class="text-xs text-gray-500 line-clamp-1">
                    {{ log.metadata?.customer_phone || '-' }}
                  </div>
                </div>
              </td>

              <!-- Email (only for email logs) -->
              <td class="px-4 py-3 text-sm">
                <div v-if="isEmailLog(log)">
                  <div class="text-xs text-gray-500 break-all line-clamp-2">
                    <div class="font-medium text-gray-900 line-clamp-1">
                      {{ log.metadata?.customer_name || '-' }}
                    </div>
                    {{ log.metadata?.customer_email || '-' }}
                  </div>
                </div>
              </td>

              <!-- Loan (Amount + Days Left) -->
              <td class="px-4 py-3 text-sm">
                <div class="font-medium text-gray-900">
                  {{ formatCurrency(log.metadata?.loan_amount ?? '-') }}
                </div>
                <div class="text-xs text-gray-500">
                  {{ normalizeMetadata(log).loan_days_left ?? '-' }} days left
                </div>
              </td>

              <!-- Status -->
              <td class="px-4 py-3 text-sm">
                <v-chip
                  size="x-small"
                  :color="
                    isSmsLog(log)
                      ? getSmsStatus(log) === 'sent'
                        ? 'green'
                        : 'red'
                      : getEmailStatus(log) === 'sent'
                        ? 'green'
                        : 'red'
                  "
                  text-color="white"
                >
                  {{ isSmsLog(log) ? getSmsStatus(log) : getEmailStatus(log) }}
                </v-chip>
              </td>

              <!-- Action -->
              <td class="px-4 py-3 text-sm">
                <v-btn
                  size="x-small"
                  variant="outlined"
                  color="primary"
                  @click="openViewDialog(log)"
                >
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
                    :model-value="normalizeMetadata(selectedLog).loan_days_left"
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
                      :color="getSmsStatus(selectedLog) === 'sent' ? 'green' : 'red'"
                      text-color="white"
                    >
                      {{ getSmsStatus(selectedLog) }}
                    </v-chip>
                  </v-col>

                  <v-col cols="12" md="4">
                    <v-text-field
                      label="Balance After SMS"
                      :model-value="selectedLog.metadata?.sms_response?.balance"
                      readonly
                      variant="outlined"
                      prepend-inner-icon="mdi-wallet"
                    />

                    <v-text-field
                      label="SMS Cost"
                      :model-value="normalizeSmsDelivery(selectedLog).cost || '-'"
                      readonly
                      variant="outlined"
                      prepend-inner-icon="mdi-currency-ngn"
                    />
                  </v-col>

                  <v-col cols="12" md="4">
                    <v-text-field
                      label="Balance"
                      :model-value="normalizeSmsDelivery(selectedLog).balance"
                      readonly
                      variant="outlined"
                      prepend-inner-icon="mdi-wallet"
                    />
                  </v-col>

                  <v-col cols="12">
                    <v-textarea
                      label="Raw Provider Response"
                      :model-value="JSON.stringify(normalizeSmsDelivery(selectedLog).raw, null, 2)"
                      readonly
                      auto-grow
                      variant="outlined"
                      prepend-inner-icon="mdi-code-json"
                    />

                    <!-- <v-textarea
                      label="Raw Provider Data"
                      :model-value="
                        JSON.stringify(selectedLog.metadata?.sms_response?.data, null, 2)
                      "
                      readonly
                      auto-grow
                      variant="outlined"
                      prepend-inner-icon="mdi-code-json"
                    /> -->
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
                        JSON.stringify(normalizeEmailDelivery(selectedLog).raw, null, 2)
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

const normalizeMetadata = (log) => {
  const m = log?.metadata || {}

  return {
    customer_name: m.customer_name || '-',
    customer_email: m.customer_email || '-',
    customer_phone: m.customer_phone || '-',
    loan_amount: m.loan_amount ?? null,
    loan_days_left: m.loan_days_left ?? m.days_left ?? null,
    loan_expiry_date: m.loan_expiry_date ?? null
  }
}

const normalizeEmailDelivery = (log) => {
  const metadata = log?.metadata || {}
  const provider = (metadata.provider || 'unknown').toLowerCase()
  const emailResp = metadata.email_response || {}

  // Use inner response if it exists, else fallback to emailResp itself
  const innerRes = emailResp.response || emailResp

  let status = 'failed'
  let messageId = innerRes.message_id || innerRes.data || null
  let balance = innerRes.balance ?? 0

  if (provider === 'termii') {
    // Termii: code ok/success => sent
    status = ['ok', 'success'].includes(String(innerRes.code).toLowerCase()) ? 'sent' : 'failed'
  } else if (provider === 'kudi') {
    // Kudi: success === true && status === 'success'
    const success = emailResp.success === true && innerRes.status === 'success'
    status = success ? 'sent' : 'failed'
    balance = innerRes.balance ?? balance
    messageId = innerRes.data ?? messageId
  } else {
    // fallback
    if (metadata.email_status) status = metadata.email_status
  }

  return {
    provider,
    channel: 'email',
    status,
    messageId,
    balance,
    raw: emailResp
  }
}



const getEmailStatus = (log) => {
  return normalizeEmailDelivery(log).status
}

const normalizeSmsDelivery = (log) => {
  const metadata = log?.metadata || {}
  const provider = metadata.provider || 'unknown'
  const res = metadata.sms_response || {}

  let status = 'failed'
  let messageId = metadata.sms_message_id || null
  let balance = res.balance ?? metadata.sms_balance ?? 0
  let cost = res.cost ?? metadata.sms_cost ?? 0

  // Provider-specific logic
  switch (provider.toLowerCase()) {
    case 'termii':
      status = ['ok', 'success'].includes(String(res.code).toLowerCase()) ? 'sent' : 'failed'
      messageId = res.message_id || res.message_id_str || messageId
      balance = res.balance ?? balance
      cost = res.cost ?? cost
      break

    case 'kudi':
      const success = (res.status === 'success' || res.success === true) && (res.error_code === '000' || res.response?.status === 'success')
      status = success ? 'sent' : 'failed'
      messageId = res.message_id || res.response?.data || messageId
      balance = res.balance ?? res.response?.balance ?? balance
      cost = res.cost ?? cost
      break

    default:
      // fallback: use metadata.sms_status if present
      if (metadata.sms_status) status = metadata.sms_status
      break
  }

  return { provider, channel: 'sms', status, messageId, balance, cost, raw: res }
}


const getSmsStatus = (log) => {
  return normalizeSmsDelivery(log).status
}

onMounted(fetchLogs)
</script>
