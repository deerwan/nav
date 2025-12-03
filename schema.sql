-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  parent_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  depth INTEGER NOT NULL DEFAULT 0,
  is_private INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(name, parent_id)
);

-- Bookmarks table
CREATE TABLE IF NOT EXISTS bookmarks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  category_id INTEGER NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  is_private INTEGER DEFAULT 0,
  tags TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);


-- 添加索引以提升查询性能
CREATE INDEX IF NOT EXISTS idx_bookmarks_category_position 
ON bookmarks(category_id, position);

CREATE INDEX IF NOT EXISTS idx_bookmarks_private 
ON bookmarks(is_private);

CREATE INDEX IF NOT EXISTS idx_bookmarks_url 
ON bookmarks(url);

CREATE INDEX IF NOT EXISTS idx_bookmarks_tags 
ON bookmarks(tags);

CREATE INDEX IF NOT EXISTS idx_categories_position 
ON categories(position);

CREATE INDEX IF NOT EXISTS idx_categories_parent_id 
ON categories(parent_id);

CREATE INDEX IF NOT EXISTS idx_categories_parent_position 
ON categories(parent_id, position);

CREATE INDEX IF NOT EXISTS idx_categories_private 
ON categories(is_private);

CREATE INDEX IF NOT EXISTS idx_settings_key 
ON settings(key);

