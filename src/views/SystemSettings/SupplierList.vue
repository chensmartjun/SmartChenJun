<template>
  <div class="module-container">
    <div class="operation-bar">
      <el-button type="primary" icon="el-icon-plus" @click="addSupplier">新建</el-button>
      <el-button type="warning" icon="el-icon-edit" @click="editSupplier" :disabled="selectedRows.length !== 1">修改</el-button>
      <el-button type="danger" icon="el-icon-delete" @click="deleteSupplier" :disabled="selectedRows.length === 0">删除</el-button>
      <el-button type="success" @click="saveSupplier" :disabled="!formVisible">保存</el-button>
      <el-button type="info" @click="formVisible = false" :disabled="!formVisible">撤回</el-button>
      <el-button type="primary" icon="el-icon-download" @click="exportData">导出</el-button>
    </div>
    <div class="form-section" v-if="formVisible">
      <el-form :model="supplierForm" :rules="rules" ref="supplierForm" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="8"><el-form-item label="编码" prop="code"><el-input v-model="supplierForm.code"></el-input></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="公司简称" prop="short_name"><el-input v-model="supplierForm.short_name"></el-input></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="公司全称" prop="full_name"><el-input v-model="supplierForm.full_name"></el-input></el-form-item></el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8"><el-form-item label="税务号" prop="tax_id"><el-input v-model="supplierForm.tax_id"></el-input></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="公司法人" prop="legal_person"><el-input v-model="supplierForm.legal_person"></el-input></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="法人身份证" prop="legal_person_id"><el-input v-model="supplierForm.legal_person_id"></el-input></el-form-item></el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8"><el-form-item label="联系人" prop="contact"><el-input v-model="supplierForm.contact"></el-input></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="联系电话" prop="phone"><el-input v-model="supplierForm.phone"></el-input></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="微信号" prop="wechat"><el-input v-model="supplierForm.wechat"></el-input></el-form-item></el-col>
        </el-row>
      </el-form>
    </div>
    <el-table :data="suppliers" border @selection-change="handleSelectionChange" v-loading="loading">
      <el-table-column type="selection" width="55"></el-table-column>
      <el-table-column prop="code" label="编码"></el-table-column>
      <el-table-column prop="short_name" label="公司简称"></el-table-column>
      <el-table-column prop="full_name" label="公司全称"></el-table-column>
      <el-table-column prop="tax_id" label="税务号"></el-table-column>
      <el-table-column prop="legal_person" label="公司法人"></el-table-column>
      <el-table-column prop="legal_person_id" label="法人身份证"></el-table-column>
      <el-table-column prop="contact" label="联系人"></el-table-column>
      <el-table-column prop="phone" label="联系电话"></el-table-column>
      <el-table-column prop="wechat" label="微信号"></el-table-column>
    </el-table>
    <el-pagination
      @current-change="fetchSuppliers"
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
  name: 'SupplierList',
  data() {
    return {
      suppliers: [],
      selectedRows: [],
      formVisible: false,
      supplierForm: {
        id: null,
        code: '',
        short_name: '',
        full_name: '',
        tax_id: '',
        legal_person: '',
        legal_person_id: '',
        contact: '',
        phone: '',
        wechat: '',
      },
      rules: {
        code: [{ required: true, message: '请输入编码', trigger: 'blur' }],
        short_name: [{ required: true, message: '请输入公司简称', trigger: 'blur' }],
        full_name: [{ required: true, message: '请输入公司全称', trigger: 'blur' }],
        tax_id: [{ required: true, message: '请输入税务号', trigger: 'blur' }],
        legal_person: [{ required: true, message: '请输入公司法人', trigger: 'blur' }],
        legal_person_id: [{ required: true, message: '请输入法人身份证', trigger: 'blur' }],
        contact: [{ required: true, message: '请输入联系人', trigger: 'blur' }],
        phone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }],
      },
      page: 1,
      size: 10,
      total: 0,
      loading: false,
    };
  },
  mounted() {
    this.fetchSuppliers();
  },
  methods: {
    async fetchSuppliers() {
      this.loading = true;
      try {
        const res = await this.$axios.get(`/suppliers?_page=${this.page}&_limit=${this.size}`);
        this.suppliers = res.data || [];
        this.total = parseInt(res.headers['x-total-count']) || res.data.length;
      } catch (err) {
        this.$message.error('加载失败');
      } finally {
        this.loading = false;
      }
    },
    addSupplier() {
      this.formVisible = true;
      this.supplierForm = {
        id: null,
        code: '',
        short_name: '',
        full_name: '',
        tax_id: '',
        legal_person: '',
        legal_person_id: '',
        contact: '',
        phone: '',
        wechat: '',
      };
    },
    editSupplier() {
      if (this.selectedRows.length === 1) {
        this.formVisible = true;
        this.supplierForm = { ...this.selectedRows[0] };
      }
    },
    async deleteSupplier() {
      if (this.selectedRows.length > 0) {
        if (confirm('确定删除选中的记录？')) {
          await Promise.all(this.selectedRows.map(row => this.$axios.delete(`/suppliers/${row.id}`)));
          this.$message.success('删除成功');
          this.fetchSuppliers();
        }
      }
    },
    async saveSupplier() {
      this.$refs.supplierForm.validate(async valid => {
        if (valid) {
          // 检查重复性
          if (checkDuplicate(this.suppliers, this.supplierForm, 'id', ['code'])) {
            this.$message.error(`编码 "${this.supplierForm.code}" 已存在，请使用唯一编码`);
            return;
          }

          try {
            const method = this.supplierForm.id ? 'put' : 'post';
            const url = this.supplierForm.id ? `/suppliers/${this.supplierForm.id}` : '/suppliers';
            await this.$axios[method](url, this.supplierForm);
            this.$message.success('保存成功');
            this.formVisible = false;
            await this.fetchSuppliers();
          } catch (err) {
            this.$message.error('保存失败');
          }
        }
      });
    },
    exportData() {
      const data = this.suppliers.map(item => ({
        编码: item.code,
        公司简称: item.short_name,
        公司全称: item.full_name,
        税务号: item.tax_id,
        公司法人: item.legal_person,
        法人身份证: item.legal_person_id,
        联系人: item.contact,
        联系电话: item.phone,
        微信号: item.wechat,
      }));
      const ws = this.$XLSX.utils.json_to_sheet(data);
      const wb = this.$XLSX.utils.book_new();
      this.$XLSX.utils.book_append_sheet(wb, ws, 'Suppliers');
      this.$XLSX.writeFile(wb, 'suppliers.xlsx');
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