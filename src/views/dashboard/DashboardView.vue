<template>
 <MainLayout>
    <div class="p-4">
      <!-- Loading State -->
      <div v-if="loading" class="flex flex-col items-center justify-center min-h-[200px]">
        <v-progress-circular indeterminate color="#27bfa0" size="40" width="4" />
        <span class="mt-2 text-gray-600 text-sm">Loading Dashboard</span>
      </div>

      <!-- KPIs Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-6">
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
    </div>
  </MainLayout>

</template>


<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import MainLayout from '@/layouts/full/MainLayout.vue'
import { supabase } from '@/services/supabase.js'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const loading = ref(false)

const kpis = ref({
  total_disbursed_loans: "₦0.00",
  outstanding_customer_balance: "₦0.00",
  total_customer_repayments: "₦0.00",
  total_settlements_received: "₦0.00",
  customer_default_rate_percent: "0%",
  total_facilities_from_banks: "₦0.00",
  outstanding_facility_balance: "₦0.00",
  overdraft_utilization_percent: "0%"
})

const formatCurrency = (value) => {
  const num = Number(value) || 0
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(num)
}

const fetchFinancialKPIs = async () => {
  if (!authStore.merchant?.id) {
    console.warn("Merchant not ready yet")
    return
  }

  loading.value = true
  const merchantId = authStore.merchant.id
  const { data, error } = await supabase.rpc("get_facility_kpis", { 
    p_merchant_id: merchantId, 
    p_facility_id: authStore.selectedFacility?.id 
  })

  console.log("📊 Raw RPC result:", data)

  if (error) {
    console.error("Error fetching KPIs:", error)
  } else if (data && data.length > 0) {
    const row = data[0]  // 👈 take the first row

    kpis.value = {
      total_disbursed_loans: formatCurrency(row.disbursed_to_customers || 0),
      total_facilities_from_banks: formatCurrency(row.received_from_bank || 0),
      outstanding_facility_balance: formatCurrency(row.balance || 0),
      total_customer_repayments: formatCurrency(row.total_repayments || 0),
      customer_default_rate_percent: row.customer_default_rate !== null
        ? `${(row.customer_default_rate * 100).toFixed(2)}%`
        : "0%"
    }

    console.log("🎯 Formatted KPIs:", kpis.value)
  }

  loading.value = false
}


const selectedFacility = computed(() => authStore.selectedFacility)

watch(
  () => selectedFacility.value?.id,
  async (newVal, oldVal) => {
    console.log("🔄 Facility changed in store:", oldVal, "➡️", newVal)
    if (newVal && newVal !== oldVal) {
      await fetchFinancialKPIs()
    }
  }
)

onMounted(async () => {
  await fetchFinancialKPIs()
})
</script>



