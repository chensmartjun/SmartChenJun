const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const { Sequelize, DataTypes } = require('sequelize');
const cors = require('cors');
const path = require('path');
const XLSX = require('xlsx');
const { format } = require('date-fns');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());
// 启用静态文件服务，服务 public 目录
app.use(express.static(path.join(__dirname, 'public')));

// 增强路由支持，确保所有 .html 文件可访问
app.get('*.html', (req, res) => {
  const filePath = path.join(__dirname, 'public', req.path);
  res.sendFile(filePath, (err) => {
    if (err) {
      res.status(404).send('页面未找到');
    }
  });
});

// 定义默认路由，重定向到 payment.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'payment.html'));
});

const sequelize = new Sequelize('chj_erp', 'root', 'Smart135246@@', {
  host: 'localhost',
  dialect: 'mysql',
});

sequelize.authenticate()
  .then(() => console.log('Connected to MySQL Server!'))
  .catch(err => console.error('Unable to connect to the database:', err));

const Supplier = sequelize.define('Suppliers', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  code: { type: DataTypes.STRING, allowNull: true },
  short_name: { type: DataTypes.STRING, allowNull: false },
  full_name: { type: DataTypes.STRING, allowNull: false },
  tax_id: { type: DataTypes.STRING, allowNull: true },
  legal_person: { type: DataTypes.STRING, allowNull: true },
  contact: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING, allowNull: true },
  wechat: { type: DataTypes.STRING, allowNull: true },
}, { tableName: 'suppliers', timestamps: false });

const Customer = sequelize.define('Customers', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  code: { type: DataTypes.STRING, allowNull: true },
  short_name: { type: DataTypes.STRING, allowNull: false },
  full_name: { type: DataTypes.STRING, allowNull: false },
  tax_id: { type: DataTypes.STRING, allowNull: true },
  legal_person: { type: DataTypes.STRING, allowNull: true },
  contact: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING, allowNull: true },
  wechat: { type: DataTypes.STRING, allowNull: true },
  sales_template_id: { type: DataTypes.INTEGER, allowNull: true },
}, { tableName: 'customers', timestamps: false });

const Counter = sequelize.define('Counters', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  code: { type: DataTypes.STRING, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
}, { tableName: 'counters', timestamps: false });

const Staff = sequelize.define('Staff', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  code: { type: DataTypes.STRING, allowNull: true },
  name: { type: DataTypes.STRING, allowNull: false },
  id_number: { type: DataTypes.STRING, allowNull: false },
  id_card: { type: DataTypes.STRING, allowNull: true },
  phone: { type: DataTypes.STRING, allowNull: false },
  id_address: { type: DataTypes.STRING, allowNull: true },
  contact_address: { type: DataTypes.STRING, allowNull: true },
  education: { type: DataTypes.STRING, allowNull: true },
  school: { type: DataTypes.STRING, allowNull: true },
  performance_type: { type: DataTypes.STRING, allowNull: true },
  performance_rate: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
}, { tableName: 'staff', timestamps: false });

const User = sequelize.define('Users', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  username: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.STRING, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
}, { tableName: 'users', timestamps: false });

const Category = sequelize.define('Categories', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  code: { type: DataTypes.STRING, allowNull: true },
  name: { type: DataTypes.STRING, allowNull: false },
  parent_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'Categories', key: 'id' },
    onDelete: 'CASCADE',
  },
  description: { type: DataTypes.TEXT, allowNull: true },
}, { tableName: 'categories', timestamps: false });

const SalesTemplate = sequelize.define('SalesTemplates', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  template_name: { type: DataTypes.STRING, allowNull: false, unique: true },
}, { tableName: 'sales_templates', timestamps: false });

const SalesTemplateDetail = sequelize.define('SalesTemplateDetails', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  template_id: { type: DataTypes.INTEGER, allowNull: false },
  category_id: { type: DataTypes.INTEGER, allowNull: false },
  labor_cost: { type: DataTypes.DECIMAL(10, 2), allowNull: true, defaultValue: 0 },
  extra_fee: { type: DataTypes.DECIMAL(10, 2), allowNull: true, defaultValue: 0 },
  inlay_labor_cost: { type: DataTypes.DECIMAL(10, 2), allowNull: true, defaultValue: 0 },
  stone_price: { type: DataTypes.DECIMAL(10, 2), allowNull: true, defaultValue: 0 },
}, { tableName: 'sales_template_details', timestamps: false });

const LabelTemplate = sequelize.define('LabelTemplates', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  barcode_position: { type: DataTypes.STRING, allowNull: true },
  gold_weight: { type: DataTypes.DECIMAL(10, 3), allowNull: true },
  standard: { type: DataTypes.STRING, allowNull: true },
}, { tableName: 'label_templates', timestamps: false });

const InboundOrder = sequelize.define('InboundOrders', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  order_number: { type: DataTypes.STRING, allowNull: false, unique: true },
  date: { type: DataTypes.DATE, allowNull: false },
  supplier_id: { type: DataTypes.INTEGER, allowNull: false },
  counter_id: { type: DataTypes.INTEGER, allowNull: false },
  settle_price: { type: DataTypes.BOOLEAN, defaultValue: false },
  settle_material: { type: DataTypes.BOOLEAN, defaultValue: false },
  total_weight: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0 },
  total_pure_weight: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0 },
  total_cost: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
}, { tableName: 'inbound_orders', timestamps: false });

const InboundOrderDetail = sequelize.define('InboundOrderDetails', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  order_id: { type: DataTypes.INTEGER, allowNull: false },
  barcode: { type: DataTypes.STRING, allowNull: false, unique: true },
  product_code: { type: DataTypes.STRING, allowNull: false },
  product_name: { type: DataTypes.STRING, allowNull: false },
  weight_type: { type: DataTypes.ENUM('weight', 'pure_weight'), allowNull: false, defaultValue: 'weight' },
  weight: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0 },
  pure_weight: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0 },
  labor_cost: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  quantity: { type: DataTypes.INTEGER, defaultValue: 1 },
  extra_fee: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  inlay_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  inlay_labor_cost: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  stone_weight: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0 },
  stone_price: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  total_cost: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
}, { tableName: 'inbound_order_details', timestamps: false });

const OutboundOrder = sequelize.define('OutboundOrders', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  order_number: { type: DataTypes.STRING, allowNull: false, unique: true },
  date: { type: DataTypes.DATE, allowNull: false },
  customer_id: { type: DataTypes.INTEGER, allowNull: false },
  counter_id: { type: DataTypes.INTEGER, allowNull: false },
  settle_price: { type: DataTypes.BOOLEAN, defaultValue: false },
  settle_material: { type: DataTypes.BOOLEAN, defaultValue: false },
  total_weight: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0 },
  total_pure_weight: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0 },
  total_cost: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
}, { tableName: 'outbound_orders', timestamps: false });

const OutboundOrderDetail = sequelize.define('OutboundOrderDetails', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  order_id: { type: DataTypes.INTEGER, allowNull: false },
  barcode: { type: DataTypes.STRING, allowNull: false },
  product_code: { type: DataTypes.STRING, allowNull: false },
  product_name: { type: DataTypes.STRING, allowNull: false },
  weight: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0 },
  pure_weight: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0 },
  labor_cost: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  quantity: { type: DataTypes.INTEGER, defaultValue: 1 },
  extra_fee: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  inlay_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  inlay_labor_cost: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  stone_weight: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0 },
  stone_price: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  gold_price: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  total_cost: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
}, { tableName: 'outbound_order_details', timestamps: false });

const ReturnOrder = sequelize.define('ReturnOrders', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  order_number: { type: DataTypes.STRING, allowNull: false, unique: true },
  date: { type: DataTypes.DATE, allowNull: false },
  type: { type: DataTypes.ENUM('customer', 'supplier'), allowNull: false },
  customer_id: { type: DataTypes.INTEGER, allowNull: true },
  supplier_id: { type: DataTypes.INTEGER, allowNull: true },
  total_weight: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0 },
  total_pure_weight: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0 },
  total_cost: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
}, { tableName: 'return_orders', timestamps: false });

const ReturnOrderDetail = sequelize.define('ReturnOrderDetails', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  order_id: { type: DataTypes.INTEGER, allowNull: false },
  barcode: { type: DataTypes.STRING, allowNull: false },
  product_code: { type: DataTypes.STRING, allowNull: false },
  product_name: { type: DataTypes.STRING, allowNull: false },
  weight: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0 },
  pure_weight: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0 },
  labor_cost: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  quantity: { type: DataTypes.INTEGER, defaultValue: 1 },
  extra_fee: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  inlay_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  inlay_labor_cost: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  stone_weight: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0 },
  stone_price: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  total_cost: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
}, { tableName: 'return_order_details', timestamps: false });

const Inventory = sequelize.define('Inventory', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  barcode: { type: DataTypes.STRING, allowNull: false, unique: true },
  product_code: { type: DataTypes.STRING, allowNull: true },
  product_name: { type: DataTypes.STRING, allowNull: false },
  weight: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0 },
  pure_weight: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0 },
  quantity: { type: DataTypes.INTEGER, defaultValue: 0 },
  counter_id: { type: DataTypes.INTEGER, allowNull: false },
  scanned_at: { type: DataTypes.DATE, allowNull: true },
}, { tableName: 'inventory', timestamps: false });

const MaterialInventory = sequelize.define('MaterialInventory', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  material_type: { type: DataTypes.STRING, allowNull: false },
  weight: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0 },
  updated_at: { type: DataTypes.DATE, allowNull: false },
}, { tableName: 'material_inventory', timestamps: false });

const PaymentRecord = sequelize.define('PaymentRecords', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  supplier_id: { type: DataTypes.INTEGER, allowNull: true },
  customer_id: { type: DataTypes.INTEGER, allowNull: true },
  payment_date: { type: DataTypes.DATE, allowNull: false },
  type: {
    type: DataTypes.ENUM(
      'income_material', 'expense_material', 'income_fee', 'expense_fee',
      'income_material_customer', 'expense_material_customer', 'income_fee_customer', 'expense_fee_customer'
    ),
    allowNull: false
  },
  amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  description: { type: DataTypes.STRING, allowNull: true },
  order_number: { type: DataTypes.STRING, allowNull: true },
}, { tableName: 'payment_records', timestamps: false });

const CustomerOwed = sequelize.define('CustomerOwed', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  customer_id: { type: DataTypes.INTEGER, allowNull: false },
  material_type: { type: DataTypes.STRING, allowNull: false },
  material_amount: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0 },
  labor_amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  updated_at: { type: DataTypes.DATE, allowNull: false },
}, { tableName: 'customer_owed', timestamps: false });

InboundOrder.hasMany(InboundOrderDetail, { foreignKey: 'order_id', as: 'InboundOrderDetails' });
InboundOrderDetail.belongsTo(InboundOrder, { foreignKey: 'order_id', as: 'order' });
InboundOrder.belongsTo(Supplier, { foreignKey: 'supplier_id', as: 'supplier' });
InboundOrder.belongsTo(Counter, { foreignKey: 'counter_id', as: 'counter' });

OutboundOrder.hasMany(OutboundOrderDetail, { foreignKey: 'order_id', as: 'OutboundOrderDetails' });
OutboundOrderDetail.belongsTo(OutboundOrder, { foreignKey: 'order_id', as: 'order' });
OutboundOrder.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
OutboundOrder.belongsTo(Counter, { foreignKey: 'counter_id', as: 'counter' });

ReturnOrder.hasMany(ReturnOrderDetail, { foreignKey: 'order_id', as: 'ReturnOrderDetails' });
ReturnOrderDetail.belongsTo(ReturnOrder, { foreignKey: 'order_id', as: 'order' });

SalesTemplate.hasMany(SalesTemplateDetail, { foreignKey: 'template_id', as: 'details' });
SalesTemplateDetail.belongsTo(SalesTemplate, { foreignKey: 'template_id', as: 'template' });

Inventory.hasOne(InboundOrderDetail, { foreignKey: 'barcode', sourceKey: 'barcode', as: 'inboundDetail' });
InboundOrderDetail.belongsTo(InboundOrder, { foreignKey: 'order_id', as: 'inboundOrder' });

PaymentRecord.belongsTo(Supplier, { foreignKey: 'supplier_id', as: 'supplier' });
PaymentRecord.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });

sequelize.sync()
  .then(() => {
    console.log('All tables created or already exist');
  })
  .catch(err => console.error('Error syncing tables:', err));

const initData = async () => {
  const customerCount = await Customer.count();
  if (customerCount === 0) {
    await Customer.create({ code: 'C001', short_name: '客户A', full_name: '全称A', contact: '张三' });
    console.log('Initialized customer data');
  }
  const staffCount = await Staff.count();
  if (staffCount === 0) {
    await Staff.create({ name: '员工1', id_number: '123456789012', phone: '13812345678' });
    console.log('Initialized staff data');
  }
  const userCount = await User.count();
  if (userCount === 0) {
    await User.create({ username: 'admin', password: 'admin123', role: 'admin', name: '管理员' });
    console.log('Initialized user data');
  }
  const categoryCount = await Category.count();
  if (categoryCount === 0) {
    await Category.create({ name: '测试类别' });
    console.log('Initialized category data');
  }
  const labelTemplateCount = await LabelTemplate.count();
  if (labelTemplateCount === 0) {
    await LabelTemplate.create({ barcode_position: 'TOP_LEFT', gold_weight: 5.000, standard: '标准A' });
    console.log('Initialized label template data');
  }
};
sequelize.sync().then(() => {
  initData().catch(err => console.error('Init data failed:', err));
});

const paginate = async (model, page, size, options = {}) => {
  const offset = (page - 1) * size;
  const result = await model.findAndCountAll({
    offset,
    limit: size,
    ...options
  });
  return {
    data: result.rows,
    total: result.count,
  };
};

const generateOrderNumber = async (prefix, model) => {
  const today = format(new Date(), 'yyyyMMdd');
  const count = await model.count({ where: { order_number: { [Sequelize.Op.like]: `${prefix}${today}%` } } });
  return `${prefix}${today}${String(count + 1).padStart(4, '0')}`;
};

const generatePaymentNumber = async () => {
  const today = format(new Date(), 'yyyyMMdd');
  const count = await PaymentRecord.count({ where: { order_number: { [Sequelize.Op.like]: `PAY-${today}%` } } });
  return `PAY-${today}-${String(count + 1).padStart(4, '0')}`;
};

const generateEAN13 = () => {
  const base = Math.floor(100000000000 + Math.random() * 900000000000).toString();
  const digits = base.split('').map(Number);
  const sum = digits.reduce((acc, digit, index) => acc + digit * (index % 2 === 0 ? 1 : 3), 0);
  const checksum = (10 - (sum % 10)) % 10;
  return base + checksum;
};

app.get('/api/suppliers', async (req, res) => {
  const { page = 1, size = 10 } = req.query;
  try {
    const result = await paginate(Supplier, parseInt(page), parseInt(size));
    res.json(result);
  } catch (err) {
    console.error('Suppliers query failed:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/suppliers', async (req, res) => {
  const { code, short_name, full_name, tax_id, legal_person, contact, phone, wechat } = req.body;
  if (!short_name || !full_name || !contact) {
    return res.status(400).json({ error: 'Validation failed: short_name, full_name, and contact are required' });
  }
  try {
    const supplier = await Supplier.create({ code, short_name, full_name, tax_id, legal_person, contact, phone, wechat });
    res.status(201).json(supplier);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/suppliers/:id', async (req, res) => {
  const { id } = req.params;
  const { code, short_name, full_name, tax_id, legal_person, contact, phone, wechat } = req.body;
  if (!short_name || !full_name || !contact) {
    return res.status(400).json({ error: 'Validation failed: short_name, full_name, and contact are required' });
  }
  try {
    const supplier = await Supplier.findByPk(id);
    if (!supplier) return res.status(404).json({ error: 'Supplier not found' });
    await supplier.update({ code, short_name, full_name, tax_id, legal_person, contact, phone, wechat });
    res.json(supplier);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/suppliers/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const supplier = await Supplier.findByPk(id);
    if (!supplier) return res.status(404).json({ error: 'Supplier not found' });
    await supplier.destroy();
    res.json({ message: 'Supplier deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/customers', async (req, res) => {
  const { page = 1, size = 10 } = req.query;
  try {
    const result = await paginate(Customer, parseInt(page), parseInt(size));
    res.json(result);
  } catch (err) {
    console.error('Customers query failed:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/customers', async (req, res) => {
  const { code, short_name, full_name, tax_id, legal_person, contact, phone, wechat, sales_template_id } = req.body;
  if (!short_name || !full_name || !contact) {
    return res.status(400).json({ error: 'Validation failed: short_name, full_name, and contact are required' });
  }
  try {
    const customer = await Customer.create({ code, short_name, full_name, tax_id, legal_person, contact, phone, wechat, sales_template_id });
    res.status(201).json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/customers/:id', async (req, res) => {
  const { id } = req.params;
  const { code, short_name, full_name, tax_id, legal_person, contact, phone, wechat, sales_template_id } = req.body;
  if (!short_name || !full_name || !contact) {
    return res.status(400).json({ error: 'Validation failed: short_name, full_name, and contact are required' });
  }
  try {
    const customer = await Customer.findByPk(id);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    await customer.update({ code, short_name, full_name, tax_id, legal_person, contact, phone, wechat, sales_template_id });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/customers/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const customer = await Customer.findByPk(id);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    await customer.destroy();
    res.json({ message: 'Customer deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/counters', async (req, res) => {
  const { page = 1, size = 10 } = req.query;
  try {
    const result = await paginate(Counter, parseInt(page), parseInt(size));
    res.json(result);
  } catch (err) {
    console.error('Counters query failed:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/counters', async (req, res) => {
  const { code, name, description } = req.body;
  if (!code || !name) {
    return res.status(400).json({ error: 'Validation failed: code and name are required' });
  }
  try {
    const counter = await Counter.create({ code, name, description });
    res.status(201).json(counter);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/counters/:id', async (req, res) => {
  const { id } = req.params;
  const { code, name, description } = req.body;
  if (!code || !name) {
    return res.status(400).json({ error: 'Validation failed: code and name are required' });
  }
  try {
    const counter = await Counter.findByPk(id);
    if (!counter) return res.status(404).json({ error: 'Counter not found' });
    await counter.update({ code, name, description });
    res.json(counter);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/counters/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const counter = await Counter.findByPk(id);
    if (!counter) return res.status(404).json({ error: 'Counter not found' });
    await counter.destroy();
    res.json({ message: 'Counter deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/staff', async (req, res) => {
  const { page = 1, size = 10 } = req.query;
  try {
    const result = await paginate(Staff, parseInt(page), parseInt(size));
    res.json(result);
  } catch (err) {
    console.error('Staff query failed:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/staff', async (req, res) => {
  const { code, name, id_number, id_card, phone, id_address, contact_address, education, school, performance_type, performance_rate } = req.body;
  if (!name || !id_number || !phone) {
    return res.status(400).json({ error: 'Validation failed: name, id_number, and phone are required' });
  }
  try {
    const staff = await Staff.create({ code, name, id_number, id_card, phone, id_address, contact_address, education, school, performance_type, performance_rate });
    res.status(201).json(staff);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/staff/:id', async (req, res) => {
  const { id } = req.params;
  const { code, name, id_number, id_card, phone, id_address, contact_address, education, school, performance_type, performance_rate } = req.body;
  if (!name || !id_number || !phone) {
    return res.status(400).json({ error: 'Validation failed: name, id_number, and phone are required' });
  }
  try {
    const staff = await Staff.findByPk(id);
    if (!staff) return res.status(404).json({ error: 'Staff not found' });
    await staff.update({ code, name, id_number, id_card, phone, id_address, contact_address, education, school, performance_type, performance_rate });
    res.json(staff);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/staff/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const staff = await Staff.findByPk(id);
    if (!staff) return res.status(404).json({ error: 'Staff not found' });
    await staff.destroy();
    res.json({ message: 'Staff deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users', async (req, res) => {
  const { page = 1, size = 10 } = req.query;
  try {
    const result = await paginate(User, parseInt(page), parseInt(size));
    res.json(result);
  } catch (err) {
    console.error('Users query failed:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', async (req, res) => {
  const { username, password, role, name } = req.body;
  if (!username || !password || !role || !name) {
    return res.status(400).json({ error: 'Validation failed: username, password, role, and name are required' });
  }
  try {
    const user = await User.create({ username, password, role, name });
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const { username, password, role, name } = req.body;
  if (!username || !role || !name) {
    return res.status(400).json({ error: 'Validation failed: username, role, and name are required' });
  }
  try {
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    await user.update({ username, password: password || user.password, role, name });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    await user.destroy();
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/categories', async (req, res) => {
  try {
    const categories = await Category.findAll();
    res.json({ data: categories });
  } catch (err) {
    console.error('Categories query failed:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/categories/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(200).json({ data: null, message: 'Category not found' });
    }
    if (category.parent_id) {
      const parent = await Category.findByPk(category.parent_id);
      category.name = parent ? parent.name : category.name;
    }
    res.json({ data: category });
  } catch (err) {
    console.error('Category query failed:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/categories', async (req, res) => {
  const { name, parent_id, description, code } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Validation failed: name is required' });
  }
  try {
    const category = await Category.create({ code, name, parent_id, description });
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/categories/:id', async (req, res) => {
  const { id } = req.params;
  const { name, parent_id, description, code } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Validation failed: name is required' });
  }
  try {
    const category = await Category.findByPk(id);
    if (!category) return res.status(404).json({ error: 'Category not found' });
    await category.update({ code, name, parent_id, description });
    res.json(category);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const category = await Category.findByPk(id);
    if (!category) return res.status(404).json({ error: 'Category not found' });
    await category.destroy();
    res.json({ message: 'Category deleted' });
  } catch (err) {
    console.error('Delete category failed:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/categories/batch', async (req, res) => {
  const { categories } = req.body;
  if (!categories || !Array.isArray(categories)) {
    return res.status(400).json({ error: 'Invalid input: categories must be an array' });
  }
  const validCategories = categories.filter(cat => cat.code && cat.name);
  if (validCategories.length !== categories.length) {
    return res.status(400).json({ error: 'Validation failed: all subcategories must have code and name' });
  }
  try {
    await Category.bulkCreate(validCategories);
    res.status(201).json({ message: 'Batch creation successful' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Sales Template Management
app.get('/api/salesTemplates', async (req, res) => {
  const { page = 1, size = 10 } = req.query;
  try {
    const result = await paginate(SalesTemplate, parseInt(page), parseInt(size));
    const templates = await Promise.all(result.data.map(async template => {
      const details = await SalesTemplateDetail.findAll({ where: { template_id: template.id } });
      return { ...template.dataValues, details };
    }));
    res.json({ data: templates, total: result.total });
  } catch (err) {
    console.error('Sales templates query failed:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/salesTemplates/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const template = await SalesTemplate.findByPk(id, {
      include: [{ model: SalesTemplateDetail, as: 'details' }],
    });
    if (!template) {
      return res.status(200).json({ data: null, message: 'Template not found' });
    }
    res.json({ data: template });
  } catch (err) {
    console.error('Get sales template failed:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/salesTemplates', async (req, res) => {
  const { template_name, details } = req.body;
  if (!template_name || !details || !Array.isArray(details)) {
    return res.status(400).json({ error: 'Invalid input: template_name and details are required' });
  }
  try {
    const transaction = await sequelize.transaction();
    let template = await SalesTemplate.findOne({ where: { template_name }, transaction });
    if (!template) {
      template = await SalesTemplate.create({ template_name }, { transaction });
    }
    await SalesTemplateDetail.destroy({ where: { template_id: template.id }, transaction });
    const detailEntries = details.map(detail => ({
      template_id: template.id,
      category_id: detail.category_id,
      labor_cost: detail.labor_cost || 0,
      extra_fee: detail.extra_fee || 0,
      inlay_labor_cost: detail.inlay_labor_cost || 0,
      stone_price: detail.stone_price || 0,
    }));
    await SalesTemplateDetail.bulkCreate(detailEntries, { transaction });
    await transaction.commit();
    res.status(201).json({ message: 'Success', template });
  } catch (err) {
    await transaction.rollback();
    console.error('Error saving sales template:', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/salesTemplates/:id', async (req, res) => {
  const { id } = req.params;
  const { template_name, details } = req.body;
  try {
    const template = await SalesTemplate.findByPk(id);
    if (!template) return res.status(404).json({ error: 'Sales template not found' });
    const transaction = await sequelize.transaction();
    await template.update({ template_name }, { transaction });
    await SalesTemplateDetail.destroy({ where: { template_id: id }, transaction });
    const detailEntries = details.map(detail => ({
      template_id: id,
      category_id: detail.category_id,
      labor_cost: detail.labor_cost || 0,
      extra_fee: detail.extra_fee || 0,
      inlay_labor_cost: detail.inlay_labor_cost || 0,
      stone_price: detail.stone_price || 0,
    }));
    await SalesTemplateDetail.bulkCreate(detailEntries, { transaction });
    await transaction.commit();
    res.json({ message: 'Updated successfully' });
  } catch (err) {
    await transaction.rollback();
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/salesTemplates/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const template = await SalesTemplate.findByPk(id);
    if (!template) return res.status(404).json({ error: 'Sales template not found' });
    await SalesTemplateDetail.destroy({ where: { template_id: id } });
    await template.destroy();
    res.json({ message: 'Sales template deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Label Template Management
app.get('/api/labelTemplates', async (req, res) => {
  const { page = 1, size = 10 } = req.query;
  try {
    const result = await paginate(LabelTemplate, parseInt(page), parseInt(size));
    res.json(result);
  } catch (err) {
    console.error('Label templates query failed:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/labelTemplates', async (req, res) => {
  const { barcode_position, gold_weight, standard } = req.body;
  try {
    const labelTemplate = await LabelTemplate.create({ barcode_position, gold_weight, standard });
    res.status(201).json(labelTemplate);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/labelTemplates/:id', async (req, res) => {
  const { id } = req.params;
  const { barcode_position, gold_weight, standard } = req.body;
  try {
    const labelTemplate = await LabelTemplate.findByPk(id);
    if (!labelTemplate) return res.status(404).json({ error: 'Label template not found' });
    await labelTemplate.update({ barcode_position, gold_weight, standard });
    res.json(labelTemplate);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/labelTemplates/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const labelTemplate = await LabelTemplate.findByPk(id);
    if (!labelTemplate) return res.status(404).json({ error: 'Label template not found' });
    await labelTemplate.destroy();
    res.json({ message: 'Label template deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Inbound Management
app.get('/api/inboundOrders', async (req, res) => {
  const { page = 1, size = 10 } = req.query;
  try {
    const result = await paginate(InboundOrder, parseInt(page), parseInt(size), {
      include: [
        { model: Supplier, as: 'supplier', attributes: ['short_name'] },
        { model: Counter, as: 'counter', attributes: ['name'] },
      ],
    });
    result.data.forEach(order => {
      order.date = format(new Date(order.date), 'yyyy-MM-dd HH:mm:ss');
    });
    res.json(result);
  } catch (err) {
    console.error('Inbound orders query failed:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/inboundOrders/details', async (req, res) => {
  const { barcode } = req.query;
  try {
    const detail = await InboundOrderDetail.findOne({ where: { barcode } });
    res.json({ data: detail ? [detail] : [] });
  } catch (err) {
    console.error('Inbound details query failed:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/inboundOrders', async (req, res) => {
  const { date, supplier_id, counter_id, settle_type, details, total_weight, total_pure_weight, total_cost } = req.body;
  if (!supplier_id || !counter_id || !details || !Array.isArray(details)) {
    return res.status(400).json({ error: 'Validation failed: supplier_id, counter_id, and details are required' });
  }
  try {
    const orderNumber = await generateOrderNumber('IN', InboundOrder);
    const order = await InboundOrder.create({
      order_number: orderNumber,
      date: date || new Date(),
      supplier_id,
      counter_id,
      settle_price: settle_type === 'price',
      settle_material: settle_type === 'material',
      total_weight: parseFloat(total_weight) || 0,
      total_pure_weight: parseFloat(total_pure_weight) || 0,
      total_cost: parseFloat(total_cost) || 0,
    });

    const detailPromises = details.map(detail => {
      return InboundOrderDetail.create({
        order_id: order.id,
        barcode: detail.barcode || generateEAN13(),
        product_code: detail.product_code,
        product_name: detail.product_name,
        weight_type: detail.weight_type || 'weight',
        weight: parseFloat(detail.weight) || 0,
        pure_weight: parseFloat(detail.pure_weight) || 0,
        labor_cost: parseFloat(detail.labor_cost) || 0,
        quantity: parseInt(detail.quantity) || 1,
        extra_fee: parseFloat(detail.extra_fee) || 0,
        inlay_count: parseInt(detail.inlay_count) || 0,
        inlay_labor_cost: parseFloat(detail.inlay_labor_cost) || 0,
        stone_weight: parseFloat(detail.stone_weight) || 0,
        stone_price: parseFloat(detail.stone_price) || 0,
        total_cost: parseFloat(detail.total_cost) || 0,
      });
    });

    const createdDetails = await Promise.all(detailPromises);
    res.status(201).json({ order, details: createdDetails });
  } catch (err) {
    console.error('Create inbound order failed:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/inboundOrders/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const order = await InboundOrder.findByPk(id, { include: [{ model: InboundOrderDetail, as: 'InboundOrderDetails' }] });
    if (!order) return res.status(404).json({ error: 'Inbound order not found' });
    order.date = format(new Date(order.date), 'yyyy-MM-dd HH:mm:ss');
    res.json(order);
  } catch (err) {
    console.error('Get inbound order failed:', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/inboundOrders/:id', async (req, res) => {
  const { id } = req.params;
  const { date, supplier_id, counter_id, settle_type, details, total_weight, total_pure_weight, total_cost } = req.body;
  if (!supplier_id || !counter_id || !details || !Array.isArray(details)) {
    return res.status(400).json({ error: 'Validation failed: supplier_id, counter_id, and details are required' });
  }
  try {
    const order = await InboundOrder.findByPk(id);
    if (!order) return res.status(404).json({ error: 'Inbound order not found' });

    await order.update({
      date: date || new Date(),
      supplier_id,
      counter_id,
      settle_price: settle_type === 'price',
      settle_material: settle_type === 'material',
      total_weight: parseFloat(total_weight) || 0,
      total_pure_weight: parseFloat(total_pure_weight) || 0,
      total_cost: parseFloat(total_cost) || 0,
    });

    await InboundOrderDetail.destroy({ where: { order_id: id } });

    const detailPromises = details.map(detail => {
      return InboundOrderDetail.create({
        order_id: order.id,
        barcode: detail.barcode || generateEAN13(),
        product_code: detail.product_code,
        product_name: detail.product_name,
        weight_type: detail.weight_type || 'weight',
        weight: parseFloat(detail.weight) || 0,
        pure_weight: parseFloat(detail.pure_weight) || 0,
        labor_cost: parseFloat(detail.labor_cost) || 0,
        quantity: parseInt(detail.quantity) || 1,
        extra_fee: parseFloat(detail.extra_fee) || 0,
        inlay_count: parseInt(detail.inlay_count) || 0,
        inlay_labor_cost: parseFloat(detail.inlay_labor_cost) || 0,
        stone_weight: parseFloat(detail.stone_weight) || 0,
        stone_price: parseFloat(detail.stone_price) || 0,
        total_cost: parseFloat(detail.total_cost) || 0,
      });
    });

    const createdDetails = await Promise.all(detailPromises);
    res.status(200).json({ order, details: createdDetails });
  } catch (err) {
    console.error('Update inbound order failed:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/inboundOrders/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const order = await InboundOrder.findByPk(id);
    if (!order) return res.status(404).json({ error: 'Inbound order not found' });
    await InboundOrderDetail.destroy({ where: { order_id: id } });
    await order.destroy();
    res.json({ message: 'Inbound order deleted' });
  } catch (err) {
    console.error('Delete inbound order failed:', err);
    res.status(500).json({ error: err.message });
  }
});

// Inventory Update
app.post('/api/inventory/update', async (req, res) => {
  const { details, counter_id, type } = req.body;
  if (!details || !Array.isArray(details) || !counter_id || !type) {
    return res.status(400).json({ error: 'Validation failed: details, counter_id, and type are required' });
  }
  const transaction = await sequelize.transaction();
  try {
    const updates = details.map(async detail => {
      if (!detail.barcode || detail.barcode.trim() === '') return null;

      const quantity = parseInt(detail.quantity) || 1;
      const weight = parseFloat(detail.weight) || 0;
      const pureWeight = parseFloat(detail.pure_weight) || 0;

      const inventoryItem = await Inventory.findOne({ where: { barcode: detail.barcode }, transaction });
      if (inventoryItem) {
        const newQuantity = parseInt(inventoryItem.quantity) + (type === 'inbound' ? quantity : -quantity);
        const newWeight = parseFloat(inventoryItem.weight) + (type === 'inbound' ? weight * quantity : -weight * quantity);
        const newPureWeight = parseFloat(inventoryItem.pure_weight) + (type === 'inbound' ? pureWeight * quantity : -pureWeight * quantity);

        await Inventory.update(
          {
            quantity: newQuantity,
            weight: newWeight,
            pure_weight: newPureWeight,
            counter_id,
          },
          { where: { barcode: detail.barcode }, transaction }
        );
      } else if (type === 'inbound') {
        await Inventory.create({
          barcode: detail.barcode,
          product_code: detail.product_code,
          product_name: detail.product_name,
          weight: weight * quantity,
          pure_weight: pureWeight * quantity,
          quantity: quantity,
          counter_id,
          scanned_at: new Date(),
        }, { transaction });
      }
    });
    await Promise.all(updates);
    await transaction.commit();
    res.status(200).json({ message: 'Inventory updated successfully' });
  } catch (err) {
    await transaction.rollback();
    console.error('Inventory update failed:', err);
    res.status(500).json({ error: err.message });
  }
});

// Inventory Reset
app.post('/api/inventory/reset', async (req, res) => {
  const { order_id } = req.body;
  if (!order_id) {
    return res.status(400).json({ error: 'Validation failed: order_id is required' });
  }
  try {
    const details = await InboundOrderDetail.findAll({ where: { order_id } });
    const barcodes = details.map(detail => detail.barcode);

    await Inventory.update(
      { quantity: 0, weight: 0, pure_weight: 0 },
      { where: { barcode: { [Sequelize.Op.in]: barcodes } } }
    );

    res.status(200).json({ message: 'Inventory reset successfully' });
  } catch (err) {
    console.error('Inventory reset failed:', err);
    res.status(500).json({ error: err.message });
  }
});

// Outbound Management
app.get('/api/outboundOrders', async (req, res) => {
  const { page = 1, size = 10 } = req.query;
  try {
    const result = await paginate(OutboundOrder, parseInt(page), parseInt(size), {
      include: [
        { model: Customer, as: 'customer', attributes: ['short_name'] },
        { model: Counter, as: 'counter', attributes: ['name'] },
      ],
    });
    res.json(result);
  } catch (err) {
    console.error('Outbound orders query failed:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/outboundOrders', async (req, res) => {
  const { customer_id, counter_id, settle_type, details } = req.body;
  if (!customer_id || !counter_id || !details || !Array.isArray(details)) {
    return res.status(400).json({ error: '客户、柜台和明细为必填项' });
  }
  const transaction = await sequelize.transaction();
  try {
    const orderNumber = await generateOrderNumber('OUT', OutboundOrder);
    const order = await OutboundOrder.create({
      order_number: orderNumber,
      date: new Date(),
      customer_id,
      counter_id,
      settle_price: settle_type === 'price',
      settle_material: settle_type === 'material',
      total_weight: 0,
      total_pure_weight: 0,
      total_cost: 0,
    }, { transaction });

    let totalWeight = 0, totalPureWeight = 0, totalCost = 0;
    const detailPromises = details.map(async (detail) => {
      if (!detail.barcode || detail.barcode.trim() === '') {
        console.log('Skipping empty barcode detail:', detail);
        return null;
      }

      const inventoryItem = await Inventory.findOne({ where: { barcode: detail.barcode }, transaction });
      console.log(`Checking inventory for ${detail.barcode}: quantity=${inventoryItem?.quantity}, requested=${detail.quantity}`);
      if (!inventoryItem || inventoryItem.quantity < detail.quantity) {
        throw new Error(`库存不足: ${detail.barcode}`);
      }

      const effectiveWeight = detail.pure_weight || detail.weight;
      const total_cost = (effectiveWeight * detail.labor_cost) +
        (detail.quantity * detail.extra_fee) +
        (detail.inlay_count * detail.inlay_labor_cost) +
        (detail.stone_weight * detail.stone_price);

      totalWeight += detail.weight * detail.quantity;
      totalPureWeight += effectiveWeight * detail.quantity;
      totalCost += total_cost;

      const detailEntry = await OutboundOrderDetail.create({
        order_id: order.id,
        barcode: detail.barcode,
        product_code: detail.product_code,
        product_name: detail.product_name,
        weight: detail.weight,
        pure_weight: detail.pure_weight,
        labor_cost: detail.labor_cost,
        quantity: detail.quantity,
        extra_fee: detail.extra_fee,
        inlay_count: detail.inlay_count,
        inlay_labor_cost: detail.inlay_labor_cost,
        stone_weight: detail.stone_weight,
        stone_price: detail.stone_price,
        gold_price: detail.gold_price,
        total_cost,
      }, { transaction });

      inventoryItem.quantity -= detail.quantity;
      inventoryItem.weight -= detail.weight * detail.quantity;
      inventoryItem.pure_weight -= effectiveWeight * detail.quantity;
      if (inventoryItem.quantity === 0) await inventoryItem.destroy({ transaction });
      else await inventoryItem.save({ transaction });

      return detailEntry;
    });

    const createdDetails = (await Promise.all(detailPromises)).filter(d => d !== null);
    await order.update({ total_weight: totalWeight, total_pure_weight: totalPureWeight, total_cost: totalCost }, { transaction });

    await CustomerOwed.update(
      {
        material_amount: Sequelize.literal(`material_amount + ${settle_type === 'material' ? totalPureWeight : 0}`),
        labor_amount: Sequelize.literal(`labor_amount + ${totalCost}`),
        updated_at: new Date(),
      },
      { where: { customer_id }, transaction }
    );

    await transaction.commit();
    res.status(201).json({ order, details: createdDetails });
  } catch (err) {
    await transaction.rollback();
    console.error('Create outbound order failed:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/outboundOrders/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const order = await OutboundOrder.findByPk(id, { include: [{ model: OutboundOrderDetail, as: 'OutboundOrderDetails' }] });
    if (!order) return res.status(404).json({ error: 'Outbound order not found' });
    res.json(order);
  } catch (err) {
    console.error('Get outbound order failed:', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/outboundOrders/:id', async (req, res) => {
  const { id } = req.params;
  const { customer_id, counter_id, settle_type, details } = req.body;
  if (!customer_id || !counter_id || !details || !Array.isArray(details)) {
    return res.status(400).json({ error: '客户、柜台和明细为必填项' });
  }

  const transaction = await sequelize.transaction();
  try {
    const order = await OutboundOrder.findByPk(id, { include: [{ model: OutboundOrderDetail, as: 'OutboundOrderDetails' }], transaction });
    if (!order) return res.status(404).json({ error: '出库单不存在' });

    const oldDetails = order.OutboundOrderDetails;
    for (const oldDetail of oldDetails) {
      const inventoryItem = await Inventory.findOne({ where: { barcode: oldDetail.barcode }, transaction });
      if (inventoryItem) {
        inventoryItem.quantity += oldDetail.quantity;
        inventoryItem.weight += oldDetail.weight * oldDetail.quantity;
        inventoryItem.pure_weight += (oldDetail.pure_weight || oldDetail.weight) * oldDetail.quantity;
        await inventoryItem.save({ transaction });
      } else {
        await Inventory.create({
          barcode: oldDetail.barcode,
          product_code: oldDetail.product_code,
          product_name: oldDetail.product_name,
          weight: oldDetail.weight * oldDetail.quantity,
          pure_weight: (oldDetail.pure_weight || oldDetail.weight) * oldDetail.quantity,
          quantity: oldDetail.quantity,
          counter_id: order.counter_id,
          scanned_at: new Date(),
        }, { transaction });
      }
    }

    await OutboundOrderDetail.destroy({ where: { order_id: id }, transaction });

    let totalWeight = 0, totalPureWeight = 0, totalCost = 0;
    const detailPromises = details.map(async (detail) => {
      if (!detail.barcode || detail.barcode.trim() === '') {
        console.log('Skipping empty barcode detail:', detail);
        return null;
      }

      const inventoryItem = await Inventory.findOne({ where: { barcode: detail.barcode }, transaction });
      console.log(`Checking inventory for ${detail.barcode}: quantity=${inventoryItem?.quantity}, requested=${detail.quantity}`);
      if (!inventoryItem || inventoryItem.quantity < detail.quantity) {
        throw new Error(`库存不足: ${detail.barcode}`);
      }

      const effectiveWeight = detail.pure_weight || detail.weight;
      const total_cost = (effectiveWeight * detail.labor_cost) +
        (detail.quantity * detail.extra_fee) +
        (detail.inlay_count * detail.inlay_labor_cost) +
        (detail.stone_weight * detail.stone_price);

      totalWeight += detail.weight * detail.quantity;
      totalPureWeight += effectiveWeight * detail.quantity;
      totalCost += total_cost;

      const detailEntry = await OutboundOrderDetail.create({
        order_id: order.id,
        barcode: detail.barcode,
        product_code: detail.product_code,
        product_name: detail.product_name,
        weight: detail.weight,
        pure_weight: detail.pure_weight,
        labor_cost: detail.labor_cost,
        quantity: detail.quantity,
        extra_fee: detail.extra_fee,
        inlay_count: detail.inlay_count,
        inlay_labor_cost: detail.inlay_labor_cost,
        stone_weight: detail.stone_weight,
        stone_price: detail.stone_price,
        gold_price: detail.gold_price,
        total_cost,
      }, { transaction });

      inventoryItem.quantity -= detail.quantity;
      inventoryItem.weight -= detail.weight * detail.quantity;
      inventoryItem.pure_weight -= effectiveWeight * detail.quantity;
      if (inventoryItem.quantity === 0) await inventoryItem.destroy({ transaction });
      else await inventoryItem.save({ transaction });

      return detailEntry;
    });

    const createdDetails = (await Promise.all(detailPromises)).filter(d => d !== null);
    await order.update({
      customer_id,
      counter_id,
      settle_price: settle_type === 'price',
      settle_material: settle_type === 'material',
      total_weight: totalWeight,
      total_pure_weight: totalPureWeight,
      total_cost: totalCost
    }, { transaction });

    await CustomerOwed.update(
      {
        material_amount: Sequelize.literal(`material_amount + ${settle_type === 'material' ? totalPureWeight : 0}`),
        labor_amount: Sequelize.literal(`labor_amount + ${totalCost}`),
        updated_at: new Date(),
      },
      { where: { customer_id }, transaction }
    );

    await transaction.commit();
    res.status(200).json({ order, details: createdDetails });
  } catch (err) {
    await transaction.rollback();
    console.error('Update outbound order failed:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/outboundOrders/:id', async (req, res) => {
  const { id } = req.params;
  const transaction = await sequelize.transaction();
  try {
    const order = await OutboundOrder.findByPk(id, { include: [{ model: OutboundOrderDetail, as: 'OutboundOrderDetails' }], transaction });
    if (!order) {
      console.log(`Outbound order ${id} not found in database`);
      await transaction.rollback();
      return res.status(404).json({ error: '出库单不存在' });
    }

    console.log(`Deleting outbound order ${id} with ${order.OutboundOrderDetails.length} details`);
    const details = order.OutboundOrderDetails;
    for (const detail of details) {
      const inventoryItem = await Inventory.findOne({ where: { barcode: detail.barcode }, transaction });
      if (inventoryItem) {
        inventoryItem.quantity += detail.quantity;
        inventoryItem.weight += detail.weight * detail.quantity;
        inventoryItem.pure_weight += (detail.pure_weight || detail.weight) * detail.quantity;
        await inventoryItem.save({ transaction });
        console.log(`Restored inventory for ${detail.barcode}: quantity=${inventoryItem.quantity}`);
      } else {
        await Inventory.create({
          barcode: detail.barcode,
          product_code: detail.product_code,
          product_name: detail.product_name,
          weight: detail.weight * detail.quantity,
          pure_weight: (detail.pure_weight || detail.weight) * detail.quantity,
          quantity: detail.quantity,
          counter_id: order.counter_id,
          scanned_at: new Date(),
        }, { transaction });
        console.log(`Created inventory for ${detail.barcode}`);
      }
    }

    await OutboundOrderDetail.destroy({ where: { order_id: id }, transaction });
    await order.destroy({ transaction });

    await transaction.commit();
    console.log(`Outbound order ${id} deleted successfully`);
    res.json({ message: '出库单已删除' });
  } catch (err) {
    await transaction.rollback();
    console.error('Delete outbound order failed:', err);
    res.status(500).json({ error: err.message });
  }
});

// Return Management
app.get('/api/returnOrders', async (req, res) => {
  const { page = 1, size = 10 } = req.query;
  try {
    const result = await paginate(ReturnOrder, parseInt(page), parseInt(size));
    res.json(result);
  } catch (err) {
    console.error('Return orders query failed:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/returnOrders', async (req, res) => {
  const { type, customer_id, supplier_id, details } = req.body;
  if (!type || !details || !Array.isArray(details) || (type === 'customer' && !customer_id) || (type === 'supplier' && !supplier_id)) {
    return res.status(400).json({ error: 'Validation failed: type, customer_id/supplier_id, and details are required' });
  }
  try {
    const orderNumber = await generateOrderNumber('RET', ReturnOrder);
    const order = await ReturnOrder.create({
      order_number: orderNumber,
      date: new Date(),
      type,
      customer_id: type === 'customer' ? customer_id : null,
      supplier_id: type === 'supplier' ? supplier_id : null,
    });

    let totalWeight = 0, totalPureWeight = 0, totalCost = 0;
    const detailPromises = details.map(async (detail) => {
      const effectiveWeight = detail.pure_weight || detail.weight;
      const total_cost = (effectiveWeight * detail.labor_cost) +
        (detail.quantity * detail.extra_fee) +
        (detail.inlay_count * detail.inlay_labor_cost) +
        (detail.stone_weight * detail.stone_price);

      totalWeight += detail.weight * detail.quantity;
      totalPureWeight += (detail.pure_weight || detail.weight) * detail.quantity;
      totalCost += total_cost;

      const detailEntry = await ReturnOrderDetail.create({
        order_id: order.id,
        barcode: detail.barcode,
        product_code: detail.product_code,
        product_name: detail.product_name,
        weight: detail.weight,
        pure_weight: detail.pure_weight,
        labor_cost: detail.labor_cost,
        quantity: detail.quantity,
        extra_fee: detail.extra_fee,
        inlay_count: detail.inlay_count,
        inlay_labor_cost: detail.inlay_labor_cost,
        stone_weight: detail.stone_weight,
        stone_price: detail.stone_price,
        total_cost,
      });

      if (type === 'customer') {
        let inventoryItem = await Inventory.findOne({ where: { barcode: detail.barcode } });
        if (inventoryItem) {
          inventoryItem.quantity += detail.quantity;
          inventoryItem.weight += detail.weight * detail.quantity;
          inventoryItem.pure_weight += (detail.pure_weight || detail.weight) * detail.quantity;
          await inventoryItem.save();
        } else {
          await Inventory.create({
            barcode: detail.barcode,
            product_code: detail.product_code,
            product_name: detail.product_name,
            weight: detail.weight * detail.quantity,
            pure_weight: (detail.pure_weight || detail.weight) * detail.quantity,
            quantity: detail.quantity,
            counter_id: detail.counter_id,
            scanned_at: new Date(),
          });
        }
      } else if (type === 'supplier') {
        const inventoryItem = await Inventory.findOne({ where: { barcode: detail.barcode } });
        if (inventoryItem) {
          inventoryItem.quantity -= detail.quantity;
          inventoryItem.weight -= detail.weight * detail.quantity;
          inventoryItem.pure_weight -= (detail.pure_weight || detail.weight) * detail.quantity;
          if (inventoryItem.quantity === 0) {
            await inventoryItem.destroy();
          } else {
            await inventoryItem.save();
          }
        }
      }

      return detailEntry;
    });

    const createdDetails = await Promise.all(detailPromises);
    await order.update({ total_weight: totalWeight, total_pure_weight: totalPureWeight, total_cost: totalCost });

    res.status(201).json({ order, details: createdDetails });
  } catch (err) {
    console.error('Create return order failed:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/returnOrders/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const order = await ReturnOrder.findByPk(id, { include: [{ model: ReturnOrderDetail, as: 'ReturnOrderDetails' }] });
    if (!order) return res.status(404).json({ error: 'Return order not found' });
    res.json(order);
  } catch (err) {
    console.error('Get return order failed:', err);
    res.status(500).json({ error: err.message });
  }
});

// Inventory Management
app.get('/api/inventory', async (req, res) => {
  const { page = 1, size = 10, barcode, order_number, product_code, counter_id, start_time, end_time } = req.query;
  try {
    const where = {};
    if (barcode) where[Sequelize.Op.and] = { ...where[Sequelize.Op.and], barcode };
    if (product_code) where[Sequelize.Op.and] = { ...where[Sequelize.Op.and], product_code: { [Sequelize.Op.like]: `%${product_code}%` } };
    if (counter_id) where[Sequelize.Op.and] = { ...where[Sequelize.Op.and], counter_id };
    if (start_time && end_time) {
      where[Sequelize.Op.and] = { ...where[Sequelize.Op.and], scanned_at: { [Sequelize.Op.between]: [new Date(start_time), new Date(end_time)] } };
    }

    const offset = (page - 1) * size;
    let inventoryQuery = {
      offset,
      limit: parseInt(size),
      include: [{
        model: InboundOrderDetail,
        as: 'inboundDetail',
        attributes: ['total_cost', 'weight_type'],
        include: [{
          model: InboundOrder,
          as: 'inboundOrder',
          attributes: ['order_number'],
          where: order_number ? { order_number: { [Sequelize.Op.like]: `%${order_number}%` } } : {},
        }],
      }],
      where,
    };

    const result = await Inventory.findAndCountAll(inventoryQuery);
    const data = result.rows.map(item => {
      const plainItem = item.get({ plain: true });
      const detail = plainItem.inboundDetail || {};
      return {
        barcode: plainItem.barcode,
        order_number: detail.inboundOrder ? detail.inboundOrder.order_number : '',
        product_code: plainItem.product_code,
        product_name: plainItem.product_name,
        weight: Number(plainItem.weight).toFixed(2),
        pure_weight: Number(plainItem.pure_weight).toFixed(2),
        quantity: plainItem.quantity,
        weight_type: detail.weight_type || 'weight',
        labor_cost: Number(detail.labor_cost || 0).toFixed(2),
        extra_fee: Number(detail.extra_fee || 0).toFixed(2),
        inlay_count: detail.inlay_count || 0,
        inlay_labor_cost: Number(detail.inlay_labor_cost || 0).toFixed(2),
        stone_weight: Number(detail.stone_weight || 0).toFixed(2),
        stone_price: Number(detail.stone_price || 0).toFixed(2),
        total_cost: Number(detail.total_cost || 0).toFixed(2),
        counter_id: plainItem.counter_id,
        scanned_at: plainItem.scanned_at,
      };
    });

    res.json({ data, total: result.count });
  } catch (err) {
    console.error('Inventory query failed:', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/inventory/:id', async (req, res) => {
  const { id } = req.params;
  const { quantity, weight, pure_weight, counter_id } = req.body;
  try {
    const inventoryItem = await Inventory.findByPk(id);
    if (!inventoryItem) return res.status(404).json({ error: 'Inventory item not found' });
    await inventoryItem.update({
      quantity,
      weight: Number(weight).toFixed(2),
      pure_weight: Number(pure_weight).toFixed(2),
      counter_id
    });
    res.json(inventoryItem);
  } catch (err) {
    console.error('Update inventory failed:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/inventory/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const inventoryItem = await Inventory.findByPk(id);
    if (!inventoryItem) return res.status(404).json({ error: 'Inventory item not found' });
    await inventoryItem    .destroy();
    res.json({ message: 'Inventory item deleted' });
  } catch (err) {
    console.error('Delete inventory failed:', err);
    res.status(500).json({ error: err.message });
  }
});

// Material Inventory Management
app.get('/api/materialInventory', async (req, res) => {
  const { page = 1, size = 10 } = req.query;
  try {
    const result = await paginate(MaterialInventory, parseInt(page), parseInt(size));
    res.json(result);
  } catch (err) {
    console.error('Material inventory query failed:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/materialInventory', async (req, res) => {
  const { material_type, weight } = req.body;
  if (!material_type || !weight) {
    return res.status(400).json({ error: 'Validation failed: material_type and weight are required' });
  }
  try {
    const material = await MaterialInventory.create({
      material_type,
      weight: Number(weight).toFixed(2),
      updated_at: new Date(),
    });
    res.status(201).json(material);
  } catch (err) {
    console.error('Create material inventory failed:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/materialInventory/update', async (req, res) => {
  const { material_type, weight } = req.body;
  if (!material_type || weight === undefined) {
    return res.status(400).json({ error: 'Validation failed: material_type and weight are required' });
  }
  try {
    const material = await MaterialInventory.findOne({ where: { material_type } });
    if (material) {
      material.weight = Number(parseFloat(material.weight) + parseFloat(weight)).toFixed(2);
      material.updated_at = new Date();
      await material.save();
    } else {
      await MaterialInventory.create({
        material_type,
        weight: Number(parseFloat(weight)).toFixed(2),
        updated_at: new Date(),
      });
    }
    res.status(200).json({ message: 'Material inventory updated successfully' });
  } catch (err) {
    console.error('Update material inventory failed:', err);
    res.status(500).json({ error: err.message });
  }
});

// Supplier Statement
app.get('/api/supplierStatement', async (req, res) => {
  const { supplier_id, start_date, end_date } = req.query;
  if (!supplier_id) {
    return res.status(400).json({ error: 'Validation failed: supplier_id is required' });
  }
  try {
    const where = { supplier_id };
    if (start_date && end_date) {
      where.date = { [Sequelize.Op.between]: [new Date(start_date), new Date(end_date)] };
    }

    const orders = await InboundOrder.findAll({
      where,
      include: [{ model: InboundOrderDetail, as: 'InboundOrderDetails' }],
    });

    const paymentWhere = { supplier_id };
    if (start_date && end_date) {
      paymentWhere.payment_date = { [Sequelize.Op.between]: [new Date(start_date), new Date(end_date)] };
    }
    const payments = await PaymentRecord.findAll({ where: paymentWhere });

    const supplier = await Supplier.findByPk(supplier_id, {
      attributes: ['short_name', 'contact', 'phone'],
    });

    const details = [];
    orders.forEach(order => {
      const groupedDetails = {};
      order.InboundOrderDetails.forEach(detail => {
        const key = `${order.order_number}_${detail.product_name}`;
        if (!groupedDetails[key]) {
          groupedDetails[key] = {
            order_number: order.order_number,
            date: order.date,
            product_name: detail.product_name,
            gold_weight: 0,
            labor_cost: detail.labor_cost,
            extra_fee: 0,
            inlay_count: 0,
            inlay_labor_cost: detail.inlay_labor_cost,
            stone_weight: 0,
            stone_price: detail.stone_price,
            total_cost: 0,
          };
        }
        groupedDetails[key].gold_weight += parseFloat(detail.weight) + parseFloat(detail.pure_weight);
        groupedDetails[key].extra_fee += parseFloat(detail.extra_fee);
        groupedDetails[key].inlay_count += parseInt(detail.inlay_count);
        groupedDetails[key].stone_weight += parseFloat(detail.stone_weight);
        groupedDetails[key].total_cost += parseFloat(detail.total_cost);
      });
      Object.values(groupedDetails).forEach(detail => details.push(detail));
    });

    const flowRecords = [
      ...orders.map(order => ({
        type: '入库',
        order_number: order.order_number,
        date: order.date,
        gold_weight: parseFloat(order.total_weight) + parseFloat(order.total_pure_weight),
        total_cost: parseFloat(order.total_cost),
      })),
      ...payments.map(payment => ({
        type: {
          'income_material': '收入板料',
          'expense_material': '支出板料',
          'income_fee': '收入工费',
          'expense_fee': '支出工费',
          'income_material_customer': '收入板料',
          'expense_material_customer': '支出板料',
          'income_fee_customer': '收入工费',
          'expense_fee_customer': '支出工费',
        }[payment.type],
        order_number: payment.order_number,
        date: payment.payment_date,
        gold_weight: payment.type.includes('material') ? parseFloat(payment.amount) : 0,
        total_cost: payment.type.includes('fee') ? parseFloat(payment.amount) : 0,
      })),
    ].sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({ supplier, details, flowRecords });
  } catch (err) {
    console.error('Supplier statement query failed:', err);
    res.status(500).json({ error: err.message });
  }
});

// Print Voucher
app.post('/api/printVoucher', async (req, res) => {
  const { type, order_id, template } = req.body;
  try {
    let order, details, title, customer;
    if (type === 'outbound') {
      order = await OutboundOrder.findByPk(order_id, { include: [{ model: OutboundOrderDetail, as: 'OutboundOrderDetails' }] });
      details = order.OutboundOrderDetails;
      title = `销售结算单 ${order.order_number}`;
      customer = await Customer.findByPk(order.customer_id);
    } else {
      return res.status(400).json({ error: 'Invalid type' });
    }

    if (!order) return res.status(404).json({ error: 'Order not found' });

    const workbook = XLSX.utils.book_new();
    let worksheetData = [
      ['', '', '', '', '', '', '', '', '销售结算单'],
      ['客户名称：', customer?.short_name, '', '', '', '', '', '', '订单编码：', order.order_number],
      ['出库明细', '', '', '', '', '', '', '', '', '', '', '', '打印时间：', format(new Date(), 'yyyy-MM-dd HH:mm:ss')],
    ];

    let headers, detailRows;
    if (template === 'template1') {
      headers = ['序号', '产品名称', '数量', '毛重', '', '净金重', '', '工费', '', '金价', '珐琅附加费', '', '附加费', '备注', '合计'];
      detailRows = details.map((detail, index) => [
        index + 1,
        detail.product_name,
        detail.quantity,
        detail.weight,
        '',
        detail.pure_weight,
        '',
        detail.labor_cost,
        '',
        detail.gold_price,
        Number((detail.inlay_count * detail.inlay_labor_cost + detail.stone_weight * detail.stone_price)).toFixed(2),
        '',
        detail.extra_fee,
        '',
        detail.total_cost,
      ]);
    } else if (template === 'template2') {
      headers = ['序号', '产品名称', '数量', '毛重', '', '净金重', '', '工费', '', '附加工费', '镶嵌位', '镶嵌工费', '', '石头/CT', '石头单价', '合计'];
      detailRows = details.map((detail, index) => [
        index + 1,
        detail.product_name,
        detail.quantity,
        detail.weight,
        '',
        detail.pure_weight,
        '',
        detail.labor_cost,
        '',
        detail.extra_fee,
        detail.inlay_count,
        detail.inlay_labor_cost,
        '',
        detail.stone_weight,
        detail.stone_price,
        detail.total_cost,
      ]);
    } else { // template3
      headers = ['序号', '产品名称', '数量', '毛重', '', '净金重', '', '工费', '', '附加工费', '镶嵌位', '镶嵌工费', '', '石头/CT', '石头单价', '合计'];
      detailRows = details.map((detail, index) => [
        index + 1,
        detail.product_name,
        detail.quantity,
        detail.weight,
        '',
        detail.pure_weight,
        '',
        detail.labor_cost,
        '',
        detail.extra_fee,
        detail.inlay_count,
        detail.inlay_labor_cost,
        '',
        detail.stone_weight,
        detail.stone_price,
        detail.total_cost,
      ]);
    }

    worksheetData.push(headers);
    worksheetData = worksheetData.concat(detailRows);
    worksheetData.push(['合计', '', details.reduce((sum, d) => sum + d.quantity, 0), order.total_weight, '', order.total_pure_weight, '', '', '', '', '', '', '', '', '', order.total_cost]);

    if (template !== 'template3') {
      const owed = await CustomerOwed.findOne({ where: { customer_id: order.customer_id, material_type: '足金板料' } });
      worksheetData.push(['上期存欠明细']);
      worksheetData.push(['序号', '项目名', '存料/欠料', '', '', '金重', '', '项目名', '', '存工费/欠工费', '', '', '工费', '', '备注']);
      worksheetData.push([1, '足金板料', '', '', '', owed?.material_amount || 0, '', '工费', '', '', '', '', owed?.labor_amount || 0, '', '']);
      worksheetData.push(['合计', '', '', '', '', owed?.material_amount || 0, '', '', '', '', '', '', owed?.labor_amount || 0, '']);
      worksheetData.push(['总计存欠帐(正欠负存):足金板料', '', '', '', '', Number((owed?.material_amount || 0) + (order.settle_material ? order.total_pure_weight : 0)).toFixed(2), '', '', '', '', '', '', '总计存欠帐(正欠负存):工费', '', Number((owed?.labor_amount || 0) + order.total_cost).toFixed(2)]);
    }

    worksheetData.push(['温馨提示：']);
    worksheetData.push(['①以上数据请认真核对；②本公司所有销售均通过检测，为了保障您的利益，请将以上饰品送到当地检测部门检测后再上柜销售，未经当地部门检测就上柜销售，发生经济纠纷与本公司无关']);
    worksheetData.push(['③该物品如需邮寄，邮寄及安全自负，本公司只负责在交付物流公司之前的安全。④本公司现款现结谢谢合作。']);
    worksheetData.push(['制单：', '', '', '', '复核：', '', '', '', '负责人：', '', '', '', '客户签名：']);

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    XLSX.utils.book_append_sheet(workbook, worksheet, '销售结算单');
    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    res.setHeader('Content-Disposition', `attachment; filename=销售结算单_${order.order_number}.xlsx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    console.error('Print voucher failed:', err);
    res.status(500).json({ error: err.message });
  }
});

// Batch Print Barcodes
app.post('/api/printBarcodes', async (req, res) => {
  const { barcodes, template_id } = req.body;
  if (!barcodes || !Array.isArray(barcodes)) {
    return res.status(400).json({ error: 'Validation failed: barcodes must be an array' });
  }
  try {
    const template = await LabelTemplate.findByPk(template_id);
    if (!template) return res.status(404).json({ error: 'Label template not found' });

    const workbook = XLSX.utils.book_new();
    const worksheetData = [
      ['条形码', '金重', '标准'],
    ];

    barcodes.forEach(barcode => {
      worksheetData.push([
        barcode,
        Number(template.gold_weight).toFixed(2),
        template.standard,
      ]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Barcodes');
    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    res.setHeader('Content-Disposition', `attachment; filename=barcodes_${Date.now()}.xlsx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    console.error('Print barcodes failed:', err);
    res.status(500).json({ error: err.message });
  }
});

// Payment Records Management
app.get('/api/paymentRecords', async (req, res) => {
  const { page = 1, size = 10, supplier_id, customer_id, start_date, end_date } = req.query;
  try {
    const where = {};
    if (supplier_id) where.supplier_id = supplier_id;
    if (customer_id) where.customer_id = customer_id;
    if (start_date && end_date) {
      where.payment_date = { [Sequelize.Op.between]: [new Date(start_date), new Date(end_date)] };
    }
    const result = await paginate(PaymentRecord, parseInt(page), parseInt(size), {
      where,
      include: [
        { model: Supplier, as: 'supplier', attributes: ['short_name'] },
        { model: Customer, as: 'customer', attributes: ['short_name'] },
      ],
    });
    res.json(result);
  } catch (err) {
    console.error('Payment records query failed:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/paymentRecords', async (req, res) => {
  const payments = Array.isArray(req.body) ? req.body : [req.body];
  try {
    const results = await Promise.all(payments.map(async ({ supplier_id, customer_id, type, amount, description, order_number }) => {
      if (!supplier_id && !customer_id) {
        throw new Error('供应商或客户必须选择一个');
      }
      if (!type || !amount) {
        throw new Error('类型和数量为必填项');
      }
      const parsedAmount = parseFloat(amount).toFixed(2);
      const adjustedAmount = type.includes('expense') ? -parsedAmount : parsedAmount;
      const paymentNumber = order_number || await generatePaymentNumber();
      const payment = await PaymentRecord.create({
        supplier_id: supplier_id || null,
        customer_id: customer_id || null,
        payment_date: new Date(),
        type,
        amount: adjustedAmount,
        description,
        order_number: paymentNumber,
      });

      if (type === 'income_material' || type === 'income_material_customer') {
        await MaterialInventory.update(
          { weight: Sequelize.literal(`weight + ${parsedAmount}`) },
          { where: { material_type: '足金板料' } }
        );
      } else if (type === 'expense_material' || type === 'expense_material_customer') {
        await MaterialInventory.update(
          { weight: Sequelize.literal(`weight - ${parsedAmount}`) },
          { where: { material_type: '足金板料' } }
        );
      }

      return payment;
    }));
    res.status(201).json(results);
  } catch (err) {
    console.error('Create payment record failed:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/paymentRecords/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const payment = await PaymentRecord.findByPk(id);
    if (!payment) return res.status(404).json({ error: '记录不存在' });

    if (payment.type === 'income_material' || payment.type === 'income_material_customer') {
      await MaterialInventory.update(
        { weight: Sequelize.literal(`weight - ${parseFloat(payment.amount)}`) },
        { where: { material_type: '足金板料' } }
      );
    } else if (payment.type === 'expense_material' || payment.type === 'expense_material_customer') {
      await MaterialInventory.update(
        { weight: Sequelize.literal(`weight + ${parseFloat(payment.amount)}`) },
        { where: { material_type: '足金板料' } }
      );
    }

    await payment.destroy();
    res.json({ message: '记录已删除' });
  } catch (err) {
    console.error('Delete payment record failed:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/printPaymentVoucher', async (req, res) => {
  const { payment_ids, type } = req.body;
  if (!payment_ids || !Array.isArray(payment_ids)) {
    return res.status(400).json({ error: '支付记录 ID 必须为数组' });
  }
  try {
    const payments = await PaymentRecord.findAll({
      where: { id: { [Sequelize.Op.in]: payment_ids } },
      include: [
        { model: Supplier, as: 'supplier', attributes: ['short_name'] },
        { model: Customer, as: 'customer', attributes: ['short_name'] },
      ],
    });
    if (payments.length === 0) return res.status(404).json({ error: '未找到支付记录' });

    const workbook = XLSX.utils.book_new();
    const worksheetData = [
      ['收支凭证'],
      ['单号', '日期', type === 'supplier' ? '供应商' : '客户', '类型', '数量', '备注'],
    ];

    payments.forEach(payment => {
      const entityName = type === 'supplier' ? (payment.supplier?.short_name || '未知') : (payment.customer?.short_name || '未知');
      worksheetData.push([
        payment.order_number,
        format(new Date(payment.payment_date), 'yyyy-MM-dd HH:mm:ss'),
        entityName,
        {
          'income_material': '收入板料',
          'expense_material': '支出板料',
          'income_fee': '收入工费',
          'expense_fee': '支出工费',
          'income_material_customer': '收入板料',
          'expense_material_customer': '支出板料',
          'income_fee_customer': '收入工费',
          'expense_fee_customer': '支出工费',
        }[payment.type],
        `${Math.abs(Number(payment.amount)).toFixed(2)} ${payment.type.includes('material') ? 'g' : '元'}`,
        payment.description || '',
      ]);
    });

    worksheetData.push([]);
    worksheetData.push([
      '总计板料 (g):',
      Number(payments.reduce((sum, p) => sum + (p.type.includes('material') ? parseFloat(p.amount) : 0), 0)).toFixed(2),
      '总计工费 (元):',
      Number(payments.reduce((sum, p) => sum + (p.type.includes('fee') ? parseFloat(p.amount) : 0), 0)).toFixed(2),
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    XLSX.utils.book_append_sheet(workbook, worksheet, '收支凭证');
    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    res.setHeader('Content-Disposition', `attachment; filename=收支凭证_${format(new Date(), 'yyyyMMdd')}.xlsx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    console.error('Print payment voucher failed:', err);
    res.status(500).json({ error: err.message });
  }
});

// Customer Owed Management
app.get('/api/customerOwed', async (req, res) => {
  const { customer_id } = req.query;
  if (!customer_id) return res.status(400).json({ error: '客户 ID 为必填项' });
  try {
    const owed = await CustomerOwed.findOne({ where: { customer_id } });
    res.json(owed || { material_amount: 0, labor_amount: 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/customerOwed/update', async (req, res) => {
  const { customer_id, material_amount, labor_amount } = req.body;
  try {
    let owed = await CustomerOwed.findOne({ where: { customer_id, material_type: '足金板料' } });
    if (owed) {
      owed.material_amount = Number(parseFloat(owed.material_amount) + parseFloat(material_amount)).toFixed(2);
      owed.labor_amount = Number(parseFloat(owed.labor_amount) + parseFloat(labor_amount)).toFixed(2);
      owed.updated_at = new Date();
      await owed.save();
    } else {
      await CustomerOwed.create({
        customer_id,
        material_type: '足金板料',
        material_amount: Number(parseFloat(material_amount)).toFixed(2),
        labor_amount: Number(parseFloat(labor_amount)).toFixed(2),
        updated_at: new Date(),
      });
    }
    res.status(200).json({ message: '存欠更新成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/customerReport', async (req, res) => {
  const { customer_id, start_date, end_date } = req.query;
  try {
    const where = {};
    if (start_date && end_date) {
      where.date = { [Sequelize.Op.between]: [new Date(start_date), new Date(end_date)] };
    }
    if (customer_id) {
      where.customer_id = customer_id;
    }

    const orders = await OutboundOrder.findAll({
      where,
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'short_name'] },
        { model: OutboundOrderDetail, as: 'OutboundOrderDetails' },
      ],
    });

    // 转换为明细数据
    const reportData = [];
    orders.forEach((order, index) => {
      order.OutboundOrderDetails.forEach((detail, detailIndex) => {
        reportData.push({
          index: index * order.OutboundOrderDetails.length + detailIndex + 1,
          order_number: order.order_number,
          product_name: detail.product_name,
          weight: Number(detail.weight).toFixed(2),
          pure_weight: Number(detail.pure_weight || 0).toFixed(2),
          quantity: detail.quantity,
          labor_cost: Number(detail.labor_cost || 0).toFixed(2),
          inlay_fee: Number((detail.inlay_count * detail.inlay_labor_cost) + (detail.stone_weight * detail.stone_price)).toFixed(2),
          inlay_count: detail.inlay_count,
          inlay_labor_cost: Number(detail.inlay_labor_cost || 0).toFixed(2),
          stone_weight: Number(detail.stone_weight || 0).toFixed(2),
          stone_price: Number(detail.stone_price || 0).toFixed(2),
          total_cost: Number(detail.total_cost || 0).toFixed(2),
        });
      });
    });

    res.json({ data: reportData });
  } catch (err) {
    console.error('Customer report query failed:', err);
    res.status(500).json({ error: err.message });
  }
});

// Start Server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});