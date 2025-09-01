<template>
  <v-card flat class="w-100 h-100">
    <v-card-text>
      <div class="d-sm-flex align-center">
        <div>
          <h2 class="title text-h6 font-weight-medium">Transactions</h2>
        </div>
        <v-spacer></v-spacer>
        <div class="ml-auto">
          <!-- 
          <v-select
            v-model="select"
            :items="items"
            variant="outlined"
            dense
            hide-details
          ></v-select> 
          -->
        </div>
      </div>

      <div class="mt-4" style="position: relative">
        <!-- <div style="position: sticky; top: 0; background: white; z-index: 1">
          <div class="d-flex justify-between py-2 px-3">
            <span class="font-weight-medium text-subtitle-1">Description</span>
            <span class="font-weight-medium text-subtitle-1">Amount</span>
          </div>
        </div> -->
        <div style="max-height: 300px; overflow-y: auto">
          <v-list>
            <template v-for="transaction in transactionsTable" :key="transaction.id">
              <v-list-item>
                <v-list-item-content>
                  <v-list-item-title class="font-weight-medium">
                    {{ transaction.description }}
                  </v-list-item-title>
                  <v-list-item-subtitle>{{ transaction.date_and_time }}</v-list-item-subtitle>
                </v-list-item-content>
                <v-list-item-content class="d-flex justify-end">
                  <v-chip
                    :color="getAmountColor(transaction.status, transaction.amount)"
                    size="small"
                    label
                  >
                    {{ transaction.amount }}
                  </v-chip>
                </v-list-item-content>
              </v-list-item>
            </template>
          </v-list>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'

export default defineComponent({
  methods: {
    getStatusColor(status: string) {
      switch (status) {
        case 'Completed':
          return 'green'
        case 'Pending':
          return 'yellow'
        case 'Failed':
          return 'red'
        case 'In Progress':
          return 'blue'
        default:
          return 'grey'
      }
    },
    getAmountColor(status: string, amount: string) {
      if (status === 'Pending') {
        return 'yellow' // Pending status
      }
      const numericAmount = parseFloat(amount.replace(/[^0-9.-]+/g, ''))
      if (numericAmount > 0) {
        return 'green' // Positive amount
      } else if (numericAmount < 0) {
        return 'red' // Negative amount
      } else {
        return 'grey' // Zero or any other case
      }
    }
  },
  setup() {
    const select = ref('March')
    const items = ref(['March', 'April', 'May', 'June'])
    const transactionsTable = ref([
      {
        id: 1,
        amount: '+$120.50',
        date_and_time: '2024-06-01 10:30:00',
        status: 'Completed',
        payment_type: 'Credit Card',
        description: 'Buy ETH'
      },
      {
        id: 2,
        amount: '$250.00',
        date_and_time: '2024-06-02 14:15:00',
        status: 'Pending',
        payment_type: 'Bank Transfer',
        description: 'Payment for subscription'
      },
      {
        id: 3,
        amount: '$75.00',
        date_and_time: '2024-06-03 09:45:00',
        status: 'Failed',
        payment_type: 'PayPal',
        description: 'transfer'
      },
      {
        id: 4,
        amount: '+$980.00',
        date_and_time: '2024-06-04 16:00:00',
        status: 'Completed',
        payment_type: 'Credit Card',
        description: 'Buy BTC'
      },
      {
        id: 5,
        amount: '-$320.75',
        date_and_time: '2024-06-05 11:20:00',
        status: 'In Progress',
        payment_type: 'Debit Card',
        description: 'Sell BTC'
      }
    ])

    return {
      select,
      items,
      transactionsTable
    }
  }
})
</script>

<style scoped>
/* Add any necessary styles for your component here */
</style>
