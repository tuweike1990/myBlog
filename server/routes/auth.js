const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth');
const { queryOne, run } = require('../database/init');
const config = require('../config');

const router = express.Router();

// 登录
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.json({ code: 400, message: '用户名和密码不能为空', data: null });
  }

  const user = queryOne('SELECT * FROM users WHERE username = ?', [username]);
  if (!user) {
    return res.json({ code: 400, message: '用户名或密码错误', data: null });
  }

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) {
    return res.json({ code: 400, message: '用户名或密码错误', data: null });
  }

  const token = jwt.sign(
    { userId: user.id, username: user.username },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );

  res.json({
    code: 0,
    message: '登录成功',
    data: {
      token,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
      },
    },
  });
});

// 获取当前用户信息
router.get('/me', auth, (req, res) => {
  const user = queryOne('SELECT id, username, display_name, created_at FROM users WHERE id = ?', [req.user.userId]);
  if (!user) {
    return res.json({ code: 404, message: '用户不存在', data: null });
  }
  res.json({
    code: 0,
    message: '操作成功',
    data: {
      id: user.id,
      username: user.username,
      displayName: user.display_name,
      createdAt: user.created_at,
    },
  });
});

// 修改密码
router.post('/change-password', auth, (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return res.json({ code: 400, message: '旧密码和新密码不能为空', data: null });
  }

  const user = queryOne('SELECT * FROM users WHERE id = ?', [req.user.userId]);
  if (!user) {
    return res.json({ code: 404, message: '用户不存在', data: null });
  }

  const valid = bcrypt.compareSync(oldPassword, user.password_hash);
  if (!valid) {
    return res.json({ code: 400, message: '旧密码错误', data: null });
  }

  const hash = bcrypt.hashSync(newPassword, 10);
  run('UPDATE users SET password_hash = ?, updated_at = datetime("now", "localtime") WHERE id = ?', [hash, req.user.userId]);

  res.json({ code: 0, message: '密码修改成功', data: null });
});

module.exports = router;
