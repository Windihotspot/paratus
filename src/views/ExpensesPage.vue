<template>
  <main-layout>
    <div class="expenses-page min-h-screen">
      <!-- ─── TOP HEADER ────────────────────────────────────────── -->
      <div
        class="header-bar px-6 py-4 flex items-center justify-between border-b border-white/[0.06]"
      >
        <div class="flex items-center gap-3">
          <div class="icon-badge">
            <v-icon size="20" color="#f0c040">mdi-currency-ngn</v-icon>
          </div>
          <div>
            <h1 class="font-semibold text-lg leading-tight tracking-tight">Expense Tracker</h1>
            <p class="text-[#8a8f9e] text-xs">Monitor all facility-linked expenses</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <v-btn
            variant="outlined"
            size="small"
            class="export-btn"
            prepend-icon="mdi-download-outline"
            @click="exportCSV"
            >Export</v-btn
          >
          <v-btn size="small" class="" color="green" prepend-icon="mdi-plus" @click="openAddDialog"
            >Add Expense</v-btn
          >
        </div>
      </div>

      <div class="px-6 py-5 space-y-5">
        <!-- ─── STAT CARDS ─────────────────────────────────────── -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
          <div v-for="stat in summaryStats" :key="stat.label" class="stat-card bg-white rounded-lg">
            <div class="flex items-start justify-between mb-3">
              <span class="text-[#8a8f9e] text-xs font-medium uppercase tracking-widest">{{
                stat.label
              }}</span>
              <v-icon :color="stat.color" size="16">{{ stat.icon }}</v-icon>
            </div>
            <div class="text-white font-bold text-xl tabular-nums">{{ stat.value }}</div>
            <div class="mt-1 text-xs" :class="stat.trendColor">{{ stat.trend }}</div>
          </div>
        </div>

        <!-- ─── FILTERS ROW ────────────────────────────────────── -->
        <div class="filters-bar flex flex-wrap gap-2 items-end">
          <div class="flex-1 min-w-[180px]">
            <label class="filter-label">Facility</label>
            <v-select
              v-model="filters.facilityId"
              :items="facilityOptions"
              item-title="label"
              item-value="value"
              clearable
              density="compact"
              variant="outlined"
              hide-details
              class="dark-select"
              placeholder="All facilities"
            />
          </div>
          <div class="flex-1 min-w-[160px]">
            <label class="filter-label">Category</label>
            <v-select
              v-model="filters.categoryId"
              :items="categoryOptions"
              item-title="name"
              item-value="id"
              clearable
              density="compact"
              variant="outlined"
              hide-details
              class="dark-select"
              placeholder="All categories"
              @update:model-value="filters.typeId = null"
            />
          </div>
          <div class="flex-1 min-w-[160px]">
            <label class="filter-label">Type</label>
            <v-select
              v-model="filters.typeId"
              :items="filteredTypeOptions"
              item-title="name"
              item-value="id"
              clearable
              density="compact"
              variant="outlined"
              hide-details
              class="dark-select"
              placeholder="All types"
              :disabled="!filters.categoryId"
            />
          </div>
          <div class="flex-1 min-w-[130px]">
            <label class="filter-label">From</label>
            <v-text-field
              v-model="filters.dateFrom"
              type="date"
              density="compact"
              variant="outlined"
              hide-details
              class="dark-select"
            />
          </div>
          <div class="flex-1 min-w-[130px]">
            <label class="filter-label">To</label>
            <v-text-field
              v-model="filters.dateTo"
              type="date"
              density="compact"
              variant="outlined"
              hide-details
              class="dark-select"
            />
          </div>
          <v-btn
            variant="text"
            size="small"
            class="text-[#8a8f9e] hover:text-white self-end mb-[1px]"
            @click="resetFilters"
            >Clear</v-btn
          >
        </div>

        <!-- ─── CATEGORY BREAKDOWN BAR ─────────────────────────── -->
        <div v-if="categoryBreakdown.length" class="breakdown-card p-4">
          <p class="text-[#8a8f9e] text-xs font-medium uppercase tracking-widest mb-3">
            Spend by Category
          </p>
          <div class="space-y-2">
            <div
              v-for="item in categoryBreakdown"
              :key="item.category"
              class="flex items-center gap-3"
            >
              <span class="text-[#c8cad4] text-xs w-44 truncate">{{ item.category }}</span>
              <div class="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-700"
                  :style="{ width: item.pct + '%', background: item.color }"
                />
              </div>
              <span class="text-white text-xs tabular-nums w-28 text-right">{{
                formatNGN(item.total)
              }}</span>
              <span class="text-[#8a8f9e] text-xs w-10 text-right">{{ item.pct }}%</span>
            </div>
          </div>
        </div>

        <!-- ─── MAIN TABLE ─────────────────────────────────────── -->
        <div class="">
          <div
            class="flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/[0.05]"
          >
            <span class="text-white text-sm font-medium">
              {{ filteredExpenses.length }} record{{ filteredExpenses.length !== 1 ? 's' : '' }}
            </span>
            <v-text-field
              v-model="search"
              prepend-inner-icon="mdi-magnify"
              placeholder="Search…"
              density="compact"
              variant="outlined"
              hide-details
              clearable
              class="dark-select max-w-[220px]"
            />
          </div>

          <v-data-table
            :headers="tableHeaders"
            :items="filteredExpenses"
            :search="search"
            :items-per-page="15"
            density="compact"
            class="expenses-table"
            hover
          >
            <!-- Date -->
            <template #item.expense_date="{ item }">
              <span class="text-[#c8cad4] tabular-nums text-xs">
                {{ formatDate(item.expense_date) }}
              </span>
            </template>

            <!-- Category chip -->
            <template #item.category_name="{ item }">
              <v-chip
                size="x-small"
                class="category-chip"
                :style="{
                  background: getCategoryColor(item.category_code) + '22',
                  color: getCategoryColor(item.category_code)
                }"
                >{{ item.category_name }}</v-chip
              >
            </template>

            <!-- Type -->
            <template #item.type_name="{ item }">
              <span class="text-[#c8cad4] text-xs">{{ item.type_name }}</span>
            </template>

            <!-- Description -->
            <template #item.description="{ item }">
              <span class="text-[#8a8f9e] text-xs max-w-[180px] truncate block">
                {{ item.description || '—' }}
              </span>
            </template>

            <!-- Facility -->
            <template #item.facility_label="{ item }">
              <div v-if="item.facility_id">
                <div class="text-[#c8cad4] text-xs font-medium">{{ item.bank_name }}</div>
                <div class="text-[#8a8f9e] text-[10px]">{{ capitalise(item.facility_type) }}</div>
              </div>
              <span v-else class="text-[#505565] text-xs">—</span>
            </template>

            <!-- Payment Bank -->
            <template #item.payment_bank="{ item }">
              <span class="text-[#c8cad4] text-xs">{{ item.payment_bank || '—' }}</span>
            </template>

            <!-- Amount -->
            <template #item.amount="{ item }">
              <span class="text-white font-semibold tabular-nums text-sm">
                {{ formatNGN(item.amount) }}
              </span>
            </template>

            <!-- Doc -->
            <template #item.document_available="{ item }">
              <v-icon
                v-if="item.document_available"
                size="16"
                color="#4ade80"
                class="cursor-pointer"
                @click="viewDocument(item)"
                >mdi-file-check-outline</v-icon
              >
              <v-icon v-else size="16" color="#374151">mdi-file-remove-outline</v-icon>
            </template>

            <!-- Actions -->
            <template #item.actions="{ item }">
              <div class="flex gap-1">
                <v-btn
                  icon
                  size="x-small"
                  variant="text"
                  class="text-[#8a8f9e] hover:text-white"
                  @click="openEditDialog(item)"
                >
                  <v-icon size="14">mdi-pencil-outline</v-icon>
                </v-btn>
                <v-btn
                  icon
                  size="x-small"
                  variant="text"
                  class="text-[#8a8f9e] hover:text-red-400"
                  @click="confirmDelete(item)"
                >
                  <v-icon size="14">mdi-trash-can-outline</v-icon>
                </v-btn>
              </div>
            </template>

            <!-- Empty state -->
            <template #no-data>
              <div class="py-16 text-center">
                <v-icon size="40" color="#374151">mdi-receipt-text-outline</v-icon>
                <p class="text-[#505565] mt-3 text-sm">No expenses found</p>
                <v-btn size="small" class="mt-4" color="green" @click="openAddDialog"
                  >Add First Expense</v-btn
                >
              </div>
            </template>
          </v-data-table>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════
         ADD / EDIT DIALOG
    ════════════════════════════════════════════════════════════ -->
      <v-dialog v-model="dialog.open" max-width="680" persistent>
        <v-card class="">
          <div class="dialog-header flex items-center justify-between px-6 py-4">
            <div>
              <h2 class="text-white font-semibold">
                {{ dialog.isEdit ? 'Edit Expense' : 'Add New Expense' }}
              </h2>
              <p class="text-[#8a8f9e] text-xs mt-0.5">
                {{
                  dialog.isEdit ? 'Update expense record' : 'Log a new expense against a facility'
                }}
              </p>
            </div>
            <v-btn icon variant="text" @click="closeDialog" class="text-[#8a8f9e]">
              <v-icon size="20">mdi-close</v-icon>
            </v-btn>
          </div>

          <v-divider color="rgba(255,255,255,0.06)" />

          <v-card-text class="px-6 py-5">
            <v-form ref="formRef" v-model="formValid" @submit.prevent="saveExpense">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Date -->
                <div>
                  <label class="field-label">Date <span class="req">*</span></label>
                  <v-text-field
                    v-model="form.expense_date"
                    type="date"
                    density="compact"
                    variant="outlined"
                    :rules="[rules.required]"
                    class="dark-field"
                    hide-details="auto"
                  />
                </div>

                <!-- Facility -->
                <div>
                  <label class="field-label">Bank Facility</label>
                  <v-select
                    v-model="form.facility_id"
                    :items="facilityOptions"
                    item-title="label"
                    item-value="value"
                    clearable
                    density="compact"
                    variant="outlined"
                    class="dark-field"
                    hide-details="auto"
                    placeholder="Select facility (optional)"
                  />
                </div>

                <!-- Category -->
                <div>
                  <label class="field-label">Category <span class="req">*</span></label>
                  <v-select
                    v-model="form.expense_category_id"
                    :items="categoryOptions"
                    item-title="name"
                    item-value="id"
                    density="compact"
                    variant="outlined"
                    :rules="[rules.required]"
                    class="dark-field"
                    hide-details="auto"
                    @update:model-value="form.expense_type_id = null"
                  />
                </div>

                <!-- Type -->
                <div>
                  <label class="field-label">Expense Type <span class="req">*</span></label>
                  <v-select
                    v-model="form.expense_type_id"
                    :items="formTypeOptions"
                    item-title="name"
                    item-value="id"
                    density="compact"
                    variant="outlined"
                    :rules="[rules.required]"
                    class="dark-field"
                    hide-details="auto"
                    :disabled="!form.expense_category_id"
                    :placeholder="
                      form.expense_category_id ? 'Select type' : 'Select category first'
                    "
                  />
                </div>

                <!-- Description -->
                <div class="md:col-span-2">
                  <label class="field-label">Expense Details / Description</label>
                  <v-text-field
                    v-model="form.description"
                    density="compact"
                    variant="outlined"
                    class="dark-field"
                    hide-details="auto"
                    placeholder="Brief description of this expense"
                  />
                </div>

                <!-- Payment Bank -->
                <div>
                  <label class="field-label">Payment Bank</label>
                  <v-text-field
                    v-model="form.payment_bank"
                    density="compact"
                    variant="outlined"
                    class="dark-field"
                    hide-details="auto"
                    placeholder="e.g. GTBank, Access, Zenith"
                  />
                </div>

                <!-- Amount -->
                <div>
                  <label class="field-label">Amount (₦) <span class="req">*</span></label>
                  <v-text-field
                    v-model.number="form.amount"
                    type="number"
                    density="compact"
                    variant="outlined"
                    :rules="[rules.required, rules.positive]"
                    class="dark-field"
                    hide-details="auto"
                    placeholder="0.00"
                    prefix="₦"
                  />
                </div>

                <!-- Reference -->
                <div>
                  <label class="field-label">Reference Number</label>
                  <v-text-field
                    v-model="form.reference_number"
                    density="compact"
                    variant="outlined"
                    class="dark-field"
                    hide-details="auto"
                    placeholder="Receipt / invoice ref"
                  />
                </div>

                <!-- Document available toggle -->
                <div class="flex items-center gap-3 self-center pt-4">
                  <v-switch
                    v-model="form.document_available"
                    color="#f0c040"
                    hide-details
                    density="compact"
                    class="dark-switch"
                  />
                  <span class="text-[#c8cad4] text-sm">Document Available</span>
                </div>

                <!-- Document URL (shown if doc available) -->
                <div v-if="form.document_available" class="md:col-span-2">
                  <label class="field-label">Document URL / Path</label>
                  <v-text-field
                    v-model="form.document_url"
                    density="compact"
                    variant="outlined"
                    class="dark-field"
                    hide-details="auto"
                    placeholder="https:// or storage path"
                    prepend-inner-icon="mdi-link-variant"
                  />
                </div>

                <!-- Notes -->
                <div class="md:col-span-2">
                  <label class="field-label">Notes</label>
                  <v-textarea
                    v-model="form.notes"
                    density="compact"
                    variant="outlined"
                    class="dark-field"
                    hide-details="auto"
                    rows="2"
                    placeholder="Any additional notes…"
                  />
                </div>
              </div>
            </v-form>
          </v-card-text>

          <v-divider color="rgba(255,255,255,0.06)" />
          <v-card-actions class="px-6 py-4 gap-2 justify-end">
            <v-btn variant="text" class="text-[#8a8f9e]" @click="closeDialog">Cancel</v-btn>
            <v-btn class="add-btn" :loading="saving" @click="saveExpense">
              {{ dialog.isEdit ? 'Update Expense' : 'Save Expense' }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- ─── DELETE CONFIRM ────────────────────────────────────── -->
      <v-dialog v-model="deleteDialog.open" max-width="400">
        <v-card class="expense-dialog">
          <v-card-text class="px-6 py-6 text-center">
            <v-icon size="48" color="#ef4444" class="mb-3">mdi-alert-circle-outline</v-icon>
            <p class="text-white font-medium mb-1">Delete Expense?</p>
            <p class="text-[#8a8f9e] text-sm">
              This will permanently remove the expense record of
              <strong class="text-white">{{ formatNGN(deleteDialog.item?.amount) }}</strong> on
              {{ formatDate(deleteDialog.item?.expense_date) }}.
            </p>
          </v-card-text>
          <v-card-actions class="px-6 pb-5 gap-2 justify-center">
            <v-btn
              variant="outlined"
              class="border-white/10 text-[#8a8f9e]"
              @click="deleteDialog.open = false"
            >
              Cancel
            </v-btn>
            <v-btn class="delete-btn" :loading="deleting" @click="deleteExpense"> Delete </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- ─── SNACKBAR ──────────────────────────────────────────── -->
      <v-snackbar v-model="snack.show" :color="snack.color" location="bottom right" :timeout="3000">
        {{ snack.text }}
      </v-snackbar>
    </div>
  </main-layout>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import MainLayout from '@/layouts/full/MainLayout.vue'
import { supabase } from '@/services/supabase.js'
// ─── State ────────────────────────────────────────────────────
const expenses = ref([])
const categories = ref([])
const expenseTypes = ref([])
const facilities = ref([])
const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)
const search = ref('')
const formRef = ref(null)
const formValid = ref(false)

const filters = reactive({
  facilityId: null,
  categoryId: null,
  typeId: null,
  dateFrom: '',
  dateTo: ''
})

const dialog = reactive({ open: false, isEdit: false, editId: null })
const deleteDialog = reactive({ open: false, item: null })
const snack = reactive({ show: false, text: '', color: 'success' })

const defaultForm = () => ({
  expense_date: new Date().toISOString().split('T')[0],
  facility_id: null,
  expense_category_id: null,
  expense_type_id: null,
  description: '',
  payment_bank: '',
  amount: null,
  reference_number: '',
  document_available: false,
  document_url: '',
  notes: ''
})
const form = reactive(defaultForm())

// ─── Rules ────────────────────────────────────────────────────
const rules = {
  required: (v) => !!v || 'Required',
  positive: (v) => v > 0 || 'Must be greater than 0'
}

// ─── Fetch helpers ────────────────────────────────────────────
async function loadCategories() {
  const { data } = await supabase
    .from('expense_categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')
  categories.value = data || []
}

async function loadTypes() {
  const { data } = await supabase
    .from('expense_types')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')
  expenseTypes.value = data || []
}

async function loadFacilities() {
  const { data } = await supabase
    .from('bank_facilities')
    .select('id, facility_type, facility_amount, bank_id, banks(name)')
    .eq('status', 'active')
  facilities.value = data || []
}

async function loadExpenses() {
  loading.value = true
  const { data, error } = await supabase
    .from('v_expenses_detail') // uses the view from seed SQL
    .select('*')
    .order('expense_date', { ascending: false })
  if (!error) expenses.value = data || []
  loading.value = false
}

onMounted(async () => {
  await Promise.all([loadCategories(), loadTypes(), loadFacilities(), loadExpenses()])
})

// ─── Computed options ─────────────────────────────────────────
const facilityOptions = computed(() =>
  facilities.value.map((f) => ({
    value: f.id,
    label: `${f.banks?.name || 'Unknown'} — ${capitalise(f.facility_type)} (₦${fmtNumber(f.facility_amount)})`
  }))
)

const categoryOptions = computed(() => categories.value)

const filteredTypeOptions = computed(() =>
  filters.categoryId
    ? expenseTypes.value.filter((t) => t.category_id === filters.categoryId)
    : expenseTypes.value
)

const formTypeOptions = computed(() =>
  form.expense_category_id
    ? expenseTypes.value.filter((t) => t.category_id === form.expense_category_id)
    : []
)

// ─── Filtered table data ──────────────────────────────────────
const filteredExpenses = computed(() => {
  return expenses.value.filter((e) => {
    if (filters.facilityId && e.facility_id !== filters.facilityId) return false
    if (filters.categoryId && e.expense_category_id !== filters.categoryId) return false
    if (filters.typeId && e.expense_type_id !== filters.typeId) return false
    if (filters.dateFrom && e.expense_date < filters.dateFrom) return false
    if (filters.dateTo && e.expense_date > filters.dateTo) return false
    return true
  })
})

// ─── Summary stats ────────────────────────────────────────────
const summaryStats = computed(() => {
  const total = filteredExpenses.value.reduce((s, e) => s + Number(e.amount || 0), 0)
  const count = filteredExpenses.value.length
  const today = new Date().toISOString().split('T')[0]
  const mtd = filteredExpenses.value
    .filter((e) => e.expense_date?.slice(0, 7) === today.slice(0, 7))
    .reduce((s, e) => s + Number(e.amount || 0), 0)
  const docPct = count
    ? Math.round((filteredExpenses.value.filter((e) => e.document_available).length / count) * 100)
    : 0

  return [
    {
      label: 'Total Spend',
      value: formatNGN(total),
      icon: 'mdi-sigma',
      color: '#f0c040',
      trend: `${count} records`,
      trendColor: 'text-[#8a8f9e]'
    },
    {
      label: 'This Month',
      value: formatNGN(mtd),
      icon: 'mdi-calendar-month',
      color: '#60a5fa',
      trend: 'Month-to-date',
      trendColor: 'text-[#8a8f9e]'
    },
    {
      label: 'Facilities Used',
      value: new Set(filteredExpenses.value.filter((e) => e.facility_id).map((e) => e.facility_id))
        .size,
      icon: 'mdi-bank-outline',
      color: '#a78bfa',
      trend: 'Linked facilities',
      trendColor: 'text-[#8a8f9e]'
    },
    {
      label: 'Docs Attached',
      value: docPct + '%',
      icon: 'mdi-file-check-outline',
      color: '#4ade80',
      trend: `${filteredExpenses.value.filter((e) => e.document_available).length} of ${count}`,
      trendColor: docPct >= 80 ? 'text-green-400' : 'text-yellow-400'
    }
  ]
})

// ─── Category breakdown ───────────────────────────────────────
const CATEGORY_COLORS = {
  REVENUE_COSTS: '#f0c040',
  STAFF_COSTS: '#60a5fa',
  OPERATIONS: '#a78bfa',
  TECHNOLOGY: '#34d399',
  MARKETING_PR: '#f472b6',
  ADMINISTRATIVE: '#fb923c',
  FINANCE_COSTS: '#38bdf8',
  LOGISTICS_TRAVEL: '#a3e635',
  DEPRECIATION: '#e879f9',
  OTHER_EXPENSES: '#94a3b8'
}

const categoryBreakdown = computed(() => {
  const map = {}
  filteredExpenses.value.forEach((e) => {
    if (!e.category_name) return
    if (!map[e.category_code])
      map[e.category_code] = { category: e.category_name, code: e.category_code, total: 0 }
    map[e.category_code].total += Number(e.amount || 0)
  })
  const arr = Object.values(map).sort((a, b) => b.total - a.total)
  const grand = arr.reduce((s, i) => s + i.total, 0)
  return arr.map((i) => ({
    ...i,
    pct: grand ? Math.round((i.total / grand) * 100) : 0,
    color: CATEGORY_COLORS[i.code] || '#94a3b8'
  }))
})

// ─── Table headers ────────────────────────────────────────────
const tableHeaders = [
  { title: 'Date', key: 'expense_date', width: '110px', sortable: true },
  { title: 'Category', key: 'category_name', width: '160px', sortable: true },
  { title: 'Type', key: 'type_name', width: '180px', sortable: true },
  { title: 'Details', key: 'description', width: '180px', sortable: false },
  { title: 'Facility', key: 'facility_label', width: '160px', sortable: false },
  { title: 'Payment Bank', key: 'payment_bank', width: '130px', sortable: true },
  { title: 'Amount', key: 'amount', width: '130px', sortable: true, align: 'end' },
  { title: 'Doc', key: 'document_available', width: '60px', sortable: false, align: 'center' },
  { title: '', key: 'actions', width: '70px', sortable: false }
]

// ─── Dialog actions ───────────────────────────────────────────
function openAddDialog() {
  Object.assign(form, defaultForm())
  dialog.isEdit = false
  dialog.editId = null
  dialog.open = true
}

function openEditDialog(item) {
  Object.assign(form, {
    expense_date: item.expense_date,
    facility_id: item.facility_id,
    expense_category_id: item.expense_category_id,
    expense_type_id: item.expense_type_id,
    description: item.description || '',
    payment_bank: item.payment_bank || '',
    amount: item.amount,
    reference_number: item.reference_number || '',
    document_available: item.document_available || false,
    document_url: item.document_url || '',
    notes: item.notes || ''
  })
  dialog.isEdit = true
  dialog.editId = item.id
  dialog.open = true
}

function closeDialog() {
  dialog.open = false
  formRef.value?.reset()
}

async function saveExpense() {
  const { valid } = await formRef.value.validate()
  if (!valid) return

  saving.value = true
  const payload = {
    expense_date: form.expense_date,
    facility_id: form.facility_id || null,
    expense_category_id: form.expense_category_id,
    expense_type_id: form.expense_type_id,
    // Map category name for the legacy `category` column if it exists:
    category: categories.value.find((c) => c.id === form.expense_category_id)?.name || '',
    description: form.description || null,
    payment_bank: form.payment_bank || null,
    amount: form.amount,
    reference_number: form.reference_number || null,
    document_available: form.document_available,
    document_url: form.document_url || null,
    notes: form.notes || null
  }

  let error
  if (dialog.isEdit) {
    ;({ error } = await supabase.from('expenses').update(payload).eq('id', dialog.editId))
  } else {
    ;({ error } = await supabase.from('expenses').insert(payload))
  }

  saving.value = false
  if (error) {
    showSnack('Error saving expense: ' + error.message, 'error')
  } else {
    showSnack(dialog.isEdit ? 'Expense updated' : 'Expense added', 'success')
    closeDialog()
    await loadExpenses()
  }
}

function confirmDelete(item) {
  deleteDialog.item = item
  deleteDialog.open = true
}

async function deleteExpense() {
  deleting.value = true
  const { error } = await supabase.from('expenses').delete().eq('id', deleteDialog.item.id)
  deleting.value = false
  deleteDialog.open = false
  if (error) {
    showSnack('Delete failed: ' + error.message, 'error')
  } else {
    showSnack('Expense deleted', 'success')
    await loadExpenses()
  }
}

function viewDocument(item) {
  if (item.document_url) window.open(item.document_url, '_blank')
}

function resetFilters() {
  Object.assign(filters, {
    facilityId: null,
    categoryId: null,
    typeId: null,
    dateFrom: '',
    dateTo: ''
  })
}

// ─── CSV export ───────────────────────────────────────────────
function exportCSV() {
  const cols = [
    'expense_date',
    'category_name',
    'type_name',
    'description',
    'bank_name',
    'facility_type',
    'payment_bank',
    'amount',
    'reference_number',
    'document_available',
    'notes'
  ]
  const header = [
    'Date',
    'Category',
    'Type',
    'Description',
    'Facility Bank',
    'Facility Type',
    'Payment Bank',
    'Amount',
    'Reference',
    'Doc Available',
    'Notes'
  ]
  const rows = filteredExpenses.value.map((e) =>
    cols
      .map((c) => {
        const v = e[c]
        return typeof v === 'string' && v.includes(',') ? `"${v}"` : v ?? ''
      })
      .join(',')
  )
  const csv = [header.join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `expenses_${new Date().toISOString().split('T')[0]}.csv`
  a.click()
}

// ─── Utilities ────────────────────────────────────────────────
function getCategoryColor(code) {
  return CATEGORY_COLORS[code] || '#94a3b8'
}

function formatNGN(v) {
  if (v == null || v === '') return '—'
  return (
    '₦' + Number(v).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  )
}

function fmtNumber(v) {
  return Number(v || 0).toLocaleString('en-NG')
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-NG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

function capitalise(str) {
  return str ? str.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : ''
}

function showSnack(text, color = 'success') {
  snack.text = text
  snack.color = color
  snack.show = true
}
</script>

<style scoped>
/* ── Page base ───────────────────────────────────────── */
.v-btn {
  text-transform: none;
}
/* ── Header ──────────────────────────────────────────── */
.header-bar {
  position: sticky;
  top: 0;
  z-index: 20;
  backdrop-filter: blur(12px);
}

.icon-badge {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(240, 192, 64, 0.12);
  border: 1px solid rgba(240, 192, 64, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ── Buttons ─────────────────────────────────────────── */
.add-btn {
  background: #f0c040 !important;
  color: #0f1117 !important;
  font-weight: 600 !important;
  font-size: 13px !important;
  border-radius: 8px !important;
  text-transform: none !important;
  letter-spacing: 0 !important;
  box-shadow: 0 0 16px rgba(240, 192, 64, 0.25) !important;
}

.export-btn {
  border-color: rgba(255, 255, 255, 0.12) !important;
  color: #8a8f9e !important;
  font-size: 13px !important;
  border-radius: 8px !important;
  text-transform: none !important;
  letter-spacing: 0 !important;
}
.export-btn:hover {
  color: white !important;
  border-color: rgba(255, 255, 255, 0.3) !important;
}

.delete-btn {
  background: #ef4444 !important;
  color: white !important;
  font-weight: 600 !important;
  border-radius: 8px !important;
  text-transform: none !important;
  letter-spacing: 0 !important;
}

/* ── Stat cards ──────────────────────────────────────── */
.stat-card {
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  padding: 16px;
}

/* ── Filters bar ─────────────────────────────────────── */
.filter-label {
  display: block;
  font-size: 11px;
  font-weight: 500;
  color: #8a8f9e;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 4px;
}

/* ── Category breakdown ──────────────────────────────── */
.breakdown-card {
  background: #161b27;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
}

/* ── Table card ──────────────────────────────────────── */
.table-card {
  background: #161b27;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  overflow: hidden;
}

/* ── Dark Vuetify overrides ──────────────────────────── */
:deep(.dark-select .v-field),
:deep(.dark-field .v-field) {
  border-color: rgba(255, 255, 255, 0.1) !important;
  color: #c8cad4 !important;
  border-radius: 8px !important;
  font-size: 13px !important;
}
:deep(.dark-select .v-field:hover),
:deep(.dark-field .v-field:hover) {
  border-color: rgba(255, 255, 255, 0.2) !important;
}
:deep(.dark-select .v-field input),
:deep(.dark-field .v-field input),
:deep(.dark-field .v-field textarea) {
  color: #c8cad4 !important;
}
:deep(.dark-select .v-select__selection-text) {
  color: #c8cad4 !important;
}
:deep(.v-list) {
}
:deep(.v-list-item) {
  color: #c8cad4 !important;
  font-size: 13px !important;
}
:deep(.v-list-item:hover) {
  background: rgba(255, 255, 255, 0.05) !important;
}
:deep(.v-list-item--active) {
  color: #f0c040 !important;
}

/* ── Expenses table ──────────────────────────────────── */
:deep(.expenses-table) {
  background: transparent !important;
  color: #c8cad4 !important;
}
:deep(.expenses-table .v-data-table__thead) {
  background: rgba(255, 255, 255, 0.03) !important;
}
:deep(.expenses-table th) {
  font-size: 11px !important;
  font-weight: 600 !important;
  text-transform: uppercase !important;
  letter-spacing: 0.07em !important;
  color: #505565 !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06) !important;
  background: transparent !important;
  white-space: nowrap !important;
}
:deep(.expenses-table td) {
  border-bottom: 1px solid rgba(255, 255, 255, 0.04) !important;
  font-size: 13px !important;
}
:deep(.expenses-table .v-data-table__tr:hover td) {
  background: rgba(240, 192, 64, 0.03) !important;
}
:deep(.expenses-table .v-data-table-footer) {
  background: rgba(255, 255, 255, 0.02) !important;
  border-top: 1px solid rgba(255, 255, 255, 0.05) !important;
  color: #8a8f9e !important;
  font-size: 12px !important;
}
:deep(.expenses-table .v-data-table-footer select) {
  color: #c8cad4 !important;
}

/* ── Category chip ───────────────────────────────────── */
.category-chip {
  font-size: 11px !important;
  font-weight: 600 !important;
  border-radius: 6px !important;
  padding: 0 8px !important;
  height: 20px !important;
  letter-spacing: 0.02em;
}

/* ── Dialog ──────────────────────────────────────────── */
.expense-dialog {
  background: #161b27 !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  border-radius: 16px !important;
  color: #c8cad4 !important;
}
.dialog-header {
  background: #161b27;
}
.field-label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: #8a8f9e;
  margin-bottom: 4px;
}
.req {
  color: #f87171;
}

/* ── Snackbar ─────────────────────────────────────────── */
:deep(.v-snackbar__content) {
  font-size: 13px !important;
}
</style>
