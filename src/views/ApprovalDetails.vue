
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
  request.value?.created_at ||
  request.value?.requested_at ||
  null
)

const reviewedDate = computed(() =>
  request.value?.reviewed_at || null
)

const formatLabel = (key: string) => {
  return key
    .replace(/^p_/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase())
}

const formatValue = (value: any) => {
  if (value === null || value === undefined || value === '') {
    return 'Not provided'
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }

  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2)
  }

  return String(value)
}

const formatDate = (date: string | null) => {
  if (!date) return 'Not available'

  const parsed = new Date(date)

  if (Number.isNaN(parsed.getTime())) return 'Not available'

  return parsed.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
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
    // Staff can only retrieve requests they submitted.
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

    // Retrieve the reviewer's display name.
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
          size="40"
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

      <!-- Details -->
      <template v-else-if="request">

        <!-- Page Heading -->
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
            <p>View the details and progress of your submitted request.</p>
          </div>

          <v-chip
            :color="statusColor"
            variant="tonal"
            size="large"
          >
            <v-icon start>{{ statusIcon }}</v-icon>
            {{ request.status }}
          </v-chip>
        </div>

        <v-row>

          <!-- Main Column -->
          <v-col cols="12" md="8">

            <!-- Request Summary -->
            <v-card class="details-card mb-5" rounded="lg">
              <div class="card-heading">
                <div class="heading-icon">
                  <v-icon color="#27bfa0">
                    mdi-file-document-outline
                  </v-icon>
                </div>

                <div>
                  <h3>Request Information</h3>
                  <p>Overview of the submitted request</p>
                </div>
              </div>

              <v-divider />

              <v-card-text>
                <v-row>
                  <v-col cols="12" sm="6">
                    <div class="detail-label">Request ID</div>
                    <div class="detail-value request-id">
                      {{ request.id }}
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
                    <div class="detail-label">Function</div>
                    <div class="detail-value">
                      {{ request.fn }}
                    </div>
                  </v-col>

                  <v-col cols="12">
                    <div class="detail-label">Summary</div>
                    <div class="detail-value">
                      {{ request.summary || 'No summary provided' }}
                    </div>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>

            <!-- Submitted Data -->
            <v-card class="details-card mb-5" rounded="lg">
              <div class="card-heading">
                <div class="heading-icon">
                  <v-icon color="#27bfa0">
                    mdi-clipboard-text-outline
                  </v-icon>
                </div>

                <div>
                  <h3>Submitted Information</h3>
                  <p>Information included in your request</p>
                </div>
              </div>

              <v-divider />

              <v-card-text>
                <v-row>
                  <v-col
                    v-for="(value, key) in requestArgs"
                    :key="key"
                    cols="12"
                    sm="6"
                  >
                    <div class="detail-label">
                      {{ formatLabel(String(key)) }}
                    </div>

                    <div class="detail-value">
                      <template v-if="String(key).includes('document_url') && value">
                        <div class="document-value">
                          <v-icon color="#27bfa0" size="19">
                            mdi-file-outline
                          </v-icon>
                          <span>{{ value }}</span>
                        </div>
                      </template>

                      <template v-else>
                        {{ formatValue(value) }}
                      </template>
                    </div>
                  </v-col>
                </v-row>

                <div
                  v-if="Object.keys(requestArgs).length === 0"
                  class="text-grey text-body-2"
                >
                  No submitted details available.
                </div>
              </v-card-text>
            </v-card>

            <!-- Previous Data, if applicable -->
            <v-card
              v-if="request.previous_data"
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
                  <p>Existing information before this request</p>
                </div>
              </div>

              <v-divider />

              <v-card-text>
                <v-row>
                  <v-col
                    v-for="(value, key) in request.previous_data"
                    :key="key"
                    cols="12"
                    sm="6"
                  >
                    <div class="detail-label">
                      {{ formatLabel(String(key)) }}
                    </div>

                    <div class="detail-value">
                      {{ formatValue(value) }}
                    </div>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>

            <!-- Review Feedback -->
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
                <div class="detail-label">Decision</div>

                <v-chip
                  :color="statusColor"
                  variant="tonal"
                  class="mb-4"
                >
                  {{ request.status }}
                </v-chip>

                <div class="detail-label">Reviewed By</div>
                <div class="detail-value mb-4">
                  {{ reviewerName }}
                </div>

                <div class="detail-label">Review Note</div>

                <div class="review-note">
                  {{ request.review_note || 'No additional comments provided.' }}
                </div>
              </v-card-text>
            </v-card>

          </v-col>

          <!-- Sidebar -->
          <v-col cols="12" md="4">

            <!-- Status Card -->
            <v-card class="details-card mb-5" rounded="lg">
              <v-card-text>
                <h3 class="side-card-title">Request Status</h3>

                <div class="status-display">
                  <v-icon
                    :color="statusColor"
                    size="38"
                  >
                    {{ statusIcon }}
                  </v-icon>

                  <div>
                    <strong>{{ formatLabel(request.status) }}</strong>
                    <p>
                      {{
                        request.status === 'pending'
                          ? 'Awaiting administrator review'
                          : request.status === 'approved'
                            ? 'Your request has been approved'
                            : 'Your request was rejected'
                      }}
                    </p>
                  </div>
                </div>

                <v-divider class="my-4" />

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
                        {{ formatDate(reviewedDate) }}
                      </p>
                    </div>
                  </div>

                </div>
              </v-card-text>
            </v-card>

            <!-- Request Details -->
            <v-card class="details-card" rounded="lg">
              <v-card-text>
                <h3 class="side-card-title">Additional Information</h3>

                <div class="side-detail">
                  <span>Request Type</span>
                  <strong>{{ formatLabel(request.entity || 'N/A') }}</strong>
                </div>

                <div class="side-detail">
                  <span>Action</span>
                  <strong>{{ formatLabel(request.action || 'N/A') }}</strong>
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
  margin-bottom: 25px;
}

.back-button {
  margin-left: -12px;
  margin-bottom: 8px;
}

.page-heading h1 {
  font-size: 24px;
  font-weight: 700;
  color: #202938;
}

.page-heading p {
  color: #858e9a;
  font-size: 13px;
  margin-top: 5px;
}

.details-card {
  border: 1px solid #edf0f2;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.025) !important;
}

.card-heading {
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 18px 20px;
}

.heading-icon {
  width: 40px;
  height: 40px;
  background: #e8f8f4;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-heading h3 {
  font-size: 14px;
  font-weight: 700;
  color: #263238;
}

.card-heading p {
  font-size: 12px;
  color: #929ba5;
  margin-top: 3px;
}

.detail-label {
  font-size: 11px;
  color: #89939e;
  margin-bottom: 6px;
  font-weight: 500;
}

.detail-value {
  font-size: 13px;
  font-weight: 600;
  color: #303944;
  overflow-wrap: anywhere;
}

.request-id {
  font-size: 11px;
  font-weight: 500;
}

.document-value {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.document-value span {
  overflow-wrap: anywhere;
}

.review-note {
  padding: 14px;
  background: #f7f9fa;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.7;
  color: #4b5563;
}

.side-card-title {
  font-size: 14px;
  font-weight: 700;
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
  margin-top: 4px;
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
  text-transform: capitalize;
}

@media (max-width: 600px) {
  .page-heading {
    align-items: flex-start;
  }

  .page-heading h1 {
    font-size: 20px;
  }
}
</style>
