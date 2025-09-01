<template>
  <v-row>
    <v-col cols="12" lg="4">
      <v-card>
        <v-card-text>
          <div class="flex min-h-full flex-col justify-center px-3 lg:px-8 mx-auto">
            <div class="sm:w-full sm:max-w-sm">
              <h2 class="mt-10 text-center text-2xl/9 font-bold tracking-tight text-gray-900">
                Add a student
              </h2>
            </div>

            <div class="mt-10 sm:w-full sm:max-w-sm">
              <form @submit.prevent="submitForm" class="space-y-6">
                <!-- Full Name -->
                <div>
                  <label for="name" class="block text-sm/6 font-medium text-gray-900"
                    >Full name</label
                  >
                  <div class="mt-2">
                    <input
                      id="name"
                      v-model="newStudent.name"
                      type="text"
                      required
                      class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm/6"
                    />
                  </div>
                </div>

                <!-- Email -->
                <div>
                  <label for="email" class="block text-sm/6 font-medium text-gray-900">Email</label>
                  <div class="mt-2">
                    <input
                      id="email"
                      v-model="newStudent.email"
                      type="email"
                      required
                      class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm/6"
                    />
                  </div>
                </div>

                <!-- Age -->
                <div>
                  <label for="age" class="block text-sm/6 font-medium text-gray-900">Age</label>
                  <div class="mt-2">
                    <input
                      id="age"
                      v-model="newStudent.age"
                      type="number"
                      required
                      class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm/6"
                    />
                  </div>
                </div>

                <!-- Gender -->
                <div>
                  <label for="gender" class="block text-sm/6 font-medium text-gray-900"
                    >Gender</label
                  >
                  <div class="mt-2">
                    <select
                      id="gender"
                      v-model="newStudent.gender"
                      required
                      class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm/6"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                </div>

                <!-- Class -->
                <div>
                  <label for="studentClass" class="block text-sm/6 font-medium text-gray-900"
                    >Class</label
                  >
                  <div class="mt-2">
                    <input
                      id="studentClass"
                      v-model="newStudent.studentClass"
                      type="text"
                      required
                      class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm/6"
                    />
                  </div>
                </div>

                <!-- Profile Image -->
                <div>
                  <label for="profile_image" class="block text-sm/6 font-medium text-gray-900"
                    >Profile Image</label
                  >
                  <div class="mt-2">
                    <input
                      id="profile_image"
                      type="file"
                      @change="onFileChange"
                      required
                      class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm/6"
                    />
                  </div>
                </div>

                <!-- Submit Button -->
                <div>
                  <button
                    type="submit"
                    class="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  >
                    Add Student
                  </button>
                </div>
              </form>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import axios from 'axios'

interface StudentData {
  name: string
  email: string
  age: number | null
  gender: string
  studentClass: string
  profile_image: File | null
}

export default defineComponent({
  name: 'AddStudentComponent',
  setup() {
    const newStudent = ref<StudentData>({
      name: '',
      email: '',
      age: null,
      gender: '',
      studentClass: '',
      profile_image: null
    })

    // Handle file selection for profile image
    const onFileChange = (event: Event) => {
      const target = event.target as HTMLInputElement
      const file = target.files ? target.files[0] : null
      newStudent.value.profile_image = file
    }

    const submitForm = () => {
      if (!newStudent.value.profile_image) {
        console.error('Profile image is required')
        return // Prevent form submission if no profile image is selected
      }
      console.log('Adding new student request', newStudent.value)
      return ApiService.multipartPost('/api/students', newStudent.value)
        .then(({ data }) => {
          console.log('New student added', data)
        })
        .catch((error) => {
          console.error('An error occurred:', error)
        })
    }

    return {
      newStudent,
      onFileChange,
      submitForm
    }
  }
})

// Define ApiService for handling multipart POST requests
const ApiService = {
  multipartPost(url: string, data: Record<string, any>) {
    // Creating FormData object
    const formData = new FormData()

    // Appending parameters to FormData
    Object.keys(data).forEach((key) => {
      if (key === 'profile_image' && data[key] instanceof File) {
        formData.append(key, data[key]) // Handle the file field
      } else {
        formData.append(key, data[key])
      }
    })

    // Sending the POST request with multipart/form-data header
    return axios.post(`http://localhost:3000${url}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }
}
</script>

<style scoped>
/* Additional styling if needed */
</style>
