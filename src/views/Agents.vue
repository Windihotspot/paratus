<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import MainLayout from '@/layouts/full/MainLayout.vue'
import { ElMessage, ElNotification } from 'element-plus'
import { supabase } from '@/services/supabase.js'
import { useAuthStore } from '@/stores/auth'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import * as pdfMake from 'pdfmake/build/pdfmake'
import { ElMessageBox } from 'element-plus'
import * as pdfFonts from 'pdfmake/build/vfs_fonts'
import logoImage from '@/assets/New Logo_with_Paratus.png'
const authStore = useAuthStore()
const facilities = computed(() => authStore.facilities)
const merchantId = authStore.merchant?.id
// --- NEW: Agent Loan Export ---

const showExportDialog = ref(false)
const exportingAgent = ref(null) // the agent row clicked
const exportFacilityId = ref(null) // selected facility filter
const exportStatusFilter = ref('All') // selected status filter
const exportLoading = ref(false)
const exportExcelLoading = ref(false)

const exportStatusOptions = ['All', 'Active', 'Active < 5 days', 'Closed', 'Completed', 'Defaulted']

// Reuse from loans page
const getStatusBadge = (loan) => {
  if (!loan.status || !loan.expiry_date) return { text: 'N/A', color: 'gray' }
  const today = new Date()
  const expiry = new Date(loan.expiry_date)
  const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24))
  if (loan.status === 'active') {
    if (diffDays > 0) {
      return diffDays <= 5
        ? { text: `active < ${diffDays} day${diffDays > 1 ? 's' : ''}`, color: 'red' }
        : { text: 'active', color: 'green' }
    }
    return { text: 'closed', color: 'red' }
  }
  if (loan.status === 'completed') return { text: 'completed', color: 'blue' }
  if (loan.status === 'defaulted') return { text: 'defaulted', color: 'blue' }
  return { text: loan.status, color: 'gray' }
}

const formatCurrency = (value) => {
  if (!value) return '₦0.00'
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(value)
}

const openExportDialog = (a) => {
  exportingAgent.value = a
  exportFacilityId.value = null
  exportStatusFilter.value = 'All'
  showExportDialog.value = true
}

// Fetch + filter agent loans
const fetchAndFilterAgentLoans = async () => {
  const { data, error } = await supabase.rpc('fetch_agent_loans', {
    p_agent_id: exportingAgent.value.id,
    p_merchant_id: merchantId,
    p_facility_id: exportFacilityId.value || null
  })
  if (error) throw error

  let loans = data || []

  // Apply status filter
  if (exportStatusFilter.value !== 'All') {
    loans = loans.filter((loan) => {
      const badge = getStatusBadge(loan).text.toLowerCase()
      const sel = exportStatusFilter.value.toLowerCase()
      if (sel === 'active') return badge === 'active'
      if (sel === 'active < 5 days') return badge.startsWith('active <')
      if (sel === 'closed') return badge === 'closed'
      if (sel === 'completed') return badge === 'completed'
      if (sel === 'defaulted') return badge === 'defaulted'
      return false
    })
  }

  return loans
}

// Export as Excel
const exportAgentLoansExcel = async () => {
  exportExcelLoading.value = true
  try {
    const loans = await fetchAndFilterAgentLoans()
    if (!loans.length) {
      ElMessage({ message: 'No loans match the selected filters', type: 'warning' })
      return
    }

    const rows = loans.map((l) => ({
      'Customer Name': l.customer_name || 'N/A',
      'Account Number': l.customer_account_number || 'N/A',
      Phone: l.customer_phone || 'N/A',
      'Facility / Bank': l.facility_name || 'N/A',
      'Loan Amount': l.loan_amount,
      'Agreed Rate (%)': l.agreed_rate,
      'Tenure (Days)': l.tenure_days,
      'Disbursed At': l.disbursed_at,
      'Expiry Date': l.expiry_date,
      'Interest Payable': l.interest_payable,
      Profit: l.profit,
      Status: getStatusBadge(l).text
    }))

    const ws = XLSX.utils.json_to_sheet(rows)
    ws['!cols'] = Object.keys(rows[0]).map(() => ({ wch: 20 }))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Agent Loans')
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    saveAs(
      new Blob([wbout], { type: 'application/octet-stream' }),
      `${exportingAgent.value.full_name || 'Agent'}_Loans.xlsx`
    )
    showExportDialog.value = false
    ElMessage({ message: 'Excel exported!', type: 'success' })
  } catch (err) {
    ElNotification({ title: 'Error', message: err.message, type: 'error' })
  } finally {
    exportLoading.value = false
  }
}

// Export as PDF
const exportAgentLoansPDF = async () => {
  exportLoading.value = true
  try {
    const loans = await fetchAndFilterAgentLoans()
    if (!loans.length) {
      ElMessage({ message: 'No loans match the selected filters', type: 'warning' })
      return
    }

    const logo = await getBase64FromUrl(logoImage)
    const agent = exportingAgent.value
    const facilityLabel = exportFacilityId.value
      ? facilities.value.find((f) => f.id === exportFacilityId.value)?.bank_name || 'N/A'
      : 'All'

    const tableBody = [
      // header row
      ['Customer', 'Account No.', 'Bank', 'Amount', 'Rate%', 'Disbursed', 'Expiry', 'Status'].map(
        (h) => ({ text: h, bold: true, fillColor: '#27bfa0', color: '#fff', fontSize: 9 })
      ),
      // data rows
      ...loans.map((l, i) =>
        [
          l.customer_name || 'N/A',
          l.customer_account_number || 'N/A',
          l.facility_name || 'N/A',
          formatCurrency(l.loan_amount),
          `${l.agreed_rate ?? 0}%`,
          l.disbursed_at || 'N/A',
          l.expiry_date || 'N/A',
          {
            text: getStatusBadge(l).text,
            color:
              getStatusBadge(l).color === 'green'
                ? '#15803d'
                : getStatusBadge(l).color === 'red'
                  ? '#dc2626'
                  : '#1d4ed8',
            bold: true
          }
        ].map((cell, ci) => ({
          text: typeof cell === 'object' ? cell.text : String(cell),
          fontSize: 8,
          fillColor: i % 2 === 0 ? '#f9fafb' : null,
          color: typeof cell === 'object' ? cell.color : '#374151',
          bold: typeof cell === 'object' ? cell.bold : false
        }))
      )
    ]

    const docDefinition = {
      pageOrientation: 'landscape',
      content: [
        {
          columns: [
            {
              stack: [
                { text: 'Agent Loan Report', style: 'header' },
                { text: `Agent: ${agent.full_name || 'N/A'}`, style: 'sub' },
                {
                  text: `Facility: ${facilityLabel}   |   Status: ${exportStatusFilter.value}`,
                  style: 'sub'
                },
                {
                  text: `Total Loans: ${loans.length}   |   Total Amount: ${formatCurrency(loans.reduce((s, l) => s + Number(l.loan_amount || 0), 0))}`,
                  style: 'sub'
                }
              ]
            },
            { image: logo, width: 80, alignment: 'right' }
          ],
          margin: [0, 0, 0, 16]
        },
        {
          style: 'loanTable',
          table: {
            headerRows: 1,
            widths: ['15%', '13%', '12%', '12%', '7%', '11%', '11%', '12%'],
            body: tableBody
          },
          layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0,
            hLineColor: () => '#e5e7eb'
          }
        },
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
        loanTable: { margin: [0, 0, 0, 10] },
        footer: { fontSize: 9, italics: true, color: '#9ca3af' }
      },
      pageMargins: [30, 40, 30, 40]
    }

    pdfMake.createPdf(docDefinition).download(`${agent.full_name || 'Agent'}_Loans.pdf`)
    showExportDialog.value = false
  } catch (err) {
    ElNotification({ title: 'Error', message: err.message, type: 'error' })
  } finally {
    exportLoading.value = false
  }
}

// state
const agents = ref([])
const loading = ref(false)
const showModal = ref(false)
const showDeleteModal = ref(false)
const agentToDelete = ref(null)
const isEditing = ref(false)
const editingAgentId = ref(null)
const searchQuery = ref('')
const formRef = ref(null)
const valid = ref(false)

// form model
const agent = ref({
  full_name: '',
  alias: '',
  phone: '',
  email: '',
  location: '',
  agreed_rate: '',
  remark: '',
  status: 'active'
})

// status options
const statusOptions = ['All', 'active', 'inactive', 'suspended']
const selectedStatus = ref('All')

// helper to convert logo for pdf
const getBase64FromUrl = async (url) => {
  const res = await fetch(url)
  const blob = await res.blob()
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.readAsDataURL(blob)
  })
}

// fetch agents
const fetchAgents = async () => {
  loading.value = true
  try {
    const { data, error } = await supabase.rpc('get_merchant_agents', {
      p_merchant_id: merchantId
    })
    if (error) throw error
    agents.value = (data || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  } catch (err) {
    console.error('Error fetching agents:', err)
    ElNotification({
      title: 'Error',
      message: err.message || 'Failed to fetch agents',
      type: 'error'
    })
  } finally {
    loading.value = false
  }
}

// open add modal
const openModal = () => {
  isEditing.value = false
  editingAgentId.value = null
  agent.value = {
    id: null,
    full_name: '',
    alias: '',
    phone: '',
    email: '',
    location: '',
    agreed_rate: '',
    remark: '',
    status: 'active'
  }
  showModal.value = true
}

// open edit modal
const editAgent = (a) => {
  isEditing.value = true
  editingAgentId.value = a.id
  agent.value = {
    id: a.id, // ✅ include this
    full_name: a.full_name || a.name || '',
    alias: a.alias || '',
    phone: a.phone || '',
    email: a.email || '',
    location: a.location || '',
    agreed_rate: a.agreed_rate || '',
    remark: a.remark || '',
    status: a.status || 'active'
  }
  showModal.value = true
}

// submit add / edit
const submitAgent = async () => {
  // if formRef supports validate
  if (formRef.value && formRef.value.validate) {
    const ok = await formRef.value.validate()
    if (!ok) {
      ElMessage({ message: 'Please fix the form errors', type: 'error' })
      return
    }
  }
  loading.value = true
  try {
    if (isEditing.value) {
      // 👇 Log payload for update
      const updatePayload = {
        p_id: agent.value.id,
        p_full_name: agent.value.full_name?.trim() || null,
        p_alias: agent.value.alias?.trim() || null,
        p_phone: agent.value.phone?.trim() || null,
        p_email: agent.value.email?.trim() || null,
        p_location: agent.value.location?.trim() || null,
        p_agreed_rate: agent.value.agreed_rate === '' ? null : agent.value.agreed_rate,
        p_remark: agent.value.remark?.trim() || null,
        p_status: agent.value.status || 'active'
      }

      console.log('🧾 Update Agent Payload:', updatePayload)
      const { error } = await supabase.rpc('update_agent', updatePayload)

      if (error) throw error
      ElNotification({ title: 'Success', message: 'Agent updated successfully!', type: 'success' })
    } else {
      const { error } = await supabase.rpc('add_agent', {
        p_merchant_id: merchantId,
        p_full_name: agent.value.full_name,
        p_alias: agent.value.alias || null,
        p_phone: agent.value.phone || null,
        p_email: agent.value.email || null,
        p_location: agent.value.location || null,
        // Convert empty string to null for numeric fields
        p_agreed_rate: agent.value.agreed_rate === '' ? null : agent.value.agreed_rate,
        p_remark: agent.value.remark || null,
        p_status: agent.value.status || 'active'
      })

      if (error) throw error
      ElNotification({ title: 'Success', message: 'Agent added successfully!', type: 'success' })
    }
    await fetchAgents()
    closeModal()
  } catch (err) {
    console.error('Error saving agent:', err)
    ElNotification({
      title: 'Error',
      message: err.message || 'Failed to save agent',
      type: 'error'
    })
  } finally {
    loading.value = false
  }
}

const closeModal = () => {
  showModal.value = false
  isEditing.value = false
  editingAgentId.value = null
  if (formRef.value && formRef.value.reset) formRef.value.reset()
}

// delete flow
const openDeleteModal = (a) => {
  agentToDelete.value = a
  showDeleteModal.value = true
}

const cancelDelete = () => {
  agentToDelete.value = null
  showDeleteModal.value = false
}

const confirmDeleteAgent = async () => {
  if (!agentToDelete.value) return
  loading.value = true
  try {
    const { error } = await supabase.rpc('delete_agent', { p_id: agentToDelete.value.id })
    if (error) throw error
    ElNotification({ title: 'Deleted', message: 'Agent deleted successfully!', type: 'success' })
    await fetchAgents()
  } catch (err) {
    console.error('Error deleting agent:', err)
    ElNotification({
      title: 'Error',
      message: err.message || 'Failed to delete agent',
      type: 'error'
    })
  } finally {
    loading.value = false
    showDeleteModal.value = false
    agentToDelete.value = null
  }
}

const downloadAllAgentsExcel = async () => {
  if (!agents.value || agents.value.length === 0) {
    ElMessage({ message: 'No agents available to export', type: 'warning' })
    return
  }

  ElMessage({ message: 'Preparing Excel export...', type: 'info' })

  await nextTick()

  const data = agents.value.map((a) => ({
    'Agent ID': a.id,
    'Merchant ID': a.merchant_id,
    'Full Name': a.full_name || '',
    Alias: a.alias || '',
    Phone: a.phone || '',
    Email: a.email || '',
    Location: a.location || '',
    'Agreed Rate (%)': a.agreed_rate != null ? Number(a.agreed_rate).toFixed(2) : '',
    Remark: a.remark || '',
    Status: a.status || '',
    'Assigned Loans Count': a.assigned_loans_count ?? 0,
    'Total Disbursed Amount':
      a.total_disbursed_amount != null ? Number(a.total_disbursed_amount).toFixed(2) : 0,
    'Profile Image URL': a.profile_image || '',
    'Last Assigned At': a.last_assigned_at ? new Date(a.last_assigned_at).toLocaleString() : '',
    'Created By': a.created_by || '',
    'Created At': a.created_at ? new Date(a.created_at).toLocaleString() : '',
    'Updated At': a.updated_at ? new Date(a.updated_at).toLocaleString() : ''
  }))

  const ws = XLSX.utils.json_to_sheet(data)

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Agents Report')

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })

  saveAs(
    new Blob([wbout], { type: 'application/octet-stream' }),
    `Agents_Report_${new Date().toISOString().split('T')[0]}.xlsx`
  )

  ElMessage({ message: 'Export complete!', type: 'success' })
}

// single agent pdf
const downloadAgentPDF = async (a) => {
  const logo = await getBase64FromUrl(logoImage)
  const docDefinition = {
    content: [
      {
        columns: [
          { text: 'Agent Profile', style: 'header', alignment: 'left', margin: [0, 20, 0, 0] },
          { image: logo, width: 80, alignment: 'right' }
        ],
        margin: [0, 0, 0, 20]
      },
      {
        text: 'Agent Information',
        style: 'sectionHeader'
      },
      {
        style: 'table',
        table: {
          widths: ['35%', '65%'],
          body: [
            ['Name', a.full_name || a.name || 'N/A'],
            ['Alias', a.alias || 'N/A'],
            ['Phone', a.phone || 'N/A'],
            ['Email', a.email || 'N/A'],
            ['Location', a.location || 'N/A'],
            ['Agreed Rate', a.agreed_rate ? `${a.agreed_rate}%` : 'N/A'],
            ['Remark', a.remark || 'N/A'],
            ['Status', a.status || 'N/A']
          ]
        }
      },
      {
        text: `Generated on ${new Date().toLocaleString()}`,
        style: 'footer',
        alignment: 'right',
        margin: [0, 30, 0, 0]
      }
    ],
    styles: {
      header: { fontSize: 18, bold: true, color: '#1f5aa3' },
      sectionHeader: { fontSize: 13, bold: true, color: '#27bfa0', margin: [0, 10, 0, 5] },
      footer: { fontSize: 9, italics: true, color: '#777' }
    },
    pageMargins: [40, 50, 40, 40]
  }
  pdfMake.createPdf(docDefinition).download(`${a.full_name || 'Agent'}.pdf`)
}

const downloadSingleAgentExcel = async (a) => {
  if (!a) {
    ElMessage({ message: 'Invalid agent data', type: 'error' })
    return
  }

  ElMessage({ message: 'Preparing agent export...', type: 'info' })

  await nextTick()

  const data = [
    {
      'Agent ID': a.id,
      'Merchant ID': a.merchant_id,
      'Full Name': a.full_name || '',
      Alias: a.alias || '',
      Phone: a.phone || '',
      Email: a.email || '',
      Location: a.location || '',
      'Agreed Rate (%)': a.agreed_rate != null ? Number(a.agreed_rate).toFixed(2) : '',
      Remark: a.remark || '',
      Status: a.status || '',
      'Assigned Loans Count': a.assigned_loans_count ?? 0,
      'Total Disbursed Amount':
        a.total_disbursed_amount != null
          ? `₦${Number(a.total_disbursed_amount).toLocaleString()}`
          : '₦0',
      'Profile Image URL': a.profile_image || '',
      'Last Assigned At': a.last_assigned_at ? new Date(a.last_assigned_at).toLocaleString() : '',
      'Created By': a.created_by || '',
      'Created At': a.created_at ? new Date(a.created_at).toLocaleString() : '',
      'Updated At': a.updated_at ? new Date(a.updated_at).toLocaleString() : ''
    }
  ]

  const ws = XLSX.utils.json_to_sheet(data)

  // Optional: better column width
  ws['!cols'] = Object.keys(data[0]).map(() => ({ wch: 22 }))

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Agent Details')

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })

  saveAs(
    new Blob([wbout], { type: 'application/octet-stream' }),
    `${(a.full_name || 'Agent').replace(/\s+/g, '_')}.xlsx`
  )

  ElMessage({ message: 'Agent export complete!', type: 'success' })
}

// computed filtered list
const filteredAgents = computed(() => {
  let list = agents.value || []

  if (selectedStatus.value && selectedStatus.value !== 'All') {
    list = list.filter((x) => (x.status || '').toLowerCase() === selectedStatus.value.toLowerCase())
  }

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter((x) =>
      Object.values(x).some((v) =>
        String(v || '')
          .toLowerCase()
          .includes(q)
      )
    )
  }

  return list
})

// initial load
onMounted(() => {
  fetchAgents()
  authStore.fetchFacilities()
})
</script>

<template>
  <MainLayout>
    <div>
      <!-- Header -->
      <div class="bg-white flex rounded shadow justify-between items-center border-b p-4 mb-4">
        <div class="mb-2">
          <h1 class="text-xl font-bold mt-4">Database</h1>
          <p class="text-gray-500 text-sm mt-1">View and Manage your agents</p>
        </div>

        <v-btn
          @click="openModal"
          size="medium"
          class="normal-case custom-btn hover:bg-green-700 text-white text-sm font-semibold px-6 py-3 rounded-md shadow-md"
        >
          <span class="p-1 flex items-center justify-center w-4 h-4 mr-2">
            <i class="fa-solid fa-plus text-sm text-white"></i>
          </span>
          Add a new agent
        </v-btn>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex flex-col items-center justify-center min-h-[200px]">
        <v-progress-circular indeterminate color="#27bfa0" size="40" width="4" />
        <span class="mt-2 text-gray-600 text-sm">Loading Agents</span>
      </div>

      <!-- Agents Table -->
      <div v-else-if="agents.length > 0" class="overflow-x-auto">
        <div class="flex items-center justify-between pt-2 pb-4">
          <div class="flex items-center space-x-6">
            <v-btn
              color="green"
              @click="downloadAllAgentsExcel"
              size="medium"
              class="normal-case bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-6 py-3 rounded-md shadow-md"
            >
              <span class="p-1 flex items-center justify-center w-4 h-4 mr-2">
                <i class="fas fa-file-excel text-sm text-white"></i>
              </span>
              Export Agents
            </v-btn>

            <i class="fa-solid fa-filter text-green"></i>

            <v-select
              v-model="selectedStatus"
              :items="statusOptions"
              label="Status"
              density="compact"
              hide-details
              variant="outlined"
              class="w-40"
              color="green"
            />
          </div>

          <div class="w-64">
            <v-text-field
              v-model="searchQuery"
              rounded
              placeholder="Search for an agent"
              density="compact"
              hide-details
              variant="outlined"
              class="max-w-xs rounded-md"
              label="Search"
              color="#27bfa0"
            >
              <template #append-inner>
                <i class="fas fa-search text-[#27bfa0]"></i>
              </template>
            </v-text-field>
          </div>
        </div>

        <div class="overflow-y-auto max-h-[500px] bg-white shadow rounded-lg">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-green-50 font-semibold sticky top-0 z-10">
              <tr>
                <th class="px-6 py-3 text-left text-xs uppercase tracking-wider">Name</th>
                <th class="px-6 py-3 text-left text-xs uppercase tracking-wider">Alias</th>
                <th class="px-6 py-3 text-left text-xs uppercase tracking-wider">Phone</th>
                <th class="px-6 py-3 text-left text-xs uppercase tracking-wider">Location</th>
                <th class="px-6 py-3 text-left text-xs uppercase tracking-wider">Agreed Rate</th>
                <th class="px-6 py-3 text-left text-xs uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-center text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>

            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="a in filteredAgents" :key="a.id">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {{ a.full_name || a.name }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{{ a.alias }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{{ a.phone }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{{ a.location }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {{ a.agreed_rate != null ? Number(a.agreed_rate).toFixed(2) + '%' : 'N/A' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{{ a.status }}</td>

                <td class="px-8 flex gap-4 py-4 whitespace-nowrap text-center text-sm font-medium">
                  <button
                    class="text-green-700 hover:text-green-900"
                    @click="downloadSingleAgentExcel(a)"
                  >
                    <i class="fas fa-file-excel"></i>
                  </button>

                  <button class="text-green-600 hover:text-green-900" @click="downloadAgentPDF(a)">
                    <i class="fas fa-download"></i>
                  </button>

                  <button class="text-blue-600 hover:text-blue-900 mr-2" @click="editAgent(a)">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button
                    class="text-teal-600 hover:text-teal-900"
                    title="Export Loans"
                    @click="openExportDialog(a)"
                  >
                    <i class="fas fa-file-export"></i>
                  </button>
                  <button class="text-red-600 hover:text-red-900" @click="openDeleteModal(a)">
                    <i class="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="fill-height align-center justify-center">
        <div class="mx-auto text-center align-center w-[200px] h-[200px]">
          <div class="empty-text font-semibold mt-8">No Agents</div>
        </div>
      </div>
    </div>

    <!-- Delete Agent Modal -->
    <v-dialog v-model="showDeleteModal" max-width="400px">
      <v-card>
        <v-card-title class="text-lg font-bold">Delete Agent</v-card-title>
        <v-card-text>
          Are you sure you want to delete agent
          <strong>{{ agentToDelete?.full_name || agentToDelete?.name }}</strong
          >?
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn text color="gray" @click="cancelDelete">Cancel</v-btn>
          <v-btn color="red" dark @click="confirmDeleteAgent" :loading="loading">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Add / Edit Agent Modal -->
    <v-dialog v-model="showModal" persistent max-width="800px" scrollable>
      <v-card class="pa-6 max-h-[90vh] overflow-y-auto">
        <button @click="closeModal" class="absolute top-4 right-4 text-gray-600 hover:text-red-500">
          <i class="fas fa-times fa-lg"></i>
        </button>

        <h2 class="text-lg font-bold mb-4">{{ isEditing ? 'Edit Agent' : 'Add a New Agent' }}</h2>

        <v-form ref="formRef" v-model="valid" lazy-validation>
          <v-text-field
            variant="outlined"
            v-model="agent.full_name"
            color="#27bfa0"
            label="Full name"
            :rules="[(v) => !!v || 'Name is required']"
            required
          />

          <v-text-field
            variant="outlined"
            v-model="agent.alias"
            color="#27bfa0"
            label="Alias (optional)"
          />

          <v-text-field
            variant="outlined"
            v-model="agent.phone"
            color="#27bfa0"
            label="Phone number"
            required
          />

          <v-text-field
            variant="outlined"
            v-model="agent.email"
            color="#27bfa0"
            label="Email (optional)"
            type="email"
          />

          <v-text-field
            variant="outlined"
            v-model="agent.location"
            color="#27bfa0"
            label="Location"
          />

          <v-text-field
            variant="outlined"
            v-model="agent.agreed_rate"
            color="#27bfa0"
            label="Agreed Rate (%)"
            type="number"
            :rules="[
              (v) => v === '' || v === null || (!isNaN(v) && Number(v) >= 0) || 'Invalid rate'
            ]"
          />

          <v-text-field variant="outlined" v-model="agent.remark" color="#27bfa0" label="Remark" />

          <v-select
            variant="outlined"
            v-model="agent.status"
            :items="['active', 'inactive', 'suspended']"
            label="Status"
            color="#27bfa0"
          />

          <div class="flex justify-end mt-6">
            <v-btn text @click="closeModal">Cancel</v-btn>
            <v-btn color="green" class="ml-3" :loading="loading" @click="submitAgent">
              {{ isEditing ? 'Update' : 'Save' }}
            </v-btn>
          </div>
        </v-form>
      </v-card>
    </v-dialog>

    <!-- Agent Loans Export Dialog -->
    <v-dialog v-model="showExportDialog" max-width="480px" persistent>
      <v-card class="pa-6">
        <button
          @click="showExportDialog = false"
          class="absolute top-4 right-4 text-gray-500 hover:text-red-500"
        >
          <i class="fas fa-times fa-lg"></i>
        </button>

        <h2 class="text-lg font-bold mb-1">Export Agent Loans</h2>
        <p class="text-sm text-gray-500 mb-4">
          {{ exportingAgent?.full_name }} — choose filters then pick a format
        </p>

        <!-- Facility filter -->
        <v-select
          v-model="exportFacilityId"
          :items="[{ id: null, bank_name: 'All Facilities' }, ...facilities]"
          item-value="id"
          item-title="bank_name"
          label="Filter by Facility"
          variant="outlined"
          color="#27bfa0"
          density="compact"
          class="mb-3"
        />

        <!-- Status filter -->
        <v-select
          v-model="exportStatusFilter"
          :items="exportStatusOptions"
          label="Filter by Status"
          variant="outlined"
          color="#27bfa0"
          density="compact"
          class="mb-6"
        />

        <div class="flex justify-end gap-3">
          <v-btn text @click="showExportDialog = false">Cancel</v-btn>
          <v-btn
            color="green"
            variant="outlined"
            :loading="exportExcelLoading"
            @click="exportAgentLoansExcel"
          >
            <i class="fas fa-file-excel mr-2"></i> Excel
          </v-btn>
          <v-btn
            color="red"
            variant="outlined"
            :loading="exportLoading"
            @click="exportAgentLoansPDF"
          >
            <i class="fas fa-file-pdf mr-2"></i> PDF
          </v-btn>
        </div>
      </v-card>
    </v-dialog>
  </MainLayout>
</template>

<style scoped>
.el-message.el-message-top-left {
  left: 20px; /* push from the left */
  right: auto; /* override default center */
  transform: none; /* remove centering */
}

.custom-btn {
  background-color: #27bfa0;
}
.v-slider {
  --v-slider-track-size: 4px;
  --v-slider-thumb-size: 12px;
}

.v-tab {
  text-transform: none;
}
.v-btn {
  text-transform: none;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
:deep(.v-tab__slider) {
  height: 4px !important; /* Adjust thickness */
  background-color: #15803d !important; /* Change color if needed */
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
