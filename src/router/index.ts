import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '@/views/dashboard/DashboardView.vue'
import Login from '@/views/Login.vue'
import DatabaseView from '@/views/dashboard/DatabaseView.vue'
import Facilities from '@/views/Facilities.vue'
import Loans from '@/views/Loans.vue'
import Customers from '@/views/Customers.vue'
import ProfitLoss from '@/views/ProfitLoss.vue'
import Repayments from '@/views/Repayments.vue'
import Agents from '@/views/Agents.vue'
import Logs from '@/views/Logs.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'login',
      component: Login
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView
    },
    {
      path: '/facilities',
      name: 'facilities',
      component: Facilities
    },
    {
      path: '/loans',
      name: 'loans',
      component: Loans
    },
    {
      path: '/customers',
      name: 'customers',
      component: Customers
    },
    {
      path: '/profit-loss',
      name: 'profit-loss',
      component: ProfitLoss
    },
    {
      path: '/repayments',
      name: 'repayments',
      component: Repayments
    },
    {
      path: '/agents',
      name: 'agents',
      component: Agents
    },
    {
      path: '/logs',
      name: 'logs',
      component: Logs
    },
  ]
})

export default router
