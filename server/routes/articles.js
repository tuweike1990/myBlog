const express = require('express');
const auth = require('../middleware/auth');
const { query, queryOne, run } = require('../database/init');
const { generateSlug } = require('../utils/slug');

const router = express.Router();

// 公开：获取已发布文章列表（分页）
router.get('/', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const categoryId = req.query.category;
  const keyword = req.query.keyword;
  const offset = (page - 1) * pageSize;

  let where = "WHERE a.status = 'published'";
  const params = [];

  if (categoryId) {
    where += ' AND a.category_id = ?';
    params.push(categoryId);
  }
  if (keyword) {
    where += ' AND (a.title LIKE ? OR a.excerpt LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  const totalResult = queryOne(`SELECT COUNT(*) as count FROM articles a ${where}`, params);
  const total = totalResult ? totalResult.count : 0;

  const articles = query(
    `SELECT a.*, c.name as category_name, c.slug as category_slug
     FROM articles a
     LEFT JOIN categories c ON a.category_id = c.id
     ${where}
     ORDER BY a.published_at DESC, a.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );

  const list = articles.map(a => {
    const tags = query(
      `SELECT t.id, t.name FROM tags t
       INNER JOIN article_tags at2 ON t.id = at2.tag_id
       WHERE at2.article_id = ?`,
      [a.id]
    );
    return {
      id: a.id,
      title: a.title,
      slug: a.slug,
      excerpt: a.excerpt,
      coverImage: a.cover_image,
      status: a.status,
      viewCount: a.view_count,
      publishedAt: a.published_at,
      createdAt: a.created_at,
      categoryId: a.category_id,
      categoryName: a.category_name,
      categorySlug: a.category_slug,
      tags,
    };
  });

  res.json({
    code: 0,
    message: '操作成功',
    data: { list, total, page, pageSize },
  });
});

// 管理员：获取所有文章（含草稿）—— 必须在 /:slug 之前
router.get('/admin/all', auth, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 20;
  const status = req.query.status;
  const offset = (page - 1) * pageSize;

  let where = '';
  const params = [];

  if (status) {
    where = 'WHERE a.status = ?';
    params.push(status);
  }

  const totalResult = queryOne(`SELECT COUNT(*) as count FROM articles a ${where}`, params);
  const total = totalResult ? totalResult.count : 0;

  const articles = query(
    `SELECT a.*, c.name as category_name
     FROM articles a
     LEFT JOIN categories c ON a.category_id = c.id
     ${where}
     ORDER BY a.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );

  const list = articles.map(a => ({
    id: a.id,
    title: a.title,
    slug: a.slug,
    excerpt: a.excerpt,
    status: a.status,
    viewCount: a.view_count,
    publishedAt: a.published_at,
    createdAt: a.created_at,
    categoryName: a.category_name,
  }));

  res.json({
    code: 0,
    message: '操作成功',
    data: { list, total, page, pageSize },
  });
});

// 管理员：按 ID 获取文章（含草稿）—— 必须在 /:slug 之前
router.get('/admin/:id', auth, (req, res) => {
  const { id } = req.params;

  const article = queryOne(
    `SELECT a.*, c.name as category_name, c.slug as category_slug
     FROM articles a
     LEFT JOIN categories c ON a.category_id = c.id
     WHERE a.id = ?`,
    [id]
  );

  if (!article) {
    return res.json({ code: 404, message: '文章不存在', data: null });
  }

  const tags = query(
    `SELECT t.id, t.name FROM tags t
     INNER JOIN article_tags at2 ON t.id = at2.tag_id
     WHERE at2.article_id = ?`,
    [article.id]
  );

  res.json({
    code: 0,
    message: '操作成功',
    data: {
      id: article.id,
      title: article.title,
      slug: article.slug,
      content: article.content,
      excerpt: article.excerpt,
      coverImage: article.cover_image,
      status: article.status,
      viewCount: article.view_count,
      publishedAt: article.published_at,
      createdAt: article.created_at,
      updatedAt: article.updated_at,
      categoryId: article.category_id,
      categoryName: article.category_name,
      categorySlug: article.category_slug,
      tags,
    },
  });
});

// 公开：获取单篇已发布文章
router.get('/:slug', (req, res) => {
  const { slug } = req.params;

  const article = queryOne(
    `SELECT a.*, c.name as category_name, c.slug as category_slug
     FROM articles a
     LEFT JOIN categories c ON a.category_id = c.id
     WHERE a.slug = ? AND a.status = 'published'`,
    [slug]
  );

  if (!article) {
    return res.json({ code: 404, message: '文章不存在', data: null });
  }

  // 增加浏览量
  run('UPDATE articles SET view_count = view_count + 1 WHERE id = ?', [article.id]);

  const tags = query(
    `SELECT t.id, t.name FROM tags t
     INNER JOIN article_tags at2 ON t.id = at2.tag_id
     WHERE at2.article_id = ?`,
    [article.id]
  );

  res.json({
    code: 0,
    message: '操作成功',
    data: {
      id: article.id,
      title: article.title,
      slug: article.slug,
      content: article.content,
      excerpt: article.excerpt,
      coverImage: article.cover_image,
      status: article.status,
      viewCount: article.view_count + 1,
      publishedAt: article.published_at,
      createdAt: article.created_at,
      updatedAt: article.updated_at,
      categoryId: article.category_id,
      categoryName: article.category_name,
      categorySlug: article.category_slug,
      tags,
    },
  });
});

// 管理员：创建文章
router.post('/', auth, (req, res) => {
  const { title, content, excerpt, categoryId, status, tagNames } = req.body;

  if (!title) {
    return res.json({ code: 400, message: '文章标题不能为空', data: null });
  }

  const slug = generateSlug(title);
  const nowStatus = status || 'draft';
  const nowExcerpt = excerpt || '';
  const publishedAt = nowStatus === 'published' ? new Date().toISOString() : null;

  const result = run(
    `INSERT INTO articles (user_id, category_id, title, slug, content, excerpt, status, published_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [req.user.userId, categoryId || null, title, slug, content || '', nowExcerpt, nowStatus, publishedAt]
  );

  // 处理标签
  if (tagNames && Array.isArray(tagNames)) {
    tagNames.forEach(name => {
      let tag = queryOne('SELECT id FROM tags WHERE name = ?', [name]);
      if (!tag) {
        const tagResult = run('INSERT INTO tags (name) VALUES (?)', [name]);
        tag = { id: tagResult.lastInsertRowid };
      }
      run('INSERT OR IGNORE INTO article_tags (article_id, tag_id) VALUES (?, ?)', [result.lastInsertRowid, tag.id]);
    });
  }

  res.json({
    code: 0,
    message: '文章创建成功',
    data: { id: result.lastInsertRowid, slug },
  });
});

// 管理员：更新文章
router.put('/:id', auth, (req, res) => {
  const { id } = req.params;
  const { title, content, excerpt, categoryId, status, tagNames, coverImage } = req.body;

  const article = queryOne('SELECT * FROM articles WHERE id = ?', [id]);
  if (!article) {
    return res.json({ code: 404, message: '文章不存在', data: null });
  }

  const nowStatus = status || article.status;
  const publishedAt = nowStatus === 'published' && !article.published_at
    ? new Date().toISOString()
    : article.published_at;

  run(
    `UPDATE articles SET title = ?, content = ?, excerpt = ?, category_id = ?, status = ?, cover_image = ?, published_at = ?, updated_at = datetime('now', 'localtime') WHERE id = ?`,
    [
      title || article.title,
      content !== undefined ? content : article.content,
      excerpt !== undefined ? excerpt : article.excerpt,
      categoryId !== undefined ? categoryId : article.category_id,
      nowStatus,
      coverImage !== undefined ? coverImage : article.cover_image,
      publishedAt,
      id,
    ]
  );

  // 更新标签
  if (tagNames && Array.isArray(tagNames)) {
    run('DELETE FROM article_tags WHERE article_id = ?', [id]);
    tagNames.forEach(name => {
      let tag = queryOne('SELECT id FROM tags WHERE name = ?', [name]);
      if (!tag) {
        const tagResult = run('INSERT INTO tags (name) VALUES (?)', [name]);
        tag = { id: tagResult.lastInsertRowid };
      }
      run('INSERT OR IGNORE INTO article_tags (article_id, tag_id) VALUES (?, ?)', [id, tag.id]);
    });
  }

  res.json({ code: 0, message: '文章更新成功', data: null });
});

// 管理员：删除文章
router.delete('/:id', auth, (req, res) => {
  const { id } = req.params;
  const article = queryOne('SELECT * FROM articles WHERE id = ?', [id]);
  if (!article) {
    return res.json({ code: 404, message: '文章不存在', data: null });
  }

  run('DELETE FROM article_tags WHERE article_id = ?', [id]);
  run('DELETE FROM articles WHERE id = ?', [id]);

  res.json({ code: 0, message: '文章删除成功', data: null });
});

module.exports = router;
