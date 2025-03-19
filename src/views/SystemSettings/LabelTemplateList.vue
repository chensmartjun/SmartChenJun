<template>
  <div class="module-container">
    <div class="operation-bar">
      <el-button type="primary" icon="el-icon-plus" @click="addTemplate">新建</el-button>
      <el-button type="warning" icon="el-icon-edit" @click="editTemplate" :disabled="selectedRows.length !== 1">修改</el-button>
      <el-button type="danger" icon="el-icon-delete" @click="deleteTemplate" :disabled="selectedRows.length === 0">删除</el-button>
      <el-button type="success" @click="saveTemplate" :disabled="!formVisible">保存</el-button>
      <el-button type="info" @click="formVisible = false" :disabled="!formVisible">撤回</el-button>
      <el-button type="primary" icon="el-icon-download" @click="exportData">导出</el-button>
    </div>
    <div class="form-section" v-if="formVisible">
      <el-form :model="templateForm" :rules="rules" ref="templateForm" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="模板名称" prop="name">
              <el-input v-model="templateForm.name"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="模板类型" prop="type">
              <el-select v-model="templateForm.type" placeholder="选择类型" @change="updateTemplateDimensions">
                <el-option label="K 款 (横版)" value="K"></el-option>
                <el-option label="L 款 (竖版)" value="L"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="标签宽度 (mm)" prop="width">
              <el-input-number v-model="templateForm.width" :min="20" :max="200" :step="1" :controls="false"></el-input-number>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="标签高度 (mm)" prop="height">
              <el-input-number v-model="templateForm.height" :min="20" :max="200" :step="1" :controls="false"></el-input-number>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="显示字段">
          <el-checkbox-group v-model="templateForm.fields" @change="handleFieldsChange">
            <el-checkbox v-for="field in ['barcode', 'pureWeight', 'inlayCount', 'stoneWeight', 'extraFee', 'productName']" :key="field" :label="field" :value="field">
              {{ fieldLabel(field) }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="自定义内容" prop="customContent">
          <el-input type="textarea" v-model="templateForm.customContent" :rows="4" placeholder="请输入自定义内容"></el-input>
        </el-form-item>
        <el-form-item label="条形码字体大小 (px)">
          <el-input-number v-model="templateForm.positions.barcode.fontSize" :min="8" :max="24" :step="1" :controls="true" style="width: 120px;" @change="updatePreview"></el-input-number>
        </el-form-item>
        <el-form-item label="字段字体大小 (px)">
          <div v-for="field in displayedFields.filter(f => f !== 'barcode' && templateForm.positions[f])" :key="field + '-fontSize'" class="font-size-adjust">
            <label style="width: 100px; display: inline-block;">{{ fieldLabel(field) }}</label>
            <el-input-number v-model="templateForm.positions[field].fontSize" :min="8" :max="24" :step="1" :controls="true" style="width: 120px;" @change="updatePreview"></el-input-number>
          </div>
        </el-form-item>
      </el-form>
      <div class="preview-section">
        <h3>标签预览</h3>
        <div class="preview-wrapper">
          <div class="size-label top-label">{{ templateForm.width }}mm</div>
          <div class="size-label right-label">{{ templateForm.height }}mm</div>
          <div class="label-preview" :style="previewStyle" ref="previewArea">
            <div class="fold-line" :style="foldLineStyle"></div>
            <div v-for="(field, index) in displayedFields" :key="index" class="draggable-field"
                 :style="getFieldStyle(field)" @mousedown="startDragging($event, field)" :ref="setFieldRef">
              <div v-if="field === 'barcode'" class="barcode-container" :class="{ rotate: this.templateForm.type === 'L' }">
                <svg :ref="`barcodeSvg-${index}`" class="barcode-svg"></svg>
                <div class="barcode-number">{{ previewItem.barcode }}</div>
              </div>
              <div v-else>{{ getFieldContent(field) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <el-table :data="templates" border @selection-change="handleSelectionChange" v-loading="loading">
      <el-table-column type="selection" width="55"></el-table-column>
      <el-table-column prop="name" label="模板名称"></el-table-column>
      <el-table-column prop="type" label="模板类型"></el-table-column>
    </el-table>
    <el-pagination
      @current-change="fetchTemplates"
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
import axios from 'axios';
import JsBarcode from 'jsbarcode';

export default {
  name: 'LabelTemplateList',
  data() {
    return {
      templates: [],
      selectedRows: [],
      formVisible: false,
      templateForm: {
        id: null,
        name: '',
        type: 'K',
        width: 32,
        height: 44,
        fields: ['barcode', 'pureWeight', 'inlayCount', 'stoneWeight', 'extraFee', 'productName'],
        customContent: '',
        positions: {
          barcode: { x: 5, y: 5, fontSize: 12 },
          pureWeight: { x: 5, y: 10, fontSize: 12 },
          inlayCount: { x: 5, y: 20, fontSize: 12 },
          stoneWeight: { x: 5, y: 30, fontSize: 12 },
          extraFee: { x: 5, y: 40, fontSize: 12 },
          productName: { x: 5, y: 50, fontSize: 12 },
          customContent: { x: 5, y: 60, fontSize: 12 },
        },
      },
      rules: {
        name: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
        type: [{ required: true, message: '请选择模板类型', trigger: 'change' }],
        width: [{ required: true, message: '请输入宽度', trigger: 'blur' }],
        height: [{ required: true, message: '请输入高度', trigger: 'blur' }],
      },
      page: 1,
      size: 10,
      total: 0,
      loading: false,
      previewItem: {
        barcode: '82300016',
        pureWeight: 0,
        goldWeight: 5.23,
        inlayCount: 2,
        stoneWeight: 0.5,
        extraFee: 2.00,
        productName: '黄金戒指',
      },
      draggingField: null,
      dragOffset: { x: 0, y: 0 },
      fieldRefs: [],
    };
  },
  computed: {
    previewStyle() {
      const scale = 5;
      return {
        width: `${this.templateForm.width * scale}px`,
        height: `${this.templateForm.height * scale}px`,
        border: '1px solid #000',
        padding: '2px',
        position: 'relative',
        overflow: 'hidden',
        background: '#f9f9f9',
      };
    },
    foldLineStyle() {
      const scale = 5;
      if (this.templateForm.type === 'K') {
        return {
          position: 'absolute',
          left: '0',
          top: `${(this.templateForm.height / 2) * scale}px`,
          width: '100%',
          height: '1px',
          borderTop: '1px dashed #000',
        };
      } else {
        return {
          position: 'absolute',
          top: '0',
          left: `${(this.templateForm.width / 2) * scale}px`,
          height: '100%',
          width: '1px',
          borderLeft: '1px dashed #000',
        };
      }
    },
    displayedFields() {
      const fields = [...this.templateForm.fields];
      if (this.templateForm.customContent && !fields.includes('customContent')) {
        fields.push('customContent');
      }
      console.log('Displayed Fields:', fields);
      return fields;
    },
  },
  watch: {
    'templateForm.type': 'updateTemplateDimensions',
    'templateForm.width': 'updatePreview',
    'templateForm.height': 'updatePreview',
    'templateForm.fields': 'updatePreview',
    'templateForm.customContent': 'updatePreview',
    formVisible(val) {
      if (val) this.updatePreview();
    },
  },
  mounted() {
    this.fetchTemplates();
    document.addEventListener('mousemove', this.handleDragging);
    document.addEventListener('mouseup', this.stopDragging);
  },
  beforeUnmount() {
    document.removeEventListener('mousemove', this.handleDragging);
    document.removeEventListener('mouseup', this.stopDragging);
  },
  methods: {
    setFieldRef(el) {
      if (el) this.fieldRefs.push(el);
    },
    fieldLabel(field) {
      const fieldMap = {
        barcode: '条形码',
        pureWeight: '净金重',
        inlayCount: '镶嵌位',
        stoneWeight: '石重',
        extraFee: '附加费',
        productName: '产品名称',
        customContent: '自定义内容',
      };
      return fieldMap[field] || field;
    },
    handleFieldsChange(val) {
      console.log('Fields changed:', val);
      this.fieldRefs = []; // 清空 fieldRefs
      this.updatePreview(); // 强制更新预览
    },
    async fetchTemplates() {
      this.loading = true;
      try {
        // 添加随机参数避免缓存
        const res = await axios.get(`/labelTemplates?_page=${this.page}&_limit=${this.size}&_=${Date.now()}`, {
          baseURL: 'http://localhost:3000',
        });
        this.templates = res.data || [];
        this.total = parseInt(res.headers['x-total-count']) || res.data.length;
        console.log('Fetched templates:', this.templates);
      } catch (err) {
        console.error('Fetch error:', err);
        this.$message.error('加载失败: 请确保 json-server 运行在 http://localhost:3000，并检查 db.json 配置');
      } finally {
        this.loading = false;
      }
    },
    addTemplate() {
      this.formVisible = true;
      this.templateForm = {
        id: null,
        name: '',
        type: 'K',
        width: 32,
        height: 44,
        fields: ['barcode', 'pureWeight', 'inlayCount', 'stoneWeight', 'extraFee', 'productName'],
        customContent: '',
        positions: {
          barcode: { x: 5, y: 5, fontSize: 12 },
          pureWeight: { x: 5, y: 10, fontSize: 12 },
          inlayCount: { x: 5, y: 20, fontSize: 12 },
          stoneWeight: { x: 5, y: 30, fontSize: 12 },
          extraFee: { x: 5, y: 40, fontSize: 12 },
          productName: { x: 5, y: 50, fontSize: 12 },
          customContent: { x: 5, y: 60, fontSize: 12 },
        },
      };
      this.fieldRefs = [];
      this.updatePreview();
    },
    editTemplate() {
      if (this.selectedRows.length === 1) {
        this.formVisible = true;
        this.templateForm = { ...this.selectedRows[0] };
        if (!this.templateForm.positions) {
          this.templateForm.positions = {
            barcode: { x: 5, y: 5, fontSize: 12 },
            pureWeight: { x: 5, y: 10, fontSize: 12 },
            inlayCount: { x: 5, y: 20, fontSize: 12 },
            stoneWeight: { x: 5, y: 30, fontSize: 12 },
            extraFee: { x: 5, y: 40, fontSize: 12 },
            productName: { x: 5, y: 50, fontSize: 12 },
            customContent: { x: 5, y: 60, fontSize: 12 },
          };
        } else {
          const requiredFields = ['barcode', 'pureWeight', 'inlayCount', 'stoneWeight', 'extraFee', 'productName', 'customContent'];
          requiredFields.forEach(field => {
            if (!this.templateForm.positions[field]) {
              this.templateForm.positions[field] = { x: 5, y: 5 + requiredFields.indexOf(field) * 10, fontSize: 12 };
            } else if (!this.templateForm.positions[field].fontSize) {
              this.templateForm.positions[field].fontSize = 12;
            }
          });
        }
        this.fieldRefs = [];
        this.updatePreview();
      }
    },
    async deleteTemplate() {
      if (this.selectedRows.length > 0) {
        if (confirm('确定删除选中的记录？')) {
          await Promise.all(this.selectedRows.map(row => axios.delete(`/labelTemplates/${row.id}`, {
            baseURL: 'http://localhost:3000',
          })));
          this.$message.success('删除成功');
          this.fetchTemplates();
        }
      }
    },
    async saveTemplate() {
      console.log('Saving template:', JSON.stringify(this.templateForm, null, 2));
      this.$refs.templateForm.validate(async (valid) => {
        if (valid) {
          if (checkDuplicate(this.templates, this.templateForm, 'id', ['name'])) {
            this.$message.error(`模板名称 "${this.templateForm.name}" 已存在，请使用唯一名称`);
            return;
          }
          try {
            const method = this.templateForm.id ? 'put' : 'post';
            const url = this.templateForm.id ? `/labelTemplates/${this.templateForm.id}` : '/labelTemplates';
            const response = await axios[method](url, this.templateForm, {
              baseURL: 'http://localhost:3000',
            });
            console.log('Save response:', response);
            // 验证保存是否成功
            if (response.status === 200 || response.status === 201) {
              this.$message.success('保存成功');
              this.formVisible = false;
              this.page = 1; // 重置分页
              await this.fetchTemplates();
            } else {
              throw new Error(`保存失败，状态码: ${response.status}`);
            }
          } catch (err) {
            console.error('Save error:', err);
            this.$message.error('保存失败: ' + (err.response ? err.response.data.message : err.message));
          }
        } else {
          console.log('Validation failed');
          this.$message.error('请填写完整表单');
        }
      });
    },
    exportData() {
      const data = this.templates.map(item => ({
        模板名称: item.name,
        模板类型: item.type,
      }));
      const ws = this.$XLSX.utils.json_to_sheet(data);
      const wb = this.$XLSX.utils.book_new();
      this.$XLSX.utils.book_append_sheet(wb, ws, 'LabelTemplates');
      this.$XLSX.writeFile(wb, 'label_templates.xlsx');
    },
    handleSelectionChange(val) {
      this.selectedRows = val;
    },
    updateTemplateDimensions() {
      if (this.templateForm.type === 'K') {
        this.templateForm.width = 28;
        this.templateForm.height = 32;
      } else if (this.templateForm.type === 'L') {
        this.templateForm.width = 32;
        this.templateForm.height = 28;
      }
      console.log('Template type:', this.templateForm.type);
      this.updatePreview();
    },
    updatePreview() {
      if (this.formVisible) {
        this.$nextTick(() => {
          const scale = 5;
          if (this.templateForm.fields.includes('barcode') && this.fieldRefs.length > 0) {
            const barcodeIndex = this.displayedFields.indexOf('barcode');
            if (barcodeIndex !== -1 && this.$refs[`barcodeSvg-${barcodeIndex}`]) {
              const svg = this.$refs[`barcodeSvg-${barcodeIndex}`][0];
              const barcodeNumber = svg.nextElementSibling; // 获取 .barcode-number 元素
              const barcodeWidth = this.templateForm.type === 'K' ? Math.min(this.templateForm.width / 2, 15) * scale : 15 * scale;
              const barcodeHeight = this.templateForm.type === 'K' ? 15 * scale : Math.min(this.templateForm.height / 2, 20) * scale;
              // 交换宽度和高度以生成垂直条形码
              JsBarcode(svg, this.previewItem.barcode, {
                width: barcodeHeight / (10 * scale), // 垂直条形码的高度
                height: barcodeWidth / scale,       // 垂直条形码的宽度
                displayValue: false,
                format: 'CODE128',
                margin: 0,
                textAlign: 'center',
                fontSize: this.templateForm.positions.barcode.fontSize,
              });
              // 设置 barcode-container 的尺寸
              const barcodeContainer = svg.closest('.barcode-container');
              if (barcodeContainer) {
                if (this.templateForm.type === 'L') {
                  barcodeContainer.classList.add('rotate');
                  barcodeContainer.style.width = `${svg.getBoundingClientRect().width}px`;
                  barcodeContainer.style.height = `${svg.getBoundingClientRect().height}px`;
                  // 动态设置数字位置
                  if (barcodeNumber) {
                    barcodeNumber.style.left = `${svg.getBoundingClientRect().width + 2}px`; // 数字在右侧，偏移 2px
                    barcodeNumber.style.top = '0';
                  }
                } else {
                  barcodeContainer.classList.remove('rotate');
                  barcodeContainer.style.width = `${svg.getBoundingClientRect().width}px`;
                  barcodeContainer.style.height = `${svg.getBoundingClientRect().height}px`;
                  // 动态设置数字位置
                  if (barcodeNumber) {
                    barcodeNumber.style.top = `${svg.getBoundingClientRect().height + 2}px`; // 数字在下方，偏移 2px
                    barcodeNumber.style.left = '0';
                  }
                }
                // 调试日志
                console.log('Barcode Container Style:', {
                  width: barcodeContainer.style.width,
                  height: barcodeContainer.style.height,
                });
                console.log('Barcode SVG Dimensions:', {
                  width: svg.getBoundingClientRect().width,
                  height: svg.getBoundingClientRect().height,
                });
                if (barcodeNumber) {
                  console.log('Barcode Number Position:', {
                    left: barcodeNumber.style.left,
                    top: barcodeNumber.style.top,
                  });
                }
              }
              // 验证 SVG 样式
              console.log('Barcode SVG Style:', window.getComputedStyle(svg).transform);
            } else {
              console.warn('Barcode SVG ref not found');
            }
          }
          console.log('Displayed Fields in Preview:', this.displayedFields);
          this.displayedFields.forEach(field => {
            const content = this.getFieldContent(field);
            const style = this.getFieldStyle(field);
            console.log(`Field: ${field}, Content: ${content}, Style: ${JSON.stringify(style)}`);
          });
        });
      }
    },
    getFieldStyle(field) {
      const scale = 5;
      const position = this.templateForm.positions[field] || { x: 5, y: 5, fontSize: 12 };
      const fontSize = position.fontSize || 12;
      const isLType = this.templateForm.type === 'L';
      const rotation = isLType ? 'rotate(90deg)' : '';
      let adjustedY = Math.min(position.y * scale, (this.templateForm.height * scale) - fontSize - 5);
      let adjustedX = position.x * scale;

      // 调整 L 款时字段位置
      if (isLType) {
        adjustedX = position.x * scale; // 保持 x 坐标
        if (field === 'barcode') {
          adjustedY = Math.min(position.y * scale, (this.templateForm.width * scale) - fontSize - 5); // 使用 width 作为高度限制
        } else {
          adjustedY = position.y * scale; // 其他字段保持原有 y
        }
      }

      return {
        position: 'absolute',
        left: `${adjustedX}px`,
        top: `${adjustedY}px`,
        cursor: 'move',
        fontSize: `${fontSize}px`,
        color: '#000',
        zIndex: 2,
        transform: field === 'barcode' ? '' : rotation, // 条形码不依赖内联 transform
        transformOrigin: rotation ? 'left top' : '',
        whiteSpace: rotation ? 'nowrap' : '',
      };
    },
    getBarcodeStyle() {
      // 不再依赖内联 transform，完全使用 JsBarcode 调整和 CSS 类控制旋转
      return {
        position: 'absolute',
      };
    },
    getFieldContent(field) {
      const fieldMap = {
        pureWeight: `净金重: ${this.previewItem.pureWeight || this.previewItem.goldWeight || 0}g`,
        inlayCount: `镶嵌位: ${this.previewItem.inlayCount || 0}`,
        stoneWeight: `石重: ${this.previewItem.stoneWeight || 0}ct`,
        extraFee: `附加费: ¥${this.previewItem.extraFee || 0}`,
        productName: `产品名称: ${this.previewItem.productName || ''}`,
        customContent: this.templateForm.customContent || '',
      };
      const content = fieldMap[field] || '';
      return content;
    },
    startDragging(event, field) {
      const scale = 5;
      this.draggingField = field;
      const rect = event.target.getBoundingClientRect();
      this.dragOffset = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
      const fieldElement = this.fieldRefs.find(ref => ref.querySelector('.draggable-field')?.textContent.includes(this.getFieldContent(field)));
      if (fieldElement && field === 'barcode') {
        const svg = fieldElement.querySelector('svg');
        if (svg) {
          svg.style.left = `${this.templateForm.positions[field].x * scale}px`;
          svg.style.top = `${this.templateForm.positions[field].y * scale}px`;
          // 确保旋转样式由 CSS 类控制
          const barcodeContainer = svg.closest('.barcode-container');
          if (barcodeContainer) {
            if (this.templateForm.type === 'L') {
              barcodeContainer.classList.add('rotate');
            } else {
              barcodeContainer.classList.remove('rotate');
            }
          }
        }
      }
      console.log('Start Dragging - Field:', field, 'Position:', this.templateForm.positions[field]);
    },
    handleDragging(event) {
      const scale = 5;
      const isLType = this.templateForm.type === 'L';
      const maxX = isLType ? this.templateForm.height - 5 : this.templateForm.width - 5; // 旋转后宽度变成高度
      const maxY = isLType ? this.templateForm.width - 5 : this.templateForm.height - 5; // 旋转后高度变成宽度
      if (this.draggingField) {
        const previewRect = this.$refs.previewArea.getBoundingClientRect();
        const x = (event.clientX - previewRect.left - this.dragOffset.x) / scale;
        const y = (event.clientY - previewRect.top - this.dragOffset.y) / scale;
        this.templateForm.positions[this.draggingField] = {
          x: Math.max(0, Math.min(x, maxX)),
          y: Math.max(0, Math.min(y, maxY)),
          fontSize: this.templateForm.positions[this.draggingField].fontSize || 12,
        };
        // 同步更新条形码位置
        const fieldElement = this.fieldRefs.find(ref => ref.querySelector('.draggable-field')?.textContent.includes(this.getFieldContent(this.draggingField)));
        if (fieldElement && this.draggingField === 'barcode') {
          const svg = fieldElement.querySelector('svg');
          const barcodeNumber = fieldElement.querySelector('.barcode-number');
          if (svg && barcodeNumber) {
            svg.style.left = `${this.templateForm.positions[this.draggingField].x * scale}px`;
            svg.style.top = `${this.templateForm.positions[this.draggingField].y * scale}px`;
            // 动态调整数字位置
            if (isLType) {
              barcodeNumber.style.left = `${svg.getBoundingClientRect().width + 2}px`; // 数字在右侧，偏移 2px
              barcodeNumber.style.top = '0';
            } else {
              barcodeNumber.style.top = `${svg.getBoundingClientRect().height + 2}px`; // 数字在下方，偏移 2px
              barcodeNumber.style.left = '0';
            }
            // 确保旋转样式由 CSS 类控制
            const barcodeContainer = svg.closest('.barcode-container');
            if (barcodeContainer) {
              if (this.templateForm.type === 'L') {
                barcodeContainer.classList.add('rotate');
              } else {
                barcodeContainer.classList.remove('rotate');
              }
            }
          }
        }
      }
      console.log('Dragging - Field:', this.draggingField, 'Position:', this.templateForm.positions[this.draggingField], 'Max X:', maxX, 'Max Y:', maxY);
    },
    stopDragging() {
      this.draggingField = null;
      console.log('Stop Dragging - Final Position:', this.templateForm.positions[this.draggingField]);
    },
  },
};
</script>

<style scoped>
.module-container { padding: 20px; }
.operation-bar { margin-bottom: 20px; display: flex; gap: 10px; align-items: center; }
.form-section { margin-bottom: 20px; }
.preview-section { margin-top: 20px; }
.preview-wrapper { position: relative; display: inline-block; }
.label-preview { position: relative; display: inline-block; vertical-align: top; background: #f9f9f9; }
.size-label { position: absolute; font-size: 12px; color: #666; text-align: center; }
.top-label { top: -20px; left: 50%; transform: translateX(-50%); }
.right-label { right: -40px; top: 50%; transform: translateY(-50%) rotate(90deg); }
.fold-line { z-index: 1; }
.draggable-field { zIndex: 2; user-select: none; position: relative; }
.label-content { font-size: 12px; line-height: 1.2; padding: 2px; }
.barcode-container { position: relative; display: inline-block; }
.barcode-top { text-align: center; margin-bottom: 2px; }
.barcode-left { margin-right: 5px; }
.barcode-number {
  font-size: 8px;
  text-align: center;
  position: absolute;
  z-index: 3;
  top: 0;
  left: 0;
}
.barcode-container:not(.rotate) .barcode-number {
  /* 通过 JavaScript 动态设置 top 和 left */
}
.barcode-container.rotate .barcode-number {
  /* 通过 JavaScript 动态设置 top 和 left */
  transform: rotate(90deg) !important;
  transform-origin: left top;
}
.barcode-container.rotate .barcode-svg {
  transform: rotate(90deg) !important;
  transform-origin: left top;
}
.font-size-adjust { margin-bottom: 10px; }
</style>