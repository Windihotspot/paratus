<template>
  <MainLayout>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 p-4">
      <!-- Overdraft Amount -->
      <div
        class="flex items-center p-5 bg-white shadow rounded-lg hover:scale-105 transition-transform duration-300"
      >
        <div class="p-3  text-blue-600">
          <i class="fas fa-building-columns text-lg"></i>
        </div>
        <div class="ml-4">
          <p class="text-gray-500 text-sm">Overdraft Amount</p>
          <p class="text-lg font-medium">₦500,000</p>
        </div>
      </div>

      <!-- Disbursed Amount -->
      <div
        class="flex items-center p-5 bg-white shadow rounded-lg hover:scale-105 transition-transform duration-300"
      >
        <div class="p-3 text-green-600">
          <i class="fas fa-money-bill-wave text-lg"></i>
        </div>
        <div class="ml-4">
          <p class="text-gray-500 text-sm">Disbursed Amount</p>
          <p class="text-lg font-medium">₦350,000</p>
        </div>
      </div>

      <!-- Balance -->
      <div
        class="flex items-center p-5 bg-white shadow rounded-lg hover:scale-105 transition-transform duration-300"
      >
        <div class="p-3  text-purple-600 ">
          <i class="fas fa-wallet text-lg"></i>
        </div>
        <div class="ml-4">
          <p class="text-gray-500 text-sm">Balance</p>
          <p class="text-lg font-medium">₦150,000</p>
        </div>
      </div>
    </div>
  </MainLayout>
</template>


<script setup>
  import MainLayout from '@/layouts/full/MainLayout.vue';
</script>

