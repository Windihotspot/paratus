
<script setup>
import { ref, onMounted } from 'vue'
import SidebarView from './sidebar/SidebarView.vue'
import HeaderView from './header/HeaderView.vue'

const drawer = ref(true)

onMounted(() => {
  drawer.value = window.innerWidth >= 950
})
</script>

<template>
  <v-layout class="main-layout">

    <!-- Header -->
    <v-app-bar
      elevation="1"
      class="main-header"
      height="68"
    >
      <v-btn
        class="hidden-md-and-up"
        icon
        variant="text"
        @click="drawer = !drawer"
      >
        <v-icon>mdi-menu</v-icon>
      </v-btn>

      <img
        src="/src/assets/New Logo_with_Paratus.png"
        alt="Logo"
        class="header-logo hidden-sm-and-down"
      />

      <div class="logo-section hidden-sm-and-down">
        <img
          src="@/assets/paratus-logo.jpeg"
          alt="Paratus"
        />

        <span>Powered By: Uppertech One Ltd</span>
      </div>

      <v-spacer />

      <HeaderView />
    </v-app-bar>

    <!-- Sidebar -->
    <v-navigation-drawer
      v-model="drawer"
      location="left"
      :permanent="$vuetify.display.mdAndUp"
      :temporary="$vuetify.display.mdAndDown"
      width="220"
      elevation="1"
      class="side-bar"
    >
      <SidebarView />
    </v-navigation-drawer>

    <!-- Main Content -->
    <v-main class="page-wrapper">
      <div class="page-content">
        <slot />
      </div>
    </v-main>

  </v-layout>
</template>

<style scoped>
.main-layout {
  min-height: 100vh;
  background: #f5f7f9;
}

.main-header {
  z-index: 10;
}

.header-logo {
  width: 75px;
  height: 55px;
  object-fit: contain;
  margin-right: 15px;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 14px;
}

.logo-section img {
  width: 75px;
  height: 48px;
  object-fit: contain;
}

.logo-section span {
  font-size: 13px;
  color: #6b7280;
}

.side-bar {
  overflow-y: auto;
}

.page-wrapper {
  background-color: #f5f7f9;
  min-width: 0;
}

.page-content {
  width: 100%;
  min-height: 100%;
  padding: 16px;
  box-sizing: border-box;
}

@media (max-width: 600px) {
  .page-content {
    padding: 10px;
  }
}
</style>
