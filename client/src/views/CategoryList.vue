<template>
  <div class="category-list">
    <h1 class="page-title">{{ category ? category.name : '分类' }}</h1>
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="articles.length === 0" class="empty">该分类下暂无文章</div>
    <div v-else>
      <ArticleCard v-for="article in articles" :key="article.id" :article="article" />
      <Pagination :total="total" :page="page" :pageSize="pageSize" @change="changePage" />
    </div>
    <div class="back-link">
      <router-link to="/">← 返回首页</router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getCategoryArticles } from '../api/categories'
import ArticleCard from '../components/ArticleCard.vue'
import Pagination from '../components/Pagination.vue'

const route = useRoute()
const category = ref(null)
const articles = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const loading = ref(true)

async function fetchArticles() {
  loading.value = true
  try {
    const data = await getCategoryArticles(route.params.slug, {
      page: page.value,
      pageSize: pageSize.value,
    })
    category.value = data.category
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
watch(() => route.params.slug, () => {
  page.value = 1
  fetchArticles()
})
</script>

<style scoped>
.page-title {
  font-size: 24px;
  margin-bottom: 20px;
  font-weight: 700;
}

.back-link {
  margin-top: 24px;
}
</style>
