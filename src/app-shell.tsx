import { useEffect, useMemo, useState, type DependencyList, type ReactNode } from "react";

import { AdminReviewActions } from "@/components/admin-review-actions";
import { BuyMeACoffeeCard } from "@/components/buy-me-a-coffee-card";
import { CourseCard } from "@/components/course-card";
import { LoginForm } from "@/components/login-form";
import { ReportReviewButton } from "@/components/report-review-button";
import { ReviewCard } from "@/components/review-card";
import { ReviewForm } from "@/components/review-form";
import { SearchBar } from "@/components/search-bar";
import { SectionTitle } from "@/components/section-title";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Stars } from "@/components/stars";
import { TeacherCard } from "@/components/teacher-card";
import { Button } from "@/components/ui/button";
import { PageSection } from "@/components/ui/page-section";
import { SortPills } from "@/components/ui/sort-pills";
import { StatInline } from "@/components/ui/stat-inline";
import { REVIEW_SORT_OPTIONS, SEARCH_SORT_OPTIONS, SITE_DESCRIPTION } from "@/lib/constants";
import {
  getAdminReviews,
  getCourseById,
  getCurrentUserProfile,
  getHomePageData,
  getMyReviews,
  getTeacherBySlug,
  searchSite,
} from "@/lib/data-client";
import { createSupabaseBrowserClient, hasSupabaseEnv } from "@/lib/supabase/client";
import type {
  Course,
  HomePageData,
  Review,
  ReviewSort,
  SearchResult,
  SearchSort,
  TeacherSummary,
  UserProfile,
} from "@/lib/types";
import { buildTeacherUrl, formatDateTime, formatRating } from "@/lib/utils";

interface RouteState {
  path: string;
  params: URLSearchParams;
}

function getRouteState(): RouteState {
  return {
    path: window.location.pathname.replace(/\/$/, "") || "/",
    params: new URLSearchParams(window.location.search),
  };
}

function useRouteState() {
  const [route, setRoute] = useState<RouteState>(() => getRouteState());

  useEffect(() => {
    const updateRoute = () => setRoute(getRouteState());
    window.addEventListener("popstate", updateRoute);
    return () => window.removeEventListener("popstate", updateRoute);
  }, []);

  return route;
}

function useAsyncData<T>(loader: () => Promise<T>, dependencies: DependencyList) {
  const [state, setState] = useState<{
    data: T | null;
    error: string;
    isLoading: boolean;
  }>({
    data: null,
    error: "",
    isLoading: true,
  });

  useEffect(() => {
    let cancelled = false;
    setState({ data: null, error: "", isLoading: true });

    loader()
      .then((data) => {
        if (!cancelled) {
          setState({ data, error: "", isLoading: false });
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setState({
            data: null,
            error: error instanceof Error ? error.message : "数据加载失败",
            isLoading: false,
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, dependencies);

  return state;
}

export function App() {
  const route = useRouteState();
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    getCurrentUserProfile().then(setUser).catch(() => setUser(null));
    const supabase = createSupabaseBrowserClient();
    const subscription = supabase?.auth.onAuthStateChange(() => {
      getCurrentUserProfile().then(setUser).catch(() => setUser(null));
    });
    return () => subscription?.data.subscription.unsubscribe();
  }, []);

  const content = useMemo(() => {
    if (route.path === "/") {
      return <HomePage />;
    }
    if (route.path === "/search") {
      return <SearchPage query={route.params.get("q") ?? ""} sort={(route.params.get("sort") ?? "relevance") as SearchSort} />;
    }
    if (route.path.startsWith("/teacher/")) {
      return <TeacherPage teacherSlug={decodeURIComponent(route.path.replace("/teacher/", ""))} />;
    }
    if (route.path.startsWith("/course/")) {
      return <CoursePage courseId={Number(route.path.replace("/course/", ""))} sort={(route.params.get("sort") ?? "latest") as ReviewSort} />;
    }
    if (route.path.startsWith("/write-review/")) {
      return <WriteReviewPage courseId={Number(route.path.replace("/write-review/", ""))} user={user} />;
    }
    if (route.path === "/auth") {
      return <AuthPage />;
    }
    if (route.path === "/auth/callback") {
      return <AuthCallbackPage />;
    }
    if (route.path === "/me") {
      return <MePage user={user} />;
    }
    if (route.path === "/admin") {
      return <AdminPage user={user} />;
    }
    return <NotFoundPage />;
  }, [route.path, route.params, user]);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader user={user} />
      <main className="flex-1">{content}</main>
      <SiteFooter />
    </div>
  );
}

function LoadingState({ text = "正在加载课程数据..." }: { text?: string }) {
  return (
    <div className="mx-auto flex min-h-[50vh] w-full max-w-3xl items-center justify-center px-4 text-center text-sm text-stone-500">
      {text}
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="mx-auto flex min-h-[50vh] w-full max-w-3xl flex-col items-center justify-center px-4 text-center">
      <h1 className="text-3xl font-bold text-stone-900">数据暂时没加载出来</h1>
      <p className="mt-4 text-sm leading-7 text-stone-600">{message}</p>
    </div>
  );
}

function HomePage() {
  const { data, error, isLoading } = useAsyncData<HomePageData>(() => getHomePageData(), []);

  if (isLoading) {
    return <LoadingState />;
  }
  if (error || !data) {
    return <ErrorState message={error || "课程数据暂时加载失败，请稍后重试。"} />;
  }

  return (
    <div className="pb-16">
      <section className="overflow-hidden">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-start lg:px-8 lg:py-16">
          <div className="space-y-6">
            <div>
              <p className="text-xs font-medium text-orange-600">同济课程雷达</p>
              <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-tight tracking-tight text-stone-900 sm:text-5xl">
                先搜老师，再决定这门课值不值得上。
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-stone-600 sm:text-lg">
                {SITE_DESCRIPTION} 搜索课程名或老师名后，你可以一眼看到老师名下全部课程、每门课的历史评论、评分走势和真实上课体验。
              </p>
            </div>
            <div className="max-w-3xl">
              <SearchBar large />
            </div>
            <StatInline
              items={[
                { label: "课程", value: data.siteStats.courseCount.toString() },
                { label: "老师", value: data.siteStats.teacherCount.toString() },
                { label: "评论", value: data.siteStats.reviewCount.toString() },
                { label: "分类", value: data.siteStats.categoryCount.toString() },
              ]}
            />
            <div className="flex flex-wrap gap-2">
              <a href="/search" className="rounded-full bg-stone-100 px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-200">
                开始搜索
              </a>
              <a href="#top-teachers" className="rounded-full bg-stone-100 px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-200">
                看高分教师
              </a>
              <a href="#featured-courses" className="rounded-full bg-stone-100 px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-200">
                热门课程
              </a>
            </div>
          </div>
          <PageSection className="lg:max-h-[min(520px,70vh)] lg:overflow-y-auto">
            <SectionTitle
              eyebrow="新鲜热评"
              title="最近大家在说什么"
              description="首屏先把最近有讨论的课程摆出来，方便快速捞到当学期活跃评价。"
            />
            <div className="mt-5">
              {data.latestReviews.length ? (
                data.latestReviews.slice(0, 2).map((review) => (
                  <ReviewCard key={review.id} review={review} showCourseMeta variant="preview" />
                ))
              ) : (
                <EmptyState text="暂时还没有最新评论，先去搜索课程看看吧。" actionHref="/search" actionLabel="去搜索" />
              )}
            </div>
            {data.latestReviews.length ? (
              <a href="/search?sort=recent" className="mt-4 inline-flex text-sm font-semibold text-orange-600 hover:text-orange-700">
                查看更多热评 →
              </a>
            ) : null}
          </PageSection>
        </div>
        <div className="mx-auto mt-10 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <BuyMeACoffeeCard compact />
        </div>
      </section>
      <CardSection id="featured-courses" eyebrow="热门课程" title="评论最多的课程" description="优先展示评论量高的课程，方便你快速找到信息密度最高的入口。">
        {data.featuredCourses.map((course) => <CourseCard key={course.id} course={course} />)}
      </CardSection>
      <CardSection id="top-teachers" eyebrow="高分教师" title="口碑最稳的一批老师" description="这里会优先综合平均分和评论量，避免只靠一两条样本冲榜。" gridClassName="lg:grid-cols-3">
        {data.topTeachers.map((teacher) => <TeacherCard key={teacher.slug} teacher={teacher} />)}
      </CardSection>
      <CardSection eyebrow="避雷参考" title="低分且样本不算少的课程" description="低分不一定代表课程差，但至少说明分歧明显，建议点进去先看评论再决定。">
        {data.cautionCourses.map((course) => <CourseCard key={course.id} course={course} />)}
      </CardSection>
    </div>
  );
}

function SearchPage({ query, sort }: { query: string; sort: SearchSort }) {
  const { data, error, isLoading } = useAsyncData<SearchResult>(() => searchSite(query, sort), [query, sort]);

  if (isLoading) {
    return <LoadingState text="正在搜索课程和老师..." />;
  }
  if (error || !data) {
    return <ErrorState message={error || "搜索失败，请稍后重试。"} />;
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <PageSection>
        <SectionTitle
          eyebrow="搜索"
          title="找课程，也找老师"
          description="统一搜索框会同时命中课程名、老师名、课号和课程分类。建议先搜老师，再看名下所有课。"
        />
        <div className="mt-6">
          <SearchBar initialQuery={query} />
        </div>
        <SortPills
          options={SEARCH_SORT_OPTIONS}
          activeValue={sort}
          getHref={(value) => `/search?q=${encodeURIComponent(query)}&sort=${value}`}
        />
      </PageSection>
      <div className="mt-10 grid gap-10 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="space-y-5">
          <SectionTitle eyebrow="老师结果" title={`匹配到 ${data.teachers.length} 位老师`} />
          {data.teachers.length ? data.teachers.map((teacher) => <TeacherCard key={teacher.slug} teacher={teacher} />) : <EmptyState text="没有找到匹配的老师，试试课程名、课号或者更短一点的关键词。" actionHref="/search" actionLabel="重新搜索" />}
        </section>
        <section className="space-y-5">
          <SectionTitle eyebrow="课程结果" title={`匹配到 ${data.courses.length} 门课程`} />
          {data.courses.length ? data.courses.map((course) => <CourseCard key={course.id} course={course} />) : <EmptyState text="没有找到匹配的课程，换一个老师名或删掉部分关键词再试试。" actionHref="/search" actionLabel="重新搜索" />}
        </section>
      </div>
    </div>
  );
}

function TeacherPage({ teacherSlug }: { teacherSlug: string }) {
  const { data: teacher, error, isLoading } = useAsyncData<TeacherSummary | null>(() => getTeacherBySlug(teacherSlug), [teacherSlug]);

  if (isLoading) {
    return <LoadingState text="正在加载老师主页..." />;
  }
  if (error) {
    return <ErrorState message={error} />;
  }
  if (!teacher) {
    return <NotFoundPage />;
  }

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
      <div className="space-y-8">
        <PageSection>
          <SectionTitle
            eyebrow="教师主页"
            title={teacher.name}
            description="这里按老师聚合同名下全部课程，适合判断这位老师整体的上课风格、给分习惯和稳定性。"
          />
          <div className="mt-6">
            <StatInline
              items={[
                { label: "名下课程", value: teacher.courseCount.toString() },
                { label: "累计评论", value: teacher.reviewCount.toString() },
                { label: "平均评分", value: formatRating(teacher.averageRating) },
                { label: "最近活跃", value: teacher.lastReviewAt ? formatDateTime(teacher.lastReviewAt) : "暂无" },
              ]}
            />
          </div>
          <div className="mt-5 flex items-center gap-3">
            <Stars rating={teacher.averageRating} />
            <p className="text-sm text-stone-500">涉及院系：{teacher.departmentHints.join("、")}</p>
          </div>
        </PageSection>
        <section className="space-y-5">
          <SectionTitle
            eyebrow="全部课程"
            title={`${teacher.name} 名下的 ${teacher.courses.length} 门课`}
            description="课程卡片里会尽量保留课号、分类、学分、院系、均分、评论量和最近活跃时间。"
          />
          {teacher.courses.map((course) => <CourseCard key={course.id} course={{ ...course, teacherName: teacher.name, teacherSlug: teacher.slug, seedRatingCount: 0, seedRatingAverage: course.averageRating, ratingDistribution: [], reviews: [] }} />)}
        </section>
      </div>
      <div className="space-y-6">
        <GuideCard />
        <BuyMeACoffeeCard />
      </div>
    </div>
  );
}

function CoursePage({ courseId, sort }: { courseId: number; sort: ReviewSort }) {
  const { data: course, error, isLoading } = useAsyncData<Course | null>(() => getCourseById(courseId, sort), [courseId, sort]);

  if (isLoading) {
    return <LoadingState text="正在加载课程评论..." />;
  }
  if (error) {
    return <ErrorState message={error} />;
  }
  if (!course) {
    return <NotFoundPage />;
  }

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.75fr)] lg:items-start lg:px-8">
      <div className="space-y-8">
        <PageSection>
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-3xl">
              <SectionTitle
                eyebrow={course.code}
                title={course.name}
                description={`教师：${course.teacherName}。这里会展示尽可能完整的评分、评论、成绩原文、时间、赞踩和课程基础信息。`}
              />
              <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-stone-500">
                <a href={buildTeacherUrl(course.teacherSlug)} className="font-semibold text-stone-800 hover:text-orange-600">查看老师主页</a>
                <span>·</span>
                <span>{course.department ?? "院系暂缺"}</span>
                <span>·</span>
                <span>{course.credit} 学分</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {course.categories.map((category) => <Pill key={category}>{category}</Pill>)}
              </div>
            </div>
            <div className="hidden min-w-52 border-l-4 border-orange-500 pl-5 lg:block">
              <p className="text-sm text-stone-500">课程总评分</p>
              <p className="mt-2 text-4xl font-bold text-stone-900">{formatRating(course.averageRating)}</p>
              <div className="mt-3"><Stars rating={course.averageRating} /></div>
              <p className="mt-3 text-sm text-stone-500">{course.reviewCount} 条评论</p>
              <p className="mt-1 text-sm text-stone-500">最近活跃：{formatDateTime(course.lastReviewAt)}</p>
            </div>
          </div>
        </PageSection>
        <div className="lg:hidden">
          <CourseRatingSummary course={course} showWriteLink />
        </div>
        <PageSection>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <SectionTitle
              eyebrow="评论区"
              title={`${course.reviewCount} 条历史评论`}
              description="支持按最新、最热、高分、低分排序。超长评论默认折叠，点开可看全文。"
            />
            <Button href={`/write-review/${course.id}`}>写一条评论</Button>
          </div>
          <SortPills
            options={REVIEW_SORT_OPTIONS}
            activeValue={sort}
            getHref={(value) => `/course/${courseId}?sort=${value}`}
          />
          <div className="mt-6">
            {course.reviews.length ? course.reviews.map((review) => (
              <div key={review.id}>
                <ReviewCard review={review} />
                <div className="pb-5"><ReportReviewButton reviewId={review.id} /></div>
              </div>
            )) : <EmptyState text="这门课暂时还没有评论，欢迎成为第一个留下经验的人。" />}
          </div>
        </PageSection>
      </div>
      <div className="lg:sticky lg:top-24">
        <CourseSidebar course={course} />
      </div>
    </div>
  );
}

function WriteReviewPage({ courseId, user }: { courseId: number; user: UserProfile | null }) {
  const { data: course, error, isLoading } = useAsyncData<Course | null>(() => getCourseById(courseId), [courseId]);

  if (isLoading) {
    return <LoadingState text="正在准备评论表单..." />;
  }
  if (error) {
    return <ErrorState message={error} />;
  }
  if (!course) {
    return <NotFoundPage />;
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8">
      <PageSection>
        <SectionTitle
          eyebrow="写评论"
          title={`${course.name} · ${course.teacherName}`}
          description="为了让评论更有参考价值，建议尽量写清楚课程内容、上课自由度、考核标准、给分体验和授课质量。"
        />
        <div className="mt-8">
          {user ? <ReviewForm course={course} user={user} /> : <LoginRequired />}
        </div>
      </PageSection>
      <PageSection variant="muted">
        <h2 className="text-lg font-bold text-stone-900">写作建议</h2>
        <ul className="mt-4 space-y-3 text-sm leading-7 text-stone-600">
          <li>越具体越有用，比如“论文 1000 字”“每周点名”“上课几乎不管”这类细节。</li>
          <li>成绩字段保留原文即可，不需要为了统一格式硬改成 A/B/C。</li>
          <li>如果是强烈主观看法，尽量补上你为什么这么判断，方便别人自己衡量。</li>
        </ul>
      </PageSection>
    </div>
  );
}

function AuthPage() {
  const authEnabled = hasSupabaseEnv();

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8">
      <PageSection>
        <SectionTitle
          eyebrow="校园邮箱登录"
          title="只允许 @tongji.edu.cn"
          description={authEnabled ? "站内评论采用同济校园邮箱登录。发送登录链接后，点击邮件中的链接即可回到本站完成登录。" : "登录配置暂不可用，请联系站长检查 Supabase 环境变量。"}
        />
        <div className="mt-8">
          <LoginForm isEnabled={authEnabled} />
          {!authEnabled ? <EmptyState text="登录配置暂不可用，暂时不能发送校园邮箱登录链接。" /> : null}
        </div>
      </PageSection>
      <PageSection variant="muted">
        <h2 className="text-lg font-bold text-stone-900">为什么这样做</h2>
        <ul className="mt-4 space-y-3 text-sm leading-7 text-stone-600">
          <li>先把发评论的门槛限定在同济校园邮箱，能显著减少灌水和恶意内容。</li>
          <li>登录后评论会直接公开，管理员主要处理被举报内容，不提前卡审核。</li>
        </ul>
      </PageSection>
    </div>
  );
}

function AuthCallbackPage() {
  const [message, setMessage] = useState("正在完成登录...");

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const code = new URLSearchParams(window.location.search).get("code");

    if (!supabase) {
      setMessage("登录配置暂不可用，请联系站长检查 Supabase 环境变量。");
      return;
    }
    const authClient = supabase;

    async function finishLogin() {
      const { data: existingSession } = await authClient.auth.getSession();
      if (existingSession.session) {
        window.history.replaceState({}, "", "/auth/callback");
        window.location.href = "/me";
        return;
      }

      if (!code) {
        setMessage("登录链接无效，请回到登录页重新发送。");
        return;
      }

      const { error } = await authClient.auth.exchangeCodeForSession(code);
      if (error) {
        const { data: sessionAfterError } = await authClient.auth.getSession();
        if (sessionAfterError.session) {
          window.location.href = "/me";
          return;
        }
        setMessage(
          error.message.includes("code verifier")
            ? "登录状态已经写入浏览器，请点击右上角或进入“我的评论”继续使用。"
            : error.message,
        );
        return;
      }

      window.location.href = "/me";
    }

    finishLogin();
  }, []);

  return <LoadingState text={message} />;
}

function MePage({ user }: { user: UserProfile | null }) {
  const { data, error, isLoading } = useAsyncData<Review[]>(
    () => user ? getMyReviews(user.id) : Promise.resolve([]),
    [user?.id],
  );

  if (!user) {
    return <LoginPrompt title="先登录，才能看到你的评论历史" description="使用同济校园邮箱登录后，你可以查看自己发布过的评论记录。" />;
  }
  if (isLoading) {
    return <LoadingState text="正在加载你的评论..." />;
  }
  if (error) {
    return <ErrorState message={error} />;
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <PageSection>
        <SectionTitle eyebrow="我的评论" title="你发布过的历史记录" description="这里会列出你所有站内新增评论，方便回看和后续补充。" />
      </PageSection>
      <div className="mt-8">
        {data?.length ? data.map((review) => <ReviewCard key={review.id} review={review} showCourseMeta />) : <EmptyState text="你还没有发布过站内评论。先去搜索课程，再补上一条真实体验吧。" actionHref="/search" actionLabel="去搜索" />}
      </div>
    </div>
  );
}

function AdminPage({ user }: { user: UserProfile | null }) {
  const { data, error, isLoading } = useAsyncData<Review[]>(
    () => user?.isAdmin ? getAdminReviews() : Promise.resolve([]),
    [user?.id, user?.isAdmin],
  );

  if (!user?.isAdmin) {
    return <LoginPrompt title="这里只有管理员能看" description="请使用管理员邮箱登录后再访问管理后台。" tone="danger" />;
  }
  if (isLoading) {
    return <LoadingState text="正在加载后台评论..." />;
  }
  if (error) {
    return <ErrorState message={error} />;
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <PageSection>
        <SectionTitle eyebrow="管理后台" title="最新评论与举报处理" description="这里可以查看站内评论、被举报记录数、当前公开状态，并支持隐藏/恢复评论或补充管理员备注。" />
      </PageSection>
      <div className="mt-8">
        {data?.length ? data.map((review) => (
          <div key={review.id}>
            <ReviewCard review={review} showCourseMeta />
            <div className="border-t border-stone-200 pb-5 pt-4">
              <div className="flex flex-wrap gap-4 text-xs text-stone-500">
                <span>当前状态：{review.publishStatus}</span>
                <span>举报次数：{review.reportsCount ?? 0}</span>
                <span>来源：{review.source}</span>
              </div>
              <AdminReviewActions review={review} />
            </div>
          </div>
        )) : <EmptyState text="暂无待处理评论。" />}
      </div>
    </div>
  );
}

function CourseSidebar({ course }: { course: Course }) {
  return (
    <div className="space-y-6">
      <PageSection className="divide-y divide-stone-200 !p-0">
        <div className="p-6">
          <h2 className="text-lg font-bold text-stone-900">快速结论</h2>
          <ul className="mt-5 space-y-3 text-sm leading-7 text-stone-600">
            <li>先看评分和评论总数，样本量足够时参考价值会明显更高。</li>
            <li>再看最近活跃时间，避免把很老的口碑直接套用到现在。</li>
            <li>如果成绩原文很分裂，优先看评论正文里的考核和给分细节。</li>
          </ul>
          <a
            href={`/write-review/${course.id}`}
            className="mt-5 inline-flex text-sm font-semibold text-orange-600 transition hover:text-orange-700"
          >
            我也写一条评论
          </a>
        </div>
        <div className="p-6">
          <h2 className="text-lg font-bold text-stone-900">评分分布</h2>
          <div className="mt-4 space-y-3">
            {course.ratingDistribution.map((item) => {
              const percentage = course.reviewCount > 0 ? Math.round((item.count / course.reviewCount) * 100) : 0;
              return (
                <div key={item.stars} className="space-y-1">
                  <div className="flex items-center justify-between text-sm text-stone-600">
                    <span>{item.stars} 星</span>
                    <span>{item.count} 条 · {percentage}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-stone-100">
                    <div className="h-full rounded-full bg-orange-500 transition-all" style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </PageSection>
      <BuyMeACoffeeCard />
    </div>
  );
}

function EmptyState({
  text,
  actionHref,
  actionLabel,
}: {
  text: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="rounded-md bg-stone-50 p-6 text-center text-sm leading-7 text-stone-500">
      <p>{text}</p>
      {actionHref && actionLabel ? (
        <div className="mt-4">
          <Button href={actionHref}>{actionLabel}</Button>
        </div>
      ) : null}
    </div>
  );
}

function LoginRequired() {
  return (
    <div className="rounded-md bg-stone-50 p-6 text-sm leading-7 text-stone-600">
      你还没有登录。请先使用 <span className="font-semibold">@tongji.edu.cn</span> 校园邮箱登录，再回来发布评论。
      <div className="mt-5">
        <Button href="/auth">去登录</Button>
      </div>
    </div>
  );
}

function LoginPrompt({ title, description, tone = "warm" }: { title: string; description: string; tone?: "warm" | "danger" }) {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col items-center justify-center px-4 text-center">
      <p className={`rounded-full px-4 py-2 text-xs font-medium ${tone === "danger" ? "bg-rose-100 text-rose-700" : "bg-orange-100 text-orange-700"}`}>
        {tone === "danger" ? "管理员专用" : "我的评论"}
      </p>
      <h1 className="mt-6 text-4xl font-bold tracking-tight text-stone-900">{title}</h1>
      <p className="mt-4 text-sm leading-7 text-stone-600">{description}</p>
      <Button href="/auth" className="mt-8">去登录</Button>
    </div>
  );
}

function CourseRatingSummary({ course, showWriteLink = false }: { course: Course; showWriteLink?: boolean }) {
  return (
    <PageSection>
      <div className="border-l-4 border-orange-500 pl-5">
        <p className="text-sm text-stone-500">课程总评分</p>
        <p className="mt-2 text-4xl font-bold text-stone-900">{formatRating(course.averageRating)}</p>
        <div className="mt-3"><Stars rating={course.averageRating} /></div>
        <p className="mt-3 text-sm text-stone-500">{course.reviewCount} 条评论</p>
      </div>
      <div className="mt-5 space-y-3">
        {course.ratingDistribution.map((item) => {
          const percentage = course.reviewCount > 0 ? Math.round((item.count / course.reviewCount) * 100) : 0;
          return (
            <div key={item.stars} className="space-y-1">
              <div className="flex items-center justify-between text-sm text-stone-600">
                <span>{item.stars} 星</span>
                <span>{item.count} 条 · {percentage}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-stone-100">
                <div className="h-full rounded-full bg-orange-500 transition-all" style={{ width: `${percentage}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      {showWriteLink ? (
        <Button href={`/write-review/${course.id}`} className="mt-5">写一条评论</Button>
      ) : null}
    </PageSection>
  );
}

function GuideCard() {
  return (
    <PageSection variant="muted">
      <h2 className="text-lg font-bold text-stone-900">如何看老师页</h2>
      <ul className="mt-4 space-y-3 text-sm leading-7 text-stone-600">
        <li>优先看“评论总数”而不是只看均分，样本越多越稳定。</li>
        <li>如果同一老师不同课程分差很大，建议点进具体课程页看评论细节。</li>
        <li>部分课程的院系字段在原始数据中缺失，页面会显示“院系暂缺”。</li>
      </ul>
    </PageSection>
  );
}
function CardSection({ id, eyebrow, title, description, children, gridClassName = "lg:grid-cols-2" }: {
  id?: string;
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  gridClassName?: string;
}) {
  return (
    <section id={id} className="mx-auto mt-14 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      <SectionTitle eyebrow={eyebrow} title={title} description={description} />
      <div className={`mt-6 grid gap-5 ${gridClassName}`}>{children}</div>
    </section>
  );
}

function Pill({ children }: { children: ReactNode }) {
  return <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600">{children}</span>;
}

function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col items-center justify-center px-4 text-center">
      <h1 className="text-4xl font-bold text-stone-900">页面没找到</h1>
      <p className="mt-4 text-sm text-stone-600">可能是课程或老师不存在，也可能是链接写错了。</p>
      <Button href="/search" variant="secondary" className="mt-8">回到搜索</Button>
    </div>
  );
}
