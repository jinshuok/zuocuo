# AGENTS.md - zuocuo

> 本文件供 AI Agent 参考。如果你需要了解**最近做了什么改动**，请首先查看同目录下的 `CHANGELOG.md`。

---

## 📋 项目概述

**zuocuo** 是一个部署在 Cloudflare Pages 的内容展示站点，带有管理后台。

### 核心功能
- **首页轮播图**：支持两种交互类型
  - `standard`（标准）：Swiper.js 淡入淡出轮播
  - `wheel`（轮盘）：弧形 3D 轮盘，支持鼠标滚轮/拖拽旋转，中心项可点击
- **九宫格**：首页网格展示
- **管理后台**：JWT 认证，轮播图与九宫格的 CRUD 管理

---

## 🏗️ 架构概览

```
zuocuo/
├── public/                 # 静态前端
│   ├── index.html          # 首页（轮播图 + 九宫格）
│   ├── admin.html          # 管理后台
│   └── css/style.css       # 样式
├── functions/              # Pages Functions (API)
│   ├── _middleware.js      # JWT + CORS
│   └── api/
│       ├── auth/           # 登录 / 改密
│       ├── banners/        # 轮播图 CRUD
│       └── grids/          # 九宫格 CRUD
├── schema.sql              # D1 数据库表结构
├── wrangler.toml           # Wrangler 配置
├── CHANGELOG.md            # ← 改动历史（AI 必读）
└── AGENTS.md               # 本文件
```

---

## 🗄️ 数据模型要点

### banners 表

| 字段 | 说明 |
|------|------|
| `title` | 轮播标题 |
| `image_url` | 主图（轮盘类型时作为背景） |
| `type` | `standard` 或 `wheel` |
| `items` | JSON 数组，轮盘类型时存储子图片 `{image_url, link_url}` |
| `btn_text`, `btn_link`, `link_url` | 按钮与详情链接 |
| `sort_order`, `active` | 排序与启用状态 |

### grids 表

| 字段 | 说明 |
|------|------|
| `title`, `image_url`, `link_url` | 标题/图片/链接 |
| `sort_order`, `active` | 排序与启用状态 |

---

## 🔧 技术规范

- **路由**: 文件系统路由，`[id].js` 为动态路由
- **中间件**: `_middleware.js` 作用于同目录及子目录
- **数据库**: `context.env.DB` 访问 D1，变量名必须是 `DB`
- **认证**: JWT HS256，有效期 7 天，密码 SHA-256
- **图片**: 客户端压缩为 base64 JPEG（max 1920px），直接存数据库

---

## 🚀 开发与部署

### 本地开发

```bash
# 需要 .dev.vars 中的 JWT_SECRET
npx wrangler pages dev public
```

### 部署工作流（强制原则）

> **原则：任何更新完成后，必须同步更新 `CHANGELOG.md` 并立即推送到 GitHub。**

```bash
# 1. 更新代码
# 2. 同步更新 CHANGELOG.md（在 [Unreleased] 下追加条目）
# 3. 提交并推送（Cloudflare Pages 会自动部署）
git add -A
git commit -m "feat: 简述改动内容"
git push origin main
```

**不允许**出现以下情况：
- 代码已改但 `CHANGELOG.md` 未更新
- 本地改动未推送就结束任务
- 提交信息为空或仅有"update"等无意义描述

---

## ⚠️ 重要注意事项

1. **每次改动后，同步更新 `CHANGELOG.md`**（Added / Changed / Fixed / Removed）。
2. **D1 schema 变更**需要手动在 Cloudflare Dashboard 执行 `ALTER TABLE` 或重新导入 `schema.sql`。
3. **公开路由**（无需 Token）：`POST /api/auth/login`、`GET /api/banners/list`。
4. **其余 API** 均需 `Authorization: Bearer <token>`。

---

## 🔗 相关文件

- `CHANGELOG.md` — 版本历史与功能改动（**AI 接手项目时请先读此文件**）
- `schema.sql` — 数据库表结构
- `wrangler.toml` — 部署配置
