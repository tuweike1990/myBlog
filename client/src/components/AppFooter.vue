<template>
  <footer class="app-footer">
    <p>&copy; {{ year }} 我的博客 · 用心记录生活</p>
  </footer>
</template>

<script setup>
const year = new Date().getFullYear()
</script>

<style scoped>
.app-footer {
  text-align: center;
  padding: 20px 16px;
  color: var(--color-text-lighter);
  font-size: 13px;
  border-top: 1px solid var(--color-border);
  margin-top: 40px;
}
</style>
