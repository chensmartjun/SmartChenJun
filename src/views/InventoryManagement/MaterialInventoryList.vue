<template>
  <div class="module-container">
    <div class="operation-bar">
      <el-button type="primary" size="small" round @click="$router.push('/inbound')">新增入库</el-button>
      <el-button type="primary" size="small" round @click="$router.push('/outbound')">新增出库</el-button>
    </div>
    <div class="filter-bar">
      <el-form :inline="true" :model="queryForm" size="small">
        <el-form-item label="物料名称">
          <el-input v-model="queryForm.material_name" placeholder="请输入物料名称" clearable @input="fetchMaterials"></el-input>
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="queryForm.date_range"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            @change="fetchMaterials"
            style="width: 220px;"
          ></el-date-picker>
        </el-form-item>
      </el-form>
    </div>
    <el-table :data="materials" border stripe size="small" v-loading="loading" style="margin-top: 10px;" class="custom-table">
      <el-table-column prop="material_name" label="物料名称" width="150"></el-table-column>
      <el-table-column prop="total_quantity" label="总数量" width="100"></el-table-column>
      <el-table-column prop="total_gold_weight" label="总金重" width="100"></el-table-column>
      <el-table-column prop="last_updated" label="最后更新时间" :formatter="dateTimeFormatter" width="180"></el-table-column>
    </el-table>
    <el-pagination
      @current-change="fetchMaterials"
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
  name: 'MaterialInventoryList',
  data() {
    return {
      materials: [],
      queryForm: {
        material_name: '',
        date_range: null,
      },
      page: 1,
      size: 10,
      total: 0,
      loading: false,
    };
  },
  mounted() {
    this.fetchMaterials();
  },
  methods: {
    async fetchMaterials() {
      this.loading = true;
      try {
        // 获取入库和出库数据
        const inboundRes = await this.$axios.get('/inboundOrders');
        const outboundRes = await this.$axios.get('/outboundOrders');
        const inboundOrders = inboundRes.data || [];
        const outboundOrders = outboundRes.data || [];

        // 计算库存
        const materialMap = new Map();
        inboundOrders.forEach(order => {
          order.items.forEach(item => {
            const key = item.item_code || item.name;
            const current = materialMap.get(key) || { total_quantity: 0, total_gold_weight: 0, last_updated: order.date };
            current.total_quantity += item.quantity || 0;
            current.total_gold_weight += parseFloat(item.gold_weight || 0);
            current.material_name = item.name || key;
            current.last_updated = order.date > current.last_updated ? order.date : current.last_updated;
            materialMap.set(key, current);
          });
        });
        outboundOrders.forEach(order => {
          order.items.forEach(item => {
            const key = item.item_code || item.name;
            const current = materialMap.get(key) || { total_quantity: 0, total_gold_weight: 0, last_updated: order.date };
            current.total_quantity -= item.quantity || 0;
            current.total_gold_weight -= parseFloat(item.gold_weight || 0);
            current.material_name = item.name || key;
            current.last_updated = order.date > current.last_updated ? order.date : current.last_updated;
            materialMap.set(key, current);
          });
        });

        // 转换为数组并应用过滤
        let materials = Array.from(materialMap.values());
        if (this.queryForm.material_name) {
          materials = materials.filter(m => m.material_name.includes(this.queryForm.material_name));
        }
        if (this.queryForm.date_range && this.queryForm.date_range.length === 2) {
          const [start, end] = this.queryForm.date_range;
          materials = materials.filter(m => new Date(m.last_updated) >= start && new Date(m.last_updated) <= end);
        }

        // 分页
        this.total = materials.length;
        const startIdx = (this.page - 1) * this.size;
        this.materials = materials.slice(startIdx, startIdx + this.size);
      } catch (err) {
        this.$message.error('加载物料库存失败');
        console.error('Fetch materials error:', err);
      } finally {
        this.loading = false;
      }
    },
    dateTimeFormatter(row) {
      return new Date(row.last_updated).toLocaleString();
    },
  },
};
</script>

<style scoped>
.module-container {
  padding: 20px;
  background: #f5f7fa;
}
.operation-bar {
  margin-bottom: 15px;
  display: flex;
  gap: 10px;
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
.el-button--small {
  padding: 8px 15px;
}
</style>