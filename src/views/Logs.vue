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
                Loan Expiry Date
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
                {{ log.metadata?.loan_amount ?? '-' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {{ log.metadata?.loan_days_left ?? '-' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {{ log.metadata?.loan_expiry_date || '-' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <v-btn size="small" variant="outlined" color="primary" @click="openViewDialog(log)">
                  View
                </v-btn>
              </td>
            </tr>
          </tbody>
        </table>

        <v-dialog v-model="viewDialog" max-width="800">
          <v-card>
            <v-card-title class="font-semibold"> Audit Log Details </v-card-title>

            <v-card-text v-if="selectedLog">
              <v-row dense>
                <!-- Core -->
                <v-col cols="12" md="6">
                  <v-text-field
                    label="Action"
                    :model-value="selectedLog.action"
                    readonly
                    outlined
                    variant="outlined"
                    color="#27bfa0"
                    prepend-inner-icon="mdi-flash"
                  />
                </v-col>

                <v-col cols="12" md="6">
                  <v-text-field
                    variant="outlined"
                    color="#27bfa0"
                    label="Performed By"
                    :model-value="selectedLog.performed_by"
                    readonly
                    outlined
                    prepend-inner-icon="mdi-account"
                  />
                </v-col>

                <v-col cols="12" md="6">
                  <v-text-field
                    variant="outlined"
                    color="#27bfa0"
                    label="Entity"
                    :model-value="selectedLog.entity"
                    readonly
                    outlined
                    prepend-inner-icon="mdi-database"
                  />
                </v-col>

                <v-col cols="12" md="6">
                  <v-text-field
                    variant="outlined"
                    color="#27bfa0"
                    label="Created At"
                    :model-value="formatDate(selectedLog.created_at)"
                    readonly
                    outlined
                    prepend-inner-icon="mdi-calendar"
                  />
                </v-col>

                <!-- Customer -->
                <v-col cols="12" md="6">
                  <v-text-field
                    variant="outlined"
                    color="#27bfa0"
                    label="Customer Name"
                    :model-value="selectedLog.metadata?.customer_name"
                    readonly
                    outlined
                    prepend-inner-icon="mdi-account-circle"
                  />
                </v-col>

                <v-col cols="12" md="6">
                  <v-text-field
                    variant="outlined"
                    color="#27bfa0"
                    label="Customer Phone"
                    :model-value="selectedLog.metadata?.customer_phone"
                    readonly
                    outlined
                    prepend-inner-icon="mdi-phone"
                  />
                </v-col>

                <!-- Loan -->
                <v-col cols="12" md="6">
                  <v-text-field
                    variant="outlined"
                    color="#27bfa0"
                    label="Loan Amount"
                    :model-value="selectedLog.metadata?.loan_amount"
                    readonly
                    outlined
                    prepend-inner-icon="mdi-cash"
                  />
                </v-col>

                <v-col cols="12" md="6">
                  <v-text-field
                    variant="outlined"
                    color="#27bfa0"
                    label="Days Left"
                    :model-value="selectedLog.metadata?.loan_days_left"
                    readonly
                    outlined
                    prepend-inner-icon="mdi-timer"
                  />
                </v-col>

                <v-col cols="12" md="6">
                  <v-text-field
                    variant="outlined"
                    color="#27bfa0"
                    label="Expiry Date"
                    :model-value="selectedLog.metadata?.loan_expiry_date"
                    readonly
                    outlined
                    prepend-inner-icon="mdi-calendar-alert"
                  />
                </v-col>

                <!-- SMS -->
                <v-col cols="12">
                  <v-textarea
                    variant="outlined"
                    color="#27bfa0"
                    label="SMS Message"
                    :model-value="selectedLog.metadata?.sms_message"
                    readonly
                    outlined
                    auto-grow
                    prepend-inner-icon="mdi-message-text"
                  />
                </v-col>

                <v-col cols="12">
                  <v-text-field
                    variant="outlined"
                    color="#27bfa0"
                    label="SMS Status"
                    :model-value="selectedLog.metadata?.sms_status"
                    readonly
                    outlined
                    prepend-inner-icon="mdi-check-circle"
                  />
                </v-col>
              </v-row>
            </v-card-text>

            <v-card-actions>
              <v-spacer />
              <v-btn variant="text" @click="viewDialog = false">Close</v-btn>
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

const fetchLogs = async () => {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })

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

onMounted(fetchLogs)
</script>
