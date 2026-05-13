<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import MainLayout from '@/layouts/full/MainLayout.vue'
import { supabase } from '@/services/supabase.js'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const merchantId = authStore.merchant.id

const loading = ref(false)
const allLoans = ref([])
const expandedRows = ref(new Set())
const drawerOpen = ref(false)
const selectedLoan = ref(null)

// ── Filters ──────────────────────────────────────────────
const searchQuery = ref('')
const filterType = ref('All')
const filterStatus = ref('All')

const typeOptions = ['All', 'new', 'extension']
const statusOptions = ['All', 'active', 'completed', 'defaulted', 'overdue']

// ── Fetch ────────────────────────────────────────────────
const fetchLoans = async () => {
  loading.value = true
  try {
    const { data, error } = await supabase.rpc('fetch_loans_to_facility_v1', {
      p_merchant_id: merchantId,
      p_facility_id: authStore.selectedFacility?.id || null
    })
    if (error) throw error
    allLoans.value = data || []
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

// ── Computed ─────────────────────────────────────────────
const filteredLoans = computed(() => {
  let list = allLoans.value

  if (filterType.value !== 'All') {
    list = list.filter((l) => l.loan_type === filterType.value)
  }
  if (filterStatus.value !== 'All') {
    list = list.filter((l) => l.status === filterStatus.value)
  }
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter((l) =>
      [l.customer_name, l.bank_name, l.agent_full_name, l.status].some((v) =>
        String(v || '')
          .toLowerCase()
          .includes(q)
      )
    )
  }

  return list
})

// Group by facility/bank for display
const groupedByBank = computed(() => {
  const map = {}
  filteredLoans.value.forEach((l) => {
    const key = l.bank_name || 'Unknown Bank'
    if (!map[key]) {
      map[key] = {
        bank_name: key,
        facility_id: l.facility_id,
        loans: []
      }
    }
    map[key].loans.push(l)
  })
  return Object.values(map)
})

const bankTotals = (loans) => ({
  total_loan_amount: loans.reduce((s, l) => s + (l.loan_amount || 0), 0),
  total_sales: loans.reduce((s, l) => s + (l.sales_amount || 0), 0),
  total_direct_cost: loans.reduce((s, l) => s + (l.direct_cost || 0), 0),
  total_gross_profit: loans.reduce((s, l) => s + (l.gross_profit || 0), 0),
  total_interest: loans.reduce((s, l) => s + (l.interest_payable || 0), 0)
})

// Grand totals
const grandTotals = computed(() => bankTotals(filteredLoans.value))

// ── Helpers ──────────────────────────────────────────────
const formatCurrency = (v) => {
  if (!v && v !== 0) return '₦0.00'
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(v)
}

const formatDate = (d) => {
  if (!d) return 'N/A'
  return new Date(d).toLocaleDateString('en-NG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

const getStatusBadge = (l) => {
  if (!l.status || !l.expiry_date) return { text: 'N/A', color: 'gray' }
  const today = new Date()
  const expiry = new Date(l.expiry_date)
  const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24))
  if (l.status === 'active') {
    if (diffDays > 5) return { text: 'active', color: 'green' }
    if (diffDays > 0) return { text: `< ${diffDays}d`, color: 'red' }
    return { text: 'closed', color: 'red' }
  }
  if (l.status === 'completed') return { text: 'completed', color: 'blue' }
  if (l.status === 'defaulted') return { text: 'defaulted', color: 'orange' }
  return { text: l.status, color: 'gray' }
}

const toggleRow = (id) => {
  if (expandedRows.value.has(id)) expandedRows.value.delete(id)
  else expandedRows.value.add(id)
  expandedRows.value = new Set(expandedRows.value)
}
const isExpanded = (id) => expandedRows.value.has(id)

const openDrawer = (l) => {
  selectedLoan.value = l
  drawerOpen.value = true
}

const profitMargin = (l) => {
  if (!l.sales_amount || l.sales_amount === 0) return '0.0'
  return (((l.sales_amount - l.direct_cost) / l.sales_amount) * 100).toFixed(1)
}

// ── Watcher ──────────────────────────────────────────────
watch(
  () => authStore.selectedFacility?.id,
  (newVal, oldVal) => {
    if (newVal !== oldVal) fetchLoans()
  }
)

onMounted(() => {
  fetchLoans()
})
</script>

<template>
  <MainLayout>
    <div class="ltf-page">
      <!-- Header -->
      <div class="page-header">
        <div class="header-left">
          <div class="header-icon"><i class="fa-solid fa-chart-line"></i></div>
          <div>
            <h1 class="page-title">Loans to Facility</h1>
            <p class="page-subtitle">All loan records with sales amount, direct cost and profit</p>
          </div>
        </div>
      </div>

      <!-- Grand Totals Strip -->
      <div class="totals-strip" v-if="!loading && allLoans.length">
        <div class="total-item">
          <span class="total-label">Total Records</span>
          <span class="total-val">{{ filteredLoans.length }}</span>
        </div>
        <div class="total-item">
          <span class="total-label">Total Loan Amount</span>
          <span class="total-val">{{ formatCurrency(grandTotals.total_loan_amount) }}</span>
        </div>
        <div class="total-item total-item--green">
          <span class="total-label">Total Sales Amount</span>
          <span class="total-val">{{ formatCurrency(grandTotals.total_sales) }}</span>
        </div>
        <div class="total-item total-item--amber">
          <span class="total-label">Total Direct Cost</span>
          <span class="total-val">{{ formatCurrency(grandTotals.total_direct_cost) }}</span>
        </div>
        <div class="total-item total-item--blue">
          <span class="total-label">Gross Profit</span>
          <span class="total-val">{{ formatCurrency(grandTotals.total_gross_profit) }}</span>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-row">
        <v-text-field
          v-model="searchQuery"
          placeholder="Search a loan record"
          density="compact"
          hide-details
          variant="outlined"
          color="#27bfa0"
          style="max-width: 260px"
        >
          <template #append-inner><i class="fas fa-search text-[#27bfa0]"></i></template>
        </v-text-field>
        <v-select
          v-model="filterType"
          :items="typeOptions"
          label="Type"
          density="compact"
          hide-details
          variant="outlined"
          color="#27bfa0"
          style="max-width: 140px"
        />
        <v-select
          v-model="filterStatus"
          :items="statusOptions"
          label="Status"
          density="compact"
          hide-details
          variant="outlined"
          color="#27bfa0"
          style="max-width: 150px"
        />
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loading-state">
        <v-progress-circular indeterminate color="#27bfa0" size="44" width="3" />
        <p>Loading loan records...</p>
      </div>

      <!-- Grouped tables per bank -->
      <div v-else-if="filteredLoans.length > 0">
        <div v-for="group in groupedByBank" :key="group.bank_name" class="bank-group">
          <!-- Bank section header -->
          <div class="bank-group-header">
            <div class="bank-group-avatar">{{ group.bank_name[0] }}</div>
            <div>
              <div class="bank-group-name">{{ group.bank_name }}</div>
              <div class="bank-group-sub">
                {{ group.loans.length }} loan record{{ group.loans.length > 1 ? 's' : '' }}
              </div>
            </div>
            <!-- <div class="bank-group-totals">
              <span class="bgt-item">
                <span class="bgt-label">Sales</span>
                <span class="bgt-val bgt-val--green">{{
                  formatCurrency(bankTotals(group.loans).total_sales)
                }}</span>
              </span>
              <span class="bgt-item">
                <span class="bgt-label">Direct Cost</span>
                <span class="bgt-val bgt-val--amber">{{
                  formatCurrency(bankTotals(group.loans).total_direct_cost)
                }}</span>
              </span>
              <span class="bgt-item">
                <span class="bgt-label">Gross Profit</span>
                <span class="bgt-val bgt-val--blue">{{
                  formatCurrency(bankTotals(group.loans).total_gross_profit)
                }}</span>
              </span>
            </div> -->
          </div>

          <!-- Loans table -->
          <div class="table-container">
            <table class="ltf-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Customer</th>
                  <th>Type</th>
                  <th>Loan Amount</th>
                  <th>Rate</th>
                  <th>Tenure</th>
                  <th>Disbursed</th>
                  <th>Expiry</th>
                  <th class="col-green">Sales Amount</th>
                  <th class="col-amber">Direct Cost</th>
                  <th class="col-blue">Gross Profit</th>
                  <th>Status</th>
                  <th>View</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="l in group.loans"
                  :key="l.id"
                  :class="{
                    'is-extension': l.loan_type === 'extension',
                    'is-expanded': isExpanded(l.id)
                  }"
                >
                  <!-- Extension indent indicator -->
                  <td class="td-type-indicator">
                    <span v-if="l.loan_type === 'extension'" class="ext-line"></span>
                  </td>
                  <td>
                    <div class="customer-cell">
                      <div class="cust-avatar">{{ (l.customer_name || 'C')[0] }}</div>
                      <div>
                        <div class="cust-name">{{ l.customer_name }}</div>
                        <div class="cust-acc">{{ l.customer_account_number || '' }}</div>
                      </div>
                    </div>
                  </td>
                  <td>
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
                  <td class="amt-cell">{{ formatCurrency(l.loan_amount) }}</td>
                  <td>
                    <span class="rate-chip">{{ l.agreed_rate }}%</span>
                  </td>
                  <td class="muted-cell">{{ l.tenure_days }}d</td>
                  <td class="muted-cell">{{ formatDate(l.disbursed_at) }}</td>
                  <td class="muted-cell">{{ formatDate(l.expiry_date) }}</td>
                  <td class="col-green font-medium">{{ formatCurrency(l.sales_amount) }}</td>
                  <td class="col-amber font-medium">{{ formatCurrency(l.direct_cost) }}</td>
                  <td class="col-blue font-medium">{{ formatCurrency(l.gross_profit) }}</td>
                  <!-- <td>
                    <span
                      :class="[
                        'margin-pill',
                        Number(profitMargin(l)) >= 0 ? 'margin-pill--pos' : 'margin-pill--neg'
                      ]"
                    >
                      {{ profitMargin(l) }}%
                    </span>
                  </td> -->
                  <td>
                    <span
                      :class="{
                        'status-badge': true,
                        'status-green': getStatusBadge(l).color === 'green',
                        'status-red': getStatusBadge(l).color === 'red',
                        'status-blue': getStatusBadge(l).color === 'blue',
                        'status-orange': getStatusBadge(l).color === 'orange',
                        'status-gray': getStatusBadge(l).color === 'gray'
                      }"
                      >{{ getStatusBadge(l).text }}</span
                    >
                  </td>
                  <td>
                    <button class="view-btn" @click="openDrawer(l)" title="View Details">
                      <i class="fas fa-eye"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="group-total-row">
                  <td colspan="3" class="total-label-cell">
                    Subtotal ({{ group.loans.length }} records)
                  </td>
                  <td class="font-semibold text-gray-800">
                    {{ formatCurrency(bankTotals(group.loans).total_loan_amount) }}
                  </td>
                  <td colspan="4"></td>
                  <td class="col-green font-bold">
                    {{ formatCurrency(bankTotals(group.loans).total_sales) }}
                  </td>
                  <td class="col-amber font-bold">
                    {{ formatCurrency(bankTotals(group.loans).total_direct_cost) }}
                  </td>
                  <td class="col-blue font-bold">
                    {{ formatCurrency(bankTotals(group.loans).total_gross_profit) }}
                  </td>
                  <td colspan="3"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      <!-- Empty -->
      <div v-else class="empty-state">
        <div class="empty-icon"><i class="fa-solid fa-chart-line"></i></div>
        <h3>No Loan Records Found</h3>
        <p>Add loans via the Database page to see them here.</p>
      </div>
    </div>

    <!-- ─── Detail Drawer ─── -->
    <v-navigation-drawer
      v-model="drawerOpen"
      location="right"
      :width="480"
      temporary
      class="ltf-drawer"
    >
      <div v-if="selectedLoan" class="drawer-inner">
        <!-- Header -->
        <div class="drawer-header">
          <div class="dh-left">
            <div class="dh-avatar">{{ (selectedLoan.customer_name || 'C')[0] }}</div>
            <div>
              <h2 class="dh-name">{{ selectedLoan.customer_name }}</h2>
              <div class="dh-meta">
                <span
                  :class="
                    selectedLoan.loan_type === 'extension'
                      ? 'type-pill type-pill--ext'
                      : 'type-pill type-pill--new'
                  "
                >
                  {{ selectedLoan.loan_type || 'new' }}
                </span>
                <span class="dh-bank">{{ selectedLoan.bank_name }}</span>
              </div>
            </div>
          </div>
          <button class="modal-close" @click="drawerOpen = false">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <!-- Financial highlight cards -->
        <div class="drawer-cards">
          <div class="dc-card dc-card--blue">
            <div class="dc-label">Loan Amount</div>
            <div class="dc-val">{{ formatCurrency(selectedLoan.loan_amount) }}</div>
          </div>
          <div class="dc-card dc-card--green">
            <div class="dc-label">Sales Amount</div>
            <div class="dc-val">{{ formatCurrency(selectedLoan.sales_amount) }}</div>
            <div class="dc-formula">= Amount × Rate × (Days/30)</div>
          </div>
          <div class="dc-card dc-card--amber">
            <div class="dc-label">Direct Cost</div>
            <div class="dc-val">{{ formatCurrency(selectedLoan.direct_cost) }}</div>
            <div class="dc-formula">= Amount × Bank Rate × (Days/30)</div>
          </div>
          <div class="dc-card dc-card--teal">
            <div class="dc-label">Gross Profit</div>
            <div class="dc-val">{{ formatCurrency(selectedLoan.gross_profit) }}</div>
            <div class="dc-formula">= Sales − Direct Cost</div>
          </div>
        </div>

        <!-- Loan details -->
        <div class="drawer-section">
          <div class="ds-title"><i class="fa-solid fa-circle-info"></i> Loan Details</div>
          <div class="ds-grid">
            <div class="ds-row">
              <span class="ds-lbl">Customer</span
              ><span class="ds-val">{{ selectedLoan.customer_name }}</span>
            </div>
            <div class="ds-row">
              <span class="ds-lbl">Account Number</span
              ><span class="ds-val">{{ selectedLoan.customer_account_number || 'N/A' }}</span>
            </div>
            <div class="ds-row">
              <span class="ds-lbl">Phone</span
              ><span class="ds-val">{{ selectedLoan.customer_phone || 'N/A' }}</span>
            </div>
            <div class="ds-row">
              <span class="ds-lbl">Agent</span
              ><span class="ds-val">{{
                selectedLoan.agent_full_name || selectedLoan.agent_name || 'N/A'
              }}</span>
            </div>
            <div class="ds-row">
              <span class="ds-lbl">Agreed Rate</span
              ><span class="ds-val rate-val">{{ selectedLoan.agreed_rate }}%</span>
            </div>
            <div class="ds-row">
              <span class="ds-lbl">Bank Rate</span
              ><span class="ds-val rate-val col-amber">{{ selectedLoan.bank_rate }}%</span>
            </div>
            <div class="ds-row">
              <span class="ds-lbl">Tenure</span
              ><span class="ds-val">{{ selectedLoan.tenure_days }} days</span>
            </div>
            <div class="ds-row">
              <span class="ds-lbl">Disbursed</span
              ><span class="ds-val">{{ formatDate(selectedLoan.disbursed_at) }}</span>
            </div>
            <div class="ds-row">
              <span class="ds-lbl">Expiry</span
              ><span class="ds-val">{{ formatDate(selectedLoan.expiry_date) }}</span>
            </div>
            <div class="ds-row">
              <span class="ds-lbl">Status</span>
              <span
                :class="{
                  'status-badge': true,
                  'status-green': getStatusBadge(selectedLoan).color === 'green',
                  'status-red': getStatusBadge(selectedLoan).color === 'red',
                  'status-blue': getStatusBadge(selectedLoan).color === 'blue',
                  'status-gray': getStatusBadge(selectedLoan).color === 'gray'
                }"
                >{{ getStatusBadge(selectedLoan).text }}</span
              >
            </div>
            <div v-if="selectedLoan.loan_type === 'extension'" class="ds-row">
              <span class="ds-lbl">Extending</span>
              <span class="ds-val">{{ selectedLoan.parent_customer_name || 'Original loan' }}</span>
            </div>
          </div>
        </div>

        <!-- Cost breakdown -->
        <div class="drawer-section">
          <div class="ds-title"><i class="fa-solid fa-calculator"></i> Cost Breakdown</div>
          <div class="cost-breakdown">
            <div class="cb-row">
              <span class="cb-lbl">Sales Amount</span>
              <span class="cb-formula"
                >{{ formatCurrency(selectedLoan.loan_amount) }} × {{ selectedLoan.agreed_rate }}% ×
                {{ selectedLoan.tenure_days }}/30</span
              >
              <span class="cb-val col-green">{{ formatCurrency(selectedLoan.sales_amount) }}</span>
            </div>
            <div class="cb-row">
              <span class="cb-lbl">Direct Cost</span>
              <span class="cb-formula"
                >{{ formatCurrency(selectedLoan.loan_amount) }} × {{ selectedLoan.bank_rate }}% ×
                {{ selectedLoan.tenure_days }}/30</span
              >
              <span class="cb-val col-amber">{{ formatCurrency(selectedLoan.direct_cost) }}</span>
            </div>
            <div class="cb-row cb-row--total">
              <span class="cb-lbl">Gross Profit</span>
              <span class="cb-formula">Sales − Direct Cost</span>
              <span class="cb-val col-blue">{{ formatCurrency(selectedLoan.gross_profit) }}</span>
            </div>
            <div class="cb-row">
              <span class="cb-lbl">Profit Margin</span>
              <span class="cb-formula">Gross / Sales × 100</span>
              <span
                class="cb-val"
                :class="Number(profitMargin(selectedLoan)) >= 0 ? 'col-green' : 'col-red'"
              >
                {{ profitMargin(selectedLoan) }}%
              </span>
            </div>
            <div class="cb-row">
              <span class="cb-lbl">Interest Payable</span>
              <span class="cb-val">{{ formatCurrency(selectedLoan.interest_payable) }}</span>
            </div>
          </div>
        </div>

        <!-- Facility context -->
        <div class="drawer-section">
          <div class="ds-title"><i class="fa-solid fa-building-columns"></i> Facility</div>
          <div class="ds-grid">
            <div class="ds-row">
              <span class="ds-lbl">Bank</span
              ><span class="ds-val">{{ selectedLoan.bank_name }}</span>
            </div>
            <div class="ds-row">
              <span class="ds-lbl">Facility Amount</span
              ><span class="ds-val">{{ formatCurrency(selectedLoan.facility_amount) }}</span>
            </div>
            <div class="ds-row">
              <span class="ds-lbl">Bank Rate</span
              ><span class="ds-val col-amber">{{ selectedLoan.bank_rate }}%</span>
            </div>
            <!-- <div class="ds-row">
              <span class="ds-lbl">Mgt Fee %</span
              ><span class="ds-val">{{ selectedLoan.management_fee_percent }}%</span>
            </div> -->
          </div>
        </div>
      </div>
    </v-navigation-drawer>
  </MainLayout>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

.ltf-page {
  padding: 24px;
  min-height: 100vh;
  background: #f5f7f9;
  font-family: 'DM Sans', sans-serif;
}

/* Header */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-radius: 14px;
  padding: 20px 24px;
  margin-bottom: 16px;
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

/* Totals strip */
.totals-strip {
  display: flex;
  gap: 0;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  margin-bottom: 16px;
}
.total-item {
  flex: 1;
  padding: 14px 18px;
  border-right: 1px solid #f0f4f7;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.total-item:last-child {
  border-right: none;
}
.total-item--green {
  background: #f7fdf9;
}
.total-item--amber {
  background: #fffdf5;
}
.total-item--blue {
  background: #f5f8ff;
}
.total-label {
  font-size: 11px;
  color: #9ca3af;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.total-val {
  font-size: 15px;
  font-weight: 300;
  color: #1a2332;
}

/* Filters */
.filters-row {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

/* Bank group */
.bank-group {
  margin-bottom: 24px;
}
.bank-group-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #fff;
  border-radius: 12px 12px 0 0;
  border-bottom: 2px solid #e8f7f4;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}
.bank-group-avatar {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, #27bfa0, #1a9e85);
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.bank-group-name {
  font-size: 15px;
  font-weight: 700;
  color: #1a2332;
}
.bank-group-sub {
  font-size: 12px;
  color: #9ca3af;
}
.bank-group-totals {
  margin-left: auto;
  display: flex;
  gap: 20px;
}
.bgt-item {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}
.bgt-label {
  font-size: 10px;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.bgt-val {
  font-size: 13px;
  font-weight: 700;
  font-family: 'DM Mono', monospace;
}
.bgt-val--green {
  color: #16a34a;
}
.bgt-val--amber {
  color: #d97706;
}
.bgt-val--blue {
  color: #2563eb;
}

/* Table */
.table-container {
  background: #fff;
  border-radius: 0 0 12px 12px;
  overflow-x: auto;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}
.ltf-table {
  width: 100%;
  border-collapse: collapse;
}
.ltf-table thead tr {
  background: #f8fafb;
  border-bottom: 1px solid #e8edf2;
}
.ltf-table thead th {
  padding: 10px 12px;
  text-align: left;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #7a8899;
  white-space: nowrap;
}
.ltf-table thead th.col-green {
  color: #16a34a;
}
.ltf-table thead th.col-amber {
  color: #d97706;
}
.ltf-table thead th.col-blue {
  color: #2563eb;
}

.ltf-table tbody tr {
  border-bottom: 1px solid #f0f4f7;
  transition: background 0.1s;
}
.ltf-table tbody tr:hover {
  background: #fafcfd;
}
.ltf-table tbody tr.is-extension {
  background: #fafaff;
}
.ltf-table tbody tr.is-extension:hover {
  background: #f3f3ff;
}
.ltf-table tbody td {
  padding: 11px 12px;
  font-size: 13px;
  color: #2d3a4a;
  vertical-align: middle;
  white-space: nowrap;
}

/* Extension indent */
.td-type-indicator {
  width: 16px;
  padding: 0 !important;
}
.ext-line {
  display: block;
  width: 3px;
  height: 36px;
  margin: 0 auto;
  background: #6366f1;
  border-radius: 2px;
  opacity: 0.6;
}

/* Customer cell */
.customer-cell {
  display: flex;
  align-items: center;
  gap: 9px;
}
.cust-avatar {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  background: #e8f7f4;
  color: #27bfa0;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.cust-name {
  font-weight: 500;
  color: #1a2332;
  font-size: 13px;
}
.cust-acc {
  font-size: 11px;
  color: #9ca3af;
}
.amt-cell {
  font-weight: 300;
}
.muted-cell {
  color: #7a8899;
}

/* Rate chip */
.rate-chip {
  display: inline-block;
  padding: 2px 7px;
  border-radius: 6px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 11px;
  font-weight: 700;
  font-family: 'DM Mono', monospace;
}

/* Colored columns */
.col-green {
  color: #16a34a;
}
.col-amber {
  color: #d97706;
}
.col-blue {
  color: #2563eb;
}
.col-red {
  color: #ef4444;
}

/* Margin pill */
.margin-pill {
  display: inline-block;
  padding: 2px 7px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
}
.margin-pill--pos {
  background: #f0fdf4;
  color: #16a34a;
}
.margin-pill--neg {
  background: #fef2f2;
  color: #ef4444;
}

/* Type pills */
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

/* Status badges */
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  text-transform: capitalize;
}
.status-green {
  background: #f0fdf4;
  color: #16a34a;
}
.status-red {
  background: #fef2f2;
  color: #dc2626;
}
.status-blue {
  background: #eff6ff;
  color: #2563eb;
}
.status-orange {
  background: #fffbeb;
  color: #d97706;
}
.status-gray {
  background: #f3f4f6;
  color: #6b7280;
}

/* View button */
.view-btn {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  border: 1.5px solid #e2e8f0;
  background: #fff;
  color: #27bfa0;
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
}
.view-btn:hover {
  background: #f0fdfa;
  border-color: #27bfa0;
}

/* Group total row */
.group-total-row {
  background: #f8fafb;
  border-top: 2px solid #e8edf2;
}
.group-total-row td {
  padding: 10px 12px;
  font-size: 12px;
}
.total-label-cell {
  color: #7a8899;
  font-weight: 700;
  text-transform: uppercase;
  font-size: 10.5px;
  letter-spacing: 0.05em;
}

/* Loading / Empty */
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
}

/* ── Drawer ── */
.ltf-drawer :deep(.v-navigation-drawer__content) {
  overflow: hidden;
}
.drawer-inner {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  font-family: 'DM Sans', sans-serif;
}
.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px 14px;
  border-bottom: 1px solid #f0f4f7;
  background: #fafcfd;
  position: sticky;
  top: 0;
  z-index: 1;
  flex-shrink: 0;
}
.dh-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.dh-avatar {
  width: 42px;
  height: 42px;
  border-radius: 11px;
  background: linear-gradient(135deg, #27bfa0, #1a9e85);
  color: #fff;
  font-size: 17px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}
.dh-name {
  font-size: 16px;
  font-weight: 700;
  color: #1a2332;
  margin: 0;
}
.dh-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}
.dh-bank {
  font-size: 12px;
  color: #7a8899;
}
.modal-close {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: 1.5px solid #e8edf2;
  background: #fff;
  color: #7a8899;
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal-close:hover {
  border-color: #ef4444;
  color: #ef4444;
  background: #fef2f2;
}

/* Drawer cards */
.drawer-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  padding: 14px 18px;
  border-bottom: 1px solid #f0f4f7;
}
.dc-card {
  padding: 11px 13px;
  border-radius: 10px;
  border: 1px solid transparent;
}
.dc-card--blue {
  background: #eff6ff;
  border-color: #bfdbfe;
}
.dc-card--green {
  background: #f0fdf4;
  border-color: #bbf7d0;
}
.dc-card--amber {
  background: #fffbeb;
  border-color: #fde68a;
}
.dc-card--teal {
  background: #f0fdfa;
  border-color: #99f6e4;
}
.dc-label {
  font-size: 10px;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 4px;
  font-weight: 700;
}
.dc-val {
  font-size: 14px;
  font-weight: 600;
  color: #1a2332;
}
.dc-formula {
  font-size: 10px;
  color: #9ca3af;
  margin-top: 3px;
  font-style: italic;
}

/* Drawer sections */
.drawer-section {
  padding: 14px 18px;
  border-bottom: 1px solid #f0f4f7;
}
.drawer-section:last-child {
  border-bottom: none;
}
.ds-title {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #27bfa0;
  margin-bottom: 10px;
}
.ds-grid {
  display: flex;
  flex-direction: column;
}
.ds-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f5f7f9;
  font-size: 13px;
}
.ds-row:last-child {
  border-bottom: none;
}
.ds-lbl {
  color: #7a8899;
}
.ds-val {
  color: #1a2332;
  font-weight: 500;
  text-align: right;
}
.rate-val {
  font-family: 'DM Mono', monospace;
  font-weight: 700;
  color: #2563eb;
}

/* Cost breakdown in drawer */
.cost-breakdown {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.cb-row {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f5f7f9;
  font-size: 12.5px;
  gap: 8px;
}
.cb-row:last-child {
  border-bottom: none;
}
.cb-row--total {
  border-top: 2px solid #27bfa0;
  margin-top: 4px;
  padding-top: 10px;
  border-bottom: none;
}
.cb-lbl {
  color: #5a6a7e;
  font-weight: 500;
}
.cb-formula {
  color: #9ca3af;
  font-size: 11px;
  font-style: italic;
}
.cb-val {
  font-family: 'DM Mono', monospace;
  font-weight: 700;
  font-size: 13px;
  text-align: right;
  color: #1a2332;
}
</style>
