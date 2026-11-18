
<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { supabase } from '@/services/supabase.js'
import { useAuthStore } from '@/stores/auth'
import { ElNotification } from 'element-plus'
import MainLayout from '@/layouts/full/MainLayout.vue' // adjust path
const auth = useAuthStore()

const requests = ref([])
const loading = ref(false)
const processing = ref(false)

const selectedRequest = ref(null)
const drawer = ref(false)

const statusFilter = ref('pending')
const search = ref('')

const reviewNote = ref('')
const reviewDecision = ref(null)
const requesterNames = ref({})
const statusOptions = [
  { title: 'Pending', value: 'pending' },
  { title: 'Approved', value: 'approved' },
  { title: 'Rejected', value: 'rejected' },
  { title: 'All requests', value: 'all' }
]

const headers = [
  { title: 'REQUEST', key: 'summary', minWidth: '240px' },
  { title: 'ENTITY', key: 'entity' },
  { title: 'ACTION', key: 'action' },
  { title: 'REQUESTED BY', key: 'requested_by' },
  { title: 'DATE', key: 'requested_at' },
  { title: 'STATUS', key: 'status' },
  { title: '', key: 'actions', sortable: false, align: 'end' }
]

const isAdmin = computed(() =>
  ['admin', 'super_admin'].includes(auth.role)
)

const filteredRequests = computed(() => {
  const term = search.value.trim().toLowerCase()

  if (!term) return requests.value

  return requests.value.filter(request =>
    [
      request.summary,
      request.fn,
      request.entity,
      request.action,
      request.status,
      request.requested_by
    ].some(value => String(value || '').toLowerCase().includes(term))
  )
})

function notify(message, type = 'success') {
  ElNotification({
    title: type === 'success' ? 'Success' : 'Error',
    message,
    type,
    duration: 3500
  })
}

function formatDate(value) {
  if (!value) return '—'

  return new Date(value).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function statusColor(status) {
  return {
    pending: 'warning',
    approved: 'success',
    rejected: 'error'
  }[status] || 'grey'
}

function actionColor(action) {
  return {
    create: 'success',
    update: 'info',
    delete: 'error'
  }[action] || 'secondary'
}
async function loadRequesterNames(requestsList) {
  const userIds = [
    ...new Set(
      requestsList
        .map(request => request.requested_by)
        .filter(Boolean)
    )
  ]

  if (!userIds.length) {
    requesterNames.value = {}
    return
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', userIds)

  if (error) throw error

  requesterNames.value = Object.fromEntries(
    (data || []).map(profile => [
      profile.id,
      profile.full_name || 'Unknown user'
    ])
  )
}
async function loadRequests() {
  if (!isAdmin.value) return

  loading.value = true

  try {
    let query = supabase
      .from('approval_requests')
      .select('*')
      .order('requested_at', { ascending: false })

    if (statusFilter.value !== 'all') {
      query = query.eq('status', statusFilter.value)
    }

    const { data, error } = await query
    console.log("requests:", data)
    if (error) throw error

    requests.value = data || []
    await loadRequesterNames(requests.value)

    // Keep the currently open drawer in sync after refreshing.
    if (selectedRequest.value) {
      const updated = requests.value.find(
        item => item.id === selectedRequest.value.id
      )

      if (updated) selectedRequest.value = updated
      else {
        // The selected request may no longer match the active filter.
        const { data: latest, error: latestError } = await supabase
          .from('approval_requests')
          .select('*')
          .eq('id', selectedRequest.value.id)
          .single()

        if (!latestError && latest) selectedRequest.value = latest
      }
    }
  } catch (error) {
    console.error('Error loading approval requests:', error)
    notify(error.message || 'Could not load approval requests', 'error')
  } finally {
    loading.value = false
  }
}

async function openRequest(item) {
  selectedRequest.value = item
  reviewNote.value = ''
  reviewDecision.value = null

  relatedRecords.value = {
    customer: null,
    agent: null,
    facility: null,
    bank: null,
    merchant: null,
    requester: null,
    reviewer: null
  }

  drawer.value = true

  await loadRelatedRecords(item)
}
async function submitReview(decision) {
  if (!selectedRequest.value || processing.value) return

  if (selectedRequest.value.status !== 'pending') {
    notify('This request has already been reviewed', 'error')
    return
  }

  if (!['approved', 'rejected'].includes(decision)) return

  if (decision === 'rejected' && !reviewNote.value.trim()) {
    notify('Please provide a reason for rejecting this request', 'error')
    return
  }

  processing.value = true
  reviewDecision.value = decision

  try {
    const { error } = await supabase.rpc('review_approval_request', {
      p_request_id: selectedRequest.value.id,
      p_decision: decision,
      p_note: reviewNote.value.trim() || null
    })

    if (error) throw error

    notify(
      decision === 'approved'
        ? 'Request approved and operation executed successfully'
        : 'Request rejected successfully'
    )

    drawer.value = false
    selectedRequest.value = null
    reviewNote.value = ''

    await loadRequests()
  } catch (error) {
    console.error('Approval review error:', error)
    notify(error.message || 'Unable to process this approval request', 'error')
  } finally {
    processing.value = false
    reviewDecision.value = null
  }
}

watch(statusFilter, loadRequests)

onMounted(() => {
  if (!isAdmin.value) {
    notify('You do not have permission to access approvals', 'error')
    return
  }

  loadRequests()
})

const loadingRelated = ref(false)

const relatedRecords = ref({
  customer: null,
  agent: null,
  facility: null,
  bank: null,
  merchant: null,
  requester: null,
  reviewer: null
})

async function getRecord(table, id) {
  if (!id) return null

  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.error(`Could not load ${table}:`, error)
    return null
  }

  return data
}

async function loadRelatedRecords(request) {
  if (!request) return

  loadingRelated.value = true

  const args = request.args || {}

  try {
    const [
      customer,
      agent,
      facility,
      merchant,
      requester,
      reviewer
    ] = await Promise.all([
      getRecord('customers', args.p_customer_id),
      getRecord('agents', args.p_agent_id),
      getRecord('bank_facilities', args.p_facility_id),
      getRecord('merchants', request.merchant_id),
      getRecord('profiles', request.requested_by),
      getRecord('profiles', request.reviewed_by)
    ])

    let bank = null

    if (facility?.bank_id) {
      bank = await getRecord('banks', facility.bank_id)
    }

    relatedRecords.value = {
      customer,
      agent,
      facility,
      bank,
      merchant,
      requester,
      reviewer
    }
  } catch (error) {
    console.error('Error loading request details:', error)
    notify('Some related request information could not be loaded', 'error')
  } finally {
    loadingRelated.value = false
  }
}
function getRecordName(record) {
  if (!record) return 'Record unavailable'

  const fullName = [
    record.first_name,
    record.middle_name,
    record.last_name
  ].filter(Boolean).join(' ')

  return (
    record.full_name ||
    fullName ||
    record.business_name ||
    record.company_name ||
    record.legal_name ||
    record.name ||
    record.email ||
    'Name unavailable'
  )
}

function getRecordReference(record) {
  if (!record) return '—'

  return (
    record.reference ||
    record.reference_number ||
    record.code ||
    record.id ||
    '—'
  )
}

function formatCurrency(value) {
  if (value === null || value === undefined || value === '') return '—'

  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 2
  }).format(Number(value))
}

function formatDateOnly(value) {
  if (!value) return '—'

  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}
</script>

<template>
    <main-layout>
         <div class="approval-page mt-4">
    <div class="">
    <!-- Header -->
          <div class="bg-white flex rounded shadow justify-between items-center border-b p-4 mb-4">
            <div>
              <h1 class="text-xl font-bold">Approval requests</h1>
              <p class="text-sm text-gray-500"> Review and manage submitted operation requests.</p>
            </div>
    
            <v-btn
            color="green"
        variant="outlined"
        prepend-icon="mdi-refresh"
        :loading="loading"
        @click="loadRequests"
      >
        Refresh
      </v-btn>
          </div>
      

      
    </div>

    <v-card rounded="lg" elevation="0" border>
      <div class="pa-4 d-flex flex-wrap align-center ga-3">
        <v-text-field
          v-model="search"
          placeholder="Search requests..."
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="comfortable"
          hide-details
          clearable
          class="search-field"
        />

        <v-select
          v-model="statusFilter"
          :items="statusOptions"
          item-title="title"
          item-value="value"
          label="Filter by status"
          variant="outlined"
          density="comfortable"
          hide-details
          class="status-select"
        />
      </div>

      <v-divider />

      <v-data-table
        :headers="headers"
        :items="filteredRequests"
        :loading="loading"
        item-value="id"
        hover
        class="approval-table"
        no-data-text="No approval requests found"
      >
        <template #item.summary="{ item }">
          <div class="py-2">
            <div class="font-weight-medium text-body-2">
              {{ item.summary || 'Operation request' }}
            </div>
            
          </div>
        </template>

        <template #item.entity="{ item }">
          <span class="text-capitalize">{{ item.entity || '—' }}</span>
        </template>

        <template #item.action="{ item }">
          <v-chip
            size="small"
            :color="actionColor(item.action)"
            variant="tonal"
            class="text-capitalize"
          >
            {{ item.action }}
          </v-chip>
        </template>

        <template #item.requested_by="{ item }">
          <span class="text-caption">
             {{ requesterNames[item.requested_by] || 'Loading...' }}
          </span>
        </template>

        <template #item.requested_at="{ item }">
          <span class="text-caption">
            {{ formatDate(item.requested_at) }}
          </span>
        </template>

        <template #item.status="{ item }">
          <v-chip
            size="small"
            :color="statusColor(item.status)"
            variant="tonal"
            class="text-capitalize"
          >
            {{ item.status }}
          </v-chip>
        </template>

        <template #item.actions="{ item }">
          <v-btn
            size="small"
            variant="text"
            color="primary"
            append-icon="mdi-chevron-right"
            @click="openRequest(item)"
          >
            View
          </v-btn>
        </template>

        <template #bottom>
          <div class="pa-4 text-caption ">
            {{ filteredRequests.length }} request(s)
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- Request details drawer -->
   
<!-- APPROVAL REQUEST DRAWER -->
<v-navigation-drawer
  v-model="drawer"
  location="right"
  temporary
  width="620"
  class="approval-drawer"
>
  <template v-if="selectedRequest">

    <!-- HEADER -->
    <div class="drawer-header pa-5">
      <div class="d-flex align-center justify-space-between mb-4">
        <div class="d-flex align-center ga-3">
          <div class="drawer-header-icon">
            <i class="fa-solid fa-clipboard-check"></i>
          </div>

          <div>
            <div class="text-h6 font-weight-bold">
              Request review
            </div>
            <div class="text-caption text-medium-emphasis">
              Review operation details before taking action
            </div>
          </div>
        </div>

        <v-btn
          icon="mdi-close"
          variant="text"
          size="small"
          @click="drawer = false"
        />
      </div>

      <div class="d-flex flex-wrap align-center ga-2 mb-3">
        <v-chip
          :color="statusColor(selectedRequest.status)"
          variant="tonal"
          size="small"
          class="text-capitalize"
        >
          <i
            class="fa-solid fa-circle me-2"
            style="font-size: 7px"
          ></i>
          {{ selectedRequest.status }}
        </v-chip>

        <v-chip
          :color="actionColor(selectedRequest.action)"
          variant="tonal"
          size="small"
          class="text-capitalize"
        >
          <i
            :class="selectedRequest.action === 'create'
              ? 'fa-solid fa-plus'
              : selectedRequest.action === 'update'
                ? 'fa-solid fa-pen'
                : 'fa-solid fa-trash'"
            class="me-2"
          ></i>
          {{ selectedRequest.action }}
        </v-chip>

        <v-chip
          color="primary"
          variant="outlined"
          size="small"
          class="text-capitalize"
        >
          {{ selectedRequest.entity }}
        </v-chip>
      </div>

      <h3 class="text-subtitle-1 font-weight-bold mb-1">
        {{ selectedRequest.summary || 'Operation request' }}
      </h3>

      <div class="text-caption text-medium-emphasis">
        <i class="fa-regular fa-clock me-1"></i>
        Submitted {{ formatDate(selectedRequest.requested_at) }}
      </div>
    </div>

    <v-divider />

    <!-- SCROLLABLE CONTENT -->
    <div class="drawer-content pa-5">

      <!-- LOADING RELATED RECORDS -->
      <div
        v-if="loadingRelated"
        class="d-flex align-center justify-center ga-3 py-5"
      >
        <v-progress-circular
          indeterminate
          size="20"
          width="2"
          color="primary"
        />
        <span class="text-caption text-medium-emphasis">
          Loading related information...
        </span>
      </div>

      <!-- CUSTOMER SECTION -->
      <section class="drawer-section">
        <div class="section-heading">
          <div class="section-icon icon-purple">
            <i class="fa-solid fa-user"></i>
          </div>

          <div>
            <div class="section-title">Customer information</div>
            <div class="section-description">
              Customer associated with this request
            </div>
          </div>
        </div>

        <div class="record-profile">
         

          <div class="flex-grow-1 min-width-0">
            <div class="font-weight-bold text-body-1">
              {{ getRecordName(relatedRecords.customer) }}
            </div>

            <div class="text-caption text-medium-emphasis">
              Customer account
            </div>
          </div>

          <v-chip
            v-if="relatedRecords.customer"
            size="x-small"
            color="success"
            variant="tonal"
          >
            Linked
          </v-chip>
        </div>

        <div class="detail-grid mt-4">
          

          <div class="detail-item">
            <span>Email address</span>
            <strong>
              {{ relatedRecords.customer?.email || '—' }}
            </strong>
          </div>

          <div class="detail-item">
            <span>Phone number</span>
            <strong>
              {{
                relatedRecords.customer?.phone ||
                relatedRecords.customer?.phone_number ||
                '—'
              }}
            </strong>
          </div>
        </div>
      </section>


      <!-- LOAN DETAILS -->
      <section
        v-if="selectedRequest.entity === 'loan'"
        class="drawer-section"
      >
        <div class="section-heading">
          <div class="section-icon icon-green">
            <i class="fa-solid fa-money-bill-transfer"></i>
          </div>

          <div>
            <div class="section-title">Loan details</div>
            <div class="section-description">
              Financial information submitted for approval
            </div>
          </div>
        </div>

        <div class="loan-amount-card">
          <div class="text-caption text-medium-emphasis mb-1">
            Requested loan amount
          </div>

          <div class="loan-amount">
            {{ formatCurrency(selectedRequest.args?.p_loan_amount) }}
          </div>

          <div class="text-caption text-medium-emphasis mt-1">
            {{ selectedRequest.args?.p_loan_type || 'Loan' }}
            facility
          </div>
        </div>

        <div class="detail-grid mt-3">
          <div class="detail-item">
            <span>Loan type</span>
            <strong class="text-capitalize">
              {{ selectedRequest.args?.p_loan_type || '—' }}
            </strong>
          </div>

          <div class="detail-item">
            <span>Tenure</span>
            <strong>
              {{ selectedRequest.args?.p_tenure_days ?? '—' }} days
            </strong>
          </div>

          <div class="detail-item">
            <span>Agreed rate</span>
            <strong>
              {{ selectedRequest.args?.p_agreed_rate ?? '—' }}
            </strong>
          </div>

          <div class="detail-item">
            <span>Disbursement date</span>
            <strong>
              {{ formatDateOnly(selectedRequest.args?.p_disbursed_at) }}
            </strong>
          </div>

          <div class="detail-item full-width">
            <span>Parent loan reference</span>
            <strong class="text-break">
              {{ selectedRequest.args?.p_parent_loan_id || 'Not applicable' }}
            </strong>
          </div>
        </div>
      </section>


      <!-- FACILITY SECTION -->
      <section class="drawer-section">
        <div class="section-heading">
          <div class="section-icon icon-blue">
            <i class="fa-solid fa-building-columns"></i>
          </div>

          <div>
            <div class="section-title">Bank facility</div>
            <div class="section-description">
              Facility and banking information
            </div>
          </div>
        </div>

        <div class="record-highlight">
          <div class="d-flex align-center ga-3">
            

            <div class="flex-grow-1 min-width-0">
             

              <div class="text-caption text-medium-emphasis">
                {{ relatedRecords.bank?.name || 'Bank information unavailable' }}
              </div>
            </div>
          </div>
        </div>

        
      </section>


      <!-- AGENT SECTION -->
      <section class="drawer-section">
        <div class="section-heading">
          <div class="section-icon icon-orange">
            <i class="fa-solid fa-user-tie"></i>
          </div>

          <div>
            <div class="section-title">Agent information</div>
            <div class="section-description">
              Agent associated with the operation
            </div>
          </div>
        </div>

        <div class="record-profile">
         
          <div class="flex-grow-1 min-width-0">
            <div class="font-weight-bold">
              {{ getRecordName(relatedRecords.agent) }}
            </div>

            <div class="text-caption text-medium-emphasis">
              Assigned agent
            </div>
          </div>
        </div>

        
      </section>


      <!-- MERCHANT SECTION -->
      <!-- <section class="drawer-section">
        <div class="section-heading">
          <div class="section-icon icon-teal">
            <i class="fa-solid fa-store"></i>
          </div>

          <div>
            <div class="section-title">Merchant information</div>
            <div class="section-description">
              Business account responsible for this operation
            </div>
          </div>
        </div>

        <div class="record-profile">
          <v-avatar size="42" color="teal-lighten-5">
            <i class="fa-solid fa-store text-teal-darken-2"></i>
          </v-avatar>

          <div class="flex-grow-1 min-width-0">
            <div class="font-weight-bold">
              {{ getRecordName(relatedRecords.merchant) }}
            </div>

            <div class="text-caption text-medium-emphasis">
              Merchant account
            </div>
          </div>
        </div>

        <div class="detail-item mt-3">
          <span>Merchant ID</span>
          <strong>{{ selectedRequest.merchant_id || '—' }}</strong>
        </div>
      </section> -->


      <!-- REQUEST INFORMATION -->
      <!-- <section class="drawer-section">
        <div class="section-heading">
          <div class="section-icon icon-grey">
            <i class="fa-solid fa-file-lines"></i>
          </div>

          <div>
            <div class="section-title">Request information</div>
            <div class="section-description">
              Submission and operation metadata
            </div>
          </div>
        </div>

        <div class="detail-list">
          <div class="detail-row">
            <span>Request ID</span>
            <strong>{{ selectedRequest.id }}</strong>
          </div>

          <div class="detail-row">
            <span>Entity</span>
            <strong class="text-capitalize">
              {{ selectedRequest.entity }}
            </strong>
          </div>

          <div class="detail-row">
            <span>Action</span>
            <strong class="text-capitalize">
              {{ selectedRequest.action }}
            </strong>
          </div>

          <div class="detail-row">
            <span>RPC function</span>
            <strong>{{ selectedRequest.fn }}</strong>
          </div>

          <div class="detail-row">
            <span>Requested by</span>
            <strong>
              {{ getRecordName(relatedRecords.requester) }}
            </strong>
          </div>

          <div class="detail-row">
            <span>Submitted at</span>
            <strong>
              {{ formatDate(selectedRequest.requested_at) }}
            </strong>
          </div>
        </div>
      </section> -->


      <!-- PREVIOUS DATA -->
      <section
        v-if="selectedRequest.previous_data"
        class="drawer-section"
      >
        <div class="section-heading">
          <div class="section-icon icon-orange">
            <i class="fa-solid fa-clock-rotate-left"></i>
          </div>

          <div>
            <div class="section-title">Previous record data</div>
            <div class="section-description">
              Existing values before this operation
            </div>
          </div>
        </div>

        <v-card variant="tonal" rounded="lg" class="pa-3">
          <pre class="json-preview">{{ JSON.stringify(selectedRequest.previous_data, null, 2) }}</pre>
        </v-card>
      </section>


      <!-- REVIEW HISTORY -->
      <section
        v-if="selectedRequest.status !== 'pending'"
        class="drawer-section"
      >
        <div class="section-heading">
          <div class="section-icon icon-green">
            <i class="fa-solid fa-clipboard-check"></i>
          </div>

          <div>
            <div class="section-title">Review history</div>
            <div class="section-description">
              Decision recorded for this request
            </div>
          </div>
        </div>

        <div class="detail-list">
          <div class="detail-row">
            <span>Reviewed by</span>
            <strong>
              {{ getRecordName(relatedRecords.reviewer) }}
            </strong>
          </div>

          <div class="detail-row">
            <span>Reviewed at</span>
            <strong>
              {{ formatDate(selectedRequest.reviewed_at) }}
            </strong>
          </div>
        </div>

        <div class="review-note-card mt-3">
          <div class="text-caption font-weight-bold mb-1">
            Review note
          </div>

          <div class="text-body-2">
            {{ selectedRequest.review_note || 'No review note provided.' }}
          </div>
        </div>
      </section>


      <!-- REVIEW ACTIONS -->
      <section
        v-if="selectedRequest.status === 'pending'"
        class="review-section"
      >
        <div class="section-heading">
          <div class="section-icon icon-purple">
            <i class="fa-solid fa-gavel"></i>
          </div>

          <div>
            <div class="section-title">Review this request</div>
            <div class="section-description">
              Approve or reject the submitted operation
            </div>
          </div>
        </div>

        <v-textarea
          v-model="reviewNote"
          label="Review note"
          placeholder="Add an optional note or explain why this request should be rejected..."
          variant="outlined"
          rows="3"
          auto-grow
          hide-details
          class="mb-2"
        />

        <div class="text-caption text-medium-emphasis mb-4">
          A rejection requires a reason. Approval notes are optional.
        </div>

        <div class="d-flex ga-3">
          <v-btn
            color="error"
            variant="outlined"
            prepend-icon="mdi-close-circle-outline"
            :loading="processing && reviewDecision === 'rejected'"
            :disabled="processing || loadingRelated"
            class="flex-grow-1"
            @click="submitReview('rejected')"
          >
            Reject request
          </v-btn>

          <v-btn
            color="success"
            prepend-icon="mdi-check-circle-outline"
            :loading="processing && reviewDecision === 'approved'"
            :disabled="processing || loadingRelated"
            class="flex-grow-1"
            @click="submitReview('approved')"
          >
            Approve request
          </v-btn>
        </div>
      </section>

    </div>
  </template>
</v-navigation-drawer>

  </div>
    </main-layout>
 
</template>

<style scoped>

.approval-drawer {
  max-width: 100vw;
}

.drawer-header {
  background: rgb(var(--v-theme-surface));
}

.drawer-header-icon {
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: rgba(var(--v-theme-primary), 0.10);
  color: rgb(var(--v-theme-primary));
  font-size: 17px;
}

.drawer-content {
  height: calc(100vh - 105px);
  overflow-y: auto;
  padding-bottom: 36px !important;
}

.drawer-section {
  padding: 18px;
  margin-bottom: 16px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 14px;
  background: rgb(var(--v-theme-surface));
}

.section-heading {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
}

.section-icon {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 11px;
  font-size: 15px;
  flex-shrink: 0;
}

.icon-purple {
  background: rgba(92, 45, 205, 0.10);
  color: #5c2dcd;
}

.icon-green {
  background: rgba(22, 163, 74, 0.10);
  color: #16a34a;
}

.icon-blue {
  background: rgba(37, 99, 235, 0.10);
  color: #2563eb;
}

.icon-orange {
  background: rgba(234, 136, 34, 0.12);
  color: #d97706;
}

.icon-teal {
  background: rgba(13, 148, 136, 0.10);
  color: #0d9488;
}

.icon-grey {
  background: rgba(100, 116, 139, 0.10);
  color: #64748b;
}

.section-title {
  font-size: 14px;
  font-weight: 700;
}

.section-description {
  font-size: 11px;
  color: rgba(var(--v-theme-on-surface), 0.60);
  margin-top: 2px;
}

.record-profile {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 11px;
  background: rgba(var(--v-theme-on-surface), 0.035);
}

.record-highlight {
  padding: 13px;
  border-radius: 11px;
  background: rgba(var(--v-theme-on-surface), 0.035);
}

.record-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--v-theme-primary), 0.10);
  color: rgb(var(--v-theme-primary));
}

.loan-amount-card {
  padding: 18px;
  border-radius: 12px;
  background: rgba(22, 163, 74, 0.07);
  border: 1px solid rgba(22, 163, 74, 0.14);
}

.loan-amount {
  font-size: 27px;
  font-weight: 800;
  letter-spacing: -0.8px;
  color: rgb(var(--v-theme-on-surface));
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 15px 12px;
}

.detail-item {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.detail-item > span {
  font-size: 11px;
  color: rgba(var(--v-theme-on-surface), 0.60);
}

.detail-item > strong {
  font-size: 12px;
  font-weight: 650;
  overflow-wrap: anywhere;
  text-align: left;
}

.detail-item.full-width {
  grid-column: 1 / -1;
}

.detail-list {
  display: flex;
  flex-direction: column;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 14px;
  padding: 11px 0;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  font-size: 12px;
}

.detail-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.detail-row > span {
  color: rgba(var(--v-theme-on-surface), 0.60);
  flex-shrink: 0;
}

.detail-row > strong {
  text-align: right;
  font-weight: 600;
  max-width: 65%;
  overflow-wrap: anywhere;
}

.review-section {
  padding: 18px;
  margin-top: 20px;
  border-radius: 14px;
  border: 1px solid rgba(var(--v-theme-primary), 0.20);
  background: rgba(var(--v-theme-primary), 0.035);
}

.review-note-card {
  padding: 13px;
  border-radius: 10px;
  background: rgba(var(--v-theme-on-surface), 0.045);
}

.json-preview {
  max-height: 280px;
  overflow: auto;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  font-size: 11px;
  line-height: 1.7;
}

.min-width-0 {
  min-width: 0;
}

@media (max-width: 600px) {
  .drawer-section {
    padding: 14px;
  }

  .detail-grid {
    gap: 13px 8px;
  }

  .loan-amount {
    font-size: 23px;
  }
}

.approval-page {
  width: 100%;
}

.search-field {
  max-width: 360px;
  flex: 1 1 240px;
}

.status-select {
  max-width: 210px;
  flex: 1 1 180px;
}

.approval-table {
  min-height: 250px;
}

.approval-drawer {
  max-width: 100vw;
}

.drawer-content {
  height: calc(100vh - 81px);
  overflow-y: auto;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  padding: 9px 0;
  font-size: 13px;
  border-bottom: 1px solid rgba(128, 128, 128, 0.15);
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-row > span {
  color: rgba(var(--v-theme-on-surface), 0.65);
  flex-shrink: 0;
}

.detail-row > strong {
  text-align: right;
  font-weight: 600;
  overflow-wrap: anywhere;
}

.json-preview {
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  max-height: 320px;
  overflow-y: auto;
}
</style>
