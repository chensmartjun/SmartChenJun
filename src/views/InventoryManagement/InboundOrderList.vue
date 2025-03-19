<template>
  <div class="module-container">
    <el-tabs v-model="activeTab" @tab-click="handleTabChange">
      <el-tab-pane label="新增入库" name="add">
        <div class="operation-bar">
          <el-button type="primary" size="small" round @click="addOrder">新建入库单</el-button>
          <el-button type="success" size="small" round @click="saveOrder" :disabled="!orderForm.order_number">保存</el-button>
          <el-button type="info" size="small" round @click="saveDraft" :disabled="!orderForm.order_number">保存草稿</el-button>
          <el-button size="small" round @click="resetForm" :disabled="!orderForm.order_number">取消</el-button>
          <el-button type="primary" size="small" round @click="showLabelPreview" :disabled="!orderSaved">打印标签</el-button>
          <el-button type="primary" size="small" round @click="$refs.fileInput.click()">批量导入</el-button>
          <input type="file" ref="fileInput" style="display: none;" accept=".xlsx, .xls" @change="importItemsFromExcel">
        </div>
        <div class="form-section">
          <el-form :model="orderForm" :rules="rules" ref="orderForm" label-width="80px" size="small">
            <el-row :gutter="10">
              <el-col :span="6">
                <el-form-item label="入库单号" prop="order_number">
                  <el-input v-model="orderForm.order_number" disabled placeholder="保存后生成"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="日期" prop="date">
                  <el-date-picker v-model="orderForm.date" type="datetime" disabled placeholder="自动生成"></el-date-picker>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="供应商" prop="supplier_id">
                  <el-select v-model="orderForm.supplier_id" placeholder="选择供应商" :disabled="!orderForm.order_number" style="width: 100%;">
                    <el-option v-for="supplier in suppliers" :key="supplier.id" :label="supplier.short_name" :value="supplier.id"></el-option>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="柜台" prop="counter_id">
                  <el-select v-model="orderForm.counter_id" placeholder="选择柜台" :disabled="!orderForm.order_number" style="width: 100%;">
                    <el-option v-for="counter in counters" :key="counter.id" :label="counter.name" :value="counter.id"></el-option>
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="10">
              <el-col :span="6">
                <el-form-item label="结算方式" prop="settle_type">
                  <el-radio-group v-model="orderForm.settle_type" :disabled="!orderForm.order_number">
                    <el-radio value="price">结价</el-radio>
                    <el-radio value="material">结料</el-radio>
                  </el-radio-group>
                </el-form-item>
              </el-col>
              <el-col :span="6" v-if="orderForm.settle_type === 'price'">
                <el-form-item label="金价(¥/g)">
                  <el-input-number v-model="orderForm.gold_price" :precision="2" :step="0.01" :min="0" :controls="false" :disabled="!orderForm.order_number"></el-input-number>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="状态">
                  <el-input v-model="orderForm.status" disabled placeholder="待审核"></el-input>
                </el-form-item>
              </el-col>
            </el-row>
            <el-table :data="orderForm.items" border stripe size="small" style="margin-top: 10px;" class="custom-table">
              <el-table-column type="selection" width="40"></el-table-column>
              <el-table-column label="序号" type="index" width="40"></el-table-column>
              <el-table-column prop="barcode" label="条形码" width="120">
                <template v-slot="{ row }">
                  <div class="barcode-container">
                    <el-input v-model="row.barcode" disabled size="small" style="width: 100%;">
                      <template #append>
                        <el-button size="small" icon="el-icon-copy-document" @click="copyBarcode(row.barcode)" style="padding: 5px;"></el-button>
                      </template>
                    </el-input>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="parent_code" label="产品编码" width="100">
                <template v-slot="{ row }">
                  <el-select v-model="row.parent_code" placeholder="选择父类" @change="updateSubCategories(row)" size="small" :disabled="!orderForm.order_number" style="width: 100%;">
                    <el-option v-for="category in parentCategories" :key="category.id" :label="`${category.code} ${category.name}`" :value="category.code"></el-option>
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column prop="item_code" label="产品名称" width="150">
                <template v-slot="{ row }">
                  <el-select v-model="row.item_code" placeholder="选择子类" @change="updateItemName(row)" size="small" :disabled="!orderForm.order_number" style="width: 100%;">
                    <el-option v-for="sub in row.subCategories" :key="sub.id" :label="`${sub.code} ${sub.name}`" :value="sub.code"></el-option>
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column prop="gold_weight" label="金重" width="80">
                <template v-slot="{ row }">
                  <el-input-number v-model="row.gold_weight" :precision="2" :step="0.01" :min="0" :controls="false" size="small" :disabled="!orderForm.order_number" @change="updateWeight(row)"></el-input-number>
                </template>
              </el-table-column>
              <el-table-column prop="pure_weight" label="净金重" width="80">
                <template v-slot="{ row }">
                  <el-input-number v-model="row.pure_weight" :precision="2" :step="0.01" :min="0" :controls="false" size="small" :disabled="!orderForm.order_number" @change="updateWeight(row)"></el-input-number>
                </template>
              </el-table-column>
              <el-table-column prop="labor_cost" label="工费" width="80">
                <template v-slot="{ row }">
                  <el-input-number v-model="row.labor_cost" :precision="2" :step="0.01" :min="0" :controls="false" size="small" :disabled="!orderForm.order_number"></el-input-number>
                </template>
              </el-table-column>
              <el-table-column prop="quantity" label="件数" width="60">
                <template v-slot="{ row }">
                  <el-input-number v-model="row.quantity" :step="1" :min="1" :controls="false" size="small" :disabled="!orderForm.order_number"></el-input-number>
                </template>
              </el-table-column>
              <el-table-column prop="extra_fee" label="附加费" width="80">
                <template v-slot="{ row }">
                  <el-input-number v-model="row.extra_fee" :precision="2" :step="0.01" :min="0" :controls="false" size="small" :disabled="!orderForm.order_number"></el-input-number>
                </template>
              </el-table-column>
              <el-table-column prop="inlay_count" label="镶嵌位" width="80">
                <template v-slot="{ row }">
                  <el-input-number v-model="row.inlay_count" :step="1" :min="0" :controls="false" size="small" :disabled="!orderForm.order_number"></el-input-number>
                </template>
              </el-table-column>
              <el-table-column prop="inlay_labor_cost" label="镶嵌工费" width="80">
                <template v-slot="{ row }">
                  <el-input-number v-model="row.inlay_labor_cost" :precision="2" :step="0.01" :min="0" :controls="false" size="small" :disabled="!orderForm.order_number"></el-input-number>
                </template>
              </el-table-column>
              <el-table-column prop="stone_weight" label="石重(ct)" width="80">
                <template v-slot="{ row }">
                  <el-input-number v-model="row.stone_weight" :precision="2" :step="0.01" :min="0" :controls="false" size="small" :disabled="!orderForm.order_number"></el-input-number>
                </template>
              </el-table-column>
              <el-table-column prop="stone_price" label="石价" width="80">
                <template v-slot="{ row }">
                  <el-input-number v-model="row.stone_price" :precision="2" :step="0.01" :min="0" :controls="false" size="small" :disabled="!orderForm.order_number"></el-input-number>
                </template>
              </el-table-column>
              <el-table-column prop="total_cost" label="总工费" width="100">
                <template v-slot="{ row }">
                  {{ calculateTotalCost(row) }}
                </template>
              </el-table-column>
              <el-table-column prop="total_amount" label="本单总金额" width="100" v-if="orderForm.settle_type === 'price'">
                <template v-slot="{ row }">
                  {{ calculateTotalAmount(row) }}
                </template>
              </el-table-column>
              <el-table-column label="操作" width="80">
                <template v-slot="{ $index }">
                  <el-button type="danger" size="small" round @click="removeItem($index)" :disabled="!orderForm.order_number">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-button type="primary" size="small" round @click="addItem" style="margin-top: 10px;" :disabled="!orderForm.order_number">添加产品</el-button>
            <div class="summary" style="margin-top: 10px;">
              <el-row :gutter="10">
                <el-col :span="6">总金重: {{ totalGoldWeight }}</el-col>
                <el-col :span="6">总净金重: {{ totalPureWeight }}</el-col>
                <el-col :span="6">总工费: {{ totalCost }}</el-col>
                <el-col :span="6" v-if="orderForm.settle_type === 'price'">本单总金额: {{ totalAmount }}</el-col>
                <el-col :span="6">总件数: {{ totalQuantity }}</el-col>
              </el-row>
            </div>
          </el-form>
        </div>
        <!-- 标签预览对话框 -->
        <el-dialog title="标签预览" v-model="labelPreviewVisible" width="90%" :before-close="closeLabelPreview">
          <el-row :gutter="10">
            <el-col :span="6">
              <el-form label-width="100px" size="small">
                <el-form-item label="标签模板">
                  <el-select v-model="selectedTemplate" placeholder="选择标签模板" value-key="id" @change="renderPreview" style="width: 100%;">
                    <el-option v-for="template in labelTemplates" :key="template.id" :label="template.name" :value="template"></el-option>
                  </el-select>
                </el-form-item>
                <el-form-item label="标签间距(px)">
                  <el-input-number v-model="labelSpacing" :min="0" :step="5" @change="renderPreview"></el-input-number>
                </el-form-item>
                <el-form-item label="每行标签数">
                  <el-input-number v-model="labelsPerRow" :min="1" :max="10" :step="1" @change="renderPreview"></el-input-number>
                </el-form-item>
              </el-form>
            </el-col>
            <el-col :span="18">
              <div id="label-preview" style="display: grid; gap: 5px;"></div>
            </el-col>
          </el-row>
          <template #footer>
            <span class="dialog-footer">
              <el-button size="small" round @click="closeLabelPreview">取消</el-button>
              <el-button type="primary" size="small" round @click="printLabels">打印</el-button>
            </span>
          </template>
        </el-dialog>
      </el-tab-pane>
      <el-tab-pane label="记录查询" name="query">
        <div class="filter-bar">
          <el-form :inline="true" :model="queryForm" size="small">
            <el-form-item label="入库单号">
              <el-input v-model="queryForm.order_number" placeholder="请输入入库单号" clearable @input="fetchInboundOrders"></el-input>
            </el-form-item>
            <el-form-item label="条形码">
              <el-input v-model="queryForm.barcode" placeholder="请输入条形码" clearable @input="fetchInboundOrders"></el-input>
            </el-form-item>
            <el-form-item label="柜台">
              <el-select v-model="queryForm.counter_id" placeholder="选择柜台" clearable @change="fetchInboundOrders" style="width: 150px;">
                <el-option v-for="counter in counters" :key="counter.id" :label="counter.name" :value="counter.id"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="日期范围">
              <el-date-picker
                v-model="queryForm.date_range"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                @change="fetchInboundOrders"
                style="width: 220px;"
              ></el-date-picker>
            </el-form-item>
          </el-form>
        </div>
        <el-table :data="inboundOrders" border stripe size="small" v-loading="loading" style="margin-top: 10px;" class="custom-table">
          <el-table-column prop="order_number" label="入库单号" width="120"></el-table-column>
          <el-table-column prop="date" label="日期时间" :formatter="dateTimeFormatter" width="180"></el-table-column>
          <el-table-column prop="supplier_id" label="供应商" :formatter="formatSupplier" width="100"></el-table-column>
          <el-table-column prop="counter_id" label="柜台" :formatter="formatCounter" width="100"></el-table-column>
          <el-table-column prop="status" label="状态" width="80"></el-table-column>
          <el-table-column label="操作" width="200">
            <template v-slot="{ row }">
              <el-button type="primary" size="small" @click="viewOrder(row)">查看</el-button>
              <el-button type="success" size="small" @click="approveOrder(row)" v-if="row.status === '待审核'">审核</el-button>
              <el-button type="danger" size="small" @click="returnOrder(row)" v-if="row.status === '已审核'">退货</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination
          @current-change="fetchInboundOrders"
          v-model:current-page="page"
          :page-size="size"
          :total="total"
          layout="prev, pager, next, total"
          style="margin-top: 10px;"
        ></el-pagination>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import { generateEAN13 } from '@/utils/barcode';
import JsBarcode from 'jsbarcode';
import * as XLSX from 'xlsx';

export default {
  name: 'InboundOrderList',
  data() {
    return {
      activeTab: 'add',
      inboundOrders: [],
      suppliers: [],
      counters: [],
      categories: [],
      parentCategories: [],
      labelTemplates: [],
      selectedItems: [],
      orderSaved: false,
      selectedTemplate: null,
      labelPreviewVisible: false,
      labelSpacing: 5,
      labelsPerRow: 4,
      orderForm: {
        order_number: '',
        date: new Date(),
        supplier_id: null,
        counter_id: null,
        settle_type: 'material',
        gold_price: 0,
        items: [],
        is_draft: false,
        status: '待审核',
      },
      queryForm: {
        order_number: '',
        barcode: '',
        counter_id: null,
        date_range: null,
      },
      rules: {
        supplier_id: [{ required: true, message: '请选择供应商', trigger: 'change' }],
        counter_id: [{ required: true, message: '请选择柜台', trigger: 'change' }],
        settle_type: [{ required: true, message: '请选择结算方式', trigger: 'change' }],
      },
      page: 1,
      size: 10,
      total: 0,
      loading: false,
    };
  },
  computed: {
    totalGoldWeight() {
      return this.orderForm.items.reduce((sum, item) => sum + (item.gold_weight || 0), 0).toFixed(2);
    },
    totalPureWeight() {
      return this.orderForm.items.reduce((sum, item) => sum + (item.pure_weight || item.gold_weight || 0), 0).toFixed(2);
    },
    totalCost() {
      const total = this.orderForm.items.reduce((sum, item) => sum + this.calculateTotalCost(item), 0);
      return total.toFixed(2);
    },
    totalAmount() {
      const total = this.orderForm.items.reduce((sum, item) => sum + this.calculateTotalAmount(item), 0);
      return total.toFixed(2);
    },
    totalQuantity() {
      return this.orderForm.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    },
  },
  mounted() {
    this.fetchInboundOrders();
    this.fetchSuppliers();
    this.fetchCounters();
    this.fetchCategories();
    this.fetchLabelTemplates();
  },
  methods: {
    handleTabChange(tab) {
      this.activeTab = tab.name;
    },
    async fetchInboundOrders() {
      this.loading = true;
      try {
        const params = {
          _page: this.page,
          _limit: this.size,
          order_number_like: this.queryForm.order_number || undefined,
          counter_id: this.queryForm.counter_id || undefined,
        };
        // 添加条形码查询
        if (this.queryForm.barcode) {
          params['items.barcode_like'] = this.queryForm.barcode;
        }
        // 添加日期范围查询
        if (this.queryForm.date_range && this.queryForm.date_range.length === 2) {
          const [start, end] = this.queryForm.date_range;
          params.date_gte = start.toISOString().split('T')[0];
          params.date_lte = end.toISOString().split('T')[0];
        }
        const res = await this.$axios.get('/inboundOrders', { params });
        this.inboundOrders = res.data || [];
        this.total = parseInt(res.headers['x-total-count']) || res.data.length;
      } catch (err) {
        this.$message.error('加载失败');
        console.error('Fetch inbound orders error:', err);
      } finally {
        this.loading = false;
      }
    },
    async fetchSuppliers() {
      try {
        const res = await this.$axios.get('/suppliers');
        this.suppliers = res.data || [];
      } catch (err) {
        this.$message.error('加载供应商失败');
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
    async fetchCategories() {
      try {
        const res = await this.$axios.get('/categories');
        this.categories = res.data || [];
        this.parentCategories = this.categories.filter(cat => !cat.parent_id);
        this.orderForm.items.forEach(item => this.updateSubCategories(item));
      } catch (err) {
        this.$message.error('加载分类失败');
      }
    },
    async fetchLabelTemplates() {
      try {
        const res = await this.$axios.get('/labelTemplates');
        this.labelTemplates = res.data || [];
        if (this.labelTemplates.length > 0) this.selectedTemplate = this.labelTemplates[0];
      } catch (err) {
        this.$message.error('加载标签模板失败');
      }
    },
    addOrder() {
      this.orderForm = {
        order_number: `IN${Date.now()}`,
        date: new Date(),
        supplier_id: null,
        counter_id: null,
        settle_type: 'material',
        gold_price: 0,
        items: [],
        is_draft: false,
        status: '待审核',
      };
      this.addItem();
      this.orderSaved = false;
    },
    resetForm() {
      this.orderForm = {
        order_number: '',
        date: new Date(),
        supplier_id: null,
        counter_id: null,
        settle_type: 'material',
        gold_price: 0,
        items: [],
        is_draft: false,
        status: '待审核',
      };
      this.orderSaved = false;
    },
    addItem() {
      this.orderForm.items.push({
        barcode: generateEAN13(),
        parent_code: '',
        item_code: '',
        name: '',
        subCategories: [],
        gold_weight: undefined,
        pure_weight: undefined,
        labor_cost: undefined,
        quantity: 1,
        extra_fee: undefined,
        inlay_count: 0,
        inlay_labor_cost: undefined,
        stone_weight: undefined,
        stone_price: undefined,
        isImported: false,
      });
    },
    removeItem(index) {
      this.orderForm.items.splice(index, 1);
    },
    updateSubCategories(row) {
      const parent = this.parentCategories.find(c => c.code === row.parent_code);
      row.subCategories = this.categories.filter(cat => cat.parent_id === (parent ? parent.id : null));
      row.item_code = '';
      row.name = '';
      if (row.subCategories.length > 0) {
        row.item_code = row.subCategories[0].code;
        this.updateItemName(row);
      }
    },
    updateItemName(row) {
      const subCategory = row.subCategories.find(sub => sub.code === row.item_code);
      if (subCategory) {
        row.name = subCategory.name;
      } else {
        row.name = '';
      }
    },
    updateWeight(row) {
      if (row.gold_weight !== undefined && row.pure_weight !== undefined) {
        this.$message.warning('金重和净金重只能录入一个');
        if (row.gold_weight > 0) row.pure_weight = undefined;
        else row.gold_weight = undefined;
      }
    },
    calculateTotalCost(item) {
      const weight = item.pure_weight === 0 || item.pure_weight === undefined ? (item.gold_weight || 0) : item.pure_weight;
      return (
        (weight * (item.labor_cost || 0)) +
        ((item.quantity || 0) * (item.extra_fee || 0)) +
        ((item.inlay_count || 0) * (item.inlay_labor_cost || 0)) +
        ((item.stone_weight || 0) * (item.stone_price || 0))
      );
    },
    calculateTotalAmount(item) {
      const weight = item.pure_weight === 0 || item.pure_weight === undefined ? (item.gold_weight || 0) : item.pure_weight;
      const totalCost = this.calculateTotalCost(item);
      return this.orderForm.settle_type === 'price'
        ? totalCost + (weight * (this.orderForm.gold_price || 0))
        : totalCost;
    },
    async saveOrder() {
      this.$refs.orderForm.validate(async valid => {
        if (valid) {
          this.orderForm.is_draft = false;
          this.orderForm.status = '待审核';
          try {
            const method = this.orderForm.id ? 'put' : 'post';
            const url = this.orderForm.id ? `/inboundOrders/${this.orderForm.id}` : '/inboundOrders';
            await this.$axios[method](url, this.orderForm);
            this.$message.success('保存成功');
            this.orderSaved = true;
            this.showLabelPreview();
            this.fetchInboundOrders();
          } catch (err) {
            this.$message.error('保存失败');
          }
        }
      });
    },
    async saveDraft() {
      this.$refs.orderForm.validate(async valid => {
        if (valid) {
          this.orderForm.is_draft = true;
          this.orderForm.status = '待审核';
          try {
            const method = this.orderForm.id ? 'put' : 'post';
            const url = this.orderForm.id ? `/inboundOrders/${this.orderForm.id}` : '/inboundOrders';
            await this.$axios[method](url, this.orderForm);
            this.$message.success('草稿保存成功');
            this.orderSaved = false;
            this.fetchInboundOrders();
          } catch (err) {
            this.$message.error('保存草稿失败');
          }
        }
      });
    },
    async approveOrder(row) {
      try {
        row.status = '已审核';
        await this.$axios.put(`/inboundOrders/${row.id}`, row);
        this.$message.success('审核成功');
        this.fetchInboundOrders();
      } catch (err) {
        this.$message.error('审核失败');
      }
    },
    async returnOrder(row) {
      this.$confirm('确定退货此入库单吗？此操作将调整库存和对账单。', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }).then(async () => {
        try {
          row.status = '已退货';
          await this.$axios.put(`/inboundOrders/${row.id}`, row);
          this.$message.success('退货成功');
          this.fetchInboundOrders();
        } catch (err) {
          this.$message.error('退货失败');
        }
      }).catch(() => {
        this.$message.info('已取消退货');
      });
    },
    showLabelPreview() {
      if (!this.selectedTemplate) {
        this.$message.warning('请先选择一个标签模板');
        return;
      }
      this.labelPreviewVisible = true;
      this.$nextTick(() => this.renderPreview());
    },
    closeLabelPreview() {
      this.labelPreviewVisible = false;
    },
    renderPreview() {
      const previewContainer = document.getElementById('label-preview');
      previewContainer.innerHTML = '';
      previewContainer.style.gridTemplateColumns = `repeat(${this.labelsPerRow}, 200px)`;
      previewContainer.style.gridGap = `${this.labelSpacing}px`;

      this.orderForm.items.forEach(item => {
        const canvas = document.createElement('canvas');
        JsBarcode(canvas, item.barcode, { width: 2, height: 30, displayValue: false });
        const barcodeDataUrl = canvas.toDataURL('image/png');
        const goldWeight = item.gold_weight === 0 ? item.pure_weight : item.gold_weight;

        const labelDiv = document.createElement('div');
        labelDiv.style.width = '200px';
        labelDiv.style.height = '100px';
        labelDiv.style.border = '1px solid #000';
        labelDiv.style.padding = '5px';
        labelDiv.style.position = 'relative';
        labelDiv.style.fontSize = '12px';

        const barcodeImg = document.createElement('img');
        barcodeImg.src = barcodeDataUrl;
        barcodeImg.style.position = 'absolute';
        barcodeImg.style.cssText += this.getBarcodePositionStyle(this.selectedTemplate.barcode_position);
        labelDiv.appendChild(barcodeImg);

        const contentDiv = document.createElement('div');
        contentDiv.style.marginTop = '35px';
        contentDiv.innerHTML = `
          <p>金重: ${goldWeight || 0}g</p>
          <p>镶嵌位: ${item.inlay_count || 0}</p>
          <p>石重: ${item.stone_weight || 0}ct</p>
          <p>执行标准: ${this.selectedTemplate.standard || ''}</p>
          <p>厂商信息: ${this.selectedTemplate.vendor_info || ''}</p>
          <p>产品信息: ${this.selectedTemplate.product_info || ''}</p>
        `;
        labelDiv.appendChild(contentDiv);

        previewContainer.appendChild(labelDiv);
      });
    },
    async printLabels() {
      if (!this.selectedTemplate) {
        this.$message.warning('请先选择一个标签模板');
        return;
      }
      const printWindow = window.open('', '_blank');
      const doc = printWindow.document;
      const body = doc.body;

      body.style.display = 'grid';
      body.style.gridTemplateColumns = `repeat(${this.labelsPerRow}, 200px)`;
      body.style.gridGap = `${this.labelSpacing}px`;
      body.style.padding = '10px';

      this.orderForm.items.forEach(item => {
        const canvas = document.createElement('canvas');
        JsBarcode(canvas, item.barcode, { width: 2, height: 30, displayValue: false });
        const barcodeDataUrl = canvas.toDataURL('image/png');
        const goldWeight = item.gold_weight === 0 ? item.pure_weight : item.gold_weight;

        const labelDiv = doc.createElement('div');
        labelDiv.style.width = '200px';
        labelDiv.style.height = '100px';
        labelDiv.style.border = '1px solid #000';
        labelDiv.style.padding = '5px';
        labelDiv.style.position = 'relative';
        labelDiv.style.fontSize = '12px';

        const barcodeImg = doc.createElement('img');
        barcodeImg.src = barcodeDataUrl;
        barcodeImg.style.position = 'absolute';
        barcodeImg.style.cssText += this.getBarcodePositionStyle(this.selectedTemplate.barcode_position);
        labelDiv.appendChild(barcodeImg);

        const contentDiv = doc.createElement('div');
        contentDiv.style.marginTop = '35px';
        contentDiv.innerHTML = `
          <p>金重: ${goldWeight || 0}g</p>
          <p>镶嵌位: ${item.inlay_count || 0}</p>
          <p>石重: ${item.stone_weight || 0}ct</p>
          <p>执行标准: ${this.selectedTemplate.standard || ''}</p>
          <p>厂商信息: ${this.selectedTemplate.vendor_info || ''}</p>
          <p>产品信息: ${this.selectedTemplate.product_info || ''}</p>
        `;
        labelDiv.appendChild(contentDiv);

        body.appendChild(labelDiv);
      });

      const script = doc.createElement('script');
      script.text = 'window.print(); window.close();';
      body.appendChild(script);

      doc.close();
      this.labelPreviewVisible = false;
    },
    getBarcodePositionStyle(position) {
      switch (position) {
        case 'left-top': return 'top: 5px; left: 5px;';
        case 'right-top': return 'top: 5px; right: 5px;';
        case 'left-bottom': return 'bottom: 5px; left: 5px;';
        case 'right-bottom': return 'bottom: 5px; right: 5px;';
        default: return 'top: 5px; left: 5px;';
      }
    },
    copyBarcode(barcode) {
      navigator.clipboard.writeText(barcode).then(() => {
        this.$message.success('条形码已复制到剪贴板');
      }).catch(err => {
        this.$message.error('复制失败');
        console.error('Failed to copy barcode:', err);
      });
    },
    importItemsFromExcel(event) {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        jsonData.forEach(row => {
          const item = {
            barcode: row['条形码'] || generateEAN13(),
            parent_code: row['父类编码'] || '',
            item_code: row['产品编码'] || '',
            name: row['产品名称'] || '',
            subCategories: [],
            gold_weight: parseFloat(row['金重']) || undefined,
            pure_weight: parseFloat(row['净金重']) || undefined,
            labor_cost: parseFloat(row['工费']) || undefined,
            quantity: parseInt(row['件数']) || 1,
            extra_fee: parseFloat(row['附加费']) || undefined,
            inlay_count: parseInt(row['镶嵌位']) || 0,
            inlay_labor_cost: parseFloat(row['镶嵌工费']) || undefined,
            stone_weight: parseFloat(row['石重']) || undefined,
            stone_price: parseFloat(row['石价']) || undefined,
            isImported: true,
          };
          if (this.orderForm.items.some(i => i.barcode === item.barcode)) {
            this.$message.warning(`条形码 ${item.barcode} 已存在，跳过此项`);
          } else {
            this.updateSubCategories(item);
            this.orderForm.items.push(item);
            this.updateItemName(item);
          }
        });
        this.$message.success('导入成功');
        this.$refs.fileInput.value = '';
      };
      reader.readAsArrayBuffer(file);
    },
    viewOrder(row) {
      this.activeTab = 'add';
      this.orderSaved = true;
      this.orderForm = { ...row };
      this.orderForm.items.forEach(item => this.updateSubCategories(item));
    },
    formatSupplier(row) {
      const supplier = this.suppliers.find(s => s.id === row.supplier_id);
      return supplier ? supplier.short_name : '';
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
.custom-table .el-table__body-wrapper {
  padding-bottom: 10px;
}
.summary {
  font-size: 14px;
  color: #606266;
}
.el-button--small {
  padding: 8px 15px;
}
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
.barcode-container {
  display: flex;
  align-items: center;
}
</style>