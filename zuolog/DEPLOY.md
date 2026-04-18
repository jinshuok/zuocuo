# Cloudflare Pages + GitHub 自动部署指南

## ✅ 部署状态

| 配置项 | 状态 | 备注 |
|--------|------|------|
| GitHub 仓库连接 | ✅ 已配置 | `jinshuok/zuo` |
| Build command | ✅ 已配置 | `echo "done"` (无实际构建) |
| D1 数据库绑定 | ✅ 已配置 | Variable name: `DB` → `zuo-db` |
| JWT_SECRET 环境变量 | ✅ 已配置 | 已在 Dashboard 设置 |
| 自动重新部署 | 🔄 待触发 | 推送代码到 GitHub 即可 |

> **下一步**：推送代码到 GitHub 触发自动重新部署，使 D1 绑定和 JWT_SECRET 生效。

---

## 📁 项目结构（Pages Functions 规范）

```
zuo1/
├── index.html              # 前端主页面（静态文件）
├── functions/              # Cloudflare Pages Functions（后端 API）
│   ├── _middleware.js      # JWT 认证 + CORS 中间件（应用到 /api/* 路由）
│   └── api/
│       ├── auth/
│       │   ├── login.js    # POST /api/auth/login - 用户登录
│       │   ├── register.js # POST /api/auth/register - 用户注册
│       │   └── me.js       # GET /api/auth/me - 获取当前用户信息
│       └── tasks/
│           ├── list.js     # GET /api/tasks/list - 获取任务列表
│           ├── create.js   # POST /api/tasks/create - 创建任务
│           ├── update.js   # PUT /api/tasks/update - 更新任务
│           ├── delete.js   # DELETE /api/tasks/delete - 删除任务
│           └── [id].js     # PUT/DELETE /api/tasks/:id - 单任务操作
├── _headers                # HTTP Headers 配置（CORS 等）
├── _routes.json            # 路由配置
└── DEPLOY.md               # 本文件
```

### 目录规范说明

- **根目录/index.html**: 前端静态页面，Pages 会自动部署为静态资源
- **functions/**: 后端 API 目录，每个文件对应一个路由
  - `_middleware.js`: 以下划线开头的文件会自动应用到同目录下所有路由
  - `api/auth/login.js`: 对应 `/api/auth/login` 路径
  - `api/tasks/[id].js`: 方括号表示动态路由，对应 `/api/tasks/123` 等

---

## 🚀 快速部署步骤

### 第一步：推送代码到 GitHub

```bash
# 添加所有文件
git add -A

# 提交
git commit -m "Initial commit: Todo app with Cloudflare Pages Functions"

# 推送到 main 分支
git push origin main
```

---

### 第二步：创建 D1 数据库

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 **Workers & Pages** → **D1**
3. 点击 **Create Database**
4. 数据库名称填写：`zuo-db`
5. 点击 **Create**

#### 初始化数据库表

在 D1 控制台中，点击 **Console** 标签，执行以下 SQL：

```sql
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
```

---

### 第三步：创建 Cloudflare Pages 项目

1. 进入 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 点击 **Workers & Pages** → **Create application**
3. 选择 **Pages** 标签 → **Connect to Git**
4. 授权并选择你的 GitHub 仓库

#### 构建设置

| 配置项 | 值 |
|--------|-----|
| Project name | `zuo`（或自定义） |
| Production branch | `main` |
| Framework preset | `None` |
| Build command | *(留空)* |
| Build output directory | *(留空)* |

点击 **Save and Deploy**

---

### 第四步：绑定 D1 数据库（关键步骤）

⚠️ **必须在部署完成后立即绑定数据库，否则 API 会报错**

1. 进入项目的 **Settings** → **Bindings**
2. 点击 **Add** → **D1 Database**
3. 配置绑定：
   - Variable name: `DB`（⚠️ **必须大写，与代码中的 env.DB 对应**）
   - D1 database: 选择 `zuo-db`
4. 点击 **Save**

#### 设置环境变量（JWT_SECRET）

1. 在 **Settings** → **Environment variables** 中
2. 点击 **Add variable**:
   - Name: `JWT_SECRET`
   - Value: `Me5NxJXWjLAmSpdRTquiEv#Kz8nD9H!0`（或你自己生成的随机字符串）
3. 点击 **Save**

---

### 第五步：重新部署（使配置生效）

⚠️ **绑定 D1 和设置环境变量后，必须重新部署才能生效！**

由于 Cloudflare 新版界面可能没有"Retry deployment"按钮，**推荐通过 GitHub 推送触发**：

```bash
# 修改任意文件（比如在 DEPLOY.md 末尾加一个空行）
echo "" >> DEPLOY.md

# 提交并推送
git add -A
git commit -m "chore: trigger redeploy after D1 binding"
git push origin main
```

推送后，Cloudflare 会自动检测并开始新的部署（约 1-2 分钟）。

---

## ✅ 验证部署

访问你的 Pages 域名（如 `https://zuo.pages.dev`）：

1. **注册账号**：点击注册标签，创建新用户
2. **登录**：使用注册的用户名密码登录
3. **添加任务**：点击右上角 `+` 按钮添加任务
4. **数据持久化**：刷新页面，数据仍然存在

---

## 🔧 API 路由列表

| 接口 | 方法 | 描述 | 认证 |
|------|------|------|------|
| `/api/auth/register` | POST | 用户注册 | 公开 |
| `/api/auth/login` | POST | 用户登录 | 公开 |
| `/api/auth/me` | GET | 获取当前用户信息 | 需要 Token |
| `/api/tasks/list?space=do` | GET | 获取任务列表 | 需要 Token |
| `/api/tasks/create` | POST | 创建任务 | 需要 Token |
| `/api/tasks/update` | PUT | 更新任务 | 需要 Token |
| `/api/tasks/delete` | DELETE | 删除任务 | 需要 Token |
| `/api/tasks/:id` | PUT/DELETE | 单任务操作 | 需要 Token |

---

## 🔄 自动同步工作流程

```
本地修改代码
     ↓
git add -A
git commit -m "描述"
git push origin main
     ↓
GitHub 收到推送
     ↓
Cloudflare Pages 自动触发构建部署
     ↓
约 1-2 分钟后，网站自动更新
```

---

## 🏗️ Functions 工作原理

### 中间件 (_middleware.js)

```javascript
// functions/_middleware.js
export async function onRequest(context) {
    // 1. 处理 CORS 预检
    if (request.method === 'OPTIONS') { ... }
    
    // 2. 验证 JWT Token（公开路由除外）
    const token = request.headers.get('Authorization')...
    
    // 3. 继续执行后续路由
    return context.next();
}
```

- 文件名下划线开头：`_middleware.js`
- 作用于**同目录及子目录**下的所有路由
- 在此项目中处理所有 `/api/*` 请求的认证和 CORS

### API 路由

```javascript
// functions/api/auth/login.js
export async function onRequestPost(context) {
    const { request, env } = context;
    // 使用 env.DB 访问 D1 数据库
    const user = await env.DB.prepare('...').bind(...).first();
    return Response.json({ token });
}
```

- 导出函数名决定 HTTP 方法：
  - `onRequestGet` → GET
  - `onRequestPost` → POST
  - `onRequestPut` → PUT
  - `onRequestDelete` → DELETE
  - `onRequest` → 所有方法
- 文件路径 = URL 路径
- 通过 `context.env.DB` 访问 D1 数据库

---

## 🔒 安全说明

### JWT_SECRET 环境变量

- 用于签发和验证登录 Token
- **不是用户的登录密码**
- 在 Cloudflare Dashboard → Pages → 你的项目 → Settings → Environment variables 中设置
- 建议生产环境使用随机生成的强密码（32位以上）

### 认证流程

1. 用户注册/登录成功 → 服务器返回 JWT Token
2. 前端将 Token 存储在 localStorage
3. 后续 API 请求在 Header 中携带：`Authorization: Bearer <token>`
4. `_middleware.js` 验证 Token 有效性
5. 验证通过后将用户信息附加到 `context.data`，供后续路由使用

---

## 🛠️ 故障排查

### 问题 1：API 返回 404 Not Found

**原因**：Pages Functions 未正确识别路由

**解决**：
- 检查文件是否在 `functions/` 目录下
- 检查文件名和导出函数名是否正确
- 查看 Pages 部署日志：Deployments → 具体部署 → Functions

### 问题 2：API 返回 500 / "DB is not defined"

**原因**：D1 数据库未绑定或变量名错误

**解决**：
- 检查 Settings → Bindings 中是否绑定了 D1
- 检查 Variable name 是否为大写的 `DB`
- 绑定后需要重新部署

### 问题 3：CORS 错误 / 跨域问题

**原因**：浏览器阻止跨域请求

**解决**：
- `_middleware.js` 已处理 CORS，检查是否生效
- 查看浏览器控制台确认错误信息

### 问题 4：自动部署未触发

**原因**：GitHub 连接问题或分支不匹配

**解决**：
- 检查 Cloudflare Dashboard → Pages → 项目 → Settings → Git
- 确认 Production branch 设置正确（通常是 `main`）
- 检查 GitHub 授权：GitHub → Settings → Applications → Cloudflare Pages

---

## 📝 提交规范（建议）

```bash
# 功能更新
git commit -m "feat: add task reminder feature"

# Bug 修复
git commit -m "fix: fix login error on mobile"

# 文档更新
git commit -m "docs: update README"

# 样式调整
git commit -m "style: improve button design"
```

---

## 📚 参考文档

- [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/functions/)
- [D1 Database](https://developers.cloudflare.com/d1/)
- [Pages Functions Routing](https://developers.cloudflare.com/pages/functions/routing/)
