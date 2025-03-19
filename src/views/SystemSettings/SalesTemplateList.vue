<template>
  <div class="module-container">
    <div class="operation-bar">
      <el-button type="primary" icon="el-icon-plus" @click="addTemplate">新建</el-button>
      <el-button type="warning" icon="el-icon-edit" @click="editTemplate" :disabled="selectedRows.length !== 1">修改</el-button>
      <el-button type="danger" icon="el-icon-delete" @click="deleteTemplate" :disabled="selectedRows.length === 0">删除</el-button>
      <el-button type="success" @click="saveTemplate" :disabled="!formVisible">保存</el-button>
      <el-button type="info" @click="formVisible = false" :disabled="!formVisible">撤回</el-button>
      <el-button type="primary" icon="el-icon-download" @click="exportData">导出</el-button>
    </div>
    <div class="form-section" v-if="formVisible">
      <el-form :model="templateForm" :rules="rules" ref="templateForm" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12"><el-form-item label="模板名称" prop="template_name"><el-input v-model="templateForm.template_name"></el-input></el-form-item></el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8"><el-input v-model="searchQuery" placeholder="搜索分类" clearable @input="filterCategories"></el-input></el-col>
          <el-col :span="16">
            <el-form-item label="批量填充">
              <el-input-number v-model="batch.labor_cost" :precision="2" :step="0.01" :controls="false" placeholder="工费"></el-input-number>
              <el-input-number v-model="batch.extra_fee" :precision="2" :step="0.01" :controls="false" placeholder="附加费"></el-input-number>
              <el-input-number v-model="batch.inlay_labor_cost" :precision="2" :step="0.01" :controls="false" placeholder="镶嵌工费"></el-input-number>
              <el-input-number v-model="batch.stone_price" :precision="2" :step="0.01" :controls="false" placeholder="石价"></el-input-number>
              <el-button type="primary" @click="batchFillSelected">填充选中项</el-button>
            </el-form-item>
          </el-col>
        </el-row>
        <el-table
          :data="filteredCategories"
          border
          @selection-change="handleDetailSelection"
          style="max-height: 400px; overflow-y: auto;"
          row-key="id"
        >
          <el-table-column type="selection" width="55"></el-table-column>
          <el-table-column prop="name" label="分类" width="200"></el-table-column>
          <el-table-column label="工费" prop="labor_cost" width="150">
            <template v-slot="{ row }">
              <el-input-number v-model="row.labor_cost" :precision="2" :step="0.01" :min="0" :controls="false"></el-input-number>
            </template>
          </el-table-column>
          <el-table-column label="附加费" prop="extra_fee" width="150">
            <template v-slot="{ row }">
              <el-input-number v-model="row.extra_fee" :precision="2" :step="0.01" :min="0" :controls="false"></el-input-number>
            </template>
          </el-table-column>
          <el-table-column label="镶嵌工费" prop="inlay_labor_cost" width="150">
            <template v-slot="{ row }">
              <el-input-number v-model="row.inlay_labor_cost" :precision="2" :step="0.01" :min="0" :controls="false"></el-input-number>
            </template>
          </el-table-column>
          <el-table-column label="石料价格" prop="stone_price" width="150">
            <template v-slot="{ row }">
              <el-input-number v-model="row.stone_price" :precision="2" :step="0.01" :min="0" :controls="false"></el-input-number>
            </template>
          </el-table-column>
        </el-table>
      </el-form>
    </div>
    <el-table :data="templates" border @selection-change="handleSelectionChange" v-loading="loading">
      <el-table-column type="selection" width="55"></el-table-column>
      <el-table-column prop="template_name" label="模板名称"></el-table-column>
    </el-table>
    <el-pagination
      @current-change="fetchTemplates"
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
  name: 'SalesTemplateList',
  data() {
    return {
      templates: [],
      categories: [],
      filteredCategories: [],
      selectedRows: [],
      selectedDetails: [],
      formVisible: false,
      templateForm: {
        id: null,
        template_name: '',
        details: [],
      },
      batch: {
        labor_cost: 0,
        extra_fee: 0,
        inlay_labor_cost: 0,
        stone_price: 0,
      },
      searchQuery: '',
      rules: {
        template_name: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
      },
      page: 1,
      size: 10,
      total: 0,
      loading: false,
    };
  },
  mounted() {
    this.fetchTemplates();
    this.fetchCategories();
  },
  methods: {
    async fetchTemplates() {
      this.loading = true;
      try {
        const res = await this.$axios.get(`/salesTemplates?_page=${this.page}&_limit=${this.size}`);
        this.templates = res.data || [];
        this.total = parseInt(res.headers['x-total-count']) || res.data.length;
      } catch (err) {
        this.$message.error('加载失败');
      } finally {
        this.loading = false;
      }
    },
    async fetchCategories() {
      try {
        const res = await this.$axios.get('/categories');
        const flatCategories = res.data || [];
        // 构建树形结构，仅保留子分类
        const categoryMap = {};
        flatCategories.forEach(cat => {
          cat.labor_cost = 0.00;
          cat.extra_fee = 0.00;
          cat.inlay_labor_cost = 0.00;
          cat.stone_price = 0.00;
          cat.children = [];
          categoryMap[cat.id] = cat;
        });
        flatCategories.forEach(cat => {
          if (cat.parent_id && categoryMap[cat.parent_id]) {
            categoryMap[cat.parent_id].children.push(cat);
          }
        });
        // 仅提取子分类
        this.categories = flatCategories.filter(cat => !cat.is_parent);
        this.filteredCategories = this.flattenCategories(this.categories);
      } catch (err) {
        this.$message.error('加载分类失败');
      }
    },
    flattenCategories(categories) {
      const result = [];
      const flatten = (cats, parentName = '') => {
        cats.forEach(cat => {
          const fullName = parentName ? `${parentName} - ${cat.name}` : cat.name;
          const parent = this.categories.find(p => p.id === cat.parent_id);
          result.push({ ...cat, name: parent ? `${parent.name} - ${cat.name}` : cat.name });
          if (cat.children && cat.children.length > 0) {
            flatten(cat.children, fullName);
          }
        });
      };
      flatten(categories);
      return result;
    },
    filterCategories() {
      if (!this.searchQuery) {
        this.filteredCategories = this.flattenCategories(this.categories);
      } else {
        this.filteredCategories = this.flattenCategories(this.categories).filter(cat =>
          cat.name.toLowerCase().includes(this.searchQuery.toLowerCase())
        );
      }
    },
    addTemplate() {
      this.formVisible = true;
      this.templateForm = { id: null, template_name: '', details: [] };
      this.filteredCategories = this.flattenCategories(this.categories);
    },
    editTemplate() {
      if (this.selectedRows.length === 1) {
        this.formVisible = true;
        this.$axios.get(`/salesTemplates/${this.selectedRows[0].id}`).then(res => {
          this.templateForm = { ...res.data, details: res.data.details || [] };
          this.filteredCategories = this.flattenCategories(this.categories);
          this.templateForm.details.forEach(detail => {
            const cat = this.filteredCategories.find(c => c.id === detail.category_id);
            if (cat) {
              cat.labor_cost = detail.labor_cost;
              cat.extra_fee = detail.extra_fee;
              cat.inlay_labor_cost = detail.inlay_labor_cost;
              cat.stone_price = detail.stone_price;
            }
          });
        });
      }
    },
    async deleteTemplate() {
      if (this.selectedRows.length > 0) {
        if (confirm('确定删除选中的记录？')) {
          await Promise.all(this.selectedRows.map(row => this.$axios.delete(`/salesTemplates/${row.id}`)));
          this.$message.success('删除成功');
          this.fetchTemplates();
        }
      }
    },
    async saveTemplate() {
      this.$refs.templateForm.validate(async valid => {
        if (valid) {
          if (checkDuplicate(this.templates, this.templateForm, 'id', ['template_name'])) {
            this.$message.error(`模板名称 "${this.templateForm.template_name}" 已存在，请使用唯一名称`);
            return;
          }

          this.templateForm.details = this.filteredCategories
            .filter(cat => cat.labor_cost > 0 || cat.extra_fee > 0 || cat.inlay_labor_cost > 0 || cat.stone_price > 0)
            .map(cat => ({
              category_id: cat.id,
              labor_cost: Number(cat.labor_cost.toFixed(2)),
              extra_fee: Number(cat.extra_fee.toFixed(2)),
              inlay_labor_cost: Number(cat.inlay_labor_cost.toFixed(2)),
              stone_price: Number(cat.stone_price.toFixed(2)),
            }));

          try {
            const method = this.templateForm.id ? 'put' : 'post';
            const url = this.templateForm.id ? `/salesTemplates/${this.templateForm.id}` : '/salesTemplates';
            await this.$axios[method](url, this.templateForm);
            this.$message.success('保存成功');
            this.formVisible = false;
            await this.fetchTemplates();
          } catch (err) {
            this.$message.error('保存失败');
          }
        }
      });
    },
    batchFillSelected() {
      if (this.selectedDetails.length === 0) {
        this.$message.warning('请先勾选需要填充的分类');
        return;
      }
      this.selectedDetails.forEach(detail => {
        detail.labor_cost = Number(this.batch.labor_cost.toFixed(2));
        detail.extra_fee = Number(this.batch.extra_fee.toFixed(2));
        detail.inlay_labor_cost = Number(this.batch.inlay_labor_cost.toFixed(2));
        detail.stone_price = Number(this.batch.stone_price.toFixed(2));
      });
      this.$message.success('已批量填充选中项');
    },
    exportData() {
      const data = this.templates.map(item => ({
        模板名称: item.template_name,
      }));
      const ws = this.$XLSX.utils.json_to_sheet(data);
      const wb = this.$XLSX.utils.book_new();
      this.$XLSX.utils.book_append_sheet(wb, ws, 'SalesTemplates');
      this.$XLSX.writeFile(wb, 'sales_templates.xlsx');
    },
    handleSelectionChange(val) {
      this.selectedRows = val;
    },
    handleDetailSelection(val) {
      this.selectedDetails = val;
    },
  },
};
</script>

<style scoped>
.module-container { padding: 20px; }
.operation-bar { margin-bottom: 20px; display: flex; gap: 10px; }
.form-section { margin-bottom: 20px; }
.el-table { width: 100%; }
</style>