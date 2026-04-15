-- Drop mongo_id columns/indexes and unused users.updated_at
-- SQLite can't drop UNIQUE columns, so we recreate the tables
-- CRITICAL: disable foreign keys to prevent cascade deletes on DROP TABLE

PRAGMA foreign_keys=OFF;

DROP INDEX IF EXISTS idx_users_mongo_id;
DROP INDEX IF EXISTS idx_recipes_mongo_id;
DROP INDEX IF EXISTS idx_recipe_lists_mongo_id;

-- Step 1: Create all new tables and copy data BEFORE dropping anything

CREATE TABLE users_new (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
INSERT INTO users_new SELECT id, username, name, email, password_hash, created_at FROM users;

CREATE TABLE recipes_new (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  author TEXT NOT NULL DEFAULT '',
  link TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  prep_time INTEGER NOT NULL DEFAULT 0,
  cook_time INTEGER NOT NULL DEFAULT 0,
  total_time INTEGER NOT NULL DEFAULT 0,
  ingredients TEXT NOT NULL DEFAULT '[]',
  directions TEXT NOT NULL DEFAULT '[]',
  tags TEXT NOT NULL DEFAULT '[]',
  notes TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
INSERT INTO recipes_new SELECT id, user_id, title, description, author, link, image_url, prep_time, cook_time, total_time, ingredients, directions, tags, notes, created_at, updated_at FROM recipes;

CREATE TABLE recipe_lists_new (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  recipes TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
INSERT INTO recipe_lists_new SELECT id, user_id, title, recipes, created_at, updated_at FROM recipe_lists;

-- Step 2: Drop old tables (foreign keys OFF, so no cascade)

DROP TABLE recipe_lists;
DROP TABLE recipes;
DROP TABLE users;

-- Step 3: Rename new tables

ALTER TABLE users_new RENAME TO users;
ALTER TABLE recipes_new RENAME TO recipes;
ALTER TABLE recipe_lists_new RENAME TO recipe_lists;

-- Step 4: Re-add foreign key indexes

CREATE INDEX idx_recipes_user_id ON recipes(user_id);
CREATE INDEX idx_recipe_lists_user_id ON recipe_lists(user_id);

PRAGMA foreign_keys=ON;
