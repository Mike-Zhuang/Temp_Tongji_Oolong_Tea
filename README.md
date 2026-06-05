# 同济大学乌龙茶替代品

基于 `Vite + React + TypeScript + Tailwind CSS + Supabase` 的静态评课网站，支持：

- 按课程名、老师名、课号统一搜索
- 老师页查看名下全部课程
- 课程页查看全部评分、评论、学期、成绩原文、赞踩等信息
- `@tongji.edu.cn` 校园邮箱登录后直接发布评论
- 评论举报与管理员后台处理

## 本地启动

1. 安装依赖

```bash
npm install
```

2. 复制环境变量模板

```bash
cp .env.example .env.local
```

3. 启动开发环境

```bash
npm run dev
```

没有配置 Supabase 时，网站会回退到内置 seed 数据；首页优先读取构建时生成的 `public/data/home-summary.json`，课程/搜索页再按需加载完整 JSON。

## 数据位置

- 原始课程/评论种子数据：`scripts/seed-data/`
- 构建后运行时静态数据：`public/data/`（由 `npm run prepare:data` 或 `npm run build` 自动生成，不提交 git）
- Buy me a coffee 图片：`supabase/storage/site-assets/`
- 数据库迁移：`supabase/migrations/`

## 初始化 Supabase

1. 在 Supabase 中执行 `supabase/migrations/20260605_init.sql`
2. 在项目根目录配置 `.env.local`
3. 运行导入脚本

```bash
npm run import:seed
```

## 登录说明

- 前端限制只允许 `@tongji.edu.cn` 邮箱
- 登录方式使用 Supabase OTP 邮件链接
- Supabase Auth URL Configuration 建议填写：
  - Site URL: `https://1.mikezhuang.cn`
  - Redirect URLs: `https://1.mikezhuang.cn/auth/callback`
  - 本地开发可额外添加：`http://localhost:5173/auth/callback`

## 管理员

当前内置管理员邮箱：

```text
tjpush_admin@mikezhuang.cn
```

使用该邮箱登录后可以访问 `/admin`。

## 静态部署

- 构建命令：`npm run build`（会先复制 seed 到 `public/data/` 并生成 `home-summary.json`）
- 静态产物目录：`dist`
- 宝塔/Nginx 站点根目录可指向 `dist` 发布后的目录，例如 `/www/wwwroot/1.mikezhuang.cn`
- `deploy/sync-deploy.sh` 会自动拉取仓库、构建静态产物、发布到站点目录，并停止旧的 PM2 Next 进程

### 慢网优化（建议）

首屏 JS 已不再打包 seed 数据（约 130 KiB gzip），首页额外请求 `/data/home-summary.json`。请在 Nginx 对 `/assets/` 与 `/data/` 开启 **gzip** 或 **brotli** 压缩，例如：

```nginx
gzip on;
gzip_types application/javascript application/json text/css;
gzip_min_length 256;
```

完整 seed JSON（`/data/wlc.*.json`）仅在进入搜索/课程页且 Supabase 不可用时按需加载。
