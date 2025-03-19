<template>
  <div class="module-container">
    <div class="filter-bar">
      <el-form :inline="true" :model="queryForm" size="small">
        <el-form-item label="客户">
          <el-select v-model="queryForm.customer_id" placeholder="选择客户" clearable @change="fetchOwedList" style="width: 150px;">
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
            @change="fetchOwedList"
            style="width: 220px;"
          ></el-date-picker>
        </el-form-item>
      </el-form>
    </div>
    <el-table :data="owedList" border stripe size="small" v-loading="loading" style="margin-top: 10px;" class="custom-table">
      <el-table-column prop="customer_name" label="客户" width="150"></el-table-column>
      <el-table-column prop="order_number" label="出库单号" width="120"></el-table-column>
      <el-table-column prop="date" label="日期" :formatter="dateTimeFormatter" width="180"></el-table-column>
      <el-table-column prop="debt_material" label="存欠板料" width="100"></el-table-column>
      <el-table-column prop="debt_labor" label="存欠工费" width="100"></el-table-column>
      <el-table-column prop="total_amount" label="总金额" width="100"></el-table-column>
    </el-table>
    <el-pagination
      @current-change="fetchOwedList"
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
  name: 'CustomerOwedList',
  data() {
    return {
      owedList: [],
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
  mounted() {
    this.fetchCustomers();
    this.fetchOwedList();
  },
  methods: {
    async fetchCustomers() {
      try {
        const res = await this.$axios.get('/customers');
        this.customers = res.data || [];
      } catch (err) {
        this.$message.error('加载客户失败');
      }
    },
    async fetchOwedList() {
      this.loading = true;
      try {
        const res = await this.$axios.get('/outboundOrders');
        let orders = res.data || [];

        // 转换为对账单格式
        let owedList = orders.map(order => ({
          customer_name: this.customers.find(c => c.id === order.customer_id)?.name || '未知',
          order_number: order.order_number,
          date: order.date,
          debt_material: order.debt_material || 0,
          debt_labor: order.debt_labor || 0,
          total_amount: order.items.reduce((sum, item) => sum + parseFloat(this.calculateItemTotal(item)), 0).toFixed(2),
        }));

        // 应用过滤
        if (this.queryForm.customer_id) {
          owedList = owedList.filter(o => o.customer_id === this.queryForm.customer_id);
        }
        if (this.queryForm.date_range && this.queryForm.date_range.length === 2) {
          const [start, end] = this.queryForm.date_range;
          owedList = owedList.filter(o => new Date(o.date) >= start && new Date(o.date) <= end);
        }

        // 分页
        this.total = owedList.length;
        const startIdx = (this.page - 1) * this.size;
        this.owedList = owedList.slice(startIdx, startIdx + this.size);
      } catch (err) {
        this.$message.error('加载对账单失败');
        console.error('Fetch owed list error:', err);
      } finally {
        this.loading = false;
      }
    },
    calculateItemTotal(item) {
      const weight = item.pure_weight === 0 || item.pure_weight === undefined ? (item.gold_weight || 0) : item.pure_weight;
      const cost = (weight * (item.labor_cost || 0)) +
                   ((item.quantity || 0) * (item.extra_fee || 0)) +
                   ((item.inlay_count || 0) * (item.inlay_labor_cost || 0)) +
                   ((item.stone_weight || 0) * (item.stone_price || 0));
      return this.orderForm.settle_type === 'price'
        ? (cost + (weight * (this.orderForm.gold_price || 0))).toFixed(2)
        : cost.toFixed(2);
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
.custom-table {
  margin-bottom: 20px;
}
</style>