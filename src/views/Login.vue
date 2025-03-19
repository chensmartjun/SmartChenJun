<!-- src/views/Login.vue -->
<template>
  <div class="login">
    <h2>登录</h2>
    <el-button type="primary" @click="$router.push('/')">返回首页</el-button>
  </div>
</template>

<script>
export default {
  name: 'LoginPage',
};
</script>

<style scoped>
.login { text-align: center; padding: 50px; }
</style>