const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const config = require('../config');

let db = null;

async function initDatabase() {
  const dbDir = path.dirname(config.dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const SQL = await initSqlJs();

  // 如果数据库文件已存在，加载它
  if (fs.existsSync(config.dbPath)) {
    const buffer = fs.readFileSync(config.dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // 启用外键
  db.run('PRAGMA foreign_keys = ON;');

  // 建表
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      category_id INTEGER,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      content TEXT NOT NULL DEFAULT '',
      excerpt TEXT NOT NULL DEFAULT '',
      cover_image TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'published')),
      view_count INTEGER NOT NULL DEFAULT 0,
      published_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS article_tags (
      article_id INTEGER NOT NULL,
      tag_id INTEGER NOT NULL,
      PRIMARY KEY (article_id, tag_id),
      FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    );
  `);

  // 索引
  db.run('CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);');
  db.run('CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);');
  db.run('CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at);');
  db.run('CREATE INDEX IF NOT EXISTS idx_articles_category_id ON articles(category_id);');
  db.run('CREATE INDEX IF NOT EXISTS idx_article_tags_article ON article_tags(article_id);');
  db.run('CREATE INDEX IF NOT EXISTS idx_article_tags_tag ON article_tags(tag_id);');

  // 种子数据：默认管理员
  const users = query('SELECT COUNT(*) as count FROM users');
  if (users[0].count === 0) {
    const hash = bcrypt.hashSync('admin123', 10);
    db.run(
      `INSERT INTO users (username, password_hash, display_name) VALUES ('admin', ?, '管理员');`,
      [hash]
    );
    console.log('已创建默认管理员账号: admin / admin123');
  }

  // 种子数据：默认分类
  const cats = query('SELECT COUNT(*) as count FROM categories');
  if (cats[0].count === 0) {
    db.run(`INSERT INTO categories (name, slug, sort_order) VALUES ('前端开发', 'frontend', 1);`);
    db.run(`INSERT INTO categories (name, slug, sort_order) VALUES ('后端技术', 'backend', 2);`);
    db.run(`INSERT INTO categories (name, slug, sort_order) VALUES ('生活随笔', 'life', 3);`);
    console.log('已创建默认分类');
  }

  save();
  console.log('数据库初始化完成');
  return db;
}

function getDb() {
  return db;
}

// 保存数据库到文件
function save() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(config.dbPath, buffer);
}

// 执行查询（返回结果数组）
function query(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

// 执行单条查询
function queryOne(sql, params = []) {
  const results = query(sql, params);
  return results.length > 0 ? results[0] : null;
}

// 执行写操作并保存
function run(sql, params = []) {
  db.run(sql, params);
  // 必须在 save()(export) 之前读取，否则 last_insert_rowid/changes 会被重置
  const lastInsertRowid = getLastInsertId();
  const changes = getChanges();
  save();
  return { lastInsertRowid, changes };
}

function getLastInsertId() {
  const result = queryOne('SELECT last_insert_rowid() as id');
  return result ? result.id : 0;
}

function getChanges() {
  const result = queryOne('SELECT changes() as count');
  return result ? result.count : 0;
}

module.exports = {
  initDatabase,
  getDb,
  query,
  queryOne,
  run,
  save,
};
