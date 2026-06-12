<template>
  <div class="article-card card" @click="$router.push(`/article/${article.slug}`)">
    <h2 class="article-title">{{ article.title }}</h2>
    <p class="article-excerpt" v-if="article.excerpt">{{ article.excerpt }}</p>
    <div class="article-meta">
      <span v-if="article.categoryName" class="article-category">
        <router-link :to="`/category/${article.categorySlug}`" @click.stop>{{ article.categoryName }}</router-link>
      </span>
      <span class="article-date">{{ formatDate(article.publishedAt || article.createdAt) }}</span>
      <span class="article-views">{{ article.viewCount }} 次阅读</span>
    </div>
    <div class="article-tags" v-if="article.tags && article.tags.length">
      <span class="tag" v-for="tag in article.tags" :key="tag.id">{{ tag.name }}</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  article: { type: Object, required: true },
})

function formatDate(dateStr) {
  if (!dateStr) return ''
  return dateStr.slice(0, 10)
}
</script>

<style scoped>
.article-card {
  cursor: pointer;
}

.article-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
  line-height: 1.4;
}

.article-title:hover {
  color: var(--color-primary);
}

.article-excerpt {
  color: var(--color-text-light);
  font-size: 14px;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
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

.article-category a:hover {
  text-decoration: underline;
}

.article-tags {
  margin-top: 4px;
}
</style>
