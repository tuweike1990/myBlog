import request from './request'

export function login(username, password) {
  return request.post('/auth/login', { username, password })
}

export function getMe() {
  return request.get('/auth/me')
}

export function changePassword(oldPassword, newPassword) {
  return request.post('/auth/change-password', { oldPassword, newPassword })
}
