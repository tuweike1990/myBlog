<template>
  <header class="app-header">
    <div class="header-inner">
      <router-link to="/" class="logo">涂伟可的个人博客</router-link>
      <nav class="nav">
        <router-link to="/">首页</router-link>
        <router-link
          v-for="cat in categories"
          :key="cat.id"
          :to="`/category/${cat.slug}`"
        >
          {{ cat.name }}
        </router-link>
        <template v-if="authStore.isLoggedIn">
          <router-link to="/admin">后台</router-link>
          <a href="#" @click.prevent="handleLogout">退出</a>
        </template>
        <router-link v-else to="/login">登录</router-link>
      </nav>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { getCategories } from "../api/categories";

const authStore = useAuthStore();
const router = useRouter();
const categories = ref([]);

onMounted(async () => {
  try {
    categories.value = await getCategories();
  } catch {
    // 静默处理
  }
});

function handleLogout() {
  authStore.logout();
  router.push("/");
}
</script>

<style scoped>
.app-header {
  background: #fff;
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-inner {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 0 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 56px;
}

.logo {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-primary);
}

.logo:hover {
  color: var(--color-primary-dark);
}

.nav {
  display: flex;
  gap: 16px;
  align-items: center;
}

.nav a {
  color: var(--color-text-light);
  font-size: 14px;
  transition: color 0.2s;
}

.nav a:hover,
.nav a.router-link-active {
  color: var(--color-primary);
}
</style>
