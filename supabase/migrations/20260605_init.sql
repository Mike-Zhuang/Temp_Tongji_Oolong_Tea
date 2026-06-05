create extension if not exists "pgcrypto";

create table if not exists public.teachers (
  slug text primary key,
  name text not null,
  department_hints text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.courses (
  id bigint primary key,
  code text not null,
  name text not null,
  teacher_name text not null,
  teacher_slug text not null references public.teachers(slug) on delete cascade,
  department text null,
  credit numeric not null default 0,
  categories text[] not null default '{}',
  seed_rating_count integer not null default 0,
  seed_rating_average numeric not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.course_reviews (
  id text primary key,
  source_id bigint null,
  course_id bigint not null references public.courses(id) on delete cascade,
  course_code text not null,
  course_name text not null,
  teacher_name text not null,
  teacher_slug text not null references public.teachers(slug) on delete cascade,
  semester text not null,
  rating integer not null check (rating between 1 and 5),
  comment text not null,
  created_at timestamptz not null default now(),
  modified_at timestamptz not null default now(),
  score text null,
  moderator_remark text null,
  approves integer not null default 0,
  disapproves integer not null default 0,
  publish_status text not null default 'published' check (publish_status in ('published', 'hidden')),
  source text not null default 'user' check (source in ('seed', 'user')),
  tags text[] not null default '{}',
  user_id uuid null references auth.users(id) on delete set null
);

create table if not exists public.review_reports (
  id uuid primary key default gen_random_uuid(),
  review_id text not null references public.course_reviews(id) on delete cascade,
  reporter_id uuid null references auth.users(id) on delete set null,
  reason text not null,
  created_at timestamptz not null default now()
);

alter table public.teachers enable row level security;
alter table public.courses enable row level security;
alter table public.course_reviews enable row level security;
alter table public.review_reports enable row level security;

drop policy if exists "teachers are readable" on public.teachers;
create policy "teachers are readable"
on public.teachers
for select
using (true);

drop policy if exists "courses are readable" on public.courses;
create policy "courses are readable"
on public.courses
for select
using (true);

drop policy if exists "reviews are readable" on public.course_reviews;
create policy "reviews are readable"
on public.course_reviews
for select
using (publish_status = 'published');

drop policy if exists "tongji users can insert reviews" on public.course_reviews;
create policy "tongji users can insert reviews"
on public.course_reviews
for insert
to authenticated
with check (
  auth.jwt() ->> 'email' like '%@tongji.edu.cn'
  and source = 'user'
  and publish_status = 'published'
);

drop policy if exists "reporters can insert reports" on public.review_reports;
create policy "reporters can insert reports"
on public.review_reports
for insert
to authenticated
with check (true);

create index if not exists courses_teacher_slug_idx on public.courses(teacher_slug);
create index if not exists courses_name_idx on public.courses(name);
create index if not exists course_reviews_course_id_idx on public.course_reviews(course_id);
create index if not exists course_reviews_teacher_slug_idx on public.course_reviews(teacher_slug);
create index if not exists course_reviews_created_at_idx on public.course_reviews(created_at desc);
create index if not exists review_reports_review_id_idx on public.review_reports(review_id);
