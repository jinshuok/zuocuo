-- D1 数据库表结构

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 任务表
CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    time TEXT,
    space_type TEXT NOT NULL CHECK(space_type IN ('do', 'not-do')),
    task_type TEXT NOT NULL CHECK(task_type IN ('self', 'invite', 'abstinence', 'folded')),
    source TEXT,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'completed', 'ignored', 'expired')),
    repeat BOOLEAN DEFAULT 0,
    days INTEGER,
    permanent BOOLEAN DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_space_type ON tasks(space_type);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
