<template>
  <div class="module-container">
    <div class="operation-bar">
      <el-button type="primary" icon="el-icon-plus" @click="addBarcode">添加条码</el-button>
      <el-button type="success" @click="printBarcodes" :disabled="barcodes.length === 0">打印</el-button>
    </div>
    <div class="form-section" v-if="formVisible">
      <el-form :model="barcodeForm" :rules="rules" ref="barcodeForm" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12"><el-form-item label="条形码" prop="barcode"><el-input v-model="barcodeForm.barcode"></el-input></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="数量" prop="quantity"><el-input v-model.number="barcodeForm.quantity" type="number"></el-input></el-form-item></el-col>
        </el-row>
        <el-button type="primary" @click="saveBarcode">确认</el-button>
        <el-button type="info" @click="formVisible = false">取消</el-button>
      </el-form>
    </div>
    <el-table :data="barcodes" border>
      <el-table-column prop="barcode" label="条形码"></el-table-column>
      <el-table-column prop="quantity" label="数量"></el-table-column>
      <el-table-column label="操作" width="100">
        <template v-slot="{ $index }">
          <el-button type="danger" size="mini" @click="removeBarcode($index)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
export default {
  name: 'PrintBarcodeList',
  data() {
    return {
      barcodes: [],
      formVisible: false,
      barcodeForm: {
        barcode: '',
        quantity: 1,
      },
      rules: {
        barcode: [{ required: true, message: '请输入条形码', trigger: 'blur' }],
        quantity: [{ required: true, message: '请输入数量', trigger: 'blur' }],
      },
    };
  },
  methods: {
    addBarcode() {
      this.formVisible = true;
      this.barcodeForm = { barcode: '', quantity: 1 };
    },
    saveBarcode() {
      this.$refs.barcodeForm.validate(valid => {
        if (valid) {
          this.barcodes.push({ ...this.barcodeForm });
          this.formVisible = false;
        }
      });
    },
    removeBarcode(index) {
      this.barcodes.splice(index, 1);
    },
    printBarcodes() {
      if (this.barcodes.length > 0) {
        window.print();
      }
    },
  },
};
</script>

<style scoped>
.module-container { padding: 20px; }
.operation-bar { margin-bottom: 20px; display: flex; gap: 10px; }
.form-section { margin-bottom: 20px; }
</style>