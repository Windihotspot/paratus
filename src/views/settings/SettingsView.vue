<template>
  <div class="settings-page">

    <router-view />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'


export default defineComponent({
 
})
</script>

<style scoped>
.settings-page {
  display: flex;
}
.settings-sidebar {
  width: 250px;
}
</style>
