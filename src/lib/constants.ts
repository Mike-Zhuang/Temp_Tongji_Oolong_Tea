import type { ReviewTagOption } from "@/lib/types";

export const SITE_NAME = "同济大学乌龙茶替代品";

export const SITE_DESCRIPTION =
  "一个尽量把课程、老师、真实评分和评论都摆到台面上的同济评课替代站。";

export const ACKNOWLEDGEMENT_LINK = "https://1.tongji.icu";

export const ICP_FILING_NUMBER = "沪ICP备2026015123号";

export const ICP_FILING_LINK = "https://beian.miit.gov.cn/";

export const ADMIN_EMAIL = "tjpush_admin@mikezhuang.cn";

export const REVIEW_TAG_OPTIONS: ReviewTagOption[] = [
  { label: "给分宽松", value: "lenient-grading" },
  { label: "作业多", value: "heavy-workload" },
  { label: "点名频繁", value: "attendance-heavy" },
  { label: "内容有趣", value: "interesting-content" },
  { label: "适合水课", value: "easy-elective" },
  { label: "考试友好", value: "exam-friendly" },
];

export const SEARCH_SORT_OPTIONS = [
  { label: "综合相关度", value: "relevance" },
  { label: "评分高", value: "rating" },
  { label: "评论多", value: "reviews" },
  { label: "最近活跃", value: "recent" },
] as const;

export const REVIEW_SORT_OPTIONS = [
  { label: "最新发布", value: "latest" },
  { label: "最热讨论", value: "hot" },
  { label: "评分最高", value: "highest" },
  { label: "评分最低", value: "lowest" },
] as const;

export const DEPARTMENT_FALLBACK = "院系暂缺";
