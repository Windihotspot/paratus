<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'AccountView',
  setup() {}
})
</script>

<template>
  <v-row>
    <!-- Basic details start-->
    <v-col cols="12" lg="12">
      <v-card>
        <v-card-title class="">
          <i class="fa-regular fa-user"></i>
          Basic details</v-card-title
        >

        <v-card-text>
          <div>
            <div class="avatar">
              <div class="image">
                <v-avatar size="98px">
                  <img src="@/assets/images/users/user2.jpg" alt="Julia" />
                </v-avatar>
              </div>
              <!-- <div class="details">
              <h1>Sofia Rivers</h1>
              <h1>Sofia@devias</h1>
            </div> -->
            </div>
          </div>
          <form class="max-w-full">
            <!-- Full name start -->
            <div class="mb-5">
              <label
                for="email"
                class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >Full name</label
              >
              <input
                type="email"
                id="email"
                class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="Enter your full name"
                required
              />
            </div>
            <!-- Full name end -->

            <!-- Email start -->
            <div class="mb-5">
              <label
                for="email"
                class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >Your email</label
              >
              <input
                type="email"
                id="email"
                aria-describedby="helper-text-explanation"
                class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="name@example.com"
              />

              <p id="helper-text-explanation" class="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Please
                <a href="#" class="font-medium text-blue-600 hover:underline dark:text-blue-500"
                  >contact us</a
                >. to share your email
              </p>
            </div>
            <!-- Email end -->

            <!-- Dial code start -->
            <div class="mb-5">
              <v-select
                label="Dial Code"
                :items="['California', 'Colorado', 'Florida', 'Georgia', 'Texas', 'Wyoming']"
                variant="outlined"
              >
                <input
                  type="email"
                  id="email"
                  aria-describedby="helper-text-explanation"
                  class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder=""
                />
              </v-select>
            </div>
            <!-- Dial code end -->

            <div class="mb-5">
              <div class="number mb-5">
                <label
                  for="email"
                  class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >Phone number</label
                >
                <input
                  type="email"
                  id="email"
                  aria-describedby="helper-text-explanation"
                  class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="Phone number"
                />
              </div>

              <div class="biography">
                <label
                  for="email"
                  class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >Biography(optional)</label
                >
                <input
                  type="email"
                  id="email"
                  aria-describedby="helper-text-explanation"
                  class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="Describe yourself"
                />
              </div>
            </div>

            <div class="actions-container">
              <div class="actions">
                <!-- Discard start -->
                <button
                  type="submit"
                  class="mr-6 text-white bg-tomatoColor hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                >
                  Cancel
                </button>
                <!-- Discard end -->

                <!-- Save changes start -->
                <button
                  type="submit"
                  class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                >
                  Save changes
                </button>
              </div>
            </div>
          </form>
        </v-card-text>
      </v-card>
    </v-col>
    <!-- Basic details end -->

    <!-- Theme options start -->
    <v-col cols="12" lg="12">
      <v-card>
        <v-card-title>Theme options</v-card-title>
        <v-card-text>
          <div
            class="w-full text-gray-900 bg-white border border-gray-200 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <ul
              class="w-full text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <li
                class="w-full px-4 py-2 border-b border-gray-200 rounded-t-lg dark:border-gray-600"
              >
                <div class="light-mode">
                  <div class="icon-text">
                    <i class="fas fa-sun"></i>

                    Light Mode
                  </div>

                  <div class="checkbox">
                    <input type="checkbox" value="" />
                  </div>
                </div>
              </li>
              <li class="w-full px-4 py-2 border-b border-gray-200 dark:border-gray-600">
                <i class="fas fa-moon"></i>

                Dark mode
              </li>
              <li class="w-full px-4 py-2 border-b border-gray-200 dark:border-gray-600">
                <i class="fas fa-adjust"></i>

                System
              </li>
            </ul>
          </div>
        </v-card-text>
      </v-card>
    </v-col>
    <!-- Theme options end -->

    <!-- Privacy start -->
    <v-col cols="12" lg="8">
      <v-card>
        <v-card-title>Privacy</v-card-title>
        <v-card-text>
          <div class="content">
            <div>
              <v-list>Make content info public</v-list>
            </div>

            <div class="">
              <v-switch label="Switch"></v-switch>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-col>
    <!-- Privacy end -->

    <!-- Delete account start -->
    <v-col cols="12" lg="8">
      <v-card>
        <v-card-title>Delete your account</v-card-title>
        <v-card-text>
          <div class="content">
            <div>
              <p>Delete your account, this action is irreversible</p>
            </div>

            <div class="">
              <v-btn variant="outlined" color="error" class="mb-4 pr-4"> Delete account </v-btn>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-col>
    <!-- Delete account end -->
  </v-row>
</template>

<style scoped>
.avatar {
  margin: 20px;
}
.actions-container {
  display: flex;
  justify-content: flex-end;
}
</style>
