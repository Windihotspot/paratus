<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import MainLayout from '@/layouts/full/MainLayout.vue'
import { useDebounceFn } from '@vueuse/core'
import { supabase } from '@/services/supabase' // adjust if needed
import * as pdfMake from 'pdfmake/build/pdfmake'
import * as pdfFonts from 'pdfmake/build/vfs_fonts'
import logoImage from '@/assets/paratus-logo.jpeg'
import { ElMessageBox, ElMessage } from 'element-plus'

const tab = ref<'under_review' | 'submitted_to_bank' | 'account_created'>('under_review')

const snackbar = ref(false)
const snackText = ref('')

const copyToClipboard = async (value: string, label?: string) => {
  try {
    if (!value) return

    await navigator.clipboard.writeText(value)

    snackText.value = `${label ? label + ' ' : ''}copied`
    snackbar.value = true
  } catch (err) {
    console.error('Copy failed:', err)
    snackText.value = 'Copy failed'
    snackbar.value = true
  }
}

const copyField = (value: any, label: string) => {
  copyToClipboard(String(value ?? ''), label)
}

// ----------------------
// PDF SETUP
// ----------------------
// ----------------------
// HELPERS
// ----------------------
const getBase64FromUrl = async (url: string): Promise<string> => {
  const res = await fetch(url)
  const blob = await res.blob()

  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.readAsDataURL(blob)
  })
}

// ----------------------
// BUILD FULL APPLICATION PDF
// ----------------------
const buildApplicationPDF = async (app: any) => {
  const logo = await getBase64FromUrl(logoImage)

  const statusMeta = getStatusMeta(app.application.status)

  // ✅ FETCH KYC IMAGES
  const kycImages = await Promise.all(
    (app.kyc_docs || []).map(async (doc: any) => {
      try {
        const base64 = await getBase64FromUrl(doc.file_path)

        return {
          stack: [
            {
              text: doc.doc_type.replace(/_/g, ' ').toUpperCase(),
              fontSize: 8,
              margin: [0, 0, 0, 4],
              bold: true
            },
            {
              image: base64,
              width: 100,
              margin: [0, 0, 10, 10]
            }
          ]
        }
      } catch (e) {
        return {
          text: `${doc.doc_type} (failed to load)`,
          fontSize: 8,
          color: 'red'
        }
      }
    })
  )

  return {
    pageMargins: [30, 40, 30, 40],

    // ✅ WATERMARK
    background: (currentPage: any, pageSize: any) => ({
      image: logo,
      width: 300,
      opacity: 0.05,
      absolutePosition: {
        x: (pageSize.width - 300) / 2,
        y: (pageSize.height - 300) / 2
      }
    }),

    content: [
      // =====================
      // HEADER
      // =====================
      {
        columns: [
          {
            stack: [
              { text: 'Application Report', style: 'header' },
              { text: app.full_name, style: 'subHeader' },
              {
                text: `Status: ${statusMeta.label}`,
                color: '#1d4ed8',
                margin: [0, 2, 0, 0]
              }
            ]
          },
          {
            image: logo,
            width: 80,
            alignment: 'right'
          }
        ],
        margin: [0, 0, 0, 15]
      },

      // =====================
      // PERSONAL DETAILS
      // =====================
      { text: 'Personal Details', style: 'sectionTitle' },

      {
        columns: [
          [
            `First Name: ${app.application.first_name}`,
            `Middle Name: ${app.application.middle_name}`,
            `Last Name: ${app.application.last_name}`,
            `Email: ${app.application.email}`,
            `Phone: ${app.application.phone_number}`,
            `DOB: ${app.application.date_of_birth}`,
            `Sex: ${app.application.sex}`,
            `Religion: ${app.application.religion}`
          ],
          [
            `NIN: ${app.application.nin}`,
            `State: ${app.application.state_of_origin}`,
            `LGA: ${app.application.lga_of_origin}`,
            `Place of Birth: ${app.application.place_of_birth}`,
            `Mother's Maiden Name: ${app.application.mothers_maiden_name}`
          ]
        ],
        margin: [0, 0, 0, 10]
      },

      // =====================
      // ADDRESS
      // =====================
      { text: 'Address', style: 'sectionTitle' },

      {
        text: `
Full Address: ${app.address?.full_address}
Town: ${app.address?.town_village}
State: ${app.address?.state}
Landmark: ${app.address?.nearest_landmark}
Bus Stop: ${app.address?.bus_stop_description}
Building Type: ${app.address?.building_type}
        `,
        margin: [0, 0, 0, 10]
      },

      // =====================
      // EMPLOYMENT
      // =====================
      { text: 'Employment', style: 'sectionTitle' },

      {
        text: `
Status: ${app.employment?.employment_status}
Employer: ${app.employment?.employer_name}
Business Type: ${app.employment?.business_type}
Info: ${app.employment?.additional_info}
        `,
        margin: [0, 0, 0, 10]
      },

      // =====================
      // NEXT OF KIN
      // =====================
      { text: 'Next of Kin', style: 'sectionTitle' },

      {
        text: `
Name: ${app.next_of_kin?.full_name}
Phone: ${app.next_of_kin?.phone_number}
Relationship: ${app.next_of_kin?.relationship}
Address: ${app.next_of_kin?.address}
        `,
        margin: [0, 0, 0, 10]
      },

      // =====================
      // KYC DOCUMENTS (IMAGES)
      // =====================
      { text: 'KYC Documents', style: 'sectionTitle' },

      {
        columns: kycImages.length ? kycImages : [{ text: 'No documents' }],
        margin: [0, 0, 0, 10]
      },

      // =====================
      // FOOTER NOTE
      // =====================
      {
        text: `Generated on ${new Date().toLocaleString()}`,
        style: 'footer',
        alignment: 'right',
        margin: [0, 20, 0, 0]
      }
    ],

    styles: {
      header: {
        fontSize: 18,
        bold: true,
        color: '#1f5aa3'
      },
      subHeader: {
        fontSize: 12,
        bold: true,
        margin: [0, 4, 0, 0]
      },
      sectionTitle: {
        fontSize: 11,
        bold: true,
        color: '#1f5aa3',
        margin: [0, 8, 0, 4]
      },
      footer: {
        fontSize: 9,
        italics: true,
        color: '#9ca3af'
      }
    }
  }
}
const downloading = ref(false)
const downloadDoc = async (url: string, name: string) => {
  try {
    downloading.value = true
    const response = await fetch(url)
    const blob = await response.blob()

    const blobUrl = window.URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = blobUrl
    a.download = name || 'kyc-document'

    document.body.appendChild(a)
    a.click()

    document.body.removeChild(a)
    window.URL.revokeObjectURL(blobUrl)
    snackText.value = `${name} downloaded`
    snackbar.value = true
  } catch (err) {
    console.error('Download failed:', err)
    snackText.value = 'Download failed'
    snackbar.value = true
  } finally {
    downloading.value = false
  }
}

// ----------------------
// EXPORT SINGLE APPLICATION
// ----------------------
const exportingPdf = ref(false)
const exportSinglePDF = async (app: any) => {
  try {
    exportingPdf.value = true
    if (!app) {
      alert('No application selected')
      return
    }

    const docDefinition = await buildApplicationPDF(app)

    pdfMake
      .createPdf(docDefinition)
      .download(`${app.full_name.replace(/\s+/g, '_')}_Application.pdf`)
  } catch (err) {
    console.error('PDF export error:', err)
  } finally {
    exportingPdf.value = false
  }
}

// ----------------------
// STATE
// ----------------------
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

const accountNumber = ref('')
const accountName = ref('')
const bankName = ref('')
const assigning = ref(false)

const assignAccountNumber = async () => {
  if (!accountNumber.value || !accountName.value) return

  try {
    assigning.value = true

    const { error } = await supabase.rpc('assign_account_number2', {
      p_application_id: selectedApp.value.application.id,
      p_account_number: accountNumber.value,
      p_account_name: accountName.value,
      p_bank_name: bankName.value
    })

    if (error) throw error

    snackText.value = 'Account assigned successfully'
    snackbar.value = true
    accountNumber.value = ''
    accountName.value = ''
    bankName.value = ''
    await fetchApplications()

    // update UI instantly
    selectedApp.value.application.status = 'account_created'
    drawer.value = false
  } catch (err) {
    console.error(err)
    snackText.value = 'Failed to assign account'
    snackbar.value = true
  } finally {
    assigning.value = false
  }
}
const isValidAccount = () => {
  return accountNumber.value && accountNumber.value.length === 11 && accountName.value
}
// ----------------------
// FETCH DATA
// ----------------------
const statusMap: Record<string, string> = {
  under_review: 'under_review',
  submitted_to_bank: 'submitted',
  account_created: 'account_created',
  rejected: 'rejected'
}

const statusOptions = [
  { label: 'Under Review', value: 'under_review' },
  { label: 'Submitted to Bank', value: 'submitted_to_bank' },
  { label: 'Onboarded', value: 'account_created' },
  { label: 'Rejected', value: 'rejected' }
]

const selectedStatus = ref('')
const updatingStatus = ref(false)
const fetchApplications = async () => {
  loading.value = true

  const { data, error } = await supabase.rpc('get_applications_full_view4', {
    p_limit: perPage.value,
    p_offset: (page.value - 1) * perPage.value,
    p_statuses: statusMap[tab.value],
    p_search: search.value || null
  })
  console.log('applications:', data)
  if (!error && data) {
    applications.value = data.data || []
    total.value = data.pagination?.total || 0
  }

  loading.value = false
}

const updateApplicationStatus = async () => {
  if (!selectedApp.value || !selectedStatus.value) return

  try {
    updatingStatus.value = true

    const { error } = await supabase.rpc('update_application_status', {
      p_application_id: selectedApp.value.application.id,
      p_status: statusMap[selectedStatus.value]
    })

    if (error) throw error

    snackText.value = 'Status updated successfully'
    snackbar.value = true

    // refresh data
    await fetchApplications()

    // update drawer instantly
    selectedApp.value.application.status = selectedStatus.value
    drawer.value = false
  } catch (err) {
    console.error(err)
    snackText.value = 'Failed to update status'
    snackbar.value = true
  } finally {
    updatingStatus.value = false
  }
}

// debounce search
const debouncedFetch = useDebounceFn(fetchApplications, 400)

watch([tab, page], fetchApplications)
watch(search, debouncedFetch)

onMounted(fetchApplications)

const deleting = ref(false)

const deleteApplication = async (app: any) => {
  try {
    await ElMessageBox.confirm(
      `This will permanently delete ${app.full_name} and all related data. Continue?`,
      'Delete Application',
      {
        confirmButtonText: 'Yes, Delete',
        cancelButtonText: 'Cancel',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )

    deleting.value = true

    // 🔥 1. Delete storage files ONLY (FIXED: file_name, not file_path)
    if (app.kyc_docs?.length) {
      const paths = app.kyc_docs.map((d: any) => d.file_name)

      const { error: storageError } = await supabase.storage.from('kyc-documents').remove(paths)

      if (storageError) throw storageError
    }

    // 🔥 2. Delete application (CASCADE handles everything else)
    const { error } = await supabase.rpc('delete_application_full2', {
      p_application_id: app.application.id
    })

    if (error) throw error

    ElMessage({
      type: 'success',
      message: 'Application deleted successfully'
    })

    await fetchApplications()
  } catch (err: any) {
    if (err === 'cancel' || err === 'close') return

    console.error(err)

    ElMessage({
      type: 'error',
      message: err?.message || 'Delete failed'
    })
  } finally {
    deleting.value = false
  }
}
// ----------------------
// VIEW DETAILS
// ----------------------
const openDetails = (item: any) => {
  selectedApp.value = item
  selectedStatus.value = item.application.status
  drawer.value = true
}

// ----------------------
// SIGNED URL FOR DOCS
// ----------------------
const getSignedUrl = async (path: string) => {
  const { data, error } = await supabase.storage.from('kyc-documents').createSignedUrl(path, 60)

  return data?.signedUrl
}

// ----------------------
// EXPORT (EXCEL)
// ----------------------
const exportExcel = async () => {
  const rows = applications.value.map((a) => ({
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
// const exportPDF = async () => {
//   const jsPDF = (await import('jspdf')).default

// }

const exportPDF = async () => {
  try {
    if (!applications.value.length) {
      alert('No applications to export')
      return
    }

    const logo = await getBase64FromUrl(logoImage)

    const tableBody = [
      // HEADER
      ['Name', 'Email', 'Phone', 'Status', 'Created'].map((h) => ({
        text: h,
        bold: true,
        fillColor: '#27bfa0',
        color: '#fff',
        fontSize: 9
      })),

      // ROWS
      ...applications.value.map((a, i) => {
        const statusMeta = getStatusMeta(a.application.status)

        return [
          a.full_name || 'N/A',
          a.application.email || 'N/A',
          a.application.phone_number || 'N/A',
          {
            text: statusMeta.label,
            color:
              statusMeta.color === 'green'
                ? '#15803d'
                : statusMeta.color === 'orange'
                  ? '#ea580c'
                  : statusMeta.color === 'red'
                    ? '#dc2626'
                    : '#1d4ed8',
            bold: true
          },
          new Date(a.application.created_at).toLocaleString()
        ].map((cell) => ({
          text: typeof cell === 'object' ? cell.text : String(cell),
          fontSize: 8,
          fillColor: i % 2 === 0 ? '#f9fafb' : null,
          color: typeof cell === 'object' ? cell.color : '#374151',
          bold: typeof cell === 'object' ? cell.bold : false
        }))
      })
    ]

    const docDefinition = {
      pageOrientation: 'landscape',

      // ✅ WATERMARK (same as loans)
      background: (currentPage, pageSize) => ({
        image: logo,
        width: 300,
        opacity: 0.08,
        absolutePosition: {
          x: (pageSize.width - 300) / 2,
          y: (pageSize.height - 300) / 2
        }
      }),

      content: [
        // ✅ HEADER
        {
          columns: [
            {
              stack: [
                { text: 'Applications Report', style: 'header' },
                {
                  text: `Tab: ${tab.value === 'under_review' ? 'Under Review' : 'Onboarded'}`,
                  style: 'sub'
                },
                {
                  text: `Total Records: ${applications.value.length}`,
                  style: 'sub'
                }
              ]
            },
            {
              image: logo,
              width: 80,
              alignment: 'right'
            }
          ],
          margin: [0, 0, 0, 16]
        },

        // ✅ TABLE
        {
          style: 'table',
          table: {
            headerRows: 1,
            widths: ['22%', '25%', '18%', '15%', '20%'],
            body: tableBody
          },
          layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0,
            hLineColor: () => '#e5e7eb'
          }
        },

        // ✅ FOOTER
        {
          text: `Generated on ${new Date().toLocaleString()}`,
          style: 'footer',
          alignment: 'right',
          margin: [0, 20, 0, 0]
        }
      ],

      styles: {
        header: { fontSize: 18, bold: true, color: '#1f5aa3' },
        sub: { fontSize: 10, color: '#6b7280', margin: [0, 2, 0, 0] },
        table: { margin: [0, 0, 0, 10] },
        footer: { fontSize: 9, italics: true, color: '#9ca3af' }
      },

      pageMargins: [30, 40, 30, 40]
    }

    pdfMake
      .createPdf(docDefinition)
      .download(`Applications_${tab.value}_${new Date().toISOString().split('T')[0]}.pdf`)
  } catch (err: any) {
    console.error(err)
  }
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
      return { label: 'Submitted', color: 'orange', icon: 'mdi-send' }

    case 'under_review':
      return { label: 'Under Review', color: 'blue', icon: 'mdi-eye-outline' }

    case 'account_created':
      return { label: 'Onboarded', color: 'green', icon: 'mdi-check-circle' }

    case 'rejected':
      return { label: 'Rejected', color: 'red', icon: 'mdi-close-circle' }

    case 'verified':
      return { label: 'Verified', color: 'teal', icon: 'mdi-shield-check' }

    default:
      return { label: status, color: 'blue', icon: 'mdi-help-circle' }
  }
}
const accountNumberRules = [
  (v: string) => !!v || 'Account number is required',
  (v: string) => (v && v.length === 10) || 'Account number must be 10 digits'
]
const getLogIcon = (action: string) => {
  switch (action) {
    case 'STATUS_UPDATE':
      return 'mdi-swap-horizontal'
    case 'ACCOUNT_ASSIGNED':
      return 'mdi-bank-check'
    case 'KYC_VERIFIED':
      return 'mdi-shield-check'
    default:
      return 'mdi-information'
  }
}

const getLogColor = (action: string) => {
  switch (action) {
    case 'STATUS_UPDATE':
      return 'blue'
    case 'ACCOUNT_ASSIGNED':
      return 'green'
    case 'KYC_VERIFIED':
      return 'purple'
    default:
      return 'grey'
  }
}

const formatActionTitle = (log: any) => {
  if (log.action === 'STATUS_UPDATE') {
    return `${log.old_value?.status || 'unknown'} → ${log.new_value?.status || 'updated'}`
  }

  if (log.action === 'ACCOUNT_ASSIGNED') {
    return 'Account Assigned'
  }

  return log.action
}

const formatActionDetails = (log: any) => {
  if (log.action === 'ACCOUNT_ASSIGNED') {
    return `Account: ${log.metadata?.account_number || '-'} | Name: ${log.metadata?.account_name || '-'}`
  }

  if (log.action === 'STATUS_UPDATE') {
    return 'Application status changed'
  }

  return ''
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
      <v-tab value="submitted_to_bank">Submitted to Bank</v-tab>
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
            <div class="flex gap-6">
              <v-btn color="primary" size="small" @click="openDetails(item)">View</v-btn>
              <v-tooltip text="Delete">
                <template #activator="{ props }">
                  <v-btn
                    v-bind="props"
                    color="red"
                    size="small"
                    variant="text"
                    icon="mdi-delete"
                    @click="deleteApplication(item)"
                  />
                </template>
              </v-tooltip>
            </div>
          </td>
        </tr>
      </template>
    </v-data-table>

    <!-- DETAILS DRAWER -->
    <v-navigation-drawer v-model="drawer" location="right" width="800" temporary>
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

          <div class="flex gap-2">
            <v-btn
              :loading="exportingPdf"
              :disabled="exportingPdf"
              class="pdf-btn"
              prepend-icon="mdi-download"
              @click="exportSinglePDF(selectedApp)"
            >
              Download PDF
            </v-btn>
          </div>
          <v-btn icon variant="text" @click="drawer = false">
            <v-icon color="red-darken-2">mdi-close</v-icon>
          </v-btn>
        </div>

        <v-divider class="mb-3" />

        <!-- BODY -->
        <div class="drawer-body">
          <!-- <v-alert
  type="info"
  density="compact"
  class="mb-3"
  variant="outlined"
>
  Current Status:
  <b>{{ getStatusMeta(selectedApp.application.status).label }}</b>
</v-alert> -->

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
              <div class="space-y-2">
                <!-- First Name -->
                <div class="flex items-center justify-between text-sm">
                  <div><b>First Name:</b> {{ selectedApp.application.first_name }}</div>
                  <v-btn
                    icon
                    size="x-small"
                    variant="text"
                    @click="copyField(selectedApp.application.first_name, 'First Name')"
                  >
                    <v-icon size="16">mdi-content-copy</v-icon>
                  </v-btn>
                </div>

                <!-- Middle Name -->
                <div class="flex items-center justify-between text-sm">
                  <div><b>Middle Name:</b> {{ selectedApp.application.middle_name }}</div>
                  <v-btn
                    icon
                    size="x-small"
                    variant="text"
                    @click="copyField(selectedApp.application.middle_name, 'Middle Name')"
                  >
                    <v-icon size="16">mdi-content-copy</v-icon>
                  </v-btn>
                </div>

                <!-- Last Name -->
                <div class="flex items-center justify-between text-sm">
                  <div><b>Last Name:</b> {{ selectedApp.application.last_name }}</div>
                  <v-btn
                    icon
                    size="x-small"
                    variant="text"
                    @click="copyField(selectedApp.application.last_name, 'Last Name')"
                  >
                    <v-icon size="16">mdi-content-copy</v-icon>
                  </v-btn>
                </div>

                <!-- BVN -->
                <div class="flex items-center justify-between text-sm">
                  <div><b>BVN:</b> {{ selectedApp.application.bvn }}</div>
                  <v-btn
                    icon
                    size="x-small"
                    variant="text"
                    @click="copyField(selectedApp.application.nin, 'NIN')"
                  >
                    <v-icon size="16">mdi-content-copy</v-icon>
                  </v-btn>
                </div>

                <!-- NIN -->
                <div class="flex items-center justify-between text-sm">
                  <div><b>NIN:</b> {{ selectedApp.application.nin }}</div>
                  <v-btn
                    icon
                    size="x-small"
                    variant="text"
                    @click="copyField(selectedApp.application.nin, 'NIN')"
                  >
                    <v-icon size="16">mdi-content-copy</v-icon>
                  </v-btn>
                </div>

                <!-- Phone -->
                <div class="flex items-center justify-between text-sm">
                  <div><b>Phone:</b> {{ selectedApp.application.phone_number }}</div>
                  <v-btn
                    icon
                    size="x-small"
                    variant="text"
                    @click="copyField(selectedApp.application.phone_number, 'Phone')"
                  >
                    <v-icon size="16">mdi-content-copy</v-icon>
                  </v-btn>
                </div>

                <!-- Email -->
                <div class="flex items-center justify-between text-sm">
                  <div><b>Email:</b> {{ selectedApp.application.email }}</div>
                  <v-btn
                    icon
                    size="x-small"
                    variant="text"
                    @click="copyField(selectedApp.application.email, 'Email')"
                  >
                    <v-icon size="16">mdi-content-copy</v-icon>
                  </v-btn>
                </div>

                <!-- DOB -->
                <div class="flex items-center justify-between text-sm">
                  <div><b>DOB:</b> {{ selectedApp.application.date_of_birth }}</div>
                  <v-btn
                    icon
                    size="x-small"
                    variant="text"
                    @click="copyField(selectedApp.application.date_of_birth, 'DOB')"
                  >
                    <v-icon size="16">mdi-content-copy</v-icon>
                  </v-btn>
                </div>

                <!-- Sex -->
                <div class="flex items-center justify-between text-sm">
                  <div><b>Sex:</b> {{ selectedApp.application.sex }}</div>
                  <v-btn
                    icon
                    size="x-small"
                    variant="text"
                    @click="copyField(selectedApp.application.sex, 'Sex')"
                  >
                    <v-icon size="16">mdi-content-copy</v-icon>
                  </v-btn>
                </div>

                <!-- Religion -->
                <div class="flex items-center justify-between text-sm">
                  <div><b>Religion:</b> {{ selectedApp.application.religion }}</div>
                  <v-btn
                    icon
                    size="x-small"
                    variant="text"
                    @click="copyField(selectedApp.application.religion, 'Religion')"
                  >
                    <v-icon size="16">mdi-content-copy</v-icon>
                  </v-btn>
                </div>

                <!-- State of Origin -->
                <div class="flex items-center justify-between text-sm">
                  <div><b>State of Origin:</b> {{ selectedApp.application.state_of_origin }}</div>
                  <v-btn
                    icon
                    size="x-small"
                    variant="text"
                    @click="copyField(selectedApp.application.state_of_origin, 'State of Origin')"
                  >
                    <v-icon size="16">mdi-content-copy</v-icon>
                  </v-btn>
                </div>

                <!-- LGA -->
                <div class="flex items-center justify-between text-sm">
                  <div><b>LGA:</b> {{ selectedApp.application.lga_of_origin }}</div>
                  <v-btn
                    icon
                    size="x-small"
                    variant="text"
                    @click="copyField(selectedApp.application.lga_of_origin, 'LGA')"
                  >
                    <v-icon size="16">mdi-content-copy</v-icon>
                  </v-btn>
                </div>

                <!-- Mother's Maiden Name -->
                <div class="flex items-center justify-between text-sm">
                  <div>
                    <b>Mother's Maiden Name:</b>
                    {{ selectedApp.application.mothers_maiden_name }}
                  </div>
                  <v-btn
                    icon
                    size="x-small"
                    variant="text"
                    @click="
                      copyField(selectedApp.application.mothers_maiden_name, 'Mother Maiden Name')
                    "
                  >
                    <v-icon size="16">mdi-content-copy</v-icon>
                  </v-btn>
                </div>
              </div>
            </v-card-text>
          </v-card>

          <!-- ADDRESS -->
          <v-card class="glass-card mb-4">
            <div class="card-header gradient-green">
              <v-icon class="section-icon">mdi-home-map-marker</v-icon>
              Address
            </div>

            <v-card-text>
              <div class="space-y-2">
                <!-- Full Address -->
                <div class="flex items-center justify-between text-sm">
                  <div><b>Full Address:</b> {{ selectedApp.address?.full_address }}</div>
                  <v-btn
                    icon
                    size="x-small"
                    variant="text"
                    @click="copyField(selectedApp.address?.full_address, 'Full Address')"
                  >
                    <v-icon size="16">mdi-content-copy</v-icon>
                  </v-btn>
                </div>

                <!-- Town -->
                <div class="flex items-center justify-between text-sm">
                  <div><b>Town:</b> {{ selectedApp.address?.town_village }}</div>
                  <v-btn
                    icon
                    size="x-small"
                    variant="text"
                    @click="copyField(selectedApp.address?.town_village, 'Town')"
                  >
                    <v-icon size="16">mdi-content-copy</v-icon>
                  </v-btn>
                </div>

                <!-- State -->
                <div class="flex items-center justify-between text-sm">
                  <div><b>State:</b> {{ selectedApp.address?.state }}</div>
                  <v-btn
                    icon
                    size="x-small"
                    variant="text"
                    @click="copyField(selectedApp.address?.state, 'State')"
                  >
                    <v-icon size="16">mdi-content-copy</v-icon>
                  </v-btn>
                </div>

                <!-- Landmark -->
                <div class="flex items-center justify-between text-sm">
                  <div><b>Landmark:</b> {{ selectedApp.address?.nearest_landmark }}</div>
                  <v-btn
                    icon
                    size="x-small"
                    variant="text"
                    @click="copyField(selectedApp.address?.nearest_landmark, 'Landmark')"
                  >
                    <v-icon size="16">mdi-content-copy</v-icon>
                  </v-btn>
                </div>

                <!-- Bus Stop -->
                <div class="flex items-center justify-between text-sm">
                  <div><b>Bus Stop:</b> {{ selectedApp.address?.bus_stop_description }}</div>
                  <v-btn
                    icon
                    size="x-small"
                    variant="text"
                    @click="copyField(selectedApp.address?.bus_stop_description, 'Bus Stop')"
                  >
                    <v-icon size="16">mdi-content-copy</v-icon>
                  </v-btn>
                </div>

                <!-- Building Type -->
                <div class="flex items-center justify-between text-sm">
                  <div><b>Building Type:</b> {{ selectedApp.address?.building_type }}</div>
                  <v-btn
                    icon
                    size="x-small"
                    variant="text"
                    @click="copyField(selectedApp.address?.building_type, 'Building Type')"
                  >
                    <v-icon size="16">mdi-content-copy</v-icon>
                  </v-btn>
                </div>
              </div>
            </v-card-text>
          </v-card>

          <!-- EMPLOYMENT -->
          <v-card class="glass-card mb-4">
            <div class="card-header gradient-orange">
              <v-icon class="section-icon">mdi-briefcase</v-icon>
              Employment
            </div>

            <v-card-text>
              <div class="space-y-2">
                <!-- Status -->
                <div class="flex items-center justify-between text-sm">
                  <div><b>Status:</b> {{ selectedApp.employment?.employment_status }}</div>
                  <v-btn
                    icon
                    size="x-small"
                    variant="text"
                    @click="
                      copyField(selectedApp.employment?.employment_status, 'Employment Status')
                    "
                  >
                    <v-icon size="16">mdi-content-copy</v-icon>
                  </v-btn>
                </div>

                <!-- Employer -->
                <div class="flex items-center justify-between text-sm">
                  <div><b>Employer:</b> {{ selectedApp.employment?.employer_name }}</div>
                  <v-btn
                    icon
                    size="x-small"
                    variant="text"
                    @click="copyField(selectedApp.employment?.employer_name, 'Employer')"
                  >
                    <v-icon size="16">mdi-content-copy</v-icon>
                  </v-btn>
                </div>

                <!-- Business Type -->
                <div class="flex items-center justify-between text-sm">
                  <div><b>Employer address:</b> {{ selectedApp.employment?.employer_address }}</div>
                  <v-btn
                    icon
                    size="x-small"
                    variant="text"
                    @click="copyField(selectedApp.employment?.business_type, 'Business Type')"
                  >
                    <v-icon size="16">mdi-content-copy</v-icon>
                  </v-btn>
                </div>

                <!-- Additional Info -->
                <div class="flex items-center justify-between text-sm">
                  <div><b>Additional Info:</b> {{ selectedApp.employment?.additional_info }}</div>
                  <v-btn
                    icon
                    size="x-small"
                    variant="text"
                    @click="copyField(selectedApp.employment?.additional_info, 'Additional Info')"
                  >
                    <v-icon size="16">mdi-content-copy</v-icon>
                  </v-btn>
                </div>
              </div>
            </v-card-text>
          </v-card>

          <!-- NEXT OF KIN -->
          <v-card class="glass-card mb-4">
            <div class="card-header gradient-pink">
              <v-icon class="section-icon">mdi-account-heart</v-icon>
              Next of Kin
            </div>

            <v-card-text>
              <div class="space-y-2">
                <!-- Name -->
                <div class="flex items-center justify-between text-sm">
                  <div><b>Name:</b> {{ selectedApp.next_of_kin?.full_name }}</div>
                  <v-btn
                    icon
                    size="x-small"
                    variant="text"
                    @click="copyField(selectedApp.next_of_kin?.full_name, 'Next of Kin Name')"
                  >
                    <v-icon size="16">mdi-content-copy</v-icon>
                  </v-btn>
                </div>

                <!-- Phone -->
                <div class="flex items-center justify-between text-sm">
                  <div><b>Phone:</b> {{ selectedApp.next_of_kin?.phone_number }}</div>
                  <v-btn
                    icon
                    size="x-small"
                    variant="text"
                    @click="copyField(selectedApp.next_of_kin?.phone_number, 'Next of Kin Phone')"
                  >
                    <v-icon size="16">mdi-content-copy</v-icon>
                  </v-btn>
                </div>

                <!-- Relationship -->
                <div class="flex items-center justify-between text-sm">
                  <div><b>Relationship:</b> {{ selectedApp.next_of_kin?.relationship }}</div>
                  <v-btn
                    icon
                    size="x-small"
                    variant="text"
                    @click="copyField(selectedApp.next_of_kin?.relationship, 'Relationship')"
                  >
                    <v-icon size="16">mdi-content-copy</v-icon>
                  </v-btn>
                </div>

                <!-- Address -->
                <div class="flex items-center justify-between text-sm">
                  <div><b>Address:</b> {{ selectedApp.next_of_kin?.address }}</div>
                  <v-btn
                    icon
                    size="x-small"
                    variant="text"
                    @click="copyField(selectedApp.next_of_kin?.address, 'Next of Kin Address')"
                  >
                    <v-icon size="16">mdi-content-copy</v-icon>
                  </v-btn>
                </div>
              </div>
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
                class="flex items-center justify-between mb-2 p-2 rounded hover:bg-gray-50 transition"
              >
                <!-- Doc Name -->
                <div class="text-sm font-medium">
                  {{ doc.doc_type }}
                </div>

                <!-- Actions -->
                <div class="flex items-center gap-2">
                  <!-- VIEW -->
                  <v-btn
                    icon
                    size="x-small"
                    variant="text"
                    color="primary"
                    @click="openDoc(doc.file_path)"
                  >
                    <v-icon size="18">mdi-eye</v-icon>
                  </v-btn>

                  <!-- DOWNLOAD -->
                  <v-btn
                    icon
                    size="x-small"
                    variant="text"
                    color="green"
                    @click="downloadDoc(doc.file_path, doc.doc_type)"
                  >
                    <v-icon size="18">mdi-download</v-icon>
                  </v-btn>
                </div>
              </div>
            </v-card-text>
          </v-card>

          <!-- STATUS TIMELINE -->
          <v-card class="glass-card mb-6">
            <div class="card-header gradient-blue">
              <v-icon class="section-icon">mdi-timeline</v-icon>
              Audit Trail
            </div>

            <v-card-text>
              <v-timeline density="compact" side="end">
                <v-timeline-item
                  v-for="log in selectedApp.status_log"
                  :key="log.id"
                  :dot-color="getLogColor(log.action)"
                  size="small"
                >
                  <!-- ICON -->
                  <template #icon>
                    <v-icon size="18">
                      {{ getLogIcon(log.action) }}
                    </v-icon>
                  </template>

                  <!-- TITLE -->
                  <div class="mb-1 font-weight-bold">
                    {{ formatActionTitle(log) }}
                  </div>

                  <!-- DETAILS -->
                  <div class="text-sm text-gray-600 mb-1">
                    {{ formatActionDetails(log) }}
                  </div>

                  <!-- TIME -->
                  <div class="text-xs text-gray-400">
                    {{ new Date(log.created_at).toLocaleString() }}
                  </div>
                </v-timeline-item>
              </v-timeline>
            </v-card-text>
          </v-card>

          <!-- STATUS UPDATE SECTION -->
          <v-card class="glass-card mb-6">
            <div
              class="card-header"
              :class="
                selectedApp.application.status === 'account_created'
                  ? 'gradient-green'
                  : 'gradient-blue'
              "
            >
              <v-icon class="section-icon">
                {{
                  selectedApp.application.status === 'account_created'
                    ? 'mdi-check-circle'
                    : 'mdi-update'
                }}
              </v-icon>

              {{
                selectedApp.application.status === 'account_created'
                  ? 'Application Onboarded'
                  : 'Update Application Status'
              }}
            </div>

            <v-card-text>
              <!-- 🔒 LOCKED STATE -->
              <div v-if="selectedApp.application.status === 'account_created'">
                <div class="flex items-center gap-2 text-green-600 font-medium">
                  <v-icon color="green">mdi-lock</v-icon>
                  This application is locked
                </div>

                <p class="text-sm text-gray-600 mt-2 leading-relaxed">
                  The onboarding process has been completed. Status changes are disabled.
                </p>
              </div>

              <!-- ✏️ ACTIVE STATE -->
              <div v-else>
                <v-select
                  v-model="selectedStatus"
                  :items="statusOptions"
                  item-title="label"
                  item-value="value"
                  label="Select new status"
                  variant="outlined"
                  density="compact"
                />

                <v-btn
                  class="mt-3"
                  color="primary"
                  block
                  :loading="updatingStatus"
                  :disabled="!selectedStatus || updatingStatus"
                  @click="updateApplicationStatus"
                >
                  Update Status
                </v-btn>
              </div>
            </v-card-text>
          </v-card>

          <v-card v-if="selectedApp.application.status === 'submitted'" class="glass-card mb-6">
            <div class="card-header gradient-green">
              <v-icon class="section-icon">mdi-bank</v-icon>
              Assign Account Number
            </div>

            <v-card-text>
              <v-text-field
                v-model="accountNumber"
                label="Account Number"
                variant="outlined"
                density="compact"
                maxLength="10"
                :rules="accountNumberRules"
              />

              <v-text-field
                v-model="accountName"
                label="Account Name"
                variant="outlined"
                density="compact"
              />

              <!-- <v-text-field
    readOnly
    disabled
      v-model="bankName"
      label="Bank Name"
      variant="outlined"
      density="compact"
    /> -->

              <v-btn
                class="mt-3"
                color="success"
                block
                :disabled="!isValidAccount() || assigning"
                :loading="assigning"
                @click="assignAccountNumber"
              >
                Assign & Onboard
              </v-btn>
            </v-card-text>
          </v-card>
        </div>
      </div>
      <v-snackbar
        v-model="snackbar"
        location="top right"
        timeout="2000"
        color="green-darken-2"
        elevation="6"
        rounded="lg"
      >
        <div class="flex items-center gap-2">
          <v-icon size="18">mdi-check-circle</v-icon>
          {{ snackText }}
        </div>
      </v-snackbar>
    </v-navigation-drawer>
  </MainLayout>
</template>

<style scoped>
.v-snackbar {
  font-weight: 500;
  letter-spacing: 0.2px;
}
.v-btn {
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
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}
.drawer-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #f8fafc, #eef2ff);
}
.v-btn {
  text-transform: none;
}
.pdf-btn {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
  border-radius: 10px;
  text-transform: none;
  font-weight: 500;
  box-shadow: 0 6px 18px rgba(220, 38, 38, 0.25);
}
.space-y-2 > div {
  padding: 6px 8px;
  border-radius: 8px;
  transition: background 0.2s ease;
}

.space-y-2 > div:hover {
  background: rgba(0, 0, 0, 0.03);
}
</style>
