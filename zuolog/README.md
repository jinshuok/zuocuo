# 双态空间 | Dual-State Focus

一个带有用户系统和数据库的「不做」清单应用，部署在 Cloudflare Pages。

## ✨ 特性

- 👤 **用户系统**：注册/登录，JWT 认证
- 💾 **数据持久化**：Cloudflare D1 数据库存储
- 📱 **手势交互**：滑动切换、任务操作
- ⚡ **边缘部署**：Cloudflare Pages Functions
- 🎨 **简洁设计**：保持原有极简风格

## 🏗️ 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | HTML5 + Tailwind CSS + Vanilla JS |
| 后端 | Cloudflare Pages Functions |
| 数据库 | Cloudflare D1 (SQLite) |
| 部署 | Cloudflare Pages |

## 🚀 快速开始

### 本地开发

```bash
# 克隆项目
git clone https://github.com/jinshuok/zuo.git
cd zuo

# 安装 Wrangler CLI
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 本地预览（需要配置 D1 数据库）
wrangler pages dev .
```

### 部署

详见 [DEPLOY.md](./DEPLOY.md)

## 📁 项目结构

```
├── index.html              # 前端主页面
├── functions/              # Pages Functions
│   ├── _middleware.js      # 认证中间件
│   └── api/                # API 路由
├── schema.sql              # 数据库表结构
├── wrangler.toml           # Cloudflare 配置
└── DEPLOY.md               # 部署指南
```

## 🔌 API 文档

### 认证

- `POST /api/auth/register` - 注册
- `POST /api/auth/login` - 登录
- `GET /api/auth/me` - 获取当前用户

### 任务

- `GET /api/tasks/list?space=do` - 列表
- `POST /api/tasks/create` - 创建
- `PUT /api/tasks/:id` - 更新
- `DELETE /api/tasks/:id` - 删除

## 📝 License

MIT
Update for D1 binding