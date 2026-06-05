drop policy if exists "reviews are readable" on public.course_reviews;
create policy "reviews are readable"
on public.course_reviews
for select
using (
  publish_status = 'published'
  or user_id = auth.uid()
  or lower(auth.jwt() ->> 'email') = 'tjpush_admin@mikezhuang.cn'
);

drop policy if exists "tongji users can insert reviews" on public.course_reviews;
create policy "tongji users can insert reviews"
on public.course_reviews
for insert
to authenticated
with check (
  (
    lower(auth.jwt() ->> 'email') like '%@tongji.edu.cn'
    or lower(auth.jwt() ->> 'email') = 'tjpush_admin@mikezhuang.cn'
  )
  and user_id = auth.uid()
  and source = 'user'
  and publish_status = 'published'
  and id is not null
);

drop policy if exists "admin can update reviews" on public.course_reviews;
create policy "admin can update reviews"
on public.course_reviews
for update
to authenticated
using (lower(auth.jwt() ->> 'email') = 'tjpush_admin@mikezhuang.cn')
with check (lower(auth.jwt() ->> 'email') = 'tjpush_admin@mikezhuang.cn');

drop policy if exists "reporters can insert reports" on public.review_reports;
create policy "reporters can insert reports"
on public.review_reports
for insert
with check (
  reporter_id is null
  or reporter_id = auth.uid()
);

drop policy if exists "admin can read reports" on public.review_reports;
create policy "admin can read reports"
on public.review_reports
for select
to authenticated
using (lower(auth.jwt() ->> 'email') = 'tjpush_admin@mikezhuang.cn');
