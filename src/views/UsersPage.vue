<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import MainLayout from '@/layouts/full/MainLayout.vue'

// =====================
// STATE
// =====================
const loading = ref(false)
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
// MOCK DATA (replace with Supabase later)
// =====================
onMounted(() => {
  users.value = [
    {
      id: 1,
      full_name: 'John Doe',
      email: 'john@example.com',
      role: 'admin',
      status: 'active'
    },
    {
      id: 2,
      full_name: 'Mary Jane',
      email: 'mary@example.com',
      role: 'staff',
      status: 'suspended'
    }
  ]
})

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
  console.log('CREATE USER:', {
    fullName: fullName.value,
    email: email.value,
    password: password.value,
    role: role.value
  })

  // TODO: call supabase edge function here

  createDialog.value = false
}

// =====================
// OPEN EDIT
// =====================
const openEdit = (user: any) => {
  selectedUser.value = user
  editRole.value = user.role
  editStatus.value = user.status
  editDialog.value = true
}

// =====================
// UPDATE USER (HOOK for Edge Function)
// =====================
const updateUser = async () => {
  console.log('UPDATE USER:', {
    id: selectedUser.value.id,
    role: editRole.value,
    status: editStatus.value
  })

  // TODO: call supabase edge function here

  editDialog.value = false
}
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
                <v-btn size="small" variant="text" @click="openEdit(user)">
                  Edit
                </v-btn>
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
            variant="outlined"
              :model-value="selectedUser?.email"
              label="Email"
              disabled
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