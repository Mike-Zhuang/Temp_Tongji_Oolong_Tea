# 同济大学乌龙茶替代品

基于 `Next.js App Router + TypeScript + Tailwind CSS + Supabase` 的评课网站，支持：

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

没有配置 Supabase 时，网站仍可读取本地种子数据进行浏览；但登录、发评论、举报、后台管理会提示未配置。

## 数据位置

- 原始课程/评论种子数据：`scripts/seed-data/`
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
- 邮件 SMTP 请在 Supabase 后台配置，不要把凭据提交进仓库

## 管理员

当前内置管理员邮箱：

```text
tjpush_admin@mikezhuang.cn
```

使用该邮箱登录后可以访问 `/admin`。
