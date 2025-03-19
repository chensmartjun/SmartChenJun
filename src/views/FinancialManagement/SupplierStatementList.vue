<template>
  <div class="module-container">
    <div class="filter-bar">
      <el-form :inline="true" :model="queryForm" size="small">
        <el-form-item label="供应商">
          <el-select v-model="queryForm.supplier_id" placeholder="选择供应商" clearable @change="fetchSupplierStatement" style="width: 150px;">
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
            @change="fetchSupplierStatement"
            style="width: 220px;"
          ></el-date-picker>
        </el-form-item>
      </el-form>
    </div>
    <el-table :data="supplierStatement" border stripe size="small" v-loading="loading" style="margin-top: 10px;" class="custom-table">
      <el-table-column prop="order_number" label="单号" width="120"></el-table-column>
      <el-table-column prop="supplier_id" label="供应商" :formatter="formatSupplier" width="100"></el-table-column>
      <el-table-column prop="date" label="日期" :formatter="dateTimeFormatter" width="180"></el-table-column>
      <el-table-column prop="amount" label="应付金额(¥)" width="120"></el-table-column>
    </el-table>
    <el-pagination
      @current-change="fetchSupplierStatement"
      v-model:current-page="page"
      :page-size="size"
      :total="total"
      layout="prev, pager, next, total"
      style="margin-top: 10px;"
    ></el-pagination>
    <div class="summary" style="margin-top: 10px;">
      <el-row :gutter="10">
        <el-col :span="6">总应付金额: {{ totalAmount }} ¥</el-col>
      </el-row>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SupplierStatementList',
  data() {
    return {
      supplierStatement: [],
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
  computed: {
    totalAmount() {
      return this.supplierStatement.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0).toFixed(2);
    },
  },
  mounted() {
    this.fetchSupplierStatement();
    this.fetchSuppliers();
  },
  methods: {
    async fetchSupplierStatement() {
      this.loading = true;
      try {
        const params = {
          _page: this.page,
          _limit: this.size,
          supplier_id: this.queryForm.supplier_id || undefined,
        };
        if (this.queryForm.date_range && this.queryForm.date_range.length === 2) {
          const [start, end] = this.queryForm.date_range;
          params.date_gte = start.toISOString().split('T')[0];
          params.date_lte = end.toISOString().split('T')[0];
        }
        const res = await this.$axios.get('/inboundOrders', { params });
        this.supplierStatement = (res.data || []).map(item => ({
          order_number: item.order_number,
          supplier_id: item.supplier_id,
          date: item.date,
          amount: item.items && Array.isArray(item.items) ? item.items.reduce((sum, i) => sum + (i.gold_weight * i.labor_cost || 0), 0) : 0,
        }));
        this.total = parseInt(res.headers['x-total-count']) || this.supplierStatement.length;
      } catch (err) {
        this.$message.error('加载供应商对账单失败');
        console.error('Fetch supplier statement error:', err);
      } finally {
        this.loading = false;
      }
    },
    async fetchSuppliers() {
      try {
        const res = await this.$axios.get('/suppliers');
        this.suppliers = (res.data || []).filter(supplier => supplier.id !== null);
      } catch (err) {
        this.$message.error('加载供应商失败');
      }
    },
    formatSupplier(row) {
      const supplier = this.suppliers.find(s => s.id === row.supplier_id);
      return supplier ? supplier.name : '';
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