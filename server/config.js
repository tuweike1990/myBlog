const path = require('path');

module.exports = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || 'blog-secret-key-change-in-production',
  jwtExpiresIn: '7d',
  dbPath: path.join(__dirname, 'database', 'blog.db'),
  uploadsDir: path.join(__dirname, '..', 'uploads'),
};
