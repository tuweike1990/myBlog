import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue'),
  },
  {
    path: '/article/:slug',
    name: 'ArticleDetail',
    component: () => import('../views/ArticleDetail.vue'),
  },
  {
    path: '/category/:slug',
    name: 'CategoryList',
    component: () => import('../views/CategoryList.vue'),
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
  },
  {
    path: '/admin',
    name: 'Dashboard',
    component: () => import('../views/admin/Dashboard.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/admin/articles',
    name: 'ArticleList',
    component: () => import('../views/admin/ArticleList.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/admin/articles/new',
    name: 'ArticleNew',
    component: () => import('../views/admin/ArticleEdit.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/admin/articles/:id',
    name: 'ArticleEdit',
    component: () => import('../views/admin/ArticleEdit.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/admin/categories',
    name: 'CategoryManage',
    component: () => import('../views/admin/CategoryManage.vue'),
    meta: { requiresAuth: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth) {
    const authStore = useAuthStore()
    if (!authStore.isLoggedIn) {
      next({ name: 'Login', query: { redirect: to.fullPath } })
    } else {
      next()
    }
  } else if (to.name === 'Login') {
    const authStore = useAuthStore()
    if (authStore.isLoggedIn) {
      next({ name: 'Dashboard' })
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router
