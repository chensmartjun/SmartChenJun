<template>
  <div class="module-container">
    <div class="filter-bar">
      <el-form :inline="true" :model="queryForm" size="small">
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="queryForm.date_range"
            type="monthrange"
            range-separator="至"
            start-placeholder="开始月份"
            end-placeholder="结束月份"
            @change="fetchProfits"
            style="width: 220px;"
          ></el-date-picker>
        </el-form-item>
      </el-form>
    </div>
    <el-table :data="profits" border stripe size="small" v-loading="loading" style="margin-top: 10px;" class="custom-table">
      <el-table-column prop="month" label="月份" width="150"></el-table-column>
      <el-table-column prop="sales" label="销售收入" width="150"></el-table-column>
      <el-table-column prop="cost" label="成本" width="150"></el-table-column>
      <el-table-column prop="profit" label="利润" width="150"></el-table-column>
    </el-table>
    <el-pagination
      @current-change="fetchProfits"
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
  name: 'ProfitStatementList',
  data() {
    return {
      profits: [],
      queryForm: {
        date_range: null,
      },
      page: 1,
      size: 10,
      total: 0,
      loading: false,
    };
  },
  mounted() {
    this.fetchProfits();
  },
  methods: {
    async fetchProfits() {
      this.loading = true;
      try {
        const outboundRes = await this.$axios.get('/outboundOrders');
        const inboundRes = await this.$axios.get('/inboundOrders');
        const outboundOrders = outboundRes.data || [];
        const inboundOrders = inboundRes.data || [];

        // 计算月度利润
        const profitMap = new Map();
        outboundOrders.forEach(order => {
          const month = new Date(order.date).toISOString().slice(0, 7); // YYYY-MM
          const current = profitMap.get(month) || { sales: 0, cost: 0 };
          current.sales += order.items.reduce((sum, item) => sum + parseFloat(this.calculateItemTotal(item)), 0);
          profitMap.set(month, current);
        });
        inboundOrders.forEach(order => {
          const month = new Date(order.date).toISOString().slice(0, 7);
          const current = profitMap.get(month) || { sales: 0, cost: 0 };
          current.cost += order.items.reduce((sum, item) => sum + parseFloat(this.calculateInboundCost(item)), 0);
          profitMap.set(month, current);
        });

        // 转换为数组
        let profits = Array.from(profitMap.entries()).map(([month, data]) => ({
          month,
          sales: data.sales.toFixed(2),
          cost: data.cost.toFixed(2),
          profit: (data.sales - data.cost).toFixed(2),
        }));

        // 应用过滤
        if (this.queryForm.date_range && this.queryForm.date_range.length === 2) {
          const [start, end] = this.queryForm.date_range;
          profits = profits.filter(p => p.month >= start.toISOString().slice(0, 7) && p.month <= end.toISOString().slice(0, 7));
        }

        // 分页
        this.total = profits.length;
        const startIdx = (this.page - 1) * this.size;
        this.profits = profits.slice(startIdx, startIdx + this.size);
      } catch (err) {
        this.$message.error('加载利润表失败');
        console.error('Fetch profits error:', err);
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
    calculateInboundCost(item) {
      const weight = item.gold_weight || 0;
      return (weight * (item.labor_cost || 0) + (item.quantity || 0) * (item.extra_fee || 0)).toFixed(2);
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