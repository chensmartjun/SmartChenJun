import { createRouter, createWebHistory } from 'vue-router';
import HomePage from '../views/HomePage.vue';

const routes = [
  { path: '/', name: 'home', component: HomePage },
  { path: '/inbound', name: 'inbound', component: () => import('../views/InventoryManagement/InboundOrderList.vue') },
  { path: '/outbound', name: 'outbound', component: () => import('../views/InventoryManagement/OutboundOrderList.vue') },
  { path: '/returns', name: 'returns', component: () => import('../views/InventoryManagement/ReturnOrderList.vue') },
  { path: '/paymentRecords', name: 'paymentRecords', component: () => import('../views/FinancialManagement/PaymentRecordList.vue') },
  { path: '/inventory', name: 'inventory', component: () => import('../views/InventoryManagement/InventoryList.vue') },
  { path: '/inventoryCheck', name: 'inventoryCheck', component: () => import('../views/InventoryManagement/InventoryCheck.vue') },
  { path: '/comprehensiveReport', name: 'comprehensiveReport', component: () => import('../views/Reports/ComprehensiveReport.vue') },
  { path: '/suppliers', name: 'suppliers', component: () => import('../views/SystemSettings/SupplierList.vue') },
  { path: '/customers', name: 'customers', component: () => import('../views/SystemSettings/CustomerList.vue') },
  { path: '/counters', name: 'counters', component: () => import('../views/SystemSettings/CounterList.vue') },
  { path: '/staff', name: 'staff', component: () => import('../views/SystemSettings/StaffList.vue') },
  { path: '/users', name: 'users', component: () => import('../views/SystemSettings/UserList.vue') },
  { path: '/categories', name: 'categories', component: () => import('../views/SystemSettings/CategoryList.vue') },
  { path: '/salesTemplates', name: 'salesTemplates', component: () => import('../views/SystemSettings/SalesTemplateList.vue') },
  { path: '/labelTemplates', name: 'labelTemplates', component: () => import('../views/SystemSettings/LabelTemplateList.vue') },
  { path: '/login', name: 'login', component: () => import('../views/Login.vue') },
  { path: '/paymentRecords', name: 'paymentRecords', component: () => import('../views/FinancialManagement/PaymentRecordList.vue') },
  {
    path: '/material-inventory',
    name: 'MaterialInventoryList',
    component: () => import('../views/InventoryManagement/MaterialInventoryList.vue'),
  },
  {
    path: '/supplier-statements',
    name: 'SupplierStatementList',
    component: () => import('../views/FinancialManagement/SupplierStatementList.vue'),
  },
  {
    path: '/customer-owed',
    name: 'CustomerOwedList',
    component: () => import('../views/FinancialManagement/CustomerOwedList.vue'),
  },
  {
    path: '/profit-statements',
    name: 'ProfitStatementList',
    component: () => import('../views/FinancialManagement/ProfitStatementList.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;