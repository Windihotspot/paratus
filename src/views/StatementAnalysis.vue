<template>
  <MainLayout>
    <div class="p-2">
      <template v-if="loading">
        <div class="flex items-center justify-center h-96">
          <v-progress-circular
            :size="100"
            :width="10"
            color="primary"
            indeterminate
          ></v-progress-circular>
        </div>
      </template>
      <template v-else>
        <div class="p-2 md:p-8">
          <RouterLink to="/dashboard">
            <button @click="goBack" class="mb-4 flex items-center text-black text-lg font-normal">
              <i class="fas fa-circle-arrow-left mr-2 text-xl" style="color: #2563eb"></i> Back
            </button>
          </RouterLink>
          <!-- title and download -->
          <div class="flex justify-between rounded p-4 bg-white">
            <h2 class="text-md font-semibold mt-2 ml-6">Analysis result</h2>
            <!-- Download Report Button -->
            <div class="text-right">
              <v-btn
                @click="downloadAnalysis"
                no-uppercase
                size="small"
                class="normal-case p-4 bg-blue-600 hover:bg-blue-700 text-white text-none mr-2 custom-btn"
              >
                <i class="fas fa-download mr-2"></i>
                Export PDF
              </v-btn>
            </div>
          </div>

          <!-- Document Header -->

          <div
            class="grid grid-cols-1 md:grid-cols-3 gap-6 text-gray-700 mt-4 mb-6 bg-white rounded p-4"
          >
            <p>
              <i class="fas fa-calendar mr-2"></i>
              <strong>Statement Period:</strong> <br />
              <span class="mt-3">{{ statementPeriod }}</span>
            </p>

            <p>
              <i class="fas fa-user-circle mr-2"></i>
              <strong>Account Name:</strong> <br />
              {{ clientName }}
            </p>

            <p>
              <i class="fas fa-id-card mr-2"></i>
              <strong>Account Number:</strong> <br />
              {{ accountId }}
            </p>
          </div>

          <!-- Vuetify Tabs -->
          <div class="mt-6">
            <v-tabs
              v-model="activeTab"
              align-tabs="start"
              class="custom-tabs mb-4"
              color="primary"
              grow
            >
              <v-tab value="summary">Summary</v-tab>
              <v-tab v-if="isConsumer" value="income">Income</v-tab>
              <v-tab value="cash flow">Cash Flow</v-tab>
              <v-tab value="behavioral">Behavioral</v-tab>
              <v-tab value="transactions">Transactions</v-tab>
            </v-tabs>

            <!-- Tab content area -->
            <v-tabs-window v-model="activeTab">
              <!-- Summary Tab -->
              <v-tabs-window-item value="summary">
                <div
                  class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 px-4 bg-white rounded shdawo-lg p-4"
                >
                  <div
                    class="bg-blue-50 text-center shadow rounded-2xl p-4 flex flex-col items-center justify-center"
                  >
                    <div class="text-md font-semibold">{{ formatCurrency(totalCredits) }}</div>
                    <div class="text-sm text-gray-500 mt-1">Total Credit</div>
                  </div>
                  <div
                    class="bg-red-50 text-center shadow rounded-2xl p-4 flex flex-col items-center justify-center"
                  >
                    <div class="text-md font-semibold">{{ formatCurrency(totalDebits) }}</div>
                    <div class="text-sm text-gray-500 mt-1">Total Debits</div>
                  </div>
                  <div
                    class="bg-green-50 text-center shadow rounded-2xl p-4 flex flex-col items-center justify-center"
                  >
                    <div class="text-md font-semibold">
                      {{ formatCurrency(averageMonthlyCredits) }}
                    </div>
                    <div class="text-sm text-gray-500 mt-1">Avg. Monthly Credit</div>
                  </div>
                  <div
                    class="bg-purple-50 text-center shadow rounded-2xl p-4 flex flex-col items-center justify-center"
                  >
                    <div class="text-md font-semibold">
                      {{ formatCurrency(averageMonthlyDebits) }}
                    </div>
                    <div class="text-sm text-gray-500 mt-1">Avg. Monthly Debits</div>
                  </div>
                  <div
                    class="bg-gray-100 text-center shadow rounded-2xl p-4 flex flex-col items-center justify-center"
                  >
                    <div class="text-md font-semibold">
                      {{ formatCurrency(averageMonthlyBalance) }}
                    </div>
                    <div class="text-sm text-gray-500 mt-1">Average Monthly Balance</div>
                  </div>
                </div>

                <div class="flex flex-col md:flex-row gap-4 mt-4">
                  <!-- Most Frequent Expense -->
                  <div class="bg-white rounded shadow-md p-4 w-full md:w-1/3">
                    <p class="text-sm mb-1">Most Frequent Expense</p>
                    <p class="font-semibold text-gray-800 leading-tight">
                      {{ mostFrequentExpense }}<br />
                    </p>
                  </div>

                  <!-- Highest Spend -->
                  <div class="bg-white rounded shadow-md p-4 w-full md:w-1/3">
                    <p class="text-sm mb-1">
                      Highest Spend:
                      <span class="font-semibold">{{ formatCurrency(highestSpend) }}</span>
                    </p>
                    <p class="text-sm mt-1">
                      Transaction Date:
                      <span class="font-semibold">{{ monthWithHighestSpend }}</span>
                    </p>
                  </div>

                  <!-- Most Frequent Expense Amount -->
                  <div class="bg-white rounded shadow-md p-4 w-full md:w-1/3">
                    <p class="text-sm mb-1">Most Frequent Expense Amount</p>
                    <p class="font-semibold">
                      {{ formatCurrency(mostFrequentExpenseAmount) }}
                    </p>
                  </div>
                </div>

                <div class="bg-white p-6 rounded shadow-md overflow-x-auto mt-4">
                  <h2 class="text-lg font-semibold m-4">Expenses</h2>
                  <table class="min-w-full table-auto border-collapse">
                    <thead>
                      <tr
                        class="text-left text-sm font-normal border-b border-gray-200 bg-gray-100"
                      >
                        <th class="py-3 px-4">Expenses</th>
                        <th class="py-3 px-4">Average Monthly Expenditure</th>
                        <th class="py-3 px-4">Total Expenditure</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="(item, index) in expenseItems"
                        :key="index"
                        class="text-sm text-gray-700 border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td class="py-3 px-4">{{ item.label }}</td>
                        <td class="py-3 px-4">{{ formatCurrency(item.monthly) }}</td>
                        <td class="py-3 px-4">{{ formatCurrency(item.total) }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </v-tabs-window-item>
              <v-tabs-window-item value="income">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <!-- Income Analysis -->
                  <div class="bg-white p-6 rounded shadow-sm">
                    <h2 class="font-semibold text-md mb-4">Income Analysis</h2>
                    <div class="grid grid-cols-2 gap-4 text-sm">
                      <div class="mb-4">
                        <p>Average Predicted Salary</p>
                        <p class="font-semibold text-green-600">
                          {{ formatCurrency(income.averagePredictedSalary) }}
                        </p>
                      </div>
                      <div class="mb-4">
                        <p>Average Other Income</p>
                        <p class="font-semibold">{{ formatCurrency(income.averageOtherIncome) }}</p>
                      </div>
                      <div class="mt-4">
                        <p>Lowest Salary</p>
                        <p class="font-semibold">{{ formatCurrency(income.lowestSalary) }}</p>
                      </div>
                      <div class="mt-4">
                        <p>Most Recent Salary</p>
                        <p class="font-semibold">{{ formatCurrency(income.mostRecentSalary) }}</p>
                      </div>
                    </div>
                  </div>

                  <!-- Pay Date Management -->
                  <div class="bg-white p-6 rounded shadow-sm">
                    <h2 class="font-semibold text-md mb-4">Pay Date Management</h2>
                    <div class="grid grid-cols-2 gap-4 text-sm">
                      <div class="mb-4">
                        <p>Expected Salary Payment Day</p>
                        <p class="font-semibold text-green-600">
                          {{ income.expectedSalaryPaymentDay || 0 }}
                        </p>
                      </div>
                      <div class="mb-4">
                        <p>No. of Salary Payments</p>
                        <p class="font-semibold">{{ income.numberOfSalaryPayments || 0 }}</p>
                      </div>
                      <div class="mb-4">
                        <p>Latest Salary Date</p>
                        <p class="font-semibold">
                          {{ formatDate(income.lastDateOfSalaryPayment) }}
                        </p>
                      </div>
                      <div class="mb-4">
                        <p>Lowest Salary Date</p>
                        <p class="font-semibold">{{ formatDate(income.lowestSalaryDate) }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </v-tabs-window-item>

              <!-- Cash flow-->
              <v-tabs-window-item value="cash flow">
                <div class="flex flex-col md:flex-row gap-4 text-gray-500 py-10">
                  <!-- Inflow Summary -->
                  <div class="flex-1 bg-white border p-6 rounded shadow">
                    <h2 class="text-lg font-semibold text-black-800 mb-4">
                      Inflow Summary
                      <i class="fas fa-arrow-down text-black-600 ml-2"></i>
                    </h2>
                    <div class="space-y-4">
                      <div class="mt-6">
                        <p>Total Inflow</p>
                        <span class="text-green-600 font-bold">{{
                          formatCurrency(totalInflow)
                        }}</span>
                      </div>
                      <div class="flex justify-between mt-6">
                        <div class="">
                          <p>Average Monthly Inflow</p>
                          <span class="font-medium">{{
                            formatCurrency(averageMonthlyCredits)
                          }}</span>
                        </div>
                        <div class="">
                          <p>Average Weekly Inflow</p>
                          <span class="font-medium">{{ formatCurrency(averageWeeklyInflow) }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="flex-1 bg-white border p-6 rounded shadow">
                    <h2 class="text-lg font-semibold text-black-800 mb-4">
                      Outflow Summary
                      <i class="fas fa-arrow-up text-black-600 ml-2"></i>
                    </h2>
                    <div class="space-y-4">
                      <div class="mt-6">
                        <p>Total Outflow</p>
                        <span class="text-red-600 font-bold">{{
                          formatCurrency(totalOutflow)
                        }}</span>
                      </div>
                      <div class="flex justify-between mt-6">
                        <div class="">
                          <p>Average Monthly Outflow</p>
                          <span class="font-medium">{{
                            formatCurrency(averageMonthlyDebits)
                          }}</span>
                        </div>
                        <div class="">
                          <p>Average Weekly Outflow</p>
                          <span class="font-medium">{{
                            formatCurrency(averageWeeklyOutflow)
                          }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="flex gap-4 justify-between p-2">
                  <!-- Card 1 -->
                  <div class="flex justify-between bg-[#1f5aa3] text-white rounded p-6 w-full">
                    <div class="flex-1 text-sm">
                      Average Monthly Balance

                      <div class="text-sm mt-2 font-semibold">
                        {{ formatCurrency(averageMonthlyBalance) }}
                      </div>
                    </div>

                    <div class="flex-1 text- text-sm">
                      Average Weekly Balance

                      <div class="text-sm mt-2 font-semibold">
                        {{ formatCurrency(averageWeeklyBalance) }}
                      </div>
                    </div>
                  </div>

                  <!-- cash flow-->
                  <div class="flex justify-between bg-[#1f5aa3] text-white rounded p-6 w-full">
                    <div class="flex-1">
                      <div class="text-sm mt-2">Inflow to Outflow Rate</div>
                      <div class="text-md font-semibold">{{ monthToMonthInflowToOutflowRate }}</div>
                    </div>
                    <div class="flex-1">
                      <div class="text-sm mt-2">Overall Inflow to Outflow</div>
                      <div class="text-md font-semibold">
                        {{ overallInflowToOutflowRate }}
                      </div>
                    </div>
                  </div>
                </div>

                <div class="p-2 rounded shadow-md">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Monthly Section -->
                    <div class="bg-white p-4 rounded shadow">
                      <h3 class="text-lg font-bold mb-6">Monthly Credit & Debit</h3>
                      <div class="overflow-y-auto max-h-96">
                        <table class="min-w-full table-auto text-sm text-left text-gray-600">
                          <thead class="bg-gray-100 font-medium bg-gray-100">
                            <tr>
                              <th class="px-2 py-2">Month</th>
                              <th class="px-2 py-2">Total Credit</th>
                              <th class="px-2 py-2">Total Debit</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr v-for="(entry, index) in monthlyData" :key="index" class="border-b">
                              <td class="px-2 py-2">{{ entry.month }}</td>
                              <td class="px-2 py-2">{{ formatCurrency(entry.credit) }}</td>
                              <td class="px-2 py-2">{{ formatCurrency(entry.debit) }}</td>
                            </tr>
                          </tbody>
                          <tfoot class="font-semibold text-gray-800 bg-gray-50 border-t">
                            <tr>
                              <td class="px-2 py-2">Total</td>
                              <td class="px-2 text-green-800 py-2">
                                {{ formatCurrency(totalMonthlyCredit) }}
                              </td>
                              <td class="px-2 text-red-800 py-2">
                                {{ formatCurrency(totalMonthlyDebit) }}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>

                    <!-- Weekly Section -->
                    <div class="bg-white p-4 rounded-lg shadow">
                      <h3 class="text-lg font-bold mb-6">Weekly Credit & Debit</h3>
                      <div class="overflow-y-auto max-h-96">
                        <table class="min-w-full table-auto text-sm text-left text-gray-600">
                          <thead class="bg-gray-100 font-medium">
                            <tr>
                              <th class="px-2 py-2">Week</th>
                              <th class="px-2 py-2">Total Credit</th>
                              <th class="px-2 py-2">Total Debit</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr v-for="(entry, index) in weeklyData" :key="index" class="border-b">
                              <td class="px-2 py-2">{{ entry.week }}</td>
                              <td class="px-2 py-2">{{ formatCurrency(entry.credit) }}</td>
                              <td class="px-2 py-2">{{ formatCurrency(entry.debit) }}</td>
                            </tr>
                          </tbody>
                          <tfoot class="font-semibold text-gray-800 bg-gray-50 border-t">
                            <tr>
                              <td class="px-2 py-2">Total</td>
                              <td class="px-2 text-green-800 py-2">
                                {{ formatCurrency(totalWeeklyCredit) }}
                              </td>
                              <td class="px-2 text-red-800 py-2">
                                {{ formatCurrency(totalWeeklyDebit) }}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </v-tabs-window-item>

              <!-- Behavioral -->
              <v-tabs-window-item value="behavioral">
                <div class="">
                  <!-- Loan Analysis Card -->
                  <div class="bg-white p-6 rounded shadow-md mb-6">
                    <h2 class="text-lg font-semibold mb-6 flex items-center gap-2">
                      Loan Analysis
                      <i class="fas fa-info-circle text-blue-700 text-base"></i>
                    </h2>

                    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 text-sm">
                      <div>
                        <p class="text-gray-600">Number of Loan Transactions</p>
                        <p class="font-bold text-black">{{ numberLoanTransactions }}</p>
                      </div>
                      <div>
                        <p class="text-gray-600">Total Loan Amount</p>
                        <p class="text-red-600 font-bold">{{ formatCurrency(totalLoanAmount) }}</p>
                      </div>
                      <div>
                        <p class="text-gray-600">Average Monthly Loan Amount</p>
                        <p class="text-blue-700 font-bold">
                          {{ formatCurrency(averageMonthlyLoanAmount) }}
                        </p>
                      </div>
                      <div>
                        <p class="text-gray-600">Total Loan Repayment Amount</p>
                        <p class="text-green-600 font-bold">
                          {{ formatCurrency(totalLoanRepaymentAmount) }}
                        </p>
                      </div>

                      <div>
                        <p class="text-gray-600">Avg. Monthly Loan Repayment Amt</p>
                        <p class="text-black font-bold">
                          {{ formatCurrency(averageMonthlyLoanRepaymentAmount) }}
                        </p>
                      </div>
                      <div>
                        <p class="text-gray-600">Loan to Inflow Rate</p>
                        <p class="text-black font-bold">{{ formatCurrency(loanToInflowRate) }}</p>
                      </div>
                      <div>
                        <p class="text-gray-600">Latest Loan Transaction Date</p>
                        <p class="text-black font-bold">{{ latestLoanTransaction }}</p>
                      </div>
                      <div>
                        <p class="text-gray-600">Latest Loan Repayment Transaction Date</p>
                        <p class="text-black font-bold">{{ loanRepaymentDate }}</p>
                      </div>
                    </div>
                  </div>

                  <!-- Patterns Card -->
                  <div class="bg-[#1f5aa3] p-6 rounded shadow-md mb-6">
                    <h2 class="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                      Patterns
                      <i class="fas fa-chart-line text-white text-xs"></i>
                    </h2>

                    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 text-sm text-white">
                      <div>
                        <p>Account Sweep</p>
                        <p
                          :class="accountSweep === 'YES' ? 'font-bold text-white' : 'text-gray-300'"
                        >
                          {{ accountSweep }}
                        </p>
                      </div>
                      <div>
                        <p>Number of Betting Transactions</p>
                        <p class="font-bold">{{ gamblingStatus }}</p>
                      </div>
                      <div>
                        <p>Gambling Rate</p>
                        <p class="font-bold">{{ gamblingRate }}</p>
                      </div>
                      <div>
                        <p>Transactions between 500k - 1M</p>
                        <p class="font-bold">
                          {{ percentOfTransactionsBetween500ThousandToOneMillionNaira }}
                        </p>
                      </div>
                      <div>
                        <p>Percentage of Credit Transactions</p>
                        <p class="font-bold">{{ percentOfCredit }}</p>
                      </div>
                      <div>
                        <p>Percentage of Debit Transactions</p>
                        <p class="font-bold">{{ percentOfDebit }}</p>
                      </div>
                      <div>
                        <p>Most Frequent</p>
                        <p class="font-bold">{{ mostFrequentBalanceRange }}</p>
                      </div>
                      <div>
                        <p>Transactions Greater than 1M</p>
                        <p class="font-bold">
                          {{ percentOfTransactionsGreaterThanOneMillionNaira }}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Self Transfer Summary Section -->
                <div class="bg-white p-6 rounded-lg shadow text-sm text-gray-800">
                  <h2 class="text-base font-semibold mb-4">Self Transfer Summary</h2>

                  <div class="grid grid-cols-3 gap-4 mb-6">
                    <!-- Inflow -->
                    <div>
                      <div>Number of Self Transfer (Inflow)</div>
                      <div class="font-bold mt-1">{{ numberOfSelfTransfersInflows }}</div>
                    </div>
                    <div>
                      <div>Value of Self Transfer (Inflow)</div>
                      <div class="text-green-600 font-bold mt-1">
                        {{ formatCurrency(selfTransferInflowAmount) }}
                      </div>
                    </div>
                    <div>
                      <div>Total Number of Transactions</div>
                      <div class="font-bold mt-1">{{ totalNumberOfTransactions }}</div>
                    </div>

                    <!-- Outflow -->
                    <div>
                      <div>Number of Self Transfer (Outflow)</div>
                      <div class="font-bold mt-1">{{ numberOfSelfTransfersOutflows }}</div>
                    </div>
                    <div>
                      <div>Value of Self Transfer (Outflow)</div>
                      <div class="text-red-600 font-bold mt-1">
                        {{ formatCurrency(selfTransferOutflowAmount) }}
                      </div>
                    </div>
                    <div>
                      <div>Returned Cheque</div>
                      <div class="font-bold mt-1">{{ formatCurrency(returnCheque) }}</div>
                    </div>
                  </div>
                </div>

                <div class="flex flex-col md:flex-row gap-6 justify-between mt-4">
                  <!-- Self Transfer Transactions Table -->
                  <div class="w-full md:w-1/2">
                    <div class="bg-white rounded border shadow p-4 max-h-96 overflow-y-auto">
                      <h3 class="font-semibold text-sm md:text-base mb-4">
                        Self Transfer Transactions
                      </h3>
                      <table class="w-full text-sm text-left">
                        <thead class="font-semibold bg-gray-100">
                          <tr>
                            <th class="py-2 px-4">Month</th>
                            <th class="py-2 px-4">Inflow</th>
                            <th class="py-2 px-4">Outflow</th>
                          </tr>
                        </thead>
                        <tbody>
                          <!-- Empty state check -->
                          <tr v-if="!selfTableData || selfTableData.length === 0">
                            <td colspan="3" class="text-center py-4 text-gray-500">
                              No data available
                            </td>
                          </tr>
                          <!-- Data rows -->
                          <tr
                            v-for="(item, index) in selfTableData"
                            :key="index"
                            class="border-b last:border-none"
                          >
                            <td class="py-2 px-4">{{ item.month }}</td>
                            <td class="py-2 px-4">{{ formatCurrency(item.inflow) }}</td>
                            <td class="py-2 px-4">{{ formatCurrency(item.outflow) }}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <!-- Account Balance Analysis Table -->
                  <div class="w-full md:w-1/2">
                    <div class="bg-white border rounded shadow p-4 max-h-96 overflow-y-auto">
                      <h3 class="font-semibold text-sm md:text-base mb-4">
                        Account Balance Analysis
                      </h3>
                      <table class="w-full text-sm text-left">
                        <thead class="font-semibold bg-gray-100">
                          <tr>
                            <th class="py-2 px-4">Month</th>
                            <th class="py-2 px-4">Highest Balance</th>
                            <th class="py-2 px-4">Lowest Balance</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="(item, index) in monthlyBalance" :key="index">
                            <td class="py-2 px-4">{{ item.month }}</td>
                            <td class="py-2 px-4">{{ formatCurrency(item.highest) }}</td>
                            <td class="py-2 px-4">{{ formatCurrency(item.lowest) }}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </v-tabs-window-item>
              <v-tabs-window-item value="transactions">
                <div class="py-4">
                  <v-card class="rounded-lg shadow-md pa-4">
                    <span class="text-md font-semibold mt-6 ml-2">Transaction History</span>
                    <div class="flex items-center justify-between p-2">
                      <!-- Filter (Vuetify Select) -->
                      <div class="flex items-center space-x-4 pt-2">
                        <!-- Filter Icon -->
                        <i class="fa-solid fa-filter"></i>

                        <v-select
                          v-model="selectedStatus"
                          :items="['CREDIT', 'DEBIT']"
                          color="[#1f5aa3]"
                          label="Status"
                          density="compact"
                          hide-details
                          variant="outlined"
                          class="w-32"
                        ></v-select>
                      </div>

                      <v-text-field
                        v-model="searchQuery"
                        rounded
                        placeholder="Search for a transaction"
                        density="compact"
                        hide-details
                        variant="outlined"
                        class="max-w-xs rounded-md"
                        label="Search"
                        color="[#1f5aa3]"
                        append-inner-icon=""
                      >
                        <!-- FontAwesome Search Icon inside append-inner slot -->
                        <template #append-inner>
                          <i class="fas fa-search text-[#1f5aa3]"></i>
                        </template>
                      </v-text-field>
                    </div>

                    <el-date-picker
                      v-model="dateRange"
                      type="daterange"
                      range-separator="to"
                      start-placeholder="Start date"
                      end-placeholder="End date"
                      class="w-20 m-2"
                      size="small"
                    ></el-date-picker>

                    <div v-loading="transactionLoading" class="relative min-h-[200px]">
                      <v-table class="min-w-full text-sm pa-2">
                        <thead class="font-semibold bg-gray-100">
                          <tr>
                            <th class="px-2 py-3 font-semibold">S/N</th>
                            <th class="px-2 py-3 font-semibold">Date</th>
                            <th class="px-2 py-3 font-semibold">Description</th>
                            <th class="px-2 py-3 font-semibold">Type</th>
                            <th class="px-2 py-3 font-semibold">Amount</th>
                            <th class="px-2 py-3 font-semibold">Balance</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr
                            v-for="(txn, index) in transactions"
                            :key="index"
                            class="border-t border-gray-200 hover:bg-gray-50 transition-colors"
                          >
                            <td class="px-2 py-4">{{ index + 1 }}</td>
                            <td class="px-2 py-4">{{ formatDate(txn.date) }}</td>
                            <td class="px-2 py-4">{{ txn.description }}</td>
                            <td class="px-6 py-4 font-semibold">
                              <span
                                :class="
                                  txn.type === 'CREDIT'
                                    ? 'text-green-600 py-1 px-2 text-xs font-semibold rounded-full bg-green-100'
                                    : 'text-red-600 py-1 px-2 text-xs font-semibold rounded-full bg-red-100'
                                "
                              >
                                {{ txn.type }}
                              </span>
                            </td>
                            <td class="px-2 py-4">{{ formatCurrency(txn.amount) }}</td>
                            <td class="px-2 py-4">{{ formatCurrency(txn.balance) }}</td>
                          </tr>
                        </tbody>
                      </v-table>
                    </div>

                    <v-card-actions class="justify-between px-6 py-4 text-sm text-gray-500">
                      <span>1–12 of 12</span>
                      <div class="flex items-center space-x-2">
                        <span>Rows per page:</span>
                        <v-select
                          :items="[15, 30, 45]"
                          v-model="rowsPerPage"
                          density="compact"
                          hide-details
                          class="w-20"
                          variant="outlined"
                        />
                        <v-btn icon density="comfortable">
                          <v-icon>mdi-chevron-left</v-icon>
                        </v-btn>
                        <v-btn icon density="comfortable">
                          <v-icon>mdi-chevron-right</v-icon>
                        </v-btn>
                      </div>
                    </v-card-actions>
                  </v-card>
                </div>
              </v-tabs-window-item>
            </v-tabs-window>
          </div>
          <!-- Filter Drawer -->
        </div>
      </template>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, onMounted, computed, reactive, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import Axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import MainLayout from '@/layouts/full/MainLayout.vue'
import moment from 'moment'
import { ElMessage, ElNotification } from 'element-plus'
import { saveAs } from 'file-saver'

const activeTab = ref('Summary')

const formatDate = (date) => {
  if (!date) return 'N/A' // or any placeholder you prefer
  return moment(date).format('MMMM Do YYYY')
}

function formatPercent(value) {
  if (typeof value !== 'number') return '0%'
  return `${(value * 100).toFixed(2)}%` // Adjust decimal places as needed
}

function formatCurrency(number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2
  }).format(number || 0)
}

const salary = [
  // Repeat for as many rows as needed...
]
const rowsPerPage = ref(15)
const route = useRoute()
const authStore = useAuthStore()

const result = ref(null)
const loading = ref(true)
const error = ref(null)

const fileName = ref('')
const clientName = ref('')
const statementPeriod = ref('')
const accountId = ref('')
const totalDebits = ref(0)
const totalCredits = ref(0)
const averageMonthlyDebits = ref(0)
const averageMonthlyCredits = ref(0)
const averageMonthlyBalance = ref(0)
const averageWeeklyBalance = ref(0)

const totalInflow = ref(0)
const averageMonthlyInflow = ref(0)
const averageWeeklyInflow = ref(0)

const totalOutflow = ref(0)
const averageMonthlyOutflow = ref(0)
const averageWeeklyOutflow = ref(0)

const monthlyData = ref([])
const weeklyData = ref([])

const totalMonthlyCredit = computed(() =>
  monthlyData.value.reduce((sum, entry) => sum + entry.credit, 0)
)

const totalMonthlyDebit = computed(() =>
  monthlyData.value.reduce((sum, entry) => sum + entry.debit, 0)
)
const totalWeeklyCredit = computed(() =>
  weeklyData.value.reduce((sum, entry) => sum + entry.credit, 0)
)

const totalWeeklyDebit = computed(() =>
  weeklyData.value.reduce((sum, entry) => sum + entry.debit, 0)
)

const mostFrequentExpense = ref(0)
const mostFrequentExpenseAmount = ref(0)

const highestSpend = ref(0)
const monthWithHighestSpend = ref('')

const expenseItems = ref([])

const percentOfDebit = ref('')
const percentOfCredit = ref('')
const percentOfTransactionsBetween500ThousandToOneMillionNaira = ref('')
const percentOfTransactionsGreaterThanOneMillionNaira = ref('')
const mostFrequentBalanceRange = ref(0)
const accountSweep = ref('')
const gamblingRate = ref(0)
const gamblingStatus = ref('')
const loanInflowRate = ref(0)
const accountActivity = ref(0)
const totalLoanAmount = ref(0)
const loanToInflowRate = ref(0)
const numberLoanTransactions = ref(0)
const averageMonthlyLoanAmount = ref(0)
const totalLoanRepaymentAmount = ref(0)
const loanRepaymentToInflowRate = ref(0)
const numberRepaymentTransactions = ref(0)
const latestLoanTransaction = ref('')
const loanRepayment = ref([])
const loanRepaymentDate = ref('')

const overallInflowToOutflowRate = ref('')
const percentOfInflowIrregularity = ref(0)
const monthToMonthInflowToOutflowRate = ref('')
const averageMonthlyLoanRepaymentAmount = ref(0)

const numberOfSelfTransfersInflows = ref(0)
const numberOfSelfTransfersOutflows = ref(0)

const selfTransferInflowAmount = ref(0)
const selfTransferOutflowAmount = ref(0)
const inflowOutflowRate = ref(0)

const totalNumberOfTransactions = ref(0)
const returnCheque = ref(0)

const selfTableData = ref([])

const monthlyBalance = ref([])

const transactions = ref([])
const allTransactions = ref([])
const income = ref({})
const statementType = ref(null)


// Function to format the balance range (e.g., "1000 - 100000")
const formatBalanceRange = () => {
  if (!range || !range.includes(' - ')) {
    return '₦0.00 - ₦0.00' // Return a fallback if the range format is invalid
  }

  const [lower, upper] = range.split(' - ').map((val) => parseFloat(val.trim()))

  if (isNaN(lower) || isNaN(upper)) {
    return '₦0.00 - ₦0.00' // Return fallback if parsing fails
  }

  return `${formatCurrency(lower)} - ${formatCurrency(upper)}`
}

const fetchAnalysisResult = async (analysisId) => {
  const savedAuth = localStorage.getItem('data') ? JSON.parse(localStorage.getItem('data')) : null

console.log(savedAuth);

const token = savedAuth
  ? savedAuth?.token
  : computed(() => authStore.token)?.value;

const tenantId = savedAuth
  ? savedAuth.user?.business_name
    ? savedAuth.user?.id
    : savedAuth.user?.tenant_id
  : computed(() =>
      authStore.user?.business_name ? authStore.user.id : authStore.user.tenant_id
    )?.value;

  const apiUrl = `https://staging.getjupita.com/api/${tenantId}/get-analysis-result?analysis_id=${analysisId}`
  loading.value = true

  try {
    const response = await Axios.get(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    console.log('statement analysis result page data:', response)
    result.value = response.data

    // Extract needed data
    const analysis = response.data?.data?.analysis_result?.analysis_result
    fileName.value = analysis?.name || 'N/A'
    clientName.value = analysis?.clientFullName || 'N/A'
    accountId.value = analysis?.accountId || 'N/A'

    statementType.value = response.data?.data?.analysis_result?.analysis_result.statementType

    const behavior = analysis?.behavioralAnalysis || {}
    console.log('behavioural:', behavior)

    income.value = analysis?.incomeAnalysis || {}
    console.log('income:', income.value)

    accountSweep.value = behavior.accountSweep || 'No'
    gamblingRate.value = behavior.gamblingRate || 0
    gamblingStatus.value = behavior.gamblingStatus || 'N/A'
    loanInflowRate.value = behavior.loanInflowRate || 0
    accountActivity.value = behavior.accountActivity || 0
    totalLoanAmount.value = behavior.totalLoanAmount || 0
    loanToInflowRate.value = behavior.loanToInflowRate || 0
    numberLoanTransactions.value = behavior.numberLoanTransactions || 0
    averageMonthlyLoanAmount.value = behavior.averageMonthlyLoanAmount || 0
    totalLoanRepaymentAmount.value = behavior.totalLoanRepaymentAmount || 0
    loanRepaymentToInflowRate.value = behavior.loanRepaymentToInflowRate || 0
    numberRepaymentTransactions.value = behavior.numberRepaymentTransactions || 0
    // Assign loanRepayment array
    loanRepayment.value = behavior.latestRepaymentTransaction || []

    // Get first object if it exists
    const firstRepayment = loanRepayment.value[0] || null

    // Format using moment in the script
    loanRepaymentDate.value = firstRepayment?.date
      ? moment(firstRepayment.date).format('MMM D, YYYY')
      : 'N/A'

    const latestLoan = behavior.latestLoanTransaction?.[0]
    latestLoanTransaction.value = latestLoan
      ? moment(latestLoan.date).format('MMMM D, YYYY')
      : 'N/A'

    overallInflowToOutflowRate.value = behavior.overallInflowToOutflowRate || 'N/A'
    percentOfInflowIrregularity.value = behavior.percentOfInflowIrregularity || 0
    monthToMonthInflowToOutflowRate.value = behavior.monthToMonthInflowToOutflowRate || 'N/A'
    averageMonthlyLoanRepaymentAmount.value = behavior.averageMonthlyLoanRepaymentAmount || 0
    const cashFlow = analysis?.cashFlowAnalysis
    console.log('cash flow data:', cashFlow)

    mostFrequentExpense.value = analysis?.spendAnalysis.mostFrequentExpense
    mostFrequentExpenseAmount.value = analysis?.spendAnalysis.mostFrequentExpenseAmount

    const spend = response.data?.data?.analysis_result?.analysis_result?.spendAnalysis || {}
    const pattern =
      response.data?.data?.analysis_result?.analysis_result?.transactionPatternAnalysis || {}
    console.log('pattern analysis:', pattern)

    percentOfDebit.value = (pattern.percentDebitTransactions * 100).toFixed(2) + '%'
    percentOfCredit.value = (pattern.percentCreditTransactions * 100).toFixed(2) + '%'
    percentOfTransactionsBetween500ThousandToOneMillionNaira.value =
      (pattern.percentOfTransactionsBetween500ThousandToOneMillionNaira * 100).toFixed(2) + '%'
    percentOfTransactionsGreaterThanOneMillionNaira.value =
      (pattern.percentOfTransactionsGreaterThanOneMillionNaira * 100).toFixed(2) + '%'
    mostFrequentBalanceRange.value = pattern.mostFrequentBalanceRange

    numberOfSelfTransfersInflows.value = pattern.noOfSelfTransferInflows
    numberOfSelfTransfersOutflows.value = pattern.noOfSelfTransferOutflows

    selfTransferInflowAmount.value = pattern.selfTransferInflowAmount
    selfTransferOutflowAmount.value = pattern.selfTransferOutflowAmount

    totalNumberOfTransactions.value = pattern.totalNumberOfTransactions
    returnCheque.value = pattern.returnCheque

    const selfTransferInflow = pattern.selfTransferInflowTransactionsByMonth || []
    const selfTransferOutflow = pattern.selfTransferOutflowTransactionsByMonth || []

    const selfTransferMap = new Map()

    // Helper to format "4-2024" to "Apr 2024"
    function formatMonth(dateString) {
      return moment(dateString, 'M-YYYY').format('MMM YYYY')
    }

    // Populate inflow data
    selfTransferInflow.forEach((item) => {
      const formattedMonth = formatMonth(item.date)
      selfTransferMap.set(formattedMonth, {
        month: formattedMonth,
        inflow: item.amount,
        outflow: 0
      })
    })

    // Populate outflow data, merge if exists
    selfTransferOutflow.forEach((item) => {
      const formattedMonth = formatMonth(item.date)
      if (selfTransferMap.has(formattedMonth)) {
        selfTransferMap.get(formattedMonth).outflow = item.amount
      } else {
        selfTransferMap.set(formattedMonth, {
          month: formattedMonth,
          inflow: 0,
          outflow: item.amount
        })
      }
    })

    // Convert map to array for the table
    selfTableData.value = Array.from(selfTransferMap.values()).sort(
      (a, b) => moment(a.month, 'MMM YYYY') - moment(b.month, 'MMM YYYY')
    )

    highestSpend.value = spend.highestSpend
    monthWithHighestSpend.value = moment(spend.monthWithHighestSpend, 'M/YYYY').format('MMMM YYYY')

    expenseItems.value = [
      {
        label: 'Rent',
        monthly: spend.averageMonthlySpendOnRent ?? 0,
        total: spend.totalSpendOnRent ?? 0,
      },
      {
        label: 'Hospitality and Food',
        monthly: spend.averageMonthlySpendOnHospitalityAndFood ?? 0,
        total: spend.totalSpendOnHospitalityAndFood ?? 0,
      },
      {
        label: 'Transportation',
        monthly: spend.averageMonthlySpendOnTransportation ?? 0,
        total: spend.totalSpendOnTransportation ?? 0,
      },
      {
        label: 'Utilities',
        monthly: spend.averageMonthlySpendOnUtilities ?? 0,
        total: spend.totalSpendOnUtilities ?? 0,
      },
      {
        label: 'Charges and Stamp Duty',
        monthly: spend.averageMonthlySpendOnChargesAndStampDuty ?? 0,
        total: spend.totalSpendOnChargesAndStampDuty ?? 0
      },
      {
        label: 'Transfer',
        monthly: spend.averageMonthlySpendOnTransfer ?? 0,
        total: spend.totalSpendOnTransfer ?? 0
      },
      {
        label: 'ATM Withdrawals and POS',
        monthly: spend.averageMonthlySpendOnAtmAndPOS ?? 0,
        total: spend.totalSpendOnAtmAndPOS ?? 0
      },
      {
        label: 'Airtime and Data',
        monthly: spend.averageMonthlySpendOnAirtimeAndData ?? 0,
        total: spend.totalSpendOnAirtimeAndData ?? 0
      },
      {
        label: 'Crypto',
        monthly: spend.averageMonthlySpendOnCrypto ?? 0,
        total: spend.totalSpendOnCrypto ?? 0
      },
      {
        label: 'Entertainment',
        monthly: spend.averageMonthlySpendOnEntertainment ?? 0,
        total: spend.totalSpendOnEntertainment ?? 0
      },
      {
        label: 'Health',
        monthly: spend.averageMonthlySpendOnHealth ?? 0,
        total: spend.totalSpendOnHealth ?? 0
      },
      {
        label: 'Gambling',
        monthly: spend.averageMonthlySpendOnGambling ?? 0,
        total: spend.totalSpendOnGambling ?? 0
      },
      {
        label: 'Insurance',
        monthly: spend.averageMonthlySpendOnInsurance ?? 0,
        total: spend.totalSpendOnInsurance ?? 0
      },
      {
        label: 'International Transactions',
        monthly: spend.averageMonthlySpendOnInternationalTransactions ?? 0,
        total: spend.totalSpendOnInternationalTransactions ?? 0
      },
      {
        label: 'Online and Web',
        monthly: spend.averageMonthlySpendOnOnlineAndWeb ?? 0,
        total: spend.totalSpendOnOnlineAndWeb ?? 0
      },
      {
        label: 'Savings and Investments',
        monthly: spend.averageMonthlySpendOnSavingsAndInvestments ?? 0,
        total: spend.totalSpendOnSavingsAndInvestments ?? 0
      },
      {
        label: 'Travel',
        monthly: spend.averageMonthlySpendOnTravel ?? 0,
        total: spend.totalSpendOnTravel ?? 0
      },
      {
        label: 'USSD',
        monthly: spend.averageMonthlySpendOnUSSD ?? 0,
        total: spend.totalSpendOnUSSD ?? 0
      },
      {
        label: 'Transfer Via Agents',
        monthly: spend.averageMonthlyTransactionsViaAgents ?? 0,
        total: spend.totalTransactionsViaAgents ?? 0
      },
      {
        label: 'Others',
        monthly: spend.averageMonthlySpendOnOthers ?? 0,
        total: spend.totalSpendOnOthers ?? 0
      },

      {
        label: 'Total Expenses',
        monthly: spend.averageMonthlyTotalExpenses ?? 0,
        total: spend.totalExpenses ?? 0
      }
    ]

    // Use turnover values directly
    totalDebits.value = cashFlow?.totalDebitTurnOver || 0
    totalCredits.value = cashFlow?.totalCreditTurnover || 0

    // Extract averages
    averageMonthlyDebits.value = cashFlow?.averageMonthlyDebits || 0
    averageMonthlyCredits.value = cashFlow?.averageMonthlyCredits || 0
    averageMonthlyBalance.value = cashFlow?.averageMonthlyBalance || 0
    averageWeeklyBalance.value = cashFlow?.averageWeeklyBalance || 0

    totalInflow.value = cashFlow?.totalCreditTurnover || 0
    averageMonthlyInflow.value = cashFlow?.averageMonthlyCredits || 0
    averageWeeklyInflow.value = cashFlow?.averageWeeklyCredits || 0

    totalOutflow.value = cashFlow?.totalDebitTurnOver || 0
    averageMonthlyOutflow.value = cashFlow?.averageMonthlyDebits || 0
    averageWeeklyOutflow.value = cashFlow?.averageWeeklyDebits || 0

    // set monthly balance
    const highest = cashFlow?.monthlyHighestBalance || []
    const lowest = cashFlow?.monthlyLowestBalance || []
    inflowOutflowRate.value =
      totalOutflow.value !== 0
        ? +((totalInflow.value - totalOutflow.value) / totalOutflow.value).toFixed(2)
        : 0

    const monthlyBalanceMap = new Map()

    highest.forEach((item) => {
      const dateKey = `${item.month_name} ${item.year}`
      const formattedMonth = moment(dateKey, 'MMMM YYYY').format('MMM YYYY') // e.g., Jan 2024

      const key = `${item.month_name}-${item.year}`
      monthlyBalanceMap.set(key, {
        month: formattedMonth,
        highest: item.highest_balance,
        lowest: 0
      })
    })

    lowest.forEach((item) => {
      const dateKey = `${item.month_name} ${item.year}`
      const formattedMonth = moment(dateKey, 'MMMM YYYY').format('MMM YYYY')

      const key = `${item.month_name}-${item.year}`
      if (monthlyBalanceMap.has(key)) {
        monthlyBalanceMap.get(key).lowest = item.lowest_balance
      } else {
        monthlyBalanceMap.set(key, {
          month: formattedMonth,
          highest: 0,
          lowest: item.lowest_balance
        })
      }
    })

    monthlyBalance.value = Array.from(monthlyBalanceMap.values())

    // Set Monthly Data
    const inflows = cashFlow?.monthlyInflow || []
    const outflows = cashFlow?.monthlyOutflow || []

    const monthlyMap = new Map()

    inflows.forEach((item) => {
      const dateKey = `${item.month_name} ${item.year}`
      const formattedMonth = moment(dateKey, 'MMMM YYYY').format('MMM YYYY') // e.g., Jan 2024

      const key = `${item.month_name}-${item.year}`
      monthlyMap.set(key, {
        month: formattedMonth,
        credit: item.amount,
        debit: 0
      })
    })

    // Then, merge outflows into the same months
    outflows.forEach((item) => {
      const dateKey = `${item.month_name} ${item.year}`
      const formattedMonth = moment(dateKey, 'MMMM YYYY').format('MMM YYYY')

      const key = `${item.month_name}-${item.year}`
      if (monthlyMap.has(key)) {
        monthlyMap.get(key).debit = item.amount
      } else {
        monthlyMap.set(key, {
          month: formattedMonth,
          credit: 0,
          debit: item.amount
        })
      }
    })

    monthlyData.value = Array.from(monthlyMap.values())

    //set weekly data
    const weeklyInflows = cashFlow?.weeklyInflow || []
    const weeklyOutflows = cashFlow?.weeklyOutflow || []

    const weeklyMap = new Map()

    weeklyInflows.forEach((item) => {
      const month = moment().month(item.month_name).format('MMM') // e.g., "Jan"
      const key = `${item.year}-${month}-W${item.week}`
      weeklyMap.set(key, {
        week: `${month} ${item.year} | ${item.week}`,

        credit: item.amount,
        debit: 0
      })
    })

    weeklyOutflows.forEach((item) => {
      const month = moment().month(item.month_name).format('MMM')
      const key = `${item.year}-${month}-W${item.week}`
      if (weeklyMap.has(key)) {
        weeklyMap.get(key).debit = item.amount
      } else {
        weeklyMap.set(key, {
          week: `${month} ${item.year} ${item.week}`,

          credit: 0,
          debit: item.amount
        })
      }
    })

    weeklyData.value = Array.from(weeklyMap.values())

    const start = new Date(analysis?.startDate)
    const end = new Date(analysis?.endDate)
    if (!isNaN(start) && !isNaN(end)) {
      statementPeriod.value = `${moment(start).format('MMMM D, YYYY')} - ${moment(end).format('MMMM D, YYYY')}`
    } else {
      statementPeriod.value = 'Unknown period'
    }
  } catch (err) {
    console.error('Error fetching analysis result:', err)
    error.value = 'Unable to fetch analysis result.'
  } finally {
    loading.value = false
  }
}
const inflowOutflowStatus = computed(() => {
  const rate = inflowOutflowRate.value
  if (rate > 0) return 'Positive cash flow'
  if (rate < 0) return 'Negative cash flow'
  return 'neutral'
})


const isConsumer = computed(() => statementType.value === 'CONSUMER')

const fetchTransactions = async (id) => {
  const savedAuth = localStorage.getItem('data') ? JSON.parse(localStorage.getItem('data')) : null

console.log(savedAuth);

const token = savedAuth
  ? savedAuth?.token
  : computed(() => authStore.token)?.value;

const tenantId = savedAuth
  ? savedAuth.user?.business_name
    ? savedAuth.user?.id
    : savedAuth.user?.tenant_id
  : computed(() =>
      authStore.user?.business_name ? authStore.user.id : authStore.user.tenant_id
    )?.value;

  const analysisId = route.params.id

  const apiUrl = `https://staging.getjupita.com/api/${tenantId}/get-statement-transactions?analysis_id=${analysisId}`

  try {
    const response = await Axios.get(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    console.log('fetch transactions response:', response)
    allTransactions.value = response.data.data.transactions
    transactions.value = [...allTransactions.value]
  } catch (error) {
    console.error(error)
  }
}

const searchQuery = ref('')
const selectedStatus = ref(null)
const dateRange = ref([])

const transactionLoading = ref(false)

watch([searchQuery, selectedStatus, dateRange, allTransactions], async () => {
  transactionLoading.value = true
  await nextTick()

  let filtered = allTransactions.value
  const query = searchQuery.value?.toLowerCase().trim()

  if (query) {
    filtered = filtered.filter((txn) =>
      Object.values(txn).some((value) => value?.toString().toLowerCase().includes(query))
    )
  }

  if (selectedStatus.value) {
    filtered = filtered.filter((txn) => txn.type === selectedStatus.value)
  }

  if (dateRange.value && dateRange.value.length === 2) {
    const [start, end] = dateRange.value.map((d) => new Date(d).getTime())
    filtered = filtered.filter((txn) => {
      const txnDate = new Date(txn.date).getTime()
      return txnDate >= start && txnDate <= end
    })
  }

  transactions.value = filtered

  // Optional: Simulate loading delay for better UX
  await new Promise((r) => setTimeout(r, 300))

  transactionLoading.value = false
})

const resetFilters = () => {
  filters.value = {
    dateFrom: '',
    dateTo: '',
    description: '',
    type: 'All',
    amountMin: '',
    amountMax: ''
  }
}

const applyFilters = () => {
  transactions.value = allTransactions.value.filter((txn) => {
    const matchesDescription =
      !filters.description ||
      txn.description.toLowerCase().includes(filters.description.toLowerCase())

    const txnDate = new Date(txn.date)
    const fromDate = filters.dateRange[0] ? new Date(filters.dateRange[0]) : null
    const toDate = filters.dateRange[1] ? new Date(filters.dateRange[1]) : null

    const inDateRange = (!fromDate || txnDate >= fromDate) && (!toDate || txnDate <= toDate)

    return matchesDescription && inDateRange
  })

  showFilter.value = false
}

onMounted(() => {
  const id = route.params.id
  if (id) {
    fetchAnalysisResult(id)
    fetchTransactions(id)
  } else {
    error.value = 'Invalid analysis ID.'
    loading.value = false
  }
})

const downloadAnalysis = async () => {
  const savedAuth = localStorage.getItem('data') ? JSON.parse(localStorage.getItem('data')) : null

console.log(savedAuth);

const token = savedAuth
  ? savedAuth?.token
  : computed(() => authStore.token)?.value;

const tenantId = savedAuth
  ? savedAuth.user?.business_name
    ? savedAuth.user?.id
    : savedAuth.user?.tenant_id
  : computed(() =>
      authStore.user?.business_name ? authStore.user.id : authStore.user.tenant_id
    )?.value;

  const analysisId = route.params.id

  const apiUrl = `https://staging.getjupita.com/api/${tenantId}/download-insight-report?analysis_id=${analysisId}`

  try {
    // Show persistent notification
    ElNotification({
      title: 'Downloading',
      message: 'Getting your analysis report...',
      type: 'info',
      duration: 3000
    })

    const response = await Axios.get(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    const download = response?.data?.data?.download

    if (!download?.document_url || !download?.document_name) {
      throw new Error('No download information or document URL found in the response.')
    }

    const fileUrl = download.document_url

    // Sanitize and create filename from clientName
    const baseName = 'analysis_report'
    const correctFileName = `${baseName}.pdf`

    // Download blob
    const fileBlobResponse = await Axios.get(fileUrl, {
      responseType: 'blob'
    })

    saveAs(fileBlobResponse.data, correctFileName)

    // Success notification
    ElNotification({
      title: 'Success',
      message: 'Analysis report downloaded successfully.',
      type: 'success',
      duration: 6000
    })
  } catch (error) {
    console.error('Download failed:', error)

    ElNotification({
      title: 'Error',
      message: 'Failed to download analysis. Please try again.',
      type: 'error',
      duration: 6000
    })
  }
}
</script>

<style scoped>
.custom-tabs {
  border-bottom: 2px solid #e0e0e0; /* Light grey underline */
  padding-bottom: 0;
  min-height: 32px;
}

.custom-tabs .v-tab {
  min-width: unset;
  text-transform: none;
  font-weight: 500;
  font-size: 14px;
  padding: 0 16px;
}

.custom-tabs .v-tab.v-tab--selected {
  font-weight: 600;
  color: #000;
}

.custom-tabs .v-tabs-bar {
  border-bottom: none;
}

.custom-tabs .v-tab--selected::after {
  content: '';
  display: block;
  height: 6px;
  background-color: #1a4cd8; /* Blue indicator */
  width: 100%;
  position: absolute;
  bottom: 0;
  left: 0;
}
.vdp-small {
  font-size: 0.8rem;
  max-width: 400px; /* adjust as needed */
}
.vdp-small .v-date-picker-table {
  padding: 8px;
}
.custom-btn {
  background-color: #1f5aa3;
}
.custom-tabs {
  background-color: #f0f4f8; /* Light background */
  border-radius: 1000px;

  max-width: fit-content;
  margin: auto;
}

.v-tab {
  text-transform: none !important;
}
</style>
