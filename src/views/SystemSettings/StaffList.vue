<template>
  <div class="module-container">
    <div class="operation-bar">
      <el-button type="primary" icon="el-icon-plus" @click="addStaff">新建</el-button>
      <el-button type="warning" icon="el-icon-edit" @click="editStaff" :disabled="selectedRows.length !== 1">修改</el-button>
      <el-button type="danger" icon="el-icon-delete" @click="deleteStaff" :disabled="selectedRows.length === 0">删除</el-button>
      <el-button type="success" @click="saveStaff" :disabled="!formVisible">保存</el-button>
      <el-button type="info" @click="formVisible = false" :disabled="!formVisible">撤回</el-button>
      <el-button type="primary" icon="el-icon-download" @click="exportData">导出</el-button>
    </div>
    <div class="form-section" v-if="formVisible">
      <el-form :model="staffForm" :rules="rules" ref="staffForm" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="8"><el-form-item label="编码" prop="code"><el-input v-model="staffForm.code"></el-input></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="姓名" prop="name"><el-input v-model="staffForm.name"></el-input></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="身份证号" prop="id_number"><el-input v-model="staffForm.id_number"></el-input></el-form-item></el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8"><el-form-item label="手机号" prop="phone"><el-input v-model="staffForm.phone"></el-input></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="身份证地址" prop="id_address"><el-input v-model="staffForm.id_address"></el-input></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="联系地址" prop="contact_address"><el-input v-model="staffForm.contact_address"></el-input></el-form-item></el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8"><el-form-item label="学历" prop="education"><el-input v-model="staffForm.education"></el-input></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="毕业学校" prop="school"><el-input v-model="staffForm.school"></el-input></el-form-item></el-col>
        </el-row>
      </el-form>
    </div>
    <el-table :data="staff" border @selection-change="handleSelectionChange" v-loading="loading">
      <el-table-column type="selection" width="55"></el-table-column>
      <el-table-column prop="code" label="编码"></el-table-column>
      <el-table-column prop="name" label="姓名"></el-table-column>
      <el-table-column prop="id_number" label="身份证号"></el-table-column>
      <el-table-column prop="phone" label="手机号"></el-table-column>
      <el-table-column prop="id_address" label="身份证地址"></el-table-column>
      <el-table-column prop="contact_address" label="联系地址"></el-table-column>
      <el-table-column prop="education" label="学历"></el-table-column>
      <el-table-column prop="school" label="毕业学校"></el-table-column>
    </el-table>
    <el-pagination
      @current-change="fetchStaff"
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
  name: 'StaffList',
  data() {
    return {
      staff: [],
      selectedRows: [],
      formVisible: false,
      staffForm: {
        id: null,
        code: '',
        name: '',
        id_number: '',
        phone: '',
        id_address: '',
        contact_address: '',
        education: '',
        school: '',
      },
      rules: {
        code: [{ required: true, message: '请输入编码', trigger: 'blur' }],
        name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
        id_number: [{ required: true, message: '请输入身份证号', trigger: 'blur' }],
        phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
      },
      page: 1,
      size: 10,
      total: 0,
      loading: false,
    };
  },
  mounted() {
    this.fetchStaff();
  },
  methods: {
    async fetchStaff() {
      this.loading = true;
      try {
        const res = await this.$axios.get(`/staff?_page=${this.page}&_limit=${this.size}`);
        this.staff = res.data || [];
        this.total = parseInt(res.headers['x-total-count']) || res.data.length;
      } catch (err) {
        this.$message.error('加载失败');
      } finally {
        this.loading = false;
      }
    },
    addStaff() {
      this.formVisible = true;
      this.staffForm = {
        id: null,
        code: '',
        name: '',
        id_number: '',
        phone: '',
        id_address: '',
        contact_address: '',
        education: '',
        school: '',
      };
    },
    editStaff() {
      if (this.selectedRows.length === 1) {
        this.formVisible = true;
        this.staffForm = { ...this.selectedRows[0] };
      }
    },
    async deleteStaff() {
      if (this.selectedRows.length > 0) {
        if (confirm('确定删除选中的记录？')) {
          await Promise.all(this.selectedRows.map(row => this.$axios.delete(`/staff/${row.id}`)));
          this.$message.success('删除成功');
          this.fetchStaff();
        }
      }
    },
    async saveStaff() {
      this.$refs.staffForm.validate(async valid => {
        if (valid) {
          // 检查重复性
          if (checkDuplicate(this.staff, this.staffForm, 'id', ['code', 'id_number'])) {
            this.$message.error(`编码 "${this.staffForm.code}" 或身份证号 "${this.staffForm.id_number}" 已存在，请使用唯一值`);
            return;
          }

          try {
            const method = this.staffForm.id ? 'put' : 'post';
            const url = this.staffForm.id ? `/staff/${this.staffForm.id}` : '/staff';
            await this.$axios[method](url, this.staffForm);
            this.$message.success('保存成功');
            this.formVisible = false;
            await this.fetchStaff();
          } catch (err) {
            this.$message.error('保存失败');
          }
        }
      });
    },
    exportData() {
      const data = this.staff.map(item => ({
        编码: item.code,
        姓名: item.name,
        身份证号: item.id_number,
        手机号: item.phone,
        身份证地址: item.id_address,
        联系地址: item.contact_address,
        学历: item.education,
        毕业学校: item.school,
      }));
      const ws = this.$XLSX.utils.json_to_sheet(data);
      const wb = this.$XLSX.utils.book_new();
      this.$XLSX.utils.book_append_sheet(wb, ws, 'Staff');
      this.$XLSX.writeFile(wb, 'staff.xlsx');
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