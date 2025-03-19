<template>
  <div class="module-container">
    <div class="filter-bar">
      <el-form :inline="true" :model="filterForm" size="small">
        <el-form-item label="产品编码">
          <el-input v-model="filterForm.parent_code" placeholder="请输入产品编码" clearable @input="fetchStock"></el-input>
        </el-form-item>
        <el-form-item label="产品名称">
          <el-input v-model="filterForm.item_code" placeholder="请输入产品名称" clearable @input="fetchStock"></el-input>
        </el-form-item>
        <el-form-item label="柜台">
          <el-select v-model="filterForm.counter_id" placeholder="选择柜台" clearable @change="fetchStock" style="width: 150px;">
            <el-option v-for="counter in counters" :key="counter.id" :label="counter.name" :value="counter.id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="filterForm.date_range"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            @change="fetchStock"
            style="width: 220px;"
          ></el-date-picker>
        </el-form-item>
      </el-form>
    </div>
    <el-table :data="stockList" border stripe size="small" v-loading="loading" style="margin-top: 10px;" class="custom-table">
      <el-table-column prop="barcode" label="条形码" width="120">
        <template v-slot="{ row }">
          <div class="barcode-container">
            <el-input v-model="row.barcode" disabled size="small" style="width: 100%;">
              <template #append>
                <el-button size="small" icon="el-icon-copy-document" @click="copyBarcode(row.barcode)" style="padding: 5px;"></el-button>
              </template>
            </el-input>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="parent_code" label="产品编码" width="100">
        <template v-slot="{ row }">
          {{ formatParentCode(row.parent_code) }}
        </template>
      </el-table-column>
      <el-table-column prop="item_code" label="产品名称" width="150">
        <template v-slot="{ row }">
          {{ formatItemName(row.item_code) }}
        </template>
      </el-table-column>
      <el-table-column prop="quantity" label="库存数量" width="100"></el-table-column>
      <el-table-column prop="counter_id" label="柜台" width="100">
        <template v-slot="{ row }">
          {{ formatCounter(row.counter_id) }}
        </template>
      </el-table-column>
      <el-table-column prop="gold_weight" label="金重" width="80"></el-table-column>
      <el-table-column prop="pure_weight" label="净金重" width="80"></el-table-column>
      <el-table-column prop="labor_cost" label="工费" width="80"></el-table-column>
      <el-table-column prop="extra_fee" label="附加费" width="80"></el-table-column>
      <el-table-column prop="inlay_count" label="镶嵌位" width="80"></el-table-column>
      <el-table-column prop="inlay_labor_cost" label="镶嵌工费" width="80"></el-table-column>
      <el-table-column prop="stone_weight" label="石重(ct)" width="80"></el-table-column>
      <el-table-column prop="stone_price" label="石价" width="80"></el-table-column>
    </el-table>
    <el-pagination
      @current-change="fetchStock"
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
  name: 'InventoryList',
  data() {
    return {
      stockList: [],
      counters: [],
      categories: [],
      parentCategories: [],
      filterForm: {
        parent_code: '',
        item_code: '',
        counter_id: null,
        date_range: null, // [startDate, endDate]
      },
      page: 1,
      size: 10,
      total: 0,
      loading: false,
    };
  },
  mounted() {
    this.fetchCounters();
    this.fetchCategories();
    this.fetchStock();
  },
  methods: {
    async fetchStock() {
      this.loading = true;
      try {
        const params = {
          _page: this.page,
          _limit: this.size,
          parent_code_like: this.filterForm.parent_code || undefined,
          item_code_like: this.filterForm.item_code || undefined,
          counter_id: this.filterForm.counter_id || undefined,
        };
        // 添加日期范围筛选
        if (this.filterForm.date_range && this.filterForm.date_range.length === 2) {
          const [start, end] = this.filterForm.date_range;
          params.date_gte = start.toISOString().split('T')[0];
          params.date_lte = end.toISOString().split('T')[0];
        }
        const res = await this.$axios.get('/inboundOrders', { params });
        const stockMap = new Map();
        (res.data || []).forEach(order => {
          if (order.items && Array.isArray(order.items)) {
            order.items.forEach(item => {
              const key = `${item.barcode}-${order.counter_id}`;
              if (stockMap.has(key)) {
                const existing = stockMap.get(key);
                existing.quantity += item.quantity || 1;
              } else {
                stockMap.set(key, {
                  barcode: item.barcode,
                  parent_code: item.parent_code,
                  item_code: item.item_code,
                  quantity: item.quantity || 1,
                  counter_id: order.counter_id,
                  gold_weight: item.gold_weight || 0,
                  pure_weight: item.pure_weight || 0,
                  labor_cost: item.labor_cost || 0,
                  extra_fee: item.extra_fee || 0,
                  inlay_count: item.inlay_count || 0,
                  inlay_labor_cost: item.inlay_labor_cost || 0,
                  stone_weight: item.stone_weight || 0,
                  stone_price: item.stone_price || 0,
                });
              }
            });
          }
        });
        this.stockList = Array.from(stockMap.values());
        this.total = this.stockList.length; // 模拟总数，实际应从后端返回
      } catch (err) {
        this.$message.error('加载库存失败');
        console.error('Fetch stock error:', err);
      } finally {
        this.loading = false;
      }
    },
    async fetchCounters() {
      try {
        const res = await this.$axios.get('/counters');
        this.counters = res.data || [];
      } catch (err) {
        this.$message.error('加载柜台失败');
      }
    },
    async fetchCategories() {
      try {
        const res = await this.$axios.get('/categories');
        this.categories = res.data || [];
        this.parentCategories = this.categories.filter(cat => !cat.parent_id);
      } catch (err) {
        this.$message.error('加载分类失败');
      }
    },
    formatParentCode(parentCode) {
      const category = this.parentCategories.find(c => c.code === parentCode);
      return category ? `${category.code} ${category.name}` : parentCode;
    },
    formatItemName(itemCode) {
      const subCategory = this.categories.find(c => c.code === itemCode);
      return subCategory ? `${subCategory.code} ${subCategory.name}` : itemCode;
    },
    formatCounter(counterId) {
      const counter = this.counters.find(c => c.id === counterId);
      return counter ? counter.name : counterId;
    },
    copyBarcode(barcode) {
      navigator.clipboard.writeText(barcode).then(() => {
        this.$message.success('条形码已复制到剪贴板');
      }).catch(err => {
        this.$message.error('复制失败');
        console.error('Failed to copy barcode:', err);
      });
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
.custom-table .el-table__body-wrapper {
  padding-bottom: 10px;
}
.barcode-container {
  display: flex;
  align-items: center;
}
</style>