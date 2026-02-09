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
    <div class="font-medium text-gray-900 line-clamp-1">
      {{ normalizeMetadata(log).customer_name || '-' }}
    </div>

    <div
      v-for="(email, idx) in getAllCustomerEmails(log)"
      :key="idx"
      class="text-xs text-gray-500 break-all"
    >
      • {{ email }}
    </div>

    <div
      v-if="!getAllCustomerEmails(log).length"
      class="text-xs text-gray-400 italic"
    >
      No emails recorded
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
          : getEmailStatus(log) === 'partial'
            ? 'orange'
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

  <v-col cols="12">
    <v-table density="compact">
      <thead>
        <tr>
          <th>Email</th>
          <th>Status</th>
          <th>Message</th>
          <th>Message ID</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(d, idx) in normalizeEmailDeliveries(selectedLog)"
          :key="idx"
        >
          <td class="text-sm break-all">{{ d.email }}</td>
          <td>
            <v-chip
              size="x-small"
              :color="d.status === 'sent' ? 'green' : 'red'"
              text-color="white"
            >
              {{ d.status }}
            </v-chip>
          </td>
          <td class="text-xs">{{ d.message || '-' }}</td>
          <td class="text-xs">{{ d.messageId || '-' }}</td>
        </tr>
      </tbody>
    </v-table>
  </v-col>

  <v-col cols="12">
    <v-textarea
      label="Raw Provider Data"
      :model-value="
        JSON.stringify(normalizeEmailDeliveries(selectedLog), null, 2)
      "
      readonly
      auto-grow
      variant="outlined"
      prepend-inner-icon="mdi-code-json"
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

const logs = ref([])
const loading = ref(false)

const viewDialog = ref(false)
const selectedLog = ref(null)

const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || amount === '') return '-'

  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2
  }).format(Number(amount))
}

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
  console.log('Selected log:', log)
  selectedLog.value = log
  viewDialog.value = true
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString()
}

/* ================= TYPE CHECKERS ================= */

const isSmsLog = (log) =>
  log?.action?.includes('SMS') || !!log?.metadata?.sms_response

const isEmailLog = (log) => {
  const m = log?.metadata || {}

  return (
    typeof log?.action === 'string' &&
    log.action.toUpperCase().includes('EMAIL')
  ) || !!m.email_response || Array.isArray(m.email_responses)
}

const getAllCustomerEmails = (log) => {
  const m = log?.metadata || {}

  // NEW STRUCTURE
  if (Array.isArray(m.customer_emails) && m.customer_emails.length) {
    return m.customer_emails.filter(Boolean)
  }

  // OLD STRUCTURE
  if (m.customer_email) {
    return [m.customer_email]
  }

  return []
}

/* ================= NORMALIZERS ================= */

const normalizeMetadata = (log) => {
  const m = log?.metadata || {}

  return {
    customer_name: m.customer_name || '-',
    customer_emails: Array.isArray(m.customer_emails) ? m.customer_emails : [],
    loan_amount: m.loan_amount ?? null,
    loan_days_left: m.loan_days_left ?? m.days_left ?? null,
    loan_expiry_date: m.loan_expiry_date ?? null
  }
}

/* ================= EMAIL (MULTI) ================= */

const normalizeEmailDeliveries = (log) => {
  const m = log?.metadata || {};
  const provider = (m.provider || 'unknown').toLowerCase();
  let deliveries = [];

  const mapStatus = (res) => {
    const s = (res?.status || res?.code || '').toString().toLowerCase();
    return ['ok', 'success'].includes(s) ? 'sent' : 'failed';
  };

  // Multi-email
  if (Array.isArray(m.email_responses)) {
    deliveries = m.email_responses.map((item) => {
      const email = item?.email || '-';
      const wrapper = item?.response || {};
      const res = wrapper?.response || wrapper || {};
      const status = mapStatus(res);

      return {
        email,
        raw: item,
        code: res?.code || wrapper?.code || status,
        message: res?.message || res?.msg || '-',
        messageId: res?.message_id || res?.data || '-',
        balance: res?.balance ?? null,
        status,
        cost: res?.cost ?? null,
        error_code: res?.error_code ?? null,
        addresses: res?.addresses ?? [],
        success: status === 'sent',
      };
    });
  }
  // Single-email
  else if (m.email_response) {
    const wrapper = m.email_response || {};
    const res = wrapper?.response || wrapper || {};
    const status = mapStatus(res);

    deliveries = [
      {
        email: m.customer_email || '-',
        raw: m.email_response,
        code: res?.code || wrapper?.code || status,
        message: res?.message || res?.msg || '-',
        messageId: res?.message_id || res?.data || '-',
        balance: res?.balance ?? null,
        status,
        cost: res?.cost ?? null,
        error_code: res?.error_code ?? null,
        addresses: res?.addresses ?? [],
        success: status === 'sent',
      }
    ];
  }

  return deliveries.map((d) => ({ ...d, provider }));
};



/* Overall email status for table chip */
const getEmailStatus = (log) => {
  const deliveries = normalizeEmailDeliveries(log)
  if (!deliveries.length) return 'failed'

  const allSent = deliveries.every((d) => d.status === 'sent')
  const anySent = deliveries.some((d) => d.status === 'sent')

  if (allSent) return 'sent'
  if (anySent) return 'partial'
  return 'failed'
}



/* ================= SMS (UNCHANGED) ================= */

const normalizeSmsDelivery = (log) => {
  const metadata = log?.metadata || {}
  const provider = metadata.provider || 'unknown'
  const res = metadata.sms_response || {}

  let status = 'failed'
  let messageId = metadata.sms_message_id || null
  let balance = res.balance ?? metadata.sms_balance ?? 0
  let cost = res.cost ?? metadata.sms_cost ?? 0

  switch (provider.toLowerCase()) {
    case 'termii':
      status = ['ok', 'success'].includes(String(res.code).toLowerCase())
        ? 'sent'
        : 'failed'
      messageId = res.message_id || messageId
      balance = res.balance ?? balance
      cost = res.cost ?? cost
      break

    default:
      if (metadata.sms_status) status = metadata.sms_status
      break
  }

  return { provider, channel: 'sms', status, messageId, balance, cost, raw: res }
}

const getSmsStatus = (log) => normalizeSmsDelivery(log).status

onMounted(fetchLogs)
</script>
