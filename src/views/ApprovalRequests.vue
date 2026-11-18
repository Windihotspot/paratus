
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
      .select(`
        id,
        merchant_id,
        fn,
        args,
        entity,
        entity_id,
        action,
        summary,
        previous_data,
        status,
        requested_by,
        reviewed_by,
        reviewed_at,
        review_note,
        requested_at
      `)
      .order('requested_at', { ascending: false })

    if (statusFilter.value !== 'all') {
      query = query.eq('status', statusFilter.value)
    }

    const { data, error } = await query

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

function openRequest(item) {
  selectedRequest.value = item
  reviewNote.value = ''
  reviewDecision.value = null
  drawer.value = true
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

    notify(
      error.message || 'Unable to process this approval request',
      'error'
    )
  } finally {
    processing.value = false
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
    <v-navigation-drawer
      v-model="drawer"
      location="right"
      temporary
      width="560"
      class="approval-drawer"
    >
      <template v-if="selectedRequest">
        <div class="pa-5 d-flex align-center justify-space-between">
          <div>
            <div class="text-h6 font-weight-bold">Request details</div>
            <div class="text-caption ">
              {{ selectedRequest.id }}
            </div>
          </div>

          <v-btn
            icon="mdi-close"
            variant="text"
            @click="drawer = false"
          />
        </div>

        <v-divider />

        <div class="pa-5 drawer-content">
          <div class="d-flex align-center justify-space-between mb-5">
            <v-chip
              :color="statusColor(selectedRequest.status)"
              variant="tonal"
              class="text-capitalize"
            >
              {{ selectedRequest.status }}
            </v-chip>

            <v-chip
              :color="actionColor(selectedRequest.action)"
              variant="tonal"
              class="text-capitalize"
            >
              {{ selectedRequest.action }}
            </v-chip>
          </div>

          <div class="text-subtitle-1 font-weight-bold mb-1">
            {{ selectedRequest.summary || 'Operation request' }}
          </div>

          <div class="text-caption  mb-5">
            Submitted {{ formatDate(selectedRequest.requested_at) }}
          </div>

          <!-- <v-card variant="tonal" rounded="lg" class="pa-4 mb-5">
            <div class="text-overline  mb-2">
              Operation information
            </div>

            <div class="detail-row">
              <span>RPC function</span>
              <strong>{{ selectedRequest.fn }}</strong>
            </div>

            <div class="detail-row">
              <span>Entity</span>
              <strong class="text-capitalize">
                {{ selectedRequest.entity }}
              </strong>
            </div>

            <div class="detail-row">
              <span>Entity ID</span>
              <strong class="text-break">
                {{ selectedRequest.entity_id || '—' }}
              </strong>
            </div>

            <div class="detail-row">
              <span>Requested by</span>
              <strong class="text-break">
                <strong class="text-break">
  {{ requesterNames[selectedRequest.requested_by] || 'Unknown user' }}
</strong>
              </strong>
            </div>

            <div class="detail-row">
              <span>Merchant ID</span>
              <strong class="text-break">
                {{ selectedRequest.merchant_id || '—' }}
              </strong>
            </div>
          </v-card> -->

          <!-- <div class="mb-5">
            <div class="text-subtitle-2 font-weight-bold mb-2">
              Submitted arguments
            </div>

            <v-card variant="outlined" rounded="lg" class="pa-3">
              <pre class="json-preview">{{ JSON.stringify(selectedRequest.args, null, 2) }}</pre>
            </v-card>
          </div> -->

          <div v-if="selectedRequest.previous_data" class="mb-5">
            <div class="text-subtitle-2 font-weight-bold mb-2">
              Previous record data
            </div>

            <v-card variant="outlined" rounded="lg" class="pa-3">
              <pre class="json-preview">{{ JSON.stringify(selectedRequest.previous_data, null, 2) }}</pre>
            </v-card>
          </div>

          <v-card
            v-if="selectedRequest.status !== 'pending'"
            variant="tonal"
            rounded="lg"
            class="pa-4 mb-5"
          >
            <div class="text-overline  mb-2">
              Review information
            </div>

            <div class="detail-row">
              <span>Reviewed by</span>
              <strong>{{ selectedRequest.reviewed_by || '—' }}</strong>
            </div>

            <div class="detail-row">
              <span>Reviewed at</span>
              <strong>{{ formatDate(selectedRequest.reviewed_at) }}</strong>
            </div>

            <div class="mt-3">
              <div class="text-caption  mb-1">
                Review note
              </div>
              <div>{{ selectedRequest.review_note || 'No review note' }}</div>
            </div>
          </v-card>

          <template v-if="selectedRequest.status === 'pending'">
            <v-divider class="my-5" />

            <div class="text-subtitle-2 font-weight-bold mb-2">
              Review note
            </div>

            <v-textarea
              v-model="reviewNote"
              label="Add a note"
              placeholder="Enter a reason for your decision..."
              variant="outlined"
              rows="3"
              auto-grow
              hide-details
            />

            <div class="text-caption  mt-2">
              A rejection requires a reason. Approval notes are optional.
            </div>

            <div class="d-flex ga-3 mt-5">
              <v-btn
                color="error"
                variant="outlined"
                prepend-icon="mdi-close-circle-outline"
                :loading="processing && reviewDecision === 'rejected'"
                :disabled="processing"
                class="flex-grow-1"
                @click="submitReview('rejected')"
              >
                Reject
              </v-btn>

              <v-btn
                color="success"
                prepend-icon="mdi-check-circle-outline"
                :loading="processing && reviewDecision === 'approved'"
                :disabled="processing"
                class="flex-grow-1"
                @click="submitReview('approved')"
              >
                Approve
              </v-btn>
            </div>
          </template>
        </div>
      </template>
    </v-navigation-drawer>
  </div>
    </main-layout>
 
</template>

<style scoped>
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
