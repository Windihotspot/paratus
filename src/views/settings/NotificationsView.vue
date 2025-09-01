<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  setup() {}
})
</script>
<template>
  <v-row>
    <!-- Email notifications start -->
    <v-col cols="12" lg="8">
      <v-card>
        <v-card-title>Email</v-card-title>
        <v-card-text>
          <div class="content">
            <div>
              <v-list>Product updates</v-list>
            </div>

            <div class="">
              <v-switch label="Switch"></v-switch>
            </div>
          </div>

          <div class="content">
            <div>
              <v-list>Security updates</v-list>
            </div>

            <div class="">
              <v-switch label="Switch"></v-switch>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-col>
    <!-- Email notifications end -->

    <!-- Phone start -->
    <v-col cols="12" lg="8">
      <v-card>
        <v-card-title>Privacy</v-card-title>
        <v-card-text>
          <div class="content">
            <div>
              <v-list>Security updates</v-list>
            </div>

            <div class="">
              <v-switch label="Switch"></v-switch>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-col>
    <!-- Phone end -->
  </v-row>
</template>
