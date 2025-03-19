<template>
  <div class="module-container">
    <div class="operation-bar">
      <el-button type="primary" icon="el-icon-printer" @click="printVouchers">打印</el-button>
      <el-button type="primary" icon="el-icon-download" @click="exportData">导出</el-button>
    </div>
    <el-table :data="paymentRecords" border v-loading="loading">
      <el-table-column prop="record_number" label="记录编号"></el-table-column>
      <el-table-column prop="supplier_id" label="供应商" :formatter="formatSupplier"></el-table-column>
      <el-table-column prop="date" label="日期" :formatter="dateFormatter"></el-table-column>
      <el-table-column prop="amount" label="金额"></el-table-column>
      <el-table-column prop="payment_method" label="支付方式"></el-table-column>
    </el-table>
    <el-pagination
      @current-change="fetchPaymentRecords"
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
  name: 'PrintPaymentVoucherList',
  data() {
    return {
      paymentRecords: [],
      suppliers: [],
      page: 1,
      size: 10,
      total: 0,
      loading: false,
    };
  },
  mounted() {
    this.fetchPaymentRecords();
    this.fetchSuppliers();
  },
  methods: {
    async fetchPaymentRecords() {
      this.loading = true;
      try {
        const res = await this.$axios.get(`/paymentRecords?_page=${this.page}&_limit=${this.size}`);
        this.paymentRecords = res.data || [];
        this.total = parseInt(res.headers['x-total-count']) || res.data.length;
      } catch (err) {
        this.$message.error('加载失败');
      } finally {
        this.loading = false;
      }
    },
    async fetchSuppliers() {
      try {
        const res = await this.$axios.get('/suppliers');
        this.suppliers = res.data || [];
      } catch (err) {
        this.$message.error('加载供应商失败');
      }
    },
    printVouchers() {
      window.print();
    },
    exportData() {
      const data = this.paymentRecords.map(item => ({
        记录编号: item.record_number,
        供应商: this.formatSupplier(item),
        日期: this.dateFormatter(item),
        金额: item.amount,
        支付方式: item.payment_method,
      }));
      const ws = this.$XLSX.utils.json_to_sheet(data);
      const wb = this.$XLSX.utils.book_new();
      this.$XLSX.utils.book_append_sheet(wb, ws, 'PaymentVouchers');
      this.$XLSX.writeFile(wb, 'payment_vouchers.xlsx');
    },
    formatSupplier(row) {
      const supplier = this.suppliers.find(s => s.id === row.supplier_id);
      return supplier ? supplier.short_name : '';
    },
    dateFormatter(row) {
      return new Date(row.date).toLocaleDateString();
    },
  },
};
</script>

<style scoped>
.module-container { padding: 20px; }
.operation-bar { margin-bottom: 20px; display: flex; gap: 10px; }
</style>