<template>
  <div class="module-container">
    <div class="operation-bar">
      <el-button type="primary" @click="startScan">开始扫码</el-button>
      <el-button type="success" @click="compareInventory">对比库存</el-button>
    </div>
    <el-input v-model="scannedBarcode" placeholder="扫码录入条形码" @keyup.enter="addScannedItem"></el-input>
    <el-table :data="scannedItems" border>
      <el-table-column prop="barcode" label="条形码"></el-table-column>
      <el-table-column prop="name" label="产品名称"></el-table-column>
    </el-table>
    <div v-if="differences.length">
      <h3>差异产品</h3>
      <el-table :data="differences" border>
        <el-table-column prop="barcode" label="条形码"></el-table-column>
        <el-table-column prop="name" label="产品名称"></el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script>
export default {
  name: 'InventoryCheck',
  data() {
    return {
      scannedBarcode: '',
      scannedItems: [],
      inventory: [],
      differences: [],
    };
  },
  methods: {
    async startScan() {
      this.scannedItems = [];
      this.differences = [];
      const res = await this.$axios.get('/inventory');
      this.inventory = res.data || [];
    },
    addScannedItem() {
      const item = this.inventory.find(i => i.barcode === this.scannedBarcode);
      if (item) {
        this.scannedItems.push(item);
        this.scannedBarcode = '';
      } else {
        this.$message.error('未找到该条形码');
      }
    },
    compareInventory() {
      this.differences = this.inventory.filter(i => !this.scannedItems.some(s => s.barcode === i.barcode));
    },
  },
};
</script>