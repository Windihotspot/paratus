<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import MainLayout from '@/layouts/full/MainLayout.vue'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/services/supabase.js'

const authStore = useAuthStore()
const merchantId = computed(() => authStore.merchant?.id)
const facility = computed(() => authStore.selectedFacility) // reactive

const loading = ref(false)
const facilityPnl = ref(null)
const loans = ref([])
const customers = ref([])

// pagination state
const loanPage = ref(1)
const loanPageSize = ref(10)

const customerPage = ref(1)
const customerPageSize = ref(10)

// computed slices
const pagedLoans = computed(() => {
  const start = (loanPage.value - 1) * loanPageSize.value
  return loans.value.slice(start, start + loanPageSize.value)
})

const pagedCustomers = computed(() => {
  const start = (customerPage.value - 1) * customerPageSize.value
  return customers.value.slice(start, start + customerPageSize.value)
})

// currency formatter (returns string with ₦)
const currencyFormatter = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})
function formatCurrency(value) {
  if (value === null || value === undefined || value === '') return currencyFormatter.format(0)
  // handle numeric strings as well
  const n = Number(value)
  if (Number.isNaN(n)) return currencyFormatter.format(0)
  return currencyFormatter.format(n)
}

async function fetchData() {
  if (!merchantId.value) {
    ElMessage.error('Merchant not available in store')
    return
  }
  if (!facility.value || !facility.value.id) {
    ElMessage.warning('Please select a facility')
    return
  }

  try {
    loading.value = true

    // Facility PnL (single facility)
    const { data: facData, error: facErr } = await supabase.rpc('facility_pnl', {
      p_merchant_id: merchantId.value,
      p_facility_id: facility.value.id
    })
    console.log("facility pnl:", facData)
    if (facErr) throw facErr
    facilityPnl.value = facData?.[0] ?? null

    // Loan PnL for this facility
    const { data: loanData, error: loanErr } = await supabase.rpc('loan_pnl', {
      p_merchant_id: merchantId.value,
      p_facility_id: facility.value.id
    })
    console.log("loan pnl:", loanData)
    if (loanErr) throw loanErr
    loans.value = loanData ?? []

    // Customer PnL for this facility
    const { data: custData, error: custErr } = await supabase.rpc('customer_pnl', {
      p_merchant_id: merchantId.value,
      p_facility_id: facility.value.id
      
    })
    console.log("customer pnl:", custData)
    if (custErr) throw custErr
    customers.value = custData ?? []
  } catch (err) {
    console.error('❌ Error fetching PnL:', err)
    ElMessage.error('Failed to load facility Profit & Loss')
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)
// refetch whenever the selected facility changes
watch(
  () => facility.value?.id,
  (newVal) => {
    if (newVal) fetchData()
  }
)
</script>

<template>
  <MainLayout>
    <div v-if="loading" class="flex flex-col items-center justify-center min-h-[200px]">
      <v-progress-circular indeterminate color="#27bfa0" size="40" width="4" />
    </div>
    <div v-else class="p-6 space-y-6">
      <!-- Page Header -->
      <h1 class="text-2xl font-bold text-gray-800">
        📊 Facility Profit & Loss
        <span v-if="facility" class="text-sm text-gray-500 ml-2">
          ({{ facility.facility_type || 'facility' }}
          <span v-if="facility.facility_amount"
            >— {{ formatCurrency(facility.facility_amount) }}</span
          >)
        </span>
      </h1>

      <!-- Facility Summary -->
      <div v-if="facilityPnl" class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- <div class="p-4 rounded-2xl shadow bg-white">
          <p class="text-gray-500">Total Income</p>
          <p class="text-xl font-semibold text-green-600">
            {{ formatCurrency(facilityPnl.total_income) }}
          </p>
        </div> -->

        <div class="p-4 rounded-2xl shadow bg-white">
          <p class="text-gray-500">Total Profit</p>
          <p class="text-xl font-semibold text-green-600">
            {{ formatCurrency(facilityPnl.total_cost) }}
          </p>
        </div>

        <!-- <div class="p-4 rounded-2xl shadow bg-white">
          <p class="text-gray-500">Profit / Loss</p>
          <p
            class="text-xl font-bold"
            :class="facilityPnl.pnl >= 0 ? 'text-green-700' : 'text-red-700'"
          >
            {{ formatCurrency(facilityPnl.pnl) }}
          </p>
        </div> -->
      </div>

      <!-- By Loan -->
      <div class="bg-white rounded-2xl shadow p-4">
        <h2 class="text-lg font-semibold mb-4">💰 By Loan</h2>
        <el-table :data="pagedLoans" stripe style="width: 100%">
          <el-table-column prop="loan_id" label="Loan ID" />
          <el-table-column label="Amount">
            <template #default="scope">
              {{ formatCurrency(scope.row.loan_amount) }}
            </template>
          </el-table-column>
          <!-- <el-table-column label="Income">
            <template #default="scope">
              {{ formatCurrency(scope.row.total_income) }}
            </template>
          </el-table-column> -->
          <!-- <el-table-column label="Cost">
            <template #default="scope">
              {{ formatCurrency(scope.row.funding_cost) }}
            </template>
          </el-table-column> -->
          <el-table-column label="Profit">
            <template #default="scope">
              <span :class="scope.row.funding_cost >= 0 ? 'text-green-600' : 'text-red-600'">
                {{ formatCurrency(scope.row.funding_cost) }}
              </span>
            </template>
          </el-table-column>
        </el-table>

        <!-- pagination -->
        <div class="mt-4 flex justify-center">
          <el-pagination
            background
            layout="prev, pager, next"
            :total="loans.length"
            :page-size="loanPageSize"
            v-model:current-page="loanPage"
          />
        </div>
      </div>

      <!-- By Customer -->
      <div class="bg-white rounded-2xl shadow p-4">
        <h2 class="text-lg font-semibold mb-4">👤 By Customer</h2>
        <el-table :data="pagedCustomers" stripe style="width: 100%">
          <el-table-column prop="customer_name" label="Customer" />
          <!-- <el-table-column label="Income">
            <template #default="scope">
              {{ formatCurrency(scope.row.total_income) }}
            </template>
          </el-table-column>
          <el-table-column label="Cost">
            <template #default="scope">
              {{ formatCurrency(scope.row.total_cost) }}
            </template>
          </el-table-column> -->
          <el-table-column label="PnL">
            <template #default="scope">
              <span :class="scope.row.total_cost >= 0 ? 'text-green-600' : 'text-red-600'">
                {{ formatCurrency(scope.row.total_cost) }}
              </span>
            </template>
          </el-table-column>
        </el-table>

        <!-- pagination -->
        <div class="mt-4 flex justify-center">
          <el-pagination
            background
            layout="prev, pager, next"
            :total="customers.length"
            :page-size="customerPageSize"
            v-model:current-page="customerPage"
          />
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<style scoped>
/* optional small helpers */
.text-green-600 {
  color: #16a34a;
}
.text-red-600 {
  color: #dc2626;
}
.text-green-700 {
  color: #15803d;
}
.text-red-700 {
  color: #b91c1c;
}
</style>
