<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import MainLayout from '@/layouts/full/MainLayout.vue'
import { ElMessage, ElNotification } from 'element-plus'
import { supabase } from '@/services/supabase.js'
import { useAuthStore } from '@/stores/auth'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import * as pdfMake from 'pdfmake/build/pdfmake'
import * as pdfFonts from 'pdfmake/build/vfs_fonts'
import logoImage from '@/assets/New Logo_with_Paratus.png'
const authStore = useAuthStore()
const merchantId = authStore.merchant?.id

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

// excel export
const downloadAllAgentsExcel = () => {
  if (!agents.value || agents.value.length === 0) {
    ElMessage({ message: 'No agents available to export', type: 'warning' })
    return
  }
  const data = agents.value.map((a) => ({
    'Agent ID': a.id,
    Name: a.full_name || a.name || '',
    Alias: a.alias || '',
    Phone: a.phone || '',
    Email: a.email || '',
    Location: a.location || '',
    'Agreed Rate': a.agreed_rate,
    Remark: a.remark,
    Status: a.status,
    'Created At': a.created_at
  }))
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Agents Report')
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  saveAs(
    new Blob([wbout], { type: 'application/octet-stream' }),
    `Agents_Report_${new Date().toISOString().split('T')[0]}.xlsx`
  )
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
                  <button class="text-green-600 hover:text-green-900" @click="downloadAgentPDF(a)">
                    <i class="fas fa-download"></i>
                  </button>

                  <button class="text-blue-600 hover:text-blue-900 mr-2" @click="editAgent(a)">
                    <i class="fas fa-edit"></i>
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
