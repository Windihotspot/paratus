import { createRouter, createWebHistory } from 'vue-router'
import Login from '@/views/Login.vue'
import DashboardView from '@/views/dashboard/DashboardView.vue'
import Facilities from '@/views/Facilities.vue'
import Loans from '@/views/Loans.vue'
import Customers from '@/views/Customers.vue'
import ProfitLoss from '@/views/ProfitLoss.vue'
import Repayments from '@/views/Repayments.vue'
import Agents from '@/views/Agents.vue'
import Logs from '@/views/Logs.vue'
import Banks from '@/views/Banks.vue'
import CustomerApplication from '@/views/CustomerApplication.vue'
import Applications from '@/views/Applications.vue'
import UsersPage from '@/views/UsersPage.vue'

import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // =====================
    // AUTH
    // =====================
    {
      path: '/',
      name: 'login',
      component: Login
    },


    // =====================
    // DASHBOARD
    // =====================
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
      meta: { roles: ['admin', 'staff', 'viewer'] }
    },

    // =====================
    // CORE MODULES
    // =====================
    {
      path: '/facilities',
      name: 'facilities',
      component: Facilities,
      meta: { roles: ['admin', 'staff'] }
    },
    {
      path: '/loans',
      name: 'loans',
      component: Loans,
      meta: { roles: ['admin', 'staff', 'viewer'] }
    },
    {
      path: '/customers',
      name: 'customers',
      component: Customers,
      meta: { roles: ['admin', 'staff'] }
    },
    {
      path: '/profit-loss',
      name: 'profit-loss',
      component: ProfitLoss,
      meta: { roles: ['admin'] }
    },
    {
      path: '/repayments',
      name: 'repayments',
      component: Repayments,
      meta: { roles: ['admin', 'staff'] }
    },
    {
      path: '/agents',
      name: 'agents',
      component: Agents,
      meta: { roles: ['admin', 'staff'] }
    },
    {
      path: '/logs',
      name: 'logs',
      component: Logs,
      meta: { roles: ['admin'] }
    },
    {
      path: '/banks',
      name: 'banks',
      component: Banks,
      meta: { roles: ['admin'] }
    },

    // =====================
    // APPLICATIONS
    // =====================
    {
      path: '/customer-applications',
      name: 'customer-applications',
      component: CustomerApplication,
      meta: { roles: ['admin', 'staff', 'viewer'] }
    },
    {
      path: '/applications',
      name: 'applications',
      component: Applications,
      meta: { roles: ['admin', 'staff'] }
    },

    // =====================
    // USERS (STRICT)
    // =====================
    {
      path: '/users',
      name: 'users',
      component: UsersPage,
      meta: { roles: ['admin'] }
    }
  ]
})

// =====================
// GLOBAL GUARD
// =====================
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const role = authStore.role

  // Always allow login
  if (to.name === 'login') {
    return next()
  }

  // If not logged in → redirect to login
  if (!role) {
    return next('/')
  }

  // Role-based access control
  const allowedRoles = to.meta?.roles

  if (allowedRoles && !allowedRoles.includes(role)) {
    return next('/403')
  }

  next()
})

export default router