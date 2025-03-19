<template>
  <div class="module-container">
    <div class="operation-bar">
      <el-button type="primary" icon="el-icon-printer" @click="printVoucher" :disabled="selectedRows.length !== 1">打印</el-button>
    </div>
    <el-table :data="outboundOrders" border @selection-change="handleSelectionChange" v-loading="loading">
      <el-table-column type="selection" width="55"></el-table-column>
      <el-table-column prop="order_number" label="出库单号"></el-table-column>
      <el-table-column prop="date" label="日期" :formatter="dateFormatter"></el-table-column>
      <el-table-column prop="customer_id" label="客户" :formatter="formatCustomer"></el-table-column>
      <el-table-column prop="total_weight" label="总重量"></el-table-column>
      <el-table-column prop="total_pure_weight" label="总净重"></el-table-column>
      <el-table-column prop="total_cost" label="总成本"></el-table-column>
    </el-table>
    <el-pagination
      @current-change="fetchOutboundOrders"
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
  name: 'PrintVoucherList',
  data() {
    return {
      outboundOrders: [],
      customers: [],
      selectedRows: [],
      page: 1,
      size: 10,
      total: 0,
      loading: false,
    };
  },
  mounted() {
    this.fetchOutboundOrders();
    this.fetchCustomers();
  },
  methods: {
    async fetchOutboundOrders() {
      this.loading = true;
      try {
        const res = await this.$axios.get(`/outboundOrders?page=${this.page}&size=${this.size}`);
        this.outboundOrders = res.data.data || [];
        this.total = res.data.total || 0;
      } catch (err) {
        this.$message.error('加载失败');
      } finally {
        this.loading = false;
      }
    },
    async fetchCustomers() {
      try {
        const res = await this.$axios.get('/customers');
        this.customers = res.data.data || [];
      } catch (err) {
        this.$message.error('加载客户失败');
      }
    },
    printVoucher() {
      if (this.selectedRows.length === 1) {
        window.print();
      }
    },
    handleSelectionChange(val) {
      this.selectedRows = val;
    },
    dateFormatter(row) {
      return new Date(row.date).toLocaleDateString();
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