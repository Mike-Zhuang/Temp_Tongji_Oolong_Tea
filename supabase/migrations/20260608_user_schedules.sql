create table if not exists public.user_schedules (
  user_id uuid not null references auth.users(id) on delete cascade,
  term text not null,
  selected_course_ids text[] not null default '{}',
  updated_at timestamptz not null default now(),
  primary key (user_id, term)
);

alter table public.user_schedules enable row level security;

drop policy if exists "users can read own schedules" on public.user_schedules;
create policy "users can read own schedules"
on public.user_schedules
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "users can insert own schedules" on public.user_schedules;
create policy "users can insert own schedules"
on public.user_schedules
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "users can update own schedules" on public.user_schedules;
create policy "users can update own schedules"
on public.user_schedules
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
