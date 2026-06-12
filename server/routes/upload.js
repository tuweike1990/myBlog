const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const config = require('../config');

const router = express.Router();

// 确保 uploads 目录存在
const uploadsDir = config.uploadsDir;
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
const imagesDir = path.join(uploadsDir, 'images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, imagesDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9一-龥]/g, '_');
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    cb(null, `${date}-${name}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('只支持 jpg/png/gif/webp 格式图片'));
    }
  },
});

router.post('/', auth, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.json({ code: 400, message: '请选择图片', data: null });
  }
  const url = `/uploads/images/${req.file.filename}`;
  res.json({ code: 0, message: '上传成功', data: { url } });
});

module.exports = router;
