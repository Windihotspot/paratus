<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '@/services/supabase.js'
import MainLayout from '@/layouts/full/MainLayout.vue'
import { ElNotification } from 'element-plus'

const loading = ref(false)
const facilities = ref([])
const profits = ref([])

const drawer = ref(false)
const selectedProfit = ref(null)

const formatCurrency = (val) => {
  if (!val) return '₦0.00'
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN'
  }).format(val)
}

/**
 * FETCH ALL FACILITIES
 */
const fetchFacilities = async () => {
  loading.value = true

  const { data, error } = await supabase.from('bank_facilities').select('*')

  if (error) {
    console.error(error)
    loading.value = false
    return
  }

  facilities.value = data || []
  await loadProfits(data || [])

  loading.value = false
}

/**
 * CALL RPC FOR EACH FACILITY
 */
const loadProfits = async (facilitiesList) => {
  const results = []

  for (const f of facilitiesList) {
    const { data, error } = await supabase.rpc('get_facility_profit', {
      p_facility_id: f.id
    })
    console.log('facility profit:', data)
    if (!error && data) {
      results.push({
        ...f,
        ...data
      })
    }
  }

  profits.value = results
}

/**
 * OPEN DRAWER
 */
const openDrawer = (row) => {
  selectedProfit.value = row
  drawer.value = true
}

onMounted(() => {
  fetchFacilities()
})
</script>

<template>
  <MainLayout>
    <div class="p-4">
      <!-- HEADER -->
      <div class="mb-4">
        <h1 class="text-xl font-bold">Revenue & Profit Analysis</h1>
      </div>

      <!-- LOADING STATE -->
      <div v-if="loading" class="flex flex-col items-center justify-center py-20">
        <v-progress-circular indeterminate color="#27bfa0" size="50" />
        <p class="text-gray-500 mt-3 text-sm">Calculating facility profits...</p>
      </div>

      <!-- TABLE -->
      <div v-else class="bg-white shadow rounded-lg overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs">Facility</th>
              <th class="px-4 py-3 text-left text-xs">Amount</th>
              <th class="px-4 py-3 text-left text-xs">Revenue</th>
              <th class="px-4 py-3 text-left text-xs">Bank Cost</th>
              <th class="px-4 py-3 text-left text-xs">Fees</th>
              <th class="px-4 py-3 text-left text-xs">Net Profit</th>
              <th class="px-4 py-3 text-left text-xs">Spread %</th>
              <th class="px-4 py-3 text-center text-xs">Action</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="row in profits" :key="row.facility_id" class="border-t">
              <td class="px-4 py-3 text-sm">
                {{ row.facility_type }}
              </td>

              <td class="px-4 py-3 text-sm">
                {{ formatCurrency(row.drawdown) }}
              </td>

              <td class="px-4 py-3 text-sm text-green-600">
                {{ formatCurrency(row.revenue) }}
              </td>

              <td class="px-4 py-3 text-sm text-red-500">
                {{ formatCurrency(row.bank_cost) }}
              </td>

              <td class="px-4 py-3 text-sm text-orange-500">
                {{ formatCurrency(row.fees) }}
              </td>

              <td class="px-4 py-3 text-sm font-bold">
                {{ formatCurrency(row.net_profit) }}
              </td>

              <td class="px-4 py-3 text-sm">{{ row.net_spread?.toFixed(2) }}%</td>

              <td class="px-4 py-3 text-center">
                <v-btn icon size="small" @click="openDrawer(row)">
                  <i class="fa-solid fa-eye"></i>
                </v-btn>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ===================== -->
    <!-- DRAWER -->
    <!-- ===================== -->
    <v-navigation-drawer v-model="drawer" location="right" width="420">
      <div class="p-4" v-if="selectedProfit">
        <h2 class="text-lg font-bold mb-4">Facility Breakdown</h2>

        <div class="space-y-3 text-sm">
          <div>
            <strong>Revenue:</strong>
            {{ formatCurrency(selectedProfit.revenue) }}
          </div>

          <div>
            <strong>Bank Cost:</strong>
            {{ formatCurrency(selectedProfit.bank_cost) }}
          </div>

          <div>
            <strong>Fees:</strong>
            {{ formatCurrency(selectedProfit.fees) }}
          </div>

          <div>
            <strong>Net Profit:</strong>
            <span class="font-bold">
              {{ formatCurrency(selectedProfit.net_profit) }}
            </span>
          </div>

          <div>
            <strong>Net Spread:</strong>
            {{ selectedProfit.net_spread?.toFixed(2) }}%
          </div>

          <hr />

          <div>
            <strong>Total Allocated:</strong>
            {{ formatCurrency(selectedProfit.total_allocated) }}
          </div>

          <div>
            <strong>Utilization %:</strong>
            {{ selectedProfit.utilization_percent?.toFixed(2) }}%
          </div>
        </div>

        <v-btn class="mt-6" block color="green" @click="drawer = false"> Close </v-btn>
      </div>
    </v-navigation-drawer>
  </MainLayout>
</template>
