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
            <h1 class="page-title">Facilities – Bank OD</h1>
            <p class="page-subtitle">Overdraft cost summary across all banking facilities</p>
          </div>
        </div>
      </div>

      <!-- Stats Row -->
      <div class="stats-row" v-if="!loading && odSummary.length > 0">
        <div class="stat-card">
          <div class="stat-icon stat-icon--blue"><i class="fa-solid fa-landmark"></i></div>
          <div>
            <div class="stat-value">{{ odSummary.length }}</div>
            <div class="stat-label">Total Facilities</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon stat-icon--teal"><i class="fa-solid fa-sack-dollar"></i></div>
          <div>
            <div class="stat-value">{{ formatCurrency(totalApproved) }}</div>
            <div class="stat-label">Total Approved OD</div>
          </div>
        </div>
        <!-- <div class="stat-card">
          <div class="stat-icon stat-icon--green">
            <i class="fa-solid fa-arrow-down-to-line"></i>
          </div>
          <div>
            <div class="stat-value">{{ formatCurrency(totalReceived) }}</div>
            <div class="stat-label">Total Received</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon stat-icon--purple">
            <i class="fa-solid fa-money-bill-transfer"></i>
          </div>
          <div>
            <div class="stat-value">
              {{ formatCurrency(totalDisbursedToCustomers) }}
            </div>
            <div class="stat-label">Disbursed To Customers</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon stat-icon--indigo">
            <i class="fa-solid fa-wallet"></i>
          </div>
          <div>
            <div class="stat-value">
              {{ formatCurrency(totalAvailableDrawdownBalance) }}
            </div>
            <div class="stat-label">Available Drawdown Balance</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon stat-icon--amber">
            <i class="fa-solid fa-circle-dollar-to-slot"></i>
          </div>
          <div>
            <div class="stat-value">{{ formatCurrency(totalCost) }}</div>
            <div class="stat-label">Total Cost</div>
          </div>
        </div> -->
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loading-state">
        <v-progress-circular indeterminate color="#27bfa0" size="44" width="3" />
        <p>Loading OD summary...</p>
      </div>

      <!-- Table -->
      <div v-else-if="odSummary.length > 0" class="table-container">
        <table class="facilities-table">
          <thead>
            <tr>
              <th class="th-expand"></th>
              <th>Bank</th>
              <th>Approved OD</th>
              <th>Total Received</th>
              <th>Disbursed</th>
              <th>Available</th>
              <th>Balance</th>
              <th>Rate</th>
              <th>Mgt Fee</th>
              <th>VAT</th>
              <th>Other Fees</th>
              <th>Security</th>
              <th>Interest</th>
              <th>Total Cost</th>
              <th class="text-center">View</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="item in odSummary" :key="item.id">
              <!-- Main Row -->
              <tr class="facility-row" :class="{ 'is-expanded': isExpanded(item.id) }">
                <td class="td-expand" @click="toggleRow(item.id)">
                  <button class="expand-btn" :class="{ active: isExpanded(item.id) }">
                    <i class="fa-solid fa-chevron-right expand-icon"></i>
                    <span v-if="item.drawdowns?.length" class="drawdown-badge">
                      {{ item.drawdowns.length }}
                    </span>
                  </button>
                </td>
                <td>
                  <div class="bank-cell">
                    <div class="bank-avatar">{{ (item.bank_name || 'B')[0] }}</div>
                    <span class="bank-name">{{ item.bank_name || 'N/A' }}</span>
                  </div>
                </td>
                <td class="amount-cell">{{ formatCurrency(item.approved_amount) }}</td>
                <td class="amount-cell">{{ formatCurrency(item.total_received) }}</td>
                <td class="amount-cell">
                  {{ formatCurrency(item.total_disbursed_to_customers) }}
                </td>

                <td>
                  <span :class="item.available_drawdown_balance < 0 ? 'neg-amount' : 'pos-amount'">
                    {{ formatCurrency(item.available_drawdown_balance) }}
                  </span>
                </td>
                <td>
                  <span :class="item.balance < 0 ? 'neg-amount' : 'pos-amount'">
                    {{ formatCurrency(item.balance) }}
                  </span>
                </td>
                <td>
                  <span class="rate-value">{{ item.borrowing_rate }}%</span>
                </td>
                <td>{{ formatCurrency(item.management_fee) }}</td>
                <td>{{ formatCurrency(item.vat_on_mgt_fee) }}</td>
                <td>{{ formatCurrency(item.other_fees_amount) }}</td>
                <td>{{ formatCurrency(item.security_deposit_amount) }}</td>
                <td class="amount-cell">{{ formatCurrency(item.interest_accrued) }}</td>
                <td>
                  <span class="total-cost-value">{{ formatCurrency(item.total_cost) }}</span>
                </td>
                <td>
                  <div class="actions-cell">
                    <button
                      class="action-btn action-btn--view"
                      @click="openDrawer(item)"
                      title="View Details"
                    >
                      <i class="fas fa-eye"></i>
                    </button>
                  </div>
                </td>
              </tr>

              <!-- Drawdown Expansion Row -->
              <tr v-if="isExpanded(item.id)" class="drawdown-expansion-row">
                <td colspan="15" class="expansion-cell">
                  <div class="expansion-content">
                    <div class="drawdowns-header">
                      <i class="fa-solid fa-arrow-down-to-line"></i>
                      <span
                        >Drawdown History for <strong>{{ item.bank_name }}</strong></span
                      >
                    </div>

                    <div v-if="item.drawdowns && item.drawdowns.length > 0">
                      <table class="drawdowns-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Date</th>
                            <th>Amount</th>
                            <th>Days Outstanding</th>
                            <th>Interest Accrued</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr
                            v-for="(drawdown, idx) in item.drawdowns"
                            :key="drawdown.id"
                            class="drawdown-row"
                          >
                            <td class="drawdown-index">{{ idx + 1 }}</td>
                            <td>{{ formatDate(drawdown.date) }}</td>
                            <td class="drawdown-amount">{{ formatCurrency(drawdown.amount) }}</td>
                            <td>
                              <span class="days-pill">{{ drawdown.days_outstanding }} days</span>
                            </td>
                            <td class="drawdown-amount">{{ formatCurrency(drawdown.interest) }}</td>
                            <td>
                              <button
                                class="action-btn action-btn--view"
                                @click="openDrawdownDrawer(item, drawdown)"
                                title="View Drawdown Detail"
                              >
                                <i class="fas fa-eye"></i>
                              </button>
                            </td>
                          </tr>
                        </tbody>
                        <tfoot>
                          <tr class="drawdown-total-row">
                            <td colspan="2" class="total-label">Totals</td>
                            <td class="total-amount">
                              {{
                                formatCurrency(
                                  item.drawdowns.reduce((s, d) => s + (d.amount || 0), 0)
                                )
                              }}
                            </td>
                            <td></td>
                            <td class="total-amount">
                              {{
                                formatCurrency(
                                  item.drawdowns.reduce((s, d) => s + (d.interest || 0), 0)
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
                      <p>No drawdowns recorded for this facility.</p>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <!-- Empty -->
      <div v-else class="empty-state">
        <div class="empty-icon"><i class="fa-solid fa-building-columns"></i></div>
        <h3>No OD Summary Available</h3>
        <p>Add credit facilities and record drawdowns to see the cost summary here.</p>
      </div>
    </div>

    <!-- ─── Facility Detail Drawer ─── -->
    <v-navigation-drawer
      v-model="drawerOpen"
      location="right"
      :width="520"
      temporary
      class="facility-drawer"
    >
      <div v-if="selectedItem" class="drawer-inner">
        <!-- Drawer Header -->
        <div class="drawer-header">
          <div class="drawer-title-group">
            <div class="drawer-avatar">{{ (selectedItem.bank_name || 'B')[0] }}</div>
            <div>
              <h2 class="drawer-title">{{ selectedItem.bank_name }}</h2>
              <span class="drawer-type-pill">{{ selectedItem.facility_type || 'Overdraft' }}</span>
            </div>
          </div>
          <button class="modal-close" @click="drawerOpen = false">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <!-- Summary Cards -->
        <div class="drawer-summary-grid">
          <div class="dsummary-card dsummary-card--blue">
            <div class="dsummary-label">Approved OD</div>
            <div class="dsummary-value">{{ formatCurrency(selectedItem.approved_amount) }}</div>
          </div>
          <div class="dsummary-card dsummary-card--green">
            <div class="dsummary-label">Total Received</div>
            <div class="dsummary-value">{{ formatCurrency(selectedItem.total_received) }}</div>
          </div>
          <div class="dsummary-card dsummary-card--purple">
            <div class="dsummary-label">Disbursed</div>
            <div class="dsummary-value">
              {{ formatCurrency(selectedItem.total_disbursed_to_customers) }}
            </div>
          </div>

          <div
            class="dsummary-card"
            :class="
              selectedItem.available_drawdown_balance < 0
                ? 'dsummary-card--red'
                : 'dsummary-card--indigo'
            "
          >
            <div class="dsummary-label">Available</div>
            <div class="dsummary-value">
              {{ formatCurrency(selectedItem.available_drawdown_balance) }}
            </div>
          </div>
          <div
            class="dsummary-card"
            :class="selectedItem.balance < 0 ? 'dsummary-card--red' : 'dsummary-card--teal'"
          >
            <div class="dsummary-label">Balance</div>
            <div class="dsummary-value">{{ formatCurrency(selectedItem.balance) }}</div>
          </div>
          <div class="dsummary-card dsummary-card--amber">
            <div class="dsummary-label">Total Cost</div>
            <div class="dsummary-value">{{ formatCurrency(selectedItem.total_cost) }}</div>
          </div>
        </div>

        <!-- Facility Info Section -->
        <div class="drawer-section">
          <div class="drawer-section-title">
            <i class="fa-solid fa-circle-info"></i> Facility Details
          </div>
          <div class="detail-grid">
            <div class="detail-row">
              <span class="detail-label">Borrowing Rate</span>
              <span class="detail-value rate-value"
                >{{ selectedItem.borrowing_rate }}%
                <span class="rate-unit">({{ selectedItem.rate_unit }})</span></span
              >
            </div>
            <div class="detail-row">
              <span class="detail-label">Tenure</span>
              <span class="detail-value">{{
                selectedItem.tenure_days ? selectedItem.tenure_days + ' days' : 'N/A'
              }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Drawdown Date</span>
              <span class="detail-value">{{ formatDate(selectedItem.drawdown_date) }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Expiry Date</span>
              <span class="detail-value">{{ formatDate(selectedItem.expiry_date) }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Disbursed To Customers</span>
              <span class="detail-value">
                {{ formatCurrency(selectedItem.total_disbursed_to_customers) }}
              </span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Available Drawdown Balance</span>
              <span
                class="detail-value"
                :class="selectedItem.available_drawdown_balance < 0 ? 'neg-amount' : 'pos-amount'"
              >
                {{ formatCurrency(selectedItem.available_drawdown_balance) }}
              </span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Status</span>
              <span class="status-badge" :class="`status-${selectedItem.status}`">
                <span class="status-dot"></span>{{ selectedItem.status }}
              </span>
            </div>
          </div>
        </div>

        <!-- Cost Breakdown Section -->
        <div class="drawer-section">
          <div class="drawer-section-title"><i class="fa-solid fa-receipt"></i> Cost Breakdown</div>
          <div class="cost-breakdown">
            <div class="cost-row">
              <span class="cost-label"
                >Management Fee ({{ selectedItem.management_fee_percent }}%)</span
              >
              <span class="cost-val">{{ formatCurrency(selectedItem.management_fee) }}</span>
            </div>
            <div class="cost-row">
              <span class="cost-label">VAT on Mgt Fee ({{ selectedItem.vat_percent }}%)</span>
              <span class="cost-val">{{ formatCurrency(selectedItem.vat_on_mgt_fee) }}</span>
            </div>
            <div class="cost-row">
              <span class="cost-label">Other Fees</span>
              <span class="cost-val">{{ formatCurrency(selectedItem.other_fees_amount) }}</span>
            </div>
            <div class="cost-row">
              <span class="cost-label">Security Deposit</span>
              <span class="cost-val">{{
                formatCurrency(selectedItem.security_deposit_amount)
              }}</span>
            </div>
            <div class="cost-row">
              <span class="cost-label">Interest Accrued</span>
              <span class="cost-val interest-val">{{
                formatCurrency(selectedItem.interest_accrued)
              }}</span>
            </div>
            <div class="cost-row cost-row--total">
              <span class="cost-label">Total Cost</span>
              <span class="cost-val total-val">{{ formatCurrency(selectedItem.total_cost) }}</span>
            </div>
          </div>
        </div>

        <!-- Drawdowns Section -->
        <div class="drawer-section">
          <div class="drawer-section-title">
            <i class="fa-solid fa-arrow-down-to-line"></i>
            Drawdown Records
            <span class="drawdown-count-badge">{{ selectedItem.drawdowns?.length || 0 }}</span>
          </div>

          <div
            v-if="selectedItem.drawdowns && selectedItem.drawdowns.length > 0"
            class="drawer-drawdowns"
          >
            <div
              v-for="(d, idx) in selectedItem.drawdowns"
              :key="d.id"
              class="drawer-drawdown-card"
            >
              <div class="ddc-left">
                <div class="ddc-index">#{{ idx + 1 }}</div>
                <div>
                  <div class="ddc-amount">{{ formatCurrency(d.amount) }}</div>
                  <div class="ddc-date">{{ formatDate(d.date) }}</div>
                </div>
              </div>
              <div class="ddc-right">
                <div class="ddc-interest-label">Interest</div>
                <div class="ddc-interest">{{ formatCurrency(d.interest) }}</div>
                <div class="ddc-days">{{ d.days_outstanding }}d</div>
              </div>
              <i class="fas fa-chevron-right ddc-arrow"></i>
            </div>

            <!-- Totals row -->
            <div class="drawer-drawdown-totals">
              <div>
                <span class="dtotal-label">Total Drawn</span>
                <span class="dtotal-val">{{ formatCurrency(selectedItem.total_received) }}</span>
              </div>
              <div>
                <span class="dtotal-label">Total Interest</span>
                <span class="dtotal-val interest-val">{{
                  formatCurrency(selectedItem.interest_accrued)
                }}</span>
              </div>
            </div>
          </div>

          <div v-else class="no-drawdowns">
            <i class="fa-regular fa-file-lines"></i>
            <p>No drawdowns recorded yet.</p>
          </div>
        </div>
      </div>
    </v-navigation-drawer>

    <!-- ─── Drawdown Detail Drawer ─── -->
    <v-navigation-drawer
      v-model="drawdownDrawerOpen"
      location="right"
      :width="420"
      temporary
      class="facility-drawer"
    >
      <div v-if="selectedDrawdown && selectedDrawdownFacility" class="drawer-inner">
        <div class="drawer-header">
          <div class="drawer-title-group">
            <div class="drawer-avatar drawer-avatar--amber">
              <i class="fa-solid fa-arrow-down-to-line"></i>
            </div>
            <div>
              <h2 class="drawer-title">Drawdown Detail</h2>
              <p class="drawer-subtitle">{{ selectedDrawdownFacility.bank_name }}</p>
            </div>
          </div>
          <button class="modal-close" @click="drawdownDrawerOpen = false">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="drawer-summary-grid" style="grid-template-columns: 1fr 1fr">
          <div class="dsummary-card dsummary-card--green">
            <div class="dsummary-label">Amount Drawn</div>
            <div class="dsummary-value">{{ formatCurrency(selectedDrawdown.amount) }}</div>
          </div>
          <div class="dsummary-card dsummary-card--amber">
            <div class="dsummary-label">Interest Accrued</div>
            <div class="dsummary-value">{{ formatCurrency(selectedDrawdown.interest) }}</div>
          </div>
        </div>

        <div class="drawer-section">
          <div class="drawer-section-title">
            <i class="fa-solid fa-circle-info"></i> Drawdown Info
          </div>
          <div class="detail-grid">
            <div class="detail-row">
              <span class="detail-label">Drawdown Date</span>
              <span class="detail-value">{{ formatDate(selectedDrawdown.date) }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Days Outstanding</span>
              <span class="detail-value"
                ><span class="days-pill">{{ selectedDrawdown.days_outstanding }} days</span></span
              >
            </div>
            <div class="detail-row">
              <span class="detail-label">Recorded At</span>
              <span class="detail-value">{{ formatDate(selectedDrawdown.created_at) }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Rate Applied</span>
              <span class="detail-value rate-value"
                >{{ selectedDrawdownFacility.borrowing_rate }}%
                <span class="rate-unit">({{ selectedDrawdownFacility.rate_unit }})</span></span
              >
            </div>
          </div>
        </div>

        <div class="drawer-section">
          <div class="drawer-section-title">
            <i class="fa-solid fa-building-columns"></i> Facility Context
          </div>
          <div class="detail-grid">
            <div class="detail-row">
              <span class="detail-label">Total Approved OD</span>
              <span class="detail-value">{{
                formatCurrency(selectedDrawdownFacility.approved_amount)
              }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Total Received</span>
              <span class="detail-value">{{
                formatCurrency(selectedDrawdownFacility.total_received)
              }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Disbursed To Customers</span>
              <span class="detail-value">
                {{ formatCurrency(selectedDrawdownFacility.total_disbursed_to_customers) }}
              </span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Available Drawdown Balance</span>
              <span
                class="detail-value"
                :class="
                  selectedDrawdownFacility.available_drawdown_balance < 0
                    ? 'neg-amount'
                    : 'pos-amount'
                "
              >
                {{ formatCurrency(selectedDrawdownFacility.available_drawdown_balance) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </v-navigation-drawer>
  </MainLayout>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import MainLayout from '@/layouts/full/MainLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/services/supabase.js'

const authStore = useAuthStore()
const merchantId = authStore.merchant.id

const loading = ref(false)
const odSummary = ref([])

const expandedRows = ref(new Set())
const drawerOpen = ref(false)
const selectedItem = ref(null)
const drawdownDrawerOpen = ref(false)
const selectedDrawdown = ref(null)
const selectedDrawdownFacility = ref(null)

const formatCurrency = (value) => {
  if (value == null || value === '') return '₦0.00'
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

const toggleRow = (id) => {
  if (expandedRows.value.has(id)) {
    expandedRows.value.delete(id)
  } else {
    expandedRows.value.add(id)
  }
  expandedRows.value = new Set(expandedRows.value)
}

const isExpanded = (id) => expandedRows.value.has(id)

const openDrawer = (item) => {
  selectedItem.value = item
  drawerOpen.value = true
}

const openDrawdownDrawer = (facility, drawdown) => {
  selectedDrawdownFacility.value = facility
  selectedDrawdown.value = drawdown
  drawdownDrawerOpen.value = true
}

const totalApproved = computed(() =>
  odSummary.value.reduce((s, i) => s + (i.approved_amount || 0), 0)
)
const totalReceived = computed(() =>
  odSummary.value.reduce((s, i) => s + (i.total_received || 0), 0)
)
const totalCost = computed(() => odSummary.value.reduce((s, i) => s + (i.total_cost || 0), 0))
const totalDisbursedToCustomers = computed(() =>
  odSummary.value.reduce((s, i) => s + (i.total_disbursed_to_customers || 0), 0)
)

const totalAvailableDrawdownBalance = computed(() =>
  odSummary.value.reduce((s, i) => s + (i.available_drawdown_balance || 0), 0)
)

const fetchODSummary = async () => {
  loading.value = true
  try {
    const { data, error } = await supabase.rpc('get_facility_od_summary_v3', {
      p_merchant_id: merchantId
    })
    if (error) throw error
    odSummary.value = data || []
  } catch (err) {
    console.error('OD summary error:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchODSummary()
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

.facilities-page {
  padding: 24px;
  min-height: 100vh;
  background: #f5f7f9;
}

/* ── Header ── */
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
  font-size: 15px;
  font-weight: 200;
  color: #1a2332;
}
.stat-label {
  font-size: 12px;
  color: #7a8899;
  margin-top: 2px;
}

/* ── Table ── */
.table-container {
  background: #fff;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  overflow-x: auto;
}
.facilities-table {
  width: 100%;
  border-collapse: collapse;
}
.facilities-table thead tr {
  background: #f8fafb;
  border-bottom: 1px solid #e8edf2;
}
.facilities-table thead th {
  padding: 12px 14px;
  text-align: left;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #7a8899;
  white-space: nowrap;
}
.th-expand {
  width: 52px;
}
.facility-row {
  border-bottom: 1px solid #f0f4f7;
  transition: background 0.15s;
}
.facility-row:hover {
  background: #fafcfd;
}
.facility-row.is-expanded {
  background: #f8feff;
  border-bottom: none;
}
.facility-row td {
  padding: 13px 14px;
  font-size: 13px;
  color: #2d3a4a;
  vertical-align: middle;
  white-space: nowrap;
}

/* Expand btn */
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
  transition: all 0.2s;
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
  transition: transform 0.25s;
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
.amount-cell {
  font-weight: 300;
  color: #1a2332;
}
.rate-value {
  font-weight: 600;
  color: #3b82f6;
}
.rate-unit {
  font-size: 11px;
  color: #7a8899;
  font-weight: 400;
}
.total-cost-value {
  font-weight: 600;
  color: #1a9e85;
}
.neg-amount {
  color: #ef4444;
  font-weight: 500;
}
.pos-amount {
  color: #16a34a;
  font-weight: 500;
}
.interest-val {
  color: #f59e0b;
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
  transition: all 0.15s;
  background: #f8fafb;
}
.action-btn--view {
  color: #27bfa0;
}
.action-btn--view:hover {
  background: #f0fdfa;
  border-color: #27bfa0;
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
  color: #9ca3af;
  font-size: 12px;
}
.drawdown-amount {
  font-weight: 200;
  color: #1a2332;
}
.days-pill {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  background: #eff6ff;
  color: #3b82f6;
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
}

/* ── Drawer ── */
.facility-drawer :deep(.v-navigation-drawer__content) {
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
  padding: 20px 20px 16px;
  border-bottom: 1px solid #f0f4f7;
  background: #fafcfd;
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 1;
}
.drawer-title-group {
  display: flex;
  align-items: center;
  gap: 12px;
}
.drawer-avatar {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, #27bfa0, #1a9e85);
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.drawer-avatar--amber {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}
.drawer-title {
  font-size: 17px;
  font-weight: 700;
  color: #1a2332;
  margin: 0;
}
.drawer-subtitle {
  font-size: 12px;
  color: #7a8899;
  margin: 2px 0 0;
}
.drawer-type-pill {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  text-transform: capitalize;
  background: #f0f4f7;
  color: #5a6a7e;
  margin-top: 4px;
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
  transition: all 0.15s;
  flex-shrink: 0;
}
.modal-close:hover {
  border-color: #ef4444;
  color: #ef4444;
  background: #fef2f2;
}

/* Drawer summary grid */
.drawer-summary-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding: 16px 20px;
  background: #fff;
  border-bottom: 1px solid #f0f4f7;
}
.dsummary-card {
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid transparent;
}
.dsummary-card--blue {
  background: #eff6ff;
  border-color: #bfdbfe;
}
.dsummary-card--green {
  background: #f0fdf4;
  border-color: #bbf7d0;
}
.dsummary-card--teal {
  background: #f0fdfa;
  border-color: #99f6e4;
}
.dsummary-card--amber {
  background: #fffbeb;
  border-color: #fde68a;
}
.dsummary-card--red {
  background: #fef2f2;
  border-color: #fecaca;
}
.dsummary-label {
  font-size: 11px;
  font-weight: 600;
  color: #7a8899;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 4px;
}
.dsummary-value {
  font-size: 15px;
  font-weight: 300;
  color: #1a2332;
}

/* Drawer sections */
.drawer-section {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f4f7;
}
.drawer-section:last-child {
  border-bottom: none;
}
.drawer-section-title {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #27bfa0;
  margin-bottom: 12px;
}
.drawdown-count-badge {
  margin-left: auto;
  background: #27bfa0;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  padding: 1px 7px;
  border-radius: 20px;
}

/* Detail grid */
.detail-grid {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.detail-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 9px 0;
  border-bottom: 1px solid #f5f7f9;
  font-size: 13px;
}
.detail-row:last-child {
  border-bottom: none;
}
.detail-label {
  color: #7a8899;
}
.detail-value {
  color: #1a2332;
  font-weight: 500;
  text-align: right;
}

/* Status badges */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
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

/* Cost breakdown */
.cost-breakdown {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.cost-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f5f7f9;
  font-size: 13px;
}
.cost-row:last-child {
  border-bottom: none;
}
.cost-row--total {
  border-top: 2px solid #27bfa0;
  margin-top: 4px;
  padding-top: 10px;
  border-bottom: none;
}
.cost-label {
  color: #5a6a7e;
}
.cost-val {
  font-weight: 500;
  color: #1a2332;

  font-size: 13px;
}
.total-val {
  color: #1a9e85;
  font-weight: 700;
  font-size: 14px;
}

/* Drawer drawdown cards */
.drawer-drawdowns {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.drawer-drawdown-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #f8fafb;
  border-radius: 10px;
  padding: 12px 14px;
  border: 1.5px solid #e8edf2;
  cursor: pointer;
  transition: all 0.15s;
}
.drawer-drawdown-card:hover {
  background: #f0fdfa;
  border-color: #27bfa0;
}
.ddc-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}
.ddc-index {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: #e8f7f4;
  color: #27bfa0;
  font-size: 11px;
  font-weight: 700;

  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.ddc-amount {
  font-size: 14px;
  font-weight: 500;
  color: #1a2332;
}
.ddc-date {
  font-size: 11.5px;
  color: #9ca3af;
  margin-top: 2px;
}
.ddc-right {
  text-align: right;
}
.ddc-interest-label {
  font-size: 10px;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.ddc-interest {
  font-size: 13px;
  font-weight: 600;
  color: #f59e0b;
}
.ddc-days {
  font-size: 11px;
  color: #9ca3af;
  margin-top: 2px;
}
.ddc-arrow {
  color: #d1d5db;
  font-size: 11px;
  margin-left: 4px;
}

.drawer-drawdown-totals {
  display: flex;
  justify-content: space-between;
  background: #f0fdfa;
  border-radius: 10px;
  padding: 12px 14px;
  margin-top: 4px;
  border: 1px solid #99f6e4;
}
.dtotal-label {
  display: block;
  font-size: 11px;
  color: #7a8899;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 3px;
}
.dtotal-val {
  font-size: 14px;
  font-weight: 700;
  color: #1a9e85;
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
.stat-icon--purple {
  background: #f3e8ff;
  color: #9333ea;
}

.stat-icon--indigo {
  background: #eef2ff;
  color: #4f46e5;
}

.dsummary-card--purple {
  background: #f3e8ff;
  border-color: #d8b4fe;
}

.dsummary-card--indigo {
  background: #eef2ff;
  border-color: #c7d2fe;
}
</style>
