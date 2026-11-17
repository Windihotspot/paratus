

<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/services/supabase'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

const notifications = ref([])
const loading = ref(false)
const updatingId = ref(null)

let channel = null

const userId = computed(() =>
  auth.user?.id || auth.profile?.id || null
)

const latestNotification = computed(() => {
  return [...notifications.value]
    .filter(item => !item.read_at)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0] || null
})

const unreadCount = computed(() =>
  notifications.value.filter(item => !item.read_at).length
)

const notificationColor = computed(() => {
  const type = latestNotification.value?.type

  if (type === 'approval_approved') return 'success'
  if (type === 'approval_rejected') return 'error'
  if (type === 'approval_requested') return 'info'

  return 'info'
})

const notificationIcon = computed(() => {
  const type = latestNotification.value?.type

  if (type === 'approval_approved') return 'mdi-check-circle-outline'
  if (type === 'approval_rejected') return 'mdi-close-circle-outline'
  if (type === 'approval_requested') return 'mdi-clipboard-alert-outline'

  return 'mdi-bell-outline'
})

function upsertNotification(notification) {
  const index = notifications.value.findIndex(
    item => item.id === notification.id
  )

  if (index === -1) {
    notifications.value.unshift(notification)
  } else {
    notifications.value[index] = notification
  }
}

async function loadNotifications(id) {
  loading.value = true

  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('id, recipient_user_id, type, title, body, request_id, read_at, created_at')
      .eq('recipient_user_id', id)
      .is('read_at', null)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) throw error

    notifications.value = data || []
  } catch (error) {
    console.error('Unable to load notifications:', error)
  } finally {
    loading.value = false
  }
}

function subscribeToNotifications(id) {
  channel = supabase
    .channel(`notifications-${id}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `recipient_user_id=eq.${id}`
      },
      payload => {
        if (payload.eventType === 'INSERT') {
          upsertNotification(payload.new)
        }

        if (payload.eventType === 'UPDATE') {
          if (payload.new.read_at) {
            notifications.value = notifications.value.filter(
              item => item.id !== payload.new.id
            )
          } else {
            upsertNotification(payload.new)
          }
        }

        if (payload.eventType === 'DELETE') {
          notifications.value = notifications.value.filter(
            item => item.id !== payload.old.id
          )
        }
      }
    )
    .subscribe()
}

async function markAsRead(notification) {
  if (!notification || updatingId.value) return false

  updatingId.value = notification.id

  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notification.id)
      .eq('recipient_user_id', userId.value)
      .is('read_at', null)

    if (error) throw error

    notifications.value = notifications.value.filter(
      item => item.id !== notification.id
    )

    return true
  } catch (error) {
    console.error('Unable to mark notification as read:', error)
    return false
  } finally {
    updatingId.value = null
  }
}

// NEW: Open the approval details page
async function openNotification(notification) {
  if (!notification) return

  if (notification.request_id) {
    const success = notification.read_at
      ? true
      : await markAsRead(notification)

    if (!success) return

    router.push({
      name: 'ApprovalDetails',
      params: { id: notification.request_id }
    })

    return
  }

  await markAsRead(notification)
}

function formatDate(value) {
  if (!value) return ''

  return new Intl.DateTimeFormat('en', {
    hour: '2-digit',
    minute: '2-digit',
    day: 'numeric',
    month: 'short'
  }).format(new Date(value))
}

watch(
  userId,
  async id => {
    if (channel) {
      await supabase.removeChannel(channel)
      channel = null
    }

    notifications.value = []

    if (!id) return

    await loadNotifications(id)
    subscribeToNotifications(id)
  },
  { immediate: true }
)

onBeforeUnmount(async () => {
  if (channel) {
    await supabase.removeChannel(channel)
    channel = null
  }
})
</script>



<template>
  <div
    v-if="latestNotification"
    class="notifications-banner"
  >
    <v-alert
      :type="notificationColor"
      variant="tonal"
      density="comfortable"
      rounded="lg"
      class="notification-alert"
    >
      <template #prepend>
        <v-icon
          :icon="notificationIcon"
          size="24"
        />
      </template>

      <div
        class="notification-content"
        :class="{ clickable: latestNotification.request_id }"
        @click="openNotification(latestNotification)"
      >
        <div class="notification-heading">
          <strong>{{ latestNotification.title }}</strong>

          <v-chip
            v-if="unreadCount > 1"
            size="x-small"
            color="primary"
            variant="flat"
          >
            {{ unreadCount }} unread
          </v-chip>
        </div>

        <div class="notification-body">
          {{ latestNotification.body }}
        </div>

        <div class="notification-time">
          {{ formatDate(latestNotification.created_at) }}
        </div>

        <div
          v-if="latestNotification.request_id"
          class="view-request"
        >
          View request details
          <v-icon size="14">mdi-arrow-right</v-icon>
        </div>
      </div>

      <template #append>
        <v-btn
          icon="mdi-check"
          size="small"
          variant="text"
          :loading="updatingId === latestNotification.id"
          aria-label="Mark notification as read"
          @click.stop="markAsRead(latestNotification)"
        />

        <v-btn
          icon="mdi-close"
          size="small"
          variant="text"
          aria-label="Dismiss notification"
          @click.stop="markAsRead(latestNotification)"
        />
      </template>
    </v-alert>
  </div>
</template>

<style scoped>
.notifications-banner {
  position: sticky;
  top: 0;
  z-index: 1000;
  width: 100%;
  padding: 8px 16px;
  background: #f5f7f9;
}

.notification-content {
  min-width: 0;
}

.notification-content.clickable {
  cursor: pointer;
}

.view-request {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #168f78;
}

.view-request:hover {
  text-decoration: underline;
}
.notifications-banner {
  position: sticky;
  top: 0;
  z-index: 1000;
  width: 100%;
  padding: 8px 16px;
  background: #f5f7f9;
}

.notification-alert {
  margin: 0;
}

.notification-content {
  min-width: 0;
}

.notification-heading {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 3px;
}

.notification-body {
  font-size: 13px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.notification-time {
  margin-top: 4px;
  font-size: 11px;
  opacity: 0.7;
}

@media (max-width: 600px) {
  .notifications-banner {
    padding: 6px 8px;
  }
}
</style>
