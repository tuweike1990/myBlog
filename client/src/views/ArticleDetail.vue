<template>
  <div class="article-detail">
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="!article" class="empty">文章不存在</div>
    <article v-else>
      <h1 class="article-title">{{ article.title }}</h1>
      <div class="article-meta">
        <span v-if="article.categoryName" class="article-category">
          <router-link :to="`/category/${article.categorySlug}`">{{ article.categoryName }}</router-link>
        </span>
        <span>{{ formatDate(article.publishedAt || article.createdAt) }}</span>
        <span>{{ article.viewCount }} 次阅读</span>
      </div>
      <div class="article-tags" v-if="article.tags && article.tags.length">
        <span class="tag" v-for="tag in article.tags" :key="tag.id">{{ tag.name }}</span>
      </div>
      <MarkdownRenderer :content="article.content" />
    </article>
    <div class="back-link">
      <router-link to="/">← 返回首页</router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getArticleBySlug } from '../api/articles'
import MarkdownRenderer from '../components/MarkdownRenderer.vue'

const route = useRoute()
const article = ref(null)
const loading = ref(true)

function formatDate(dateStr) {
  if (!dateStr) return ''
  return dateStr.slice(0, 10)
}

async function fetchArticle() {
  loading.value = true
  try {
    article.value = await getArticleBySlug(route.params.slug)
  } catch {
    article.value = null
  } finally {
    loading.value = false
  }
}

onMounted(fetchArticle)
watch(() => route.params.slug, fetchArticle)
</script>

<style scoped>
.article-title {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 12px;
  line-height: 1.4;
}

.article-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: var(--color-text-lighter);
  margin-bottom: 8px;
}

.article-category a {
  color: var(--color-primary);
  font-size: 13px;
}

.article-tags {
  margin-bottom: 24px;
}

.back-link {
  margin-top: 32px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border);
}
</style>
