<template>
  <v-row>
    <v-col cols="12" lg="4">
      <v-card>
        <!-- <img
          style="width: 100%"
          src="@/assets/images/background/u1.jpg"
        /> -->
        <v-card-text>
          <h5 class="title font-weight-medium mb-2 text-h6">0.7568 BTC</h5>
          <p class="mb-3 text-body-2 text-grey-darken-1">BTC/USD</p>

          <div>
            <apexchart
              type="area"
              height="180px"
              :options="bitcoinOverviewData.chartOptions"
              :series="bitcoinOverviewData.series"
            ></apexchart>
          </div>

          <div class="icon-box">
            <div class="coin-icon">
              <img src="/src/assets/img/crypto-icon/bitcoin.png" alt="" />
            </div>

            <div class="icon-text">
              <p>BTC/USD</p>
              <p>+56%</p>
            </div>
          </div>
          <!-- <v-btn depressed color="warning">Learn More</v-btn> -->
        </v-card-text>
      </v-card>
    </v-col>

    <v-col cols="12" lg="4">
      <v-card>
        <!-- <img
          style="width: 100%"
          src="@/assets/images/background/u1.jpg"
        /> -->
        <v-card-text>
          <h5 class="title font-weight-medium mb-2 text-h6">0.328 ETH</h5>
          <p class="mb-3 text-body-2 text-grey-darken-1">ETH/USD</p>

          <div>
            <apexchart
              type="area"
              height="180px"
              :options="bitcoinOverviewData.chartOptions"
              :series="bitcoinOverviewData.series"
            ></apexchart>
          </div>

          <div class="icon-box">
            <div class="coin-icon">
              <img src="/src/assets/img/crypto-icon/eth-icon.png" alt="" />
            </div>

            <div class="icon-text">
              <p>ETH/USD</p>
              <p>+13%</p>
            </div>
          </div>
          <!-- <v-btn depressed color="warning">Learn More</v-btn> -->
        </v-card-text>
      </v-card>
    </v-col>

    <v-col cols="12" lg="4">
      <v-card>
        <!-- <img
          style="width: 100%"
          src="@/assets/images/background/u1.jpg"
        /> -->
        <v-card-text>
          <h5 class="title font-weight-medium mb-2 text-h6">0.71234 BNB</h5>
          <p class="mb-3 text-body-2 text-grey-darken-1">BNB/USD</p>

          <div>
            <apexchart
              type="area"
              height="180px"
              :options="bitcoinOverviewData.chartOptions"
              :series="bitcoinOverviewData.series"
            ></apexchart>
          </div>

          <div class="icon-box">
            <div class="coin-icon">
              <img src="/src/assets/img/crypto-icon/bnb-icon.png" alt="" />
            </div>

            <div class="icon-text">
              <p>BNB/USD</p>
              <p>-18%</p>
            </div>
          </div>
          <!-- <v-btn depressed color="warning">Learn More</v-btn> -->
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, reactive } from 'vue'
import { BitcoinOverviewData as initialData } from './coin-data.ts'
import VueApexCharts from 'vue3-apexcharts'

export default defineComponent({
  components: {
    apexchart: VueApexCharts
  },
  setup() {
    const elementVisible = ref(false)

    const bitcoinOverviewData = reactive(initialData)

    onMounted(() => {
      setTimeout(() => (elementVisible.value = true), 10)
    })

    return {
      bitcoinOverviewData,
      elementVisible
    }
  }
})
</script>

<style scoped>
.icon-box {
  width: 100px;
  display: flex;
  justify-content: space-between;
}
</style>
