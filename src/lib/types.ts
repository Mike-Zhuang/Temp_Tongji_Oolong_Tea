export type SearchSort = "relevance" | "rating" | "reviews" | "recent";

export type ReviewSort = "latest" | "hot" | "highest" | "lowest";

export type PublishStatus = "published" | "hidden";

export interface RawCourse {
  id: number;
  categories: string[];
  department: string | null;
  teacher: string;
  rating: {
    count: number;
    avg: number;
  };
  code: string;
  name: string;
  credit: number;
}

export interface RawRating {
  id: number;
  reactions: {
    approves: number;
    disapproves: number;
    reaction: string | null;
  };
  is_mine: boolean;
  semester: string;
  course: {
    id: number;
    code: string;
    name: string;
    teacher: string;
  };
  rating: number;
  comment: string;
  created_at: string;
  modified_at: string;
  score: string | null;
  moderator_remark: string | null;
}

export interface ReviewTagOption {
  label: string;
  value: string;
}

export interface Review {
  id: string;
  sourceId: number | null;
  courseId: number;
  courseCode: string;
  courseName: string;
  teacherName: string;
  teacherSlug: string;
  semester: string;
  rating: number;
  comment: string;
  createdAt: string;
  modifiedAt: string;
  score: string | null;
  moderatorRemark: string | null;
  approves: number;
  disapproves: number;
  isMine: boolean;
  publishStatus: PublishStatus;
  source: "seed" | "user";
  tags: string[];
  userId?: string | null;
  reportsCount?: number;
}

export interface RatingDistributionItem {
  stars: number;
  count: number;
}

export interface Course {
  id: number;
  code: string;
  name: string;
  teacherName: string;
  teacherSlug: string;
  department: string | null;
  credit: number;
  categories: string[];
  seedRatingCount: number;
  seedRatingAverage: number;
  reviewCount: number;
  averageRating: number;
  lastReviewAt: string | null;
  ratingDistribution: RatingDistributionItem[];
  reviews: Review[];
}

export interface TeacherCourseCard {
  id: number;
  code: string;
  name: string;
  department: string | null;
  credit: number;
  categories: string[];
  averageRating: number;
  reviewCount: number;
  lastReviewAt: string | null;
}

export interface TeacherSummary {
  name: string;
  slug: string;
  departmentHints: string[];
  courseCount: number;
  reviewCount: number;
  averageRating: number;
  lastReviewAt: string | null;
  courses: TeacherCourseCard[];
}

export interface SearchResult {
  courses: Course[];
  teachers: TeacherSummary[];
  query: string;
  sort: SearchSort;
}

export interface HomePageData {
  featuredCourses: Course[];
  topTeachers: TeacherSummary[];
  latestReviews: Review[];
  cautionCourses: Course[];
  siteStats: {
    courseCount: number;
    teacherCount: number;
    reviewCount: number;
    categoryCount: number;
  };
}

export interface ReviewFormInput {
  courseId: number;
  rating: number;
  semester: string;
  score: string;
  comment: string;
  tags: string[];
}

export interface UserProfile {
  id: string;
  email: string;
  isAdmin: boolean;
}

export interface AdminReviewUpdateInput {
  publishStatus?: PublishStatus;
  moderatorRemark?: string | null;
}
