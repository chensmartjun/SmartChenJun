<template>
  <div class="module-container">
    <el-tabs v-model="activeTab" @tab-click="handleTabChange">
      <el-tab-pane label="新增出库" name="add">
        <div class="operation-bar">
          <el-button type="primary" size="small" round @click="addOrder">新建出库单</el-button>
          <el-button type="success" size="small" round @click="saveOrder" :disabled="!orderForm.order_number">保存</el-button>
          <el-button size="small" round @click="resetForm" :disabled="!orderForm.order_number">取消</el-button>
          <el-button type="primary" size="small" round @click="printVoucherSimple" :disabled="!orderSaved">打印简约版</el-button>
          <el-button type="primary" size="small" round @click="printVoucherDetailed" :disabled="!orderSaved">打印详细版</el-button>
        </div>
        <div class="form-section">
          <el-form :model="orderForm" :rules="rules" ref="orderForm" label-width="80px" size="small">
            <el-row :gutter="10">
              <el-col :span="6">
                <el-form-item label="出库单号" prop="order_number">
                  <el-input v-model="orderForm.order_number" disabled placeholder="保存后生成"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="日期" prop="date">
                  <el-date-picker v-model="orderForm.date" type="datetime" disabled placeholder="自动生成"></el-date-picker>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="客户" prop="customer_id">
                  <el-select v-model="orderForm.customer_id" placeholder="选择客户" :disabled="!orderForm.order_number" @change="updateCustomerInfo" style="width: 100%;">
                    <el-option v-for="customer in customers" :key="customer.id" :label="customer.name" :value="customer.id"></el-option>
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
                <el-form-item label="存欠板料">
                  <el-input v-model="orderForm.debt_material" disabled placeholder="自动计算"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="存欠工费">
                  <el-input v-model="orderForm.debt_labor" disabled placeholder="自动计算"></el-input>
                </el-form-item>
              </el-col>
            </el-row>
            <el-table :data="orderForm.items" border stripe size="small" style="margin-top: 10px;" class="custom-table">
              <el-table-column type="selection" width="40"></el-table-column>
              <el-table-column label="序号" type="index" width="40"></el-table-column>
              <el-table-column prop="barcode" label="条形码" width="150">
                <template v-slot="{ row, $index }">
                  <el-input
                    v-model="row.barcode"
                    :disabled="row.isLocked"
                    size="small"
                    placeholder="扫描条形码"
                    :ref="`barcodeInput${$index}`"
                    @input="handleBarcodeInput($index, $event)"
                    @keyup.enter="processBarcode($index)"
                    style="width: 100%;"
                  ></el-input>
                </template>
              </el-table-column>
              <el-table-column prop="parent_code" label="产品编码" width="100" :formatter="formatParentCode"></el-table-column>
              <el-table-column prop="item_code" label="产品名称" width="150" :formatter="formatItemName"></el-table-column>
              <el-table-column prop="quantity" label="出库数量" width="80">
                <template v-slot="{ row }">
                  <el-input-number v-model="row.quantity" :step="1" :min="1" :controls="false" size="small" :disabled="!orderForm.order_number"></el-input-number>
                </template>
              </el-table-column>
              <el-table-column prop="gold_weight" label="金重" width="80"></el-table-column>
              <el-table-column prop="pure_weight" label="净金重" width="80"></el-table-column>
              <el-table-column prop="labor_cost" label="工费" width="80"></el-table-column>
              <el-table-column prop="extra_fee" label="附加费" width="80"></el-table-column>
              <el-table-column prop="inlay_count" label="镶嵌位" width="80"></el-table-column>
              <el-table-column prop="inlay_labor_cost" label="镶嵌工费" width="80"></el-table-column>
              <el-table-column prop="stone_weight" label="石重(ct)" width="80"></el-table-column>
              <el-table-column prop="stone_price" label="石价" width="80"></el-table-column>
              <el-table-column label="操作" width="80">
                <template v-slot="{ $index }">
                  <el-button type="danger" size="small" round @click="removeItem($index)" :disabled="!orderForm.order_number">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
            <div class="summary" style="margin-top: 10px;">
              <el-row :gutter="10">
                <el-col :span="6">总件数: {{ totalQuantity }}</el-col>
                <el-col :span="6">总金重: {{ totalGoldWeight }}</el-col>
                <el-col :span="6">总工费: {{ totalLaborCost }}</el-col>
                <el-col :span="6">总金额: {{ totalAmount }}</el-col>
              </el-row>
            </div>
          </el-form>
        </div>
      </el-tab-pane>
      <el-tab-pane label="记录查询" name="query">
        <div class="filter-bar">
          <el-form :inline="true" :model="queryForm" size="small">
            <el-form-item label="出库单号">
              <el-input v-model="queryForm.order_number" placeholder="请输入出库单号" clearable @input="fetchOutboundOrders"></el-input>
            </el-form-item>
            <el-form-item label="条形码">
              <el-input v-model="queryForm.barcode" placeholder="请输入条形码" clearable @input="fetchOutboundOrders"></el-input>
            </el-form-item>
            <el-form-item label="客户">
              <el-select v-model="queryForm.customer_id" placeholder="选择客户" clearable @change="fetchOutboundOrders" style="width: 150px;">
                <el-option v-for="customer in customers" :key="customer.id" :label="customer.name" :value="customer.id"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="柜台">
              <el-select v-model="queryForm.counter_id" placeholder="选择柜台" clearable @change="fetchOutboundOrders" style="width: 150px;">
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
                @change="fetchOutboundOrders"
                style="width: 220px;"
              ></el-date-picker>
            </el-form-item>
          </el-form>
        </div>
        <el-table :data="outboundOrders" border stripe size="small" v-loading="loading" style="margin-top: 10px;" class="custom-table">
          <el-table-column prop="order_number" label="出库单号" width="120"></el-table-column>
          <el-table-column prop="date" label="日期时间" :formatter="dateTimeFormatter" width="180"></el-table-column>
          <el-table-column prop="customer_id" label="客户" :formatter="formatCustomer" width="100"></el-table-column>
          <el-table-column prop="counter_id" label="柜台" :formatter="formatCounter" width="100"></el-table-column>
          <el-table-column prop="status" label="状态" width="80"></el-table-column>
          <el-table-column label="操作" width="200">
            <template v-slot="{ row }">
              <el-button type="primary" size="small" @click="viewOrder(row)">查看</el-button>
              <el-button type="success" size="small" @click="approveOrder(row)" v-if="row.status === '待审核'">审核</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination
          @current-change="fetchOutboundOrders"
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
export default {
  name: 'OutboundOrderList',
  data() {
    return {
      activeTab: 'add',
      outboundOrders: [],
      customers: [],
      counters: [],
      categories: [],
      parentCategories: [],
      orderSaved: false,
      orderForm: {
        order_number: '',
        date: new Date(),
        customer_id: null,
        counter_id: null,
        settle_type: 'material',
        gold_price: 0,
        debt_material: 0,
        debt_labor: 0,
        items: [],
        status: '待审核',
      },
      queryForm: {
        order_number: '',
        barcode: '',
        customer_id: null,
        counter_id: null,
        date_range: null,
      },
      rules: {
        customer_id: [{ required: true, message: '请选择客户', trigger: 'change' }],
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
    totalQuantity() {
      return this.orderForm.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    },
    totalGoldWeight() {
      return this.orderForm.items.reduce((sum, item) => sum + (item.gold_weight || 0), 0).toFixed(2);
    },
    totalLaborCost() {
      return this.orderForm.items.reduce((sum, item) => sum + (item.labor_cost || 0) * (item.quantity || 0), 0).toFixed(2);
    },
    totalExtraFee() {
      return this.orderForm.items.reduce((sum, item) => sum + (item.extra_fee || 0) * (item.quantity || 0), 0).toFixed(2);
    },
    totalAmount() {
      const total = this.orderForm.items.reduce((sum, item) => {
        const weight = item.pure_weight === 0 || item.pure_weight === undefined ? (item.gold_weight || 0) : item.pure_weight;
        const cost = (weight * (item.labor_cost || 0)) +
                     ((item.quantity || 0) * (item.extra_fee || 0)) +
                     ((item.inlay_count || 0) * (item.inlay_labor_cost || 0)) +
                     ((item.stone_weight || 0) * (item.stone_price || 0));
        return this.orderForm.settle_type === 'price'
          ? sum + cost + (weight * (this.orderForm.gold_price || 0))
          : sum + cost;
      }, 0);
      return total.toFixed(2);
    },
  },
  mounted() {
    this.fetchOutboundOrders();
    this.fetchCustomers();
    this.fetchCounters();
    this.fetchCategories();
  },
  methods: {
    handleTabChange(tab) {
      this.activeTab = tab.name;
    },
    async fetchOutboundOrders() {
      this.loading = true;
      try {
        const params = {
          _page: this.page,
          _limit: this.size,
          order_number_like: this.queryForm.order_number || undefined,
          customer_id: this.queryForm.customer_id || undefined,
          counter_id: this.queryForm.counter_id || undefined,
        };
        if (this.queryForm.barcode) {
          params['items.barcode_like'] = this.queryForm.barcode;
        }
        if (this.queryForm.date_range && this.queryForm.date_range.length === 2) {
          const [start, end] = this.queryForm.date_range;
          params.date_gte = start.toISOString().split('T')[0];
          params.date_lte = end.toISOString().split('T')[0];
        }
        const res = await this.$axios.get('/outboundOrders', { params });
        this.outboundOrders = res.data || [];
        this.total = parseInt(res.headers['x-total-count']) || res.data.length;
      } catch (err) {
        this.$message.error('加载出库记录失败');
        console.error('Fetch outbound orders error:', err);
      } finally {
        this.loading = false;
      }
    },
    async fetchCustomers() {
      try {
        const res = await this.$axios.get('/customers');
        this.customers = res.data || [];
      } catch (err) {
        this.$message.error('加载客户失败');
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
      } catch (err) {
        this.$message.error('加载分类失败');
      }
    },
    async fetchStockByBarcode(barcode) {
      try {
        const res = await this.$axios.get('/inboundOrders', { params: { 'items.barcode': barcode } });
        const orders = res.data || [];
        for (const order of orders) {
          if (order.items && Array.isArray(order.items)) {
            const item = order.items.find(i => i.barcode === barcode);
            if (item) {
              const customer = this.customers.find(c => c.id === this.orderForm.customer_id);
              const template = customer?.sales_template;
              return {
                barcode: item.barcode,
                parent_code: item.parent_code,
                item_code: item.item_code,
                name: this.formatItemName(item),
                subCategories: this.categories.filter(cat => cat.parent_id === this.parentCategories.find(c => c.code === item.parent_code)?.id),
                quantity: 1,
                gold_weight: item.gold_weight || 0,
                pure_weight: item.pure_weight || 0,
                labor_cost: template ? template.labor_cost : item.labor_cost || 0,
                extra_fee: template ? template.extra_fee : item.extra_fee || 0,
                inlay_count: item.inlay_count || 0,
                inlay_labor_cost: template ? template.inlay_labor_cost : item.inlay_labor_cost || 0,
                stone_weight: item.stone_weight || 0,
                stone_price: template ? template.stone_price : item.stone_price || 0,
                isLocked: true,
              };
            }
          }
        }
        this.$message.warning('未找到匹配的库存');
        return null;
      } catch (err) {
        this.$message.error('查询库存失败');
        console.error('Fetch stock by barcode error:', err);
        return null;
      }
    },
    addOrder() {
      this.orderForm = {
        order_number: `OUT${Date.now()}`,
        date: new Date(),
        customer_id: null,
        counter_id: null,
        settle_type: 'material',
        gold_price: 0,
        debt_material: 0,
        debt_labor: 0,
        items: [],
        status: '待审核',
      };
      this.orderSaved = false;
      this.addItem();
    },
    resetForm() {
      this.orderForm = {
        order_number: '',
        date: new Date(),
        customer_id: null,
        counter_id: null,
        settle_type: 'material',
        gold_price: 0,
        debt_material: 0,
        debt_labor: 0,
        items: [],
        status: '待审核',
      };
      this.orderSaved = false;
    },
    addItem() {
      this.orderForm.items.push({
        barcode: '',
        parent_code: '',
        item_code: '',
        name: '',
        subCategories: [],
        quantity: 1,
        gold_weight: 0,
        pure_weight: 0,
        labor_cost: 0,
        extra_fee: 0,
        inlay_count: 0,
        inlay_labor_cost: 0,
        stone_weight: 0,
        stone_price: 0,
        isLocked: false,
      });
    },
    handleBarcodeInput(index, value) {
      const fixedLength = 13;
      if (value.length === fixedLength) {
        this.processBarcode(index);
      }
    },
    async processBarcode(index) {
      const barcode = this.orderForm.items[index]?.barcode;
      if (barcode && !this.orderForm.items[index].isLocked) {
        if (this.orderForm.items.some((item, i) => i !== index && item.barcode === barcode && item.isLocked)) {
          this.$message.error('该条形码已存在，请勿重复添加');
          return;
        }
        const item = await this.fetchStockByBarcode(barcode);
        if (item) {
          this.orderForm.items[index] = item;
          this.addItem();
          this.$nextTick(() => {
            const newIndex = this.orderForm.items.length - 1;
            this.$refs[`barcodeInput${newIndex}`][0].focus();
          });
        }
      }
    },
    removeItem(index) {
      this.orderForm.items.splice(index, 1);
    },
    updateCustomerInfo() {
      const customer = this.customers.find(c => c.id === this.orderForm.customer_id);
      if (customer) {
        this.orderForm.debt_material = customer.debt_material || 0;
        this.orderForm.debt_labor = customer.debt_labor || 0;
      } else {
        this.orderForm.debt_material = 0;
        this.orderForm.debt_labor = 0;
      }
    },
    async saveOrder() {
      this.$refs.orderForm.validate(async valid => {
        if (valid) {
          try {
            this.orderForm.items = this.orderForm.items.filter(item => item.barcode && item.isLocked);
            const customer = this.customers.find(c => c.id === this.orderForm.customer_id);
            if (customer) {
              customer.debt_material = (customer.debt_material || 0) + parseFloat(this.totalGoldWeight);
              customer.debt_labor = (customer.debt_labor || 0) + parseFloat(this.totalLaborCost) + parseFloat(this.totalExtraFee);
              await this.$axios.put(`/customers/${customer.id}`, customer);
            }
            const method = this.orderForm.id ? 'put' : 'post';
            const url = this.orderForm.id ? `/outboundOrders/${this.orderForm.id}` : '/outboundOrders';
            await this.$axios[method](url, this.orderForm);
            this.$message.success('保存成功');
            this.orderSaved = true;
            this.fetchOutboundOrders();
          } catch (err) {
            this.$message.error('保存失败');
            console.error('Save order error:', err);
          }
        }
      });
    },
    async approveOrder(row) {
      try {
        row.status = '已审核';
        await this.$axios.put(`/outboundOrders/${row.id}`, row);
        this.$message.success('审核成功');
        this.fetchOutboundOrders();
      } catch (err) {
        this.$message.error('审核失败');
      }
    },
    viewOrder(row) {
      this.activeTab = 'add';
      this.orderForm = { ...row };
      this.orderSaved = true;
    },
    printVoucherSimple() {
      if (!this.orderSaved) {
        this.$message.warning('请先保存订单');
        return;
      }
      const printWindow = window.open('', '_blank');
      const doc = printWindow.document;
      const htmlContent = `
        <html>
          <head>
            <title>销售出库单（简约版）</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                margin: 20px;
                font-size: 12px;
              }
              .container {
                max-width: 800px;
                margin: 0 auto;
                border: 1px solid #000;
                padding: 20px;
              }
              .header {
                text-align: center;
                border-bottom: 1px solid #000;
                padding-bottom: 10px;
                margin-bottom: 20px;
              }
              .info {
                display: flex;
                justify-content: space-between;
                margin-bottom: 20px;
              }
              .table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
              }
              .table th, .table td {
                border: 1px solid #000;
                padding: 8px;
                text-align: center;
              }
              .table th {
                background-color: #f0f0f0;
              }
              .summary {
                display: flex;
                justify-content: space-between;
                border-top: 1px solid #000;
                padding-top: 10px;
                margin-top: 20px;
              }
              .footer {
                display: flex;
                justify-content: space-between;
                margin-top: 20px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>销售出库单（简约版）</h2>
                <p>公司名称: 示例珠宝有限公司</p>
              </div>
              <div class="info">
                <div>
                  <p>出库单号: ${this.orderForm.order_number}</p>
                  <p>客户: ${this.formatCustomer(this.orderForm)}</p>
                  <p>柜台: ${this.formatCounter(this.orderForm)}</p>
                </div>
                <div style="text-align: right;">
                  <p>日期: ${this.dateTimeFormatter(this.orderForm)}</p>
                  <p>结算方式: ${this.orderForm.settle_type === 'price' ? '结价' : '结料'}</p>
                </div>
              </div>
              <table class="table">
                <thead>
                  <tr>
                    <th>条形码</th>
                    <th>产品编码</th>
                    <th>产品名称</th>
                    <th>数量</th>
                    <th>金重</th>
                    <th>附加费</th>
                    <th>总金额</th>
                  </tr>
                </thead>
                <tbody>
                  ${this.orderForm.items.map(item => `
                    <tr>
                      <td>${item.barcode}</td>
                      <td>${this.formatParentCode(item)}</td>
                      <td>${this.formatItemName(item)}</td>
                      <td>${item.quantity}</td>
                      <td>${item.gold_weight}</td>
                      <td>${(parseFloat(item.extra_fee || 0) + (item.inlay_count || 0) * (item.inlay_labor_cost || 0)).toFixed(2)}</td>
                      <td>${this.calculateItemTotal(item)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              <div class="summary">
                <div>
                  <p>总件数: ${this.totalQuantity}</p>
                  <p>总金重: ${this.totalGoldWeight}</p>
                </div>
                <div style="text-align: right;">
                  <p>总工费: ${this.totalLaborCost}</p>
                  <p>总金额: ${this.totalAmount}</p>
                </div>
              </div>
              <div class="footer">
                <p>经办人: ____________________</p>
                <p>客户签字: ____________________</p>
              </div>
            </div>
          </body>
        </html>
      `;
      doc.open();
      doc.write(htmlContent);
      doc.close();
      printWindow.onload = () => {
        printWindow.print();
        printWindow.close();
      };
    },
    printVoucherDetailed() {
      if (!this.orderSaved) {
        this.$message.warning('请先保存订单');
        return;
      }
      const printWindow = window.open('', '_blank');
      const doc = printWindow.document;
      const htmlContent = `
        <html>
          <head>
            <title>销售出库单（详细版）</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                margin: 20px;
                font-size: 12px;
              }
              .container {
                max-width: 1000px;
                margin: 0 auto;
                border: 1px solid #000;
                padding: 20px;
              }
              .header {
                text-align: center;
                border-bottom: 1px solid #000;
                padding-bottom: 10px;
                margin-bottom: 20px;
              }
              .info {
                display: flex;
                justify-content: space-between;
                margin-bottom: 20px;
              }
              .table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
              }
              .table th, .table td {
                border: 1px solid #000;
                padding: 8px;
                text-align: center;
              }
              .table th {
                background-color: #f0f0f0;
              }
              .summary {
                display: flex;
                justify-content: space-between;
                border-top: 1px solid #000;
                padding-top: 10px;
                margin-top: 20px;
              }
              .footer {
                display: flex;
                justify-content: space-between;
                margin-top: 20px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>销售出库单（详细版）</h2>
                <p>公司名称: 示例珠宝有限公司</p>
              </div>
              <div class="info">
                <div>
                  <p>出库单号: ${this.orderForm.order_number}</p>
                  <p>客户: ${this.formatCustomer(this.orderForm)}</p>
                  <p>柜台: ${this.formatCounter(this.orderForm)}</p>
                </div>
                <div style="text-align: right;">
                  <p>日期: ${this.dateTimeFormatter(this.orderForm)}</p>
                  <p>结算方式: ${this.orderForm.settle_type === 'price' ? '结价' : '结料'}</p>
                </div>
              </div>
              <table class="table">
                <thead>
                  <tr>
                    <th>条形码</th>
                    <th>产品编码</th>
                    <th>产品名称</th>
                    <th>数量</th>
                    <th>金重</th>
                    <th>净金重</th>
                    <th>工费</th>
                    <th>附加费</th>
                    <th>镶嵌位</th>
                    <th>镶嵌工费</th>
                    <th>石重(ct)</th>
                    <th>石价</th>
                    <th>总金额</th>
                  </tr>
                </thead>
                <tbody>
                  ${this.orderForm.items.map(item => `
                    <tr>
                      <td>${item.barcode}</td>
                      <td>${this.formatParentCode(item)}</td>
                      <td>${this.formatItemName(item)}</td>
                      <td>${item.quantity}</td>
                      <td>${item.gold_weight}</td>
                      <td>${item.pure_weight}</td>
                      <td>${item.labor_cost}</td>
                      <td>${item.extra_fee}</td>
                      <td>${item.inlay_count}</td>
                      <td>${item.inlay_labor_cost}</td>
                      <td>${item.stone_weight}</td>
                      <td>${item.stone_price}</td>
                      <td>${this.calculateItemTotal(item)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              <div class="summary">
                <div>
                  <p>总件数: ${this.totalQuantity}</p>
                  <p>总金重: ${this.totalGoldWeight}</p>
                </div>
                <div style="text-align: right;">
                  <p>总工费: ${this.totalLaborCost}</p>
                  <p>总金额: ${this.totalAmount}</p>
                </div>
              </div>
              <div class="footer">
                <p>经办人: ____________________</p>
                <p>客户签字: ____________________</p>
              </div>
            </div>
          </body>
        </html>
      `;
      doc.open();
      doc.write(htmlContent);
      doc.close();
      printWindow.onload = () => {
        printWindow.print();
        printWindow.close();
      };
    },
    calculateItemTotal(item) {
      const weight = item.pure_weight === 0 || item.pure_weight === undefined ? (item.gold_weight || 0) : item.pure_weight;
      const cost = (weight * (item.labor_cost || 0)) +
                   ((item.quantity || 0) * (item.extra_fee || 0)) +
                   ((item.inlay_count || 0) * (item.inlay_labor_cost || 0)) +
                   ((item.stone_weight || 0) * (item.stone_price || 0));
      return this.orderForm.settle_type === 'price'
        ? (cost + (weight * (this.orderForm.gold_price || 0))).toFixed(2)
        : cost.toFixed(2);
    },
    formatCustomer(row) {
      const customer = this.customers.find(c => c.id === row.customer_id);
      return customer ? customer.name : '';
    },
    formatCounter(row) {
      const counter = this.counters.find(c => c.id === row.counter_id);
      return counter ? counter.name : '';
    },
    formatParentCode(row) {
      const category = this.parentCategories.find(c => c.code === row.parent_code);
      return category ? `${category.code} ${category.name}` : row.parent_code;
    },
    formatItemName(row) {
      const subCategory = this.categories.find(c => c.code === row.item_code);
      return subCategory ? `${subCategory.code} ${subCategory.name}` : row.item_code;
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
</style>