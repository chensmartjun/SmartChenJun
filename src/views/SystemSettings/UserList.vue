<template>
  <div class="module-container">
    <div class="operation-bar">
      <el-button type="primary" icon="el-icon-plus" @click="addUser">新建</el-button>
      <el-button type="warning" icon="el-icon-edit" @click="editUser" :disabled="selectedRows.length !== 1">修改</el-button>
      <el-button type="danger" icon="el-icon-delete" @click="deleteUser" :disabled="selectedRows.length === 0">删除</el-button>
      <el-button type="success" @click="saveUser" :disabled="!formVisible">保存</el-button>
      <el-button type="info" @click="formVisible = false" :disabled="!formVisible">撤回</el-button>
      <el-button type="primary" icon="el-icon-download" @click="exportData">导出</el-button>
    </div>
    <div class="form-section" v-if="formVisible">
      <el-form :model="userForm" :rules="rules" ref="userForm" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="8"><el-form-item label="用户名" prop="username"><el-input v-model="userForm.username"></el-input></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="密码" prop="password"><el-input v-model="userForm.password" type="password" show-password></el-input></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="角色" prop="role">
            <el-select v-model="userForm.role" placeholder="选择角色">
              <el-option label="管理员" value="admin"></el-option>
              <el-option label="普通用户" value="user"></el-option>
            </el-select>
          </el-form-item></el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8"><el-form-item label="姓名" prop="name"><el-input v-model="userForm.name"></el-input></el-form-item></el-col>
        </el-row>
      </el-form>
    </div>
    <el-table :data="users" border @selection-change="handleSelectionChange" v-loading="loading">
      <el-table-column type="selection" width="55"></el-table-column>
      <el-table-column prop="username" label="用户名"></el-table-column>
      <el-table-column prop="role" label="角色"></el-table-column>
      <el-table-column prop="name" label="姓名"></el-table-column>
    </el-table>
    <el-pagination
      @current-change="fetchUsers"
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
  name: 'UserList',
  data() {
    return {
      users: [],
      selectedRows: [],
      formVisible: false,
      userForm: {
        id: null,
        username: '',
        password: '',
        role: '',
        name: '',
      },
      rules: {
        username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
        password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
        role: [{ required: true, message: '请选择角色', trigger: 'change' }],
        name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
      },
      page: 1,
      size: 10,
      total: 0,
      loading: false,
    };
  },
  mounted() {
    this.fetchUsers();
  },
  methods: {
    async fetchUsers() {
      this.loading = true;
      try {
        const res = await this.$axios.get(`/users?_page=${this.page}&_limit=${this.size}`);
        this.users = res.data || [];
        this.total = parseInt(res.headers['x-total-count']) || res.data.length;
      } catch (err) {
        this.$message.error('加载失败');
      } finally {
        this.loading = false;
      }
    },
    addUser() {
      this.formVisible = true;
      this.userForm = {
        id: null,
        username: '',
        password: '',
        role: '',
        name: '',
      };
    },
    editUser() {
      if (this.selectedRows.length === 1) {
        this.formVisible = true;
        this.userForm = { ...this.selectedRows[0] };
      }
    },
    async deleteUser() {
      if (this.selectedRows.length > 0) {
        if (confirm('确定删除选中的记录？')) {
          await Promise.all(this.selectedRows.map(row => this.$axios.delete(`/users/${row.id}`)));
          this.$message.success('删除成功');
          this.fetchUsers();
        }
      }
    },
    async saveUser() {
      this.$refs.userForm.validate(async valid => {
        if (valid) {
          // 检查重复性
          if (checkDuplicate(this.users, this.userForm, 'id', ['username'])) {
            this.$message.error(`用户名 "${this.userForm.username}" 已存在，请使用唯一用户名`);
            return;
          }

          try {
            const method = this.userForm.id ? 'put' : 'post';
            const url = this.userForm.id ? `/users/${this.userForm.id}` : '/users';
            await this.$axios[method](url, this.userForm);
            this.$message.success('保存成功');
            this.formVisible = false;
            await this.fetchUsers();
          } catch (err) {
            this.$message.error('保存失败');
          }
        }
      });
    },
    exportData() {
      const data = this.users.map(item => ({
        用户名: item.username,
        角色: item.role,
        姓名: item.name,
      }));
      const ws = this.$XLSX.utils.json_to_sheet(data);
      const wb = this.$XLSX.utils.book_new();
      this.$XLSX.utils.book_append_sheet(wb, ws, 'Users');
      this.$XLSX.writeFile(wb, 'users.xlsx');
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