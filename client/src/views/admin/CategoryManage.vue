<template>
  <div class="category-manage">
    <h1 class="page-title">分类管理</h1>

    <div class="add-form card">
      <h3>{{ editingId ? '编辑分类' : '添加分类' }}</h3>
      <div class="form-row">
        <div class="form-group" style="flex:1">
          <label>分类名称</label>
          <input v-model="form.name" type="text" class="form-control" placeholder="例如：前端开发" />
        </div>
        <div class="form-group" style="flex:1">
          <label>Slug</label>
          <input v-model="form.slug" type="text" class="form-control" placeholder="例如：frontend" />
        </div>
        <div class="form-group" style="width:100px">
          <label>排序</label>
          <input v-model.number="form.sortOrder" type="number" class="form-control" />
        </div>
      </div>
      <div class="form-actions">
        <button class="btn btn-primary" @click="handleSave" :disabled="saving">
          {{ saving ? '保存中...' : (editingId ? '更新' : '添加') }}
        </button>
        <button v-if="editingId" class="btn btn-sm" style="background:#607d8b;color:#fff" @click="cancelEdit">取消</button>
      </div>
    </div>

    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="categories.length === 0" class="empty">暂无分类</div>
    <div v-else>
      <div class="category-item card" v-for="cat in categories" :key="cat.id">
        <div class="category-info">
          <span class="category-name">{{ cat.name }}</span>
          <span class="category-slug">/{{ cat.slug }}</span>
          <span class="category-count">{{ cat.articleCount }} 篇文章</span>
        </div>
        <div class="category-actions">
          <button class="btn btn-sm btn-primary" @click="startEdit(cat)">编辑</button>
          <button class="btn btn-sm btn-danger" @click="handleDelete(cat)">删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../api/categories'

const categories = ref([])
const loading = ref(true)
const saving = ref(false)
const editingId = ref(null)

const form = ref({
  name: '',
  slug: '',
  sortOrder: 0,
})

async function fetchCategories() {
  loading.value = true
  try {
    categories.value = await getCategories()
  } catch {
    categories.value = []
  } finally {
    loading.value = false
  }
}

function startEdit(cat) {
  editingId.value = cat.id
  form.value = {
    name: cat.name,
    slug: cat.slug,
    sortOrder: cat.sortOrder,
  }
}

function cancelEdit() {
  editingId.value = null
  form.value = { name: '', slug: '', sortOrder: 0 }
}

async function handleSave() {
  if (!form.value.name || !form.value.slug) {
    alert('请填写分类名称和 Slug')
    return
  }
  saving.value = true
  try {
    if (editingId.value) {
      await updateCategory(editingId.value, form.value)
      alert('更新成功')
    } else {
      await createCategory(form.value)
      alert('添加成功')
    }
    cancelEdit()
    fetchCategories()
  } catch (e) {
    alert(e.message || '操作失败')
  } finally {
    saving.value = false
  }
}

async function handleDelete(cat) {
  if (!confirm(`确定删除分类「${cat.name}」？该分类下的文章将变为无分类。`)) return
  try {
    await deleteCategory(cat.id)
    fetchCategories()
  } catch (e) {
    alert(e.message || '删除失败')
  }
}

onMounted(fetchCategories)
</script>

<style scoped>
.page-title {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 16px;
}

.add-form {
  margin-bottom: 20px;
}

.add-form h3 {
  font-size: 16px;
  margin-bottom: 12px;
}

.form-row {
  display: flex;
  gap: 12px;
}

.form-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.category-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.category-name {
  font-weight: 500;
}

.category-slug {
  color: var(--color-text-lighter);
  font-size: 13px;
  margin-left: 8px;
}

.category-count {
  color: var(--color-text-lighter);
  font-size: 13px;
  margin-left: 12px;
}

.category-actions {
  display: flex;
  gap: 8px;
}

@media (max-width: 600px) {
  .form-row {
    flex-direction: column;
    gap: 0;
  }
}
</style>
