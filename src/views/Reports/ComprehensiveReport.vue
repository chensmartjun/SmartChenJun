<!-- src/views/Reports/ComprehensiveReport.vue -->
<template>
  <div class="module-container">
    <h2>综合报表</h2>
    <div class="operation-bar">
      <el-button type="primary" icon="el-icon-download" @click="exportData">导出</el-button>
    </div>
    <el-tabs v-model="activeTab">
      <el-tab-pane label="利润表" name="profit">
        <el-table :data="profitData" border v-loading="loading">
          <el-table-column prop="total_sales" label="总销售额"></el-table-column>
          <el-table-column prop="total_cost" label="总成本"></el-table-column>
          <el-table-column prop="profit" label="利润"></el-table-column>
        </el-table>
      </el-tab-pane>
      <el-tab-pane label="客户对账单" name="customer">
        <el-table :data="customerReport" border v-loading="loading">
          <el-table-column prop="customer_id" label="客户" :formatter="formatCustomer"></el-table-column>
          <el-table-column prop="total_sales" label="总销售额"></el-table-column>
          <el-table-column prop="total_owed" label="总欠款"></el-table-column>
        </el-table>
      </el-tab-pane>
      <el-tab-pane label="供应商对账单" name="supplier">
        <el-table :data="supplierStatement" border v-loading="loading">
          <el-table-column prop="supplier_id" label="供应商" :formatter="formatSupplier"></el-table-column>
          <el-table-column prop="total_weight" label="总重量"></el-table-column>
          <el-table-column prop="total_cost" label="总成本"></el-table-column>
        </el-table>
      </el-tab-pane>
      <el-tab-pane label="板料报表" name="material">
        <el-table :data="materialInventory" border v-loading="loading">
          <el-table-column prop="material_code" label="物料代码"></el-table-column>
          <el-table-column prop="name" label="名称"></el-table-column>
          <el-table-column prop="quantity" label="数量"></el-table-column>
          <el-table-column prop="avg_cost" label="平均成本"></el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
export default {
  name: 'ComprehensiveReport',
  data() {
    return {
      activeTab: 'profit',
      profitData: [],
      customerReport: [],
      supplierStatement: [],
      customerOwed: [],
      materialInventory: [],
      customers: [],
      suppliers: [],
      loading: false,
    };
  },
  mounted() {
    this.fetchData();
  },
  methods: {
    async fetchData() {
      this.loading = true;
      try {
        const [profitRes, customerRes, supplierRes, materialRes, customerListRes, supplierListRes] = await Promise.all([
          this.$axios.get('/profitReport'),
          this.$axios.get('/customerReport'),
          this.$axios.get('/supplierStatement'),
          this.$axios.get('/materialInventory'),
          this.$axios.get('/customers'),
          this.$axios.get('/suppliers'),
        ]);
        this.profitData = profitRes.data || [];
        this.customerReport = customerRes.data || [];
        this.supplierStatement = supplierRes.data || [];
        this.materialInventory = materialRes.data || [];
        this.customers = customerListRes.data || [];
        this.suppliers = supplierListRes.data || [];
      } catch (err) {
        this.$message.error('加载失败');
      } finally {
        this.loading = false;
      }
    },
    exportData() {
      const dataMap = {
        profit: this.profitData.map(item => ({
          总销售额: item.total_sales,
          总成本: item.total_cost,
          利润: item.profit,
        })),
        customer: this.customerReport.map(item => ({
          客户: this.formatCustomer(item),
          总销售额: item.total_sales,
          总欠款: item.total_owed,
        })),
        supplier: this.supplierStatement.map(item => ({
          供应商: this.formatSupplier(item),
          总重量: item.total_weight,
          总成本: item.total_cost,
        })),
        material: this.materialInventory.map(item => ({
          物料代码: item.material_code,
          名称: item.name,
          数量: item.quantity,
          平均成本: item.avg_cost,
        })),
      };
      const ws = this.$XLSX.utils.json_to_sheet(dataMap[this.activeTab]);
      const wb = this.$XLSX.utils.book_new();
      this.$XLSX.utils.book_append_sheet(wb, ws, this.activeTab);
      this.$XLSX.writeFile(wb, `${this.activeTab}_report.xlsx`);
    },
    formatCustomer(row) {
      const customer = this.customers.find(c => c.id === row.customer_id);
      return customer ? customer.short_name : '';
    },
    formatSupplier(row) {
      const supplier = this.suppliers.find(s => s.id === row.supplier_id);
      return supplier ? supplier.short_name : '';
    },
  },
};
</script>

<style scoped>
.module-container { padding: 20px; }
.operation-bar { margin-bottom: 20px; display: flex; gap: 10px; }
</style>