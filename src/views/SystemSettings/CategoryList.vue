<template>
  <div class="module-container">
    <div class="operation-bar">
      <el-button type="primary" icon="el-icon-plus" @click="addCategory">新建</el-button>
      <el-button type="warning" icon="el-icon-edit" @click="editCategory" :disabled="selectedRows.length !== 1">修改</el-button>
      <el-button type="danger" icon="el-icon-delete" @click="deleteCategory" :disabled="selectedRows.length === 0">删除</el-button>
      <el-button type="success" @click="saveCategories" :disabled="!formVisible">保存</el-button>
      <el-button type="info" @click="formVisible = false" :disabled="!formVisible">撤回</el-button>
      <el-button type="primary" icon="el-icon-download" @click="exportData">导出</el-button>
    </div>
    <div class="form-section" v-if="formVisible">
      <el-form :model="categoryForm" :rules="rules" ref="categoryForm" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="8"><el-form-item label="是否父分类" prop="is_parent">
            <el-switch v-model="categoryForm.is_parent" active-text="是" inactive-text="否" @change="clearParentId"></el-switch>
          </el-form-item></el-col>
          <el-col :span="8" v-if="!categoryForm.is_parent"><el-form-item label="父分类" prop="parent_id">
            <el-select
              v-model="categoryForm.parent_id"
              placeholder="选择父分类"
              clearable
              @change="onParentChange"
              :disabled="parentCategories.length === 0"
            >
              <el-option
                v-for="cat in parentCategories"
                :key="cat.id"
                :label="cat.name"
                :value="cat.id"
              ></el-option>
            </el-select>
            <span v-if="parentCategories.length === 0">暂无父分类</span>
          </el-form-item></el-col>
        </el-row>
        <el-table :data="categoryForm.subCategories" border>
          <el-table-column prop="code" label="代码" width="150">
            <template v-slot="{ row }">
              <el-input v-model="row.code"></el-input>
            </template>
          </el-table-column>
          <el-table-column prop="name" label="名称" width="150">
            <template v-slot="{ row }">
              <el-input v-model="row.name"></el-input>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="描述">
            <template v-slot="{ row }">
              <el-input v-model="row.description"></el-input>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100">
            <template v-slot="{ $index }">
              <el-button type="danger" size="small" @click="removeSubCategory($index)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-button type="primary" size="small" @click="addSubCategory" style="margin-top: 10px;">添加子分类</el-button>
      </el-form>
    </div>
    <el-table :data="categories" border @selection-change="handleSelectionChange" v-loading="loading">
      <el-table-column type="selection" width="55"></el-table-column>
      <el-table-column prop="code" label="代码"></el-table-column>
      <el-table-column prop="name" label="名称"></el-table-column>
      <el-table-column prop="is_parent" label="分类类型" :formatter="formatType"></el-table-column>
      <el-table-column prop="parent_id" label="父分类名称" :formatter="formatParent"></el-table-column>
      <el-table-column prop="description" label="描述"></el-table-column>
    </el-table>
    <el-pagination
      @current-change="fetchCategories"
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
  name: 'CategoryList',
  data() {
    return {
      categories: [],
      selectedRows: [],
      formVisible: false,
      categoryForm: {
        is_parent: true,
        parent_id: null,
        subCategories: [],
      },
      rules: {
        parent_id: [{
          validator: (rule, value, callback) => {
            if (!this.categoryForm.is_parent && !value) {
              callback(new Error('子分类必须选择父分类'));
            } else {
              callback();
            }
          },
          trigger: 'change'
        }],
        'subCategories.code': [{ required: true, message: '请输入代码', trigger: 'blur' }],
        'subCategories.name': [{ required: true, message: '请输入名称', trigger: 'blur' }],
      },
      page: 1,
      size: 10,
      total: 0,
      loading: false,
      dataLoaded: false,
    };
  },
  computed: {
    parentCategories() {
      return this.categories.filter(cat => cat.is_parent);
    },
  },
  async mounted() {
    await this.fetchCategories();
    this.dataLoaded = true;
  },
  methods: {
    async fetchCategories() {
      this.loading = true;
      try {
        const res = await this.$axios.get('/categories');
        this.categories = res.data || [];
        this.total = this.categories.length;
      } catch (err) {
        this.$message.error('加载失败');
      } finally {
        this.loading = false;
      }
    },
    addCategory() {
      if (!this.dataLoaded) {
        this.$message.warning('请等待分类数据加载完成');
        return;
      }
      this.formVisible = true;
      this.categoryForm = {
        is_parent: true,
        parent_id: null,
        subCategories: [],
      };
      this.addSubCategory();
    },
    editCategory() {
      if (this.selectedRows.length === 1) {
        this.formVisible = true;
        const selected = this.selectedRows[0];
        this.categoryForm = {
          is_parent: selected.is_parent,
          parent_id: selected.parent_id,
          subCategories: selected.is_parent ? [] : [{ code: selected.code, name: selected.name, description: selected.description }],
        };
      }
    },
    async deleteCategory() {
      if (this.selectedRows.length > 0) {
        if (confirm('确定删除选中的记录？')) {
          await Promise.all(this.selectedRows.map(row => this.$axios.delete(`/categories/${row.id}`)));
          this.$message.success('删除成功');
          await this.fetchCategories();
        }
      }
    },
    async saveCategories() {
      this.$refs.categoryForm.validate(async valid => {
        if (valid) {
          // 检查重复性
          for (const sub of this.categoryForm.subCategories) {
            const codeExists = this.categories.some(cat => cat.code === sub.code && cat.id !== this.categoryForm.id);
            const nameExists = this.categories.some(cat => cat.name === sub.name && cat.id !== this.categoryForm.id);
            if (codeExists) {
              this.$message.error(`代码 "${sub.code}" 已存在，请使用唯一代码`);
              return;
            }
            if (nameExists) {
              this.$message.error(`名称 "${sub.name}" 已存在，请使用唯一名称`);
              return;
            }
          }

          try {
            if (this.categoryForm.is_parent) {
              const category = {
                code: this.categoryForm.subCategories[0].code,
                name: this.categoryForm.subCategories[0].name,
                is_parent: true,
                parent_id: null,
                description: this.categoryForm.subCategories[0].description,
              };
              const method = this.categoryForm.id ? 'put' : 'post';
              const url = this.categoryForm.id ? `/categories/${this.categoryForm.id}` : '/categories';
              await this.$axios[method](url, category);
            } else {
              const requests = this.categoryForm.subCategories.map(sub => ({
                code: sub.code,
                name: sub.name,
                is_parent: false,
                parent_id: this.categoryForm.parent_id,
                description: sub.description,
              })).map(data => this.$axios.post('/categories', data));
              await Promise.all(requests);
            }
            this.$message.success('保存成功');
            this.formVisible = false;
            await this.fetchCategories();
          } catch (err) {
            this.$message.error('保存失败');
          }
        }
      });
    },
    addSubCategory() {
      this.categoryForm.subCategories.push({ code: '', name: '', description: '' });
    },
    removeSubCategory(index) {
      this.categoryForm.subCategories.splice(index, 1);
    },
    clearParentId() {
      if (this.categoryForm.is_parent) {
        this.categoryForm.parent_id = null;
      }
    },
    onParentChange(value) {
      this.categoryForm.parent_id = value;
    },
    exportData() {
      const data = this.categories.map(item => ({
        代码: item.code,
        名称: item.name,
        分类类型: this.formatType(item),
        父分类名称: this.formatParent(item),
        描述: item.description,
      }));
      const ws = this.$XLSX.utils.json_to_sheet(data);
      const wb = this.$XLSX.utils.book_new();
      this.$XLSX.utils.book_append_sheet(wb, ws, 'Categories');
      this.$XLSX.writeFile(wb, 'categories.xlsx');
    },
    handleSelectionChange(val) {
      this.selectedRows = val;
    },
    formatType(row) {
      return row.is_parent ? '父类' : '子类';
    },
    formatParent(row) {
      if (row.is_parent || !row.parent_id) return '无';
      const parent = this.categories.find(cat => cat.id === row.parent_id);
      return parent ? parent.name : '未知';
    },
  },
};
</script>

<style scoped>
.module-container { padding: 20px; }
.operation-bar { margin-bottom: 20px; display: flex; gap: 10px; }
.form-section { margin-bottom: 20px; }
</style>