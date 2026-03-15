<script setup>
import { ref, onMounted } from 'vue'
import { ElNotification, ElMessage } from 'element-plus'
import MainLayout from '@/layouts/full/MainLayout.vue'
import { supabase } from '@/services/supabase.js'

const banks = ref([])
const loading = ref(false)

const showModal = ref(false)
const showDeleteModal = ref(false)

const isEditing = ref(false)
const editingBankId = ref(null)

const bankToDelete = ref(null)

const formRef = ref(null)
const valid = ref(false)

const bankForm = ref({
  name: ''
})

/* ------------------------
FETCH BANKS
-------------------------*/
const fetchBanks = async () => {
  loading.value = true

  const { data, error } = await supabase
    .from('banks')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) console.error(error)
  else banks.value = data

  loading.value = false
}

/* ------------------------
OPEN MODAL
-------------------------*/
const openBankModal = (bank = null) => {
  if (bank) {
    isEditing.value = true
    editingBankId.value = bank.id
    bankForm.value = {
      name: bank.name
    }
  } else {
    isEditing.value = false
    editingBankId.value = null
    bankForm.value = {
      name: ''
    }
  }

  showModal.value = true
}

/* ------------------------
CLOSE MODAL
-------------------------*/
const closeBankModal = () => {
  showModal.value = false
  isEditing.value = false
  editingBankId.value = null

  if (formRef.value) formRef.value.reset()

  bankForm.value = {
    name: ''
  }
}

/* ------------------------
SUBMIT BANK
-------------------------*/
const submitBank = async () => {
  if (!formRef.value) return

  const formValid = await formRef.value.validate()

  if (!formValid) {
    ElMessage({
      message: 'Please fix form errors',
      type: 'error'
    })
    return
  }

  loading.value = true

  try {
    let error

    if (isEditing.value) {
      ;({ error } = await supabase
        .from('banks')
        .update({
          name: bankForm.value.name
        })
        .eq('id', editingBankId.value))
    } else {
      ;({ error } = await supabase.from('banks').insert({
        name: bankForm.value.name
      }))
    }

    if (error) throw error

    ElNotification({
      title: 'Success',
      message: isEditing.value ? 'Bank updated successfully' : 'Bank added successfully',
      type: 'success'
    })

    closeBankModal()
    fetchBanks()
  } catch (err) {
    ElNotification({
      title: 'Error',
      message: err.message,
      type: 'error'
    })
  } finally {
    loading.value = false
  }
}

/* ------------------------
DELETE BANK
-------------------------*/
const openDeleteModal = (bank) => {
  bankToDelete.value = bank
  showDeleteModal.value = true
}

const cancelDelete = () => {
  showDeleteModal.value = false
  bankToDelete.value = null
}

const confirmDelete = async () => {
  if (!bankToDelete.value) return

  loading.value = true

  try {
    // Check if bank is used in facilities
    const { data: facilities, error: facilityError } = await supabase
      .from('bank_facilities')
      .select('id')
      .eq('bank_id', bankToDelete.value.id)

    if (facilityError) throw facilityError

    if (facilities.length > 0) {
      ElNotification({
        title: 'Cannot Delete',
        message: 'This bank is already used in one or more facilities.',
        type: 'warning'
      })

      loading.value = false
      return
    }

    // If not used, perform delete
    const { error } = await supabase.from('banks').delete().eq('id', bankToDelete.value.id)

    if (error) throw error

    ElNotification({
      title: 'Deleted',
      message: 'Bank deleted successfully',
      type: 'success'
    })

    fetchBanks()
  } catch (err) {
    ElNotification({
      title: 'Error',
      message: err.message,
      type: 'error'
    })
  } finally {
    showDeleteModal.value = false
    bankToDelete.value = null
    loading.value = false
  }
}

onMounted(fetchBanks)
</script>

<template>
  <MainLayout>
    <div>
      <!-- Header -->
      <div class="bg-white flex rounded shadow justify-between items-center border-b p-4 mb-4">
        <div>
          <h1 class="text-xl font-bold">Banks</h1>
          <p class="text-sm text-gray-500">Manage banks in the system</p>
        </div>

        <v-btn @click="openBankModal()" class="custom-btn text-white">
          <i class="fas fa-plus mr-2"></i>
          Add Bank
        </v-btn>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex justify-center p-10">
        <v-progress-circular indeterminate />
      </div>

      <!-- Table -->
      <div v-else class="bg-white shadow rounded">
        <table class="min-w-full">
          <thead class="bg-green-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs uppercase">Bank</th>
              <th class="px-6 py-3 text-center text-xs uppercase">Actions</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="bank in banks" :key="bank.id" class="border-b border-gray-200">
              <td class="px-6 py-4">
                {{ bank.name }}
              </td>

              <td class="px-6 py-4 text-center space-x-8">
                <button @click="openBankModal(bank)" class="text-indigo-600">
                  <i class="fas fa-edit"></i>
                </button>

                <button @click="openDeleteModal(bank)" class="text-red-600">
                  <i class="fas fa-trash"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ADD / EDIT MODAL -->
      <v-dialog v-model="showModal" max-width="500px">
        <v-card>
          <v-card-title>
            {{ isEditing ? 'Edit Bank' : 'Add Bank' }}
          </v-card-title>

          <v-card-text>
            <v-form ref="formRef" v-model="valid">
              <v-text-field
                v-model="bankForm.name"
                label="Bank Name"
                variant="outlined"
                :rules="[(v) => !!v || 'Bank name is required']"
              />
            </v-form>
          </v-card-text>

          <v-card-actions class="justify-end">
            <v-btn text @click="closeBankModal"> Cancel </v-btn>

            <v-btn color="green" :loading="loading" :disabled="!valid" @click="submitBank">
              {{ isEditing ? 'Update' : 'Save' }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- DELETE MODAL -->
      <v-dialog v-model="showDeleteModal" max-width="420px">
        <v-card>
          <v-card-title> Delete Bank </v-card-title>

          <v-card-text>
            Are you sure you want to delete
            <strong>{{ bankToDelete?.name }}</strong> ?
          </v-card-text>

          <v-card-actions class="justify-end">
            <v-btn text @click="cancelDelete"> Cancel </v-btn>

            <v-btn color="red" :loading="loading" @click="confirmDelete"> Delete </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </div>
  </MainLayout>
</template>

<style scoped>
.custom-btn {
  background-color: #27bfa0;
}
</style>
