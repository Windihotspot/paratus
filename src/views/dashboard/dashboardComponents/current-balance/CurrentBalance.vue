<script lang="ts">
import { defineComponent } from 'vue'
import { ref, onMounted, reactive } from 'vue'
import { currentBalanceOverviewData as initialData } from './current-balance.ts'
import VueApexCharts from 'vue3-apexcharts'

export default defineComponent({
  components: {
    apexchart: VueApexCharts
  },
  setup() {
    const elementVisible = ref(false)
    const currentBalanceOverviewData = reactive(initialData)

    onMounted(() => {
      setTimeout(() => (elementVisible.value = true), 10)
    })

    return {
      elementVisible,
      currentBalanceOverviewData
    }
  }
})
</script>

<template>
  <v-row>
    <v-col cols="12">
      <v-card>
        <div class="chart">
          <v-card-text>
            <v-row>
              <v-col cols="12" md="6">
                <div v-show="elementVisible">
                  <apexchart
                    :options="currentBalanceOverviewData.chartOptions"
                    :series="currentBalanceOverviewData.series"
                    type="donut"
                    height="350"
                  ></apexchart>
                </div>
                <v-card-subtitle class="text-center mt-4">
                  <h5>
                    Total Balance: ${{
                      currentBalanceOverviewData.totalBalance.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })
                    }}
                  </h5>
                </v-card-subtitle>
              </v-col>
              <v-col cols="12" md="6"> </v-col>
            </v-row>
          </v-card-text>
        </div>
      </v-card>
    </v-col>
  </v-row>
</template>
