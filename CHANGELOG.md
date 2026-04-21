# Changelog

所有对 zuocuo 项目的显著改动都将记录在此文件。

格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

---

## [Unreleased]

### Added
- 首页轮播图新增 **轮盘（Wheel）交互类型**，支持类似 minimaxi.com 的弧形轮盘焦点图效果。
  - 鼠标滚轮旋转轮盘
  - 触摸/鼠标拖拽旋转（移动端+桌面端）
  - 中心卡片最大、最清晰，且可点击跳转
  - 两侧卡片自动缩小、变透明、倾斜
- 后台管理轮播图表单新增 **交互方式** 选择（标准 / 轮盘）。
- 轮盘类型支持配置 **多张独立图片**，每张图片拥有独立的链接。
- `banners` 表新增 `type`（标准/轮盘）和 `items`（JSON 轮盘数据）字段。
- API 全面支持 `type` 与 `items` 字段的读写。

### Changed
- 管理后台轮播图列表增加类型标识（`| 轮盘`）。
- 优化编辑轮播图时的数据加载方式，改用内存缓存避免 base64 图片嵌入 HTML 属性。

---

## [0.1.0] - 2026-04-18

### Added
- 项目初始化：Cloudflare Pages + D1 + Pages Functions 架构。
- 首页标准轮播图（Swiper.js）与九宫格展示。
- 管理后台：登录认证（JWT）、轮播图 CRUD、九宫格 CRUD。
- 图片上传支持点击选择、拖拽、Ctrl+V 粘贴，客户端压缩后 base64 存储。
- D1 数据库表结构：`admins`、`banners`、`grids`。

---
