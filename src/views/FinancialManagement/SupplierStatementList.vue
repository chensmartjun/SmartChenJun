<template>
  <div class="module-container">
    <div class="filter-bar">
      <el-form :inline="true" :model="queryForm" size="small">
        <el-form-item label="供应商">
          <el-select v-model="queryForm.supplier_id" placeholder="选择供应商" clearable @change="fetchStatements" style="width: 150px;">
            <el-option v-for="supplier in suppliers" :key="supplier.id" :label="supplier.name" :value="supplier.id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="queryForm.date_range"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            @change="fetchStatements"
            style="width: 220px;"
          ></el-date-picker>
        </el-form-item>
      </el-form>
    </div>
    <el-table :data="statements" border stripe size="small" v-loading="loading" style="margin-top: 10px;" class="custom-table">
      <el-table-column prop="supplier_name" label="供应商" width="150"></el-table-column>
      <el-table-column prop="order_number" label="入库单号" width="120"></el-table-column>
      <el-table-column prop="date" label="日期" :formatter="dateTimeFormatter" width="180"></el-table-column>
      <el-table-column prop="amount" label="金额" width="100"></el-table-column>
      <el-table-column prop="debt" label="欠款" width="100"></el-table-column>
    </el-table>
    <el-pagination
      @current-change="fetchStatements"
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
  name: 'SupplierStatementList',
  data() {
    return {
      statements: [],
      suppliers: [],
      queryForm: {
        supplier_id: null,
        date_range: null,
      },
      page: 1,
      size: 10,
      total: 0,
      loading: false,
    };
  },
  mounted() {
    this.fetchSuppliers();
    this.fetchStatements();
  },
  methods: {
    async fetchSuppliers() {
      try {
        const res = await this.$axios.get('/suppliers');
        this.suppliers = res.data.filter(supplier => supplier.id !== null) || [];
      } catch (err) {
        this.$message.error('加载供应商失败');
      }
    },
    async fetchStatements() {
      this.loading = true;
      try {
        const res = await this.$axios.get('/inboundOrders');
        let orders = res.data || [];

        // 转换为对账单格式
        let statements = orders.map(order => ({
          supplier_name: this.suppliers.find(s => s.id === order.supplier_id)?.name || '未知',
          order_number: order.order_number,
          date: order.date,
          amount: order.items.reduce((sum, item) => sum + parseFloat(this.calculateItemTotal(item)), 0).toFixed(2),
          debt: order.debt_material || 0, // 假设入库单有欠款字段
        }));

        // 应用过滤
        if (this.queryForm.supplier_id) {
          statements = statements.filter(s => s.supplier_id === this.queryForm.supplier_id);
        }
        if (this.queryForm.date_range && this.queryForm.date_range.length === 2) {
          const [start, end] = this.queryForm.date_range;
          statements = statements.filter(s => new Date(s.date) >= start && new Date(s.date) <= end);
        }

        // 分页
        this.total = statements.length;
        const startIdx = (this.page - 1) * this.size;
        this.statements = statements.slice(startIdx, startIdx + this.size);
      } catch (err) {
        this.$message.error('加载对账单失败');
        console.error('Fetch statements error:', err);
      } finally {
        this.loading = false;
      }
    },
    calculateItemTotal(item) {
      const weight = item.gold_weight || 0;
      return (weight * (item.labor_cost || 0) + (item.quantity || 0) * (item.extra_fee || 0)).toFixed(2);
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