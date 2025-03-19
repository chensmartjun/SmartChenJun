<template>
  <div class="module-container">
    <div class="operation-bar">
      <el-button type="primary" icon="el-icon-plus" @click="addCounter">新建</el-button>
      <el-button type="warning" icon="el-icon-edit" @click="editCounter" :disabled="selectedRows.length !== 1">修改</el-button>
      <el-button type="danger" icon="el-icon-delete" @click="deleteCounter" :disabled="selectedRows.length === 0">删除</el-button>
      <el-button type="success" @click="saveCounter" :disabled="!formVisible">保存</el-button>
      <el-button type="info" @click="formVisible = false" :disabled="!formVisible">撤回</el-button>
      <el-button type="primary" icon="el-icon-download" @click="exportData">导出</el-button>
    </div>
    <div class="form-section" v-if="formVisible">
      <el-form :model="counterForm" :rules="rules" ref="counterForm" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="8"><el-form-item label="编码" prop="code"><el-input v-model="counterForm.code"></el-input></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="名称" prop="name"><el-input v-model="counterForm.name"></el-input></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="描述" prop="description"><el-input v-model="counterForm.description"></el-input></el-form-item></el-col>
        </el-row>
      </el-form>
    </div>
    <el-table :data="counters" border @selection-change="handleSelectionChange" v-loading="loading">
      <el-table-column type="selection" width="55"></el-table-column>
      <el-table-column prop="code" label="编码"></el-table-column>
      <el-table-column prop="name" label="名称"></el-table-column>
      <el-table-column prop="description" label="描述"></el-table-column>
    </el-table>
    <el-pagination
      @current-change="fetchCounters"
      v-model:current-page="page"
      :page-size="size"
      :total="total"
      layout="prev, pager, next, total"
      style="margin-top: 10px;"
    ></el-pagination>
  </div>
</template>

<script>
import { checkDuplicate } from '@/utils/validation';

export default {
  name: 'CounterList',
  data() {
    return {
      counters: [],
      selectedRows: [],
      formVisible: false,
      counterForm: {
        id: null,
        code: '',
        name: '',
        description: '',
      },
      rules: {
        code: [{ required: true, message: '请输入编码', trigger: 'blur' }],
        name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
      },
      page: 1,
      size: 10,
      total: 0,
      loading: false,
    };
  },
  mounted() {
    this.fetchCounters();
  },
  methods: {
    async fetchCounters() {
      this.loading = true;
      try {
        const res = await this.$axios.get(`/counters?_page=${this.page}&_limit=${this.size}`);
        this.counters = res.data || [];
        this.total = parseInt(res.headers['x-total-count']) || res.data.length;
      } catch (err) {
        this.$message.error('加载失败');
      } finally {
        this.loading = false;
      }
    },
    addCounter() {
      this.formVisible = true;
      this.counterForm = {
        id: null,
        code: '',
        name: '',
        description: '',
      };
    },
    editCounter() {
      if (this.selectedRows.length === 1) {
        this.formVisible = true;
        this.counterForm = { ...this.selectedRows[0] };
      }
    },
    async deleteCounter() {
      if (this.selectedRows.length > 0) {
        if (confirm('确定删除选中的记录？')) {
          await Promise.all(this.selectedRows.map(row => this.$axios.delete(`/counters/${row.id}`)));
          this.$message.success('删除成功');
          this.fetchCounters();
        }
      }
    },
    async saveCounter() {
      this.$refs.counterForm.validate(async valid => {
        if (valid) {
          // 检查重复性
          if (checkDuplicate(this.counters, this.counterForm, 'id', ['code', 'name'])) {
            this.$message.error(`编码 "${this.counterForm.code}" 或名称 "${this.counterForm.name}" 已存在，请使用唯一值`);
            return;
          }

          try {
            const method = this.counterForm.id ? 'put' : 'post';
            const url = this.counterForm.id ? `/counters/${this.counterForm.id}` : '/counters';
            await this.$axios[method](url, this.counterForm);
            this.$message.success('保存成功');
            this.formVisible = false;
            await this.fetchCounters();
          } catch (err) {
            this.$message.error('保存失败');
          }
        }
      });
    },
    exportData() {
      const data = this.counters.map(item => ({
        编码: item.code,
        名称: item.name,
        描述: item.description,
      }));
      const ws = this.$XLSX.utils.json_to_sheet(data);
      const wb = this.$XLSX.utils.book_new();
      this.$XLSX.utils.book_append_sheet(wb, ws, 'Counters');
      this.$XLSX.writeFile(wb, 'counters.xlsx');
    },
    handleSelectionChange(val) {
      this.selectedRows = val;
    },
  },
};
</script>

<style scoped>
.module-container { padding: 20px; }
.operation-bar { margin-bottom: 20px; display: flex; gap: 10px; }
.form-section { margin-bottom: 20px; }
</style>