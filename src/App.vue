
<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useAuthStore } from '../src/stores/auth.js'

const authStore = useAuthStore()
authStore.init()
</script>

<template>
  <v-app>
    <main class="text-neutral-800">
      <RouterView />
    </main>
  </v-app>
</template>

<style>
.custom-btn {
  background-color: #27bfa0;
}
</style>
