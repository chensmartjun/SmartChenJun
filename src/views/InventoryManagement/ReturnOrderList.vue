<template>
  <div class="module-container">
    <el-tabs v-model="activeTab" @tab-click="handleTabChange">
      <el-tab-pane label="新增退货" name="add">
        <div class="operation-bar">
          <el-button type="primary" size="small" round @click="selectInboundOrder">选择入库单</el-button>
          <el-button type="success" size="small" round @click="saveReturn" :disabled="!returnForm.order_number">保存</el-button>
          <el-button size="small" round @click="resetForm" :disabled="!returnForm.order_number">取消</el-button>
        </div>
        <div class="form-section">
          <el-form :model="returnForm" :rules="rules" ref="returnForm" label-width="80px" size="small">
            <el-row :gutter="10">
              <el-col :span="6">
                <el-form-item label="退货单号" prop="order_number">
                  <el-input v-model="returnForm.order_number" disabled placeholder="保存后生成"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="入库单号" prop="inbound_order_number">
                  <el-input v-model="returnForm.inbound_order_number" disabled></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="日期" prop="date">
                  <el-date-picker v-model="returnForm.date" type="datetime" disabled placeholder="自动生成"></el-date-picker>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="状态">
                  <el-input v-model="returnForm.status" disabled placeholder="待审核"></el-input>
                </el-form-item>
              </el-col>
            </el-row>
            <el-table :data="returnForm.items" border stripe size="small" style="margin-top: 10px;" class="custom-table">
              <el-table-column type="selection" width="40"></el-table-column>
              <el-table-column label="序号" type="index" width="40"></el-table-column>
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
              <el-table-column prop="parent_code" label="产品编码" width="100" :formatter="formatParentCode"></el-table-column>
              <el-table-column prop="item_code" label="产品名称" width="150" :formatter="formatItemName"></el-table-column>
              <el-table-column prop="quantity" label="退货数量" width="80">
                <template v-slot="{ row }">
                  <el-input-number v-model="row.quantity" :step="1" :min="1" :max="row.max_quantity" :controls="false" size="small" :disabled="!returnForm.order_number"></el-input-number>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="80">
                <template v-slot="{ $index }">
                  <el-button type="danger" size="small" round @click="removeItem($index)" :disabled="!returnForm.order_number">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
            <div class="summary" style="margin-top: 10px;">
              <el-row :gutter="10">
                <el-col :span="6">总件数: {{ totalQuantity }}</el-col>
              </el-row>
            </div>
          </el-form>
        </div>
        <!-- 选择入库单对话框 -->
        <el-dialog title="选择入库单" v-model="inboundDialogVisible" width="70%">
          <el-table :data="inboundOrders" border stripe size="small" @row-click="selectOrder">
            <el-table-column prop="order_number" label="入库单号" width="120"></el-table-column>
            <el-table-column prop="date" label="日期时间" :formatter="dateTimeFormatter" width="180"></el-table-column>
            <el-table-column prop="supplier_id" label="供应商" :formatter="formatSupplier" width="100"></el-table-column>
            <el-table-column prop="counter_id" label="柜台" :formatter="formatCounter" width="100"></el-table-column>
            <el-table-column prop="status" label="状态" width="80"></el-table-column>
          </el-table>
        </el-dialog>
      </el-tab-pane>
      <el-tab-pane label="记录查询" name="query">
        <div class="filter-bar">
          <el-form :inline="true" :model="queryForm" size="small">
            <el-form-item label="退货单号">
              <el-input v-model="queryForm.order_number" placeholder="请输入退货单号" clearable @input="fetchReturnOrders"></el-input>
            </el-form-item>
            <el-form-item label="入库单号">
              <el-input v-model="queryForm.inbound_order_number" placeholder="请输入入库单号" clearable @input="fetchReturnOrders"></el-input>
            </el-form-item>
            <el-form-item label="条形码">
              <el-input v-model="queryForm.barcode" placeholder="请输入条形码" clearable @input="fetchReturnOrders"></el-input>
            </el-form-item>
            <el-form-item label="日期范围">
              <el-date-picker
                v-model="queryForm.date_range"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                @change="fetchReturnOrders"
                style="width: 220px;"
              ></el-date-picker>
            </el-form-item>
          </el-form>
        </div>
        <el-table :data="returnOrders" border stripe size="small" v-loading="loading" style="margin-top: 10px;" class="custom-table">
          <el-table-column prop="order_number" label="退货单号" width="120"></el-table-column>
          <el-table-column prop="inbound_order_number" label="入库单号" width="120"></el-table-column>
          <el-table-column prop="date" label="日期时间" :formatter="dateTimeFormatter" width="180"></el-table-column>
          <el-table-column prop="status" label="状态" width="80"></el-table-column>
          <el-table-column label="操作" width="200">
            <template v-slot="{ row }">
              <el-button type="primary" size="small" @click="viewOrder(row)">查看</el-button>
              <el-button type="success" size="small" @click="approveOrder(row)" v-if="row.status === '待审核'">审核</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination
          @current-change="fetchReturnOrders"
          v-model:current-page="page"
          :page-size="size"
          :total="total"
          layout="prev, pager, next, total"
          style="margin-top: 10px;"
        ></el-pagination>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
export default {
  name: 'ReturnOrderList',
  data() {
    return {
      activeTab: 'add',
      returnOrders: [],
      inboundOrders: [],
      suppliers: [],
      counters: [],
      categories: [],
      parentCategories: [],
      inboundDialogVisible: false,
      returnForm: {
        order_number: '',
        inbound_order_number: '',
        date: new Date(),
        items: [],
        status: '待审核',
      },
      queryForm: {
        order_number: '',
        inbound_order_number: '',
        barcode: '',
        date_range: null,
      },
      rules: {
        inbound_order_number: [{ required: true, message: '请选择入库单', trigger: 'change' }],
      },
      page: 1,
      size: 10,
      total: 0,
      loading: false,
    };
  },
  computed: {
    totalQuantity() {
      return this.returnForm.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    },
  },
  mounted() {
    this.fetchReturnOrders();
    this.fetchSuppliers();
    this.fetchCounters();
    this.fetchCategories();
  },
  methods: {
    handleTabChange(tab) {
      this.activeTab = tab.name;
    },
    async fetchReturnOrders() {
      this.loading = true;
      try {
        const params = {
          _page: this.page,
          _limit: this.size,
          order_number_like: this.queryForm.order_number || undefined,
          inbound_order_number_like: this.queryForm.inbound_order_number || undefined,
        };
        if (this.queryForm.barcode) {
          params['items.barcode_like'] = this.queryForm.barcode;
        }
        if (this.queryForm.date_range && this.queryForm.date_range.length === 2) {
          const [start, end] = this.queryForm.date_range;
          params.date_gte = start.toISOString().split('T')[0];
          params.date_lte = end.toISOString().split('T')[0];
        }
        const res = await this.$axios.get('/returnOrders', { params });
        this.returnOrders = res.data || [];
        this.total = parseInt(res.headers['x-total-count']) || res.data.length;
      } catch (err) {
        this.$message.error('加载退货记录失败');
        console.error('Fetch return orders error:', err);
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
    async fetchInboundOrders() {
      try {
        const res = await this.$axios.get('/inboundOrders', { params: { status: '已审核' } });
        this.inboundOrders = res.data || [];
      } catch (err) {
        this.$message.error('加载入库订单失败');
      }
    },
    selectInboundOrder() {
      this.fetchInboundOrders();
      this.inboundDialogVisible = true;
    },
    selectOrder(row) {
      this.returnForm = {
        order_number: `RET${Date.now()}`,
        inbound_order_number: row.order_number,
        date: new Date(),
        items: row.items.map(item => ({
          ...item,
          max_quantity: item.quantity,
          quantity: item.quantity,
        })),
        status: '待审核',
      };
      this.inboundDialogVisible = false;
    },
    resetForm() {
      this.returnForm = {
        order_number: '',
        inbound_order_number: '',
        date: new Date(),
        items: [],
        status: '待审核',
      };
    },
    removeItem(index) {
      this.returnForm.items.splice(index, 1);
    },
    async saveReturn() {
      this.$refs.returnForm.validate(async valid => {
        if (valid) {
          try {
            const method = this.returnForm.id ? 'put' : 'post';
            const url = this.returnForm.id ? `/returnOrders/${this.returnForm.id}` : '/returnOrders';
            await this.$axios[method](url, this.returnForm);
            this.$message.success('保存成功');
            this.fetchReturnOrders();
          } catch (err) {
            this.$message.error('保存失败');
          }
        }
      });
    },
    async approveOrder(row) {
      try {
        row.status = '已审核';
        await this.$axios.put(`/returnOrders/${row.id}`, row);
        // 更新原始入库订单状态
        const inboundOrder = this.inboundOrders.find(o => o.order_number === row.inbound_order_number);
        if (inboundOrder) {
          inboundOrder.status = '已退货';
          await this.$axios.put(`/inboundOrders/${inboundOrder.id}`, inboundOrder);
        }
        this.$message.success('审核成功');
        this.fetchReturnOrders();
      } catch (err) {
        this.$message.error('审核失败');
      }
    },
    viewOrder(row) {
      this.activeTab = 'add';
      this.returnForm = { ...row };
    },
    formatParentCode(row) {
      const category = this.parentCategories.find(c => c.code === row.parent_code);
      return category ? `${category.code} ${category.name}` : row.parent_code;
    },
    formatItemName(row) {
      const subCategory = this.categories.find(c => c.code === row.item_code);
      return subCategory ? `${subCategory.code} ${subCategory.name}` : row.item_code;
    },
    formatSupplier(row) {
      const supplier = this.suppliers.find(s => s.id === row.supplier_id);
      return supplier ? supplier.short_name : '';
    },
    formatCounter(row) {
      const counter = this.counters.find(c => c.id === row.counter_id);
      return counter ? counter.name : '';
    },
    dateTimeFormatter(row) {
      return new Date(row.date).toLocaleString();
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
.form-section {
  background: #fff;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
.el-form-item {
  margin-bottom: 15px;
}
.el-table {
  font-size: 12px;
}
.custom-table {
  margin-bottom: 20px;
}
.custom-table .el-table__body-wrapper {
  padding-bottom: 10px;
}
.summary {
  font-size: 14px;
  color: #606266;
}
.el-button--small {
  padding: 8px 15px;
}
.barcode-container {
  display: flex;
  align-items: center;
}
</style>