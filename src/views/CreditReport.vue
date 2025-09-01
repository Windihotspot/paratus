<script setup>
import MainLayout from '@/layouts/full/MainLayout.vue'
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
const route = useRoute()
const activeTab = ref('first_central')
const loading = ref(false)
import Axios from 'axios'
import { useAuthStore } from '@/stores/auth'
const authStore = useAuthStore()
import moment from 'moment'
import CreditReportExport from '@/components/CreditReportExport.vue'

const tabs = [
  { key: 'first_central', label: 'First Central' },
  { key: 'credit_registry', label: 'Credit Registry' }
]
const idType = ref('')
// FCBC report sections
const personal = ref({})
const summary = ref({})
const creditAgreementSummary = ref([])
const enquiryHistory = ref([])
const employmentHistory = ref([])
const addressHistory = ref([])

const loanAccounts = ref([])
const delinquentAccounts = ref([])
const closedAccounts = ref([])
const derogatoryAccounts = ref([])
const writtenOffAccounts = ref([])
const unknownAccounts = ref([])
const inquiryHistory = ref([])

const businessData = ref({})
const directors = ref([])

function formatNaira(value) {
  if (!value) return '₦0.00'

  // Strip commas or whitespace and parse to float
  const cleaned = parseFloat(String(value).replace(/,/g, '').trim())

  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2
  }).format(isNaN(cleaned) ? 0 : cleaned)
}

function getStatusColor(status) {
  if (!status || status.trim() === '') return 'grey'

  const normalized = status.toLowerCase().trim()

  if (normalized === 'closed') return 'green'
  if (normalized === 'open') return 'red'
  if (normalized === 'paid up') return 'blue'

  return 'grey' // fallback for unknown values
}

// Normalize FCBC format for both individual (array) and business (object with numeric keys)
const normalizeFcbcInput = (input) => {
  if (Array.isArray(input)) return input

  const result = []
  for (const key in input) {
    if (!isNaN(Number(key))) {
      result.push(input[key])
    }
  }
  return result
}

// Merge keys from each item in the normalized array
const mergeFcbcArray = (arr) => {
  const result = {}
  for (const item of arr) {
    for (const key in item) {
      if (Object.hasOwn(item, key)) {
        result[key] = item[key]
      }
    }
  }
  return result
}

// FCBC section counts (for use in template)
const fcbcSubjectListCount = ref(0)
const fcbcBusinessDataCount = ref(0)
const fcbcHighestDelinquencyRatingCount = ref(0)
const fcbcFacilityPerformanceSummaryCount = ref(0)
const fcbcDirectorInformationCount = ref(0)
const fcbcAccountMonthlyPaymentHistoryCount = ref(0)
const fcbcAccountMonthlyPaymentHistoryHeaderCount = ref(0)
const fcbcAdditionalContactHistoryCount = ref(0)
const fcbcAddressHistoryCount = ref(0)
const fcbcCreditAgreementSummaryCount = ref(0)
const fcbcEnquiryDetailsCount = ref(0)
const fcbcEnquiryHistoryTopCount = ref(0)

const fetchCreditReport = async (creditReportId) => {
  const savedAuth = localStorage.getItem('data') ? JSON.parse(localStorage.getItem('data')) : null

  const token = savedAuth ? savedAuth?.token : computed(() => authStore.token)?.value

  const tenantId = savedAuth
    ? savedAuth.user?.business_name
      ? savedAuth.user?.id
      : savedAuth.user?.tenant_id
    : computed(() => (authStore.user?.business_name ? authStore.user.id : authStore.user.tenant_id))
        ?.value

  const apiUrl = `https://staging.getjupita.com/api/${tenantId}/get-credit-check-key?unique_key=${creditReportId}`
  loading.value = true

  try {
    const response = await Axios.get(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    const report = response.data.data
    console.log('🟢 Full Report:', report)
    const creditHistory = report?.credit_history
    idType.value = creditHistory.id_type
    const rawFcbc = creditHistory?.fcbc_credit_history
    const normalizedFcbc = normalizeFcbcInput(rawFcbc)
    console.log('🔍 Normalized FCBC:', normalizedFcbc)
    const creditRegistryHistory = creditHistory?.credit_registry_history.AccountData
    console.log('🔍 typeof rawFcbc:', typeof rawFcbc)
    console.log('🔍 rawFcbc isArray:', Array.isArray(rawFcbc))
    console.log('✅ FCBC raw(array)Data:', rawFcbc)
    console.log('✅ Credit Registry History Data:', creditRegistryHistory)
    console.log('📌 idType', idType.value)

    const fcbcCreditHistory = mergeFcbcArray(normalizedFcbc)
    console.log('✅ Merged FCBC Object:', fcbcCreditHistory)

    if (idType.value === 'business') {
      fcbcHighestDelinquencyRatingCount.value = Array.isArray(
        fcbcCreditHistory.HighestDelinquencyRating
      )
        ? fcbcCreditHistory.HighestDelinquencyRating.length
        : 0

      fcbcCreditAgreementSummaryCount.value = Array.isArray(
        fcbcCreditHistory.CreditAgreementSummary
      )
        ? fcbcCreditHistory.CreditAgreementSummary.length
        : 0
      // Business specific extraction
      const businessDataArray = fcbcCreditHistory?.BusinessData || []
      const directorInfoArray = fcbcCreditHistory?.DirectorInformation || []

      businessData.value = businessDataArray[0] || {}
      directors.value = directorInfoArray

      console.log('✅FCBC BusinessData:', businessData.value)
      console.log('✅FCBC Directors:', directors.value)

      // Summary
      const rawSummary = fcbcCreditHistory?.CreditAccountSummary
      summary.value = Array.isArray(rawSummary) && rawSummary.length > 0 ? rawSummary[0] : {}
      console.log('✅FCBC Summary:', summary.value)

      // Credit Agreements
      const rawCreditAgreementSummary = fcbcCreditHistory?.CreditAgreementSummary ?? []
      creditAgreementSummary.value = rawCreditAgreementSummary.map((item, index) => ({
        uid: `${item.AccountNo || 'acc'}-${index}`,
        lender: item.SubscriberName,
        date: moment(item.DateAccountOpened).format('DD/MM/YYYY'),
        amount: formatNaira(item.OpeningBalanceAmt ?? '0'),
        balance: formatNaira(item.CurrentBalanceAmt ?? '0'),
        status: item.AccountStatus,

        // Additional fields for dropdown
        accountNo: item.AccountNo,
        closedDate: moment(item.ClosedDate).format('DD/MM/YYYY'),
        duration: item.LoanDuration,
        repaymentFrequency: item.RepaymentFrequency,
        overdue: formatNaira(item.AmountOverdue),
        instalment: formatNaira(item.InstalmentAmount),
        performanceStatus: item.PerformanceStatus,
        currency: item.Currency
      }))

      console.log('✅FCBC Credit Agreement Summary:', creditAgreementSummary.value)

      // Enquiry history
      const rawEnquiryHistoryTop = fcbcCreditHistory?.EnquiryHistoryTop ?? []

      enquiryHistory.value = rawEnquiryHistoryTop
        .filter((item) => {
          const lender = item.SubscriberName?.trim()
          const date = item.DateRequested?.trim()
          return lender && date // Keep only entries with valid lender and date
        })
        .map((item) => ({
          lender: item.SubscriberName.trim(),
          date: moment(item.DateRequested).format('DD/MM/YYYY'),
          rawDate: moment(item.LastUpdatedDate)
        }))

      console.log('✅ FCBC Enquiry History (cleaned):', enquiryHistory.value)

      // Employment history
      const rawEmploymentHistory = fcbcCreditHistory?.EmploymentHistory ?? []
      employmentHistory.value = rawEmploymentHistory.map((item) => ({
        employerName: item.EmployerDetail,
        date: moment(item.UpdateDate).format('DD/MM/YYYY'),
        rawDate: moment(item.UpdateDate)
      }))
      console.log('✅FCBC Employment History:', employmentHistory.value)

      // Address history
      const rawAddressHistory = fcbcCreditHistory?.AddressHistory ?? []
      addressHistory.value = rawAddressHistory.map((item) => ({
        address: [
          item.CommercialAddress1,
          item.CommercialAddress2,
          item.CommercialAddress3,
          item.CommercialAddress4
        ]
          .map((part) => part?.trim()) // remove leading/trailing spaces
          .filter((part) => part) // remove empty or whitespace-only
          .join(', '),
        date: item.UpDateOnDate || ''
      }))

      console.log('✅FCBC Address History:', addressHistory.value)

      // credit registry

      // performing accounts
      if (creditRegistryHistory && Array.isArray(creditRegistryHistory.PerformingAccounts)) {
        loanAccounts.value = creditRegistryHistory.PerformingAccounts.map((account, index) => ({
          uid: `${account.Account_No || 'acc'}-${index}`,
          lender: account.CreditorName,
          date: moment(account.Date_Opened).format('DD/MM/YYYY'),
          amount: formatNaira(account.Credit_Limit || 0),
          balance: formatNaira(account.Balance || 0),
          status: account.Account_Status || 'Performing',
          raw: account, // optional for future use

          // Additional fields for dropdown
          accountNo: account.Account_No,
          closedDate: moment(account.Balance_Date).format('DD/MM/YYYY'),
          duration: account.Term,
          repaymentFrequency: account.RepaymentFrequency,
          overdue: formatNaira(account.AmountOverdue),
          instalment: formatNaira(account.Minimum_Installment),
          performanceStatus: account.Account_Status,
          currency: account.Currency
        }))

        console.log('✅credit registry performing accounts:', loanAccounts.value)
      } else {
        console.warn('⚠️credit registry PerformingAccounts not found')
      }
      // Delinquents Accounts Mapping
      if (Array.isArray(creditRegistryHistory.DelinquentAccounts)) {
        delinquentAccounts.value = creditRegistryHistory.DelinquentAccounts.map((account) => ({
          lender: account.CreditorName,
          date: moment(account.Date_Opened).format('DD/MM/YYYY'),
          amount: formatNaira(account.CredidelinquentAccountst_Limit || 0),
          balance: formatNaira(account.Balance || 0),
          status: account.Account_Status || 'Delinquent',
          raw: account,

          // Additional fields for dropdown
          accountNo: account.Account_No,
          closedDate: account.Balance_Date,
          duration: account.Term,
          repaymentFrequency: account.RepaymentFrequency,
          overdue: formatNaira(account.AmountOverdue),
          instalment: account.Minimum_Installment,
          performanceStatus: account.Account_Status,
          currency: account.Currency
        }))

        console.log('✅credit registry Delinquents Accounts:', delinquentAccounts.value)
      } else {
        console.warn('⚠️credit registry Delinquents accounts not found')
      }

      // Closed Accounts Mapping
      if (Array.isArray(creditRegistryHistory.closedAccounts)) {
        closedAccounts.value = creditRegistryHistory.ClosedAccounts.map((account) => ({
          lender: account.CreditorName,
          date: moment(account.Date_Opened).format('DD/MM/YYYY'),
          amount: account.Credit_Limit || 0,
          balance: account.Balance || 0,
          status: account.Account_Status || 'closed',
          raw: account,

          // Additional fields for dropdown
          accountNo: account.Account_No,
          closedDate: account.Balance_Date,
          duration: account.Term,
          repaymentFrequency: account.RepaymentFrequency,
          overdue: account.AmountOverdue,
          instalment: account.Minimum_Installment,
          performanceStatus: account.Account_Status,
          currency: account.Currency
        }))

        console.log('✅credit registry Closed Accounts:', closedAccounts.value)
      } else {
        console.warn('⚠️credit registry Closed accounts not found')
      }

      // derogatory accounts
      if (Array.isArray(creditRegistryHistory.DerogatoryAccounts)) {
        derogatoryAccounts.value = creditRegistryHistory.DerogatoryAccounts.map((account) => ({
          lender: account.CreditorName,
          date: moment(account.Date_Opened).format('DD/MM/YYYY'),
          amount: account.Credit_Limit || 0,
          balance: account.Balance || 0,
          status: account.Account_Status || 'Derogatory',
          raw: account,

          // Additional fields for dropdown
          accountNo: account.Account_No,
          closedDate: account.Balance_Date,
          duration: account.Term,
          repaymentFrequency: account.RepaymentFrequency,
          overdue: account.AmountOverdue,
          instalment: account.Minimum_Installment,
          performanceStatus: account.Account_Status,
          currency: account.Currency
        }))

        console.log('✅credit registry Derogatory Accounts:', derogatoryAccounts.value)
      } else {
        console.warn('⚠️credit registry DerogatoryAccounts not found')
      }

      // Written off accounts
      if (creditRegistryHistory && Array.isArray(creditRegistryHistory.WrittenOffAccounts)) {
        writtenOffAccounts.value = creditRegistryHistory.WrittenOffAccounts.map((account) => ({
          lender: account.CreditorName || 'N/A',
          date: moment(account.Date_Opened).format('DD/MM/YYYY'),
          amount: account.Credit_Limit || 0,
          balance: account.Balance || 0,
          raw: account, // optional for future use

          // Additional fields for dropdown
          accountNo: account.Account_No,
          closedDate: account.Balance_Date,
          duration: account.Term,
          repaymentFrequency: account.RepaymentFrequency,
          overdue: account.AmountOverdue,
          instalment: account.Minimum_Installment,
          performanceStatus: account.Account_Status,
          currency: account.Currency
        }))

        console.log('✅credit registry writtenOffAccounts:', writtenOffAccounts.value)
      } else {
        console.warn('⚠️credit registry WrittenOffAccounts not found or invalid')
      }

      // Unknown Accounts
      if (creditRegistryHistory && Array.isArray(creditRegistryHistory.UnknownStatusAccounts)) {
        unknownAccounts.value = creditRegistryHistory.UnknownStatusAccounts.map((account) => ({
          lender: account.CreditorName || 'N/A',
          date: moment(account.Date_Opened).format('DD/MM/YYYY'),
          amount: account.Credit_Limit || 0,
          balance: account.Balance || 0,
          raw: account, // optional for future use

          // Additional fields for dropdown
          accountNo: account.Account_No,
          closedDate: account.Balance_Date,
          duration: account.Term,
          repaymentFrequency: account.RepaymentFrequency,
          overdue: account.AmountOverdue,
          instalment: account.Minimum_Installment,
          performanceStatus: account.Account_Status,
          currency: account.Currency
        }))

        console.log('✅credit registry unknownaccounts:', unknownAccounts.value)
      } else {
        console.warn('⚠️credit registry UnknownStatusAccounts not found or invalid')
      }
      // Inquiry History
      if (creditRegistryHistory.InquiryHistory?.length) {
        inquiryHistory.value = creditRegistryHistory.InquiryHistory.map((entry) => ({
          subscriber: entry.Subscriber || 'Unknown',
          date: moment(entry.InquiryDate).format('DD/MM/YYYY'),
          phone: entry.ContactPhone || 'N/A',
          reason: entry.Reason || 'N/A',
          raw: entry
        }))
        console.log('✅credit registry Inquiry History:', inquiryHistory.value)
      }
    } else {
      // Individual logic
      fcbcHighestDelinquencyRatingCount.value = Array.isArray(
        fcbcCreditHistory.DeliquencyInformation
      )
        ? fcbcCreditHistory.DeliquencyInformation.length
        : 0

      fcbcCreditAgreementSummaryCount.value = Array.isArray(
        fcbcCreditHistory.CreditAgreementSummary
      )
        ? fcbcCreditHistory.CreditAgreementSummary.length
        : 0

      // FCBC
      // Personal Details
      const rawPersonal = fcbcCreditHistory?.PersonalDetailsSummary
      personal.value = Array.isArray(rawPersonal) && rawPersonal.length > 0 ? rawPersonal[0] : {}
      console.log('✅FCBC Personal:', personal.value)

      // Summary
      const rawSummary = fcbcCreditHistory?.CreditAccountSummary
      summary.value = Array.isArray(rawSummary) && rawSummary.length > 0 ? rawSummary[0] : {}
      console.log('✅FCBC Summary:', summary.value)

      // Credit Agreements
      const rawCreditAgreementSummary = fcbcCreditHistory?.CreditAgreementSummary ?? []
      creditAgreementSummary.value = rawCreditAgreementSummary.map((item, index) => ({
        uid: `${item.AccountNo || 'acc'}-${index}`,
        lender: item.SubscriberName,
        date: moment(item.DateAccountOpened).format('DD/MM/YYYY'),
        amount: parseFloat(item.OpeningBalanceAmt ?? '0'),
        balance: parseFloat(item.CurrentBalanceAmt ?? '0'),
        status: item.AccountStatus,

        // Additional fields for dropdown
        accountNo: item.AccountNo,
        closedDate: moment(item.ClosedDate).format('DD/MM/YYYY'),
        duration: item.LoanDuration,
        repaymentFrequency: item.RepaymentFrequency,
        overdue: item.AmountOverdue,
        instalment: item.InstalmentAmount,
        performanceStatus: item.PerformanceStatus,
        currency: item.Currency
      }))

      console.log('✅FCBC Credit Agreement Summary:', creditAgreementSummary.value)

      // Enquiry history
      const rawEnquiryHistoryTop = fcbcCreditHistory?.EnquiryHistoryTop ?? []
      enquiryHistory.value = rawEnquiryHistoryTop.map((item) => ({
        lender: item.SubscriberName,
        date: moment(item.DateRequested).format('DD/MM/YYYY'),
        rawDate: moment(item.LastUpdatedDate)
      }))
      console.log('✅FCBC Enquiry History:', enquiryHistory.value)

      // Employment history
      const rawEmploymentHistory = fcbcCreditHistory?.EmploymentHistory ?? []

      employmentHistory.value = rawEmploymentHistory
        .filter((item) => {
          const employer = item.EmployerDetail?.trim()
          const date = item.UpdateDate?.trim()
          return employer && date
        })
        .map((item) => ({
          employerName: item.EmployerDetail.trim(),
          date: moment(item.UpdateDate).format('DD/MM/YYYY'),
          rawDate: moment(item.UpdateDate)
        }))

      console.log('✅ FCBC Employment History (cleaned):', employmentHistory.value)

      // Address history
      const rawAddressHistory = fcbcCreditHistory?.AddressHistory ?? []
      addressHistory.value = rawAddressHistory.map((item) => ({
        address: [
          item.CommercialAddress1,
          item.CommercialAddress2,
          item.CommercialAddress3,
          item.CommercialAddress4
        ]
          .map((part) => part?.trim()) // remove leading/trailing spaces
          .filter((part) => part) // remove empty or whitespace-only
          .join(', '),
        date: item.UpDateOnDate || ''
      }))

      console.log('✅FCBC Address History:', addressHistory.value)

      // credit registry

      // performing accounts
      if (creditRegistryHistory && Array.isArray(creditRegistryHistory.PerformingAccounts)) {
        loanAccounts.value = creditRegistryHistory.PerformingAccounts.map((account, index) => ({
          uid: `${account.AccountNo || 'acc'}-${index}`,
          lender: account.CreditorName,
          date: moment(account.Date_Opened).format('DD/MM/YYYY'),
          amount: account.Credit_Limit || 0,
          balance: account.Balance || 0,
          status: account.Account_Status || 'Performing',
          raw: account, // optional for future use

          // Additional fields for dropdown
          accountNo: account.Account_No,
          closedDate: moment(account.Balance_Date).format('DD/MM/YYYY'),
          duration: account.Term,
          repaymentFrequency: account.RepaymentFrequency,
          overdue: account.AmountOverdue,
          instalment: account.Minimum_Installment,
          performanceStatus: account.Account_Status,
          currency: account.Currency
        }))

        console.log('✅credit registry performing accounts:', loanAccounts.value)
      } else {
        console.warn('⚠️credit registry PerformingAccounts not found')
      }
      // Delinquents Accounts Mapping
      if (Array.isArray(creditRegistryHistory.DelinquentAccounts)) {
        delinquentAccounts.value = creditRegistryHistory.DelinquentAccounts.map((account) => ({
          lender: account.CreditorName,
          date: moment(account.Date_Opened).format('DD/MM/YYYY'),
          amount: account.CredidelinquentAccountst_Limit || 0,
          balance: account.Balance || 0,
          status: account.Account_Status || 'Delinquent',
          raw: account,

          // Additional fields for dropdown
          accountNo: account.Account_No,
          closedDate: account.Balance_Date,
          duration: account.Term,
          repaymentFrequency: account.RepaymentFrequency,
          overdue: account.AmountOverdue,
          instalment: account.Minimum_Installment,
          performanceStatus: account.Account_Status,
          currency: account.Currency
        }))

        console.log('✅credit registry Delinquents Accounts:', delinquentAccounts.value)
      } else {
        console.warn('⚠️credit registry Delinquents accounts not found')
      }

      // Closed Accounts Mapping
      if (Array.isArray(creditRegistryHistory.closedAccounts)) {
        closedAccounts.value = creditRegistryHistory.ClosedAccounts.map((account) => ({
          lender: account.CreditorName,
          date: moment(account.Date_Opened).format('DD/MM/YYYY'),
          amount: account.Credit_Limit || 0,
          balance: account.Balance || 0,
          status: account.Account_Status || 'closed',
          raw: account,

          // Additional fields for dropdown
          accountNo: account.Account_No,
          closedDate: account.Balance_Date,
          duration: account.Term,
          repaymentFrequency: account.RepaymentFrequency,
          overdue: account.AmountOverdue,
          instalment: account.Minimum_Installment,
          performanceStatus: account.Account_Status,
          currency: account.Currency
        }))

        console.log('✅credit registry Closed Accounts:', closedAccounts.value)
      } else {
        console.warn('⚠️credit registry Closed accounts not found')
      }

      // derogatory accounts
      if (Array.isArray(creditRegistryHistory.DerogatoryAccounts)) {
        derogatoryAccounts.value = creditRegistryHistory.DerogatoryAccounts.map((account) => ({
          lender: account.CreditorName,
          date: moment(account.Date_Opened).format('DD/MM/YYYY'),
          amount: account.Credit_Limit || 0,
          balance: account.Balance || 0,
          status: account.Account_Status || 'Derogatory',
          raw: account,

          // Additional fields for dropdown
          accountNo: account.Account_No,
          closedDate: account.Balance_Date,
          duration: account.Term,
          repaymentFrequency: account.RepaymentFrequency,
          overdue: account.AmountOverdue,
          instalment: account.Minimum_Installment,
          performanceStatus: account.Account_Status,
          currency: account.Currency
        }))

        console.log('✅credit registry Derogatory Accounts:', derogatoryAccounts.value)
      } else {
        console.warn('⚠️credit registry DerogatoryAccounts not found')
      }

      // Written off accounts
      if (creditRegistryHistory && Array.isArray(creditRegistryHistory.WrittenOffAccounts)) {
        writtenOffAccounts.value = creditRegistryHistory.WrittenOffAccounts.map((account) => ({
          lender: account.CreditorName || 'N/A',
          date: moment(account.Date_Opened).format('DD/MM/YYYY'),
          amount: account.Credit_Limit || 0,
          balance: account.Balance || 0,
          raw: account, // optional for future use

          // Additional fields for dropdown
          accountNo: account.Account_No,
          closedDate: account.Balance_Date,
          duration: account.Term,
          repaymentFrequency: account.RepaymentFrequency,
          overdue: account.AmountOverdue,
          instalment: account.Minimum_Installment,
          performanceStatus: account.Account_Status,
          currency: account.Currency
        }))

        console.log('✅credit registry writtenOffAccounts:', writtenOffAccounts.value)
      } else {
        console.warn('⚠️credit registry WrittenOffAccounts not found or invalid')
      }

      // Unknown Accounts
      if (creditRegistryHistory && Array.isArray(creditRegistryHistory.UnknownStatusAccounts)) {
        unknownAccounts.value = creditRegistryHistory.UnknownStatusAccounts.map((account) => ({
          lender: account.CreditorName || 'N/A',
          date: moment(account.Date_Opened).format('DD/MM/YYYY'),
          amount: account.Credit_Limit || 0,
          balance: account.Balance || 0,
          raw: account, // optional for future use

          // Additional fields for dropdown
          accountNo: account.Account_No,
          closedDate: account.Balance_Date,
          duration: account.Term,
          repaymentFrequency: account.RepaymentFrequency,
          overdue: account.AmountOverdue,
          instalment: account.Minimum_Installment,
          performanceStatus: account.Account_Status,
          currency: account.Currency
        }))

        console.log('✅credit registry unknownaccounts:', unknownAccounts.value)
      } else {
        console.warn('⚠️credit registry UnknownStatusAccounts not found or invalid')
      }
      // Inquiry History
      if (creditRegistryHistory.InquiryHistory?.length) {
        inquiryHistory.value = creditRegistryHistory.InquiryHistory.map((entry) => ({
          subscriber: entry.Subscriber || 'Unknown',
          date: moment(entry.InquiryDate).format('DD/MM/YYYY'),
          phone: entry.ContactPhone || 'N/A',
          reason: entry.Reason || 'N/A',
          raw: entry
        }))
        console.log('✅credit registry Inquiry History:', inquiryHistory.value)
      }
    }
  } catch (error) {
    console.error('❌ Error fetching credit report:', error)
  } finally {
    loading.value = false
  }
}

const expanded = ref([])

const toggleRow = (uid) => {
  expanded.value = expanded.value.includes(uid) ? [] : [uid]
}

const isExpanded = (uid) => expanded.value.includes(uid)

const loanHeaders = [
  { title: "Lender's Name", key: 'lender' },
  { title: 'Disbursement Date', key: 'date' },
  { title: 'Loan Amount', value: 'amount' },
  { title: 'Loan Balance', key: 'balance' },
  { title: 'Status', key: 'status' },
  { title: 'Action', key: 'action', sortable: false }
]

const employmentHeaders = [
  { title: 'Employer Name', key: 'employerName' },
  { title: 'Date Updated', key: 'date' }
]

// const loans = ref([
//   {
//     lender: 'Links Microfinance Bank',
//     disbursementDate: '16th Nov, 2024',
//     loanAmount: 32500000,
//     loanBalance: 0,
//     status: 'Closed',
//     accountNo: '032SPLG212310004',
//     amountOverdue: 937500.1,
//     instalmentAmount: 937500.1,
//     loanDuration: 7,
//     repaymentFrequency: 'Monthly',
//     dateOpened: '07/12/2018',
//     closedDate: '01/05/2019',
//     performanceStatus: 'Performing'
//   },
//   {
//     lender: 'ABC Bank',
//     disbursementDate: '10th Jan, 2022',
//     loanAmount: 12500000,
//     loanBalance: 2500000,
//     status: 'Open',
//     accountNo: '012XPLG784512005',
//     amountOverdue: 200000,
//     instalmentAmount: 1000000,
//     loanDuration: 12,
//     repaymentFrequency: 'Quarterly',
//     dateOpened: '01/01/2022',
//     closedDate: 'N/A',
//     performanceStatus: 'Non-Performing'
//   }
// ])
const reportRef = ref(null)
onMounted(() => {
  const unique_key = route.params.unique_key
  if (unique_key) {
    fetchCreditReport(unique_key)
  } else {
    console.warn('❌ Invalid unique key from route')
    loading.value = false
  }
})
</script>

<template>
  <MainLayout>
    <div class="flex justify-between items-center p-2">
      <!-- Tabs -->
      <div class="flex space-x-4">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          @click="activeTab = tab.key"
          :class="activeTab === tab.key ? 'bg-blue-600 text-white' : 'bg-white text-black'"
          class="px-4 py-2 rounded transition text-sm"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Export Button aligned to the right -->
      <div>
        <v-btn
          @click="reportRef?.exportPDF()"
          no-uppercase
          size="small"
          class="normal-case p-4 bg-blue-600 hover:bg-blue-700 text-white text-none custom-btn"
        >
          <i class="fas fa-download mr-2"></i>
          Export PDF
        </v-btn>
      </div>
    </div>

    <div class="mt-4 p-2 mx-auto space-y-6">
      <div v-if="loading" class="flex flex-col items-center justify-center min-h-[200px]">
        <v-progress-circular indeterminate color="#1f5aa3" size="80" width="8" />
        <span class="mt-2 text-gray-600 text-sm">Loading credit report</span>
      </div>

      <!-- Tab Content Transition -->
      <transition name="fade" mode="out-in">
        <div v-if="!loading" :key="activeTab" class="space-y-6">
          <template v-if="activeTab === 'first_central'">
            <div v-if="idType !== 'business'">
              <!-- // personal -->
              <div class="bg-white p-6 rounded space-y-4">
                <h2 class="text-md font-semibold mb-4">Personal details summary</h2>

                <!-- Check if `personal` has any data -->
                <div
                  v-if="personal && Object.keys(personal).length > 0"
                  class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-6 gap-x-8 text-sm text-gray-600"
                >
                  <!-- All your data fields remain unchanged here -->
                  <div>
                    <p class="mb-1">Last Name</p>
                    <p class="font-bold text-gray-900">{{ personal.Surname }}</p>
                  </div>
                  <div>
                    <p class="mb-1">Gender</p>
                    <p class="font-bold text-gray-900">{{ personal.Gender }}</p>
                  </div>
                  <div>
                    <p class="mb-1">Phone Number</p>
                    <p class="font-bold text-gray-900">{{ personal.CellularNo }}</p>
                  </div>
                  <div>
                    <p class="mb-1">Latest Residential Address</p>
                    <p class="font-bold text-gray-900 leading-snug">
                      {{ personal.ResidentialAddress1 }}
                    </p>
                  </div>
                  <div>
                    <p class="mb-1">First Name</p>
                    <p class="font-bold text-gray-900">{{ personal.FirstName }}</p>
                  </div>
                  <div>
                    <p class="mb-1">Bank Verification Number</p>
                    <p class="font-bold text-gray-900">{{ personal.BankVerificationNo }}</p>
                  </div>
                  <div>
                    <p class="mb-1">Work Telephone</p>
                    <p class="font-bold text-gray-900">{{ personal.WorkTelephoneNo }}</p>
                  </div>
                  <div>
                    <p class="mb-1">Other Names</p>
                    <p class="font-bold text-gray-900">{{ personal.OtherNames }}</p>
                  </div>
                  <div>
                    <p class="mb-1">Date of Birth</p>
                    <p class="font-bold text-gray-900">{{ personal.BirthDate }}</p>
                  </div>
                  <div>
                    <p class="mb-1">Home Telephone</p>
                    <p class="font-bold text-gray-900">{{ personal.HomeTelephoneNo }}</p>
                  </div>
                </div>

                <!-- Fallback message if no data -->
                <div v-else class="text-gray-500 text-sm italic">No personal data available.</div>
              </div>
            </div>

            <div v-else>
              <!-- BUSINESS INFORMATION SECTION -->
              <div v-if="idType === 'business'" class="bg-white p-6 rounded space-y-4">
                <h2 class="text-md font-semibold">Business Information</h2>
                <div
                  class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-8 text-sm text-gray-600"
                >
                  <div>
                    <p class="mb-1">Business Name</p>
                    <p class="font-bold text-gray-900">{{ businessData.BusinessName }}</p>
                  </div>
                  <div>
                    <p class="mb-1">Date of Incorporation</p>
                    <p class="font-bold text-gray-900">{{ businessData.DateOfIncorporation }}</p>
                  </div>
                  <div>
                    <p class="mb-1">Business Address</p>
                    <p class="font-bold text-gray-900">
                      {{ businessData.CommercialAddress1 }}, {{ businessData.CommercialAddress2 }},
                      {{ businessData.CommercialAddress4 }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- DIRECTOR INFORMATION TABLE -->
              <div v-if="idType === 'business'" class="bg-white p-6 rounded space-y-4 mt-4">
                <h2 class="text-md font-semibold">Director Information</h2>

                <div v-if="directors.length > 0">
                  <table class="min-w-full text-sm text-left">
                    <thead class="text-xs font-semibold text-gray-700">
                      <tr>
                        <th class="p-2">First Name</th>
                        <th class="p-2">Other Names</th>
                        <th class="p-2">Surname</th>
                        <th class="p-2">Identification Number</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(director, index) in directors" :key="index" class="">
                        <td class="p-2 font-bold text-gray-900">{{ director.firstName }}</td>
                        <td class="p-2 font-bold text-gray-900">{{ director.othernames }}</td>
                        <td class="p-2 font-bold text-gray-900">{{ director.surname }}</td>
                        <td class="p-2 font-bold text-gray-900">
                          {{ director.Identificationnumber }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div v-else class="text-sm text-gray-500 italic">
                  No director information available.
                </div>
              </div>
            </div>

            <!-- Summary -->
            <div class="bg-white p-6 rounded-md mt-4">
              <h2 class="text-md font-semibold mb-6">Summary</h2>

              <!-- Show data if summary object exists and is not empty -->
              <div
                class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-8 text-sm text-gray-600"
              >
                <!-- Row 1 -->
                <div>
                  <p class="mb-1">Total active monthly installment</p>
                  <p class="font-bold text-gray-900">{{ summary.TotalMonthlyInstalment }}</p>
                </div>
                <div>
                  <p class="mb-1">Total no of credit facilities</p>
                  <p class="font-bold text-gray-900">{{ fcbcCreditAgreementSummaryCount }}</p>
                </div>
                <div>
                  <p class="mb-1">Total no of open facilities</p>
                  <p class="font-bold text-gray-900">{{ summary.TotalOpenFacilities }}</p>
                </div>

                <!-- Row 2 -->
                <div>
                  <p class="mb-1">Total arrear amount</p>
                  <p class="font-bold text-gray-900">{{ summary.Amountarrear }}</p>
                </div>
                <div>
                  <p class="mb-1">Total outstanding debts</p>
                  <p class="font-bold text-gray-900">{{ summary.TotalOutstandingdebt }}</p>
                </div>
                <div>
                  <p class="mb-1">Total no of closed credit facilities</p>
                  <p class="font-bold text-gray-900"></p>
                </div>

                <!-- Row 3 -->
                <div>
                  <p class="mb-1">Total no of account in arrears</p>
                  <p class="font-bold text-gray-900">{{ summary.TotalAccountarrear }}</p>
                </div>
                <div>
                  <p class="mb-1">Total no of delinquent facilities</p>
                  <p class="font-bold text-gray-900">{{ fcbcHighestDelinquencyRatingCount }}</p>
                </div>
                <div>
                  <p class="mb-1">Total no written off facilities</p>
                  <p class="font-bold text-gray-900">{{ summary.TotalWrittenOffFacilities }}</p>
                </div>
              </div>

              <!-- Fallback if no data -->
            </div>

            <!-- Loan Accounts Table -->
            <div class="bg-white p-6 rounded">
              <h2 class="text-md font-semibold mb-4">Loan Accounts</h2>

              <div v-if="creditAgreementSummary && creditAgreementSummary.length > 0">
                <v-data-table
                  :headers="loanHeaders"
                  :items="creditAgreementSummary"
                  item-value="uid"
                  :expanded.sync="expanded"
                  class="elevation-1"
                  fixed-header
                  height="400"
                  hide-default-footer
                >
                  <!-- Default item row -->
                  <template #item.status="{ item }">
                    <v-chip
                      :color="getStatusColor(item.status)"
                      variant="tonal"
                      size="small"
                      class="text-white"
                    >
                      {{ item.status?.trim() || 'Unknown' }}
                    </v-chip>
                  </template>
                  <template #item.action="{ item }">
                    <v-btn size="small" color="primary" @click="toggleRow(item.uid)">
                      {{ isExpanded(item.uid) ? 'Hide' : 'View' }}
                    </v-btn>
                  </template>

                  <!-- Expanded content -->
                  <template #expanded-row="{ item }">
                    <td :colspan="loanHeaders.length" class="px-4 py-2 bg-gray-50 mb-4">
                      <div class="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <p><strong>Account number:</strong> {{ item.accountNo }}</p>
                        <p><strong>Loan Amount:</strong> {{ item.amount }}</p>
                        <p><strong>Current Balance:</strong> {{ item.balance }}</p>
                        <p><strong>Amount Overdue:</strong> {{ item.overdue }}</p>
                        <p><strong>Instalment Amount:</strong> {{ item.instalment }}</p>
                        <p><strong>Loan Duration:</strong> {{ item.loanDuration }}</p>
                        <p><strong>Repayment Frequency:</strong> {{ item.repaymentFrequency }}</p>
                        <p><strong>Date Account Opened:</strong> {{ item.date }}</p>
                        <p><strong>Closed Date:</strong> {{ item.closedDate }}</p>
                        <p><strong>Performance Status:</strong> {{ item.performanceStatus }}</p>
                        <p><strong>Account Status:</strong> {{ item.status }}</p>
                      </div>
                    </td>
                  </template>
                </v-data-table>
              </div>

              <div v-else class="text-sm text-gray-500 italic">No loan accounts available.</div>
            </div>

            <!-- Enquiry & Employment History -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Enquiry History -->
              <div class="bg-white rounded p-4">
                <h2 class="font-semibold text-md mb-4">Enquiry History</h2>
                <div v-if="enquiryHistory && enquiryHistory.length > 0">
                  <table class="w-full text-sm text-left">
                    <thead class="bg-gray-100">
                      <tr>
                        <th class="p-2">Lender's Name</th>
                        <th class="p-2">Date Requested</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(enquiry, index) in enquiryHistory" :key="index" class="border-b">
                        <td class="p-2">{{ enquiry.lender }}</td>
                        <td class="p-2">{{ enquiry.date }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div v-else class="text-sm text-gray-500 italic">No enquiry history available.</div>
              </div>

              <!-- Employment History -->
              <div class="bg-white rounded p-4">
                <h2 class="font-semibold text-md mb-4">Employment History</h2>
                <div v-if="employmentHistory && employmentHistory.length > 0">
                  <v-data-table
                    :headers="employmentHeaders"
                    :items="employmentHistory"
                    class="elevation-1"
                    fixed-header
                    height="200"
                  >
                    <template #item.date="{ item }">
                      {{ item.date }}
                    </template>
                  </v-data-table>
                </div>
                <div v-else class="text-sm text-gray-500 italic">
                  No employment history available.
                </div>
              </div>
            </div>

            <!-- Address History -->
            <div class="bg-white rounded p-4">
              <h2 class="font-semibold text-md mb-4">Address History</h2>
              <div v-if="addressHistory && addressHistory.length > 0">
                <div class="overflow-auto max-h-72 border rounded">
                  <table class="min-w-full text-sm text-left">
                    <thead class="bg-gray-100 sticky top-0 z-10">
                      <tr>
                        <th class="p-3 font-medium text-gray-700">Address</th>
                        <th class="p-3 font-medium text-gray-700 w-40">Date Updated</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200">
                      <tr v-for="(address, index) in addressHistory" :key="index">
                        <td class="p-3 text-gray-800">{{ address.address }}</td>
                        <td class="p-3 text-gray-800 w-40">{{ address.date }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div v-else class="text-sm text-gray-500 italic">No address history available.</div>
            </div>
          </template>

          <template v-else-if="activeTab === 'credit_registry'">
            <!-- Personal Details Summary -->
            <div v-if="idType !== 'business'" class="bg-white p-6 rounded space-y-4">
              <h2 class="text-md font-semibold mb-4">Personal details summary</h2>
              <div class="text-gray-500 text-sm italic">No personal data available.</div>
            </div>

            <div v-else>
              <!-- BUSINESS INFORMATION SECTION -->
              <div v-if="idType === 'business'" class="bg-white p-6 rounded space-y-4">
                <h2 class="text-md font-semibold">Business Information</h2>

                <div class="text-sm text-gray-500 italic">
                  No business information available.
                </div>
              </div>

              <!-- DIRECTOR INFORMATION TABLE -->
              <div v-if="idType === 'business'" class="bg-white p-6 rounded space-y-4 mt-4">
                <h2 class="text-md font-semibold">Director Information</h2>

                <div class="text-sm text-gray-500 italic">No director information available.</div>
              </div>
            </div>

            <!-- Summary -->
            <div class="bg-white p-6 rounded-md mt-4">
              <h2 class="text-md font-semibold mb-6">Summary</h2>

              <!-- Show data if summary object exists and is not empty -->
              <div
                class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-8 text-sm text-gray-600"
              >
                <!-- Row 1 -->
                <div>
                  <p class="mb-1">Total active monthly installment</p>
                  <p class="font-bold text-gray-900">{{ summary.TotalMonthlyInstalment }}</p>
                </div>
                <div>
                  <p class="mb-1">Total no of credit facilities</p>
                  <p class="font-bold text-gray-900">{{ fcbcCreditAgreementSummaryCount }}</p>
                </div>
                <div>
                  <p class="mb-1">Total no of open facilities</p>
                  <p class="font-bold text-gray-900">{{ summary.TotalOpenFacilities }}</p>
                </div>

                <!-- Row 2 -->
                <div>
                  <p class="mb-1">Total arrear amount</p>
                  <p class="font-bold text-gray-900">{{ summary.Amountarrear }}</p>
                </div>
                <div>
                  <p class="mb-1">Total outstanding debts</p>
                  <p class="font-bold text-gray-900">{{ summary.TotalOutstandingdebt }}</p>
                </div>
                <div>
                  <p class="mb-1">Total no of closed credit facilities</p>
                  <p class="font-bold text-gray-900"></p>
                </div>

                <!-- Row 3 -->
                <div>
                  <p class="mb-1">Total no of account in arrears</p>
                  <p class="font-bold text-gray-900">{{ summary.TotalAccountarrear }}</p>
                </div>
                <div>
                  <p class="mb-1">Total no of delinquent facilities</p>
                  <p class="font-bold text-gray-900">{{ fcbcHighestDelinquencyRatingCount }}</p>
                </div>
                <div>
                  <p class="mb-1">Total no written off facilities</p>
                  <p class="font-bold text-gray-900">{{ summary.TotalWrittenOffFacilities }}</p>
                </div>
              </div>

              <!-- Fallback if no data -->
            </div>

            <!-- Performaing Accounts Table -->
            <div class="bg-white p-6 rounded">
              <h2 class="text-md font-semibold mb-4">Performing Accounts</h2>

              <div v-if="loanAccounts && loanAccounts.length > 0">
                <v-data-table
                  :headers="loanHeaders"
                  :items="loanAccounts"
                  item-value="uid"
                  :expanded.sync="expanded"
                  show-expand
                  fixed-header
                  height="400"
                  hide-default-footer
                  class="elevation-1"
                >
                  <!-- Status badge -->
                  <template #item.status="{ item }">
                    <v-chip
                      :color="item.status === 'Closed' ? 'green' : 'red'"
                      variant="tonal"
                      size="small"
                      class="text-white"
                    >
                      {{ item.status }}
                    </v-chip>
                  </template>

                  <!-- Action button -->
                  <template #item.action="{ item }">
                    <v-btn size="small" color="primary" @click="toggleRow(item.uid)">
                      {{ isExpanded(item.uid) ? 'Hide' : 'View' }}
                    </v-btn>
                  </template>

                  <!-- Expanded row content -->
                  <template #expanded-row="{ item }">
                    <td :colspan="loanHeaders.length" class="p-4 bg-gray-50">
                      <div class="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <p><strong>Account number:</strong> {{ item.accountNo }}</p>
                        <p><strong>Loan Amount:</strong> {{ item.amount.toLocaleString() }}</p>
                        <p><strong>Current Balance:</strong> {{ item.balance.toLocaleString() }}</p>
                        <p>
                          <strong>Amount Overdue:</strong> {{ item.overdue?.toLocaleString() || 0 }}
                        </p>
                        <p>
                          <strong>Instalment Amount:</strong> ₦{{
                            item.instalment?.toLocaleString() || 0
                          }}
                        </p>
                        <p><strong>Loan Duration:</strong> {{ item.duration }} months</p>
                        <p><strong>Repayment Frequency:</strong> {{ item.repaymentFrequency }}</p>
                        <p><strong>Date Account Opened:</strong> {{ item.date }}</p>
                        <p><strong>Closed Date:</strong> {{ item.closedDate }}</p>
                        <p><strong>Performance Status:</strong> {{ item.performanceStatus }}</p>
                        <p><strong>Account Status:</strong> {{ item.status }}</p>
                      </div>
                    </td>
                  </template>
                </v-data-table>
              </div>

              <div v-else class="text-sm text-gray-500 italic">No loan accounts available.</div>
            </div>

            <!-- Delinquents Accounts -->
            <div class="bg-white p-6 rounded-md shadow">
              <h2 class="text-md font-semibold mb-4">Deliquents Accounts</h2>
              <table class="min-w-full text-left text-sm">
                <thead class="bg-gray-100">
                  <tr>
                    <th class="p-3 border-b">Lender's Name</th>
                    <th class="p-3 border-b">Disbursement Date</th>
                    <th class="p-3 border-b">Loan Amount</th>
                    <th class="p-3 border-b">Loan Balance</th>
                    <th class="p-3 border-b">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="delinquentAccounts.length === 0">
                    <td colspan="5" class="p-4 text-center text-gray-500">
                      No delinquents accounts available.
                    </td>
                  </tr>
                  <tr
                    v-for="(loan, index) in delinquentAccounts"
                    :key="'delinquents-' + index"
                    class="hover:bg-gray-50"
                  >
                    <td class="p-3 border-b">{{ loan.lender }}</td>
                    <td class="p-3 border-b">{{ loan.date }}</td>
                    <td class="p-3 border-b">₦{{ loan.amount.toLocaleString() }}</td>
                    <td class="p-3 border-b">₦{{ loan.balance.toLocaleString() }}</td>
                    <td class="p-3 border-b">
                      <button
                        class="bg-red-600 text-white text-xs px-3 py-1 rounded hover:bg-red-700"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Closed Accounts -->
            <div class="bg-white p-6 rounded-md shadow">
              <h2 class="text-md font-semibold mb-4">Closed Accounts</h2>
              <table class="min-w-full text-left text-sm">
                <thead class="bg-gray-100">
                  <tr>
                    <th class="p-3 border-b">Lender's Name</th>
                    <th class="p-3 border-b">Disbursement Date</th>
                    <th class="p-3 border-b">Loan Amount</th>
                    <th class="p-3 border-b">Loan Balance</th>
                    <th class="p-3 border-b">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="closedAccounts.length === 0">
                    <td colspan="5" class="p-4 text-center text-gray-500">
                      No closed accounts available.
                    </td>
                  </tr>
                  <tr
                    v-for="(loan, index) in closedAccounts"
                    :key="'delinquents-' + index"
                    class="hover:bg-gray-50"
                  >
                    <td class="p-3 border-b">{{ loan.lender }}</td>
                    <td class="p-3 border-b">{{ loan.date }}</td>
                    <td class="p-3 border-b">₦{{ loan.amount.toLocaleString() }}</td>
                    <td class="p-3 border-b">₦{{ loan.balance.toLocaleString() }}</td>
                    <td class="p-3 border-b">
                      <button
                        class="bg-red-600 text-white text-xs px-3 py-1 rounded hover:bg-red-700"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Written Off Accounts -->
            <div class="bg-white p-6 rounded mb-6">
              <h2 class="text-md font-semibold mb-4">Written Off Accounts</h2>
              <div v-if="writtenOffAccounts && writtenOffAccounts.length > 0">
                <table class="min-w-full text-left">
                  <thead>
                    <tr class="bg-gray-100 text-sm">
                      <th class="p-2">Lender's Name</th>
                      <th class="p-2">Disbursement Date</th>
                      <th class="p-2">Loan Amount</th>
                      <th class="p-2">Loan Balance</th>
                      <th class="p-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(item, i) in writtenOffAccounts" :key="i" class="text-sm">
                      <td class="p-2">{{ item.lender }}</td>
                      <td class="p-2">{{ item.date }}</td>
                      <td class="p-2">₦{{ item.amount.toLocaleString() }}</td>
                      <td class="p-2">₦{{ item.balance.toLocaleString() }}</td>
                      <td class="p-2">
                        <button
                          class="bg-blue-600 text-white text-xs px-3 py-1 rounded hover:bg-blue-700"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-else class="text-sm text-gray-500 italic">
                No written-off accounts available.
              </div>
            </div>

            <!-- Unknown Account Status -->
            <div class="bg-white p-6 rounded mb-6">
              <h2 class="text-md font-semibold mb-4">Unknown Accounts Status</h2>
              <div v-if="unknownAccounts && unknownAccounts.length > 0">
                <table class="min-w-full text-left">
                  <thead>
                    <tr class="bg-gray-100 text-sm">
                      <th class="p-2">Lender's Name</th>
                      <th class="p-2">Disbursement Date</th>
                      <th class="p-2">Loan Amount</th>
                      <th class="p-2">Loan Balance</th>
                      <th class="p-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(item, i) in unknownAccounts" :key="i" class="text-sm">
                      <td class="p-2">{{ item.lender }}</td>
                      <td class="p-2">{{ item.date }}</td>
                      <td class="p-2">₦{{ item.amount.toLocaleString() }}</td>
                      <td class="p-2">₦{{ item.balance.toLocaleString() }}</td>
                      <td class="p-2">
                        <button
                          class="bg-blue-600 text-white text-xs px-3 py-1 rounded hover:bg-blue-700"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-else class="text-sm text-gray-500 italic">No unknown accounts available.</div>
            </div>

            <!-- Inquiry History -->
            <div class="bg-white p-6 rounded mb-6">
              <h2 class="text-md font-semibold mb-4">Inquiry History</h2>
              <div v-if="inquiryHistory && inquiryHistory.length > 0">
                <table class="min-w-full text-left">
                  <thead>
                    <tr class="bg-gray-100 text-sm">
                      <th class="p-2">Subscriber Name</th>
                      <th class="p-2">Inquiry Date</th>
                      <th class="p-2">Contact Phone</th>
                      <th class="p-2">Inquiry Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(item, i) in inquiryHistory"
                      :key="i"
                      class="text-sm hover:bg-gray-50 transition-colors"
                    >
                      <td class="p-2">{{ item.subscriber }}</td>
                      <td class="p-2">{{ item.date }}</td>
                      <td class="p-2">{{ item.phone }}</td>
                      <td class="p-2">{{ item.reason }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-else class="text-sm text-gray-500 italic">No inquiries available.</div>
            </div>
          </template>
        </div>
      </transition>
    </div>

    <div class="hidden">
      <CreditReportExport
        :id-type="idType"
        :business-data="businessData"
        :directors="directors"
        :fcbcCreditAgreementSummaryCount="fcbcCreditAgreementSummaryCount"
        :fcbcHighestDelinquencyRatingCount="fcbcHighestDelinquencyRatingCount"
        ref="reportRef"
        :personal="personal"
        :summary="summary"
        :credit-agreement-summary="creditAgreementSummary"
        :enquiry-history="enquiryHistory"
        :employment-history="employmentHistory"
        :address-history="addressHistory"
        :loan-accounts="loanAccounts"
        :delinquent-accounts="delinquentAccounts"
        :closed-accounts="closedAccounts"
        :derogatory-accounts="derogatoryAccounts"
        :written-off-accounts="writtenOffAccounts"
        :unknown-accounts="unknownAccounts"
        :inquiry-history="inquiryHistory"
      />
    </div>
  </MainLayout>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.custom-btn {
  text-transform: none;
  background-color: #1f5aa3;
}
.v-btn {
  text-transform: none;
}
</style>
