<template>
  <el-menu :default-active="activePath" class="sidebar-menu" @select="handleSelect">
    <el-menu-item v-for="item in menu" :key="item.path" :index="item.path">
      <i :class="item.icon"></i>
      <span>{{ item.label }}</span>
    </el-menu-item>
  </el-menu>
</template>

<script>
import { useRoute } from 'vue-router';
import { defineComponent, computed } from 'vue';

export default defineComponent({
  name: 'SideBar',
  props: {
    menu: {
      type: Array,
      default: () => [],
    },
  },
  setup(props, { emit }) {
    const route = useRoute();
    const activePath = computed(() => route.path);

    const handleSelect = (path) => {
      const item = props.menu.find(m => m.path === path);
      if (item) emit('select', path, item.label);
    };

    return {
      activePath,
      handleSelect,
    };
  },
});
</script>

<style scoped>
.sidebar-menu { border: none; }
</style>