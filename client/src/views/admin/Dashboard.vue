<template>
  <div class="dashboard">
    <h1 class="page-title">后台管理</h1>
    <div class="stats">
      <div class="stat-card card">
        <div class="stat-number">{{ articleCount }}</div>
        <div class="stat-label">文章总数</div>
      </div>
      <div class="stat-card card">
        <div class="stat-number">{{ publishedCount }}</div>
        <div class="stat-label">已发布</div>
      </div>
      <div class="stat-card card">
        <div class="stat-number">{{ draftCount }}</div>
        <div class="stat-label">草稿</div>
      </div>
      <div class="stat-card card">
        <div class="stat-number">{{ categoryCount }}</div>
        <div class="stat-label">分类</div>
      </div>
    </div>
    <div class="actions">
      <router-link to="/admin/articles/new" class="btn btn-primary">写文章</router-link>
      <router-link to="/admin/articles" class="btn btn-primary" style="background:#607d8b">文章管理</router-link>
      <router-link to="/admin/categories" class="btn btn-primary" style="background:#607d8b">分类管理</router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getAdminArticles } from '../../api/articles'
import { getCategories } from '../../api/categories'

const articleCount = ref(0)
const publishedCount = ref(0)
const draftCount = ref(0)
const categoryCount = ref(0)

onMounted(async () => {
  try {
    const [articlesData, categoriesData] = await Promise.all([
      getAdminArticles({ page: 1, pageSize: 1 }),
      getCategories(),
    ])
    articleCount.value = articlesData.total
    categoryCount.value = categoriesData.length

    const [pub, draft] = await Promise.all([
      getAdminArticles({ page: 1, pageSize: 1, status: 'published' }),
      getAdminArticles({ page: 1, pageSize: 1, status: 'draft' }),
    ])
    publishedCount.value = pub.total
    draftCount.value = draft.total
  } catch {
    // 静默处理
  }
})
</script>

<style scoped>
.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  text-align: center;
}

.stat-number {
  font-size: 32px;
  font-weight: 700;
  color: var(--color-primary);
}

.stat-label {
  font-size: 14px;
  color: var(--color-text-lighter);
  margin-top: 4px;
}

.actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
</style>
