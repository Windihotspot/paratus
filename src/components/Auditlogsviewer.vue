<template>
  <div class="w-full">
    <!-- Tabs -->
    <div class="flex gap-8 border-b border-gray-200 mb-6">
      <button
        @click="activeTab = 'loans'"
        :class="[
          'pb-3 px-1 font-medium text-sm transition-colors relative',
          activeTab === 'loans'
            ? 'text-blue-600'
            : 'text-gray-500 hover:text-gray-700'
        ]"
      >
        Loans
        <div
          v-if="activeTab === 'loans'"
          class="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
        />
      </button>
      <button
        @click="activeTab = 'agents'"
        :class="[
          'pb-3 px-1 font-medium text-sm transition-colors relative',
          activeTab === 'agents'
            ? 'text-blue-600'
            : 'text-gray-500 hover:text-gray-700'
        ]"
      >
        Agents
        <div
          v-if="activeTab === 'agents'"
          class="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
        />
      </button>
    </div>

    <!-- Loans Tab -->
    <div v-if="activeTab === 'loans'" class="w-full">
      <div v-if="loanLogs.length === 0" class="text-center py-8 text-gray-500">
        No loan logs found
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-200 bg-gray-50">
              <th class="px-4 py-3 text-left font-semibold text-gray-700">Customer name</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-700">Loan amount</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-700">Days left</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-700">Expiry date</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-700">Agent</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-700">Email</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-700">Date sent</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in loanLogs" :key="log.id" class="border-b border-gray-200 hover:bg-gray-50">
              <td class="px-4 py-3 text-gray-900 font-medium">{{ log.metadata.customer_name }}</td>
              <td class="px-4 py-3 text-gray-700">₦{{ formatCurrency(log.metadata.loan_amount) }}</td>
              <td class="px-4 py-3 text-gray-700">{{ log.metadata.loan_days_left }}</td>
              <td class="px-4 py-3 text-gray-700">{{ log.metadata.loan_expiry_date }}</td>
              <td class="px-4 py-3 text-gray-700">{{ log.metadata.loan_agent_name || 'N/A' }}</td>
              <td class="px-4 py-3 text-gray-700">
                <div class="text-xs text-gray-600">
                  {{ log.metadata.customer_emails[0] || 'N/A' }}
                </div>
              </td>
              <td class="px-4 py-3">
                <span
                  v-if="log.metadata.email_responses?.[0]?.response?.code === 'ok'"
                  class="inline-block px-2.5 py-1 bg-green-100 text-green-800 text-xs font-medium rounded"
                >
                  Sent
                </span>
                <span v-else class="inline-block px-2.5 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
                  Failed
                </span>
              </td>
              <td class="px-4 py-3 text-gray-700 text-xs">{{ formatDate(log.created_at) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Agents Tab -->
    <div v-if="activeTab === 'agents'" class="w-full">
      <div v-if="agentLogs.length === 0" class="text-center py-8 text-gray-500">
        No agent logs found
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-200 bg-gray-50">
              <th class="px-4 py-3 text-left font-semibold text-gray-700">Agent name</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-700">Email</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-700">Loans count</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-700">Total amount</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-700">Report type</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-700">Date sent</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in agentLogs" :key="log.id" class="border-b border-gray-200 hover:bg-gray-50">
              <td class="px-4 py-3 text-gray-900 font-medium">{{ log.metadata.agent_name }}</td>
              <td class="px-4 py-3 text-gray-700 text-xs">{{ log.metadata.agent_email }}</td>
              <td class="px-4 py-3 text-gray-700">{{ log.metadata.loans_count }}</td>
              <td class="px-4 py-3 text-gray-700">{{ log.metadata.total_amount }}</td>
              <td class="px-4 py-3">
                <span class="inline-block px-2.5 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded capitalize">
                  {{ log.metadata.report_type }}
                </span>
              </td>
              <td class="px-4 py-3">
                <span
                  v-if="log.metadata.email_response?.code === 'ok'"
                  class="inline-block px-2.5 py-1 bg-green-100 text-green-800 text-xs font-medium rounded"
                >
                  Sent
                </span>
                <span v-else class="inline-block px-2.5 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
                  Failed
                </span>
              </td>
              <td class="px-4 py-3 text-gray-700 text-xs">{{ formatDate(log.created_at) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface AuditLog {
  id: string
  action: string
  entity: 'loans' | 'agents'
  entity_id: string
  performed_by: string
  created_at: string
  metadata: Record<string, any>
}

interface Props {
  logs: AuditLog[]
}

const props = defineProps<Props>()

const activeTab = ref<'loans' | 'agents'>('loans')

const loanLogs = computed(() =>
  props.logs.filter(log => log.entity === 'loans')
)

const agentLogs = computed(() =>
  props.logs.filter(log => log.entity === 'agents')
)

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-NG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}
</script>