<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import MainLayout from '@/layouts/full/MainLayout.vue'
import { useDebounceFn } from '@vueuse/core'
import { supabase } from '@/services/supabase' // adjust if needed

// ----------------------
// STATE
// ----------------------
const tab = ref<'under_review' | 'onboarded'>('under_review')
const search = ref('')
const loading = ref(false)

const applications = ref<any[]>([])
const total = ref(0)

const page = ref(1)
const perPage = ref(10)

// Drawer
const selectedApp = ref<any | null>(null)
const drawer = ref(false)

// ----------------------
// STATUS MAP (TABS)
// ----------------------
const statusMap = {
  under_review: 'submitted,under_review',
  onboarded: 'account_created'
}

// ----------------------
// FETCH DATA
// ----------------------
const fetchApplications = async () => {
  loading.value = true

  const { data, error } = await supabase.rpc('get_applications_full_view', {
    p_limit: perPage.value,
    p_offset: (page.value - 1) * perPage.value,
    p_statuses: statusMap[tab.value],
    p_search: search.value || null
  })
  console.log("applications:", data)
  if (!error && data) {
    applications.value = data.data || []
    total.value = data.pagination?.total || 0
  }

  loading.value = false
}

// debounce search
const debouncedFetch = useDebounceFn(fetchApplications, 400)

watch([tab, page], fetchApplications)
watch(search, debouncedFetch)

onMounted(fetchApplications)

// ----------------------
// VIEW DETAILS
// ----------------------
const openDetails = (item: any) => {
  selectedApp.value = item
  drawer.value = true
}

// ----------------------
// SIGNED URL FOR DOCS
// ----------------------
const getSignedUrl = async (path: string) => {
  const { data, error } = await supabase.storage
    .from('kyc-documents')
    .createSignedUrl(path, 60)
    
  return data?.signedUrl
}

// ----------------------
// EXPORT (EXCEL)
// ----------------------
const exportExcel = async () => {
  const rows = applications.value.map(a => ({
    Name: a.full_name,
    Email: a.application.email,
    Phone: a.application.phone_number,
    Status: a.application.status,
    Created: a.application.created_at
  }))

  const XLSX = await import('xlsx')
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()

  XLSX.utils.book_append_sheet(wb, ws, 'Applications')
  XLSX.writeFile(wb, 'applications.xlsx')
}

// ----------------------
// EXPORT (PDF - basic)
// ----------------------
const exportPDF = async () => {
  const jsPDF = (await import('jspdf')).default
  
}
const viewDoc = async (path: string) => {
  const url = await getSignedUrl(path)

  if (url) {
    window.open(url, '_blank')
  }
}

const openDoc = (url: string) => {
  if (!url) return
  window.open(url, '_blank', 'noopener,noreferrer')
}

const getStatusMeta = (status: string) => {
  switch (status) {
    case 'submitted':
      return { label: 'Submitted', color: 'green', icon: 'mdi-send' }

    case 'under_review':
      return { label: 'Under Review', color: 'orange', icon: 'mdi-eye-outline' }

    case 'account_created':
      return { label: 'Onboarded', color: 'green', icon: 'mdi-check-circle' }

    case 'rejected':
      return { label: 'Rejected', color: 'red', icon: 'mdi-close-circle' }

    case 'verified':
      return { label: 'Verified', color: 'teal', icon: 'mdi-shield-check' }

    default:
      return { label: status, color: 'grey', icon: 'mdi-help-circle' }
  }
}
</script>

<template>
  <MainLayout>
    <!-- Header -->
    <div class="bg-white flex rounded shadow justify-between items-center border-b p-4 mb-4">
      <div>
        <h1 class="text-xl font-bold">Applications</h1>
        <p class="text-gray-500 text-sm">Manage customer applications</p>
      </div>
<!-- 
      <div class="flex gap-2">
        <v-btn @click="exportExcel">Export Excel</v-btn>
        <v-btn @click="exportPDF">Export PDF</v-btn>
      </div> -->
    </div>

    <!-- Tabs -->
    <v-tabs v-model="tab" color="green" class="mb-4">
      <v-tab value="under_review">Under Review</v-tab>
      <v-tab value="onboarded">Onboarded</v-tab>
    </v-tabs>

    <!-- Search -->
    <v-text-field
    variant="outlined"
      v-model="search"
      placeholder="Search name, phone..."
      clearable
      class="mb-4"
    />

    <!-- Table -->
    <v-data-table
      :items="applications"
      :loading="loading"
      :items-length="total"
      :items-per-page="perPage"
      v-model:page="page"
    >
      <template #headers>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Phone</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </template>

      <template #item="{ item }">
        <tr>
          <td>{{ item.full_name }}</td>
          <td>{{ item.application.email }}</td>
          <td>{{ item.application.phone_number }}</td>
          <td>
  <v-chip
    size="small"
    :color="getStatusMeta(item.application.status).color"
    variant="flat"
    class="text-white"
  >
    

    {{ getStatusMeta(item.application.status).label }}
  </v-chip>
</td>
          <td>
            <v-btn color="primary" size="small" @click="openDetails(item)">View</v-btn>
          </td>
        </tr>
      </template>
    </v-data-table>

    <!-- DETAILS DRAWER -->
   <v-navigation-drawer
  v-model="drawer"
  location="right"
  width="520"
  temporary
>
  <div v-if="selectedApp" class="drawer-container">

    <!-- HEADER -->
    <div class="drawer-header">
      <div class="mt-4">
        <h2 class="text-lg font-bold">
          {{ selectedApp.full_name }}
        </h2>
        <p class="text-sm text-gray-500">
          {{ selectedApp.application.email }}
        </p>
      </div>

      <v-btn icon variant="text" @click="drawer = false">
        <v-icon color="red-darken-2">mdi-close</v-icon>
      </v-btn>
    </div>

    <v-divider class="mb-3" />

    <!-- BODY -->
    <div class="drawer-body">

      

      <!-- PERSONAL -->
      <v-card class="glass-card mb-4">
        <div class="card-header gradient-purple">
          <v-icon class="section-icon">mdi-account</v-icon>
          Personal Details
        </div>

        <v-card-text>
            <div class="mb-3">
  <b>Status:</b>

  <v-chip
    class="ml-2"
    size="small"
    :color="getStatusMeta(selectedApp.application.status).color"
    variant="flat"
  >
    

    {{ getStatusMeta(selectedApp.application.status).label }}
  </v-chip>
</div>
          <p class="mb-2"><b>BVN:</b> {{ selectedApp.application.bvn }}</p>
          <p class="mb-2"><b>NIN:</b> {{ selectedApp.application.nin }}</p>
          <p class="mb-2"><b>Phone:</b> {{ selectedApp.application.phone_number }}</p>
          <p class="mb-2"><b>Email:</b> {{ selectedApp.application.email }}</p>
          <p class="mb-2"><b>DOB:</b> {{ selectedApp.application.date_of_birth }}</p>
          <p class="mb-2"><b>Sex:</b> {{ selectedApp.application.sex }}</p>
          <p class="mb-2"><b>Religion:</b> {{ selectedApp.application.religion }}</p>
          <p class="mb-2"><b>State of Origin:</b> {{ selectedApp.application.state_of_origin }}</p>
          <p class="mb-2"><b>LGA:</b> {{ selectedApp.application.lga_of_origin }}</p>
          <p class="mb-0"><b>Mother's Maiden Name:</b> {{ selectedApp.application.mothers_maiden_name }}</p>
        </v-card-text>
      </v-card>

      <!-- ADDRESS -->
      <v-card class="glass-card mb-4">
        <div class="card-header gradient-green">
          <v-icon class="section-icon">mdi-home-map-marker</v-icon>
          Address
        </div>

        <v-card-text>
          <p class="mb-2"><b>Full Address:</b> {{ selectedApp.address?.full_address }}</p>
          <p class="mb-2"><b>Town:</b> {{ selectedApp.address?.town_village }}</p>
          <p class="mb-2"><b>State:</b> {{ selectedApp.address?.state }}</p>
          <p class="mb-2"><b>Landmark:</b> {{ selectedApp.address?.nearest_landmark }}</p>
          <p class="mb-2"><b>Bus Stop:</b> {{ selectedApp.address?.bus_stop_description }}</p>
          <p class="mb-0"><b>Building Type:</b> {{ selectedApp.address?.building_type }}</p>
        </v-card-text>
      </v-card>

      <!-- EMPLOYMENT -->
      <v-card class="glass-card mb-4">
        <div class="card-header gradient-orange">
          <v-icon class="section-icon">mdi-briefcase</v-icon>
          Employment
        </div>

        <v-card-text>
          <p class="mb-2"><b>Status:</b> {{ selectedApp.employment?.employment_status }}</p>
          <p class="mb-2"><b>Employer:</b> {{ selectedApp.employment?.employer_name }}</p>
          <p class="mb-2"><b>Business Type:</b> {{ selectedApp.employment?.business_type }}</p>
          <p class="mb-0"><b>Additional Info:</b> {{ selectedApp.employment?.additional_info }}</p>
        </v-card-text>
      </v-card>

      <!-- NEXT OF KIN -->
      <v-card class="glass-card mb-4">
        <div class="card-header gradient-pink">
          <v-icon class="section-icon">mdi-account-heart</v-icon>
          Next of Kin
        </div>

        <v-card-text>
          <p class="mb-2"><b>Name:</b> {{ selectedApp.next_of_kin?.full_name }}</p>
          <p class="mb-2"><b>Phone:</b> {{ selectedApp.next_of_kin?.phone_number }}</p>
          <p class="mb-0"><b>Relationship:</b> {{ selectedApp.next_of_kin?.relationship }}</p>
        </v-card-text>
      </v-card>

      <!-- KYC DOCUMENTS -->
      <v-card class="glass-card mb-4">
        <div class="card-header gradient-dark">
          <v-icon class="section-icon">mdi-file-document-multiple</v-icon>
          KYC Documents
        </div>

        <v-card-text>
          <div
            v-for="doc in selectedApp.kyc_docs"
            :key="doc.doc_type"
            class="mb-2"
          >
            <v-btn
            color="primary"
              size="small"
              variant="text"
             @click="openDoc(doc.file_path)"
            >
              View {{ doc.doc_type }}
            </v-btn>
          </div>
        </v-card-text>
      </v-card>

      <!-- STATUS TIMELINE -->
      <v-card class="glass-card mb-6">
        <div class="card-header gradient-blue">
          <v-icon class="section-icon">mdi-timeline</v-icon>
          Status History
        </div>

        <v-card-text>
          <v-timeline density="compact" side="end">
            <v-timeline-item
              v-for="log in selectedApp.status_log"
              :key="log.id"
              size="small"
              dot-color="green"
            >
              <div class="mb-1">
                <b>{{ log.to_status }}</b>
              </div>

              <div class="text-sm text-gray-600 mb-1">
                {{ log.note }}
              </div>

              <div class="text-xs text-gray-400">
                {{ new Date(log.created_at).toLocaleString() }}
              </div>
            </v-timeline-item>
          </v-timeline>
        </v-card-text>
      </v-card>

    </div>
  </div>
</v-navigation-drawer>
  </MainLayout>
</template>

<style scoped>
.v-btn{
    text-transform: none;
}
    .drawer-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
}

.drawer-body {
  overflow-y: auto;
  padding: 12px;
  flex: 1;
}
/* glass card */
.glass-card {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 14px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

/* card header gradient */
.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  font-weight: 600;
  color: white;
}
.gradient-blue {
  background: linear-gradient(135deg, #3b82f6, #06b6d4);
}

.gradient-green {
  background: linear-gradient(135deg, #22c55e, #10b981);
}

.gradient-purple {
  background: linear-gradient(135deg, #a855f7, #6366f1);
}

.gradient-orange {
  background: linear-gradient(135deg, #f97316, #f59e0b);
}

.gradient-pink {
  background: linear-gradient(135deg, #ec4899, #ef4444);
}

.gradient-dark {
  background: linear-gradient(135deg, #1f2937, #111827);
}
.section-icon {
  font-size: 20px;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
}
.drawer-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #f8fafc, #eef2ff);
}
</style>