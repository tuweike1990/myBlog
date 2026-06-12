<template>
  <div class="article-edit">
    <div class="page-header">
      <h1 class="page-title">{{ isEdit ? '编辑文章' : '写文章' }}</h1>
      <router-link to="/admin/articles" class="btn btn-sm" style="background:#607d8b;color:#fff">返回列表</router-link>
    </div>

    <div v-if="loading" class="loading">加载中...</div>
    <div v-else class="edit-form card">
      <div class="form-group">
        <label>标题</label>
        <input v-model="form.title" type="text" class="form-control" placeholder="请输入文章标题" />
      </div>

      <div class="form-row">
        <div class="form-group" style="flex:1">
          <label>分类</label>
          <select v-model="form.categoryId" class="form-control">
            <option :value="null">请选择分类</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
          </select>
        </div>
        <div class="form-group" style="flex:1">
          <label>状态</label>
          <select v-model="form.status" class="form-control">
            <option value="draft">草稿</option>
            <option value="published">发布</option>
          </select>
        </div>
      </div>

      <div class="form-group">
        <label>标签（逗号分隔）</label>
        <input v-model="tagInput" type="text" class="form-control" placeholder="例如：Vue, 前端, 教程" />
      </div>

      <div class="form-group">
        <label>摘要</label>
        <textarea v-model="form.excerpt" class="form-control" rows="2" placeholder="文章摘要（可选）"></textarea>
      </div>

      <div class="form-group">
        <label>正文（Markdown）</label>
        <div class="editor-wrapper">
          <MdEditor v-model="form.content" :language="'zh-CN'" :toolbarsExclude="['github']" @onUploadImg="handleUploadImg" />
        </div>
      </div>

      <div class="form-actions">
        <button class="btn btn-primary" @click="handleSave('draft')" :disabled="saving">
          保存草稿
        </button>
        <button class="btn btn-primary" @click="handleSave('published')" :disabled="saving" style="background:var(--color-success)">
          {{ saving ? '保存中...' : '发布文章' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import { getAdminArticle, createArticle, updateArticle } from '../../api/articles'
import { getCategories } from '../../api/categories'
import { uploadImage } from '../../api/upload'

const route = useRoute()
const router = useRouter()

const isEdit = computed(() => !!route.params.id)
const loading = ref(isEdit.value)
const saving = ref(false)
const categories = ref([])

const form = ref({
  title: '',
  content: '',
  excerpt: '',
  categoryId: null,
  status: 'draft',
})
const tagInput = ref('')

onMounted(async () => {
  try {
    categories.value = await getCategories()
  } catch {}

  if (isEdit.value) {
    try {
      const article = await getAdminArticle(route.params.id)
      form.value.title = article.title
      form.value.content = article.content
      form.value.excerpt = article.excerpt
      form.value.categoryId = article.categoryId
      form.value.status = article.status
      if (article.tags && article.tags.length) {
        tagInput.value = article.tags.map(t => t.name).join(', ')
      }
    } catch {
      alert('文章加载失败')
      router.push('/admin/articles')
    } finally {
      loading.value = false
    }
  }
})

async function handleSave(status) {
  if (!form.value.title) {
    alert('请输入文章标题')
    return
  }
  saving.value = true
  form.value.status = status

  const tagNames = tagInput.value
    ? tagInput.value.split(/[,，]/).map(t => t.trim()).filter(Boolean)
    : []

  const data = {
    ...form.value,
    tagNames,
  }

  try {
    if (isEdit.value) {
      await updateArticle(route.params.id, data)
      alert('文章更新成功')
    } else {
      await createArticle(data)
      alert('文章创建成功')
    }
    router.push('/admin/articles')
  } catch (e) {
    alert(e.message || '保存失败')
  } finally {
    saving.value = false
  }
}

async function handleUploadImg(files, callback) {
  const urls = []
  for (const file of files) {
    try {
      const data = await uploadImage(file)
      urls.push(data.url)
    } catch {
      alert('图片上传失败')
    }
  }
  callback(urls)
}
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

.edit-form {
  padding: 24px;
}

.form-row {
  display: flex;
  gap: 16px;
}

.editor-wrapper {
  height: 500px;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

@media (max-width: 600px) {
  .form-row {
    flex-direction: column;
    gap: 0;
  }
}
</style>
