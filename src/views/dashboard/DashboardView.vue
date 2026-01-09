<template>
  <MainLayout>
    <div class="p-4">
      <!-- Loading State -->
      <div v-if="loading" class="flex flex-col items-center justify-center min-h-[200px]">
        <v-progress-circular indeterminate color="#27bfa0" size="40" width="4" />
        <span class="mt-2 text-gray-600 text-sm">Loading Dashboard</span>
      </div>

      <!-- KPIs Grid -->
      <div v-else>
        <!-- Bank facility stats -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Received from Bank -->
          <div
            class="flex items-center p-5 bg-white shadow rounded-lg hover:scale-105 transition-transform duration-300"
          >
            <div class="p-3 text-blue-600">
              <i class="fas fa-building-columns text-lg"></i>
            </div>
            <div class="ml-4">
              <p class="text-gray-500 text-sm">Received from Bank</p>
              <p class="text-lg font-medium">{{ kpis.total_facilities_from_banks }}</p>
            </div>
          </div>

          <!-- Disbursed to Customers -->
          <div
            class="flex items-center p-5 bg-white shadow rounded-lg hover:scale-105 transition-transform duration-300"
          >
            <div class="p-3 text-green-600">
              <i class="fas fa-money-bill-wave text-lg"></i>
            </div>
            <div class="ml-4">
              <p class="text-gray-500 text-sm">Disbursed to Customers</p>
              <p class="text-lg font-medium">{{ kpis.total_disbursed_loans }}</p>
            </div>
          </div>

          <!-- Balance -->
          <div
            class="flex items-center p-5 bg-white shadow rounded-lg hover:scale-105 transition-transform duration-300"
          >
            <div class="p-3 text-purple-600">
              <i class="fas fa-wallet text-lg"></i>
            </div>
            <div class="ml-4">
              <p class="text-gray-500 text-sm">Balance</p>
              <p class="text-lg font-medium">{{ kpis.outstanding_facility_balance }}</p>
            </div>
          </div>
        </div>
        <!-- Loan to customers stats -->
        <div v-if="merchantFacilitychartData" class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <!-- Loan Disbursement Trend -->
          <div class="rounded bg-white p-2">
            <apexchart
              type="area"
              height="300"
              :options="{
                chart: { id: 'loan-disbursement', toolbar: { show: false } },
                xaxis: {
                  categories: formatMonths(
                    merchantFacilitychartData.loan_disbursement_trend,
                    'month'
                  )
                },
                yaxis: {
                  labels: {
                    formatter: (val) =>
                      new Intl.NumberFormat('en-NG', {
                        style: 'currency',
                        currency: 'NGN',
                        maximumFractionDigits: 0
                      }).format(val)
                  }
                },
                colors: ['#3B82F6'],
                dataLabels: { enabled: false },
                stroke: { curve: 'smooth', width: 3 },
                title: { text: 'Loan Disbursement Trend', style: { fontSize: '12px' } },
                tooltip: {
                  x: { format: 'MMM yyyy' },
                  y: {
                    formatter: (val) =>
                      new Intl.NumberFormat('en-NG', {
                        style: 'currency',
                        currency: 'NGN',
                        maximumFractionDigits: 0
                      }).format(val)
                  }
                },
                noData: {
                  text: 'No data available',
                  align: 'center',
                  verticalAlign: 'middle',
                  style: { color: '#9CA3AF', fontSize: '14px' }
                }
              }"
              :series="[
                {
                  name: 'Total Disbursed',
                  data:
                    merchantFacilitychartData.loan_disbursement_trend?.map(
                      (d) => d.total_disbursed
                    ) || []
                }
              ]"
            />
          </div>

          <!-- Loan Status Distribution -->
          <div class="rounded bg-white p-2">
            <apexchart
              type="donut"
              height="300"
              :options="{
                labels: loanExpiryStats.labels,
                colors: ['#10B981', '#F59E0B', '#EF4444'],
                legend: { position: 'bottom' },
                title: { text: 'Loan Expiry Status', style: { fontSize: '12px' } },
                noData: {
                  text: 'No data available',
                  align: 'center',
                  verticalAlign: 'middle',
                  style: { color: '#9CA3AF', fontSize: '14px' }
                },
                dataLabels: {
                  enabled: true,
                  formatter: (val, opts) => {
                    const value = opts.w.config.series[opts.seriesIndex]
                    return value
                  }
                }
              }"
              :series="loanExpiryStats.series"
            />
          </div>

          <!-- Repayments vs Disbursements -->
          <div class="rounded bg-white p-2">
            <apexchart
              type="bar"
              height="300"
              :options="{
                chart: { toolbar: { show: false } },
                xaxis: {
                  categories: formatMonths(
                    merchantFacilitychartData.repayments_vs_disbursements,
                    'month'
                  )
                },
                yaxis: {
                  labels: {
                    formatter: (val) =>
                      new Intl.NumberFormat('en-NG', {
                        style: 'currency',
                        currency: 'NGN',
                        maximumFractionDigits: 0
                      }).format(val)
                  }
                },
                colors: ['#2563EB', '#16A34A'],
                plotOptions: { bar: { horizontal: false, columnWidth: '50%', borderRadius: 4 } },
                dataLabels: { enabled: false },
                stroke: { show: true, width: 2, colors: ['transparent'] },
                legend: { position: 'top' },
                title: { text: 'Disbursements', style: { fontSize: '12px' } },
                tooltip: {
                  y: {
                    formatter: (val) =>
                      new Intl.NumberFormat('en-NG', {
                        style: 'currency',
                        currency: 'NGN',
                        maximumFractionDigits: 0
                      }).format(val)
                  }
                },
                noData: {
                  text: 'No data available',
                  align: 'center',
                  verticalAlign: 'middle',
                  style: { color: '#9CA3AF', fontSize: '14px' }
                }
              }"
              :series="[
                {
                  name: 'Disbursed',
                  data:
                    merchantFacilitychartData.repayments_vs_disbursements?.map(
                      (d) => d.disbursed
                    ) || []
                }
                // {
                //   name: 'Repaid',
                //   data:
                //     merchantFacilitychartData.repayments_vs_disbursements?.map((d) => d.repaid) ||
                //     []
                // }
              ]"
            />
          </div>

          <!-- Customer Growth Trend -->
          <div class="rounded bg-white p-2">
            <apexchart
              type="line"
              height="300"
              :options="{
                chart: { id: 'customer-growth', toolbar: { show: false } },
                xaxis: {
                  categories: formatMonths(merchantFacilitychartData.customer_growth_trend, 'month')
                },
                colors: ['#F97316'],
                dataLabels: { enabled: false },
                stroke: { curve: 'smooth', width: 3 },
                markers: { size: 4 },
                title: { text: 'Customer Growth Trend', style: { fontSize: '12px' } },
                tooltip: { x: { format: 'MMM yyyy' } },
                noData: {
                  text: 'No data available',
                  align: 'center',
                  verticalAlign: 'middle',
                  style: { color: '#9CA3AF', fontSize: '14px' }
                }
              }"
              :series="[
                {
                  name: 'New Customers',
                  data:
                    merchantFacilitychartData.customer_growth_trend?.map((d) => d.new_customers) ||
                    []
                }
              ]"
            />
          </div>

          <!-- Customer Status Distribution -->
          <div class="rounded bg-white p-2">
            <apexchart
              type="pie"
              height="300"
              :options="{
                labels:
                  merchantFacilitychartData.customer_status_distribution?.map((d) => d.status) ||
                  [],
                colors: ['#0EA5E9', '#F43F5E', '#22C55E', '#EAB308', '#9333EA'],
                legend: { position: 'bottom' },
                title: { text: 'Customer Status Distribution', style: { fontSize: '12px' } },
                noData: {
                  text: 'No data available',
                  align: 'center',
                  verticalAlign: 'middle',
                  style: { color: '#9CA3AF', fontSize: '14px' }
                }
              }"
              :series="
                merchantFacilitychartData.customer_status_distribution?.map((d) => d.count) || []
              "
            />
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import MainLayout from '@/layouts/full/MainLayout.vue'
import { supabase } from '@/services/supabase.js'
import { useAuthStore } from '@/stores/auth'
import moment from 'moment'

const authStore = useAuthStore()
const loading = ref(false)

const kpis = ref({
  total_disbursed_loans: '₦0.00',
  outstanding_customer_balance: '₦0.00',
  total_customer_repayments: '₦0.00',
  total_settlements_received: '₦0.00',
  customer_default_rate_percent: '0%',
  total_facilities_from_banks: '₦0.00',
  outstanding_facility_balance: '₦0.00',
  overdraft_utilization_percent: '0%'
})

const merchantFacilitychartData = ref({
  loan_disbursement_trend: [],
  loan_status_distribution: [],
  repayments_vs_disbursements: [],
  customer_growth_trend: [],
  customer_status_distribution: []
})

const formatCurrency = (value) => {
  const num = Number(value) || 0
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(num)
}

const formatMonths = (arr, key) => {
  if (!Array.isArray(arr) || arr.length === 0) return []
  return arr.map((d) => moment(d[key]).format('MMM YYYY'))
}

const fetchFinancialKPIs = async (merchantId, facilityId) => {
  const { data, error } = await supabase.rpc('get_facility_kpis', {
    p_merchant_id: merchantId,
    p_facility_id: facilityId
  })
  console.log('financial kpi data:', data)
  if (error) throw error
  if (!data || data.length === 0) return kpis.value

  const row = data[0]
  return {
    total_disbursed_loans: formatCurrency(row.net_disbursed_to_customers || 0),
    total_facilities_from_banks: formatCurrency(row.received_from_bank || 0),
    outstanding_facility_balance: formatCurrency(row.balance || 0),
    total_customer_repayments: formatCurrency(row.total_repayments || 0),
    customer_default_rate_percent:
      row.customer_default_rate !== null ? `${(row.customer_default_rate * 100).toFixed(2)}%` : '0%'
  }
}

const fetchMerchantFacilityStats = async (merchantId, facilityId) => {
  const { data, error } = await supabase.rpc('dashboard_loans_customers', {
    p_merchant_id: merchantId,
    p_facility_id: facilityId
  })
  console.log('dashboard loan customers:', data)
  if (error) throw error
  return {
    loan_disbursement_trend: data?.loan_disbursement_trend || [],
    loan_status_distribution: data?.loan_status_distribution || [],
    repayments_vs_disbursements: data?.repayments_vs_disbursements || [],
    customer_growth_trend: data?.customer_growth_trend || [],
    customer_status_distribution: data?.customer_status_distribution || [],
    loan_expiry_stats: data?.loan_expiry_stats || {}
  }
}

const loanExpiryStats = computed(() => {
  const stats = merchantFacilitychartData.value.loan_expiry_stats || {}

  return {
    labels: ['Active Loans', 'Active (≤ 5 days to expiry)', 'Closed Loans'],
    series: [
      stats.active_loans || 0,
      stats.active_loans_less_than_5_days || 0,
      stats.closed_loans || 0
    ]
  }
})

const loadAllData = async () => {
  if (!authStore.merchant?.id || !authStore.selectedFacility?.id) {
    console.warn('Merchant or facility not ready yet')
    return
  }

  loading.value = true
  try {
    const merchantId = authStore.merchant.id
    const facilityId = authStore.selectedFacility.id

    // fetch both in parallel
    const [kpiRes, statsRes] = await Promise.all([
      fetchFinancialKPIs(merchantId, facilityId),
      fetchMerchantFacilityStats(merchantId, facilityId)
    ])

    // update after both succeed
    kpis.value = kpiRes
    merchantFacilitychartData.value = statsRes
  } catch (err) {
    console.error('❌ Failed to load dashboard data:', err)
    // reset to empty to avoid partial data showing
    kpis.value = {
      total_disbursed_loans: '₦0.00',
      outstanding_customer_balance: '₦0.00',
      total_customer_repayments: '₦0.00',
      total_settlements_received: '₦0.00',
      customer_default_rate_percent: '0%',
      total_facilities_from_banks: '₦0.00',
      outstanding_facility_balance: '₦0.00',
      overdraft_utilization_percent: '0%'
    }
    merchantFacilitychartData.value = {
      loan_disbursement_trend: [],
      loan_status_distribution: [],
      repayments_vs_disbursements: [],
      customer_growth_trend: [],
      customer_status_distribution: []
    }
  } finally {
    loading.value = false
  }
}

const selectedFacility = computed(() => authStore.selectedFacility)

watch(
  () => selectedFacility.value?.id,
  async (newVal, oldVal) => {
    if (newVal && newVal !== oldVal) {
      await loadAllData()
    }
  }
)

onMounted(async () => {
  await loadAllData()
})
</script>
