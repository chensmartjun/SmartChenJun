<template>
  <div class="module-container">
    <div class="filter-bar">
      <el-form :inline="true" :model="queryForm" size="small">
        <el-form-item label="客户">
          <el-select v-model="queryForm.customer_id" placeholder="选择客户" clearable @change="fetchCustomerOwed" style="width: 150px;">
            <el-option v-for="customer in customers" :key="customer.id" :label="customer.name" :value="customer.id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="queryForm.date_range"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            @change="fetchCustomerOwed"
            style="width: 220px;"
          ></el-date-picker>
        </el-form-item>
      </el-form>
    </div>
    <el-table :data="customerOwed" border stripe size="small" v-loading="loading" style="margin-top: 10px;" class="custom-table">
      <el-table-column prop="order_number" label="单号" width="120"></el-table-column>
      <el-table-column prop="customer_id" label="客户" :formatter="formatCustomer" width="100"></el-table-column>
      <el-table-column prop="date" label="日期" :formatter="dateTimeFormatter" width="180"></el-table-column>
      <el-table-column prop="debt_material" label="欠板料(克)" width="120"></el-table-column>
      <el-table-column prop="debt_labor" label="欠工费(¥)" width="120"></el-table-column>
      <el-table-column prop="type" label="类型" width="80"></el-table-column>
    </el-table>
    <el-pagination
      @current-change="fetchCustomerOwed"
      v-model:current-page="page"
      :page-size="size"
      :total="total"
      layout="prev, pager, next, total"
      style="margin-top: 10px;"
    ></el-pagination>
    <div class="summary" style="margin-top: 10px;">
      <el-row :gutter="10">
        <el-col :span="6">总欠板料: {{ totalDebtMaterial }} 克</el-col>
        <el-col :span="6">总欠工费: {{ totalDebtLabor }} ¥</el-col>
      </el-row>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CustomerOwed',
  data() {
    return {
      customerOwed: [],
      customers: [],
      queryForm: {
        customer_id: null,
        date_range: null,
      },
      page: 1,
      size: 10,
      total: 0,
      loading: false,
    };
  },
  computed: {
    totalDebtMaterial() {
      return this.customerOwed.reduce((sum, item) => sum + parseFloat(item.debt_material || 0), 0).toFixed(2);
    },
    totalDebtLabor() {
      return this.customerOwed.reduce((sum, item) => sum + parseFloat(item.debt_labor || 0), 0).toFixed(2);
    },
  },
  mounted() {
    this.fetchCustomerOwed();
    this.fetchCustomers();
  },
  methods: {
    async fetchCustomerOwed() {
      this.loading = true;
      try {
        const params = {
          _page: this.page,
          _limit: this.size,
          customer_id: this.queryForm.customer_id || undefined,
        };
        if (this.queryForm.date_range && this.queryForm.date_range.length === 2) {
          const [start, end] = this.queryForm.date_range;
          params.date_gte = start.toISOString().split('T')[0];
          params.date_lte = end.toISOString().split('T')[0];
        }
        const outboundRes = await this.$axios.get('/outboundOrders', { params });
        this.customerOwed = (outboundRes.data || []).map(item => ({
          order_number: item.order_number,
          customer_id: item.customer_id,
          date: item.date,
          debt_material: item.debt_material || 0,
          debt_labor: item.debt_labor || 0,
          type: '出库',
        }));
        this.total = parseInt(outboundRes.headers['x-total-count']) || this.customerOwed.length;
      } catch (err) {
        this.$message.error('加载客户对账单失败');
        console.error('Fetch customer owed error:', err);
      } finally {
        this.loading = false;
      }
    },
    async fetchCustomers() {
      try {
        const res = await this.$axios.get('/customers');
        this.customers = (res.data || []).filter(customer => customer.id !== null);
      } catch (err) {
        this.$message.error('加载客户失败');
      }
    },
    formatCustomer(row) {
      const customer = this.customers.find(c => c.id === row.customer_id);
      return customer ? customer.name : '';
    },
    dateTimeFormatter(row) {
      return new Date(row.date).toLocaleString();
    },
  },
};
</script>

<style scoped>
.module-container {
  padding: 20px;
  background: #f5f7fa;
}
.filter-bar {
  margin-bottom: 15px;
  background: #fff;
  padding: 10px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
.el-table {
  font-size: 12px;
}
.custom-table {
  margin-bottom: 20px;
}
.summary {
  font-size: 14px;
  color: #606266;
}
</style>