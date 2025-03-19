<template>
  <div class="module-container">
    <div class="filter-bar">
      <el-form :inline="true" :model="queryForm" size="small">
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="queryForm.date_range"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            @change="fetchProfitStatement"
            style="width: 220px;"
          ></el-date-picker>
        </el-form-item>
      </el-form>
    </div>
    <el-table :data="profitStatement" border stripe size="small" v-loading="loading" style="margin-top: 10px;" class="custom-table">
      <el-table-column prop="date" label="日期" :formatter="dateTimeFormatter" width="180"></el-table-column>
      <el-table-column prop="revenue" label="收入(¥)" width="120"></el-table-column>
      <el-table-column prop="cost" label="成本(¥)" width="120"></el-table-column>
      <el-table-column prop="profit" label="利润(¥)" width="120"></el-table-column>
    </el-table>
    <el-pagination
      @current-change="fetchProfitStatement"
      v-model:current-page="page"
      :page-size="size"
      :total="total"
      layout="prev, pager, next, total"
      style="margin-top: 10px;"
    ></el-pagination>
    <div class="summary" style="margin-top: 10px;">
      <el-row :gutter="10">
        <el-col :span="6">总收入: {{ totalRevenue }} ¥</el-col>
        <el-col :span="6">总成本: {{ totalCost }} ¥</el-col>
        <el-col :span="6">总利润: {{ totalProfit }} ¥</el-col>
      </el-row>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProfitStatementList',
  data() {
    return {
      profitStatement: [],
      queryForm: {
        date_range: null,
      },
      page: 1,
      size: 10,
      total: 0,
      loading: false,
    };
  },
  computed: {
    totalRevenue() {
      return this.profitStatement.reduce((sum, item) => sum + (parseFloat(item.revenue) || 0), 0).toFixed(2);
    },
    totalCost() {
      return this.profitStatement.reduce((sum, item) => sum + (parseFloat(item.cost) || 0), 0).toFixed(2);
    },
    totalProfit() {
      return (this.totalRevenue - this.totalCost).toFixed(2);
    },
  },
  mounted() {
    this.fetchProfitStatement();
  },
  methods: {
    async fetchProfitStatement() {
      this.loading = true;
      try {
        const params = {
          _page: this.page,
          _limit: this.size,
        };
        if (this.queryForm.date_range && this.queryForm.date_range.length === 2) {
          const [start, end] = this.queryForm.date_range;
          params.date_gte = start.toISOString().split('T')[0];
          params.date_lte = end.toISOString().split('T')[0];
        }
        const outboundRes = await this.$axios.get('/outboundOrders', { params });
        const inboundRes = await this.$axios.get('/inboundOrders', { params });
        const outboundData = (outboundRes.data || []).map(item => ({
          date: item.date,
          revenue: item.items && Array.isArray(item.items) ? item.items.reduce((sum, i) => sum + this.calculateItemTotal(i), 0) : 0,
          cost: 0,
        }));
        const inboundData = (inboundRes.data || []).map(item => ({
          date: item.date,
          revenue: 0,
          cost: item.items && Array.isArray(item.items) ? item.items.reduce((sum, i) => sum + (i.gold_weight * i.labor_cost || 0), 0) : 0,
        }));
        this.profitStatement = [...outboundData, ...inboundData].map(item => ({
          ...item,
          profit: (item.revenue - item.cost).toFixed(2),
        }));
        this.total = parseInt(outboundRes.headers['x-total-count']) || this.profitStatement.length;
      } catch (err) {
        this.$message.error('加载利润表失败');
        console.error('Fetch profit statement error:', err);
      } finally {
        this.loading = false;
      }
    },
    calculateItemTotal(item) {
      const weight = item.pure_weight || item.gold_weight || 0;
      const cost = (weight * (item.labor_cost || 0)) +
                   ((item.quantity || 0) * (item.extra_fee || 0)) +
                   ((item.inlay_count || 0) * (item.inlay_labor_cost || 0)) +
                   ((item.stone_weight || 0) * (item.stone_price || 0));
      return cost.toFixed(2);
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