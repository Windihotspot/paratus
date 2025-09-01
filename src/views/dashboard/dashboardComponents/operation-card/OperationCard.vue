<template>
  <v-card>
    <v-card-title>Buy Coins</v-card-title>
    <v-card-text>
      <v-form @submit.prevent="handleSubmit">
        <v-container>
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                class="glow-border"
                v-model.number="usdAmount"
                label="USD Amount"
                type="number"
                required
                variant="outlined"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-select
                class="glow-border"
                v-model="selectedCoin"
                :items="coinOptions"
                label="Select Coin"
                required
                variant="outlined"
              ></v-select>
            </v-col>
          </v-row>
          <v-row>
            <v-col>
              <v-btn type="submit" color="primary">Calculate</v-btn>
            </v-col>
          </v-row>
          <v-row>
            <v-col>
              <v-btn v-if="resultMessage" variant="outlined" color="success">{{
                resultMessage
              }}</v-btn>
            </v-col>
          </v-row>
        </v-container>
      </v-form>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'

export default defineComponent({
  name: 'BuyCoins',
  setup() {
    const usdAmount = ref<number>(0)
    const selectedCoin = ref<string>('')
    const bitcoinPrice = 40000
    const etheriumPrice = 5000
    const resultMessage = ref<string>('')

    const coinOptions = ['Bitcoin', 'Etherium']

    const handleSubmit = () => {
      if (usdAmount.value > 0 && selectedCoin.value) {
        let coinValue = 0
        if (selectedCoin.value === 'Bitcoin') {
          coinValue = usdAmount.value / bitcoinPrice
        } else if (selectedCoin.value === 'Etherium') {
          coinValue = usdAmount.value / etheriumPrice
        }

        resultMessage.value = `
            $${usdAmount.value} USD is equal to ${coinValue.toFixed(8)} ${selectedCoin.value}.
          `
      } else {
        resultMessage.value = 'Please enter valid amount and select a coin.'
      }
    }

    return {
      usdAmount,
      selectedCoin,
      coinOptions,
      handleSubmit,
      resultMessage
    }
  }
})
</script>

<style scoped>
/* Add any custom styles here */
.glow-border input:focus,
.glow-border .v-select__slot:focus {
  border-color: yellow; /* Change this to your desired glow color */
  box-shadow: 0 0 10px rgba(255, 1, 1, 0.2); /* Optional: Adds a shadow for more pronounced effect */
}
</style>
