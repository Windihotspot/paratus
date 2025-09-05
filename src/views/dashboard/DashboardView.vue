<template>
 <MainLayout>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6 p-4">
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
</MainLayout>

</template>


<script setup>
import { ref, onMounted } from 'vue'
import MainLayout from '@/layouts/full/MainLayout.vue';
import { supabase } from '@/services/supabase.js'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

// KPI reactive variables
const kpis = ref({
  total_disbursed_loans: 0,
  outstanding_customer_balance: 0,
  total_customer_repayments: 0,
  total_settlements_received: 0,
  customer_default_rate_percent: 0,
  total_facilities_from_banks: 0,
  outstanding_facility_balance: 0,
  overdraft_utilization_percent: 0
})

// Helper to format amounts as Naira currency
const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(value)
}

const fetchFinancialKPIs = async () => {
  if (!authStore.merchant?.id) return

  const merchantId = authStore.merchant.id

  const { data, error } = await supabase.rpc('get_bank_to_merchant_kpis', { p_merchant_id: merchantId })
  console.log("financial kpis:", data)
  if (error) {
    console.log('Error fetching KPIs:', error)
  } else {
    // Format all amount values
    kpis.value = {
      ...data,
      total_disbursed_loans: formatCurrency(data.disbursed_to_customers),
      total_facilities_from_banks: formatCurrency(data.received_from_bank),
      outstanding_facility_balance: formatCurrency(data.balance)
    }
  }
}

onMounted(() => {
  fetchFinancialKPIs()
})
</script>


