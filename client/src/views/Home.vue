<template>
  <div class="home">
    <h1 class="page-title">最新文章</h1>
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="articles.length === 0" class="empty">暂无文章</div>
    <div v-else>
      <ArticleCard v-for="article in articles" :key="article.id" :article="article" />
      <Pagination :total="total" :page="page" :pageSize="pageSize" @change="changePage" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { getArticles } from '../api/articles'
import ArticleCard from '../components/ArticleCard.vue'
import Pagination from '../components/Pagination.vue'

const articles = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const loading = ref(true)

async function fetchArticles() {
  loading.value = true
  try {
    const data = await getArticles({ page: page.value, pageSize: pageSize.value })
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
  window.scrollTo(0, 0)
}

onMounted(fetchArticles)
</script>

<style scoped>
.page-title {
  font-size: 24px;
  margin-bottom: 20px;
  font-weight: 700;
}
</style>
