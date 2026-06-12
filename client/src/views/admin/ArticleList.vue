<template>
  <div class="article-list-page">
    <div class="page-header">
      <h1 class="page-title">文章管理</h1>
      <router-link to="/admin/articles/new" class="btn btn-primary">写文章</router-link>
    </div>

    <div class="filter-bar">
      <select v-model="statusFilter" class="form-control" style="width:auto" @change="changePage(1)">
        <option value="">全部状态</option>
        <option value="published">已发布</option>
        <option value="draft">草稿</option>
      </select>
    </div>

    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="articles.length === 0" class="empty">暂无文章</div>
    <div v-else>
      <div class="article-item card" v-for="article in articles" :key="article.id">
        <div class="article-info">
          <h3 class="article-title">{{ article.title }}</h3>
          <div class="article-meta">
            <span :class="article.status === 'published' ? 'status-published' : 'status-draft'">
              {{ article.status === 'published' ? '已发布' : '草稿' }}
            </span>
            <span v-if="article.categoryName">{{ article.categoryName }}</span>
            <span>{{ formatDate(article.createdAt) }}</span>
            <span>{{ article.viewCount }} 阅读</span>
          </div>
        </div>
        <div class="article-actions">
          <router-link :to="`/admin/articles/${article.id}`" class="btn btn-sm btn-primary">编辑</router-link>
          <button class="btn btn-sm btn-danger" @click="handleDelete(article)">删除</button>
        </div>
      </div>
      <Pagination :total="total" :page="page" :pageSize="pageSize" @change="changePage" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getAdminArticles, deleteArticle } from '../../api/articles'
import Pagination from '../../components/Pagination.vue'

const articles = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const statusFilter = ref('')
const loading = ref(true)

async function fetchArticles() {
  loading.value = true
  try {
    const params = { page: page.value, pageSize: pageSize.value }
    if (statusFilter.value) params.status = statusFilter.value
    const data = await getAdminArticles(params)
    articles.value = data.list
    total.value = data.total
  } catch {
    articles.value = []
  } finally {
    loading.value = false
  }
}

function changePage(p) {
  page.value = p
  fetchArticles()
}

async function handleDelete(article) {
  if (!confirm(`确定删除文章「${article.title}」？`)) return
  try {
    await deleteArticle(article.id)
    fetchArticles()
  } catch (e) {
    alert(e.message || '删除失败')
  }
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return dateStr.slice(0, 10)
}

onMounted(fetchArticles)
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
}

.filter-bar {
  margin-bottom: 16px;
}

.article-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.article-title {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 4px;
}

.article-meta {
  display: flex;
  gap: 12px;
  font-size: 13px;
  color: var(--color-text-lighter);
}

.article-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}
</style>
