<template>
  <div class="module-container">
    <div class="operation-bar">
      <el-button type="primary" icon="el-icon-download" @click="exportData">导出</el-button>
    </div>
    <el-table :data="customerReport" border v-loading="loading">
      <el-table-column prop="customer_id" label="客户" :formatter="formatCustomer"></el-table-column>
      <el-table-column prop="total_sales" label="总销售额"></el-table-column>
      <el-table-column prop="total_owed" label="总欠款"></el-table-column>
    </el-table>
    <el-pagination
      @current-change="fetchCustomerReport"
      v-model:current-page="page"
      :page-size="size"
      :total="total"
      layout="prev, pager, next, total"
      style="margin-top: 10px;"
    ></el-pagination>
  </div>
</template>

<script>
export default {
  name: 'CustomerReportList',
  data() {
    return {
      customerReport: [],
      customers: [],
      page: 1,
      size: 10,
      total: 0,
      loading: false,
    };
  },
  mounted() {
    this.fetchCustomerReport();
    this.fetchCustomers();
  },
  methods: {
    async fetchCustomerReport() {
      this.loading = true;
      try {
        const res = await this.$axios.get(`/customerReport?_page=${this.page}&_limit=${this.size}`);
        this.customerReport = res.data || [];
        this.total = parseInt(res.headers['x-total-count']) || res.data.length;
      } catch (err) {
        this.$message.error('加载失败');
      } finally {
        this.loading = false;
      }
    },
    async fetchCustomers() {
      try {
        const res = await this.$axios.get('/customers');
        this.customers = res.data || [];
      } catch (err) {
        this.$message.error('加载客户失败');
      }
    },
    exportData() {
      const data = this.customerReport.map(item => ({
        客户: this.formatCustomer(item),
        总销售额: item.total_sales,
        总欠款: item.total_owed,
      }));
      const ws = this.$XLSX.utils.json_to_sheet(data);
      const wb = this.$XLSX.utils.book_new();
      this.$XLSX.utils.book_append_sheet(wb, ws, 'CustomerReport');
      this.$XLSX.writeFile(wb, 'customer_report.xlsx');
    },
    formatCustomer(row) {
      const customer = this.customers.find(c => c.id === row.customer_id);
      return customer ? customer.short_name : '';
    },
  },
};
</script>

<style scoped>
.module-container { padding: 20px; }
.operation-bar { margin-bottom: 20px; display: flex; gap: 10px; }
</style>