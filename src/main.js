import { createApp } from 'vue';
import App from './App.vue';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import * as XLSX from 'xlsx';
import router from './router'; // 引入 router
import axios from 'axios';

const app = createApp(App);

app.use(ElementPlus, {
  components: {
    ElInputNumber: {
      props: {
        controls: false,
      },
    },
  },
});
app.use(router); // 注册 Vue Router
app.config.globalProperties.$axios = axios.create({ baseURL: 'http://localhost:3000' });
app.config.globalProperties.$XLSX = XLSX;

app.mount('#app');