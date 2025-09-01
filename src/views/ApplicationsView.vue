<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElNotification, ElMessage } from 'element-plus'
import CameraCapture from '@/components/CameraCapture.vue'
const router = useRouter()
import DocumentUploader from '@/components/DocumentUploader.vue'

const employmentOffer = ref(null)
const payslip = ref(null)
const utilityBill = ref(null)
const additionalDoc = ref(null)


// Form data

const steps = ref([
  { title: 'Loan information', icon: 'fa-home', status: 'active' },
  { title: 'Personal information', icon: 'fa-user', status: 'pending' },
  { title: 'BVN and ID Validation', icon: 'fa-id-card', status: 'pending' },
  { title: 'Employment Details', icon: 'fa-briefcase', status: 'pending' },
  { title: 'Documents', icon: 'fa-file', status: 'pending' },
  { title: 'Bank Statement', icon: 'fa-university', status: 'pending' }
])

// Steps and forms
const currentStep = ref(0)

// Navigation Methods
// Validation rules
const required = (v) => !!v || 'This field is required'

// Navigation logic
const nextStep = () => {
  if (currentStep.value < steps.value.length - 1) {
    steps.value[currentStep.value].status = 'complete'
    currentStep.value++
    steps.value[currentStep.value].status = 'active'
  }
}

const prevStep = () => {
  if (currentStep.value > 0) {
    steps.value[currentStep.value].status = 'pending'
    currentStep.value--
    steps.value[currentStep.value].status = 'active'
  }
}
</script>

<template>
  <div class="flex h-screen">
    <!-- Sidebar -->
    <div
      class="w-1/5 h-screen mx-auto items-center bg-[#1f5aa3] p-6 shadow-lg flex flex-col gap-y-8"
    >
      <div class="mt-8 h-screen">
        <!-- Logo -->
        <div class="mb-8">
          <img src="/src/assets/logo.png" alt="Logo" class="w-10 h-10 object-contain" />
        </div>
        <ul class="space-y-6">
          <li
            v-for="(step, index) in steps"
            :key="index"
            class="flex items-start space-x-3"
            :class="index <= currentStep ? 'text-white' : 'text-gray-400'"
          >
            <i
              :class="[
                'fas',
                step.icon,
                'text-lg mt-1',
                index === currentStep ? 'text-white' : 'text-white'
              ]"
            ></i>
            <div>
              <p :class="[index === currentStep ? 'font-semibold' : '']">{{ step.title }}</p>
              <p class="text-sm text-gray-400">{{ step.description }}</p>
            </div>
          </li>
        </ul>
      </div>
    </div>

    <!-- Main Content -->
    <div class="flex-1 p-10 overflow-auto my-auto">
      <div class="max-w-xl mx-auto space-y-4">
        <h2 class="text-2xl font-semibold">{{ steps[currentStep].title }}</h2>

        <!-- Step 1: Loan informayion -->
        <v-form v-if="currentStep === 0">
          <h2 class="text-blue-900 font-semibold">STEP 1/6</h2>
          <label for="">How much loan do you need</label>
          <v-text-field
            variant="outlined"
            color="#1f5aa3"
            placeholder="Enter the amount you need"
            :rules="[required]"
          />

          <label for="">How long do you want to repay for</label>
          <v-text-field
            variant="outlined"
            color="#1f5aa3"
            placeholder="Select Tenor"
            :rules="[required]"
          />
          <label for="">What is the purpose of this loan</label>
          <v-text-field
            variant="outlined"
            color="#1f5aa3"
            placeholder="Enter the reason for this loan"
            :rules="[required]"
          />
        </v-form>

        <!-- Step 2: Personal information -->
        <v-form v-if="currentStep === 1">
          <h2 class="text-blue-900 font-semibold">STEP 2/6</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="">First name</label>
              <v-text-field
                variant="outlined"
                color="#1f5aa3"
                placeholder="Enter first name"
                :rules="[required]"
              />
            </div>
            <div>
              <label for="">Other name</label>
              <v-text-field variant="outlined" color="#1f5aa3" placeholder="Enter other names" />
            </div>

            <div>
              <label for="">Last name</label>
              <v-text-field
                variant="outlined"
                color="#1f5aa3"
                placeholder="Enter last name"
                :rules="[required]"
              />
            </div>
            <div>
              <label for="">Date of birth</label>
              <v-text-field variant="outlined" color="#1f5aa3" placeholder="Select date" />
            </div>

            <div>
              <label for="">Mobile number</label>
              <v-text-field
                variant="outlined"
                color="#1f5aa3"
                placeholder="Enter mobile number"
                :rules="[required]"
              />
            </div>
            <div>
              <label for="">Gender</label>
              <v-text-field variant="outlined" color="#1f5aa3" placeholder="Select gender" />
            </div>

            <div>
              <label for="">State of residence</label>
              <v-text-field
                variant="outlined"
                color="#1f5aa3"
                placeholder="Select state"
                :rules="[required]"
              />
            </div>
            <div>
              <label for="">Local Government Area</label>
              <v-text-field
                variant="outlined"
                color="#1f5aa3"
                placeholder="Select local govt area"
              />
            </div>
          </div>

          <div class="mt-4">
            <div>
              <label for="">Email address</label>
              <v-text-field
                variant="outlined"
                color="#1f5aa3"
                placeholder="Enter email address"
                :rules="[required]"
              />
            </div>
            <div class="mt-4">
              <label for="">Home address</label>
              <v-text-field
                variant="outlined"
                color="#1f5aa3"
                placeholder="Enter home address"
                :rules="[required]"
              />
            </div>
          </div>
        </v-form>

        <!-- Step 3: BVN and ID Validation -->
        <v-form v-if="currentStep === 2" class="text-center space-y-4">
          <h2 class="text-blue-900 font-semibold">STEP 3/6</h2>
          <label for="">Bank Verification Number</label>
          <v-text-field
            variant="outlined"
            color="#1f5aa3"
            placeholder="Enter BVN"
            :rules="[required]"
          />
          <label for="">National identity number</label>
          <v-text-field
            variant="outlined"
            color="#1f5aa3"
            placeholder="Enter NIN"
            :rules="[required]"
          />

          <!-- Camera Capture After ID Inputs -->
          <div class="mt-4">
            <CameraCapture />
          </div>
        </v-form>

       
        <!-- Step 4: Employment Information -->
        <v-form v-if="currentStep === 3">
          <div class="text-center mb-6">
            <h2 class="text-blue-900 font-semibold">STEP 4/6</h2>
            <h3 class="text-2xl font-semibold mt-2">Employment Information</h3>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Employer Name -->
            <div>
              <label for="">Employer name</label>
              <v-text-field
                variant="outlined"
                placeholder="Enter employer name"
                color="#1f5aa3"
                :rules="[required]"
              />
            </div>

            <!-- Employment Type -->
            <div>
              <label for="">Employment type</label>
              <v-text-field
                variant="outlined"
                placeholder="Select employment type"
                color="#1f5aa3"
                :rules="[required]"
              />
            </div>

            <!-- Sector -->
            <div>
              <label for="">Sector</label>
              <v-text-field
                variant="outlined"
                placeholder="Select sector"
                color="#1f5aa3"
                :rules="[required]"
              />
            </div>

            <!-- Employment Start Date -->
            <div>
              <label for="">Employment start date</label>
              <v-text-field
                variant="outlined"
                placeholder="Select date"
                color="#1f5aa3"
                :append-inner-icon="'mdi-calendar'"
                :rules="[required]"
              />
            </div>

            <!-- Net Income -->
            <div>
              <label for="">Net income</label>
              <v-text-field
                variant="outlined"
                placeholder="Enter net income"
                color="#1f5aa3"
                :rules="[required]"
              />
            </div>

            <!-- Designation -->
            <div>
              <label for="">Designation</label>
              <v-text-field
                variant="outlined"
                placeholder="Select designation"
                color="#1f5aa3"
                :rules="[required]"
              />
            </div>
          </div>

          <!-- Work Email -->
          <div class="mt-4">
            <label for="">Work email</label>
            <v-text-field
              variant="outlined"
              placeholder="Enter your work email"
              color="#1f5aa3"
              :rules="[required]"
            />
          </div>

          <!-- Employer Address -->
          <div class="mt-4">
            <label for="">Employer address</label>
            <v-text-field
              variant="outlined"
              placeholder="Enter address"
              color="#1f5aa3"
              :rules="[required]"
            />
          </div>

          <!-- State and LGA -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label for="">State of Residence</label>
              <v-text-field
                variant="outlined"
                placeholder="Select state"
                color="#1f5aa3"
                :rules="[required]"
              />
            </div>

            <div>
              <label for="">Local Govt. Area</label>
              <v-text-field
                variant="outlined"
                placeholder="Select local govt. area"
                color="#1f5aa3"
                :rules="[required]"
              />
            </div>
          </div>
        </v-form>

        <!--step 5 Documents -->
        <v-form v-if="currentStep === 4">
          <div class="max-w-4xl mx-auto py-10">
            <h2 class="text-center text-sm text-blue-700 font-semibold mb-2">STEP 5/6</h2>
            <h1 class="text-center text-2xl font-semibold mb-10">Employment Documents</h1>

            <div class="grid grid-cols-1 gap-6">
              <DocumentUploader label="Employment offer" v-model="employmentOffer" />
              <DocumentUploader label="Payslip" v-model="payslip" />
              <DocumentUploader label="Utility bill" v-model="utilityBill" />
              <DocumentUploader label="Additional document" v-model="additionalDoc" />
            </div>
          </div>
        </v-form>

        <!-- Navigation Buttons -->
        <div class="flex justify-between mt-4">
          <!-- Previous Button -->
          <v-btn variant="text" color="primary" :disabled="currentStep === 0" @click="prevStep">
            <i class="fas fa-arrow-left mr-2"></i>
            Previous
          </v-btn>

          <!-- Continue Button -->
          <v-btn v-if="currentStep < steps.length - 1" color="primary" @click="nextStep">
            Continue
            <i class="fas fa-arrow-right ml-2"></i>
          </v-btn>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.v-text-field {
  margin-top: 10px;
}
.v-btn {
  text-transform: none;
}
</style>
