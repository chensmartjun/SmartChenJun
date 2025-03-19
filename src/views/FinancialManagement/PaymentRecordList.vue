<template>
  <div class="module-container">
    <div class="operation-bar">
      <el-button type="primary" icon="el-icon-plus" @click="addRecord">新建收支</el-button>
      <el-button type="success" @click="saveRecord" :disabled="!formVisible">保存</el-button>
      <el-button type="warning" @click="formVisible = false" :disabled="!formVisible">取消</el-button>
    </div>
    <div class="form-section" v-if="formVisible">
      <el-form :model="recordForm" :rules="rules" ref="recordForm" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="单号" prop="record_number">
              <el-input v-model="recordForm.record_number" disabled size="small"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="记录类型" prop="type">
              <el-select v-model="recordForm.type" placeholder="选择类型" size="small" @change="debouncedResetForm">
                <el-option label="采购板料" value="purchase_material"></el-option>
                <el-option label="支付供应商" value="supplier_payment"></el-option>
                <el-option label="客户收款" value="customer_payment"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="日期" prop="date">
              <el-date-picker v-model="recordForm.date" type="datetime" size="small" disabled></el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="6" v-if="recordForm.type === 'purchase_material' || recordForm.type === 'supplier_payment'">
            <el-form-item label="供应商" prop="supplier_id">
              <el-autocomplete
                v-model="supplierInput"
                :fetch-suggestions="querySuppliers"
                placeholder="输入供应商名称"
                size="small"
                @select="handleSupplierSelect"
                style="width: 100%;"
              ></el-autocomplete>
            </el-form-item>
          </el-col>
          <el-col :span="6" v-if="recordForm.type === 'supplier_payment'">
            <el-form-item label="支付类型" prop="payment_subtype">
              <el-select v-model="recordForm.payment_subtype" placeholder="选择支付类型" size="small">
                <el-option label="板料" value="material"></el-option>
                <el-option label="加工费" value="processing_fee"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <!-- 采购板料 -->
        <transition name="fade">
          <el-row :gutter="20" v-if="recordForm.type === 'purchase_material'">
            <el-col :span="6">
              <el-form-item label="板料重量(g)" prop="material_weight">
                <el-input-number v-model="recordForm.material_weight" :precision="2" :step="0.01" :min="0" :controls="false" size="small"></el-input-number>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="金额(¥)" prop="amount">
                <el-input-number v-model="recordForm.amount" :precision="2" :step="0.01" :min="0" :controls="false" size="small"></el-input-number>
              </el-form-item>
            </el-col>
          </el-row>
        </transition>
        <!-- 支付供应商 -->
        <transition name="fade">
          <el-row :gutter="20" v-if="recordForm.type === 'supplier_payment' && recordForm.payment_subtype === 'material'">
            <el-col :span="6">
              <el-form-item label="板料重量(g)" prop="material_weight">
                <el-input-number v-model="recordForm.material_weight" :precision="2" :step="0.01" :min="0" :controls="false" size="small"></el-input-number>
              </el-form-item>
            </el-col>
          </el-row>
        </transition>
        <transition name="fade">
          <el-row :gutter="20" v-if="recordForm.type === 'supplier_payment' && recordForm.payment_subtype === 'processing_fee'">
            <el-col :span="6">
              <el-form-item label="金额(¥)" prop="amount">
                <el-input-number v-model="recordForm.amount" :precision="2" :step="0.01" :min="0" :controls="false" size="small"></el-input-number>
              </el-form-item>
            </el-col>
          </el-row>
        </transition>
        <!-- 客户收款 -->
        <div v-if="recordForm.type === 'customer_payment'">
          <el-table :data="recordForm.customer_payments" border>
            <el-table-column prop="record_number" label="单号" width="150">
              <template v-slot="{ row }">
                <el-input v-model="row.record_number" disabled size="small"></el-input>
              </template>
            </el-table-column>
            <el-table-column label="客户" width="150">
              <template v-slot="{ row }">
                <el-autocomplete
                  v-model="row.customer_name"
                  :fetch-suggestions="queryCustomers"
                  placeholder="输入客户名称"
                  size="small"
                  @select="handleCustomerSelect($event, row)"
                  style="width: 100%;"
                ></el-autocomplete>
              </template>
            </el-table-column>
            <el-table-column prop="processing_fee" label="加工费(¥)" width="120">
              <template v-slot="{ row }">
                <el-input-number v-model="row.processing_fee" :precision="2" :step="0.01" :min="0" :controls="false" size="small"></el-input-number>
              </template>
            </el-table-column>
            <el-table-column prop="material_weight" label="板料重量(g)" width="120">
              <template v-slot="{ row }">
                <el-input-number v-model="row.material_weight" :precision="2" :step="0.01" :min="0" :controls="false" size="small"></el-input-number>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80">
              <template v-slot="{ $index }">
                <el-button type="danger" size="small" @click="removeCustomerPayment($index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-button type="primary" size="small" @click="addCustomerPayment" style="margin-top: 10px;">添加客户</el-button>
        </div>
      </el-form>
    </div>
    <el-table :data="records" border v-loading="loading">
      <el-table-column prop="record_number" label="单号" width="150"></el-table-column>
      <el-table-column prop="type" label="记录类型" :formatter="formatType" width="120"></el-table-column>
      <el-table-column prop="date" label="日期时间" :formatter="dateTimeFormatter" width="180"></el-table-column>
      <el-table-column prop="supplier_id" label="供应商" :formatter="formatSupplier" width="100" v-if="recordTypeFilter('purchase_material', 'supplier_payment')"></el-table-column>
      <el-table-column prop="customer_id" label="客户" :formatter="formatCustomer" width="100" v-if="recordTypeFilter('customer_payment')"></el-table-column>
      <el-table-column prop="payment_subtype" label="支付类型" :formatter="formatPaymentSubtype" width="100" v-if="recordTypeFilter('supplier_payment')"></el-table-column>
      <el-table-column prop="material_weight" label="板料重量(g)" width="120"></el-table-column>
      <el-table-column prop="amount" label="金额(¥)" width="100"></el-table-column>
      <el-table-column prop="processing_fee" label="加工费(¥)" width="100"></el-table-column>
    </el-table>
    <el-pagination
      @current-change="fetchRecords"
      v-model:current-page="page"
      :page-size="size"
      :total="total"
      layout="prev, pager, next, total"
      style="margin-top: 10px;"
    ></el-pagination>
  </div>
</template>

<script>
import { debounce } from 'lodash';

export default {
  name: 'PaymentRecordList',
  data() {
    return {
      records: [],
      suppliers: [],
      customers: [],
      formVisible: false,
      supplierInput: '',
      recordForm: {
        record_number: '',
        type: 'purchase_material',
        date: new Date(),
        supplier_id: null,
        customer_id: null,
        payment_subtype: 'material',
        material_weight: undefined,
        amount: undefined,
        processing_fee: undefined,
        customer_payments: [],
      },
      rules: {
        type: [{ required: true, message: '请选择记录类型', trigger: 'change' }],
        date: [{ required: true, message: '请选择日期', trigger: 'change' }],
        supplier_id: [{ required: true, message: '请选择供应商', trigger: 'change', validator: (rule, value, callback) => {
          if (this.recordForm.type !== 'customer_payment' && !value) callback(new Error('请选择供应商'));
          else callback();
        } }],
        payment_subtype: [{ required: true, message: '请选择支付类型', trigger: 'change', validator: (rule, value, callback) => {
          if (this.recordForm.type === 'supplier_payment' && !value) callback(new Error('请选择支付类型'));
          else callback();
        } }],
        material_weight: [{ validator: (rule, value, callback) => {
          if ((this.recordForm.type === 'purchase_material' || (this.recordForm.type === 'supplier_payment' && this.recordForm.payment_subtype === 'material')) && (value === undefined || value <= 0)) callback(new Error('请输入有效的板料重量'));
          else callback();
        }, trigger: 'blur' }],
        amount: [{ validator: (rule, value, callback) => {
          if ((this.recordForm.type === 'purchase_material' || (this.recordForm.type === 'supplier_payment' && this.recordForm.payment_subtype === 'processing_fee')) && (value === undefined || value <= 0)) callback(new Error('请输入有效的金额'));
          else callback();
        }, trigger: 'blur' }],
      },
      page: 1,
      size: 10,
      total: 0,
      loading: false,
    };
  },
  mounted() {
    this.fetchRecords();
    this.fetchSuppliers();
    this.fetchCustomers();
  },
  created() {
    this.debouncedResetForm = debounce(this.resetForm, 300);
  },
  methods: {
    async fetchRecords() {
      this.loading = true;
      try {
        const res = await this.$axios.get(`/paymentRecords?_page=${this.page}&_limit=${this.size}`);
        this.records = res.data || [];
        this.total = parseInt(res.headers['x-total-count']) || res.data.length;
        console.log('Records fetched:', this.records);
      } catch (err) {
        this.$message.error('加载记录失败');
        console.error('Fetch records error:', err);
      } finally {
        this.loading = false;
      }
    },
    async fetchSuppliers() {
      this.loading = true;
      try {
        const res = await this.$axios.get('/suppliers');
        this.suppliers = res.data || [];
        console.log('Suppliers fetched:', this.suppliers);
        if (this.suppliers.length === 0) this.$message.warning('供应商列表为空，请先添加供应商');
      } catch (err) {
        this.$message.error('加载供应商失败');
        console.error('Fetch suppliers error:', err);
      } finally {
        this.loading = false;
      }
    },
    async fetchCustomers() {
      try {
        const res = await this.$axios.get('/customers');
        this.customers = res.data || [];
        console.log('Customers fetched:', this.customers);
        if (this.customers.length === 0) this.$message.warning('客户列表为空，请先添加客户');
      } catch (err) {
        this.$message.error('加载客户失败');
        console.error('Fetch customers error:', err);
      }
    },
    addRecord() {
      this.formVisible = true;
      this.recordForm = {
        record_number: `PAY-${Date.now()}`,
        type: 'purchase_material',
        date: new Date(),
        supplier_id: null,
        customer_id: null,
        payment_subtype: 'material',
        material_weight: undefined,
        amount: undefined,
        processing_fee: undefined,
        customer_payments: [],
      };
      this.supplierInput = '';
    },
    resetForm() {
      setTimeout(() => {
        this.recordForm = {
          record_number: `PAY-${Date.now()}`,
          type: this.recordForm.type,
          date: new Date(),
          supplier_id: null,
          customer_id: null,
          payment_subtype: this.recordForm.type === 'supplier_payment' ? 'material' : null,
          material_weight: undefined,
          amount: undefined,
          processing_fee: undefined,
          customer_payments: [],
        };
        this.supplierInput = '';
      }, 100);
    },
    async saveRecord() {
      this.$refs.recordForm.validate(async valid => {
        if (valid) {
          try {
            const method = this.recordForm.id ? 'put' : 'post';
            const url = this.recordForm.id ? `/paymentRecords/${this.recordForm.id}` : '/paymentRecords';
            const recordData = { ...this.recordForm };

            if (recordData.type === 'customer_payment') {
              const paymentRecords = recordData.customer_payments.map(payment => ({
                record_number: payment.record_number,
                type: 'customer_payment',
                date: recordData.date,
                customer_id: this.customers.find(c => c.name === payment.customer_name)?.id,
                processing_fee: payment.processing_fee || 0,
                material_weight: payment.material_weight || 0,
              }));
              await Promise.all(paymentRecords.map(record =>
                this.$axios.post('/paymentRecords', record)
              ));
            } else {
              await this.$axios[method](url, recordData);
            }

            console.log('Save response:', recordData);
            this.$message.success('保存成功');
            this.formVisible = false;
            this.fetchRecords();
          } catch (err) {
            this.$message.error('保存失败');
            console.error('Save error:', err);
          }
        }
      });
    },
    querySuppliers(queryString, cb) {
      const results = queryString
        ? this.suppliers.filter(s => s.short_name && s.short_name.toLowerCase().includes(queryString.toLowerCase()))
        : this.suppliers;
      cb(results.map(s => ({ value: s.short_name || '未知供应商', id: s.id })));
    },
    handleSupplierSelect(item) {
      this.recordForm.supplier_id = item.id;
      this.supplierInput = item.value;
    },
    queryCustomers(queryString, cb) {
      const results = queryString
        ? this.customers.filter(c => c.name && c.name.toLowerCase().includes(queryString.toLowerCase()))
        : this.customers;
      cb(results.map(c => ({ value: c.name || '未知客户', id: c.id })));
    },
    handleCustomerSelect(item, row) {
      row.customer_id = item.id;
      row.customer_name = item.value;
    },
    addCustomerPayment() {
      this.recordForm.customer_payments.push({
        record_number: `PAY-${Date.now()}`,
        customer_id: null,
        customer_name: '',
        processing_fee: undefined,
        material_weight: undefined,
      });
    },
    removeCustomerPayment(index) {
      this.recordForm.customer_payments.splice(index, 1);
    },
    formatType(row) {
      const typeMap = {
        purchase_material: '采购板料',
        supplier_payment: '支付供应商',
        customer_payment: '客户收款',
      };
      return typeMap[row.type] || row.type;
    },
    formatPaymentSubtype(row) {
      if (row.type !== 'supplier_payment') return '';
      const subtypeMap = {
        material: '板料',
        processing_fee: '加工费',
      };
      return subtypeMap[row.payment_subtype] || row.payment_subtype;
    },
    formatSupplier(row) {
      const supplier = this.suppliers.find(s => s.id === row.supplier_id);
      return supplier ? supplier.short_name : '';
    },
    formatCustomer(row) {
      const customer = this.customers.find(c => c.id === row.customer_id);
      return customer ? customer.name : '';
    },
    dateTimeFormatter(row) {
      return new Date(row.date).toLocaleString();
    },
    recordTypeFilter(...types) {
      return types.includes(this.recordForm.type);
    },
  },
};
</script>

<style scoped>
.module-container { padding: 20px; }
.operation-bar { margin-bottom: 20px; display: flex; gap: 10px; }
.form-section { margin-bottom: 20px; }
.el-row { margin-bottom: 10px; }
.el-col { padding-right: 10px; }
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}
</style>