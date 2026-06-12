const express = require('express');
const auth = require('../middleware/auth');
const { query, queryOne, run } = require('../database/init');

const router = express.Router();

// 公开：获取所有分类
router.get('/', (req, res) => {
  const categories = query(
    `SELECT c.*, (SELECT COUNT(*) FROM articles WHERE category_id = c.id AND status = 'published') as article_count
     FROM categories c
     ORDER BY c.sort_order ASC`
  );

  const list = categories.map(c => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    sortOrder: c.sort_order,
    articleCount: c.article_count,
  }));

  res.json({ code: 0, message: '操作成功', data: list });
});

// 公开：获取分类下的文章
router.get('/:slug/articles', (req, res) => {
  const { slug } = req.params;
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const offset = (page - 1) * pageSize;

  const category = queryOne('SELECT * FROM categories WHERE slug = ?', [slug]);
  if (!category) {
    return res.json({ code: 404, message: '分类不存在', data: null });
  }

  const totalResult = queryOne(
    `SELECT COUNT(*) as count FROM articles WHERE category_id = ? AND status = 'published'`,
    [category.id]
  );
  const total = totalResult ? totalResult.count : 0;

  const articles = query(
    `SELECT * FROM articles WHERE category_id = ? AND status = 'published'
     ORDER BY published_at DESC, created_at DESC
     LIMIT ? OFFSET ?`,
    [category.id, pageSize, offset]
  );

  const list = articles.map(a => ({
    id: a.id,
    title: a.title,
    slug: a.slug,
    excerpt: a.excerpt,
    coverImage: a.cover_image,
    viewCount: a.view_count,
    publishedAt: a.published_at,
    createdAt: a.created_at,
  }));

  res.json({
    code: 0,
    message: '操作成功',
    data: {
      category: { id: category.id, name: category.name, slug: category.slug },
      list,
      total,
      page,
      pageSize,
    },
  });
});

// 管理员：创建分类
router.post('/', auth, (req, res) => {
  const { name, slug, sortOrder } = req.body;
  if (!name || !slug) {
    return res.json({ code: 400, message: '分类名称和slug不能为空', data: null });
  }

  const existing = queryOne('SELECT id FROM categories WHERE slug = ?', [slug]);
  if (existing) {
    return res.json({ code: 400, message: 'slug已存在', data: null });
  }

  const result = run(
    'INSERT INTO categories (name, slug, sort_order) VALUES (?, ?, ?)',
    [name, slug, sortOrder || 0]
  );

  res.json({ code: 0, message: '分类创建成功', data: { id: result.lastInsertRowid } });
});

// 管理员：更新分类
router.put('/:id', auth, (req, res) => {
  const { id } = req.params;
  const { name, slug, sortOrder } = req.body;

  const category = queryOne('SELECT * FROM categories WHERE id = ?', [id]);
  if (!category) {
    return res.json({ code: 404, message: '分类不存在', data: null });
  }

  run(
    'UPDATE categories SET name = ?, slug = ?, sort_order = ? WHERE id = ?',
    [name || category.name, slug || category.slug, sortOrder !== undefined ? sortOrder : category.sort_order, id]
  );

  res.json({ code: 0, message: '分类更新成功', data: null });
});

// 管理员：删除分类
router.delete('/:id', auth, (req, res) => {
  const { id } = req.params;
  const category = queryOne('SELECT * FROM categories WHERE id = ?', [id]);
  if (!category) {
    return res.json({ code: 404, message: '分类不存在', data: null });
  }

  run('DELETE FROM categories WHERE id = ?', [id]);
  res.json({ code: 0, message: '分类删除成功', data: null });
});

module.exports = router;
