<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/services/supabase.js'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const menu = ref(false)
const loading = ref(false)
const notifications = ref([])
const tab = ref('all')
let channel = null

const userId = computed(() => authStore.profile?.id || authStore.user?.id || null)

const unreadCount = computed(
  () => notifications.value.filter((n) => !n.read_at && !n.archived_at && !n.deleted_at).length
)

const readCount = computed(
  () => notifications.value.filter((n) => n.read_at && !n.archived_at && !n.deleted_at).length
)

const archivedCount = computed(
  () => notifications.value.filter((n) => n.archived_at && !n.deleted_at).length
)

const deletedCount = computed(() => notifications.value.filter((n) => n.deleted_at).length)

const tabs = computed(() => [
  {
    key: 'all',
    label: 'All',
    count: notifications.value.filter((n) => !n.deleted_at && !n.archived_at).length
  },
  { key: 'unread', label: 'Unread', count: unreadCount.value },
  { key: 'read', label: 'Read', count: readCount.value },
  { key: 'archived', label: 'Archived', count: archivedCount.value },
  { key: 'deleted', label: 'Deleted', count: deletedCount.value }
])

const visible = computed(() => {
  const items = notifications.value

  switch (tab.value) {
    case 'unread':
      return items.filter((n) => !n.read_at && !n.archived_at && !n.deleted_at)

    case 'read':
      return items.filter((n) => n.read_at && !n.archived_at && !n.deleted_at)

    case 'archived':
      return items.filter((n) => n.archived_at && !n.deleted_at)

    case 'deleted':
      return items.filter((n) => n.deleted_at)

    default:
      return items.filter((n) => !n.archived_at && !n.deleted_at)
  }
})

// ── Data ─────────────────────────────────────────────
async function load() {
  if (!userId.value) return
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select(
        `
    id,
    type,
    title,
    body,
    request_id,
    read_at,
    archived_at,
    deleted_at,
    created_at
  `
      )
      .eq('recipient_user_id', userId.value)
      .order('created_at', { ascending: false })
      .limit(100)
    if (error) throw error
    notifications.value = data || []
  } catch (e) {
    console.error('Error loading notifications:', e)
  } finally {
    loading.value = false
  }
}

function subscribe() {
  unsubscribe()
  if (!userId.value) return
  channel = supabase
    .channel(`notifications:${userId.value}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `recipient_user_id=eq.${userId.value}`
      },
      (payload) => {
        notifications.value = [payload.new, ...notifications.value]
      }
    )
    .subscribe()
}

function unsubscribe() {
  if (channel) {
    supabase.removeChannel(channel)
    channel = null
  }
}

async function markRead(n) {
  if (!n || n.read_at) return

  const previous = n.read_at
  const now = new Date().toISOString()

  n.read_at = now

  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read_at: now })
      .eq('id', n.id)
      .eq('recipient_user_id', userId.value)
      .is('read_at', null)
      .select('id, read_at')
      .maybeSingle()

    if (error) throw error

    if (!data) {
      throw new Error('Notification was not updated. Check your RLS policies.')
    }

    n.read_at = data.read_at
  } catch (error) {
    n.read_at = previous
    console.error('Error marking notification as read:', error)
  }
}

async function markAllRead() {
  const unread = notifications.value.filter((n) => !n.read_at && !n.archived_at && !n.deleted_at)

  if (!unread.length || !userId.value) return

  const now = new Date().toISOString()

  unread.forEach((n) => {
    n.read_at = now
  })

  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: now })
      .eq('recipient_user_id', userId.value)
      .is('read_at', null)
      .is('archived_at', null)
      .is('deleted_at', null)

    if (error) throw error
  } catch (error) {
    unread.forEach((n) => {
      n.read_at = null
    })

    console.error('Error marking all notifications as read:', error)
  }
}

async function openNotification(n) {
  if (!n || n.deleted_at) return

  if (n.request_id) {
    menu.value = false

    await markRead(n)

    router.push({
      name: 'ApprovalDetails',
      params: { id: n.request_id }
    })

    return
  }

  await markRead(n)
}

watch(
  userId,
  (id) => {
    if (id) {
      load()
      subscribe()
    } else {
      notifications.value = []
      unsubscribe()
    }
  },
  { immediate: true }
)

onBeforeUnmount(unsubscribe)

// ── Display helpers ──────────────────────────────────
function typeMeta(type = '') {
  const t = type.toLowerCase()
  if (t.includes('approved')) return { icon: 'mdi-check-circle', color: '#22C55E' }
  if (t.includes('rejected')) return { icon: 'mdi-close-circle', color: '#EF4444' }
  if (t.includes('request') || t.includes('approval'))
    return { icon: 'mdi-clipboard-clock-outline', color: '#F59E0B' }
  return { icon: 'mdi-bell-outline', color: '#27bfa0' }
}

function timeAgo(value) {
  const diff = Math.floor((Date.now() - new Date(value).getTime()) / 1000)
  if (diff < 60) return 'Just now'
  const m = Math.floor(diff / 60)
  if (m < 60) return `${m} minute${m > 1 ? 's' : ''} ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} hour${h > 1 ? 's' : ''} ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d} day${d > 1 ? 's' : ''} ago`
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function fullTime(value) {
  return new Date(value).toLocaleString(undefined, {
    weekday: 'long',
    hour: 'numeric',
    minute: '2-digit'
  })
}

async function updateNotification(n, changes) {
  if (!n || !userId.value) return

  const previous = {}

  Object.keys(changes).forEach((key) => {
    previous[key] = n[key]
    n[key] = changes[key]
  })

  try {
    const { data, error } = await supabase
      .from('notifications')
      .update(changes)
      .eq('id', n.id)
      .eq('recipient_user_id', userId.value)
      .select('id')
      .maybeSingle()

    if (error) throw error

    if (!data) {
      throw new Error('Notification update was not confirmed.')
    }

    return true
  } catch (error) {
    Object.assign(n, previous)
    console.error('Notification update failed:', error)
    return false
  }
}

async function archiveNotification(n) {
  return updateNotification(n, {
    archived_at: new Date().toISOString()
  })
}

async function deleteNotification(n) {
  return updateNotification(n, {
    deleted_at: new Date().toISOString()
  })
}

async function restoreNotification(n) {
  return updateNotification(n, {
    archived_at: null,
    deleted_at: null
  })
}

async function permanentlyDeleteNotification(n) {
  if (!n || !userId.value) return

  const previous = [...notifications.value]

  notifications.value = notifications.value.filter((item) => item.id !== n.id)

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', n.id)
    .eq('recipient_user_id', userId.value)

  if (error) {
    notifications.value = previous
    console.error('Permanent deletion failed:', error)
  }
}
</script>

<template>
  <v-menu v-model="menu" :close-on-content-click="false" location="bottom end" offset="8">
    <template #activator="{ props }">
      <v-btn v-bind="props" icon variant="text" size="small" aria-label="Notifications">
        <v-badge
          :model-value="unreadCount > 0"
          :content="unreadCount > 99 ? '99+' : unreadCount"
          color="error"
          floating
        >
          <v-icon icon="mdi-bell-outline" />
        </v-badge>
      </v-btn>
    </template>

    <v-card width="420" max-width="95vw" rounded="xl" elevation="8" class="notif-card">
      <!-- Header -->
      <div class="d-flex align-center justify-space-between px-4 pt-4 pb-2">
        <div class="text-subtitle-1 font-weight-bold">Your notifications</div>
        <v-btn icon variant="text" size="small" title="Mark all as read" @click="markAllRead">
          <v-icon icon="mdi-check-all" />
        </v-btn>
      </div>

      <!-- Tabs -->

      <!-- Tabs -->
      <div class="px-4 pb-3">
        <div class="notif-tabs">
          <button
            v-for="t in tabs"
            :key="t.key"
            type="button"
            class="notif-tab"
            :class="{ active: tab === t.key }"
            @click="tab = t.key"
          >
            {{ t.label }}
            <span class="notif-count">{{ t.count }}</span>
          </button>
        </div>
      </div>

      <v-divider />

      <!-- List -->
      <div class="notif-list">
        <div v-if="loading && !notifications.length" class="pa-8 text-center">
          <v-progress-circular indeterminate size="24" color="#27bfa0" />
        </div>

        <div v-else-if="!visible.length" class="pa-8 text-center text-medium-emphasis">
          <v-icon icon="mdi-bell-sleep-outline" size="36" class="mb-2" />
          <div class="text-body-2">You're all caught up</div>
        </div>

        <template v-else>
          <div
            v-for="n in visible"
            :key="n.id"
            class="notif-item"
            :class="{ unread: !n.read_at }"
            @click="openNotification(n)"
          >
            <v-avatar size="40" :style="{ backgroundColor: typeMeta(n.type).color + '22' }">
              <v-icon :icon="typeMeta(n.type).icon" :color="typeMeta(n.type).color" />
            </v-avatar>

            <div class="notif-body">
              <div class="d-flex align-start justify-space-between ga-2">
                <div class="text-body-2 font-weight-semibold">{{ n.title }}</div>
                <span v-if="!n.read_at" class="notif-dot" />
              </div>

              <div class="d-flex justify-space-between text-caption text-medium-emphasis mt-1">
                <span>{{ fullTime(n.created_at) }}</span>
                <span>{{ timeAgo(n.created_at) }}</span>
              </div>

              <div v-if="n.body" class="notif-message mt-2">{{ n.body }}</div>

<div class="notif-actions mt-3">
  <!-- Normal notifications -->
  <template v-if="!n.archived_at && !n.deleted_at">
    <v-btn
      v-if="!n.read_at"
      size="x-small"
      variant="tonal"
      color="primary"
      @click.stop="markRead(n)"
    >
      Mark as read
    </v-btn>

    <v-btn
      size="x-small"
      variant="text"
      color="success"
      @click.stop="archiveNotification(n)"
    >
      <v-icon start size="small">mdi-archive-outline</v-icon>
      Archive
    </v-btn>

    <v-btn
      size="x-small"
      variant="text"
      color="error"
      @click.stop="deleteNotification(n)"
    >
      <v-icon start size="small">mdi-delete-outline</v-icon>
      Delete
    </v-btn>
  </template>

  <!-- Archived notifications -->
  <template v-else-if="n.archived_at && !n.deleted_at">
    <v-btn
      size="x-small"
      variant="tonal"
      color="success"
      @click.stop="restoreNotification(n)"
    >
      <v-icon start size="small">mdi-restore</v-icon>
      Unarchive
    </v-btn>

    <v-btn
      size="x-small"
      variant="text"
      color="error"
      @click.stop="deleteNotification(n)"
    >
      Delete
    </v-btn>
  </template>

  <!-- Deleted notifications -->
  <template v-else-if="n.deleted_at">
    <v-btn
      size="x-small"
      variant="tonal"
      color="success"
      @click.stop="restoreNotification(n)"
    >
      <v-icon start size="small">mdi-restore</v-icon>
      Restore
    </v-btn>

    <v-btn
      size="x-small"
      variant="text"
      color="error"
      @click.stop="permanentlyDeleteNotification(n)"
    >
      <v-icon start size="small">mdi-delete-forever-outline</v-icon>
      Delete permanently
    </v-btn>
  </template>
</div>


              <!-- <div v-if="n.request_id" class="mt-3">
                <v-btn
                  size="small"
                  color="primary"
                  variant="flat"
                  @click.stop="openNotification(n)"
                >
                  Review request
                </v-btn>
              </div> -->
            </div>
          </div>
        </template>
      </div>
    </v-card>
  </v-menu>
</template>

<style scoped>
.notif-tabs {
  display: inline-flex;
  gap: 4px;
  padding: 4px;
  background: #f5f5f4;
  border-radius: 10px;
}

.notif-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 600;
  color: #78716c;
  border-radius: 8px;
  transition: background 0.15s;
}

.notif-tab.active {
  background: #fff;
  color: #1c1917;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.08);
}

.notif-count {
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 6px;
  background: #e7e5e4;
}

.notif-list {
  max-height: 440px;
  overflow-y: auto;
}

.notif-item {
  display: flex;
  gap: 12px;
  padding: 14px 16px;
  cursor: pointer;
  border-bottom: 1px solid rgba(128, 128, 128, 0.15);
  transition: background 0.15s;
}

.notif-item:last-child {
  border-bottom: none;
}

.notif-item:hover {
  background: #fafaf9;
}

.notif-item.unread {
  background: #f0fdfa;
}

.notif-body {
  flex: 1;
  min-width: 0;
}

.notif-dot {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  margin-top: 6px;
  border-radius: 50%;
  background: #3b82f6;
}

.notif-message {
  padding: 10px 12px;
  font-size: 13px;
  line-height: 1.5;
  background: #f5f5f4;
  border-radius: 10px;
  overflow-wrap: anywhere;
}

.notif-tabs {
  display: flex;
  gap: 4px;
  padding: 4px;
  background: #f5f5f4;
  border-radius: 10px;
  overflow-x: auto;
  max-width: 100%;
}

.notif-tab {
  flex-shrink: 0;
  white-space: nowrap;
}

.notif-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}

.notif-item {
  align-items: flex-start;
}

.notif-item.unread {
  background: #f0fdfa;
}

</style>
