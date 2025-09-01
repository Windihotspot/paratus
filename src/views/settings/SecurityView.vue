<script lang="ts">
import { defineComponent } from 'vue'
import { ref } from 'vue'
export default defineComponent({
  setup() {
    const history = ref([
      {
        type: 'credential login',
        address: '159.12.123.212',
        agent: 'Chrome, Mac'
      },
      {
        type: 'credential login',
        address: '159.12.123.212',
        agent: 'Chrome, Mac'
      }
    ])

    return {
      history
    }
  }
})
</script>

<template>
  <v-row>
    <!-- Security start -->

    <!-- Change password start -->
    <v-col cols="12" lg="12">
      <v-card>
        <v-card-title>Change password</v-card-title>
        <v-card-text>
          <form class="max-w-sm">
            <div class="mb-5">
              <label
                for="email"
                class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >Old password</label
              >
              <input
                type="password"
                id="email"
                class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="********"
                required
              />
            </div>
            <div class="mb-5">
              <label
                for="email"
                class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >New password</label
              >
              <input
                type="password"
                id="email"
                aria-describedby="helper-text-explanation"
                class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder=""
              />
            </div>
            <div class="mb-5">
              <label
                for="email"
                class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >Re-type new password</label
              >
              <input
                type="password"
                id="email"
                aria-describedby="helper-text-explanation"
                class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder=""
              />
            </div>

            <button
              type="submit"
              class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
            >
              Update
            </button>
          </form>
        </v-card-text>
      </v-card>
    </v-col>
    <!-- Change password end -->

    <!-- Authenticator start -->
    <v-col cols="12" sm="12" lg="6">
      <v-card>
        <v-card-title>Authenticator app</v-card-title>
        <v-card-text> </v-card-text>
      </v-card>
    </v-col>
    <!-- Authenticator end -->

    <!-- Text message start -->
    <v-col cols="12" sm="12" lg="6">
      <v-card>
        <v-card-title>Text message</v-card-title>
        <v-card-text> </v-card-text>
      </v-card>
    </v-col>
    <!-- Text message end -->

    <!-- Login history start -->
    <v-col cols="12" sm="12" lg="12">
      <v-card>
        <v-card-title>Login history</v-card-title>
        <v-card-text>
          <div>
            <!-- <p class="text-subtitle-1 text-grey-darken-1">
              Use the fixed-header prop together with the height prop to fix the header to the top
              of the table.
            </p> -->
            <div class="mt-4">
              <v-table fixed-header>
                <thead>
                  <tr>
                    <th class="text-left">Login Type</th>
                    <th class="text-left">IP address</th>
                    <th class="text-left">User agent</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in history" :key="item.type">
                    <td>{{ item.type }}</td>
                    <td>{{ item.address }}</td>
                    <td>{{ item.agent }}</td>
                  </tr>
                </tbody>
              </v-table>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-col>
    <!-- Login history end -->

    <!-- Security end -->
  </v-row>
</template>
