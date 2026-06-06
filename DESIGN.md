---
name: 同济大学乌龙茶替代品
description: 暖橙 accent 的校园评课工具站，信息清晰、克制装饰
colors:
  background: "#f7f6f4"
  foreground: "#171717"
  surface: "#ffffff"
  surface-muted: "#f0eeeb"
  accent: "#c2410c"
  accent-hover: "#9a3412"
  accent-soft: "#fef3eb"
  border: "#e7e5e4"
  text-muted: "#57534e"
  text-secondary: "#44403c"
  success: "#047857"
  warning: "#b45309"
  error: "#be123c"
typography:
  body:
    fontFamily: '"Noto Sans SC", "PingFang SC", sans-serif'
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.75
  heading:
    fontFamily: '"Noto Sans SC", "PingFang SC", sans-serif'
    fontSize: "clamp(1.75rem, 4vw, 3rem)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  mono:
    fontFamily: '"IBM Plex Mono", Consolas, monospace'
rounded:
  sm: "0.75rem"
  md: "1rem"
  lg: "1.25rem"
spacing:
  section: "2.5rem"
  card: "1.25rem"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    padding: "0.75rem 1.25rem"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.sm}"
    padding: "0.75rem 1.25rem"
  input-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.sm}"
    padding: "0.75rem 1rem"
---

## Overview

工具型内容站：搜索、列表、详情、表单为主。暖橙 accent 用于主操作与链接，背景为低 chroma 中性底，避免纸感奶油模板。

## Colors

- **background** `#f7f6f4`：页面底，略降暖 chroma
- **accent** `#c2410c`：主按钮、链接 hover、选中 pill
- **accent-soft** `#fef3eb`：评分块、warm pill 背景
- **text-muted** `#57534e`：辅助说明，对比度 ≥4.5:1
- 状态色：success / warning / error 仅用于表单反馈与管理操作

## Typography

- 单一字体族 Noto Sans SC（400–700）
- 页面 h1 唯一；区块标题 h2
- 正文 `max-width: 65ch`；数据用 `tabular-nums`
- 长文 `text-wrap: pretty`；标题 `text-wrap: balance`

## Elevation

- 表面以 **1px border** 为主，不用 border + 大 shadow 叠加
- hover：轻微 `translateY(-2px)` + border 色变化
- 无侧竖线 accent 装饰

## Components

- **PageSection**：白/ muted 底 + border，无 shadow
- **Button**：rounded-lg，primary / secondary / ghost
- **CourseCard / TeacherCard**：border + hover，分数右对齐排版
- **ReviewCard**：list 分隔线变体为主
- **EmptyState / ErrorState**：muted 底 + 明确 CTA

## Do's and Don'ts

**Do**

- 用 token 类（accent、border、surface-muted）
- 每页一个 h1，表单 label 与 focus ring 完整
- 空态与错误态给出下一步操作

**Don't**

- 侧竖线 callout（border-left accent）
- border 与 16px+ blur shadow 同元素
- 全站 rounded-full pill
- 营销 eyebrow 与 buzzword 文案
