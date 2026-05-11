<script setup>
import { ref, onMounted, watch, computed, reactive } from 'vue'
import { ElMessage, ElNotification, ElMessageBox, ElLoading } from 'element-plus'
import MainLayout from '@/layouts/full/MainLayout.vue'
import { supabase } from '@/services/supabase.js'
import { useAuthStore } from '@/stores/auth'
import { useFormattedFields } from '@/composables/useFormmatedFields'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import * as pdfMake from 'pdfmake/build/pdfmake'
import logoImage from '@/assets/New Logo_with_Paratus.png'

const authStore = useAuthStore()
const merchantId = authStore.merchant.id
const loans = ref([])
const customers = ref([])
const facilities = computed(() => authStore.facilities)
const showModal = ref(false)
const loading = ref(false)
const formRef = ref(null)
const valid = ref(false)
const errorMessage = ref(null)

const loadingAgents = ref(false)
const agents = ref([])

const fetchAgents = async () => {
  loadingAgents.value = true
  const { data, error } = await supabase.rpc('get_merchant_agents', { p_merchant_id: merchantId })
  if (error) console.error('Error fetching agents:', error)
  else agents.value = data || []
  loadingAgents.value = false
}

// ── Expansion (for extensions) ──────────────────────────
const expandedRows = ref(new Set())
const toggleRow = (id) => {
  if (expandedRows.value.has(id)) expandedRows.value.delete(id)
  else expandedRows.value.add(id)
  expandedRows.value = new Set(expandedRows.value)
}
const isExpanded = (id) => expandedRows.value.has(id)

// ── Form ────────────────────────────────────────────────
const disburseMenu = ref(false)
const isEditing = ref(false)
const editingLoanId = ref(null)

const loan = ref({
  customer_id: null,
  facility_id: null,
  loan_amount: null,
  agreed_rate: null,
  tenure_days: null,
  disbursed_at: null,
  agent_id: null,
  loan_type: 'new', // 'new' | 'extension'
  parent_loan_id: null
})

const formattedLoanAmount = useFormattedFields(loan, 'loan_amount', { currency: true })

// Parent loan options (for extension dropdown — all root loans)
const parentLoanOptions = computed(() =>
  loans.value.map((l) => ({
    id: l.id,
    label: `${l.customer_name} — ${formatCurrency(l.loan_amount)} (${l.disbursed_at})`
  }))
)

const openModal = () => {
  isEditing.value = false
  editingLoanId.value = null
  loan.value = {
    customer_id: null,
    facility_id: null,
    loan_amount: null,
    agreed_rate: null,
    tenure_days: null,
    disbursed_at: null,
    agent_id: null,
    loan_type: 'new',
    parent_loan_id: null
  }
  showModal.value = true
}

const editLoan = (loanData) => {
  isEditing.value = true
  editingLoanId.value = loanData.id
  loan.value = {
    customer_id: loanData.customer_id,
    facility_id: loanData.facility_id,
    loan_amount: loanData.loan_amount,
    agreed_rate: loanData.agreed_rate,
    tenure_days: loanData.tenure_days,
    disbursed_at: loanData.disbursed_at,
    agent_id: loanData.agent_id,
    loan_type: loanData.loan_type || 'new',
    parent_loan_id: loanData.parent_loan_id || null
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  isEditing.value = false
  editingLoanId.value = null
  if (formRef.value) formRef.value.reset()
  loan.value = {
    customer_id: null,
    facility_id: null,
    loan_amount: null,
    agreed_rate: null,
    tenure_days: null,
    disbursed_at: null,
    agent_id: null,
    loan_type: 'new',
    parent_loan_id: null
  }
}

const submitLoan = async () => {
  if (!formRef.value) return
  const formValid = await formRef.value.validate()
  if (!formValid) {
    ElMessage({ message: 'Please fix the form errors', type: 'error' })
    return
  }
  if (loan.value.loan_type === 'extension' && !loan.value.parent_loan_id) {
    ElMessage({ message: 'Please select the loan being extended', type: 'error' })
    return
  }

  loading.value = true
  ElMessage({
    message: isEditing.value ? 'Updating loan...' : 'Adding loan...',
    type: 'info',
    duration: 1500
  })

  try {
    if (isEditing.value) {
      const { error } = await supabase.rpc('update_new_loan', {
        p_loan_id: editingLoanId.value,
        p_loan_amount: loan.value.loan_amount,
        p_agreed_rate: loan.value.agreed_rate,
        p_disbursed_at: loan.value.disbursed_at,
        p_status: loan.value.status || 'active',
        p_tenure_days: loan.value.tenure_days,
        p_customer_id: loan.value.customer_id,
        p_facility_id: loan.value.facility_id,
        p_agent_id: loan.value.agent_id || null
      })
      if (error) throw error
      ElNotification({ title: 'Success', message: 'Loan updated!', type: 'success' })
    } else {
      const { error } = await supabase.rpc('add_new_loan_extension', {
        p_merchant_id: merchantId,
        p_customer_id: loan.value.customer_id,
        p_facility_id: loan.value.facility_id,
        p_loan_amount: loan.value.loan_amount,
        p_agreed_rate: loan.value.agreed_rate,
        p_tenure_days: loan.value.tenure_days,
        p_disbursed_at: loan.value.disbursed_at,
        p_agent_id: loan.value.agent_id,
        p_loan_type: loan.value.loan_type,
        p_parent_loan_id: loan.value.loan_type === 'extension' ? loan.value.parent_loan_id : null
      })
      if (error) throw error
      ElNotification({ title: 'Success', message: 'Loan added!', type: 'success' })
    }
    await fetchLoans()
    closeModal()
  } catch (err) {
    console.error(err)
    ElNotification({ title: 'Error', message: err.message, type: 'error' })
  } finally {
    loading.value = false
  }
}

// ── Fetch ────────────────────────────────────────────────
const fetchCustomers = async () => {
  try {
    const { data, error } = await supabase.rpc('get_merchant_customers', {
      p_merchant_id: authStore.merchant.id,
      p_facility_id: authStore.selectedFacility?.id || null
    })
    if (error) throw error
    customers.value = (data || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  } catch (err) {
    console.error('fetchCustomers error:', err)
  }
}

const fetchLoans = async () => {
  loading.value = true
  errorMessage.value = null
  try {
    const { data, error } = await supabase.rpc('fetch_loans', {
      p_merchant_id: authStore.merchant.id,
      p_facility_id: authStore.selectedFacility?.id || null
    })
    if (error) throw error
    loans.value = data || []
  } catch (err) {
    console.error(err)
    errorMessage.value = 'Failed to load loans'
  } finally {
    loading.value = false
  }
}

// ── Delete ───────────────────────────────────────────────
const showDeleteModal = ref(false)
const loanToDelete = ref(null)
const openDeleteModal = (l) => {
  loanToDelete.value = l
  showDeleteModal.value = true
}
const cancelDelete = () => {
  showDeleteModal.value = false
  loanToDelete.value = null
}
const confirmDeleteLoan = async () => {
  if (!loanToDelete.value) return
  loading.value = true
  try {
    const { error } = await supabase.rpc('delete_loan', { p_loan_id: loanToDelete.value.id })
    if (error) throw error
    ElNotification({ title: 'Deleted', message: 'Loan deleted!', type: 'success' })
    await fetchLoans()
  } catch (err) {
    ElNotification({ title: 'Error', message: err.message, type: 'error' })
  } finally {
    loading.value = false
    showDeleteModal.value = false
    loanToDelete.value = null
  }
}

// ── Status / Filter ──────────────────────────────────────
const statusCategories = ['All', 'Active', 'Active < 5 days', 'Closed']
const selectedStatus = ref('All')
const searchQuery = ref('')

const getStatusBadge = (l) => {
  if (!l.status || !l.expiry_date) return { text: 'N/A', color: 'gray' }
  const today = new Date()
  const expiry = new Date(l.expiry_date)
  const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24))
  if (l.status === 'active') {
    if (diffDays > 5) return { text: 'active', color: 'green' }
    if (diffDays > 0)
      return { text: `active < ${diffDays} day${diffDays > 1 ? 's' : ''}`, color: 'red' }
    return { text: 'closed', color: 'red' }
  }
  if (l.status === 'completed') return { text: 'completed', color: 'blue' }
  if (l.status === 'defaulted') return { text: 'defaulted', color: 'blue' }
  return { text: l.status, color: 'gray' }
}

const filteredLoans = computed(() => {
  let filtered = loans.value
  if (selectedStatus.value !== 'All') {
    filtered = filtered.filter((l) => {
      const badge = getStatusBadge(l).text.toLowerCase()
      const sel = selectedStatus.value.toLowerCase()
      if (sel === 'active') return badge === 'active'
      if (sel === 'active < 5 days') return badge.startsWith('active <')
      if (sel === 'closed') return badge === 'closed'
      return false
    })
  }
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    filtered = filtered.filter((l) =>
      Object.values(l).some((v) =>
        String(v || '')
          .toLowerCase()
          .includes(q)
      )
    )
  }
  return filtered
})

// ── Helpers ──────────────────────────────────────────────
const formatCurrency = (value) => {
  if (!value) return '₦0.00'
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(value)
}

const getBase64FromUrl = async (url) => {
  const res = await fetch(url)
  const blob = await res.blob()
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.readAsDataURL(blob)
  })
}

const formatLoanForExport = (l) => ({
  'Loan ID': l.id,
  Type: l.loan_type || 'new',
  'Customer Name': l.customer_name,
  'Customer Phone': l.customer_phone,
  'Account Number': l.customer_account_number,
  'Facility Name': l.facility_name,
  'Loan Amount': l.loan_amount,
  'Agreed Rate (%)': l.agreed_rate,
  'Bank Rate (%)': l.facility_rate,
  'Sales Amount': l.sales_amount,
  'Direct Cost': l.direct_cost,
  Profit: l.profit,
  'Tenure (Days)': l.tenure_days,
  'Disbursed At': l.disbursed_at,
  'Expiry Date': l.expiry_date,
  Agent: l.agent_name,
  Status: l.status
})

const downloadLoanExcel = (l) => {
  const rows = [formatLoanForExport(l)]
  if (l.extensions?.length) {
    l.extensions.forEach((ext, i) =>
      rows.push({
        ...formatLoanForExport({
          ...ext,
          customer_name: l.customer_name,
          facility_name: l.facility_name
        }),
        Type: `Extension ${i + 1}`
      })
    )
  }
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Loan')
  saveAs(
    new Blob([XLSX.write(wb, { bookType: 'xlsx', type: 'array' })], {
      type: 'application/octet-stream'
    }),
    `${l.customer_name || 'Loan'}.xlsx`
  )
}

const downloadAllLoansExcel = () => {
  if (!loans.value?.length) {
    ElMessage({ message: 'No loans to export', type: 'warning' })
    return
  }
  const rows = []
  loans.value.forEach((l) => {
    rows.push(formatLoanForExport(l))
    l.extensions?.forEach((ext, i) =>
      rows.push({
        ...formatLoanForExport({
          ...ext,
          customer_name: l.customer_name,
          facility_name: l.facility_name
        }),
        Type: `Extension ${i + 1}`
      })
    )
  })
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Loans Report')
  saveAs(
    new Blob([XLSX.write(wb, { bookType: 'xlsx', type: 'array' })], {
      type: 'application/octet-stream'
    }),
    `Loans_Report_${new Date().toISOString().split('T')[0]}.xlsx`
  )
}

const downloadLoanPDF = async (l) => {
  const logo = await getBase64FromUrl(logoImage)
  const statusBadge = getStatusBadge(l)
  const docDefinition = {
    background: (currentPage, pageSize) => ({
      image: logo,
      width: 300,
      opacity: 0.08,
      absolutePosition: { x: (pageSize.width - 300) / 2, y: (pageSize.height - 300) / 2 }
    }),
    content: [
      {
        columns: [
          { text: 'PoF Due-Date Notification', style: 'header', margin: [0, 20, 0, 0] },
          { image: logo, width: 80, alignment: 'right' }
        ],
        margin: [0, 0, 0, 20]
      },
      { text: 'Customer Information', style: 'sectionHeader' },
      { columns: [{ text: `Name: ${l.customer_name || 'N/A'}`, width: '50%' }] },
      { columns: [{ text: `Phone: ${l.customer_phone || 'N/A'}`, width: '50%' }] },
      { text: `Account Number: ${l.customer_account_number || 'N/A'}`, margin: [0, 0, 0, 15] },
      { text: 'PoF Details', style: 'sectionHeader' },
      {
        style: 'loanTable',
        table: {
          widths: ['40%', '60%'],
          body: [
            ['Loan Amount', formatCurrency(l.loan_amount)],
            ['Agreed Rate', `${l.agreed_rate || 0}%`],
            ['Disbursed At', l.disbursed_at || 'N/A'],
            ['Expiry Date', l.expiry_date || 'N/A'],
            ['Type', l.loan_type || 'new'],
            ['Status', { text: statusBadge.text, color: statusBadge.color, bold: true }],
            ['Primary Contact', l.agent_name || 'N/A']
          ]
        },
        layout: { fillColor: (r) => (r % 2 === 0 ? '#f9f9f9' : null) }
      },
      { text: 'Bank Information', style: 'sectionHeader' },
      { text: `Bank Name: ${l.facility_name || 'N/A'}` },
      { text: '', margin: [0, 0, 0, 15] },
      { text: 'Important Information', style: 'sectionHeader' },
      {
        text: 'Renewal: Kindly make every effort to renew your PoF facility before the expiration date.',
        margin: [0, 0, 0, 15]
      },
      { text: 'Please act fast!', bold: true, color: '#d32f2f', margin: [0, 5, 0, 10] },
      { text: 'Signed,\nManagement', alignment: 'left', italics: true },
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
      loanTable: { margin: [0, 0, 0, 15], fontSize: 11 },
      footer: { fontSize: 9, italics: true, color: '#777' }
    },
    pageMargins: [40, 50, 40, 40]
  }
  pdfMake.createPdf(docDefinition).download(`${l.customer_name || 'PoF'}.pdf`)
}

// ── SMS / Email ──────────────────────────────────────────
const sendingEmail = reactive({})
const sendingSMS = reactive({})

const sendLoanSMS = async (l) => {
  if (!l.customer_phone) {
    ElNotification({
      title: 'No Phone Number',
      message: `No phone for ${l.customer_name}`,
      type: 'warning'
    })
    return
  }
  try {
    await ElMessageBox.confirm(
      `Send SMS to ${l.customer_name} (${l.customer_phone})?`,
      'Confirm SMS',
      { confirmButtonText: 'Yes, Send', cancelButtonText: 'Cancel', type: 'warning' }
    )
    sendingSMS[l.id] = true
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    const res = await fetch(
      'https://ytvqldflnqwflahxjjzu.supabase.co/functions/v1/termii-sms-service',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`
        },
        body: JSON.stringify({ loan_id: l.id })
      }
    )
    const result = await res.json()
    if (!res.ok) throw new Error(result.error || 'Failed to send SMS')
    ElNotification({ title: 'Success', message: 'SMS sent!', type: 'success' })
  } catch (err) {
    if (err !== 'cancel')
      ElNotification({ title: 'Error', message: err.message || 'Failed', type: 'error' })
  } finally {
    sendingSMS[l.id] = false
  }
}

const sendLoanEmail = async (l) => {
  const allEmails = Array.from(
    new Set([l.customer_email, ...(l.customer_emails?.map((e) => e.email) || [])].filter(Boolean))
  )
  if (!allEmails.length) {
    ElNotification({
      title: 'No Email',
      message: `No email for ${l.customer_name}`,
      type: 'warning'
    })
    return
  }
  let loadingInstance = null
  try {
    await ElMessageBox.confirm(
      `Send Email to ${l.customer_name} (${allEmails.join(', ')})?`,
      'Confirm Email',
      { confirmButtonText: 'Yes, Send', cancelButtonText: 'Cancel', type: 'warning' }
    )
    sendingEmail[l.id] = true
    loadingInstance = ElLoading.service({
      lock: true,
      text: 'Sending Email...',
      background: 'rgba(0,0,0,0.5)'
    })
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    const res = await fetch(
      'https://ytvqldflnqwflahxjjzu.supabase.co/functions/v1/termii-email-service',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`
        },
        body: JSON.stringify({ loan_id: l.id })
      }
    )
    const result = await res.json()
    if (!res.ok || !result.success) throw new Error(result.error || 'Failed')
    ElNotification({ title: 'Success', message: 'Email sent!', type: 'success' })
  } catch (err) {
    if (err !== 'cancel')
      ElNotification({ title: 'Error', message: err.message || 'Failed', type: 'error' })
  } finally {
    sendingEmail[l.id] = false
    if (loadingInstance) loadingInstance.close()
  }
}

const sendLoanKudiEmail = async (l) => {
  const allEmails = Array.from(
    new Set([l.customer_email, ...(l.customer_emails?.map((e) => e.email) || [])].filter(Boolean))
  )
  if (!allEmails.length) {
    ElNotification({
      title: 'No Email',
      message: `No email for ${l.customer_name}`,
      type: 'warning'
    })
    return
  }
  let loadingInstance = null
  try {
    await ElMessageBox.confirm(
      `Send Email to ${l.customer_name} (${allEmails.join(', ')})?`,
      'Confirm Email',
      { confirmButtonText: 'Yes, Send', cancelButtonText: 'Cancel', type: 'warning' }
    )
    sendingEmail[l.id] = true
    loadingInstance = ElLoading.service({
      lock: true,
      text: 'Sending Email...',
      background: 'rgba(0,0,0,0.5)'
    })
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    const res = await fetch(
      'https://ytvqldflnqwflahxjjzu.supabase.co/functions/v1/send-loan-expiry-email',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`
        },
        body: JSON.stringify({ loan_id: l.id })
      }
    )
    const result = await res.json()
    if (!res.ok || !result.success) throw new Error(result.error || 'Failed')
    ElNotification({ title: 'Success', message: 'Email sent!', type: 'success' })
  } catch (err) {
    if (err !== 'cancel')
      ElNotification({ title: 'Error', message: err.message || 'Failed', type: 'error' })
  } finally {
    sendingEmail[l.id] = false
    if (loadingInstance) loadingInstance.close()
  }
}

// ── Watchers / Mount ─────────────────────────────────────
const selectedFacility = computed(() => authStore.selectedFacility)
watch(
  () => selectedFacility.value?.id,
  async (newVal, oldVal) => {
    if (newVal && newVal !== oldVal) {
      await fetchLoans()
      await fetchCustomers()
    }
  },
  { immediate: true }
)

onMounted(() => {
  fetchAgents()
  fetchLoans()
  fetchCustomers()
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
          <p class="text-gray-500 text-sm mt-1">View and Manage your loan records</p>
        </div>
        <v-btn
          @click="openModal"
          size="medium"
          class="normal-case custom-btn hover:bg-green-700 text-white text-sm font-semibold px-6 py-3 rounded-md shadow-md"
        >
          <span class="p-1 flex items-center justify-center w-4 h-4 mr-2">
            <i class="fa-solid fa-plus text-sm text-white"></i>
          </span>
          Add a new loan
        </v-btn>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex flex-col items-center justify-center min-h-[200px]">
        <v-progress-circular indeterminate color="#27bfa0" size="40" width="4" />
        <span class="mt-2 text-gray-600 text-sm">Loading Loans</span>
      </div>

      <!-- Table -->
      <div v-else-if="loans.length > 0" class="overflow-x-auto">
        <div class="flex items-center justify-between pt-2 pb-4">
          <div class="flex items-center space-x-6">
            <v-btn
              color="green"
              @click="downloadAllLoansExcel"
              size="medium"
              class="normal-case bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-6 py-3 rounded-md shadow-md"
            >
              <span class="p-1 flex items-center justify-center w-4 h-4 mr-2">
                <i class="fas fa-file-excel text-sm text-white"></i>
              </span>
              Export Loans
            </v-btn>
            <v-select
              v-model="selectedStatus"
              :items="statusCategories"
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
              placeholder="Search for a loan"
              density="compact"
              hide-details
              variant="outlined"
              label="Search"
              color="#27bfa0"
            >
              <template #append-inner>
                <i class="fas fa-search text-[#27bfa0]"></i>
              </template>
            </v-text-field>
          </div>
        </div>

        <div class="overflow-y-auto max-h-[600px] bg-white shadow rounded-lg">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-green-50 font-semibold sticky top-0 z-10">
              <tr>
                <th class="px-4 py-3 text-left text-xs uppercase tracking-wider w-10"></th>
                <th class="px-4 py-3 text-left text-xs uppercase tracking-wider">Customer</th>
                <th class="px-4 py-3 text-left text-xs uppercase tracking-wider">Type</th>
                <th class="px-4 py-3 text-left text-xs uppercase tracking-wider">Acc.Number</th>
                <th class="px-4 py-3 text-left text-xs uppercase tracking-wider">Loan Amount</th>
                <th class="px-4 py-3 text-left text-xs uppercase tracking-wider">Pry-Contact</th>
                <th class="px-4 py-3 text-left text-xs uppercase tracking-wider">Bank Rate</th>
                <th class="px-4 py-3 text-left text-xs uppercase tracking-wider">Disbursed</th>
                <th class="px-4 py-3 text-left text-xs uppercase tracking-wider">Duration</th>
                <th class="px-4 py-3 text-left text-xs uppercase tracking-wider">Expiry Date</th>
                <th class="px-4 py-3 text-left text-xs uppercase tracking-wider">Status</th>
                <th class="px-4 py-3 text-center text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <template v-for="l in filteredLoans" :key="l.id">
                <!-- Main row -->
                <tr :class="{ 'bg-green-50/30': isExpanded(l.id) }">
                  <!-- Expand toggle (only show if has extensions) -->
                  <td class="px-4 py-3 text-center">
                    <button
                      v-if="l.extensions?.length"
                      @click="toggleRow(l.id)"
                      class="expand-toggle"
                      :class="{ active: isExpanded(l.id) }"
                    >
                      <i
                        class="fa-solid fa-chevron-right"
                        style="font-size: 10px; transition: transform 0.2s"
                        :style="isExpanded(l.id) ? 'transform:rotate(90deg)' : ''"
                      ></i>
                      <span class="ext-badge">{{ l.extensions.length }}</span>
                    </button>
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    {{ l.customer_name || 'N/A' }}
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap">
                    <span
                      :class="
                        l.loan_type === 'extension'
                          ? 'type-pill type-pill--ext'
                          : 'type-pill type-pill--new'
                      "
                    >
                      {{ l.loan_type || 'new' }}
                    </span>
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    {{ l.customer_account_number || 'N/A' }}
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    {{ formatCurrency(l.loan_amount) }}
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    {{ l.agent_name }}
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    {{ l.agreed_rate != null ? l.agreed_rate.toFixed(1) : '0.0' }}%
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    {{ l.disbursed_at }}
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    {{ l.tenure_days }} days
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    {{ l.expiry_date }}
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap">
                    <span
                      :class="{
                        'px-2 inline-flex text-xs leading-5 font-semibold rounded-full': true,
                        'bg-green-100 text-green-800': getStatusBadge(l).color === 'green',
                        'bg-red-100 text-red-800': getStatusBadge(l).color === 'red',
                        'bg-blue-100 text-blue-800': getStatusBadge(l).color === 'blue',
                        'bg-gray-100 text-gray-800': getStatusBadge(l).color === 'gray'
                      }"
                      >{{ getStatusBadge(l).text }}</span
                    >
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap">
                    <div class="flex gap-3 justify-center items-center">
                      <el-tooltip content="Send SMS" placement="top">
                        <button
                          class="text-purple-600 hover:text-purple-900"
                          :disabled="sendingSMS[l.id]"
                          @click="sendLoanSMS(l)"
                        >
                          <i
                            :class="sendingSMS[l.id] ? 'fas fa-spinner fa-spin' : 'fas fa-sms'"
                          ></i>
                        </button>
                      </el-tooltip>
                      <el-tooltip content="Send email (Termii)" placement="top">
                        <button
                          class="text-indigo-600 hover:text-indigo-900"
                          :disabled="sendingEmail[l.id]"
                          @click="sendLoanEmail(l)"
                        >
                          <i class="fas fa-envelope"></i>
                        </button>
                      </el-tooltip>
                      <el-tooltip content="Send email (Kudi)" placement="top">
                        <button
                          class="text-green-600 hover:text-green-900"
                          :disabled="sendingEmail[l.id]"
                          @click="sendLoanKudiEmail(l)"
                        >
                          <i class="fas fa-envelope"></i>
                        </button>
                      </el-tooltip>
                      <button
                        class="text-green-600 hover:text-green-900"
                        @click="downloadLoanExcel(l)"
                      >
                        <i class="fas fa-download"></i>
                      </button>
                      <button class="text-red-600 hover:text-red-900" @click="downloadLoanPDF(l)">
                        <i class="fas fa-file-pdf"></i>
                      </button>
                      <button class="text-blue-600 hover:text-blue-900" @click="editLoan(l)">
                        <i class="fas fa-edit"></i>
                      </button>
                      <button class="text-red-600 hover:text-red-900" @click="openDeleteModal(l)">
                        <i class="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>

                <!-- Extensions expansion row -->
                <tr v-if="isExpanded(l.id)" class="extensions-expansion-row">
                  <td colspan="12" class="p-0">
                    <div class="extensions-content">
                      <div class="extensions-header">
                        <i class="fa-solid fa-code-branch"></i>
                        Extensions for <strong>{{ l.customer_name }}</strong>
                      </div>
                      <table class="w-full extensions-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Loan Amount</th>
                            <th>Agreed Rate</th>
                            <th>Disbursed</th>
                            <th>Tenure</th>
                            <th>Expiry</th>
                            <th>Sales Amt</th>
                            <th>Direct Cost</th>
                            <th>Profit</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="(ext, idx) in l.extensions" :key="ext.id">
                            <td>{{ idx + 1 }}</td>
                            <td>{{ formatCurrency(ext.loan_amount) }}</td>
                            <td>{{ ext.agreed_rate }}%</td>
                            <td>{{ ext.disbursed_at }}</td>
                            <td>{{ ext.tenure_days }}d</td>
                            <td>{{ ext.expiry_date }}</td>
                            <td class="text-green-700 font-medium">
                              {{ formatCurrency(ext.sales_amount) }}
                            </td>
                            <td class="text-amber-700 font-medium">
                              {{ formatCurrency(ext.direct_cost) }}
                            </td>
                            <td class="text-blue-700 font-medium">
                              {{ formatCurrency(ext.profit) }}
                            </td>
                            <td>
                              <span
                                :class="{
                                  'px-2 inline-flex text-xs leading-5 font-semibold rounded-full': true,
                                  'bg-green-100 text-green-800':
                                    getStatusBadge(ext).color === 'green',
                                  'bg-red-100 text-red-800': getStatusBadge(ext).color === 'red',
                                  'bg-blue-100 text-blue-800': getStatusBadge(ext).color === 'blue',
                                  'bg-gray-100 text-gray-800': getStatusBadge(ext).color === 'gray'
                                }"
                                >{{ getStatusBadge(ext).text }}</span
                              >
                            </td>
                          </tr>
                        </tbody>
                        <tfoot>
                          <tr class="extensions-total-row">
                            <td
                              colspan="6"
                              class="text-right font-semibold text-xs text-gray-500 uppercase pr-4"
                            >
                              Totals
                            </td>
                            <td class="text-green-800 font-bold">
                              {{
                                formatCurrency(
                                  l.extensions.reduce((s, e) => s + (e.sales_amount || 0), 0)
                                )
                              }}
                            </td>
                            <td class="text-amber-800 font-bold">
                              {{
                                formatCurrency(
                                  l.extensions.reduce((s, e) => s + (e.direct_cost || 0), 0)
                                )
                              }}
                            </td>
                            <td class="text-blue-800 font-bold">
                              {{
                                formatCurrency(
                                  l.extensions.reduce((s, e) => s + (e.profit || 0), 0)
                                )
                              }}
                            </td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Empty -->
      <div v-else class="fill-height align-center justify-center">
        <div class="mx-auto text-center align-center w-[200px] h-[200px]">
          <div class="empty-text font-semibold mt-8">No Loans</div>
        </div>
      </div>
    </div>

    <!-- Delete modal -->
    <v-dialog v-model="showDeleteModal" max-width="400px">
      <v-card>
        <v-card-title class="text-lg font-bold">Delete Loan</v-card-title>
        <v-card-text>
          Are you sure you want to delete the loan for
          <strong>{{ loanToDelete?.customer_name }}</strong
          >?
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn text color="gray" @click="cancelDelete">Cancel</v-btn>
          <v-btn color="red" dark @click="confirmDeleteLoan" :loading="loading">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Add / Edit Loan Modal -->
    <v-dialog v-model="showModal" persistent max-width="800px">
      <div class="w-full mx-auto p-6 bg-white shadow-lg rounded-lg relative">
        <button @click="closeModal" class="absolute top-4 right-4 text-gray-600 hover:text-red-500">
          <i class="fas fa-times fa-lg"></i>
        </button>

        <h2 class="text-lg font-bold mb-4">
          {{ isEditing ? 'Edit Existing Loan' : 'Add a New Loan' }}
        </h2>

        <v-form ref="formRef" v-model="valid" lazy-validation>
          <!-- Loan Type Toggle -->
          <div class="loan-type-toggle mb-5" v-if="!isEditing">
            <label class="toggle-label">Loan Type</label>
            <div class="toggle-options">
              <!-- <button
                type="button"
                :class="['toggle-opt', loan.loan_type === 'new' ? 'toggle-opt--active' : '']"
                @click="
                  loan.loan_type = 'new'
                  loan.parent_loan_id = null
                "
              >
                <i class="fa-solid fa-plus-circle"></i> New Loan
              </button> -->
              <button
                type="button"
                :class="[
                  'toggle-opt',
                  loan.loan_type === 'extension' ? 'toggle-opt--active toggle-opt--ext' : ''
                ]"
                @click="loan.loan_type = 'extension'"
              >
                <i class="fa-solid fa-code-branch"></i> Extension
              </button>
            </div>
          </div>

          <!-- Parent loan selector (only for extensions) -->
          <div v-if="loan.loan_type === 'extension'" class="mb-1">
            <v-select
              v-model="loan.parent_loan_id"
              :items="parentLoanOptions"
              item-value="id"
              item-title="label"
              label="Extending which loan?"
              variant="outlined"
              color="#27bfa0"
              :rules="[(v) => !!v || 'Please select the loan being extended']"
            />
          </div>

          <v-select
            :disabled="isEditing"
            variant="outlined"
            color="#27bfa0"
            v-model="loan.customer_id"
            :items="customers"
            item-value="id"
            item-title="full_name"
            label="Select Customer"
            required
          />

          <v-select
            :disabled="isEditing"
            variant="outlined"
            color="#27bfa0"
            v-model="loan.facility_id"
            :items="facilities"
            item-value="id"
            item-title="bank_name"
            label="Select Facility"
            :rules="[(v) => !!v || 'Facility is required']"
          />

          <v-text-field
            variant="outlined"
            v-model="formattedLoanAmount"
            color="#27bfa0"
            label="Loan Amount"
            :rules="[(v) => !!v || 'Loan amount is required']"
          />

          <v-select
            v-model="loan.agent_id"
            :items="agents"
            item-title="full_name"
            item-value="id"
            label="Select Agent"
            variant="outlined"
            color="#27bfa0"
            hide-details
            :loading="loadingAgents"
            class="mb-3"
            :rules="[(v) => !!v || 'Agent is required']"
          />

          <v-text-field
            variant="outlined"
            color="#27bfa0"
            v-model="loan.agreed_rate"
            label="Agreed Rate (%)"
            type="number"
            :rules="[(v) => !!v || 'Rate is required']"
          />

          <v-text-field
            variant="outlined"
            color="#27bfa0"
            v-model="loan.tenure_days"
            label="Tenure (Days)"
            type="number"
            :rules="[(v) => !!v || 'Tenure is required']"
          />

          <v-menu
            v-model="disburseMenu"
            :close-on-content-click="false"
            transition="scale-transition"
            offset-y
            min-width="290px"
          >
            <template v-slot:activator="{ props }">
              <v-text-field
                v-bind="props"
                variant="outlined"
                color="#27bfa0"
                :model-value="loan.disbursed_at"
                label="Disbursement Date"
                readonly
                :rules="[(v) => !!v || 'Date is required']"
              />
            </template>
            <v-date-picker
              :model-value="loan.disbursed_at ? new Date(loan.disbursed_at) : null"
              @update:model-value="
                (val) => {
                  if (val) {
                    const y = val.getFullYear()
                    const m = String(val.getMonth() + 1).padStart(2, '0')
                    const d = String(val.getDate()).padStart(2, '0')
                    loan.disbursed_at = `${y}-${m}-${d}`
                  } else {
                    loan.disbursed_at = null
                  }
                  disburseMenu = false
                }
              "
            />
          </v-menu>

          <div class="flex justify-end mt-6">
            <v-btn text @click="closeModal">Cancel</v-btn>
            <v-btn color="green" class="ml-3" :loading="loading" @click="submitLoan">
              {{
                isEditing
                  ? 'Update'
                  : loan.loan_type === 'extension'
                    ? 'Save Extension'
                    : 'Save Loan'
              }}
            </v-btn>
          </div>
        </v-form>
      </div>
    </v-dialog>
  </MainLayout>
</template>

<style scoped>
.custom-btn {
  background-color: #27bfa0;
}
.v-btn {
  text-transform: none;
}
.v-tab {
  text-transform: none;
}

/* Loan type toggle */
.loan-type-toggle {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.toggle-label {
  font-size: 12px;
  font-weight: 600;
  color: #7a8899;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.toggle-options {
  display: flex;
  gap: 10px;
}
.toggle-opt {
  flex: 1;
  padding: 10px 14px;
  border-radius: 10px;
  border: 2px solid #e2e8f0;
  background: #fff;
  color: #5a6a7e;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
}
.toggle-opt--active {
  border-color: #27bfa0;
  background: #f0fdfa;
  color: #1a9e85;
}
.toggle-opt--ext.toggle-opt--active {
  border-color: #6366f1;
  background: #eef2ff;
  color: #4338ca;
}

/* Type pills in table */
.type-pill {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.type-pill--new {
  background: #f0fdf4;
  color: #16a34a;
}
.type-pill--ext {
  background: #eef2ff;
  color: #4338ca;
}

/* Expand toggle */
.expand-toggle {
  position: relative;
  width: 28px;
  height: 28px;
  border-radius: 7px;
  border: 1.5px solid #e2e8f0;
  background: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #7a8899;
  transition: all 0.15s;
}
.expand-toggle:hover,
.expand-toggle.active {
  border-color: #27bfa0;
  background: #f0fdfa;
  color: #27bfa0;
}
.ext-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background: #6366f1;
  color: #fff;
  font-size: 9px;
  font-weight: 700;
  width: 15px;
  height: 15px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Extensions panel */
.extensions-expansion-row td {
  background: #f8f5ff;
}
.extensions-content {
  padding: 12px 20px 16px 48px;
  border-top: 1px dashed #c7c7f4;
}
.extensions-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #6366f1;
  margin-bottom: 12px;
}
.extensions-table {
  border-collapse: collapse;
}
.extensions-table thead tr {
  background: #eef2ff;
}
.extensions-table thead th {
  padding: 8px 12px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6366f1;
  text-align: left;
}
.extensions-table tbody tr {
  background: #fff;
  border-bottom: 1px solid #e8e8f8;
}
.extensions-table tbody tr:hover {
  background: #f5f5ff;
}
.extensions-table tbody td {
  padding: 9px 12px;
  font-size: 12.5px;
  color: #374151;
}
.extensions-total-row {
  background: #f0f0fc !important;
  border-top: 2px solid #6366f1 !important;
}
.extensions-total-row td {
  padding: 9px 12px;
}
</style>
