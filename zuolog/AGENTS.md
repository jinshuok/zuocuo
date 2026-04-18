# AGENTS.md - 双态空间 (Dual-State Focus)

> 本项目文档供 AI Agent 参考使用。包含架构说明、开发规范和重要实现细节。

---

## 📋 项目概述

**双态空间** 是一个带有用户系统和数据库的「不做」清单应用，部署在 Cloudflare Pages。

### 核心概念

- **Doing 空间**: 用户当前正在做的事情（黑色主题）
- **Not-Doing 空间**: 用户不应该做的事情（白色主题）
  - `pending`: 待处理（邀请类任务）
  - `abstinence`: 戒断项（永久不做）
  - `folded`: 折叠项（历史归档）

---

## 🏗️ 架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                     Cloudflare Pages                         │
│  ┌──────────────┐  ┌──────────────────────────────────────┐ │
│  │ Static Files │  │      Pages Functions (API)           │ │
│  │              │  │  ┌──────────┐  ┌──────────────────┐  │ │
│  │ index.html   │  │  │ _middleware │  │   API Routes    │  │ │
│  │ (前端)       │  │  │    .js   │  │  ├─ auth/        │  │ │
│  │              │  │  │ JWT +    │  │  │   ├─ login     │  │ │
│  │              │  │  │ CORS     │  │  │   ├─ register  │  │ │
│  │              │  │  └──────────┘  │  │   └─ me        │  │ │
│  │              │  │                │  │  └─ tasks/      │  │ │
│  │              │  │                │  │     ├─ list     │  │ │
│  │              │  │                │  │     ├─ create   │  │ │
│  │              │  │                │  │     ├─ update   │  │ │
│  │              │  │                │  │     ├─ delete   │  │ │
│  │              │  │                │  │     └─ [id]     │  │ │
│  │              │  │                │  └──────────────────┘  │ │
│  └──────────────┘  └──────────────────────────────────────┘ │
│                              │                               │
│                              ▼                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              D1 Database (SQLite)                      │  │
│  │  ┌─────────────┐      ┌──────────────────────────┐    │  │
│  │  │ users 表    │      │ tasks 表                 │    │  │
│  │  ├─ id        │      ├─ id                      │    │  │
│  │  ├─ username  │      ├─ user_id (FK)           │    │  │
│  │  ├─ password_hash   ├─ title                   │    │  │
│  │  └─ created_at     ├─ time                     │    │  │
│  │                    ├─ space_type (do/not-do)   │    │  │
│  │                    ├─ task_type                │    │  │
│  │                    ├─ source                   │    │  │
│  │                    ├─ status                   │    │  │
│  │                    ├─ repeat, days, permanent  │    │  │
│  │                    └─ created_at               │    │  │
│  │                                                   │    │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 文件结构

```
zuo1/
├── index.html              # 前端主页面（纯 HTML+CSS+JS）
├── schema.sql              # D1 数据库表结构定义
├── _headers                # HTTP Headers 配置（CORS）
├── README.md               # 项目 README
├── DEPLOY.md               # 部署指南（详细）
├── AGENTS.md               # 本文件
├── functions/              # Pages Functions 目录
│   ├── _middleware.js      # JWT 认证 + CORS 中间件（应用到 /api/*）
│   └── api/                # API 路由
│       ├── auth/
│       │   ├── login.js    # POST /api/auth/login
│       │   ├── register.js # POST /api/auth/register
│       │   └── me.js       # GET /api/auth/me
│       └── tasks/
│           ├── list.js     # GET /api/tasks/list
│           ├── create.js   # POST /api/tasks/create
│           ├── update.js   # PUT /api/tasks/update
│           ├── delete.js   # DELETE /api/tasks/delete
│           └── [id].js     # PUT/DELETE /api/tasks/:id
└── .wrangler/              # Wrangler 配置（本地开发）
```

---

## 🔧 技术规范

### 1. Pages Functions 路由约定

| 导出函数名 | HTTP 方法 |
|-----------|----------|
| `onRequest` | ALL |
| `onRequestGet` | GET |
| `onRequestPost` | POST |
| `onRequestPut` | PUT |
| `onRequestDelete` | DELETE |

**动态路由**: `[id].js` → `/api/tasks/:id`

### 2. 中间件机制

- 文件名为 `_middleware.js`（下划线开头）
- 作用于**同目录及所有子目录**的路由
- 必须调用 `context.next()` 继续后续处理

```javascript
// functions/_middleware.js
export async function onRequest(context) {
    const { request, next, env } = context;
    // 认证逻辑...
    return next();
}
```

### 3. 数据库访问

通过 `context.env.DB` 访问 D1 数据库：

```javascript
const result = await env.DB.prepare(
    'SELECT * FROM tasks WHERE user_id = ?'
).bind(userId).all();
```

### 4. 环境变量

| 变量名 | 用途 | 获取方式 |
|--------|------|----------|
| `DB` | D1 数据库绑定 | Cloudflare Dashboard → Bindings |
| `JWT_SECRET` | Token 签名密钥 | Cloudflare Dashboard → Environment Variables |

---

## 🔐 认证系统

### JWT 实现

- **签发**: 登录/注册时生成 7 天有效期的 Token
- **验证**: 中间件检查 `Authorization: Bearer <token>`
- **算法**: HS256 (HMAC + SHA-256)

### 公开路由（无需认证）

- `POST /api/auth/login`
- `POST /api/auth/register`

### 受保护路由（需要 Token）

- 所有 `/api/*` 路由（除上述公开路由）

---

## 🗄️ 数据模型

### users 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PRIMARY KEY | 自增 ID |
| username | TEXT UNIQUE | 用户名（至少 3 字符）|
| password_hash | TEXT | SHA-256 哈希 |
| created_at | DATETIME | 创建时间 |

### tasks 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PRIMARY KEY | 自增 ID |
| user_id | INTEGER FK | 关联用户 |
| title | TEXT | 任务标题 |
| time | TEXT | 时间/日期 |
| space_type | TEXT | `do` 或 `not-do` |
| task_type | TEXT | `self`, `invite`, `abstinence`, `folded` |
| source | TEXT | 来源 |
| status | TEXT | `active`, `completed`, `ignored`, `expired` |
| repeat | BOOLEAN | 是否重复 |
| days | INTEGER | 重复天数 |
| permanent | BOOLEAN | 是否永久 |
| sort_order | INTEGER | 排序 |

---

## 🚀 开发工作流

### 本地开发

```bash
# 1. 安装 Wrangler CLI
npm install -g wrangler

# 2. 登录 Cloudflare
wrangler login

# 3. 本地预览（需要 D1 数据库绑定）
wrangler pages dev .
```

### 部署

```bash
# 推送代码触发自动部署
git add -A
git commit -m "feat: your changes"
git push origin main
```

Cloudflare Pages 会自动检测推送并重新部署。

---

## 📝 代码规范

### API 响应格式

```javascript
// 成功
{ success: true, data: {...} }

// 失败
{ error: 'Error message' }
```

使用 `jsonResponse()` 辅助函数统一响应：

```javascript
import { jsonResponse } from './_middleware.js';
return jsonResponse({ success: true, data: {...} });
return jsonResponse({ error: '...' }, 400);
```

### 错误处理

所有 API 路由必须包裹 try-catch：

```javascript
export async function onRequestPost(context) {
    try {
        // 业务逻辑
    } catch (error) {
        console.error('Action error:', error);
        return jsonResponse({ error: 'Action failed' }, 500);
    }
}
```

### 提交规范

```bash
feat:     新功能
fix:      Bug 修复
docs:     文档更新
style:    样式调整
refactor: 重构
test:     测试相关
chore:    构建/配置
```

---

## ⚠️ 重要注意事项

1. **D1 绑定变量名必须是 `DB`**（大写），代码中使用 `env.DB`
2. **绑定后必须重新部署** 才能生效
3. **密码使用 SHA-256 + 用户名作为 salt**（简单实现，生产环境建议 bcrypt）
4. **前端 Token 存储在 localStorage**
5. **CORS 已在中间件和 _headers 中配置**

---

## 🔗 参考链接

- [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/functions/)
- [D1 Database](https://developers.cloudflare.com/d1/)
- [Pages Functions Routing](https://developers.cloudflare.com/pages/functions/routing/)
