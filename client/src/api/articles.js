import request from './request'

export function getArticles(params) {
  return request.get('/articles', { params })
}

export function getArticleBySlug(slug) {
  return request.get(`/articles/${slug}`)
}

export function getAdminArticles(params) {
  return request.get('/articles/admin/all', { params })
}

export function getAdminArticle(id) {
  return request.get(`/articles/admin/${id}`)
}

export function createArticle(data) {
  return request.post('/articles', data)
}

export function updateArticle(id, data) {
  return request.put(`/articles/${id}`, data)
}

export function deleteArticle(id) {
  return request.delete(`/articles/${id}`)
}
