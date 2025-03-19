<template>
  <div id="app">
    <el-header class="header">
      <div class="logo">ERP 系统</div>
      <el-menu mode="horizontal" :default-active="activeMenu" @select="handleMenuSelect" background-color="#409EFF" text-color="#fff" active-text-color="#ffd04b">
        <el-menu-item index="home">主页</el-menu-item>
        <el-menu-item index="inventory">库存管理</el-menu-item>
        <el-menu-item index="finance">财务管理</el-menu-item>
        <el-menu-item index="report">报表与打印</el-menu-item>
        <el-menu-item index="system">系统设置</el-menu-item>
      </el-menu>
      <div class="user-info">
        <span>{{ username }}</span>
        <el-button type="text" @click="logout" style="color: #fff;">退出</el-button>
      </div>
    </el-header>
    <el-container>
      <el-aside width="200px">
        <SideBar :menu="subMenu" @select="handleSubMenuSelect" />
      </el-aside>
      <el-main>
        <el-tabs v-model="activeTab" type="card" closable @tab-remove="removeTab" @tab-click="handleTabClick">
          <el-tab-pane v-for="tab in tabs" :key="tab.name" :label="tab.label" :name="tab.name">
            <router-view v-slot="{ Component }">
              <keep-alive :include="cachedTabs">
                <component :is="Component" v-if="activeTab === tab.name" :key="tab.name" />
              </keep-alive>
            </router-view>
          </el-tab-pane>
        </el-tabs>
      </el-main>
    </el-container>
  </div>
</template>

<script>
import SideBar from './components/Sidebar.vue';

export default {
  name: 'AppMain',
  components: { SideBar },
  data() {
    return {
      activeMenu: 'home',
      activeTab: 'home',
      tabs: [{ name: 'home', label: '主页', path: '/' }],
      subMenu: [],
      username: 'Admin',
    };
  },
  computed: {
    cachedTabs() {
      return this.tabs.map(tab => tab.name);
    },
  },
  methods: {
    handleMenuSelect(key) {
      this.activeMenu = key;
      this.updateSubMenu(key);
    },
    handleSubMenuSelect(path, label) {
      if (!this.tabs.some(t => t.name === path)) {
        this.tabs.push({ name: path, label, path });
      }
      this.activeTab = path;
      this.$router.push(path).catch(() => {});
    },
    removeTab(targetName) {
      const index = this.tabs.findIndex(tab => tab.name === targetName);
      this.tabs.splice(index, 1);
      if (this.activeTab === targetName) {
        const nextTab = this.tabs[index] || this.tabs[index - 1] || { name: 'home', path: '/' };
        this.activeTab = nextTab.name;
        this.$router.push(nextTab.path).catch(() => {});
      }
    },
    handleTabClick(tab) {
      const selectedTab = this.tabs.find(t => t.name === tab.name);
      if (selectedTab) {
        this.activeTab = selectedTab.name;
        this.$router.push(selectedTab.path).catch(() => {});
      }
    },
    updateSubMenu(key) {
      const menuMap = {
        home: [],
        inventory: [
          { path: '/inbound', label: '入库管理', icon: 'el-icon-download' },
          { path: '/outbound', label: '出库管理', icon: 'el-icon-upload' },
          { path: '/returns', label: '退货管理', icon: 'el-icon-refresh-left' },
          { path: '/inventory', label: '库存查询', icon: 'el-icon-search' },
          { path: '/materialInventory', label: '物料库存', icon: 'el-icon-box' },
        ],
        finance: [
          { path: '/paymentRecords', label: '收支管理', icon: 'el-icon-money' },
          { path: '/customerOwed', label: '客户对账单', icon: 'el-icon-wallet' },
          { path: '/supplierStatement', label: '供应商对账单', icon: 'el-icon-document' },
        ],
        report: [
          { path: '/customerReport', label: '客户报表', icon: 'el-icon-pie-chart' },
          { path: '/printVoucher', label: '销售结算单打印', icon: 'el-icon-printer' },
          { path: '/printBarcodes', label: '条码批量打印', icon: 'el-icon-barcode' },
          { path: '/printPaymentVoucher', label: '收支凭证打印', icon: 'el-icon-ticket' },
        ],
        system: [
          { path: '/suppliers', label: '供应商管理', icon: 'el-icon-user' },
          { path: '/customers', label: '客户管理', icon: 'el-icon-user-solid' },
          { path: '/counters', label: '柜台管理', icon: 'el-icon-shop' },
          { path: '/staff', label: '员工管理', icon: 'el-icon-s-custom' },
          { path: '/users', label: '用户管理', icon: 'el-icon-lock' },
          { path: '/categories', label: '分类管理', icon: 'el-icon-menu' },
          { path: '/salesTemplates', label: '销售模板管理', icon: 'el-icon-tickets' },
          { path: '/labelTemplates', label: '标签模板管理', icon: 'el-icon-printer' },
        ],
      };
      this.subMenu = menuMap[key] || [];
      if (this.subMenu.length > 0 && !this.tabs.some(t => t.name === this.subMenu[0].path)) {
        this.handleSubMenuSelect(this.subMenu[0].path, this.subMenu[0].label);
      }
    },
    logout() {
      this.$message.success('已退出');
      this.$router.push('/login');
    },
  },
  mounted() {
    this.updateSubMenu(this.activeMenu);
  },
};
</script>

<style scoped>
#app { height: 100vh; display: flex; flex-direction: column; }
.header { background-color: #409EFF; color: #fff; display: flex; align-items: center; justify-content: space-between; height: 60px; padding: 0 20px; }
.logo { font-size: 20px; font-weight: bold; }
.user-info { display: flex; align-items: center; gap: 10px; }
.el-container { flex: 1; overflow: hidden; }
.el-aside { background-color: #F2F6FC; }
.el-main { padding: 0; background: #f0f2f5; }
.el-tabs { margin: 10px; }
</style>