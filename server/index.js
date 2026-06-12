const express = require('express');
const path = require('path');
const cors = require('cors');
const config = require('./config');
const { initDatabase } = require('./database/init');
const authRoutes = require('./routes/auth');
const articleRoutes = require('./routes/articles');
const categoryRoutes = require('./routes/categories');
const uploadRoutes = require('./routes/upload');
const errorHandler = require('./middleware/error');

async function start() {
  // 初始化数据库
  await initDatabase();

  const app = express();

  // 中间件
  app.use(cors());
  app.use(express.json());

  // 静态文件：上传的图片
  app.use('/uploads', express.static(config.uploadsDir));

  // API 路由
  app.use('/api/auth', authRoutes);
  app.use('/api/articles', articleRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/upload', uploadRoutes);

  // 生产环境：serve Vue 构建产物
  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientDist));

  // SPA fallback：非 API 请求返回 index.html
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ code: 404, message: '接口不存在', data: null });
    }
    res.sendFile(path.join(clientDist, 'index.html'));
  });

  // 错误处理
  app.use(errorHandler);

  app.listen(config.port, () => {
    console.log(`服务器运行在 http://localhost:${config.port}`);
  });
}

start().catch(err => {
  console.error('启动失败:', err);
  process.exit(1);
});
