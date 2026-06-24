import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import DashboardPage from './admin/DashboardPage'
import LensCategoryPage from './admin/LensCategoryPage'
import MasterSectionPage from './admin/MasterSectionPage'
import StoresPage from './admin/StoresPage'
import { InfoCard, MetricCard, MiniCard, StatusBadge } from './admin/AdminUiPrimitives'
import { buildApiUrl } from '../lib/api'
import { buildInvoicePdf } from '../lib/invoicePdf'
import invoiceLogo from '../../../assets/images/blueLogo.png'

const adminBaseUrl = buildApiUrl('')

const screenTitles = {
  dashboard: 'Dashboard Overview',
  masters: 'Master Management',
  stores: 'Store Management',
  'add-store': 'Add Store',
  'edit-store': 'Edit Store',
  employees: 'Employee Management',
  'create-employee': 'Create Employee',
  customers: 'Customer Management',
  orders: 'Order Management',
  'order-details': 'Order Details',
  cash: 'Payments',
  returns: 'Return / Refund Management',
  reports: 'Reports Center',
}

const routeScreenMap = {
  '/dashboard': { screen: 'dashboard' },
  '/masters/lens-category': { screen: 'masters', masterSection: 'lens-category' },
  '/masters/lens-type': { screen: 'masters', masterSection: 'lens-type' },
  '/masters/eyepower': { screen: 'masters', masterSection: 'eyepower' },
  '/masters/frame-shapes': { screen: 'masters', masterSection: 'frame-shapes' },
  '/masters/power-type': { screen: 'masters', masterSection: 'power-type' },
  '/stores': { screen: 'stores' },
  '/stores/new': { screen: 'add-store' },
  '/employees': { screen: 'employees' },
  '/employees/create': { screen: 'create-employee' },
  '/customers': { screen: 'customers' },
  '/orders': { screen: 'orders' },
  '/payments': { screen: 'cash' },
  '/returns': { screen: 'returns' },
  '/reports': { screen: 'reports' },
}

const getRouteState = (pathname = '') => {
  if (routeScreenMap[pathname]) {
    return routeScreenMap[pathname]
  }

  const lensCategoryEditMatch = pathname.match(/^\/masters\/lens-category\/edit\/([^/]+)$/)
  if (lensCategoryEditMatch) {
    return {
      screen: 'masters',
      masterSection: 'lens-category',
      lensCategoryEditorId: decodeURIComponent(lensCategoryEditMatch[1]),
    }
  }

  const employeeEditMatch = pathname.match(/^\/employees\/edit\/([^/]+)$/)
  if (employeeEditMatch) {
    return {
      screen: 'create-employee',
      employeeId: decodeURIComponent(employeeEditMatch[1]),
    }
  }

  const storeEditMatch = pathname.match(/^\/stores\/edit\/([^/]+)$/)
  if (storeEditMatch) {
    return {
      screen: 'edit-store',
      storeId: decodeURIComponent(storeEditMatch[1]),
    }
  }

  const orderDetailsMatch = pathname.match(/^\/orders\/([^/]+)$/)
  if (orderDetailsMatch) {
    return {
      screen: 'order-details',
      orderId: decodeURIComponent(orderDetailsMatch[1]),
    }
  }

  return null
}

const destinationRouteMap = {
  dashboard: '/dashboard',
  stores: '/stores',
  'add-store': '/stores/new',
  employees: '/employees',
  'create-employee': '/employees/create',
  customers: '/customers',
  orders: '/orders',
  cash: '/payments',
  returns: '/returns',
  reports: '/reports',
  'lens-category': '/masters/lens-category',
  'lens-type': '/masters/lens-type',
  eyepower: '/masters/eyepower',
  'frame-shapes': '/masters/frame-shapes',
  'power-type': '/masters/power-type',
}

const buildLensCategoryEditRoute = (masterId) => `/masters/lens-category/edit/${encodeURIComponent(masterId)}`
const buildEmployeeEditRoute = (employeeId) => `/employees/edit/${encodeURIComponent(employeeId)}`
const buildStoreEditRoute = (storeId) => `/stores/edit/${encodeURIComponent(storeId)}`
const buildOrderDetailsRoute = (orderId) => `/orders/${encodeURIComponent(orderId)}`
const ORDER_DATA_CACHE_TTL_MS = 30 * 1000
let cachedAdminOrders = []
let cachedAdminOrdersAt = 0

const toInputDate = (value) => {
  const year = value.getFullYear()
  const month = `${value.getMonth() + 1}`.padStart(2, '0')
  const day = `${value.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

const parseDateValue = (value) => {
  if (!value) {
    return null
  }

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const isSameDay = (left, right) => (
  left.getFullYear() === right.getFullYear()
  && left.getMonth() === right.getMonth()
  && left.getDate() === right.getDate()
)

const startOfDay = (value) => new Date(value.getFullYear(), value.getMonth(), value.getDate(), 0, 0, 0, 0)
const endOfDay = (value) => new Date(value.getFullYear(), value.getMonth(), value.getDate(), 23, 59, 59, 999)

const countPercentage = (value, total) => {
  if (!total) {
    return '0%'
  }

  return `${Math.round((value / total) * 100)}%`
}

const now = new Date()
const defaultFromDateValue = toInputDate(new Date(now.getFullYear(), now.getMonth(), 1))
const defaultToDateValue = toInputDate(now)

const masterSections = [
  {
    key: 'power-type',
    label: 'Power Type',
    heading: 'Power Type configuration',
    col1: 'Power Type',
    col2: 'Mapping & validation',
    detailTitle: 'Power Type Editor',
    fields: ['Power Type Name', 'Display Label', 'Description', 'Priority', 'Status', 'Internal Code', 'Rule / Mapping'],
  },
  {
    key: 'lens-category',
    label: 'Lens Category',
    heading: 'Lens Category configuration',
    col1: 'Category',
    col2: 'Usage and mapping',
    detailTitle: 'Lens Category Editor',
    fields: ['Category Name', 'Display Label', 'Linked Pricing Band', 'Description', 'Priority', 'Status', 'Internal Code'],
  },
  {
    key: 'frame-shapes',

    label: 'Frame Shapes',
    heading: 'Frame shape selection',
    col1: 'Shape',
    col2: 'Visual style',
    detailTitle: 'Frame Shape Editor',
    fields: ['Shape Name', 'Display Label', 'Fit Profile', 'Description', 'Priority', 'Status', 'Internal Code'],
  },
]

const storeData = {
  'cg-road': {
    cardTitle: 'CG Road Flagship',
    cardMeta: 'Ahmedabad - GST mapped - 14 users',
    heading: 'Flagship profile',
    name: 'CG Road Flagship',
    contact: '+91 98XXXXXX10',
    gst: '24ABCDE1234F1Z5',
    pricing: 'Store-wise mapped',
    users: 'Manager + Cashier + 4 Sales',
    products: 'Frames, Lenses, Repairs',
    hours: '10:00 AM to 9:00 PM',
    status: 'Live and performing',
    flow: ['Users mapped', 'Products assigned', 'Discount rules applied'],
  },
  satellite: {
    cardTitle: 'Satellite',
    cardMeta: 'Ahmedabad - GST mapped - 8 users',
    heading: 'Satellite branch profile',
    name: 'Satellite',
    contact: '+91 98XXXXXX24',
    gst: '24ABCDE1234F1Z6',
    pricing: 'Standard city pricing',
    users: 'Manager + 3 Sales + Optometrist',
    products: 'Frames, Lenses, Eye Test',
    hours: '10:30 AM to 9:30 PM',
    status: 'Stable and active',
    flow: ['Team mapped', 'Eye test counter active', 'Offers enabled'],
  },
  maninagar: {
    cardTitle: 'Maninagar',
    cardMeta: 'Ahmedabad - Pricing override enabled',
    heading: 'Maninagar branch profile',
    name: 'Maninagar',
    contact: '+91 98XXXXXX36',
    gst: '24ABCDE1234F1Z7',
    pricing: 'Pricing override enabled',
    users: 'Manager + Cashier + 2 Sales',
    products: 'Frames, Repairs, Fast-moving lenses',
    hours: '10:00 AM to 8:30 PM',
    status: 'Needs growth push',
    flow: ['Local pricing mapped', 'Repair desk active', 'Promotions pending'],
  },
}

const navConfig = [
  { key: 'dashboard', label: 'Dashboard', icon: 'DB' },
  {
    key: 'masters',
    label: 'Masters',
    icon: 'MS',
    children: masterSections.map(({ key, label }) => ({ key, label })),
  },
  { key: 'stores', label: 'Stores', icon: 'ST' },
  { key: 'employees', label: 'Employees', icon: 'EM' },
  { key: 'customers', label: 'Customers', icon: 'CU' },
  { key: 'orders', label: 'Orders', icon: 'OR' },
  { key: 'cash', label: 'Payments', icon: 'CA' },
  { key: 'returns', label: 'Returns', icon: 'RT' },
  { key: 'reports', label: 'Reports', icon: 'RP' },
]

const Screen = ({ active, id, children }) => (
  <section className={`screen ${active ? 'active' : ''}`} id={id}>
    {children}
  </section>
)

const createEmployeeForm = () => ({
  id: '',
  salesmanId: '',
  name: '',
  email: '',
  phone: '',
  role: 'Salesman',
  store: '',
  pin: '',
  status: 'Active',
})

const getNextEmployeeId = (employees = []) => {
  const maxSequence = employees.reduce((highest, employee) => {
    const match = String(employee?.salesmanId || '').match(/^LC(\d+)$/i)

    if (!match) {
      return highest
    }

    const sequence = Number.parseInt(match[1], 10)
    return Number.isNaN(sequence) ? highest : Math.max(highest, sequence)
  }, 100)

  return `LC${maxSequence + 1}`
}

const createStoreForm = () => ({
  storeName: '',
  storeCode: '',
  street: '',
  city: '',
  state: '',
  pincode: '',
  phone: '',
  email: '',
  managerName: '',
  status: 'Active',
})

const buildStoreFormFromStore = (store) => ({
  storeName: store?.name || '',
  storeCode: store?.code || '',
  street: store?.address?.street || '',
  city: store?.address?.city || '',
  state: store?.address?.state || '',
  pincode: store?.address?.pincode || '',
  phone: store?.phone || '',
  email: store?.email || '',
  managerName: store?.managerName || '',
  status: store?.status || 'Active',
})

const getStatusTone = (status = '') => {
  const normalized = status.toLowerCase()

  if (normalized === 'active' || normalized === 'confirmed' || normalized === 'completed' || normalized === 'delivered') {
    return 'positive'
  }

  if (normalized === 'review' || normalized === 'inactive' || normalized === 'finance approval' || normalized === 'processing' || normalized === 'ready') {
    return 'neutral'
  }

  return 'warning'
}

const getOrderStatusLabel = (status = '') => {
  const normalized = String(status).toLowerCase()

  if (normalized === 'placed') {
    return 'Pending'
  }

  if (!status) {
    return 'Pending'
  }

  return status
}

const getPaymentStatusLabel = (order) => (
  Number(order?.billing?.remainingAmount ?? 0) > 0 ? 'Pending' : 'Completed'
)

const getPaymentStatusTone = (order) => (
  Number(order?.billing?.remainingAmount ?? 0) > 0 ? 'warning' : 'positive'
)

const getCollectableAmount = (order) => Math.max(0, Number(order?.billing?.remainingAmount ?? 0))

const formatCurrency = (value = 0) => `Rs. ${Number(value || 0).toLocaleString('en-IN')}`

const getOrderPayments = (order) => {
  const payments = Array.isArray(order?.billing?.payments)
    ? order.billing.payments.filter((payment) => Number(payment?.amount ?? 0) > 0)
    : []

  if (payments.length > 0) {
    return payments
  }

  const fallbackAmount = Number(order?.billing?.paidAmount ?? 0)
  if (fallbackAmount <= 0) {
    return []
  }

  return [{
    amount: fallbackAmount,
    paymentMode: order?.billing?.paymentMode || 'Online',
    collectedAt: order?.createdAt || order?.invoiceDate || new Date().toISOString(),
  }]
}

const formatOrderDate = (value) => {
  if (!value) {
    return '-'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const formatCustomerSince = (value) => {
  const formatted = formatOrderDate(value)
  return formatted === '-' ? 'Recently added' : `Customer since ${formatted}`
}

const formatCustomerAddress = (customer) => {
  const parts = [
    customer?.address?.street,
    customer?.address?.city,
    customer?.address?.state,
    customer?.address?.pincode,
  ].filter(Boolean)

  return parts.join(', ') || 'Address not added'
}

const getCustomerTone = (customer) => {
  if ((customer?.orderCount || 0) >= 3) {
    return 'positive'
  }

  if (customer?.lastOrderDate) {
    return 'neutral'
  }

  return 'warning'
}

const getCustomerLabel = (customer) => {
  if ((customer?.orderCount || 0) >= 3) {
    return 'Repeat'
  }

  if (customer?.lastOrderDate) {
    return 'Active'
  }

  return 'New'
}

const getOrderStoreLabel = (order) => {
  if (order?.meta?.store?.name && order?.meta?.store?.code) {
    return `${order.meta.store.name} (${order.meta.store.code})`
  }

  return order?.meta?.store?.name || order?.meta?.store?.code || 'Store not assigned'
}

const getOrderSalespersonLabel = (order) => {
  if (order?.meta?.salesperson?.name && order?.meta?.salesperson?.employeeId) {
    return `${order.meta.salesperson.name} (${order.meta.salesperson.employeeId})`
  }

  return order?.meta?.salesperson?.name || order?.meta?.salesperson?.employeeId || 'Salesperson not assigned'
}

const ORDER_PAGE_SIZE = 8

const buildPaginationItems = (currentPage, totalPages) => {
  if (totalPages <= 1) {
    return [1]
  }

  const pages = new Set([1, totalPages, currentPage, currentPage - 1, currentPage + 1])
  const normalizedPages = [...pages]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b)

  const items = []
  normalizedPages.forEach((page, index) => {
    const previousPage = normalizedPages[index - 1]
    if (previousPage && page - previousPage > 1) {
      items.push(`ellipsis-${previousPage}-${page}`)
    }
    items.push(page)
  })

  return items
}

const buildOrderInvoicePdf = async (order) => {
  const framePrice = Number(order?.frame?.price ?? 0)
  const lensPrice = Number(order?.lensSelection?.lensPrice ?? 0)
  const discount = Number(order?.billing?.discount ?? 0)
  const totalPayable = Number(order?.billing?.totalPayable ?? 0)
  const paidAmount = Number(order?.billing?.paidAmount ?? totalPayable)
  const remainingAmount = Number(order?.billing?.remainingAmount ?? 0)
  return buildInvoicePdf({
    orderId: order?.orderNumber || '-',
    invoiceDate: order?.invoiceDate || formatOrderDate(order?.createdAt),
    customerName: order?.customer?.name || 'Customer',
    phone: order?.customer?.phone || 'Phone not added',
    address: order?.customer?.billingAddress || 'Address not added',
    framePrice,
    lensPrice,
    discount,
    totalPayable,
    paidAmount,
    remainingAmount,
    lensType: order?.lensSelection?.lensCategory || order?.lensSelection?.powerType || 'Frame Only',
    paymentMode: order?.billing?.paymentMode || '-',
    logoUri: invoiceLogo,
  })
}

const downloadOrderInvoice = async (order) => {
  if (!order || typeof window === 'undefined') {
    return
  }

  const pdfBytes = await buildOrderInvoicePdf(order)
  const blob = new Blob([pdfBytes], { type: 'application/pdf' })
  const url = window.URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${order.orderNumber || 'invoice'}.pdf`
  anchor.click()
  window.URL.revokeObjectURL(url)
}

const getUploadedOrderImages = (order) => {
  const frameImages = Array.isArray(order?.frame?.images) ? order.frame.images : []
  const uploadedImages = frameImages.filter((item) => (
    Boolean(item?.image) && (
      String(item?.id || '').startsWith('camera-')
      || String(item?.id || '').startsWith('gallery-')
    )
  ))

  if (uploadedImages.length > 0) {
    return uploadedImages
  }

  return frameImages.filter((item) => Boolean(item?.image))
}

const summarizeMasterItem = (section, item) => {
  if (section === 'frame-shapes') {
    return item
  }

  // Eye power uses mongoose schema fields; normalize mapping for list/detail UI.
  if (section === 'eyepower') {
    return {
      title: item.eye ? `${item.eye} Eye` : 'Eye Power',
      subtitle: `SPH ${item.sphere ?? 0} | CYL ${item.cylinder ?? 0} | Axis ${item.axis ?? 0}`,
      meta: `PD ${item.pupillaryDistance ?? '-'} | ADD ${item.addition ?? '-'}`,
      code: item.internalCode || item._id || '-',
      status: item.status || 'Active',
      detailValues: [
        item.eye ?? '-',
        item.sphere ?? '-',
        item.cylinder ?? '-',
        item.axis ?? '-',
        item.pupillaryDistance ?? '-',
        item.status ?? '-',
        item.addition ?? '-',
      ],
    }
  }


  if (section === 'lens-category') {
    const powerTypeItems = Array.isArray(item.powertype_id)
      ? item.powertype_id
      : (item.powertype_id ? [item.powertype_id] : [])

    return {
      id: item.id || item._id,
      _id: item._id || item.id,
      powertype_id: powerTypeItems,
      powerTypeName: powerTypeItems.map((powerType) => powerType?.name).filter(Boolean).join(', '),
      title: item.categoryName,
      subtitle: item.usageAndMapping || item.description || item.linkedPricingBand || '-',
      meta: item.displayLabel || item.internalCode || '-',
      usageAndMapping: item.usageAndMapping || '',
      code: item.internalCode || '-',
      status: item.status || 'Active',
      detailValues: [
        item.categoryName,
        item.displayLabel,
        item.linkedPricingBand || '-',
        item.description || '-',
        item.priority ?? '-',
        item.status || '-',
        item.internalCode || '-',
      ],
    }
  }

  if (section === 'lens-type') {
    return {
      title: item.typeName,
      subtitle: item.category?.categoryName || item.description || '-',
      meta: item.displayLabel || item.internalCode || '-',
      code: item.internalCode || '-',
      status: item.status || 'Active',
      detailValues: [
        item.typeName,
        item.displayLabel,
        item.category?.categoryName || '-',
        item.description || '-',
        item.priority ?? '-',
        item.status || '-',
        item.internalCode || '-',
      ],
    }
  }

  if (section === 'power-type') {
    return {
      // Match server model: PowerType fields are name/tag/description/icon/priority/status
      title: item.name,
      subtitle: item.tag || item.description || '-',
      meta: item.description || '-',
      code: item._id || '-',
      status: item.status || 'Active',
      detailValues: [
        item.name || '-',
        item.tag || '-',
        item.description || '-',
        item.priority ?? '-',
        item.status || '-',
        '-',
        '-',
      ],
    }
  }

  return {

    title: `${item.eye} Eye`,
    subtitle: `SPH ${item.sphere ?? 0} | CYL ${item.cylinder ?? 0} | Axis ${item.axis ?? 0}`,
    meta: `PD ${item.pupillaryDistance ?? '-'} | ADD ${item.addition ?? '-'}`,
    code: item._id || '-',
    status: item.status || 'Active',
    detailValues: [
      item.eye || '-',
      item.sphere ?? '-',
      item.cylinder ?? '-',
      item.axis ?? '-',
      item.pupillaryDistance ?? '-',
      item.status || '-',
      item.addition ?? '-',
    ],
  }
}

const AdminPanel = ({ user, onLogout }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const [activeScreen, setActiveScreen] = useState('dashboard')
  const [masterSection, setMasterSection] = useState('lens-category')
  const [masterItems, setMasterItems] = useState([])
  const [masterLoading, setMasterLoading] = useState(false)
  const [masterError, setMasterError] = useState('')
  const [selectedMasterIndex, setSelectedMasterIndex] = useState(0)
  const [masterRefreshKey, setMasterRefreshKey] = useState(0)
  const [employees, setEmployees] = useState([])
  const [employeeLoading, setEmployeeLoading] = useState(false)
  const [employeeError, setEmployeeError] = useState('')
  const [employeeForm, setEmployeeForm] = useState(createEmployeeForm)
  const [employeeMode, setEmployeeMode] = useState('create')
  const [employeeSaving, setEmployeeSaving] = useState(false)
  const [employeeMessage, setEmployeeMessage] = useState('')
  const employeeMessageTone = /failed|error|invalid|required|at least/i.test(employeeMessage) ? 'error' : 'success'
  const [stores, setStores] = useState([])
  const [selectedStoreId, setSelectedStoreId] = useState('')
  const [storeForm, setStoreForm] = useState(createStoreForm)
  const [storeSaving, setStoreSaving] = useState(false)
  const [storeMessage, setStoreMessage] = useState('')
  const [salesRange, setSalesRange] = useState('weekly')
  const [fromDate, setFromDate] = useState(defaultFromDateValue)
  const [toDate, setToDate] = useState(defaultToDateValue)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mastersOpen, setMastersOpen] = useState(false)


  const currentMaster = masterSections.find((section) => section.key === masterSection) || masterSections[0]
  const currentStore = stores.find((store) => store.id === selectedStoreId) || stores[0] || null
  const routeState = useMemo(() => getRouteState(location.pathname), [location.pathname])
  const lensCategoryEditorId = routeState?.lensCategoryEditorId || ''
  const isLensCategoryEditorOpen = masterSection === 'lens-category' && Boolean(lensCategoryEditorId)

  const [powerTypes, setPowerTypes] = useState([])
  const [powerTypesLoading, setPowerTypesLoading] = useState(false)
  const [powerTypesError, setPowerTypesError] = useState('')
  const [appOrders, setAppOrders] = useState(cachedAdminOrders)
  const [appOrdersLoading, setAppOrdersLoading] = useState(cachedAdminOrders.length === 0)
  const [appOrdersRefreshing, setAppOrdersRefreshing] = useState(false)
  const [appOrdersError, setAppOrdersError] = useState('')
  const [returnRequests, setReturnRequests] = useState([])
  const [returnRequestsLoading, setReturnRequestsLoading] = useState(false)
  const [returnRequestsError, setReturnRequestsError] = useState('')
  const [selectedAppOrderId, setSelectedAppOrderId] = useState('')
  const [orderStoreFilter, setOrderStoreFilter] = useState('')
  const [orderIdSearch, setOrderIdSearch] = useState('')
  const [orderPhoneSearch, setOrderPhoneSearch] = useState('')
  const [orderPage, setOrderPage] = useState(1)
  const [paymentCollectionAmount, setPaymentCollectionAmount] = useState('')
  const [paymentCollectionMode, setPaymentCollectionMode] = useState('Cash')
  const [paymentCollectionSaving, setPaymentCollectionSaving] = useState(false)
  const [paymentCollectionMessage, setPaymentCollectionMessage] = useState('')
  const [customers, setCustomers] = useState([])
  const [customersLoading, setCustomersLoading] = useState(false)
  const [customersError, setCustomersError] = useState('')
  const [customerSearch, setCustomerSearch] = useState('')
  const [selectedCustomerId, setSelectedCustomerId] = useState('')

  useEffect(() => {
    if (!currentStore) {
      return
    }

    setStoreForm(buildStoreFormFromStore(currentStore))
  }, [currentStore?.id])

  const screenTitle = activeScreen === 'masters'
    ? (isLensCategoryEditorOpen ? 'Lens Category Update' : `${currentMaster.label} Management`)
    : (screenTitles[activeScreen] || 'Admin Panel')

  const isMastersActive = activeScreen === 'masters'
  const adminName = user?.name || 'Super Admin'
  const profileMeta = user?.role ? `${user.role} access` : 'Multi-store access'
  const initials = useMemo(() => {
    const source = adminName.trim() || 'Admin'
    return source
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('')
  }, [adminName])

  const filteredAppOrders = useMemo(() => {
    const normalizedOrderId = orderIdSearch.trim().toLowerCase()
    const normalizedPhone = orderPhoneSearch.replace(/\D/g, '').slice(-10)

    return appOrders.filter((order) => {
      if (orderStoreFilter && order?.meta?.store?.id !== orderStoreFilter) {
        return false
      }

      if (normalizedOrderId && !String(order.orderNumber || '').toLowerCase().includes(normalizedOrderId)) {
        return false
      }

      if (normalizedPhone) {
        const orderPhone = String(order?.customer?.phone || '').replace(/\D/g, '').slice(-10)
        if (!orderPhone.includes(normalizedPhone)) {
          return false
        }
      }

      return true
    })
  }, [appOrders, orderIdSearch, orderPhoneSearch, orderStoreFilter])
  const orderPageCount = Math.max(1, Math.ceil(filteredAppOrders.length / ORDER_PAGE_SIZE))
  const safeOrderPage = Math.min(orderPage, orderPageCount)
  const paginatedAppOrders = useMemo(() => {
    const startIndex = (safeOrderPage - 1) * ORDER_PAGE_SIZE
    return filteredAppOrders.slice(startIndex, startIndex + ORDER_PAGE_SIZE)
  }, [filteredAppOrders, safeOrderPage])
  const orderPaginationItems = useMemo(
    () => buildPaginationItems(safeOrderPage, orderPageCount),
    [safeOrderPage, orderPageCount]
  )
  const selectedAppOrder = useMemo(
    () => filteredAppOrders.find((item) => item.id === selectedAppOrderId)
      || appOrders.find((item) => item.id === selectedAppOrderId)
      || filteredAppOrders[0]
      || appOrders[0]
      || null,
    [appOrders, filteredAppOrders, selectedAppOrderId]
  )
  const filteredCustomers = useMemo(() => {
    const search = customerSearch.trim().toLowerCase()

    if (!search) {
      return customers
    }

    return customers.filter((customer) => (
      customer.name?.toLowerCase().includes(search)
      || customer.phone?.includes(search)
      || customer.email?.toLowerCase().includes(search)
      || customer.id?.toLowerCase().includes(search)
    ))
  }, [customerSearch, customers])
  const selectedCustomer = useMemo(
    () => filteredCustomers.find((item) => item.id === selectedCustomerId)
      || customers.find((item) => item.id === selectedCustomerId)
      || filteredCustomers[0]
      || customers[0]
      || null,
    [customers, filteredCustomers, selectedCustomerId]
  )
  const selectedOrderStore = useMemo(
    () => stores.find((store) => store.id === orderStoreFilter) || null,
    [stores, orderStoreFilter]
  )
  const returnSummary = useMemo(() => {
    const statusCounts = returnRequests.reduce((summary, request) => {
      const normalizedStatus = String(request?.status || 'Requested').toLowerCase()

      if (normalizedStatus === 'requested') {
        summary.requested += 1
      } else if (normalizedStatus === 'approved') {
        summary.approved += 1
      } else if (normalizedStatus === 'completed') {
        summary.completed += 1
      } else {
        summary.rejected += 1
      }

      summary.totalRefundAmount += Number(request?.settlementAmount ?? request?.totalRefundAmount ?? 0)
      return summary
    }, {
      requested: 0,
      approved: 0,
      completed: 0,
      rejected: 0,
      totalRefundAmount: 0,
    })

    return statusCounts
  }, [returnRequests])
  const dashboardOrders = useMemo(() => (
    appOrders.filter((order) => Boolean(parseDateValue(order.createdAt)))
  ), [appOrders])
  const todayOrderCount = useMemo(() => {
    const today = new Date()
    return dashboardOrders.filter((order) => {
      const createdAt = parseDateValue(order.createdAt)
      return createdAt && isSameDay(createdAt, today)
    }).length
  }, [dashboardOrders])
  const yesterdayOrderCount = useMemo(() => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    return dashboardOrders.filter((order) => {
      const createdAt = parseDateValue(order.createdAt)
      return createdAt && isSameDay(createdAt, yesterday)
    }).length
  }, [dashboardOrders])
  const weeklyRevenue = useMemo(() => {
    const today = new Date()
    const weekStart = startOfDay(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6))
    const weekEnd = endOfDay(today)
    return dashboardOrders.reduce((sum, order) => {
      const createdAt = parseDateValue(order.createdAt)
      if (!createdAt || createdAt < weekStart || createdAt > weekEnd) {
        return sum
      }
      return sum + Number(order.billing?.totalPayable ?? 0)
    }, 0)
  }, [dashboardOrders])
  const topStoreSnapshot = useMemo(() => {
    const totals = new Map()

    dashboardOrders.forEach((order) => {
      const key = order.storeId || order.meta?.store?.id || 'unassigned'
      const name = order.meta?.store?.name || 'Store not assigned'
      const entry = totals.get(key) || { name, amount: 0, orders: 0 }
      entry.amount += Number(order.billing?.totalPayable ?? 0)
      entry.orders += 1
      totals.set(key, entry)
    })

    return [...totals.values()].sort((a, b) => b.amount - a.amount)[0] || null
  }, [dashboardOrders])
  const dashboardHero = useMemo(() => {
    const today = new Date()
    const revenueToday = dashboardOrders.reduce((sum, order) => {
      const createdAt = parseDateValue(order.createdAt)
      if (!createdAt || !isSameDay(createdAt, today)) {
        return sum
      }
      return sum + Number(order.billing?.totalPayable ?? 0)
    }, 0)

    return {
      revenueToday: formatCurrency(revenueToday),
      pendingOrders: String(dashboardOrders.filter((order) => order.status === 'Pending').length),
    }
  }, [dashboardOrders])
  const monthlyRevenue = useMemo(() => {
    const today = new Date()
    const monthStart = startOfDay(new Date(today.getFullYear(), today.getMonth(), 1))
    const monthEnd = endOfDay(new Date(today.getFullYear(), today.getMonth() + 1, 0))
    return dashboardOrders.reduce((sum, order) => {
      const createdAt = parseDateValue(order.createdAt)
      if (!createdAt || createdAt < monthStart || createdAt > monthEnd) {
        return sum
      }
      return sum + Number(order.billing?.totalPayable ?? 0)
    }, 0)
  }, [dashboardOrders])
  const dashboardMetrics = useMemo(() => {
    const paidOrders = dashboardOrders.filter((order) => Number(order.billing?.remainingAmount ?? 0) <= 0).length
    const partialOrders = dashboardOrders.filter((order) => Number(order.billing?.remainingAmount ?? 0) > 0).length
    const averageOrderValue = dashboardOrders.length
      ? dashboardOrders.reduce((sum, order) => sum + Number(order.billing?.totalPayable ?? 0), 0) / dashboardOrders.length
      : 0

    return [
      {
        label: 'Today Sales',
        value: String(todayOrderCount),
        hint: `${todayOrderCount - yesterdayOrderCount >= 0 ? '+' : ''}${todayOrderCount - yesterdayOrderCount} vs yesterday`,
      },
      {
        label: 'Weekly Revenue',
        value: formatCurrency(weeklyRevenue),
        hint: topStoreSnapshot ? `Top store: ${topStoreSnapshot.name}` : 'Waiting for store activity',
      },
      {
        label: 'Fully Paid Orders',
        value: String(paidOrders),
        hint: `${countPercentage(paidOrders, dashboardOrders.length)} of total orders`,
      },
      {
        label: 'Partial Payments',
        value: String(partialOrders),
        hint: `AOV ${formatCurrency(Math.round(averageOrderValue))}`,
      },
    ]
  }, [dashboardOrders, todayOrderCount, yesterdayOrderCount, topStoreSnapshot, weeklyRevenue])
  const dashboardRevenueCards = useMemo(() => {
    const todayRevenueValue = dashboardHero.revenueToday
    const weeklyAverage = todayOrderCount > 0 ? Math.round(weeklyRevenue / Math.max(7, todayOrderCount)) : Math.round(weeklyRevenue / 7)

    return [
      {
        label: 'Today Revenue',
        value: todayRevenueValue,
        hint: `${todayOrderCount} order${todayOrderCount === 1 ? '' : 's'} billed today`,
      },
      {
        label: 'Weekly Revenue',
        value: formatCurrency(weeklyRevenue),
        hint: `Approx daily pace ${formatCurrency(weeklyAverage)}`,
      },
      {
        label: 'Monthly Revenue',
        value: formatCurrency(monthlyRevenue),
        hint: topStoreSnapshot ? `Best performing store: ${topStoreSnapshot.name}` : 'Waiting for store activity',
      },
    ]
  }, [dashboardHero.revenueToday, monthlyRevenue, todayOrderCount, topStoreSnapshot, weeklyRevenue])
  const salesDataByRange = useMemo(() => {
    const today = new Date()
    const weeklyDates = [...Array(7)].map((_, index) => {
      const date = new Date(today)
      date.setDate(today.getDate() - (6 - index))
      return date
    })
    const weeklyLabels = weeklyDates.map((date) => date.toLocaleDateString('en-GB', { weekday: 'short' }))
    const weeklyTotals = weeklyDates.map((date) => dashboardOrders.reduce((sum, order) => {
      const createdAt = parseDateValue(order.createdAt)
      if (!createdAt || !isSameDay(createdAt, date)) {
        return sum
      }
      return sum + Number(order.billing?.totalPayable ?? 0)
    }, 0))

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    const monthlyLabels = ['W1', 'W2', 'W3', 'W4', 'W5']
    const monthlyTotals = monthlyLabels.map((_, index) => {
      const rangeStart = new Date(monthStart)
      rangeStart.setDate(monthStart.getDate() + index * 7)
      const rangeEnd = new Date(rangeStart)
      rangeEnd.setDate(rangeStart.getDate() + 6)

      return dashboardOrders.reduce((sum, order) => {
        const createdAt = parseDateValue(order.createdAt)
        if (!createdAt || createdAt < startOfDay(rangeStart) || createdAt > endOfDay(rangeEnd)) {
          return sum
        }
        return sum + Number(order.billing?.totalPayable ?? 0)
      }, 0)
    })

    const normalizeValues = (values) => {
      const maxValue = Math.max(...values, 0)
      return values.map((value) => (maxValue > 0 ? Math.max(10, Math.round((value / maxValue) * 100)) : 12))
    }

    return {
      weekly: {
        caption: 'Showing the last 7 days of billed order value.',
        labels: weeklyLabels,
        totals: weeklyTotals,
        values: normalizeValues(weeklyTotals),
      },
      monthly: {
        caption: 'Showing this month grouped into week buckets.',
        labels: monthlyLabels,
        totals: monthlyTotals,
        values: normalizeValues(monthlyTotals),
      },
    }
  }, [dashboardOrders])
  const salesData = salesDataByRange[salesRange]
  const salesCaption = `${salesData.caption} Based on live app orders.`
  const storePerformance = useMemo(() => {
    const storeMap = new Map()

    stores.forEach((store) => {
      storeMap.set(store.id, {
        id: store.id,
        name: store.name,
        subtitle: store.code,
        revenueAmount: 0,
        orderCount: 0,
        pendingCount: 0,
      })
    })

    dashboardOrders.forEach((order) => {
      const key = order.storeId || order.meta?.store?.id || 'unassigned'
      if (!storeMap.has(key)) {
        storeMap.set(key, {
          id: key,
          name: order.meta?.store?.name || 'Store not assigned',
          subtitle: order.meta?.store?.code || 'No code',
          revenueAmount: 0,
          orderCount: 0,
          pendingCount: 0,
        })
      }

      const item = storeMap.get(key)
      item.revenueAmount += Number(order.billing?.totalPayable ?? 0)
      item.orderCount += 1
      if (order.status === 'Pending') {
        item.pendingCount += 1
      }
    })

    return [...storeMap.values()]
      .filter((store) => store.orderCount > 0)
      .sort((a, b) => b.revenueAmount - a.revenueAmount)
      .slice(0, 5)
      .map((store, index) => ({
        id: store.id,
        name: store.name,
        subtitle: store.subtitle,
        revenue: formatCurrency(store.revenueAmount),
        meta: `${store.orderCount} order${store.orderCount === 1 ? '' : 's'}${store.pendingCount ? ` | ${store.pendingCount} pending` : ''}`,
        status: index === 0 ? 'Top Performer' : (store.pendingCount ? 'Follow-up Needed' : 'Stable'),
        tone: index === 0 ? 'positive' : (store.pendingCount ? 'warning' : 'neutral'),
      }))
  }, [dashboardOrders, stores])
  const operationalQueue = useMemo(() => {
    const pendingOrders = dashboardOrders.filter((order) => order.status === 'Pending')
    const completedOrders = dashboardOrders.filter((order) => order.status === 'Completed')
    const outstandingAmount = dashboardOrders.reduce((sum, order) => sum + Number(order.billing?.remainingAmount ?? 0), 0)

    return [
      {
        title: `${pendingOrders.length} orders pending manager approval`,
        meta: pendingOrders.length ? 'Review and mark completed after store fulfillment.' : 'No pending approvals right now.',
      },
      {
        title: `${formatCurrency(outstandingAmount)} outstanding in partial payments`,
        meta: dashboardOrders.some((order) => Number(order.billing?.remainingAmount ?? 0) > 0)
          ? 'Collect the remaining balances before final closure.'
          : 'All current app orders are fully settled.',
      },
      {
        title: `${completedOrders.length} orders already completed`,
        meta: `${dashboardOrders.length - completedOrders.length} still active across the live app order queue.`,
      },
    ]
  }, [dashboardOrders])
  const productInsights = useMemo(() => {
    const lensCounts = new Map()
    const paymentCounts = new Map()

    dashboardOrders.forEach((order) => {
      const lensKey = order.lensSelection?.lensCategory || order.lensSelection?.powerType || 'Frame Only'
      lensCounts.set(lensKey, (lensCounts.get(lensKey) || 0) + 1)

      const paymentKey = order.billing?.paymentMode || 'Unknown'
      paymentCounts.set(paymentKey, (paymentCounts.get(paymentKey) || 0) + 1)
    })

    const topLens = [...lensCounts.entries()].sort((a, b) => b[1] - a[1])[0]
    const topPayment = [...paymentCounts.entries()].sort((a, b) => b[1] - a[1])[0]
    const totalRevenue = dashboardOrders.reduce((sum, order) => sum + Number(order.billing?.totalPayable ?? 0), 0)
    const averageOrderValue = dashboardOrders.length ? totalRevenue / dashboardOrders.length : 0

    return [
      { label: 'Top Lens', value: topLens ? topLens[0] : '-' },
      {
        label: 'Top Payment Mode',
        value: topPayment ? `${topPayment[0]} ${countPercentage(topPayment[1], dashboardOrders.length)}` : '-',
      },
      { label: 'AOV', value: formatCurrency(Math.round(averageOrderValue)) },
    ]
  }, [dashboardOrders])
  const paymentDateRangePayments = useMemo(() => {
    const from = parseDateValue(fromDate)
    const to = parseDateValue(toDate)
    const fromBound = from ? startOfDay(from) : null
    const toBound = to ? endOfDay(to) : null

    return dashboardOrders.flatMap((order) => (
      getOrderPayments(order)
        .map((payment, index) => ({
          key: `${order.id || order.orderNumber || 'order'}-${payment.collectedAt || index}-${index}`,
          orderId: order.id,
          remainingAmount: Number(order.billing?.remainingAmount ?? 0),
          paymentMode: payment?.paymentMode || 'Online',
          amount: Number(payment?.amount ?? 0),
          collectedAt: payment?.collectedAt,
        }))
        .filter((payment) => {
          const collectedAt = parseDateValue(payment.collectedAt)
          if (!collectedAt) {
            return false
          }

          if (fromBound && collectedAt < fromBound) {
            return false
          }

          if (toBound && collectedAt > toBound) {
            return false
          }

          return true
        })
    ))
  }, [dashboardOrders, fromDate, toDate])
  const paymentDateRangeOrders = useMemo(() => {
    const includedOrderIds = new Set(paymentDateRangePayments.map((payment) => payment.orderId))
    return dashboardOrders.filter((order) => includedOrderIds.has(order.id))
  }, [dashboardOrders, paymentDateRangePayments])
  const paymentSummary = useMemo(() => {
    const summary = {
      Cash: { amount: 0, count: 0 },
      Card: { amount: 0, count: 0 },
      Online: { amount: 0, count: 0 },
    }

    paymentDateRangePayments.forEach((payment) => {
      const mode = payment.paymentMode || 'Online'
      if (!summary[mode]) {
        summary[mode] = { amount: 0, count: 0 }
      }
      summary[mode].amount += Number(payment.amount ?? 0)
      summary[mode].count += 1
    })

    const totalCollected = Object.values(summary).reduce((sum, item) => sum + item.amount, 0)
    const pendingCollection = paymentDateRangeOrders.reduce((sum, order) => sum + Number(order.billing?.remainingAmount ?? 0), 0)
    const topMode = Object.entries(summary).sort((a, b) => b[1].amount - a[1].amount)[0]

    return {
      modes: summary,
      totalCollected,
      pendingCollection,
      topMode,
    }
  }, [paymentDateRangeOrders, paymentDateRangePayments])
  const paymentBreakdown = useMemo(() => {
    const partialPaymentOrders = paymentDateRangeOrders.filter((order) => Number(order.billing?.remainingAmount ?? 0) > 0)
    const completedOrders = paymentDateRangeOrders.filter((order) => Number(order.billing?.remainingAmount ?? 0) <= 0)

    return [
      {
        title: paymentSummary.topMode
          ? `${paymentSummary.topMode[0]} collections lead this range`
          : 'No payment activity in selected range',
        meta: paymentSummary.topMode
          ? `${formatCurrency(paymentSummary.topMode[1].amount)} collected across ${paymentSummary.topMode[1].count} payment${paymentSummary.topMode[1].count === 1 ? '' : 's'}`
          : 'Change the date range or wait for new app orders.',
      },
      {
        title: `${partialPaymentOrders.length} partial payment order${partialPaymentOrders.length === 1 ? '' : 's'} still open`,
        meta: `${formatCurrency(paymentSummary.pendingCollection)} remains to be collected from selected orders.`,
      },
      {
        title: `${completedOrders.length} fully collected order${completedOrders.length === 1 ? '' : 's'}`,
        meta: `${paymentDateRangePayments.length} total payment${paymentDateRangePayments.length === 1 ? '' : 's'} collected in the chosen date range.`,
      },
    ]
  }, [paymentDateRangeOrders, paymentDateRangePayments, paymentSummary])
  const normalizedMasterItems = masterItems.map((item) => summarizeMasterItem(masterSection, item))
  const selectedMaster = normalizedMasterItems[selectedMasterIndex] || normalizedMasterItems[0]
  const masterCountLabel = `${normalizedMasterItems.length} record${normalizedMasterItems.length === 1 ? '' : 's'}`
  const employeeCountLabel = `${employees.length} employee${employees.length === 1 ? '' : 's'}`
  const storeOptions = stores
  const isFrameShapesMaster = masterSection === 'frame-shapes'
  const isMastersManagementRoute = activeScreen === 'masters'
  const shouldLoadAdminOrders = ['dashboard', 'orders', 'order-details', 'cash'].includes(activeScreen)

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 900) {
        setSidebarOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [routeState])

  useEffect(() => {
    if (!routeState) {
      return
    }

    setActiveScreen(routeState.screen)
    if (routeState.masterSection) {
      setMasterSection(routeState.masterSection)
      setMastersOpen(true)
    } else {
      setMastersOpen(false)
    }
    setSidebarOpen(false)
  }, [routeState])

  useEffect(() => {
    if (routeState?.screen !== 'create-employee' || !routeState.employeeId) {
      return
    }

    const employee = employees.find((item) => item.id === routeState.employeeId)
    if (!employee) {
      return
    }

    setEmployeeMode('edit')
    setEmployeeForm({
      id: employee.id,
      salesmanId: employee.salesmanId || '',
      name: employee.name || '',
      email: employee.email || '',
      phone: employee.phone || '',
      role: employee.role || 'Salesman',
      store: employee.store?.id || '',
      pin: '',
      status: employee.status || 'Active',
    })
  }, [employees, routeState?.employeeId, routeState?.screen])

  useEffect(() => {
    if (routeState?.screen !== 'edit-store' || !routeState.storeId) {
      return
    }

    const store = stores.find((item) => item.id === routeState.storeId)
    if (!store) {
      return
    }

    setSelectedStoreId(store.id)
    setStoreForm(buildStoreFormFromStore(store))
    setStoreMessage('')
  }, [routeState, stores])

  useEffect(() => {
    if (routeState?.screen !== 'order-details' || !routeState.orderId) {
      return
    }

    if (appOrders.some((item) => item.id === routeState.orderId)) {
      setSelectedAppOrderId(routeState.orderId)
    }
  }, [appOrders, routeState])

  useEffect(() => {
    if (!isLensCategoryEditorOpen || !normalizedMasterItems.length) {
      return
    }

    const editorIndex = normalizedMasterItems.findIndex((item) => (
      String(item.id || item._id || item.code) === lensCategoryEditorId
    ))

    if (editorIndex >= 0 && editorIndex !== selectedMasterIndex) {
      setSelectedMasterIndex(editorIndex)
    }
  }, [isLensCategoryEditorOpen, lensCategoryEditorId, normalizedMasterItems, selectedMasterIndex])

  useEffect(() => {
    // If user is on a masters route directly, keep submenu open.
    // Otherwise, keep it closed by default.
    const isMastersRoute = location.pathname.startsWith('/masters/')
    setMastersOpen(isMastersRoute)
  }, [location.pathname])

  useEffect(() => {


    const controller = new AbortController()
    const token = localStorage.getItem('adminToken')

    // Preload power types for lens-category mapping dropdown
    const fetchPowerTypes = async () => {
      if (!token) return
      setPowerTypesLoading(true)
      setPowerTypesError('')
      try {
        const res = await fetch(`${adminBaseUrl}/api/power-types`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })
        const data = await res.json().catch(() => null)
        assertAuthorizedResponse(res, data, 'Failed to fetch power types')
        const payload = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : [])
        setPowerTypes(payload)
      } catch (e) {
        if (e.name === 'AbortError') return
        setPowerTypesError(e.message || 'Failed to fetch power types')
        setPowerTypes([])
      } finally {
        setPowerTypesLoading(false)
      }
    }

    fetchPowerTypes()


    if (!token) {
      setMasterItems([])
      return () => controller.abort()
    }

    const fetchData = async () => {
      setMasterLoading(true)
      setMasterError('')

      try {

        // FRAME SHAPES
        if (masterSection === 'frame-shapes') {

          const response = await fetch(
            `${adminBaseUrl}/api/frame-shapes`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
              signal: controller.signal,
            }
          )

          const data = await response.json().catch(() => [])

          assertAuthorizedResponse(response, data, 'Failed to fetch frame shapes')

          if (!Array.isArray(data)) {
            throw new Error('Failed to fetch frame shapes')
          }

          setMasterItems(data)
          setSelectedMasterIndex(0)
          setMasterError('')
          return
        }

        // OTHER MASTERS
        // NOTE: power-type is served by a dedicated endpoint (/api/power-types)
        // while others are served by /api/masters/:section.
        const response = await fetch(
          masterSection === 'power-type'
            ? `${adminBaseUrl}/api/power-types`
            : `${adminBaseUrl}/api/masters/${masterSection}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }
        )


        const data = await response.json().catch(() => [])
        assertAuthorizedResponse(response, data, 'Failed to fetch masters')

        const payload = (data && Array.isArray(data.data)) ? data.data : data

        const normalized = Array.isArray(payload)
          ? payload.map((item) => {


            if (masterSection === 'eyepower') {
              return {
                ...item,
                sphere: item.sphere ?? null,
                cylinder: item.cylinder ?? null,
                axis: item.axis ?? null,
                pupillaryDistance: item.pupillaryDistance ?? null,
                addition: item.addition ?? null,
                eye: item.eye ?? '-',
                status: item.status ?? 'Active',
              }
            }

            return item
          })
          : []

        setMasterItems(normalized)
        setSelectedMasterIndex(0)


      } catch (error) {

        if (error.name === 'AbortError') {
          return
        }

        setMasterItems([])
        setMasterError(
          error.message || 'Failed to fetch masters'
        )

      } finally {
        setMasterLoading(false)
      }
    }

    fetchData()

    return () => controller.abort()

  }, [masterRefreshKey, masterSection])


  useEffect(() => {
    const controller = new AbortController()
    const token = localStorage.getItem('adminToken')

    if (!token) {
      return () => controller.abort()
    }

    const fetchEmployeeData = async () => {
      setEmployeeLoading(true)
      setEmployeeError('')

      try {
        const [employeeResponse, storeResponse] = await Promise.all([
          fetch(`${adminBaseUrl}/api/employees`, {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          }),
          fetch(`${adminBaseUrl}/api/stores`, {
            signal: controller.signal,
          }),
        ])

        const employeeData = await employeeResponse.json().catch(() => [])
        const storeDataResponse = await storeResponse.json().catch(() => [])

        assertAuthorizedResponse(employeeResponse, employeeData, 'Failed to fetch employees')
        assertAuthorizedResponse(storeResponse, storeDataResponse, 'Failed to fetch stores')

        setEmployees(Array.isArray(employeeData) ? employeeData : [])
        const normalizedStores = Array.isArray(storeDataResponse) ? storeDataResponse : []
        setStores(normalizedStores)
        setSelectedStoreId((current) => (
          normalizedStores.some((store) => store.id === current) ? current : (normalizedStores[0]?.id || '')
        ))
      } catch (error) {
        if (error.name === 'AbortError') {
          return
        }

        setEmployeeError(error.message || 'Failed to fetch employees')
      } finally {
        setEmployeeLoading(false)
      }
    }

    fetchEmployeeData()

    return () => controller.abort()
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    const token = localStorage.getItem('adminToken')

    if (!token) {
      return () => controller.abort()
    }

    const fetchCustomers = async () => {
      setCustomersLoading(true)
      setCustomersError('')

      try {
        const query = customerSearch.trim()
        const url = new URL(`${adminBaseUrl}/api/customers`)
        if (query) {
          url.searchParams.set('search', query)
        }

        const response = await fetch(url.toString(), {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })

        const data = await response.json().catch(() => null)

        assertAuthorizedResponse(response, data, 'Failed to fetch customers')

        const payload = Array.isArray(data?.data) ? data.data : []
        setCustomers(payload)
        setSelectedCustomerId((current) => (
          payload.some((item) => item.id === current) ? current : (payload[0]?.id || '')
        ))
      } catch (error) {
        if (error.name === 'AbortError') {
          return
        }

        setCustomers([])
        setCustomersError(error.message || 'Failed to fetch customers')
      } finally {
        setCustomersLoading(false)
      }
    }

    fetchCustomers()

    return () => controller.abort()
  }, [customerSearch])

  useEffect(() => {
    const controller = new AbortController()

    if (!shouldLoadAdminOrders) {
      return () => controller.abort()
    }

    const fetchOrders = async () => {
      const hasCachedOrders = cachedAdminOrders.length > 0
      const cacheIsFresh = hasCachedOrders && (Date.now() - cachedAdminOrdersAt) < ORDER_DATA_CACHE_TTL_MS

      if (cacheIsFresh) {
        setAppOrders(cachedAdminOrders)
        setAppOrdersLoading(false)
        setAppOrdersRefreshing(false)
        return
      }

      if (hasCachedOrders) {
        setAppOrders(cachedAdminOrders)
        setAppOrdersRefreshing(true)
        setAppOrdersLoading(false)
      } else {
        setAppOrdersLoading(true)
      }
      setAppOrdersError('')

      try {
        const response = await fetch(`${adminBaseUrl}/api/order-placement`, {
          signal: controller.signal,
        })

        const data = await response.json().catch(() => null)

        if (!response.ok) {
          throw new Error(data?.message || 'Failed to fetch orders')
        }

        const payload = Array.isArray(data?.data) ? data.data : []
        cachedAdminOrders = payload
        cachedAdminOrdersAt = Date.now()
        setAppOrders(payload)
        setSelectedAppOrderId((current) => (
          routeState?.screen === 'order-details' && routeState.orderId && payload.some((item) => item.id === routeState.orderId)
            ? routeState.orderId
            : (payload.some((item) => item.id === current) ? current : (payload[0]?.id || ''))
        ))
      } catch (error) {
        if (error.name === 'AbortError') {
          return
        }

        if (!cachedAdminOrders.length) {
          setAppOrders([])
        }
        setAppOrdersError(error.message || 'Failed to fetch orders')
      } finally {
        setAppOrdersLoading(false)
        setAppOrdersRefreshing(false)
      }
    }

    fetchOrders()

    return () => controller.abort()
  }, [routeState, shouldLoadAdminOrders])

  useEffect(() => {
    const controller = new AbortController()

    const fetchReturns = async () => {
      setReturnRequestsLoading(true)
      setReturnRequestsError('')

      try {
        const response = await fetch(`${adminBaseUrl}/api/returns`, {
          signal: controller.signal,
        })

        const data = await response.json().catch(() => null)

        if (!response.ok) {
          throw new Error(data?.message || 'Failed to fetch returns')
        }

        setReturnRequests(Array.isArray(data?.data) ? data.data : [])
      } catch (error) {
        if (error.name === 'AbortError') {
          return
        }

        setReturnRequests([])
        setReturnRequestsError(error.message || 'Failed to fetch returns')
      } finally {
        setReturnRequestsLoading(false)
      }
    }

    fetchReturns()

    return () => controller.abort()
  }, [])

  useEffect(() => {
    setOrderPage(1)
  }, [orderStoreFilter, orderIdSearch, orderPhoneSearch])

  useEffect(() => {
    if (orderPage > orderPageCount) {
      setOrderPage(orderPageCount)
    }
  }, [orderPage, orderPageCount])

  useEffect(() => {
    setSelectedAppOrderId((current) => (
      routeState?.screen === 'order-details' && routeState.orderId && appOrders.some((item) => item.id === routeState.orderId)
        ? routeState.orderId
        : (filteredAppOrders.some((item) => item.id === current) ? current : (filteredAppOrders[0]?.id || ''))
    ))
  }, [appOrders, filteredAppOrders, routeState])

  const activateScreen = (screen) => {
    const routePath = destinationRouteMap[screen]

    // If user clicks the same menu again, react-router navigation to the same path can be a no-op,
    // causing the screen state not to update. Ensure state updates regardless.
    if (routePath) {
      if (routePath !== location.pathname) {
        navigate(routePath)
      }
      setActiveScreen(screen)
      setSidebarOpen(false)
      return
    }

    setActiveScreen(screen)
    setSidebarOpen(false)
  }

  const activateMasterSection = (sectionKey) => {
    const routePath = destinationRouteMap[sectionKey]
    setMasterSection(sectionKey)
    setActiveScreen('masters')
    setMastersOpen(true)
    setSidebarOpen(false)

    if (routePath) {
      if (routePath !== location.pathname) {
        navigate(routePath)
      }
      return
    }
  }

  const openLensCategoryEditor = (masterId) => {
    if (!masterId) {
      return
    }

    navigate(buildLensCategoryEditRoute(masterId))
    setSidebarOpen(false)
  }

  const closeLensCategoryEditor = () => {
    navigate(destinationRouteMap['lens-category'])
    setSidebarOpen(false)
  }

  const refreshMasterItems = () => {
    setMasterRefreshKey((current) => current + 1)
  }

  const openOrderDetails = (order) => {
    if (!order?.id) {
      return
    }

    setSelectedAppOrderId(order.id)
    setPaymentCollectionAmount('')
    setPaymentCollectionMode(order?.billing?.paymentMode || 'Cash')
    setPaymentCollectionMessage('')
    navigate(buildOrderDetailsRoute(order.id))
    setSidebarOpen(false)
  }

  const clearOrderFilters = () => {
    setOrderIdSearch('')
    setOrderPhoneSearch('')
    setOrderStoreFilter('')
    setOrderPage(1)
  }

  const handleOrderStatusUpdate = async (order, status) => {
    if (!order?.id || !status || order.status === status) {
      return
    }

    try {
      const response = await fetch(`${adminBaseUrl}/api/order-placement/${order.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok || !data?.data) {
        throw new Error(data?.message || 'Failed to update order status')
      }

      setAppOrders((current) => {
        const nextOrders = current.map((item) => (
          item.id === order.id ? data.data : item
        ))
        cachedAdminOrders = nextOrders
        cachedAdminOrdersAt = Date.now()
        return nextOrders
      })
    } catch (error) {
      setAppOrdersError(error.message || 'Failed to update order status')
    }
  }

  const handleOrderPaymentCollection = async (order) => {
    const additionalCollectedAmount = Number(paymentCollectionAmount || 0)

    if (!order?.id) {
      return
    }

    if (!Number.isFinite(additionalCollectedAmount) || additionalCollectedAmount <= 0) {
      setPaymentCollectionMessage('Enter a valid amount to collect.')
      return
    }

    if (additionalCollectedAmount > getCollectableAmount(order)) {
      setPaymentCollectionMessage(`Amount cannot exceed ${formatCurrency(getCollectableAmount(order))}.`)
      return
    }

    setPaymentCollectionSaving(true)
    setPaymentCollectionMessage('')

    try {
      const response = await fetch(`${adminBaseUrl}/api/order-placement/${order.id}/billing`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          additionalCollectedAmount,
          paymentMode: paymentCollectionMode,
        }),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok || !data?.data) {
        throw new Error(data?.message || 'Failed to update payment collection')
      }

      setAppOrders((current) => {
        const nextOrders = current.map((item) => (
          item.id === order.id ? data.data : item
        ))
        cachedAdminOrders = nextOrders
        cachedAdminOrdersAt = Date.now()
        return nextOrders
      })
      setPaymentCollectionAmount('')
      setPaymentCollectionMessage(`Collected ${formatCurrency(additionalCollectedAmount)} successfully.`)
    } catch (error) {
      setPaymentCollectionMessage(error.message || 'Failed to update payment collection')
    } finally {
      setPaymentCollectionSaving(false)
    }
  }

  const handleLogoutClick = async () => {
    const token = localStorage.getItem('adminToken')

    try {
      await fetch(`${adminBaseUrl}/admin/logout`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
    } catch {
      // Route logout should still succeed even if the API is unavailable.
    } finally {
      onLogout()
    }
  }

  const handleUnauthorizedSession = (message = 'Your session expired. Please sign in again.') => {
    sessionStorage.setItem('adminAuthNotice', message)
    onLogout()
  }

  const assertAuthorizedResponse = (response, data, fallbackMessage) => {
    if (response.status === 401) {
      handleUnauthorizedSession(
        data?.error === 'Invalid token.'
          ? 'Your session expired. Please sign in again.'
          : (data?.error || 'Please sign in again.')
      )
    }

    if (!response.ok) {
      throw new Error(data?.error || data?.message || fallbackMessage)
    }
  }

  const resetEmployeeForm = ({ keepMessage = false } = {}) => {
    setEmployeeForm(createEmployeeForm())
    setEmployeeMode('create')
    if (!keepMessage) {
      setEmployeeMessage('')
    }
  }

  const selectEmployee = (employee) => {
    setEmployeeMode('edit')
    setEmployeeMessage('')
    setEmployeeForm({
      id: employee.id,
      salesmanId: employee.salesmanId || '',
      name: employee.name || '',
      email: employee.email || '',
      phone: employee.phone || '',
      role: employee.role || 'Salesman',
      store: employee.store?.id || '',
      password: '',
      status: employee.status || 'Active',
    })
    navigate(buildEmployeeEditRoute(employee.id))
    setSidebarOpen(false)
  }

  const handleEmployeeFieldChange = (field, value) => {
    setEmployeeForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const refreshEmployees = async () => {
    const token = localStorage.getItem('adminToken')
    if (!token) {
      return
    }

    const response = await fetch(`${adminBaseUrl}/api/employees`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    const data = await response.json().catch(() => [])

    assertAuthorizedResponse(response, data, 'Failed to fetch employees')

    setEmployees(Array.isArray(data) ? data : [])
  }

  const handleEmployeeSubmit = async () => {
    setEmployeeSaving(true)
    setEmployeeMessage('')

    const token = localStorage.getItem('adminToken')
    const isEdit = employeeMode === 'edit'

    try {
      if ((!employeeMode || employeeMode === 'create') && employeeForm.pin.replace(/\D/g, '').length < 4) {
        throw new Error('PIN must be at least 4 digits')
      }

      if (employeeMode === 'edit' && employeeForm.pin && employeeForm.pin.replace(/\D/g, '').length < 4) {
        throw new Error('PIN must be at least 4 digits')
      }

      const payload = {
        salesmanId: employeeForm.salesmanId,
        name: employeeForm.name,
        email: employeeForm.email,
        phone: employeeForm.phone,
        role: employeeForm.role,
        store: employeeForm.store || null,
        status: employeeForm.status,
      }

      if (!isEdit || employeeForm.pin) {
        payload.pin = employeeForm.pin
      }

      const response = await fetch(
        isEdit ? `${adminBaseUrl}/api/employees/${employeeForm.id}` : `${adminBaseUrl}/api/employees`,
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      )

      const data = await response.json().catch(() => ({}))

      assertAuthorizedResponse(response, data, 'Failed to save employee')

      await refreshEmployees()
      resetEmployeeForm({ keepMessage: true })
      setEmployeeMessage(isEdit ? 'Employee updated successfully' : 'Employee created successfully')
      activateScreen('employees')
    } catch (error) {
      setEmployeeMessage(error.message || 'Failed to save employee')
    } finally {
      setEmployeeSaving(false)
    }
  }

  const handleEmployeeDelete = async (employee) => {
    const confirmed = window.confirm(`Delete employee ${employee.name}?`)
    if (!confirmed) {
      return
    }

    const token = localStorage.getItem('adminToken')

    try {
      const response = await fetch(`${adminBaseUrl}/api/employees/${employee.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await response.json().catch(() => ({}))

      assertAuthorizedResponse(response, data, 'Failed to delete employee')

      await refreshEmployees()
      setEmployeeMessage('Employee deleted successfully')
      if (employeeForm.id === employee.id) {
        resetEmployeeForm()
      }
    } catch (error) {
      setEmployeeMessage(error.message || 'Failed to delete employee')
    }
  }

  const refreshStores = async () => {
    const response = await fetch(`${adminBaseUrl}/api/stores`, {
    })
    const data = await response.json().catch(() => [])

    assertAuthorizedResponse(response, data, 'Failed to fetch stores')

    const normalizedStores = Array.isArray(data) ? data : []
    setStores(normalizedStores)
    setSelectedStoreId((current) => (
      normalizedStores.some((store) => store.id === current) ? current : (normalizedStores[0]?.id || '')
    ))
  }

  const resetStoreForm = ({ keepMessage = false } = {}) => {
    setStoreForm(createStoreForm())
    if (!keepMessage) {
      setStoreMessage('')
    }
  }

  const resetStoreEditForm = () => {
    if (!currentStore) {
      return
    }

    setStoreForm(buildStoreFormFromStore(currentStore))
    setStoreMessage('')
  }

  const openStoreEditor = (storeId) => {
    if (!storeId) {
      return
    }

    setSelectedStoreId(storeId)
    navigate(buildStoreEditRoute(storeId))
    setSidebarOpen(false)
  }

  const handleStoreFieldChange = (field, value) => {
    setStoreForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handleStoreSubmit = async () => {
    setStoreSaving(true)
    setStoreMessage('')

    const token = localStorage.getItem('adminToken')

    try {
      const response = await fetch(`${adminBaseUrl}/api/stores`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(storeForm),
      })

      const data = await response.json().catch(() => ({}))

      assertAuthorizedResponse(response, data, 'Failed to create store')

      await refreshStores()
      setSelectedStoreId(data.id)
      resetStoreForm({ keepMessage: true })
      setStoreMessage('Store created successfully')
      activateScreen('stores')
    } catch (error) {
      setStoreMessage(error.message || 'Failed to create store')
    } finally {
      setStoreSaving(false)
    }
  }

  const handleStoreUpdate = async () => {
    if (!currentStore?.id) {
      setStoreMessage('Select a store before updating it')
      return
    }

    setStoreSaving(true)
    setStoreMessage('')

    const token = localStorage.getItem('adminToken')

    try {
      const response = await fetch(`${adminBaseUrl}/api/stores/${currentStore.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(storeForm),
      })

      const data = await response.json().catch(() => ({}))

      assertAuthorizedResponse(response, data, 'Failed to update store')

      await refreshStores()
      setSelectedStoreId(data.id)
      setStoreForm(buildStoreFormFromStore(data))
      setStoreMessage('Store updated successfully')
    } catch (error) {
      setStoreMessage(error.message || 'Failed to update store')
    } finally {
      setStoreSaving(false)
    }
  }

  const handleStoreDelete = async (store) => {
    const confirmed = window.confirm(`Delete store ${store.name}?`)
    if (!confirmed) {
      return
    }

    const token = localStorage.getItem('adminToken')

    try {
      const response = await fetch(`${adminBaseUrl}/api/stores/${store.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json().catch(() => ({}))

      assertAuthorizedResponse(response, data, 'Failed to delete store')

      await refreshStores()
      setStoreMessage('Store deleted successfully')
    } catch (error) {
      setStoreMessage(error.message || 'Failed to delete store')
    }
  }

  return (
    <div className={`app-shell ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-icon">LC</div>
          <div>
            <p className="eyebrow">Admin Panel</p>
            <h1>LensCorridor</h1>
          </div>
        </div>

        <nav className="nav-list">
          {navConfig.map((item) => (
            item.children ? (
              <div className="nav-group masters-group" key={item.key}>
                <button
                  className={`nav-item ${activeScreen === item.key ? 'active' : ''}`}
                  onClick={() => {
                    // Keep side effects out of the state updater to avoid render-time router updates.
                    if (mastersOpen) {
                      setMastersOpen(false)
                      return
                    }

                    activateMasterSection(masterSection || 'lens-category')
                  }}

                  type="button"
                  aria-expanded={mastersOpen}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </button>
                {mastersOpen ? (
                  <div className="nav-submenu" id="masters-submenu">
                    {item.children.map((child) => (
                      <button
                        className={`nav-subitem ${isMastersActive && masterSection === child.key ? 'active' : ''}`}
                        key={child.key}
                        onClick={() => activateMasterSection(child.key)}
                        type="button"
                      >
                        {child.label}
                      </button>
                    ))}
                  </div>
                ) : null}

              </div>
            ) : (
              <button
                className={`nav-item ${activeScreen === item.key ? 'active' : ''}`}
                key={item.key}
                onClick={() => activateScreen(item.key)}
                type="button"
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            )
          ))}
        </nav>

        <button className="sidebar-logout" onClick={handleLogoutClick} type="button">
          <span className="nav-icon">LO</span>
          <span className="nav-label">Logout</span>
        </button>
      </aside>

      <button
        aria-label="Close menu"
        className="nav-backdrop"
        onClick={() => setSidebarOpen(false)}
        type="button"
      />

      <main className="tablet-frame">
        <div className="tablet-bezel">
          <div className="tablet-screen">
            <header className="topbar">
              <div className="topbar-title">
                <button
                  aria-label="Open menu"
                  className="mobile-menu-toggle"
                  onClick={() => setSidebarOpen((open) => !open)}
                  type="button"
                >
                  <span />
                  <span />
                  <span />
                </button>
                <div>
                  {/* <p className="eyebrow">Centralized Back Office</p> */}
                  <h2 id="screen-title">{screenTitle}</h2>
                </div>
              </div>
              <div className="topbar-actions">
                {/* <div className="pill">All Stores</div> */}
                <div className="profile-chip">
                  <span className="avatar">{initials}</span>
                  <div>
                    <strong>{adminName}</strong>
                    {/* <small>{profileMeta}</small> */}
                  </div>
                </div>
              </div>
            </header>

            <Screen active={activeScreen === 'dashboard'} id="dashboard">
              <DashboardPage
                dashboardHero={dashboardHero}
                dashboardMetrics={dashboardMetrics}
                dashboardRevenueCards={dashboardRevenueCards}
                operationalQueue={operationalQueue}
                productInsights={productInsights}
                salesCaption={salesCaption}
                salesData={salesData}
                salesRange={salesRange}
                salesRanges={['weekly', 'monthly']}
                storePerformance={storePerformance}
                setSalesRange={setSalesRange}
              />
            </Screen>

            <Screen active={activeScreen === 'masters'} id="masters">
              {isMastersManagementRoute ? (
                <MasterSectionPage
                  closeLensCategoryEditor={closeLensCategoryEditor}
                  currentMaster={currentMaster}
                  getStatusTone={getStatusTone}
                  isFrameShapesMaster={isFrameShapesMaster}
                  isLensCategoryEditorOpen={isLensCategoryEditorOpen}
                  masterCountLabel={masterCountLabel}
                  masterError={masterError}
                  masterLoading={masterLoading}
                  normalizedMasterItems={normalizedMasterItems}
                  openLensCategoryEditor={openLensCategoryEditor}
                  refreshMasterItems={refreshMasterItems}
                  selectedMaster={selectedMaster}
                  selectedMasterIndex={selectedMasterIndex}
                  setSelectedMasterIndex={setSelectedMasterIndex}
                  powerTypes={powerTypes}
                  powerTypesLoading={powerTypesLoading}
                  powerTypesError={powerTypesError}
                />
              ) : null}
            </Screen>


            <Screen active={activeScreen === 'stores'} id="stores">
              <StoresPage
                activateScreen={activateScreen}
                currentStore={currentStore}
                handleStoreDelete={handleStoreDelete}
                openStoreEditor={openStoreEditor}
                resetStoreForm={resetStoreForm}
                selectedStoreId={selectedStoreId}
                setSelectedStoreId={setSelectedStoreId}
                storeMessage={storeMessage}
                stores={stores}
              />
            </Screen>

            <Screen active={activeScreen === 'add-store'} id="add-store">
              <div className="section-grid">
                <section className="panel">
                  <div className="panel-head">
                    <div>
                      <p className="eyebrow">Store setup</p>
                      <h4>Add New Store</h4>
                    </div>
                    <div className="filter-pills">
                      <button className="ghost-btn" onClick={() => activateScreen('stores')} type="button">Back To Stores</button>
                      <button className="primary-btn soft-btn" disabled={storeSaving} onClick={handleStoreSubmit} type="button">
                        {storeSaving ? 'Saving...' : 'Save Store'}
                      </button>
                    </div>
                  </div>

                  {storeMessage ? (
                    <div className="task-item" style={{ marginBottom: '14px' }}>
                      <strong>Store status</strong>
                      <small>{storeMessage}</small>
                    </div>
                  ) : null}

                  <div className="section-grid two-col">
                    <div className="form-wire">
                      <div className="field split">
                        <div>
                          <label>Store Name</label>
                          <input className="input filled" onChange={(event) => handleStoreFieldChange('storeName', event.target.value)} type="text" value={storeForm.storeName} />
                        </div>
                        <div>
                          <label>Store Code</label>
                          <input className="input filled" onChange={(event) => handleStoreFieldChange('storeCode', event.target.value.toUpperCase())} type="text" value={storeForm.storeCode} />
                        </div>
                      </div>
                      <div className="field">
                        <label>Street Address</label>
                        <textarea
                          className="input filled"
                          onChange={(event) => handleStoreFieldChange('street', event.target.value)}
                          value={storeForm.street}
                        />
                      </div>
                      <div className="field split three">
                        <div>
                          <label>City</label>
                          <input className="input filled" onChange={(event) => handleStoreFieldChange('city', event.target.value)} type="text" value={storeForm.city} />
                        </div>
                        <div>
                          <label>State</label>
                          <input className="input filled" onChange={(event) => handleStoreFieldChange('state', event.target.value)} type="text" value={storeForm.state} />
                        </div>
                        <div>
                          <label>Pincode</label>
                          <input className="input filled" onChange={(event) => handleStoreFieldChange('pincode', event.target.value)} type="text" value={storeForm.pincode} />
                        </div>
                      </div>
                    </div>

                    <div className="form-wire">
                      <div className="field">
                        <label>Primary Contact Number</label>
                        <input className="input filled" onChange={(event) => handleStoreFieldChange('phone', event.target.value)} type="text" value={storeForm.phone} />
                      </div>
                      <div className="field">
                        <label>Store Email</label>
                        <input className="input filled" onChange={(event) => handleStoreFieldChange('email', event.target.value)} type="email" value={storeForm.email} />
                      </div>
                      <div className="field">
                        <label>Store Manager</label>
                        <input className="input filled" onChange={(event) => handleStoreFieldChange('managerName', event.target.value)} type="text" value={storeForm.managerName} />
                      </div>
                      <div className="field">
                        <label>Status</label>
                        <select className="input filled" onChange={(event) => handleStoreFieldChange('status', event.target.value)} value={storeForm.status}>
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </Screen>

            <Screen active={activeScreen === 'employees'} id="employees">
              <div className="section-grid">
                <section className="panel">
                  <div className="panel-head">
                    <div>
                      <p className="eyebrow">Employee management</p>
                      <h4>List, edit, delete, salesman login, and store mapping</h4>
                    </div>
                    <button
                      className="ghost-btn link-btn"
                      onClick={() => {
                        resetEmployeeForm()
                        activateScreen('create-employee')
                      }}
                      type="button"
                    >
                      Add Employee
                    </button>
                  </div>
                  <div className="mini-grid" style={{ marginBottom: '14px' }}>
                    <MiniCard label="Employees" value={employeeLoading ? 'Loading...' : employeeCountLabel} />
                    <MiniCard label="Stores Available" value={`${storeOptions.length}`} />
                  </div>
                  {employeeMessage ? (
                    <div className={`task-item ${employeeMessageTone === 'error' ? 'task-item-error' : 'task-item-success'}`} style={{ marginBottom: '14px' }}>
                      <strong>Employee status</strong>
                      <small>{employeeMessage}</small>
                    </div>
                  ) : null}
                  <div className="orders-table-shell">
                    <table className="orders-table listing-table listing-table--four">
                      <thead>
                        <tr>
                          <th>Employee</th>
                          <th>Role / Store</th>
                          <th>Contact</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {employeeLoading ? (
                          <tr>
                            <td><strong className="table-cell-primary">Loading employees...</strong></td>
                            <td><span className="table-cell-secondary">Please wait while we fetch the latest records</span></td>
                            <td>-</td>
                            <td><StatusBadge tone="neutral">Loading</StatusBadge></td>
                          </tr>
                        ) : null}
                        {!employeeLoading && employeeError ? (
                          <tr>
                            <td><strong className="table-cell-primary">Unable to load employees</strong></td>
                            <td><span className="table-cell-secondary">{employeeError}</span></td>
                            <td>-</td>
                            <td><StatusBadge tone="warning">Error</StatusBadge></td>
                          </tr>
                        ) : null}
                        {!employeeLoading && !employeeError && employees.length === 0 ? (
                          <tr>
                            <td><strong className="table-cell-primary">No employees found</strong></td>
                            <td><span className="table-cell-secondary">Create your first employee to assign a salesman login</span></td>
                            <td>-</td>
                            <td><StatusBadge tone="neutral">Empty</StatusBadge></td>
                          </tr>
                        ) : null}
                        {!employeeLoading && !employeeError && employees.map((employee) => (
                          <tr className="orders-data-row" key={employee.id}>
                            <td>
                              <strong className="table-cell-primary">{employee.name}</strong>
                              <small className="table-cell-secondary">{employee.salesmanId}</small>
                            </td>
                            <td>
                              <strong className="table-cell-primary">{employee.role}</strong>
                              <small className="table-cell-secondary">{employee.store?.name || 'No store assigned'}</small>
                            </td>
                            <td>
                              <strong className="table-cell-primary">{employee.phone || '-'}</strong>
                              <small className="table-cell-secondary">{employee.email || 'No email added'}</small>
                            </td>
                            <td>
                              <div className="filter-pills">
                                <button className="ghost-btn" onClick={() => selectEmployee(employee)} type="button">Edit</button>
                                <button className="ghost-btn" onClick={() => handleEmployeeDelete(employee)} type="button">Delete</button>
                                <StatusBadge tone={getStatusTone(employee.status)}>{employee.status}</StatusBadge>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
 
              </div>
            </Screen>

            <Screen active={activeScreen === 'create-employee'} id="create-employee">
              <div className="section-grid">
                <section className="panel">
                  <div className="panel-head">
                    <div>
                      <p className="eyebrow">Employee setup</p>
                      <h4>{employeeMode === 'edit' ? 'Edit Employee' : 'Create Employee'}</h4>
                    </div>
                    <div className="filter-pills">
                      <button className="ghost-btn" onClick={() => activateScreen('employees')} type="button">Back To Employees</button>
                      <button className="primary-btn soft-btn" disabled={employeeSaving} onClick={handleEmployeeSubmit} type="button">
                        {employeeSaving ? 'Saving...' : employeeMode === 'edit' ? 'Update Employee' : 'Save Employee'}
                      </button>
                    </div>
                  </div>

                  {employeeMessage ? (
                    <div className={`task-item ${employeeMessageTone === 'error' ? 'task-item-error' : 'task-item-success'}`} style={{ marginBottom: '14px' }}>
                      <strong>Employee status</strong>
                      <small>{employeeMessage}</small>
                    </div>
                  ) : null}

                  <div className="section-grid two-col">
                    <div className="form-wire">
                      <div className="field split">
                        <div>
                          <label>Salesman ID</label>
                          <input
                            className="input filled"
                            readOnly
                            type="text"
                            placeholder={employeeMode === 'edit' ? '' : 'Auto-generated on save'}
                            value={employeeForm.salesmanId}
                          />
                          <small>{employeeMode === 'edit' ? 'Employee ID is auto-generated and cannot be changed.' : 'Employee ID will be generated automatically when you save.'}</small>
                        </div>
                        <div>
                          <label>Employee Name</label>
                          <input
                            className="input filled"
                            onChange={(event) => handleEmployeeFieldChange('name', event.target.value)}
                            type="text"
                            value={employeeForm.name}
                          />
                        </div>
                      </div>
                      <div className="field split">
                        <div>
                          <label>Mobile Number</label>
                          <input
                            className="input filled"
                            onChange={(event) => handleEmployeeFieldChange('phone', event.target.value)}
                            type="text"
                            value={employeeForm.phone}
                          />
                        </div>
                        <div>
                          <label>Email Address</label>
                          <input
                            className="input filled"
                            onChange={(event) => handleEmployeeFieldChange('email', event.target.value)}
                            type="email"
                            value={employeeForm.email}
                          />
                        </div>
                      </div>
                      <div className="field">
                        <label>PIN {employeeMode === 'edit' ? '(leave blank to keep current PIN)' : ''}</label>
                        <input
                          className="input filled"
                          onChange={(event) => handleEmployeeFieldChange('pin', event.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                          type="password"
                          value={employeeForm.pin}
                        />
                      </div>
                    </div>

                    <div className="form-wire">
                      <div className="field">
                        <label>Role</label>
                        <select
                          className="input filled"
                          onChange={(event) => handleEmployeeFieldChange('role', event.target.value)}
                          value={employeeForm.role}
                        >
                          <option value="Salesman">Salesman</option>
                          <option value="Manager">Manager</option>
                          <option value="Admin">Admin</option>
                          <option value="Staff">Staff</option>
                        </select>
                      </div>
                      <div className="field">
                        <label>Select Store</label>
                        <select
                          className="input filled"
                          onChange={(event) => handleEmployeeFieldChange('store', event.target.value)}
                          value={employeeForm.store}
                        >
                          <option value="">No store selected</option>
                          {storeOptions.map((store) => (
                            <option key={store.id} value={store.id}>
                              {store.name} ({store.code})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="field">
                        <label>Status</label>
                        <select
                          className="input filled"
                          onChange={(event) => handleEmployeeFieldChange('status', event.target.value)}
                          value={employeeForm.status}
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      </div>
                      <div className="form-actions-inline">
                        <button className="ghost-btn" onClick={resetEmployeeForm} type="button">
                          Clear Form
                        </button>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </Screen>

            <Screen active={activeScreen === 'customers'} id="customers">
              <div className="section-grid two-col">
                <section className="panel">
                  <div className="panel-head">
                    <div>
                      <p className="eyebrow">Customer management</p>
                      <h4>Search, purchase history, and app-order customers</h4>
                    </div>
                    <div className="filter-pills">
                      <span className="pill">{filteredCustomers.length} Customers</span>
                      <span className="pill">Mobile App</span>
                    </div>
                  </div>
                  <div className="search-box">
                    <input
                      className="input filled"
                      onChange={(event) => setCustomerSearch(event.target.value)}
                      placeholder="Search by mobile / name / ID"
                      type="text"
                      value={customerSearch}
                    />
                  </div>
                  <div className="orders-table-shell">
                    <table className="orders-table listing-table listing-table--three">
                      <thead>
                        <tr>
                          <th>Customer</th>
                          <th>Activity</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customersLoading ? (
                          <tr>
                            <td><strong className="table-cell-primary">Loading customers...</strong></td>
                            <td><span className="table-cell-secondary">Fetching customer profiles from app orders</span></td>
                            <td>-</td>
                          </tr>
                        ) : null}
                        {!customersLoading && customersError ? (
                          <tr>
                            <td><strong className="table-cell-primary">{customersError}</strong></td>
                            <td><span className="table-cell-secondary">Customer records could not be loaded</span></td>
                            <td>-</td>
                          </tr>
                        ) : null}
                        {!customersLoading && !customersError && filteredCustomers.length === 0 ? (
                          <tr>
                            <td><strong className="table-cell-primary">No customers found</strong></td>
                            <td><span className="table-cell-secondary">Customers are created automatically when app orders are placed</span></td>
                            <td>-</td>
                          </tr>
                        ) : null}
                        {!customersLoading && !customersError && filteredCustomers.map((customer) => (
                          <tr
                            className={`orders-data-row ${selectedCustomer?.id === customer.id ? 'active-card' : ''}`}
                            key={customer.id}
                            onClick={() => setSelectedCustomerId(customer.id)}
                          >
                            <td>
                              <strong className="table-cell-primary">{customer.name || 'Customer'}</strong>
                              <small className="table-cell-secondary">{customer.phone || customer.id}</small>
                            </td>
                            <td>
                              <strong className="table-cell-primary">{customer.orderCount} order{customer.orderCount === 1 ? '' : 's'}</strong>
                              <small className="table-cell-secondary">
                                {customer.lastOrderDate ? `Last order ${formatOrderDate(customer.lastOrderDate)}` : formatCustomerSince(customer.createdAt)}
                              </small>
                            </td>
                            <td>
                              <StatusBadge tone={getCustomerTone(customer)}>{getCustomerLabel(customer)}</StatusBadge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="panel detail-panel">
                  <p className="eyebrow">Customer profile</p>
                  <h4>{selectedCustomer?.name || 'Select a customer'}</h4>
                  {!selectedCustomer ? (
                    <div className="empty-state">
                      <strong>No customer selected</strong>
                      <small>Choose a customer from the list to review their latest activity.</small>
                    </div>
                  ) : (
                    <>
                      <div className="profile-panels">
                        <MiniCard label="Mobile" value={selectedCustomer.phone || '-'} />
                        <MiniCard label="Orders" value={String(selectedCustomer.orderCount || 0)} />
                        <MiniCard label="Lifetime Value" value={formatCurrency(selectedCustomer.totalSpent)} />
                        <MiniCard label="Status" value={getCustomerLabel(selectedCustomer)} />
                      </div>
                      <div className="info-grid" style={{ marginTop: 16 }}>
                        <InfoCard label="Customer ID" value={selectedCustomer.id} />
                        <InfoCard label="Joined" value={formatOrderDate(selectedCustomer.createdAt)} />
                        <InfoCard label="Last Order" value={selectedCustomer.lastOrderNumber || '-'} />
                        <InfoCard label="Last Visit" value={formatOrderDate(selectedCustomer.lastOrderDate)} />
                        <InfoCard label="Lens Preference" value={selectedCustomer.lastLensType || '-'} />
                        <InfoCard label="Payment Mode" value={selectedCustomer.lastPaymentMode || '-'} />
                      </div>
                      <div className="task-list" style={{ marginTop: 16 }}>
                        <div className="task-item">
                          <strong>Address</strong>
                          <small>{formatCustomerAddress(selectedCustomer)}</small>
                        </div>
                        <div className="task-item">
                          <strong>Email</strong>
                          <small>{selectedCustomer.email || 'Email not added'}</small>
                        </div>
                      </div>
                    </>
                  )}
                </section>
              </div>
            </Screen>

            <Screen active={activeScreen === 'orders'} id="orders">
              <div className="section-grid">
                <section className="panel">
                  <div className="panel-head">
                    <div>
                      <p className="eyebrow">Order management</p>
                      <h4>Live app orders, billing totals, and fulfillment status</h4>
                    </div>
                    <div className="filter-pills">
                      <span className="pill">{filteredAppOrders.length} Orders</span>
                      <span className="pill">{orderPageCount} Page{orderPageCount === 1 ? '' : 's'}</span>
                      <span className="pill">Mobile App</span>
                      {appOrdersRefreshing ? <span className="pill">Refreshing...</span> : null}
                      {selectedOrderStore ? <span className="pill">{selectedOrderStore.name}</span> : null}
                    </div>
                  </div>
                  <div className="order-filter-bar" style={{ marginBottom: 16 }}>
                    <label className="order-filter-control">
                      <span className="order-filter-label">Order ID</span>
                      <input
                        onChange={(event) => setOrderIdSearch(event.target.value)}
                        placeholder="Search order ID"
                        type="text"
                        value={orderIdSearch}
                      />
                    </label>
                    <label className="order-filter-control">
                      <span className="order-filter-label">Mobile Number</span>
                      <input
                        onChange={(event) => setOrderPhoneSearch(event.target.value.replace(/\D/g, ''))}
                        placeholder="Search mobile"
                        type="text"
                        value={orderPhoneSearch}
                      />
                    </label>
                    <label className="order-filter-control">
                      <span className="order-filter-label">Store</span>
                      <select
                        onChange={(event) => setOrderStoreFilter(event.target.value)}
                        value={orderStoreFilter}
                      >
                        <option value="">All Stores</option>
                        {stores.map((store) => (
                          <option key={store.id} value={store.id}>
                            {store.name} ({store.code})
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      className="ghost-btn order-filter-clear"
                      onClick={clearOrderFilters}
                      type="button"
                    >
                      Clear Search
                    </button>
                  </div>
                  <div className="orders-table-shell">
                    <table className="orders-table orders-table--orders-list">
                      <thead>
                        <tr>
                          <th>Order ID</th>
                          <th>Date</th>
                          <th>Customer</th>
                          <th>Salesperson / Store</th>
                          <th>Product / Lens</th>
                          <th>Order / Payment Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {appOrdersLoading ? (
                          <tr>
                            <td><strong className="table-cell-primary">Loading orders...</strong></td>
                            <td>-</td>
                            <td>-</td>
                            <td>-</td>
                            <td>-</td>
                            <td>-</td>
                            <td>-</td>
                          </tr>
                        ) : null}
                        {!appOrdersLoading && appOrdersError ? (
                          <tr>
                            <td><strong className="table-cell-primary">{appOrdersError}</strong></td>
                            <td>-</td>
                            <td>-</td>
                            <td>-</td>
                            <td>-</td>
                            <td>-</td>
                            <td>-</td>
                          </tr>
                        ) : null}
                        {!appOrdersLoading && !appOrdersError && filteredAppOrders.length === 0 ? (
                          <tr>
                            <td><strong className="table-cell-primary">No orders yet</strong></td>
                            <td>-</td>
                            <td>-</td>
                            <td><span className="table-cell-secondary">Try changing the store filter or place a new app order</span></td>
                            <td>-</td>
                            <td><StatusBadge tone="neutral">Empty</StatusBadge></td>
                            <td><span className="table-action-pill">Waiting</span></td>
                          </tr>
                        ) : null}
                        {!appOrdersLoading && !appOrdersError && paginatedAppOrders.map((order) => (
                          <tr className="orders-data-row" key={order.id} onClick={() => openOrderDetails(order)}>
                            <td>
                              <strong className="table-cell-primary">{order.orderNumber}</strong>
                              <small className="table-cell-secondary">Mobile App Order</small>
                            </td>
                            <td>
                              <strong className="table-cell-primary">{formatOrderDate(order.createdAt)}</strong>
                              <small className="table-cell-secondary">{order.invoiceDate || 'Invoice pending'}</small>
                            </td>
                            <td>
                              <strong className="table-cell-primary">{order.customer?.name || 'Customer'}</strong>
                              <small className="table-cell-secondary">{order.customer?.phone || 'Contact unavailable'}</small>
                            </td>
                            <td>
                              <strong className="table-cell-primary">{getOrderSalespersonLabel(order)}</strong>
                              <small className="table-cell-secondary">{getOrderStoreLabel(order)}</small>
                            </td>
                            <td>
                              <strong className="table-cell-primary">{order.lensSelection?.lensCategory || order.lensSelection?.powerType || 'Frame Only'}</strong>
                              <small className="table-cell-secondary">{order.lensSelection?.lensType || order.frame?.selectedShape || 'Lens selection pending'}</small>
                            </td>
                            <td>
                              <div className="filter-pills">
                                <StatusBadge tone={getStatusTone(getOrderStatusLabel(order.status))}>
                                  {`Order: ${getOrderStatusLabel(order.status)}`}
                                </StatusBadge>
                                <StatusBadge tone={getPaymentStatusTone(order)}>
                                  {`Payment: ${getPaymentStatusLabel(order)}`}
                                </StatusBadge>
                              </div>
                              <small className="table-cell-secondary">
                                {`Paid ${formatCurrency(order.billing?.paidAmount)} | Remaining ${formatCurrency(order.billing?.remainingAmount)} | ${order.billing?.paymentMode || 'Unknown'}`}
                              </small>
                            </td>
                            <td>
                              <div className="table-action-pills">
                                <span className="table-action-pill">View Details</span>
                                {order.status !== 'Completed' ? (
                                  <button
                                    className="table-action-pill"
                                    onClick={(event) => {
                                      event.stopPropagation()
                                      handleOrderStatusUpdate(order, 'Completed')
                                    }}
                                    type="button"
                                  >
                                    Mark as Completed
                                  </button>
                                ) : null}
                                <button
                                  className="table-action-pill"
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    downloadOrderInvoice(order)
                                  }}
                                  type="button"
                                >
                                  Download Invoice
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {!appOrdersLoading && !appOrdersError && filteredAppOrders.length > 0 ? (
                    <div className="pagination-shell">
                      <div className="pagination-summary">
                        <strong>
                          Showing {(safeOrderPage - 1) * ORDER_PAGE_SIZE + 1}
                          {' '}-
                          {' '}{Math.min(safeOrderPage * ORDER_PAGE_SIZE, filteredAppOrders.length)}
                        </strong>
                        <small>of {filteredAppOrders.length} app orders</small>
                      </div>
                      <div className="pagination-controls">
                        <button
                          className="pagination-nav"
                          disabled={safeOrderPage === 1}
                          onClick={() => setOrderPage((current) => Math.max(1, current - 1))}
                          type="button"
                        >
                          Previous
                        </button>
                        <div className="pagination-track">
                          {orderPaginationItems.map((item) => (
                            typeof item === 'string' ? (
                              <span className="pagination-ellipsis" key={item}>...</span>
                            ) : (
                              <button
                                className={`pagination-chip ${item === safeOrderPage ? 'active' : ''}`}
                                key={item}
                                onClick={() => setOrderPage(item)}
                                type="button"
                              >
                                {item}
                              </button>
                            )
                          ))}
                        </div>
                        <button
                          className="pagination-nav pagination-nav--next"
                          disabled={safeOrderPage === orderPageCount}
                          onClick={() => setOrderPage((current) => Math.min(orderPageCount, current + 1))}
                          type="button"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  ) : null}
                </section>
              </div>
            </Screen>

            <Screen active={activeScreen === 'order-details'} id="order-details">
              <div className="section-grid">
                <section className="panel">
                  <div className="panel-head">
                    <div>
                      <p className="eyebrow">Order details</p>
                      <h4>{selectedAppOrder ? `${selectedAppOrder.orderNumber} - App order details` : 'Select an order'}</h4>
                    </div>
                    <div className="filter-pills">
                      <button className="ghost-btn" onClick={() => activateScreen('orders')} type="button">Back To Orders</button>
                      {selectedAppOrder?.status !== 'Completed' ? (
                        <button
                          className="ghost-btn"
                          onClick={() => handleOrderStatusUpdate(selectedAppOrder, 'Completed')}
                          type="button"
                        >
                          Mark as Completed
                        </button>
                      ) : null}
                      {selectedAppOrder ? (
                        <button
                          className="ghost-btn"
                          onClick={() => downloadOrderInvoice(selectedAppOrder)}
                          type="button"
                        >
                          Download Invoice
                        </button>
                      ) : null}
                      {selectedAppOrder?.invoiceDate ? <span className="pill">{selectedAppOrder.invoiceDate}</span> : null}
                    </div>
                  </div>

                  {!selectedAppOrder ? (
                    <div className="empty-state">
                      <strong>No order selected</strong>
                      <small>Choose an order from the list to review its details.</small>
                    </div>
                  ) : (
                    <div className="order-details-view">
                      {(() => {
                        const uploadedOrderImages = getUploadedOrderImages(selectedAppOrder)

                        return (
                          <section className="panel" style={{ marginBottom: '16px' }}>
                            <div className="panel-head">
                              <div>
                                <p className="eyebrow">Uploaded images</p>
                                <h4>User-submitted frame photos</h4>
                              </div>
                              <div className="filter-pills">
                                <span className="pill">{uploadedOrderImages.length} Image{uploadedOrderImages.length === 1 ? '' : 's'}</span>
                              </div>
                            </div>

                            {uploadedOrderImages.length ? (
                              <div className="uploaded-image-grid">
                                {uploadedOrderImages.map((item, index) => (
                                  <figure className="uploaded-image-card" key={item.id || `${item.image}-${index}`}>
                                    <div className="uploaded-image-frame">
                                      <img
                                        alt={item.shape ? `${item.shape} upload` : `Uploaded frame ${index + 1}`}
                                        src={item.image}
                                      />
                                    </div>
                                    <figcaption>
                                      <strong>Upload {index + 1}</strong>
                                      <small>{item.shape || 'User uploaded image'}</small>
                                    </figcaption>
                                  </figure>
                                ))}
                              </div>
                            ) : (
                              <div className="empty-state">
                                <strong>No uploaded images found</strong>
                                <small>This order does not include any user-submitted frame photos.</small>
                              </div>
                            )}
                          </section>
                        )
                      })()}

                      <div className="section-grid two-col">
                        <div className="panel order-visual-panel">
                          <p className="eyebrow">Frame preview</p>
                          <div className="frame-preview" style={{ overflow: 'hidden' }}>
                            {selectedAppOrder.frame?.images?.[0]?.image ? (
                              <img
                                alt="Frame preview"
                                src={selectedAppOrder.frame.images[0].image}
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                              />
                            ) : (
                              <div className="frame-shape" />
                            )}
                          </div>
                          <div className="info-grid">
                            <InfoCard label="Frame Shape" value={selectedAppOrder.frame?.selectedShape || 'Frame'} />
                            <InfoCard label="Power Type" value={selectedAppOrder.lensSelection?.powerType || '-'} />
                            <InfoCard label="Lens Category" value={selectedAppOrder.lensSelection?.lensCategory || 'Frame Only'} />
                            <InfoCard label="Frame Price" value={formatCurrency(selectedAppOrder.frame?.price)} />
                          </div>
                        </div>

                        <div className="panel">
                          <p className="eyebrow">Order summary</p>
                          <div className="info-grid">
                            <InfoCard label="Customer" value={selectedAppOrder.customer?.name || '-'} />
                            <InfoCard label="Mobile" value={selectedAppOrder.customer?.phone || '-'} />
                            <InfoCard label="Salesperson" value={getOrderSalespersonLabel(selectedAppOrder)} />
                            <InfoCard label="Store" value={getOrderStoreLabel(selectedAppOrder)} />
                            <InfoCard label="Order Date" value={formatOrderDate(selectedAppOrder.createdAt)} />
                            <InfoCard label="Payment Mode" value={selectedAppOrder.billing?.paymentMode || '-'} />
                            <InfoCard label="Discount" value={formatCurrency(selectedAppOrder.billing?.discount)} />
                            <InfoCard label="Final Amount" value={formatCurrency(selectedAppOrder.billing?.totalPayable)} />
                            <InfoCard label="Paid Amount" value={formatCurrency(selectedAppOrder.billing?.paidAmount)} />
                            <InfoCard label="Remaining Amount" value={formatCurrency(selectedAppOrder.billing?.remainingAmount)} />
                            <InfoCard label="Payment Status" value={getPaymentStatusLabel(selectedAppOrder)} />
                          </div>
                          <div className="task-list" style={{ marginTop: 16 }}>
                            <div className="task-item">
                              <div>
                                <strong>Partial payment management</strong>
                                <small>
                                  {getCollectableAmount(selectedAppOrder) > 0
                                    ? `Collect up to ${formatCurrency(getCollectableAmount(selectedAppOrder))} and keep payment records updated.`
                                    : 'This order is fully paid.'}
                                </small>
                              </div>
                              {getCollectableAmount(selectedAppOrder) > 0 ? (
                                <div className="filter-pills" style={{ alignItems: 'center' }}>
                                  <input
                                    className="input filled"
                                    onChange={(event) => setPaymentCollectionAmount(event.target.value.replace(/[^0-9]/g, ''))}
                                    placeholder="Collect amount"
                                    style={{ minWidth: 150 }}
                                    type="text"
                                    value={paymentCollectionAmount}
                                  />
                                  <select
                                    className="input filled"
                                    onChange={(event) => setPaymentCollectionMode(event.target.value)}
                                    style={{ minWidth: 130 }}
                                    value={paymentCollectionMode}
                                  >
                                    <option value="Cash">Cash</option>
                                    <option value="Card">Card</option>
                                    <option value="Online">Online</option>
                                  </select>
                                  <button
                                    className="primary-btn soft-btn"
                                    disabled={paymentCollectionSaving}
                                    onClick={() => handleOrderPaymentCollection(selectedAppOrder)}
                                    type="button"
                                  >
                                    {paymentCollectionSaving ? 'Saving...' : 'Update Payment'}
                                  </button>
                                </div>
                              ) : (
                                <StatusBadge tone="positive">Fully Paid</StatusBadge>
                              )}
                            </div>
                            {paymentCollectionMessage ? (
                              <div className="task-item">
                                <strong>Payment update</strong>
                                <small>{paymentCollectionMessage}</small>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      <div className="section-grid two-col">
                        {/* Lens Details */}
                        <section className="panel">
                          <div className="panel-head">
                            <div>
                              <p className="eyebrow">Lens details</p>
                              <h4>Lens information & pricing</h4>
                            </div>
                          </div>

                          <div className="orders-table-shell">
                            <table className="orders-table">
                              <thead>
                                <tr>
                                  <th>Lens Item</th>
                                  <th>Specification</th>
                                  <th>Status / Price</th>
                                </tr>
                              </thead>

                              <tbody>
                                <tr className="orders-data-row">
                                  <td>
                                    <strong className="table-cell-primary">
                                      Lens Type
                                    </strong>
                                    <small className="table-cell-secondary">
                                      Selected Lens
                                    </small>
                                  </td>

                                  <td>
                                    <strong className="table-cell-primary">
                                      {selectedAppOrder.lensSelection?.lensType || '-'}
                                    </strong>
                                    <small className="table-cell-secondary">
                                      {selectedAppOrder.lensSelection?.powerType || '-'}
                                    </small>
                                  </td>

                                  <td>
                                    <StatusBadge
                                      tone={getStatusTone(selectedAppOrder.status)}
                                    >
                                      {selectedAppOrder.status}
                                    </StatusBadge>
                                  </td>
                                </tr>

                                <tr className="orders-data-row">
                                  <td>
                                    <strong className="table-cell-primary">
                                      Category
                                    </strong>
                                    <small className="table-cell-secondary">
                                      Lens Category
                                    </small>
                                  </td>

                                  <td>
                                    <strong className="table-cell-primary">
                                      {selectedAppOrder.lensSelection?.lensCategory ||
                                        'Frame Only'}
                                    </strong>
                                  </td>

                                  <td>
                                    <strong className="table-cell-primary">
                                      {formatCurrency(
                                        selectedAppOrder.lensSelection?.lensPrice
                                      )}
                                    </strong>
                                  </td>
                                </tr>

                                <tr className="orders-data-row">
                                  <td>
                                    <strong className="table-cell-primary">
                                      Subtotal
                                    </strong>
                                    <small className="table-cell-secondary">
                                      Total Billing
                                    </small>
                                  </td>

                                  <td>
                                    <strong className="table-cell-primary">
                                      {selectedAppOrder.lensSelection?.powerType || '-'}
                                    </strong>
                                  </td>

                                  <td>
                                    <strong className="table-cell-primary">
                                      {formatCurrency(
                                        selectedAppOrder.billing?.subtotal
                                      )}
                                    </strong>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </section>

                        {/* Glass Prescription */}
                        <section className="panel">
                          <div className="panel-head">
                            <div>
                              <p className="eyebrow">Glass prescription</p>
                              <h4>Eye power details</h4>
                            </div>
                          </div>

                          <div className="orders-table-shell">
                            <table className="orders-table">
                              <thead>
                                <tr>
                                  <th>Eye</th>
                                  <th>Power</th>
                                  <th>Axis / Add</th>
                                </tr>
                              </thead>

                              <tbody>
                                {selectedAppOrder.lensDetails?.length ? (
                                  selectedAppOrder.lensDetails.map((detail) => (
                                    <tr
                                      className="orders-data-row"
                                      key={detail.id || detail.eye}
                                    >
                                      <td>
                                        <strong className="table-cell-primary">
                                          {detail.eye === 'right'
                                            ? 'Right'
                                            : 'Left'}
                                        </strong>
                                      </td>

                                      <td>
                                        <strong className="table-cell-primary">
                                          {`SPH ${detail.sph || '-'} / CYL ${detail.cyl || '-'
                                            }`}
                                        </strong>
                                      </td>

                                      <td>
                                        <strong className="table-cell-primary">
                                          {`Axis ${detail.axis || '-'} / Add ${detail.add || '-'
                                            }`}
                                        </strong>
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td>
                                      <strong className="table-cell-primary">
                                        No Prescription
                                      </strong>
                                    </td>
                                    <td>
                                      <span className="table-cell-secondary">
                                        No power values saved
                                      </span>
                                    </td>
                                    <td>-</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </section>
                      </div>
                    </div>
                  )}
                </section>
              </div>
            </Screen>

            <Screen active={activeScreen === 'cash'} id="cash">
              <div className="section-grid two-col">
                <section className="panel">
                  <div className="panel-head">
                    <div>
                      <p className="eyebrow">Payment summary</p>
                      <h4>Cash, card, and UPI collections</h4>
                    </div>
                    <div className="filter-pills">
                      {appOrdersRefreshing ? <span className="pill">Refreshing...</span> : null}
                    </div>
                  </div>
                  <div className="filter-group">
                    <label className="date-pill">
                      <span>From</span>
                      <input onChange={(event) => setFromDate(event.target.value)} type="date" value={fromDate} />
                    </label>
                    <label className="date-pill">
                      <span>To</span>
                      <input onChange={(event) => setToDate(event.target.value)} type="date" value={toDate} />
                    </label>
                  </div>
                  <div className="metric-grid compact">
                    <MetricCard hint={`${paymentSummary.modes.Cash.count} cash payment${paymentSummary.modes.Cash.count === 1 ? '' : 's'}`} label="Cash Received" value={formatCurrency(paymentSummary.modes.Cash.amount)} />
                    <MetricCard hint={`${paymentSummary.modes.Card.count} card payment${paymentSummary.modes.Card.count === 1 ? '' : 's'}`} label="Card Received" value={formatCurrency(paymentSummary.modes.Card.amount)} />
                    <MetricCard hint={`${paymentSummary.modes.Online.count} online payment${paymentSummary.modes.Online.count === 1 ? '' : 's'}`} label="Online Received" value={formatCurrency(paymentSummary.modes.Online.amount)} />
                    <MetricCard hint={`Pending to collect ${formatCurrency(paymentSummary.pendingCollection)}`} label="Total Received" value={formatCurrency(paymentSummary.totalCollected)} />
                  </div>
                </section>

                <section className="panel detail-panel">
                  <div className="panel-head">
                    <div>
                      <p className="eyebrow">Payment breakdown</p>
                      <h4>Mode-wise observations</h4>
                    </div>
                  </div>
                  <div className="task-list">
                    {paymentBreakdown.map((item) => (
                      <div className="task-item" key={item.title}>
                        <strong>{item.title}</strong>
                        <small>{item.meta}</small>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </Screen>

            <Screen active={activeScreen === 'returns'} id="returns">
              <div className="section-grid two-col">
                <section className="panel">
                  <div className="panel-head">
                    <div>
                      <p className="eyebrow">Return / exchange management</p>
                      <h4>Return and exchange requests</h4>
                    </div>
                  </div>
                  <div className="orders-table-shell">
                    <table className="orders-table listing-table listing-table--five">
                      <thead>
                        <tr>
                          <th>Request</th>
                          <th>Order</th>
                          <th>Customer / Store</th>
                          <th>Reason</th>
                          <th>Settlement / Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {returnRequestsLoading ? (
                          <tr>
                            <td colSpan="5">
                              <strong className="table-cell-primary">Loading return requests...</strong>
                            </td>
                          </tr>
                        ) : null}
                        {!returnRequestsLoading && returnRequestsError ? (
                          <tr>
                            <td colSpan="4">
                              <strong className="table-cell-primary">{returnRequestsError}</strong>
                              <small className="table-cell-secondary">We could not load return orders right now.</small>
                            </td>
                            <td><StatusBadge tone="warning">Error</StatusBadge></td>
                          </tr>
                        ) : null}
                        {!returnRequestsLoading && !returnRequestsError && returnRequests.length === 0 ? (
                          <tr>
                            <td colSpan="4">
                              <strong className="table-cell-primary">No return or exchange requests yet</strong>
                              <small className="table-cell-secondary">Requests will appear here once they are created from the app.</small>
                            </td>
                            <td><StatusBadge tone="neutral">Empty</StatusBadge></td>
                          </tr>
                        ) : null}
                        {!returnRequestsLoading && !returnRequestsError && returnRequests.map((request) => (
                          <tr className="orders-data-row" key={request.id}>
                            <td>
                              <strong className="table-cell-primary">{request.id.slice(-8).toUpperCase()}</strong>
                              <small className="table-cell-secondary">{formatOrderDate(request.createdAt)}</small>
                            </td>
                            <td>
                              <strong className="table-cell-primary">{request.orderNumber || '-'}</strong>
                              <small className="table-cell-secondary">{request.itemCount} item{request.itemCount === 1 ? '' : 's'}</small>
                            </td>
                            <td>
                              <strong className="table-cell-primary">{request.customerName || 'Customer'}</strong>
                              <small className="table-cell-secondary">
                                {`${request.type === 'exchange' ? 'Exchange' : 'Return'} | ${request.storeName || 'Store not assigned'}`}
                              </small>
                            </td>
                            <td>
                              <strong className="table-cell-primary">{request.reason || '-'}</strong>
                              <small className="table-cell-secondary">{request.customerPhone || 'Phone not available'}</small>
                            </td>
                            <td>
                              <strong className="table-cell-primary">
                                {`${request.settlementType === 'collect' ? 'Collect' : request.settlementType === 'refund' ? 'Refund' : 'Even'} | ${formatCurrency(request.settlementAmount ?? request.totalRefundAmount)}`}
                              </strong>
                              <small className="table-cell-secondary">
                                <StatusBadge tone={getStatusTone(request.status)}>{request.status}</StatusBadge>
                              </small>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="panel detail-panel">
                  <p className="eyebrow">Request analytics</p>
                  <h4>Current request snapshot</h4>
                  <div className="mini-grid">
                    <MiniCard label="Requested" value={String(returnSummary.requested)} />
                    <MiniCard label="Approved" value={String(returnSummary.approved)} />
                    <MiniCard label="Completed" value={String(returnSummary.completed)} />
                    <MiniCard label="Rejected" value={String(returnSummary.rejected)} />
                  </div>
                  <div className="task-list" style={{ marginTop: '18px' }}>
                    <div className="task-item">
                      <strong>Total settlement value</strong>
                      <small>{formatCurrency(returnSummary.totalRefundAmount)}</small>
                    </div>
                    <div className="task-item">
                      <strong>Total requests</strong>
                      <small>{returnRequests.length} request{returnRequests.length === 1 ? '' : 's'}</small>
                    </div>
                  </div>
                </section>
              </div>
            </Screen>

            <Screen active={activeScreen === 'edit-store'} id="edit-store">
              <div className="section-grid">
                <section className="panel detail-panel compact-lens-editor">
                  <div className="panel-head">
                    <div>
                      <p className="eyebrow">Store update</p>
                      <h4>{currentStore ? `Edit ${currentStore.name}` : 'Edit Store'}</h4>
                    </div>
                    <div className="filter-pills">
                      <button className="ghost-btn" onClick={() => activateScreen('stores')} type="button">Back To Stores</button>
                      <button className="ghost-btn" onClick={resetStoreEditForm} type="button">Reset Changes</button>
                      <button className="primary-btn soft-btn" disabled={storeSaving || !currentStore} onClick={handleStoreUpdate} type="button">
                        {storeSaving ? 'Saving...' : 'Save Updates'}
                      </button>
                    </div>
                  </div>

                  {storeMessage ? (
                    <div className="task-item" style={{ marginBottom: '14px' }}>
                      <strong>Store status</strong>
                      <small>{storeMessage}</small>
                    </div>
                  ) : null}

                  {currentStore ? (
                    <>
                      <div className="info-grid compact-info-grid lens-editor-summary" style={{ marginBottom: '18px' }}>
                        <InfoCard label="Status" value={currentStore.status || '-'} />
                        <InfoCard label="Reference" value={currentStore.code || '-'} />
                        <InfoCard label="Manager" value={currentStore.managerName || '-'} />
                        <InfoCard label="Primary Contact" value={currentStore.phone || '-'} />
                      </div>

                      <div className="form-wire lens-category-wire lens-editor-layout">
                        <section className="lens-editor-card">
                          <div className="lens-editor-card-head">
                            <div>
                              <p className="eyebrow">Core Details</p>
                              <h5>Store identity and operating status</h5>
                            </div>
                          </div>
                          <div className="field split compact-field-split">
                            <div className="field compact-field">
                              <label>Store Name</label>
                              <input className="input filled" onChange={(event) => handleStoreFieldChange('storeName', event.target.value)} type="text" value={storeForm.storeName} />
                            </div>
                            <div className="field compact-field">
                              <label>Store Code</label>
                              <input className="input filled" onChange={(event) => handleStoreFieldChange('storeCode', event.target.value.toUpperCase())} type="text" value={storeForm.storeCode} />
                            </div>
                          </div>
                          <div className="field split compact-field-split">
                            <div className="field compact-field">
                              <label>Store Manager</label>
                              <input className="input filled" onChange={(event) => handleStoreFieldChange('managerName', event.target.value)} type="text" value={storeForm.managerName} />
                            </div>
                            <div className="field compact-field">
                              <label>Status</label>
                              <select className="input filled" onChange={(event) => handleStoreFieldChange('status', event.target.value)} value={storeForm.status}>
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                              </select>
                            </div>
                          </div>
                        </section>

                        <section className="lens-editor-card">
                          <div className="lens-editor-card-head">
                            <div>
                              <p className="eyebrow">Contact</p>
                              <h5>Phone, email, and address information</h5>
                            </div>
                          </div>
                          <div className="field split compact-field-split">
                            <div className="field compact-field">
                              <label>Primary Contact Number</label>
                              <input className="input filled" onChange={(event) => handleStoreFieldChange('phone', event.target.value)} type="text" value={storeForm.phone} />
                            </div>
                            <div className="field compact-field">
                              <label>Store Email</label>
                              <input className="input filled" onChange={(event) => handleStoreFieldChange('email', event.target.value)} type="email" value={storeForm.email} />
                            </div>
                          </div>
                          <div className="field compact-field">
                            <label>Street Address</label>
                            <textarea
                              className="input filled compact-textarea"
                              onChange={(event) => handleStoreFieldChange('street', event.target.value)}
                              value={storeForm.street}
                            />
                          </div>
                          <div className="field split compact-field-split compact-meta-grid">
                            <div className="field compact-field">
                              <label>City</label>
                              <input className="input filled" onChange={(event) => handleStoreFieldChange('city', event.target.value)} type="text" value={storeForm.city} />
                            </div>
                            <div className="field compact-field">
                              <label>State</label>
                              <input className="input filled" onChange={(event) => handleStoreFieldChange('state', event.target.value)} type="text" value={storeForm.state} />
                            </div>
                            <div className="field compact-field">
                              <label>Pincode</label>
                              <input className="input filled" onChange={(event) => handleStoreFieldChange('pincode', event.target.value)} type="text" value={storeForm.pincode} />
                            </div>
                          </div>
                        </section>
                      </div>
                    </>
                  ) : (
                    <div className="task-item">
                      <strong>No store selected</strong>
                      <small>Choose a store from the list before opening the update page.</small>
                    </div>
                  )}
                </section>
              </div>
            </Screen>

            <Screen active={activeScreen === 'reports'} id="reports">
              <div className="section-grid">
                <section className="panel">
                  <div className="panel-head">
                    <div>
                      <p className="eyebrow">Reports center</p>
                      <h4>Sales, performance, finance, and tax reports</h4>
                    </div>
                  </div>
                  <div className="report-grid">
                    <div className="report-card">
                      <strong>Sales Reports</strong>
                      <small>Today, weekly, monthly, custom range</small>
                    </div>
                    <div className="report-card">
                      <strong>Performance Reports</strong>
                      <small>Store-wise, salesman-wise, product-wise</small>
                    </div>
                    <div className="report-card">
                      <strong>Financial Reports</strong>
                      <small>GST, payment modes, discounts, margin</small>
                    </div>
                    <div className="report-card">
                      <strong>Operational Reports</strong>
                      <small>Repairs, pending delivery, returns analytics</small>
                    </div>
                  </div>
                </section>
              </div>
            </Screen>
          </div>
        </div>
      </main>
    </div>
  )
}

export default AdminPanel
