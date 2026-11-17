
<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goBack = () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/')
  }
}

const goHome = () => {
  router.push('/')
}
</script>

<template>
  <div class="forbidden-page">
    <div class="forbidden-card">

      <div class="icon-wrapper">
        <v-icon size="64" color="#27bfa0">
          mdi-shield-lock-outline
        </v-icon>
      </div>

      <div class="error-code">403</div>

      <h1>Access Forbidden</h1>

      <p class="description">
        Sorry, you don't have permission to access this page.
        Your account may not have the required privileges to view
        this resource.
      </p>

      <div class="actions">
        <v-btn
          color="#27bfa0"
          variant="flat"
          size="large"
          rounded="lg"
          @click="goHome"
        >
          <v-icon start>mdi-home-outline</v-icon>
          Go to Dashboard
        </v-btn>

        <v-btn
          variant="outlined"
          color="grey-darken-1"
          size="large"
          rounded="lg"
          @click="goBack"
        >
          <v-icon start>mdi-arrow-left</v-icon>
          Go Back
        </v-btn>
      </div>

      <div class="support-text">
        If you believe this is a mistake, please contact your administrator.
      </div>

    </div>
  </div>
</template>

<style scoped>
.forbidden-page {
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7f9;
  padding: 24px;
}

.forbidden-card {
  width: 100%;
  max-width: 520px;
  text-align: center;
  background: #ffffff;
  padding: 55px 35px;
  border-radius: 18px;
  box-shadow: 0 8px 35px rgba(0, 0, 0, 0.05);
}

.icon-wrapper {
  width: 110px;
  height: 110px;
  border-radius: 50%;
  background: rgba(39, 191, 160, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
}

.error-code {
  font-size: 76px;
  font-weight: 800;
  line-height: 1.1;
  color: #27bfa0;
  letter-spacing: -4px;
}

h1 {
  font-size: 25px;
  font-weight: 700;
  color: #202938;
  margin-top: 12px;
}

.description {
  color: #7b8491;
  font-size: 14px;
  line-height: 1.8;
  margin: 15px auto 28px;
  max-width: 390px;
}

.actions {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.support-text {
  border-top: 1px solid #edf0f2;
  margin-top: 35px;
  padding-top: 20px;
  color: #9aa1aa;
  font-size: 12px;
}

@media (max-width: 480px) {
  .forbidden-card {
    padding: 40px 20px;
  }

  .error-code {
    font-size: 62px;
  }

  h1 {
    font-size: 21px;
  }

  .actions {
    flex-direction: column;
  }

  .actions :deep(.v-btn) {
    width: 100%;
  }
}
</style>
