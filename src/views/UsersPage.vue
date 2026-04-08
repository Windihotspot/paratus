<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import MainLayout from '@/layouts/full/MainLayout.vue'
import { supabase } from '@/services/supabase.js'
import { ElMessageBox, ElMessage } from 'element-plus'
// =====================
// STATE
// =====================
const loading = ref(false)
const tableLoading = ref(false)
const search = ref('')

const users = ref<any[]>([])

// dialogs
const createDialog = ref(false)
const editDialog = ref(false)
const selectedUser = ref<any | null>(null)

// form (create)
const fullName = ref('')
const email = ref('')
const password = ref('')
const role = ref('staff')

// edit form
const editRole = ref('')
const editStatus = ref('active')

// options
const roles = ['admin', 'staff', 'viewer']
const statuses = ['active', 'suspended']

// =====================
// =====================
// FILTERED USERS
// =====================
const filteredUsers = computed(() => {
  if (!search.value) return users.value

  return users.value.filter((u) =>
    `${u.full_name} ${u.email}`
      .toLowerCase()
      .includes(search.value.toLowerCase())
  )
})

// =====================
// OPEN CREATE
// =====================
const openCreate = () => {
  fullName.value = ''
  email.value = ''
  password.value = ''
  role.value = 'staff'
  createDialog.value = true
}

// =====================
// CREATE USER (HOOK for Edge Function)
// =====================

const createUser = async () => {
  try {
    console.log('🚀 CREATE USER START')

    // =====================
    // VALIDATION
    // =====================
    console.log('📥 Form values:', {
      fullName: fullName.value,
      email: email.value,
      password: password.value,
      role: role.value
    })

    if (!fullName.value || !email.value || !password.value) {
      console.warn('⚠️ Validation failed')
      alert('All fields are required')
      return
    }

    loading.value = true

    // =====================
    // SESSION
    // =====================
    console.log('🔐 Fetching session...')
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession()

    console.log('🧠 Session response:', sessionData)
    console.log('❌ Session error:', sessionError)

    const token = sessionData.session?.access_token

    console.log('🔑 Access token:', token)

    if (!token) {
      throw new Error('User not authenticated')
    }

    // =====================
    // REQUEST PAYLOAD
    // =====================
    const payload = {
      full_name: fullName.value,
      email: email.value.trim(),
      password: password.value,
      role: role.value
    }

    console.log('📤 Sending payload:', payload)

    // =====================
    // API CALL
    // =====================
    const res = await fetch(
      'https://ytvqldflnqwflahxjjzu.supabase.co/functions/v1/create-user',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      }
    )

    console.log('📡 Raw response:', res)
    console.log('📡 Response status:', res.status)
    console.log('📡 Response ok?:', res.ok)

    // =====================
    // RESPONSE BODY
    // =====================
    let data = null

    try {
      data = await res.json()
    } catch (parseError) {
      console.error('❌ Failed to parse JSON:', parseError)
    }

    console.log('📥 Response data:', data)

    // =====================
    // ERROR HANDLING
    // =====================
    if (!res.ok) {
      console.error('❌ Create user failed:', data)
      throw new Error(data?.message || 'Failed to create user')
    }

    console.log('✅ User created successfully:', data)

    // =====================
    // REFRESH USERS
    // =====================
    console.log('🔄 Refreshing users...')
    await fetchUsers()

    // =====================
    // RESET FORM
    // =====================
    createDialog.value = false
    fullName.value = ''
    email.value = ''
    password.value = ''
    role.value = 'staff'

    console.log('🎉 DONE')

  } catch (err: any) {
    console.error('💥 ERROR:', err)
    alert(err.message)
  } finally {
    loading.value = false
    console.log('⏹️ LOADING STOPPED')
  }
}
const editFullName = ref('')
const editEmail = ref('')
// =====================
// OPEN EDIT
// =====================
const openEdit = (user: any) => {
  selectedUser.value = user
  editFullName.value = user.full_name
  editEmail.value = user.email
  editRole.value = user.role
  editStatus.value = user.status
  editDialog.value = true
}
// =====================
// UPDATE USER (HOOK for Edge Function)
// =====================
const updateUser = async () => {
  try {
    loading.value = true

    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData.session?.access_token

    const res = await fetch(
      'https://ytvqldflnqwflahxjjzu.supabase.co/functions/v1/update-user',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          id: selectedUser.value.id,
          full_name: editFullName.value,
          email: editEmail.value,
          role: editRole.value,
          status: editStatus.value
        })
      }
    )

    const data = await res.json()
    console.log("UPDATE RESPONSE:", data)

    await fetchUsers()

    editDialog.value = false
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}
const fetchUsers = async () => {
  try {
    tableLoading.value = true

    const { data, error } = await supabase
      .from('profiles')
      .select('*')

    console.log("profiles:", data)

    if (!error) {
      users.value = data
    } else {
      console.error(error)
    }
  } finally {
    tableLoading.value = false
  }
}

const deleteUser = async (user: any) => {
  try {
    await ElMessageBox.confirm(
      `Are you sure you want to delete ${user.full_name}?`,
      'Confirm Delete',
      {
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        type: 'warning'
      }
    )

    tableLoading.value = true

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', user.id)

    if (error) throw error

    ElMessage.success('User deleted successfully')

    await fetchUsers()

  } catch (err: any) {
    if (err !== 'cancel') {
      console.error(err)
      ElMessage.error('Failed to delete user')
    }
  } finally {
    tableLoading.value = false
  }
}
onMounted(async () => {
 fetchUsers()
})
</script>

<template>
  <MainLayout>
    <div class="p-4">

      <!-- HEADER -->
      <div class="flex justify-between items-center mb-4">
        <div>
          <h1 class="text-xl font-bold">User Management</h1>
          <p class="text-gray-500 text-sm">
            Manage users, roles and permissions
          </p>
        </div>

        <v-btn color="primary" @click="openCreate">
          + Create User
        </v-btn>
      </div>

      <!-- SEARCH -->
      <v-text-field
        v-model="search"
        label="Search users"
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        density="compact"
        class="mb-4"
      />

      <!-- TABLE -->
      <v-card>
        <v-table>
          <v-progress-linear
    v-if="tableLoading"
    indeterminate
    color="primary"
  />
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="user in filteredUsers" :key="user.id">
              <td>{{ user.full_name }}</td>
              <td>{{ user.email }}</td>

              <td>
                <v-chip size="small" color="primary">
                  {{ user.role }}
                </v-chip>
              </td>

              <td>
                <v-chip
                  size="small"
                  :color="user.status === 'active' ? 'green' : 'red'"
                >
                  {{ user.status }}
                </v-chip>
              </td>

              <td>
                <td class="space-x-2">
  <v-btn size="small" variant="text" @click="openEdit(user)">
    Edit
  </v-btn>

  <v-btn
    size="small"
    variant="text"
    color="red"
    @click="deleteUser(user)"
  >
    Delete
  </v-btn>
</td>
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card>

      <!-- ===================== -->
      <!-- CREATE DIALOG -->
      <!-- ===================== -->
      <v-dialog v-model="createDialog" max-width="500">
        <v-card>
          <v-card-title>Create User</v-card-title>

          <v-card-text>
            <v-text-field   variant="outlined" v-model="fullName" label="Full Name" />
            <v-text-field   variant="outlined" v-model="email" label="Email" />
            <v-text-field variant="outlined" v-model="password" label="Password" type="password" />

            <v-select   variant="outlined" v-model="role" :items="roles" label="Role" />
          </v-card-text>

          <v-card-actions>
            <v-spacer />
            <v-btn variant="text" @click="createDialog = false">Cancel</v-btn>
            <v-btn color="primary" @click="createUser">Create</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- ===================== -->
      <!-- EDIT DIALOG -->
      <!-- ===================== -->
      <v-dialog v-model="editDialog" max-width="500">
        <v-card>
          <v-card-title>Edit User</v-card-title>

         

          <v-card-text>
             <v-text-field
  v-model="editFullName"
  label="Full Name"
  variant="outlined"
/>

<v-text-field
  v-model="editEmail"
  label="Email"
  variant="outlined"
/>

            

            <v-select
              variant="outlined"
              v-model="editRole"
              :items="roles"
              label="Role"
            />

            <v-select
              variant="outlined"
              v-model="editStatus"
              :items="statuses"
              label="Status"
            />
          </v-card-text>

          <v-card-actions>
            <v-spacer />
            <v-btn variant="text" @click="editDialog = false">Cancel</v-btn>
            <v-btn color="primary" @click="updateUser">Save</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

    </div>
  </MainLayout>
</template>

<style scoped>
    .v-btn{
        text-transform: none;
    }
</style>