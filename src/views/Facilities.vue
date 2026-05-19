<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import MainLayout from '@/layouts/full/MainLayout.vue'
import { supabase } from '@/services/supabase.js'
import { useAuthStore } from '@/stores/auth'
import { useFormattedFields } from '@/composables/useFormmatedFields'

const authStore = useAuthStore()
const merchantId = authStore.merchant.id
const showModal = ref(false)
const facilities = computed(() => authStore.facilities)

const loading = ref(false)
const formRef = ref(null)
const valid = ref(false)

const isEditingDrawdown = ref(false)
const editingDrawdownId = ref(null)

const formatCurrency = (value) => {
  if (!value) return '₦0.00'
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(value)
}

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleDateString('en-NG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

// Track which rows are expanded
const expandedRows = ref(new Set())

const toggleRow = (facilityId) => {
  if (expandedRows.value.has(facilityId)) {
    expandedRows.value.delete(facilityId)
  } else {
    expandedRows.value.add(facilityId)
  }
  // Trigger reactivity
  expandedRows.value = new Set(expandedRows.value)
}

const isExpanded = (facilityId) => expandedRows.value.has(facilityId)

const isEditing = ref(false)
const editingFacilityId = ref(null)
const disburseMenu = ref(false)
const facilityTypes = [{ label: 'Overdraft', value: 'overdraft' }]

const facilityForm = ref({
  bank_id: null,
  facility_type: '',
  facility_amount: null,
  borrowing_rate: null,
  rate_unit: 'monthly',
  management_fee_percent: 0,
  vat_percent: 7.5,
  other_fees: 0,
  security_deposit: 0,
  drawdown_date: null,
  drawdown_date_obj: null,
  tenure_days: null
})

const formattedFacilityAmount = useFormattedFields(facilityForm, 'facility_amount', {
  currency: true
})
const formattedOtherFees = useFormattedFields(facilityForm, 'other_fees', { currency: true })
const formattedSecurityDeposit = useFormattedFields(facilityForm, 'security_deposit', {
  currency: true
})

const banks = ref([])
const fetchBanks = async () => {
  const { data, error } = await supabase.from('banks').select('*')
  if (error) console.error('Error fetching banks:', error)
  else banks.value = data
}

<<<<<<< HEAD
// Fetch merchant facilities
const fetchFacilities = async () => {
  loading.value = true
  const { data, error } = await supabase.rpc('get_merchant_facilities_v2', {
    p_merchant_id: merchantId
  })
  console.log('facilities:', data)
  if (error) console.error('Error fetching facilities:', error)
  else facilities.value = data
  loading.value = false
}

// Open/Close modal
// Open/Close modal for edit
=======
>>>>>>> operations
const openFacilityModal = (facility = null) => {
  if (facility) {
    isEditing.value = true
    editingFacilityId.value = facility.id
    facilityForm.value = {
      bank_id: facility.bank_id,
      facility_type: facility.facility_type,
      facility_amount: facility.facility_amount,
      borrowing_rate: facility.borrowing_rate,
      rate_unit: facility.rate_unit,
      management_fee_percent: facility.management_fee_percent,
      other_fees: facility.other_fees,
      security_deposit: facility.security_deposit,
      drawdown_date: facility.drawdown_date,
      drawdown_date_obj: facility.drawdown_date ? new Date(facility.drawdown_date) : null,
      tenure_days: facility.tenure_days ? Number(facility.tenure_days) : null
    }
  } else {
    isEditing.value = false
    editingFacilityId.value = null
    facilityForm.value = {
      bank_id: null,
      facility_type: '',
      facility_amount: null,
      borrowing_rate: null,
      drawdown_date: null,
      drawdown_date_obj: null,
      tenure_days: null
    }
  }
  showModal.value = true
}

const submitFacility = async () => {
  if (!formRef.value) return
  const formValid = await formRef.value.validate()
  if (!formValid) {
    ElMessage({ message: 'Please fix the form errors', type: 'error' })
    return
  }

  loading.value = true
  ElMessage({
    message: isEditing.value ? 'Updating facility...' : 'Adding facility...',
    type: 'info',
    duration: 1500
  })

  try {
    let data, error

    if (isEditing.value && editingFacilityId.value) {
      ;({ data, error } = await supabase.rpc('update_facility_v4', {
        p_facility_id: editingFacilityId.value,
        p_bank_id: facilityForm.value.bank_id,
        p_facility_type: facilityForm.value.facility_type,
        p_facility_amount: facilityForm.value.facility_amount,
        p_borrowing_rate: facilityForm.value.borrowing_rate,
        p_drawdown_date: facilityForm.value.drawdown_date,
        p_tenure_days: facilityForm.value.tenure_days,
        p_rate_unit: facilityForm.value.rate_unit,
        p_management_fee_percent: facilityForm.value.management_fee_percent,
        p_vat_percent: facilityForm.value.vat_percent,
        p_other_fees: facilityForm.value.other_fees,
        p_security_deposit: facilityForm.value.security_deposit
      }))
    } else {
      ;({ data, error } = await supabase.rpc('add_facility_v2', {
        p_merchant_id: merchantId,
        p_bank_id: facilityForm.value.bank_id,
        p_facility_type: facilityForm.value.facility_type,
        p_facility_amount: facilityForm.value.facility_amount,
        p_borrowing_rate: facilityForm.value.borrowing_rate,
        p_drawdown_date: facilityForm.value.drawdown_date,
        p_tenure_days: facilityForm.value.tenure_days,
        p_rate_unit: facilityForm.value.rate_unit,
        p_management_fee_percent: facilityForm.value.management_fee_percent,
        p_other_fees: facilityForm.value.other_fees,
        p_security_deposit: facilityForm.value.security_deposit
      }))
    }

    if (error) throw error
    if (!data) throw new Error('No data returned from RPC')

    ElNotification({
      title: 'Success',
      message: isEditing.value ? 'Facility updated!' : 'Facility added!',
      type: 'success'
    })
    await authStore.fetchFacilities()
    closeFacilityModal()
  } catch (err) {
    console.error('Error saving facility:', err)
    ElNotification({ title: 'Error', message: err.message, type: 'error' })
  } finally {
    loading.value = false
  }
}

const closeFacilityModal = () => {
  showModal.value = false
  isEditing.value = false
  editingFacilityId.value = null
  if (formRef.value) formRef.value.reset()
  facilityForm.value = {
    bank_id: null,
    facility_type: '',
    facility_amount: null,
    borrowing_rate: null,
    drawdown_date: null,
    drawdown_date_obj: null,
    tenure_days: null
  }
}

const showDeleteFacilityModal = ref(false)
const facilityToDelete = ref(null)

const openDeleteFacilityModal = (facility) => {
  facilityToDelete.value = facility
  showDeleteFacilityModal.value = true
}

const cancelDeleteFacility = () => {
  showDeleteFacilityModal.value = false
  facilityToDelete.value = null
}

const confirmDeleteFacility = async () => {
  if (!facilityToDelete.value) return
  loading.value = true
  try {
    const { error } = await supabase.rpc('delete_facility', {
      p_facility_id: facilityToDelete.value.id
    })
    if (error) throw error
    ElNotification({ title: 'Deleted', message: 'Facility deleted successfully!', type: 'success' })
    await authStore.fetchFacilities()
  } catch (err) {
    ElNotification({
      title: 'Error',
      message: err.message || 'Failed to delete facility',
      type: 'error'
    })
  } finally {
    loading.value = false
    showDeleteFacilityModal.value = false
    facilityToDelete.value = null
  }
}

const selectedFacility = computed(() => authStore.selectedFacility)
watch(
  () => selectedFacility.value?.id,
  async (newVal, oldVal) => {
    if (newVal && newVal !== oldVal) await fetchBanks()
  }
)

const showDrawdownModal = ref(false)
const selectedFacilityForDrawdown = ref(null)
// expanded drawdown form
const drawdownForm = ref({
  amount: null,
  date: null,
  date_obj: null,
  management_fee_percent: 0,
  vat_percent: 7.5,
  other_fees: 0,
  security_deposit: 0,
  tenure_days: null
})

const formattedDrawdownOtherFees = useFormattedFields(drawdownForm, 'other_fees', {
  currency: true
})
const formattedDrawdownSecurityDeposit = useFormattedFields(drawdownForm, 'security_deposit', {
  currency: true
})

const openDrawdownModal = (facility, drawdown = null) => {
  selectedFacilityForDrawdown.value = facility

  if (drawdown) {
    isEditingDrawdown.value = true
    editingDrawdownId.value = drawdown.id

    drawdownForm.value = {
      amount: drawdown.amount,
      date: drawdown.date,
      date_obj: drawdown.date ? new Date(drawdown.date) : null
    }
  } else {
    isEditingDrawdown.value = false
    editingDrawdownId.value = null

    drawdownForm.value = {
      amount: null,
      date: null,
      date_obj: null
    }
  }

  showDrawdownModal.value = true
}
const formattedDrawdownAmount = useFormattedFields(drawdownForm, 'amount', {
  currency: true
})
// updated submitDrawdown — pass all fields
const submitDrawdown = async () => {
  try {
    let error

    if (isEditingDrawdown.value && editingDrawdownId.value) {
      ;({ error } = await supabase.rpc('update_facility_drawdown', {
        p_drawdown_id: editingDrawdownId.value,
        p_amount: drawdownForm.value.amount,
        p_date: drawdownForm.value.date,
        p_management_fee_percent: drawdownForm.value.management_fee_percent,
        p_vat_percent: drawdownForm.value.vat_percent,
        p_other_fees: drawdownForm.value.other_fees,
        p_security_deposit: drawdownForm.value.security_deposit,
        p_tenure_days: drawdownForm.value.tenure_days
      }))
    } else {
      ;({ error } = await supabase.rpc('add_facility_drawdown', {
        p_facility_id: selectedFacilityForDrawdown.value.id,
        p_amount: drawdownForm.value.amount,
        p_date: drawdownForm.value.date,
        p_management_fee_percent: drawdownForm.value.management_fee_percent,
        p_vat_percent: drawdownForm.value.vat_percent,
        p_other_fees: drawdownForm.value.other_fees,
        p_security_deposit: drawdownForm.value.security_deposit,
        p_tenure_days: drawdownForm.value.tenure_days
      }))
    }

    if (error) throw error

    ElNotification({
      title: 'Success',
      message: isEditingDrawdown.value ? 'Drawdown updated' : 'Drawdown added',
      type: 'success'
    })
    closeDrawdownModal()
    await authStore.fetchFacilities()
  } catch (err) {
    ElNotification({ title: 'Error', message: err.message, type: 'error' })
  }
}

// reset all fields on close
const closeDrawdownModal = () => {
  showDrawdownModal.value = false
  isEditingDrawdown.value = false
  editingDrawdownId.value = null
  drawdownForm.value = {
    amount: null,
    date: null,
    date_obj: null,
    management_fee_percent: 0,
    vat_percent: 7.5,
    other_fees: 0,
    security_deposit: 0,
    tenure_days: null
  }
}

// Stats
const totalFacilityAmount = computed(
  () => facilities.value?.reduce((sum, f) => sum + (f.facility_amount || 0), 0) || 0
)
const activeFacilities = computed(
  () => facilities.value?.filter((f) => f.status === 'active').length || 0
)
const totalDrawdowns = computed(
  () => facilities.value?.reduce((sum, f) => sum + (f.drawdowns?.length || 0), 0) || 0
)

// const closeDrawdownModal = () => {
//   showDrawdownModal.value = false
//   isEditingDrawdown.value = false
//   editingDrawdownId.value = null
// }

onMounted(() => {
  fetchBanks()
  authStore.fetchFacilities()
})
</script>

<template>
  <MainLayout>
    <div class="facilities-page">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-left">
          <div class="header-icon">
            <i class="fa-solid fa-building-columns"></i>
          </div>
          <div>
            <h1 class="page-title">Credit Facilities</h1>
            <p class="page-subtitle">Manage your banking facilities and drawdown records</p>
          </div>
        </div>
        <button class="add-btn" @click="openFacilityModal()">
          <i class="fa-solid fa-plus"></i>
          <span>New Facility</span>
        </button>
      </div>

      <!-- Stats Row -->
      <div class="stats-row" v-if="!loading && facilities.length > 0">
        <div class="stat-card">
          <div class="stat-icon stat-icon--blue"><i class="fa-solid fa-landmark"></i></div>
          <div>
            <div class="stat-value">{{ facilities.length }}</div>
            <div class="stat-label">Total Facilities</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon stat-icon--green"><i class="fa-solid fa-circle-check"></i></div>
          <div>
            <div class="stat-value">{{ activeFacilities }}</div>
            <div class="stat-label">Active Facilities</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon stat-icon--teal"><i class="fa-solid fa-sack-dollar"></i></div>
          <div>
            <div class="stat-value">{{ formatCurrency(totalFacilityAmount) }}</div>
            <div class="stat-label">Total Approved Amount</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon stat-icon--amber">
            <i class="fa-solid fa-arrow-down-to-line"></i>
          </div>
          <div>
            <div class="stat-value">{{ totalDrawdowns }}</div>
            <div class="stat-label">Total Drawdowns</div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <v-progress-circular indeterminate color="#27bfa0" size="44" width="3" />
        <p>Loading facilities...</p>
      </div>

      <!-- Facilities Table -->
      <div v-else-if="facilities.length > 0" class="table-container">
        <table class="facilities-table">
          <thead>
            <tr>
              <th class="th-expand"></th>
              <th>Bank</th>
              <th>Type</th>
              <th>Approved Amount</th>
              <th>Rate</th>
              <th>Drawdown Date</th>
              <th>Expiry Date</th>
              <th>Status</th>
              <th class="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="facility in facilities" :key="facility.id">
              <!-- Main Row -->
              <tr class="facility-row" :class="{ 'is-expanded': isExpanded(facility.id) }">
                <!-- Expand toggle -->
                <td class="td-expand" @click="toggleRow(facility.id)">
                  <button class="expand-btn" :class="{ active: isExpanded(facility.id) }">
                    <i class="fa-solid fa-chevron-right expand-icon"></i>
                    <span v-if="facility.drawdowns?.length" class="drawdown-badge">
                      {{ facility.drawdowns.length }}
                    </span>
                  </button>
                </td>

                <td>
                  <div class="bank-cell">
                    <div class="bank-avatar">{{ (facility.bank_name || 'B')[0] }}</div>
                    <span class="bank-name">{{ facility.bank_name || 'N/A' }}</span>
                  </div>
                </td>

                <td>
                  <span class="type-pill">{{ facility.facility_type }}</span>
                </td>

                <td class="amount-cell">
                  {{ formatCurrency(facility.facility_amount) }}
                </td>

                <td>
                  <span class="rate-value">{{ facility.borrowing_rate }}%</span>
                </td>

                <td class="date-cell">{{ formatDate(facility.drawdown_date) }}</td>
                <td class="date-cell">{{ formatDate(facility.expiry_date) }}</td>

                <td>
                  <span class="status-badge" :class="`status-${facility.status}`">
                    <span class="status-dot"></span>
                    {{ facility.status }}
                  </span>
                </td>

                <td>
                  <div class="actions-cell">
                    <button
                      class="action-btn action-btn--drawdown"
                      @click="openDrawdownModal(facility)"
                      title="Add Drawdown"
                    >
                      <i class="fas fa-money-bill-wave"></i>
                    </button>
                    <button
                      class="action-btn action-btn--edit"
                      @click="openFacilityModal(facility)"
                      title="Edit"
                    >
                      <i class="fas fa-pen"></i>
                    </button>
                    <button
                      class="action-btn action-btn--delete"
                      @click="openDeleteFacilityModal(facility)"
                      title="Delete"
                    >
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>

              <!-- Expansion Row for Drawdowns -->
              <tr v-if="isExpanded(facility.id)" class="drawdown-expansion-row">
                <td colspan="9" class="expansion-cell">
                  <div class="expansion-content">
                    <div class="drawdowns-header">
                      <i class="fa-solid fa-arrow-down-to-line"></i>
                      <span
                        >Drawdown History for <strong>{{ facility.bank_name }}</strong></span
                      >
                    </div>

                    <div v-if="facility.drawdowns && facility.drawdowns.length > 0">
                      <table class="drawdowns-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Date</th>
                            <th>Amount Received</th>
                            <th>Recorded At</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr
                            v-for="(drawdown, idx) in facility.drawdowns"
                            :key="drawdown.id"
                            class="drawdown-row"
                          >
                            <td class="drawdown-index">{{ idx + 1 }}</td>
                            <td>{{ formatDate(drawdown.date) }}</td>
                            <td class="drawdown-amount">{{ formatCurrency(drawdown.amount) }}</td>
                            <td class="drawdown-created">{{ formatDate(drawdown.created_at) }}</td>
                            <td>
                              <button
                                class="action-btn action-btn--edit"
                                @click="openDrawdownModal(facility, drawdown)"
                              >
                                <i class="fas fa-pen"></i>
                              </button>
                            </td>
                          </tr>
                        </tbody>
                        <tfoot>
                          <tr class="drawdown-total-row">
                            <td colspan="2" class="total-label">Total Drawn</td>
                            <td class="total-amount">
                              {{
                                formatCurrency(
                                  facility.drawdowns.reduce((s, d) => s + (d.amount || 0), 0)
                                )
                              }}
                            </td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    <div v-else class="no-drawdowns">
                      <i class="fa-regular fa-file-lines"></i>
                      <p>No drawdowns recorded yet for this facility.</p>
                      <button class="add-drawdown-inline-btn" @click="openDrawdownModal(facility)">
                        <i class="fa-solid fa-plus"></i> Record First Drawdown
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <div class="empty-icon"><i class="fa-solid fa-building-columns"></i></div>
        <h3>No Facilities Yet</h3>
        <p>Add your first credit facility to start tracking drawdowns and repayments.</p>
        <button class="add-btn" @click="openFacilityModal()">
          <i class="fa-solid fa-plus"></i>
          <span>Add Facility</span>
        </button>
      </div>
    </div>

    <!-- ─── Add/Edit Facility Modal ─── -->
    <v-dialog v-model="showModal" persistent max-width="820px">
      <div class="modal-card">
        <div class="modal-header">
          <div class="modal-title-group">
            <div class="modal-icon"><i class="fa-solid fa-building-columns"></i></div>
            <div>
              <h2 class="modal-title">{{ isEditing ? 'Edit Facility' : 'Add New Facility' }}</h2>
              <p class="modal-subtitle">
                {{
                  isEditing
                    ? 'Update the facility details below'
                    : 'Fill in the details to add a new credit facility'
                }}
              </p>
            </div>
          </div>
          <button class="modal-close" @click="closeFacilityModal">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <v-form ref="formRef" v-model="valid" lazy-validation>
            <div class="form-section-label">Facility Info</div>
            <v-row>
              <v-col cols="12" md="6">
                <v-select
                  variant="outlined"
                  color="#27bfa0"
                  v-model="facilityForm.bank_id"
                  :items="banks"
                  item-title="name"
                  item-value="id"
                  label="Select Bank"
                  required
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  variant="outlined"
                  color="#27bfa0"
                  v-model="facilityForm.facility_type"
                  :items="facilityTypes"
                  item-title="label"
                  item-value="value"
                  label="Facility Type"
                  :rules="[(v) => !!v || 'Facility type is required']"
                  required
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  variant="outlined"
                  color="#27bfa0"
                  v-model="formattedFacilityAmount"
                  label="Bank Approved OD Amount"
                  required
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  variant="outlined"
                  color="#27bfa0"
                  v-model="facilityForm.borrowing_rate"
                  label="Borrowing Rate (%)"
                  type="number"
                  required
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="facilityForm.rate_unit"
                  :items="[
                    { label: 'Daily', value: 'daily' },
                    { label: 'Monthly', value: 'monthly' },
                    { label: 'Annual', value: 'annual' }
                  ]"
                  item-title="label"
                  item-value="value"
                  label="Rate Type"
                  variant="outlined"
                  color="#27bfa0"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  variant="outlined"
                  color="#27bfa0"
                  v-model="facilityForm.tenure_days"
                  label="Tenure (Days)"
                  required
                />
              </v-col>
              <v-col cols="12" md="6">
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
                      :model-value="facilityForm.drawdown_date"
                      label="Drawdown Date"
                      readonly
                      :rules="[(v) => !!v || 'Drawdown date is required']"
                    />
                  </template>
                  <v-date-picker
                    :model-value="facilityForm.drawdown_date_obj"
                    @update:model-value="
                      (val) => {
                        facilityForm.drawdown_date_obj = val
                        facilityForm.drawdown_date = val ? val.toISOString().split('T')[0] : null
                        disburseMenu = false
                      }
                    "
                  />
                </v-menu>
              </v-col>
            </v-row>

            <div class="form-section-label" style="margin-top: 8px">Fees & Deposits</div>
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="facilityForm.management_fee_percent"
                  label="Management Fee (%)"
                  type="number"
                  variant="outlined"
                  color="#27bfa0"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="facilityForm.vat_percent"
                  label="VAT (%)"
                  type="number"
                  variant="outlined"
                  color="#27bfa0"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formattedOtherFees"
                  label="Other Fees"
                  variant="outlined"
                  color="#27bfa0"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formattedSecurityDeposit"
                  label="Security Deposit"
                  variant="outlined"
                  color="#27bfa0"
                />
              </v-col>
            </v-row>

            <div class="modal-actions">
              <button class="btn-cancel" type="button" @click="closeFacilityModal">Cancel</button>
              <button
                class="btn-save"
                type="button"
                :disabled="!valid || loading"
                @click="submitFacility"
              >
                <v-progress-circular
                  v-if="loading"
                  indeterminate
                  size="16"
                  width="2"
                  color="white"
                  class="mr-2"
                />
                {{ isEditing ? 'Update Facility' : 'Save Facility' }}
              </button>
            </div>
          </v-form>
        </div>
      </div>
    </v-dialog>

    <!-- ─── Drawdown Modal ─── -->
    <v-dialog v-model="showDrawdownModal" max-width="600px">
      <div class="modal-card">
        <div class="modal-header">
          <div class="modal-title-group">
            <div class="modal-icon modal-icon--amber">
              <i class="fa-solid fa-money-bill-wave"></i>
            </div>
            <div>
              <h2 class="modal-title">
                {{ isEditingDrawdown ? 'Edit Drawdown' : 'Record Drawdown' }}
              </h2>
              <p class="modal-subtitle">{{ selectedFacilityForDrawdown?.bank_name }}</p>
            </div>
          </div>
          <button class="modal-close" @click="closeDrawdownModal">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <!-- Section 1: Core -->
          <div class="form-section-label">Drawdown Info</div>
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="formattedDrawdownAmount"
                label="Amount Received"
                variant="outlined"
                color="#27bfa0"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-menu v-model="disburseMenu" :close-on-content-click="false">
                <template #activator="{ props }">
                  <v-text-field
                    v-bind="props"
                    :model-value="drawdownForm.date"
                    label="Drawdown Date"
                    readonly
                    variant="outlined"
                    color="#27bfa0"
                  />
                </template>
                <v-date-picker
                  :model-value="drawdownForm.date_obj"
                  @update:model-value="
                    (val) => {
                      drawdownForm.date_obj = val
                      drawdownForm.date = val.toISOString().split('T')[0]
                      disburseMenu = false
                    }
                  "
                />
              </v-menu>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="drawdownForm.tenure_days"
                label="Tenure (Days)"
                type="number"
                variant="outlined"
                color="#27bfa0"
              />
            </v-col>
          </v-row>

          <!-- Section 2: Fees -->
          <div class="form-section-label" style="margin-top: 8px">Fees & Deposits</div>
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="drawdownForm.management_fee_percent"
                label="Management Fee (%)"
                type="number"
                variant="outlined"
                color="#27bfa0"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="drawdownForm.vat_percent"
                label="VAT (%)"
                type="number"
                variant="outlined"
                color="#27bfa0"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="formattedDrawdownOtherFees"
                label="Other Fees"
                variant="outlined"
                color="#27bfa0"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="formattedDrawdownSecurityDeposit"
                label="Security Deposit"
                variant="outlined"
                color="#27bfa0"
              />
            </v-col>
          </v-row>

          <div class="modal-actions">
            <button class="btn-cancel" @click="closeDrawdownModal">Cancel</button>
            <button class="btn-save" @click="submitDrawdown">
              {{ isEditingDrawdown ? 'Update Drawdown' : 'Save Drawdown' }}
            </button>
          </div>
        </div>
      </div>
    </v-dialog>

    <!-- ─── Delete Confirmation Modal ─── -->
    <v-dialog v-model="showDeleteFacilityModal" max-width="420px">
      <div class="modal-card">
        <div class="modal-header">
          <div class="modal-title-group">
            <div class="modal-icon modal-icon--red">
              <i class="fa-solid fa-triangle-exclamation"></i>
            </div>
            <div>
              <h2 class="modal-title">Delete Facility</h2>
              <p class="modal-subtitle">This action cannot be undone</p>
            </div>
          </div>
        </div>
        <div class="modal-body">
          <p class="delete-message">
            Are you sure you want to delete
            <strong>{{ facilityToDelete?.bank_name || 'this facility' }}</strong>
            <span v-if="facilityToDelete"> ({{ facilityToDelete.facility_type }})</span>?
          </p>
          <div class="modal-actions">
            <button class="btn-cancel" @click="cancelDeleteFacility">Cancel</button>
            <button class="btn-delete" @click="confirmDeleteFacility" :disabled="loading">
              <v-progress-circular
                v-if="loading"
                indeterminate
                size="16"
                width="2"
                color="white"
                class="mr-2"
              />
              Delete Facility
            </button>
          </div>
        </div>
      </div>
    </v-dialog>
  </MainLayout>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

/* ── Base ── */
.facilities-page {
  padding: 24px;
  min-height: 100vh;
  background: #f5f7f9;
}

/* ── Page Header ── */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-radius: 14px;
  padding: 20px 24px;
  margin-bottom: 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}
.header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}
.header-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, #27bfa0, #1a9e85);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18px;
  flex-shrink: 0;
}
.page-title {
  font-size: 20px;
  font-weight: 700;
  color: #1a2332;
  margin: 0;
}
.page-subtitle {
  font-size: 13px;
  color: #7a8899;
  margin: 2px 0 0;
}

/* ── Add Button ── */
.add-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #27bfa0, #1a9e85);
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 10px 20px;
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(39, 191, 160, 0.3);
}
.add-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(39, 191, 160, 0.4);
}

/* ── Stats ── */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 20px;
}
.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}
.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}
.stat-icon--blue {
  background: #eff6ff;
  color: #3b82f6;
}
.stat-icon--green {
  background: #f0fdf4;
  color: #22c55e;
}
.stat-icon--teal {
  background: #f0fdfa;
  color: #27bfa0;
}
.stat-icon--amber {
  background: #fffbeb;
  color: #f59e0b;
}
.stat-value {
  font-size: 16px;
  font-weight: 200;
  color: #1a2332;
}
.stat-label {
  font-size: 12px;
  color: #7a8899;
  margin-top: 2px;
}

/* ── Table Container ── */
.table-container {
  background: #fff;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  overflow-x: auto;
}

/* ── Main Table ── */
.facilities-table {
  width: 100%;
  border-collapse: collapse;
}
.facilities-table thead tr {
  background: #f8fafb;
  border-bottom: 1px solid #e8edf2;
}
.facilities-table thead th {
  padding: 12px 16px;
  text-align: left;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #7a8899;
}
.th-expand {
  width: 52px;
}

.facility-row {
  border-bottom: 1px solid #f0f4f7;
  transition: background 0.15s ease;
}
.facility-row:hover {
  background: #fafcfd;
}
.facility-row.is-expanded {
  background: #f8feff;
  border-bottom: none;
}
.facility-row td {
  padding: 14px 16px;
  font-size: 13.5px;
  color: #2d3a4a;
  vertical-align: middle;
}

/* Expand button */
.td-expand {
  cursor: pointer;
  width: 52px;
  text-align: center;
}
.expand-btn {
  position: relative;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: 1.5px solid #e2e8f0;
  background: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}
.expand-btn:hover {
  border-color: #27bfa0;
  background: #f0fdfa;
}
.expand-btn.active {
  background: #f0fdfa;
  border-color: #27bfa0;
}
.expand-icon {
  font-size: 10px;
  color: #7a8899;
  transition: transform 0.25s ease;
}
.expand-btn.active .expand-icon {
  transform: rotate(90deg);
  color: #27bfa0;
}
.drawdown-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background: #27bfa0;
  color: #fff;
  font-size: 9px;
  font-weight: 700;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'DM Mono', monospace;
}

/* Bank cell */
.bank-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}
.bank-avatar {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: linear-gradient(135deg, #27bfa0, #1a9e85);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.bank-name {
  font-weight: 500;
  color: #1a2332;
}

.type-pill {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  text-transform: capitalize;
  background: #f0f4f7;
  color: #5a6a7e;
  letter-spacing: 0.02em;
}

.amount-cell {
  font-weight: 300;
  color: #1a2332;
}

.rate-value {
  font-family: 'DM Mono', monospace;
  font-weight: 600;
  color: #3b82f6;
}

.date-cell {
  color: #5a6a7e;
  font-size: 13px;
}

/* Status badges */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11.5px;
  font-weight: 600;
  text-transform: capitalize;
}
.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}
.status-active {
  background: #f0fdf4;
  color: #16a34a;
}
.status-repaid {
  background: #eff6ff;
  color: #2563eb;
}
.status-defaulted {
  background: #fef2f2;
  color: #dc2626;
}

/* Actions */
.actions-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  justify-content: center;
}
.action-btn {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: 1.5px solid transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.15s ease;
  background: #f8fafb;
}
.action-btn--drawdown {
  color: #27bfa0;
}
.action-btn--drawdown:hover {
  background: #f0fdfa;
  border-color: #27bfa0;
}
.action-btn--edit {
  color: #6366f1;
}
.action-btn--edit:hover {
  background: #eef2ff;
  border-color: #6366f1;
}
.action-btn--delete {
  color: #ef4444;
}
.action-btn--delete:hover {
  background: #fef2f2;
  border-color: #ef4444;
}

/* ── Drawdown Expansion ── */
.drawdown-expansion-row td {
  padding: 0;
  border-bottom: 1px solid #e8edf2;
}
.expansion-cell {
  background: #f8feff;
}
.expansion-content {
  padding: 16px 24px 20px 60px;
  border-top: 1px dashed #c7eee8;
}
.drawdowns-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #27bfa0;
  margin-bottom: 14px;
}
.drawdowns-header i {
  font-size: 12px;
}

.drawdowns-table {
  width: 100%;
  border-collapse: collapse;
  border-radius: 10px;
  overflow: hidden;
}
.drawdowns-table thead tr {
  background: #e6f7f4;
}
.drawdowns-table thead th {
  padding: 9px 14px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #27bfa0;
  text-align: left;
}
.drawdown-row {
  background: #fff;
  border-bottom: 1px solid #e8f7f4;
  transition: background 0.1s;
}
.drawdown-row:hover {
  background: #f0fdfa;
}
.drawdown-row td {
  padding: 10px 14px;
  font-size: 13px;
  color: #374151;
}
.drawdown-index {
  font-family: 'DM Mono', monospace;
  color: #9ca3af;
  font-size: 12px;
}
.drawdown-amount {
  font-weight: 200;
  color: #1a2332;
}
.drawdown-created {
  color: #9ca3af;
  font-size: 12px;
}

.drawdowns-table tfoot .drawdown-total-row {
  background: #f0fdfa;
  border-top: 2px solid #27bfa0;
}
.drawdown-total-row td {
  padding: 10px 14px;
}
.total-label {
  font-size: 12px;
  font-weight: 700;
  color: #1a9e85;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.total-amount {
  font-family: 'DM Mono', monospace;
  font-weight: 700;
  color: #1a9e85;
  font-size: 14px;
}

.no-drawdowns {
  text-align: center;
  padding: 24px 0;
  color: #9ca3af;
}
.no-drawdowns i {
  font-size: 28px;
  margin-bottom: 8px;
  display: block;
}
.no-drawdowns p {
  font-size: 13px;
  margin-bottom: 12px;
}
.add-drawdown-inline-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 16px;
  border-radius: 8px;
  border: 1.5px solid #27bfa0;
  color: #27bfa0;
  font-size: 13px;
  font-weight: 600;
  background: #fff;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: 'DM Sans', sans-serif;
}
.add-drawdown-inline-btn:hover {
  background: #f0fdfa;
}

/* ── Loading / Empty ── */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
  color: #9ca3af;
  font-size: 14px;
  gap: 12px;
  background: #fff;
  border-radius: 14px;
}
.empty-state {
  text-align: center;
  padding: 80px 0;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}
.empty-icon {
  font-size: 48px;
  color: #d1d5db;
  margin-bottom: 16px;
}
.empty-state h3 {
  font-size: 18px;
  font-weight: 700;
  color: #374151;
  margin-bottom: 6px;
}
.empty-state p {
  font-size: 14px;
  color: #9ca3af;
  margin-bottom: 24px;
}

/* ── Modals ── */
.modal-card {
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  font-family: 'DM Sans', sans-serif;
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #f0f4f7;
  background: #fafcfd;
}
.modal-title-group {
  display: flex;
  align-items: center;
  gap: 14px;
}
.modal-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, #27bfa0, #1a9e85);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 16px;
  flex-shrink: 0;
}
.modal-icon--amber {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}
.modal-icon--red {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}
.modal-title {
  font-size: 16px;
  font-weight: 700;
  color: #1a2332;
  margin: 0;
}
.modal-subtitle {
  font-size: 12.5px;
  color: #7a8899;
  margin: 2px 0 0;
}
.modal-close {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1.5px solid #e8edf2;
  background: #fff;
  color: #7a8899;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
}
.modal-close:hover {
  border-color: #ef4444;
  color: #ef4444;
  background: #fef2f2;
}
.modal-body {
  padding: 24px;
  max-height: 80vh;
  overflow-y: auto;
}

.form-section-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #27bfa0;
  margin-bottom: 12px;
  padding-bottom: 6px;
  border-bottom: 1px solid #e8f7f4;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 24px;
}
.btn-cancel {
  padding: 9px 20px;
  border-radius: 9px;
  border: 1.5px solid #e2e8f0;
  background: #fff;
  color: #5a6a7e;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  font-family: 'DM Sans', sans-serif;
  transition: all 0.15s ease;
}
.btn-cancel:hover {
  border-color: #cbd5e0;
  background: #f8fafb;
}
.btn-save {
  padding: 9px 22px;
  border-radius: 9px;
  border: none;
  background: linear-gradient(135deg, #27bfa0, #1a9e85);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  font-family: 'DM Sans', sans-serif;
  display: flex;
  align-items: center;
  transition: all 0.15s ease;
  box-shadow: 0 2px 8px rgba(39, 191, 160, 0.3);
}
.btn-save:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(39, 191, 160, 0.4);
}
.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn-delete {
  padding: 9px 22px;
  border-radius: 9px;
  border: none;
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  font-family: 'DM Sans', sans-serif;
  display: flex;
  align-items: center;
  transition: all 0.15s;
}
.btn-delete:hover:not(:disabled) {
  box-shadow: 0 4px 14px rgba(239, 68, 68, 0.35);
}
.btn-delete:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.delete-message {
  font-size: 14.5px;
  color: #374151;
  line-height: 1.6;
}

/* Responsive */
@media (max-width: 900px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 600px) {
  .stats-row {
    grid-template-columns: 1fr;
  }
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}

/* Vuetify overrides */
.v-btn {
  text-transform: none;
}
.v-tab {
  text-transform: none;
}
</style>
