<template>
  <div class="module-container">
    <el-tabs v-model="activeTab" @tab-click="handleTabChange">
      <el-tab-pane label="物料查询" name="list">
        <div class="filter-bar">
          <el-form :inline="true" :model="queryForm" size="small">
            <el-form-item label="物料编码">
              <el-input v-model="queryForm.material_code" placeholder="请输入物料编码" clearable @input="fetchMaterialInventory"></el-input>
            </el-form-item>
            <el-form-item label="柜台">
              <el-select v-model="queryForm.counter_id" placeholder="选择柜台" clearable @change="fetchMaterialInventory" style="width: 150px;">
                <el-option v-for="counter in counters" :key="counter.id" :label="counter.name" :value="counter.id"></el-option>
              </el-select>
            </el-form-item>
          </el-form>
        </div>
        <el-table :data="materialInventory" border stripe size="small" v-loading="loading" style="margin-top: 10px;" class="custom-table">
          <el-table-column prop="material_code" label="物料编码" width="120"></el-table-column>
          <el-table-column prop="material_name" label="物料名称" width="150"></el-table-column>
          <el-table-column prop="weight" label="重量(克)" width="100"></el-table-column>
          <el-table-column prop="quantity" label="数量" width="80"></el-table-column>
          <el-table-column prop="counter_id" label="柜台" :formatter="formatCounter" width="100"></el-table-column>
          <el-table-column prop="date" label="日期" :formatter="dateTimeFormatter" width="180"></el-table-column>
          <el-table-column prop="type" label="类型" width="80"></el-table-column>
        </el-table>
        <el-pagination
          @current-change="fetchMaterialInventory"
          v-model:current-page="page"
          :page-size="size"
          :total="total"
          layout="prev, pager, next, total"
          style="margin-top: 10px;"
        ></el-pagination>
        <div class="summary" style="margin-top: 10px;">
          <el-row :gutter="10">
            <el-col :span="6">总重量: {{ totalWeight }} 克</el-col>
            <el-col :span="6">总数量: {{ totalQuantity }}</el-col>
          </el-row>
        </div>
      </el-tab-pane>
      <el-tab-pane label="板料入库" name="add">
        <div class="operation-bar">
          <el-button type="primary" size="small" round @click="addMaterial">新增板料</el-button>
          <el-button type="success" size="small" round @click="saveMaterial" :disabled="!materialForm.material_code">保存</el-button>
          <el-button size="small" round @click="resetForm" :disabled="!materialForm.material_code">取消</el-button>
        </div>
        <div class="form-section">
          <el-form :model="materialForm" :rules="rules" ref="materialForm" label-width="80px" size="small">
            <el-row :gutter="10">
              <el-col :span="6">
                <el-form-item label="物料编码" prop="material_code">
                  <el-input v-model="materialForm.material_code" placeholder="请输入物料编码"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="物料名称" prop="material_name">
                  <el-input v-model="materialForm.material_name" placeholder="请输入物料名称"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="重量(克)" prop="weight">
                  <el-input-number v-model="materialForm.weight" :min="0" :precision="2" :controls="false"></el-input-number>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="数量" prop="quantity">
                  <el-input-number v-model="materialForm.quantity" :min="1" :controls="false"></el-input-number>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="10">
              <el-col :span="6">
                <el-form-item label="柜台" prop="counter_id">
                  <el-select v-model="materialForm.counter_id" placeholder="选择柜台" style="width: 100%;">
                    <el-option v-for="counter in counters" :key="counter.id" :label="counter.name" :value="counter.id"></el-option>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="日期" prop="date">
                  <el-date-picker v-model="materialForm.date" type="datetime" disabled placeholder="自动生成"></el-date-picker>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
export default {
  name: 'MaterialInventoryList',
  data() {
    return {
      activeTab: 'list',
      materialInventory: [],
      counters: [],
      materialForm: {
        material_code: '',
        material_name: '',
        weight: 0,
        quantity: 1,
        counter_id: null,
        date: new Date(),
        type: '入库',
      },
      queryForm: {
        material_code: '',
        counter_id: null,
      },
      rules: {
        material_code: [{ required: true, message: '请输入物料编码', trigger: 'blur' }],
        material_name: [{ required: true, message: '请输入物料名称', trigger: 'blur' }],
        weight: [{ required: true, message: '请输入重量', trigger: 'blur' }],
        quantity: [{ required: true, message: '请输入数量', trigger: 'blur' }],
        counter_id: [{ required: true, message: '请选择柜台', trigger: 'change' }],
      },
      page: 1,
      size: 10,
      total: 0,
      loading: false,
    };
  },
  computed: {
    totalWeight() {
      return this.materialInventory.reduce((sum, item) => sum + (item.type === '入库' ? item.weight : -item.weight), 0).toFixed(2);
    },
    totalQuantity() {
      return this.materialInventory.reduce((sum, item) => sum + (item.type === '入库' ? item.quantity : -item.quantity), 0);
    },
  },
  mounted() {
    this.fetchMaterialInventory();
    this.fetchCounters();
  },
  methods: {
    handleTabChange(tab) {
      this.activeTab = tab.name;
      if (tab.name === 'list') this.fetchMaterialInventory();
    },
    async fetchMaterialInventory() {
      this.loading = true;
      try {
        const params = {
          _page: this.page,
          _limit: this.size,
          material_code_like: this.queryForm.material_code || undefined,
          counter_id: this.queryForm.counter_id || undefined,
        };
        const res = await this.$axios.get('/materialInventory', { params });
        this.materialInventory = res.data || [];
        this.total = parseInt(res.headers['x-total-count']) || res.data.length;
      } catch (err) {
        this.$message.error('加载物料库存失败');
        console.error('Fetch material inventory error:', err);
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
    addMaterial() {
      this.materialForm = {
        material_code: '',
        material_name: '',
        weight: 0,
        quantity: 1,
        counter_id: null,
        date: new Date(),
        type: '入库',
      };
    },
    resetForm() {
      this.materialForm = {
        material_code: '',
        material_name: '',
        weight: 0,
        quantity: 1,
        counter_id: null,
        date: new Date(),
        type: '入库',
      };
    },
    async saveMaterial() {
      this.$refs.materialForm.validate(async valid => {
        if (valid) {
          try {
            const method = this.materialForm.id ? 'put' : 'post';
            const url = this.materialForm.id ? `/materialInventory/${this.materialForm.id}` : '/materialInventory';
            await this.$axios[method](url, this.materialForm);
            this.$message.success('保存成功');
            this.fetchMaterialInventory();
            this.resetForm();
          } catch (err) {
            this.$message.error('保存失败');
            console.error('Save material error:', err);
          }
        }
      });
    },
    formatCounter(row) {
      const counter = this.counters.find(c => c.id === row.counter_id);
      return counter ? counter.name : '';
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
.summary {
  font-size: 14px;
  color: #606266;
}
.el-button--small {
  padding: 8px 15px;
}
</style>