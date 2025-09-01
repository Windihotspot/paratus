<template>
    <MainLayout>
        <div class="p-4 md:p-8">
            <!-- Back Button -->
            <button
                @click="goBack"
                class="flex items-center text-blue-600 font-semibold"
            >
                <i class="fas fa-arrow-left mr-2"></i> Back
            </button>

            <!-- Document Header -->
            <div class="bg-white shadow-lg rounded-lg p-6 mt-4">
                <h1 class="text-2xl font-bold text-blue-700">Sandra.pdf</h1>

                <div
                    class="grid grid-cols-1 md:grid-cols-3 gap-6 text-gray-700 mt-4"
                >
                    <p>
                        <i class="fas fa-calendar mr-2"></i>
                        <strong>Statement Period:</strong> <br />
                        11 Dec 2024 - 9 Jan 2025
                    </p>
                    <!-- <p>
                        <i class="fas fa-file-alt mr-2"></i>
                        <strong>PDF Created Date:</strong> March 12, 2025
                    </p> -->
                    <!-- <p>
                        <i class="fas fa-user mr-2"></i>
                        <strong>Uploaded By:</strong> Femi Afelogun
                    </p> -->
                    <p>
                        <i class="fas fa-user-circle mr-2"></i>
                        <strong>Customer Name:</strong> <br />
                        SANDRA EDE OYIBE
                    </p>

                    <!-- Download Report Button -->
                    <div class="text-right mt-4">
                        <v-btn
                            no-uppercase
                            size="large"
                            class="normal-case p-4 bg-blue-600 hover:bg-blue-700 text-white text-none mr-2 custom-btn"
                        >
                            <i class="fas fa-download mr-2"></i>
                            Download Analysis
                        </v-btn>
                    </div>
                </div>

                <!-- Summary Cards -->
                <!-- <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div class="bg-blue-100 p-4 rounded-lg text-center">
                        <p class="text-sm text-gray-500">Created</p>
                        <p class="text-lg font-semibold">25 March 2025</p>
                    </div>
                    <div class="bg-blue-100 p-4 rounded-lg text-center">
                        <p class="text-sm text-gray-500">
                            Transacting Month(s)
                        </p>
                        <p class="text-lg font-semibold">1</p>
                    </div>
                    <div
                        class="bg-blue-600 text-white p-4 rounded-lg text-center"
                    >
                        <p class="text-sm">Status</p>
                        <p class="text-lg font-semibold">Processed</p>
                    </div>
                </div> -->
            </div>

            <!-- Vuetify Tabs -->
            <div class="mt-6">
                <v-tabs
                    align-tabs="center"
                    class="mb-4"
                    v-model="activeTab"
                    color="primary"
                >
                    <v-tab value="summary">Summary</v-tab>
                    <v-tab value="cash flow">Cash Flow</v-tab>
                    <v-tab value="behavioral">Behavioral</v-tab>
                    <v-tab value="transactions">Transactions</v-tab>
                </v-tabs>

                <v-window v-model="activeTab">
                    <!-- summary Section -->
                    <v-window-item value="summary">
                        <div class="bg-white shadow-lg rounded-lg p-1 mt-4">
                            <button
                                class="flex items-center text-blue-600 font-semibold"
                            >
                                <i class="fas fa-wallet mr-2"></i> Spend
                            </button>

                            <div
                                class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4"
                            >
                                <div class="bg-blue-100 p-4 rounded-lg">
                                    <p class="text-md text-gray-500">
                                        Most Frequent Spend Category
                                    </p>
                                    <p class="text-xs font-semibold mt-4">
                                        Airtime And Data Transactions
                                    </p>
                                </div>
                                <div class="bg-blue-100 p-4 rounded-lg">
                                    <p class="text-md text-gray-500">
                                        Most Frequent Expense
                                    </p>
                                    <p class="text-xs font-semibold mt-4">
                                        05 01 Top Airtime 71013712412
                                    </p>
                                </div>
                                <div class="bg-blue-100 p-4 rounded-lg">
                                    <p class="text-md text-gray-500">
                                        Most Frequent Expense Amount
                                    </p>
                                    <p class="text-xs font-semibold mt-4">
                                        ₦500.00
                                    </p>
                                </div>
                            </div>
                        </div>
                    </v-window-item>

                    <!-- cash flow Section -->
                    <v-window-item value="cash flow">
                        <div class="">
                            <!-- Summary Section -->
                            <div
                                class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4"
                            >
                                <!-- Inflow Summary -->
                                <div
                                    class="bg-white border shadow-lg rounded-lg p-6"
                                >
                                    <h2 class="text-blue-800 font-bold text-xl">
                                        Inflow Summary
                                    </h2>
                                    <p class="mt-2">
                                        <strong>Total Inflow:</strong>
                                        <span
                                            class="text-green-600 font-semibold mt-2"
                                            >₦71,521,577.41</span
                                        >
                                    </p>
                                    <p class="mt-2">
                                        <strong>Average Monthly Inflow:</strong>
                                        ₦71,521,577.41
                                    </p>
                                    <p class="mt-2">
                                        <strong>Average Weekly Inflow:</strong>
                                        ₦71,521,577.41
                                    </p>
                                </div>

                                <!-- Outflow Summary -->
                                <div
                                    class="bg-white border shadow-lg rounded-lg p-6"
                                >
                                    <h2 class="text-blue-800 font-bold text-xl">
                                        Outflow Summary
                                    </h2>
                                    <p class="mt-2">
                                        <strong>Total Outflow:</strong>
                                        <span class="text-red-600 font-semibold"
                                            >₦71,521,577.41</span
                                        >
                                    </p>
                                    <p class="mt-2">
                                        <strong
                                            >Average Monthly Outflow:</strong
                                        >
                                        ₦71,521,577.41
                                    </p>
                                    <p class="mt-2">
                                        <strong>Average Weekly Outflow:</strong>
                                        ₦71,521,577.41
                                    </p>
                                </div>
                            </div>

                            <!-- Balance & Cash Flow -->
                            <div
                                class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6"
                            >
                                <div
                                    class="bg-white border shadow-lg rounded-lg p-6 text-center"
                                >
                                    <p class="text-lg font-semibold">
                                        ₦71,521,577.41
                                    </p>
                                    <p class="text-gray-600">
                                        Average Monthly Balance
                                    </p>
                                </div>
                                <div
                                    class="bg-white shadow-lg border rounded-lg p-6 text-center"
                                >
                                    <p class="text-lg font-semibold">
                                        ₦71,521,577.41
                                    </p>
                                    <p class="text-gray-600">
                                        Average Weekly Balance
                                    </p>
                                </div>
                                <div
                                    class="bg-white shadow-lg border rounded-lg p-6 text-center"
                                >
                                    <p class="font-semibold text-gray-800">
                                        Negative Cash Flow
                                    </p>
                                    <p class="text-gray-600">
                                        Inflow to Outflow Rate
                                    </p>
                                </div>
                            </div>

                            <!-- Monthly & Weekly Credit & Debit -->
                            <div
                                class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6"
                            >
                                <!-- Monthly -->
                                <div
                                    class="bg-white shadow-lg border rounded-lg p-6"
                                >
                                    <h3 class="text-lg font-bold text-gray-800">
                                        Monthly Credit & Debit
                                    </h3>
                                    <div class="overflow-x-auto mt-4">
                                        <table class="w-full border-collapse">
                                            <thead>
                                                <tr
                                                    class="bg-gray-200 text-gray-700"
                                                >
                                                    <th class="p-2 text-left">
                                                        Month
                                                    </th>
                                                    <th class="p-2 text-left">
                                                        Total Credit
                                                    </th>
                                                    <th class="p-2 text-left">
                                                        Total Debit
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr class="border-b">
                                                    <td class="p-2">
                                                        Jan 2023
                                                    </td>
                                                    <td class="p-2">
                                                        ₦10,882,931.76
                                                    </td>
                                                    <td class="p-2">
                                                        ₦10,882,931.76
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <!-- Weekly -->
                                <div
                                    class="bg-white shadow-lg border rounded-lg p-6"
                                >
                                    <h3 class="text-lg font-bold text-gray-800">
                                        Weekly Credit & Debit
                                    </h3>
                                    <div class="overflow-x-auto mt-4">
                                        <table class="w-full border-collapse">
                                            <thead>
                                                <tr
                                                    class="bg-gray-200 text-gray-700"
                                                >
                                                    <th class="p-2 text-left">
                                                        Month
                                                    </th>
                                                    <th class="p-2 text-left">
                                                        Total Credit
                                                    </th>
                                                    <th class="p-2 text-left">
                                                        Total Debit
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr class="border-b">
                                                    <td class="p-2">
                                                        Jan 2023 Wk 1
                                                    </td>
                                                    <td class="p-2">
                                                        ₦10,882,931.76
                                                    </td>
                                                    <td class="p-2">
                                                        ₦10,882,931.76
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </v-window-item>

                    <!-- behavioral Section -->
                    <v-window-item value="behavioral">
                        <div
                            class="bg-white shadow-lg border rounded-lg p-6 mt-4"
                        >
                            <p class="text-lg font-semibold">
                                Score Card Data Goes Here...
                            </p>
                        </div>
                    </v-window-item>

                    <!-- Transactions Section -->
                    <v-window-item value="transactions">
                        <div
                            class="bg-white shadow-lg border rounded-lg p-6 mt-4"
                        >
                            <p class="text-lg font-semibold">
                                Transactions History...
                            </p>
                        </div>
                    </v-window-item>
                </v-window>
            </div>
        </div>
    </MainLayout>
</template>

<script setup>
import { ref } from "vue";
import MainLayout from '@/layouts/full/MainLayout.vue'
const activeTab = ref("Summary");


</script>

<style scoped>
.v-tab {
    text-transform: none !important;
}
.custom-btn {
    background-color: #0056d2;
}
</style>
