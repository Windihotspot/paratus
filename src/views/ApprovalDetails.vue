
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/services/supabase.js'
import MainLayout from '@/layouts/full/MainLayout.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const request = ref<any>(null)
const reviewerName = ref('Not yet reviewed')
const loading = ref(true)
const errorMessage = ref('')
const showRawPayload = ref(false)

const userId = computed(() =>
  authStore.user?.id || authStore.profile?.id || null
)

const requestId = computed(() => String(route.params.id || ''))
const requestArgs = computed(() => request.value?.args || {})

const statusColor = computed(() => {
  const status = request.value?.status

  if (status === 'approved') return 'success'
  if (status === 'rejected') return 'error'

  return 'warning'
})

const statusIcon = computed(() => {
  const status = request.value?.status

  if (status === 'approved') return 'mdi-check-circle'
  if (status === 'rejected') return 'mdi-close-circle'

  return 'mdi-clock-outline'
})

const requestedDate = computed(() =>
  request.value?.created_at || request.value?.requested_at || null
)

const reviewedDate = computed(() => request.value?.reviewed_at || null)

const statusDescription = computed(() => {
  switch (request.value?.status) {
    case 'approved':
      return 'Your request has been reviewed and approved.'
    case 'rejected':
      return 'Your request was reviewed but could not be approved.'
    default:
      return 'Your request has been submitted and is awaiting administrator review.'
  }
})

const fieldLabels: Record<string, string> = {
  p_customer_id: 'Customer',
  p_agent_id: 'Agent',
  p_merchant_id: 'Merchant',
  p_facility_id: 'Loan Facility',
  p_parent_loan_id: 'Previous Loan',
  p_loan_amount: 'Loan Amount',
  p_amount: 'Amount',
  p_agreed_rate: 'Agreed Interest Rate',
  p_interest_rate: 'Interest Rate',
  p_tenure_days: 'Loan Tenure',
  p_tenor: 'Loan Tenure',
  p_loan_type: 'Loan Type',
  p_disbursed_at: 'Disbursement Date',
  p_repayment_date: 'Repayment Date',
  p_due_date: 'Due Date',
  p_start_date: 'Start Date',
  p_end_date: 'End Date',
  p_description: 'Description',
  p_notes: 'Notes',
  p_reference_number: 'Reference Number',
  p_expense_type_id: 'Expense Type',
  p_expense_category_id: 'Expense Category',
  p_category: 'Category',
  p_expense_date: 'Expense Date',
  p_document_url: 'Supporting Document',
  p_document_available: 'Document Available',
  p_operations_account_id: 'Operations Account',
  p_account_id: 'Account',
  p_transaction_id: 'Transaction',
  p_status: 'Status'
}

const formatLabel = (key: string) => {
  if (fieldLabels[key]) return fieldLabels[key]

  return key
    .replace(/^p_/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase())
}

const isUuid = (value: any) => {
  return typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
}

const isDocumentField = (key: string) => {
  return /document_url|attachment_url|file_url|receipt_url|image_url/i.test(key)
}

const isDateField = (key: string) => {
  return /date|_at$|timestamp/i.test(key)
}

const isAmountField = (key: string) => {
  return /amount|balance|principal|interest|fee|charge|cost|total|price/i.test(key)
}

const isPercentageField = (key: string) => {
  return /rate|percentage|percent/i.test(key)
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 2
  }).format(value)
}

const formatDate = (date: string | null) => {
  if (!date) return 'Not available'

  const parsed = new Date(date)

  if (Number.isNaN(parsed.getTime())) return String(date)

  return parsed.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatValue = (value: any, key = '') => {
  if (value === null || value === undefined || value === '') {
    return 'Not provided'
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }

  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2)
  }

  if (isDateField(key) && typeof value === 'string') {
    return formatDate(value)
  }

  if (isAmountField(key) && typeof value === 'number') {
    return formatCurrency(value)
  }

  if (isPercentageField(key) && typeof value === 'number') {
    return `${value}%`
  }

  if (key.includes('tenure') || key.includes('tenor')) {
    return `${value} days`
  }

  return String(value)
}

const getDocumentName = (url: string) => {
  try {
    const pathname = new URL(url).pathname
    const name = pathname.split('/').pop()
    return decodeURIComponent(name || 'View document')
  } catch {
    return 'View document'
  }
}

const getDocumentUrl = (value: any) => {
  if (typeof value !== 'string') return ''

  if (!/^https?:\/\//i.test(value)) return ''

  return value
}

const getValueType = (key: string, value: any) => {
  if (isDocumentField(key)) return 'document'
  if (typeof value === 'boolean') return 'boolean'
  if (isDateField(key)) return 'date'
  if (isUuid(value)) return 'reference'
  if (isAmountField(key)) return 'currency'
  if (typeof value === 'object' && value !== null) return 'json'

  return 'text'
}

const getArgumentGroups = computed(() => {
  const args = requestArgs.value
  const groups = [
    {
      title: 'Financial Information',
      subtitle: 'Amounts, rates and financial values',
      icon: 'mdi-cash-multiple',
      keys: [] as string[]
    },
    {
      title: 'Transaction & Schedule',
      subtitle: 'Dates, tenure and transaction details',
      icon: 'mdi-calendar-clock',
      keys: [] as string[]
    },
    {
      title: 'Related Records',
      subtitle: 'Customers, agents, facilities and account references',
      icon: 'mdi-account-group-outline',
      keys: [] as string[]
    },
    {
      title: 'Additional Information',
      subtitle: 'Other information submitted with this request',
      icon: 'mdi-information-outline',
      keys: [] as string[]
    }
  ]

  Object.keys(args).forEach(key => {
    const normalized = key.toLowerCase()

    if (
      isAmountField(normalized) ||
      isPercentageField(normalized)
    ) {
      groups[0].keys.push(key)
    } else if (
      isDateField(normalized) ||
      /tenure|tenor|duration|schedule/i.test(normalized)
    ) {
      groups[1].keys.push(key)
    } else if (
      /customer|agent|merchant|facility|account|loan_id|transaction_id|owner_id/i.test(normalized)
    ) {
      groups[2].keys.push(key)
    } else {
      groups[3].keys.push(key)
    }
  })

  return groups.filter(group => group.keys.length > 0)
})

const importantDetails = computed(() => {
  const args = requestArgs.value

  const preferredKeys = [
    'p_loan_amount',
    'p_amount',
    'p_customer_id',
    'p_loan_type',
    'p_tenure_days',
    'p_agreed_rate',
    'p_expense_date',
    'p_category'
  ]

  return preferredKeys
    .filter(key => args[key] !== undefined && args[key] !== null)
    .slice(0, 4)
    .map(key => ({
      key,
      label: formatLabel(key),
      value: formatValue(args[key], key)
    }))
})

const getActionDescription = computed(() => {
  const action = request.value?.action
  const entity = request.value?.entity

  if (!action) return 'Approval request'

  const formattedAction = formatLabel(action).toLowerCase()
  const formattedEntity = formatLabel(entity || 'record').toLowerCase()

  return `${formattedAction} ${formattedEntity}`
})

const getStatusLabel = (status: string) => {
  if (!status) return 'Pending'
  return formatLabel(status)
}

const loadRequest = async () => {
  if (!userId.value || !requestId.value) {
    errorMessage.value = 'Unable to identify this approval request.'
    loading.value = false
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const { data, error } = await supabase
      .from('approval_requests')
      .select('*')
      .eq('id', requestId.value)
      .eq('requested_by', userId.value)
      .maybeSingle()

    if (error) throw error

    if (!data) {
      errorMessage.value =
        'This approval request could not be found, or you do not have permission to view it.'
      return
    }

    request.value = data

    if (data.reviewed_by) {
      const { data: reviewer, error: reviewerError } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', data.reviewed_by)
        .maybeSingle()

      if (!reviewerError && reviewer?.full_name) {
        reviewerName.value = reviewer.full_name
      } else {
        reviewerName.value = 'Administrator'
      }
    }
  } catch (error: any) {
    console.error('Approval details error:', error)
    errorMessage.value =
      error.message || 'Unable to load approval details.'
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.back()
}

const openDocument = (url: string) => {
  if (!url) return
  window.open(url, '_blank', 'noopener,noreferrer')
}

const copyReference = async (value: string) => {
  try {
    await navigator.clipboard.writeText(value)
  } catch (error) {
    console.error('Unable to copy reference:', error)
  }
}

onMounted(loadRequest)
</script>

<template>
  <MainLayout>
    <div class="approval-details-page">

      <!-- Loading -->
      <div v-if="loading" class="loading-state">
        <v-progress-circular
          indeterminate
          color="#27bfa0"
          size="42"
        />
        <p>Loading approval details...</p>
      </div>

      <!-- Error -->
      <v-card
        v-else-if="errorMessage"
        class="pa-8 text-center"
        rounded="lg"
      >
        <v-icon size="55" color="error">
          mdi-alert-circle-outline
        </v-icon>

        <h2 class="mt-4">Request unavailable</h2>

        <p class="text-grey mt-2">
          {{ errorMessage }}
        </p>

        <v-btn
          class="mt-5"
          color="#27bfa0"
          @click="goBack"
        >
          Go Back
        </v-btn>
      </v-card>

      <template v-else-if="request">

        <!-- Page heading -->
        <div class="page-heading">
          <div>
            <v-btn
              variant="text"
              color="grey-darken-1"
              prepend-icon="mdi-arrow-left"
              class="back-button"
              @click="goBack"
            >
              Back
            </v-btn>

            <h1>Approval Details</h1>
            <p>
              Track your submitted request and view its complete details.
            </p>
          </div>

          <v-chip
            :color="statusColor"
            variant="tonal"
            size="large"
            class="status-chip"
          >
            <v-icon start>{{ statusIcon }}</v-icon>
            {{ getStatusLabel(request.status) }}
          </v-chip>
        </div>

        <!-- Main summary banner -->
        <v-card class="summary-banner mb-6" rounded="lg">
          <v-card-text>
            <div class="summary-top">
              <div class="summary-icon">
                <v-icon color="white" size="26">
                  mdi-file-document-check-outline
                </v-icon>
              </div>

              <div class="summary-title">
                <span>Approval request</span>
                <h2>{{ getActionDescription }}</h2>
                <p>
                  Submitted {{ formatDate(requestedDate) }}
                </p>
              </div>
            </div>

            <div class="summary-description">
              {{ request.summary || 'No additional request description was provided.' }}
            </div>

            <div
              v-if="importantDetails.length"
              class="important-details"
            >
              <div
                v-for="item in importantDetails"
                :key="item.key"
                class="important-detail"
              >
                <span>{{ item.label }}</span>
                <strong>{{ item.value }}</strong>
              </div>
            </div>
          </v-card-text>
        </v-card>

        <v-row>

          <!-- Main content -->
          <v-col cols="12" md="8">

            <!-- Request information -->
            <v-card class="details-card mb-5" rounded="lg">
              <div class="card-heading">
                <div class="heading-icon">
                  <v-icon color="#27bfa0">
                    mdi-file-document-outline
                  </v-icon>
                </div>

                <div>
                  <h3>Request Information</h3>
                  <p>General information about this approval request</p>
                </div>
              </div>

              <v-divider />

              <v-card-text>
                <v-row>
                  <v-col cols="12" sm="6">
                    <div class="detail-label">Request ID</div>
                    <div class="detail-value reference-value">
                      {{ request.id }}
                      <v-btn
                        icon="mdi-content-copy"
                        size="x-small"
                        variant="text"
                        @click="copyReference(request.id)"
                      />
                    </div>
                  </v-col>

                  <v-col cols="12" sm="6">
                    <div class="detail-label">Operation</div>
                    <div class="detail-value">
                      {{ formatLabel(request.action || 'Request') }}
                    </div>
                  </v-col>

                  <v-col cols="12" sm="6">
                    <div class="detail-label">Entity</div>
                    <div class="detail-value">
                      {{ formatLabel(request.entity || 'N/A') }}
                    </div>
                  </v-col>

                  <v-col cols="12" sm="6">
                    <div class="detail-label">Request Status</div>
                    <v-chip
                      :color="statusColor"
                      variant="tonal"
                      size="small"
                    >
                      {{ getStatusLabel(request.status) }}
                    </v-chip>
                  </v-col>

                  <v-col cols="12">
                    <div class="detail-label">Description</div>
                    <div class="description-box">
                      {{ request.summary || 'No description was provided.' }}
                    </div>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>

            <!-- Submitted information -->
            <v-card class="details-card mb-5" rounded="lg">
              <div class="card-heading">
                <div class="heading-icon">
                  <v-icon color="#27bfa0">
                    mdi-clipboard-list-outline
                  </v-icon>
                </div>

                <div>
                  <h3>Submitted Information</h3>
                  <p>
                    Detailed information and values included in your request
                  </p>
                </div>
              </div>

              <v-divider />

              <v-card-text>
                <div
                  v-if="getArgumentGroups.length"
                  class="argument-groups"
                >
                  <div
                    v-for="group in getArgumentGroups"
                    :key="group.title"
                    class="argument-group"
                  >
                    <div class="group-heading">
                      <div class="group-icon">
                        <v-icon color="#27bfa0" size="19">
                          {{ group.icon }}
                        </v-icon>
                      </div>

                      <div>
                        <h4>{{ group.title }}</h4>
                        <p>{{ group.subtitle }}</p>
                      </div>
                    </div>

                    <v-row>
                      <v-col
                        v-for="key in group.keys"
                        :key="key"
                        cols="12"
                        sm="6"
                      >
                        <div class="argument-item">
                          <div class="detail-label">
                            {{ formatLabel(key) }}
                          </div>

                          <!-- Document -->
                          <div
                            v-if="isDocumentField(key) && getDocumentUrl(requestArgs[key])"
                            class="document-card"
                          >
                            <v-icon color="#27bfa0">
                              mdi-file-pdf-box
                            </v-icon>

                            <div class="document-info">
                              <strong>
                                {{ getDocumentName(requestArgs[key]) }}
                              </strong>
                              <span>Supporting document</span>
                            </div>

                            <v-btn
                              icon="mdi-open-in-new"
                              size="small"
                              variant="tonal"
                              color="#27bfa0"
                              @click="openDocument(getDocumentUrl(requestArgs[key]))"
                            />
                          </div>

                          <!-- Boolean -->
                          <div
                            v-else-if="typeof requestArgs[key] === 'boolean'"
                            class="boolean-value"
                          >
                            <v-icon
                              :color="requestArgs[key] ? 'success' : 'grey'"
                              size="18"
                            >
                              {{
                                requestArgs[key]
                                  ? 'mdi-check-circle'
                                  : 'mdi-close-circle'
                              }}
                            </v-icon>
                            {{ formatValue(requestArgs[key], key) }}
                          </div>

                          <!-- JSON -->
                          <pre
                            v-else-if="typeof requestArgs[key] === 'object' && requestArgs[key] !== null"
                            class="json-value"
                          >{{ formatValue(requestArgs[key], key) }}</pre>

                          <!-- Other values -->
                          <div
                            v-else
                            class="detail-value"
                            :class="{
                              'reference-value': isUuid(requestArgs[key])
                            }"
                          >
                            {{ formatValue(requestArgs[key], key) }}
                          </div>
                        </div>
                      </v-col>
                    </v-row>
                  </div>
                </div>

                <div v-else class="empty-state">
                  <v-icon size="35" color="grey-lighten-1">
                    mdi-information-outline
                  </v-icon>
                  <p>No submitted details are available.</p>
                </div>
              </v-card-text>
            </v-card>

            <!-- Previous information -->
            <v-card
              v-if="request.previous_data && Object.keys(request.previous_data).length"
              class="details-card mb-5"
              rounded="lg"
            >
              <div class="card-heading">
                <div class="heading-icon">
                  <v-icon color="#27bfa0">
                    mdi-history
                  </v-icon>
                </div>

                <div>
                  <h3>Previous Information</h3>
                  <p>
                    Existing record information before this request
                  </p>
                </div>
              </div>

              <v-divider />

              <v-card-text>
                <v-alert
                  type="info"
                  variant="tonal"
                  density="compact"
                  class="mb-4"
                >
                  This information represents the existing data associated
                  with the record before the requested operation.
                </v-alert>

                <v-row>
                  <v-col
                    v-for="(value, key) in request.previous_data"
                    :key="key"
                    cols="12"
                    sm="6"
                  >
                    <div class="argument-item">
                      <div class="detail-label">
                        {{ formatLabel(String(key)) }}
                      </div>
                      <div class="detail-value">
                        {{ formatValue(value, String(key)) }}
                      </div>
                    </div>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>

            <!-- Review feedback -->
            <v-card
              v-if="request.status !== 'pending'"
              class="details-card mb-5"
              rounded="lg"
            >
              <div class="card-heading">
                <div class="heading-icon">
                  <v-icon
                    :color="request.status === 'approved' ? 'success' : 'error'"
                  >
                    mdi-message-text-outline
                  </v-icon>
                </div>

                <div>
                  <h3>Review Feedback</h3>
                  <p>Administrator's decision and comments</p>
                </div>
              </div>

              <v-divider />

              <v-card-text>
                <div class="review-result">
                  <v-icon
                    :color="statusColor"
                    size="30"
                  >
                    {{ statusIcon }}
                  </v-icon>

                  <div>
                    <strong>
                      Request {{ request.status }}
                    </strong>
                    <p>{{ statusDescription }}</p>
                  </div>
                </div>

                <v-row class="mt-3">
                  <v-col cols="12" sm="6">
                    <div class="detail-label">Reviewed By</div>
                    <div class="detail-value">
                      {{ reviewerName }}
                    </div>
                  </v-col>

                  <v-col cols="12" sm="6">
                    <div class="detail-label">Review Date</div>
                    <div class="detail-value">
                      {{ formatDate(reviewedDate) }}
                    </div>
                  </v-col>

                  <v-col cols="12">
                    <div class="detail-label">Administrator's Note</div>

                    <div class="review-note">
                      {{ request.review_note || 'No additional comments were provided.' }}
                    </div>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>

            <!-- Technical payload -->
            <v-card class="details-card mb-5" rounded="lg">
              <v-card-text>
                <div class="payload-header">
                  <div>
                    <h3>Technical Request Information</h3>
                    <p>System-level information associated with this request</p>
                  </div>

                  <v-btn
                    variant="tonal"
                    color="#27bfa0"
                    size="small"
                    :append-icon="showRawPayload ? 'mdi-chevron-up' : 'mdi-chevron-down'"
                    @click="showRawPayload = !showRawPayload"
                  >
                    {{ showRawPayload ? 'Hide' : 'View' }} Payload
                  </v-btn>
                </div>

                <v-expand-transition>
                  <div v-if="showRawPayload" class="payload-content">
                    <div class="detail-label">Database Function</div>
                    <code class="function-code">
                      {{ request.fn || 'Not specified' }}
                    </code>

                    <div class="detail-label mt-4">Request Arguments</div>
                    <pre class="json-value">{{ JSON.stringify(request.args || {}, null, 2) }}</pre>
                  </div>
                </v-expand-transition>
              </v-card-text>
            </v-card>

          </v-col>

          <!-- Sidebar -->
          <v-col cols="12" md="4">

            <!-- Status -->
            <v-card class="details-card mb-5" rounded="lg">
              <v-card-text>
                <h3 class="side-card-title">Request Status</h3>

                <div class="status-display">
                  <v-icon
                    :color="statusColor"
                    size="40"
                  >
                    {{ statusIcon }}
                  </v-icon>

                  <div>
                    <strong>{{ getStatusLabel(request.status) }}</strong>
                    <p>{{ statusDescription }}</p>
                  </div>
                </div>

                <v-divider class="my-5" />

                <div class="timeline">

                  <div class="timeline-item completed">
                    <div class="timeline-marker">
                      <v-icon size="13" color="white">
                        mdi-check
                      </v-icon>
                    </div>

                    <div>
                      <strong>Request Submitted</strong>
                      <p>{{ formatDate(requestedDate) }}</p>
                    </div>
                  </div>

                  <div
                    class="timeline-item"
                    :class="request.status !== 'pending' ? 'completed' : 'current'"
                  >
                    <div class="timeline-marker">
                      <v-icon
                        size="13"
                        :color="request.status !== 'pending' ? 'white' : '#d69b25'"
                      >
                        {{
                          request.status === 'pending'
                            ? 'mdi-clock-outline'
                            : request.status === 'approved'
                              ? 'mdi-check'
                              : 'mdi-close'
                        }}
                      </v-icon>
                    </div>

                    <div>
                      <strong>
                        {{
                          request.status === 'pending'
                            ? 'Awaiting Review'
                            : request.status === 'approved'
                              ? 'Request Approved'
                              : 'Request Rejected'
                        }}
                      </strong>

                      <p>
                        {{
                          request.status === 'pending'
                            ? 'Your request is currently awaiting review.'
                            : formatDate(reviewedDate)
                        }}
                      </p>
                    </div>
                  </div>

                </div>
              </v-card-text>
            </v-card>

            <!-- Additional information -->
            <v-card class="details-card mb-5" rounded="lg">
              <v-card-text>
                <h3 class="side-card-title">
                  Additional Information
                </h3>

                <div class="side-detail">
                  <span>Request Type</span>
                  <strong>{{ formatLabel(request.entity || 'N/A') }}</strong>
                </div>

                <div class="side-detail">
                  <span>Action</span>
                  <strong>{{ formatLabel(request.action || 'N/A') }}</strong>
                </div>

                <div class="side-detail">
                  <span>Submitted On</span>
                  <strong>{{ formatDate(requestedDate) }}</strong>
                </div>

                <div class="side-detail">
                  <span>Reviewed By</span>
                  <strong>{{ reviewerName }}</strong>
                </div>

                <div class="side-detail">
                  <span>Review Date</span>
                  <strong>{{ formatDate(reviewedDate) }}</strong>
                </div>
              </v-card-text>
            </v-card>

            <!-- Help card -->
            <v-card class="help-card" rounded="lg">
              <v-card-text>
                <div class="help-icon">
                  <v-icon color="#27bfa0" size="24">
                    mdi-information-outline
                  </v-icon>
                </div>

                <h3>Need assistance?</h3>

                <p>
                  If you have questions about this request or its review
                  outcome, contact your administrator for clarification.
                </p>
              </v-card-text>
            </v-card>

          </v-col>
        </v-row>

      </template>
    </div>
  </MainLayout>
</template>

<style scoped>
.approval-details-page {
  width: 100%;
  min-width: 0;
  padding-bottom: 30px;
}

.loading-state {
  min-height: 350px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 15px;
  color: #7b8491;
}

.page-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
  margin-bottom: 24px;
}

.back-button {
  margin-left: -12px;
  margin-bottom: 8px;
}

.page-heading h1 {
  font-size: 25px;
  font-weight: 750;
  color: #202938;
  letter-spacing: -0.5px;
}

.page-heading p {
  color: #858e9a;
  font-size: 13px;
  margin-top: 6px;
}

.summary-banner {
  background: linear-gradient(120deg, #103b42 0%, #176b60 55%, #27a98e 100%);
  color: white;
  overflow: hidden;
}

.summary-banner :deep(.v-card-text) {
  padding: 25px;
}

.summary-top {
  display: flex;
  align-items: center;
  gap: 15px;
}

.summary-icon {
  width: 52px;
  height: 52px;
  border-radius: 13px;
  background: rgba(255, 255, 255, 0.17);
  display: flex;
  align-items: center;
  justify-content: center;
}

.summary-title span {
  font-size: 11px;
  color: rgba(255,255,255,0.75);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.summary-title h2 {
  font-size: 20px;
  font-weight: 700;
  margin-top: 3px;
  text-transform: capitalize;
}

.summary-title p {
  font-size: 12px;
  color: rgba(255,255,255,0.75);
  margin-top: 5px;
}

.summary-description {
  margin-top: 22px;
  padding: 14px 16px;
  background: rgba(255,255,255,0.10);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 9px;
  font-size: 13px;
  line-height: 1.7;
}

.important-details {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-top: 18px;
}

.important-detail {
  padding: 13px;
  background: rgba(255,255,255,0.10);
  border-radius: 9px;
  min-width: 0;
}

.important-detail span {
  display: block;
  font-size: 10px;
  color: rgba(255,255,255,0.7);
  margin-bottom: 7px;
}

.important-detail strong {
  display: block;
  font-size: 13px;
  overflow-wrap: anywhere;
}

.details-card {
  border: 1px solid #edf0f2;
  box-shadow: 0 2px 12px rgba(0,0,0,0.025) !important;
}

.card-heading {
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 19px 20px;
}

.heading-icon {
  width: 42px;
  height: 42px;
  background: #e8f8f4;
  border-radius: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-heading h3 {
  font-size: 14px;
  font-weight: 750;
  color: #263238;
}

.card-heading p {
  font-size: 11px;
  color: #929ba5;
  margin-top: 4px;
}

.detail-label {
  font-size: 11px;
  color: #89939e;
  margin-bottom: 7px;
  font-weight: 600;
}

.detail-value {
  font-size: 13px;
  font-weight: 600;
  color: #303944;
  overflow-wrap: anywhere;
  line-height: 1.6;
}

.reference-value {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 500;
  overflow-wrap: anywhere;
}

.description-box {
  padding: 13px 15px;
  background: #f8fafb;
  border: 1px solid #edf0f2;
  border-radius: 9px;
  font-size: 13px;
  line-height: 1.7;
  color: #46515e;
}

.argument-groups {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.argument-group + .argument-group {
  padding-top: 22px;
  border-top: 1px solid #edf0f2;
}

.group-heading {
  display: flex;
  align-items: center;
  gap: 11px;
  margin-bottom: 17px;
}

.group-icon {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  background: #e8f8f4;
  display: flex;
  align-items: center;
  justify-content: center;
}

.group-heading h4 {
  color: #35414c;
  font-size: 13px;
  font-weight: 700;
}

.group-heading p {
  font-size: 10px;
  color: #929ba5;
  margin-top: 3px;
}

.argument-item {
  height: 100%;
  min-height: 65px;
  padding: 13px;
  background: #fafbfc;
  border: 1px solid #edf0f2;
  border-radius: 9px;
}

.boolean-value {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
  font-weight: 600;
  color: #39434f;
}

.document-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: white;
  border: 1px solid #e8edef;
  border-radius: 8px;
}

.document-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  gap: 4px;
}

.document-info strong {
  font-size: 11px;
  color: #39434f;
  overflow-wrap: anywhere;
}

.document-info span {
  font-size: 10px;
  color: #929ba5;
}

.json-value {
  padding: 12px;
  background: #f5f7f9;
  border: 1px solid #e9edf0;
  border-radius: 7px;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  font-size: 11px;
  color: #46515e;
  max-height: 250px;
  overflow: auto;
}

.empty-state {
  padding: 30px;
  text-align: center;
  color: #929ba5;
}

.empty-state p {
  font-size: 12px;
  margin-top: 10px;
}

.review-result {
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 15px;
  border-radius: 9px;
  background: #f8fafb;
}

.review-result strong {
  display: block;
  font-size: 13px;
  color: #303944;
  text-transform: capitalize;
}

.review-result p {
  font-size: 11px;
  color: #929ba5;
  margin-top: 4px;
}

.review-note {
  padding: 15px;
  background: #f7f9fa;
  border: 1px solid #edf0f2;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.7;
  color: #4b5563;
  white-space: pre-wrap;
}

.payload-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.payload-header h3 {
  font-size: 13px;
  font-weight: 700;
  color: #303944;
}

.payload-header p {
  font-size: 11px;
  color: #929ba5;
  margin-top: 4px;
}

.payload-content {
  padding-top: 20px;
}

.function-code {
  display: block;
  padding: 12px;
  background: #f5f7f9;
  border-radius: 7px;
  color: #176b60;
  font-size: 12px;
  overflow-wrap: anywhere;
}

.side-card-title {
  font-size: 14px;
  font-weight: 750;
  color: #263238;
  margin-bottom: 20px;
}

.status-display {
  display: flex;
  align-items: center;
  gap: 13px;
}

.status-display strong {
  font-size: 14px;
  text-transform: capitalize;
}

.status-display p {
  font-size: 11px;
  color: #929ba5;
  margin-top: 5px;
  line-height: 1.6;
}

.timeline {
  padding-left: 5px;
}

.timeline-item {
  position: relative;
  display: flex;
  gap: 13px;
  padding-bottom: 27px;
}

.timeline-item:last-child {
  padding-bottom: 0;
}

.timeline-item:not(:last-child)::after {
  content: '';
  position: absolute;
  width: 2px;
  height: calc(100% - 18px);
  left: 8px;
  top: 19px;
  background: #e4e8eb;
}

.timeline-marker {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #e4e8eb;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  z-index: 1;
}

.timeline-item.completed .timeline-marker {
  background: #27bfa0;
}

.timeline-item.current .timeline-marker {
  background: #fff4d9;
}

.timeline-item strong {
  display: block;
  font-size: 12px;
  color: #39434f;
}

.timeline-item p {
  font-size: 11px;
  color: #929ba5;
  margin-top: 5px;
  line-height: 1.5;
}

.side-detail {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 12px 0;
  border-bottom: 1px solid #f0f2f4;
}

.side-detail:last-child {
  border-bottom: none;
}

.side-detail span {
  color: #929ba5;
  font-size: 11px;
}

.side-detail strong {
  color: #39434f;
  font-size: 12px;
  overflow-wrap: anywhere;
}

.help-card {
  border: 1px solid #e5f1ed;
  background: #f7fcfa;
  box-shadow: none !important;
}

.help-icon {
  width: 40px;
  height: 40px;
  background: #e4f6ef;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 13px;
}

.help-card h3 {
  font-size: 13px;
  color: #35414c;
  font-weight: 700;
}

.help-card p {
  font-size: 11px;
  color: #7d8993;
  line-height: 1.7;
  margin-top: 7px;
}

@media (max-width: 960px) {
  .important-details {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .page-heading {
    align-items: flex-start;
  }

  .page-heading h1 {
    font-size: 21px;
  }

  .summary-banner :deep(.v-card-text) {
    padding: 18px;
  }

  .summary-title h2 {
    font-size: 17px;
  }

  .important-details {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .card-heading {
    padding: 15px;
  }

  .payload-header {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
