-- Placera database schema (PostgreSQL / Supabase)
-- Run this whole file once in Supabase: SQL Editor -> New query -> paste -> Run.
--
-- How security works here:
--   * Every table has Row Level Security (RLS) switched on.
--   * Each row stores the id of the user who owns it (user_id).
--   * Policies only let a signed-in user touch rows where user_id is their own id,
--     which Supabase exposes inside the database as auth.uid().
--   So even though the browser talks to the database directly, one user can
--   never read or change another user's rows.

-- ---------------------------------------------------------------------------
-- 1. Profiles: one row per account, created automatically on sign up
-- ---------------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  username    text not null unique check (username ~ '^[a-z0-9_]{3,20}$'),
  full_name   text not null default '' check (char_length(full_name) <= 80),
  college     text not null default '' check (char_length(college) <= 120),
  created_at  timestamptz not null default now()
);

-- Copies the username and name typed on the sign-up form into profiles.
-- "security definer" lets it insert the row even though the new user is not
-- signed in yet at that moment.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, username, full_name, college)
  values (
    new.id,
    lower(new.raw_user_meta_data ->> 'username'),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'college', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Lets the sign-up form check a username before creating the account.
create function public.username_available(candidate text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not exists (
    select 1 from public.profiles where username = lower(candidate)
  );
$$;

-- ---------------------------------------------------------------------------
-- 2. Subjects and topics
-- ---------------------------------------------------------------------------
create table public.subjects (
  id          bigint generated always as identity primary key,
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 80),
  created_at  timestamptz not null default now()
);
create index subjects_user_idx on public.subjects (user_id);

create table public.topics (
  id               bigint generated always as identity primary key,
  user_id          uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subject_id       bigint not null references public.subjects (id) on delete cascade,
  name             text not null check (char_length(name) between 1 and 120),
  position         integer not null default 0,
  completed        boolean not null default false,
  completed_at     timestamptz,
  confidence       smallint check (confidence between 1 and 5),
  notes            text not null default '' check (char_length(notes) <= 5000),
  -- spaced repetition: which gap we are on, and the next day to revise
  revision_stage   smallint not null default 0,
  next_review_on   date,
  last_reviewed_on date,
  created_at       timestamptz not null default now()
);
create index topics_user_idx on public.topics (user_id);
create index topics_subject_idx on public.topics (subject_id);

-- ---------------------------------------------------------------------------
-- 3. Interviews (the pipeline board)
-- ---------------------------------------------------------------------------
create table public.interviews (
  id              bigint generated always as identity primary key,
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  company         text not null check (char_length(company) between 1 and 80),
  role            text not null default 'Software Engineer' check (char_length(role) <= 80),
  interview_date  date,
  status          text not null default 'applied'
                  check (status in ('applied', 'oa', 'interview', 'offer', 'rejected')),
  notes           text not null default '' check (char_length(notes) <= 5000),
  created_at      timestamptz not null default now()
);
create index interviews_user_idx on public.interviews (user_id);

-- ---------------------------------------------------------------------------
-- 4. Activity log: one row per study action, used for streaks and the heatmap
-- ---------------------------------------------------------------------------
create table public.activity_log (
  id          bigint generated always as identity primary key,
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind        text not null
              check (kind in ('topic_completed', 'revision', 'interview_added', 'experience_posted')),
  day         date not null,  -- the user's local calendar day
  created_at  timestamptz not null default now()
);
create index activity_user_day_idx on public.activity_log (user_id, day);

-- ---------------------------------------------------------------------------
-- 5. Study plans: a plan has many tasks, each task is "do this topic on this day"
-- ---------------------------------------------------------------------------
create table public.study_plans (
  id           bigint generated always as identity primary key,
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title        text not null check (char_length(title) between 1 and 80),
  start_on     date not null,
  target_date  date not null,
  created_at   timestamptz not null default now(),
  check (target_date >= start_on)
);
create index study_plans_user_idx on public.study_plans (user_id);

create table public.plan_tasks (
  id        bigint generated always as identity primary key,
  user_id   uuid not null default auth.uid() references auth.users (id) on delete cascade,
  plan_id   bigint not null references public.study_plans (id) on delete cascade,
  topic_id  bigint not null references public.topics (id) on delete cascade,
  due_on    date not null
);
create index plan_tasks_plan_idx on public.plan_tasks (plan_id);
create index plan_tasks_user_idx on public.plan_tasks (user_id);

-- ---------------------------------------------------------------------------
-- 6. Interview experience wall (shared between all users)
-- ---------------------------------------------------------------------------
create table public.experiences (
  id            bigint generated always as identity primary key,
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  company       text not null check (char_length(company) between 1 and 80),
  role          text not null default '' check (char_length(role) <= 80),
  round         text not null default '' check (char_length(round) <= 60),
  difficulty    text not null default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  outcome       text not null default 'waiting' check (outcome in ('selected', 'rejected', 'waiting')),
  questions     text not null check (char_length(questions) between 1 and 6000),
  tips          text not null default '' check (char_length(tips) <= 3000),
  is_anonymous  boolean not null default false,
  created_at    timestamptz not null default now()
);
create index experiences_user_idx on public.experiences (user_id);
create index experiences_created_idx on public.experiences (created_at desc);

-- The wall is read through this function, never straight from the table.
-- It returns every post but leaves out user_id, and returns the author's
-- username only when the post is not anonymous. That is what keeps anonymous
-- posts anonymous: the author's identity never leaves the database.
create function public.experience_feed()
returns table (
  id          bigint,
  company     text,
  role        text,
  round       text,
  difficulty  text,
  outcome     text,
  questions   text,
  tips        text,
  created_at  timestamptz,
  author      text,
  is_mine     boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    e.id, e.company, e.role, e.round, e.difficulty, e.outcome,
    e.questions, e.tips, e.created_at,
    case when e.is_anonymous then null else p.username end as author,
    e.user_id = (select auth.uid()) as is_mine
  from public.experiences e
  join public.profiles p on p.id = e.user_id
  where (select auth.uid()) is not null
  order by e.created_at desc;
$$;

-- ---------------------------------------------------------------------------
-- 7. Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles     enable row level security;
alter table public.subjects     enable row level security;
alter table public.topics       enable row level security;
alter table public.interviews   enable row level security;
alter table public.activity_log enable row level security;
alter table public.study_plans  enable row level security;
alter table public.plan_tasks   enable row level security;
alter table public.experiences  enable row level security;

-- profiles: read and edit your own row. Rows are created by the trigger above.
create policy "read own profile" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "update own profile" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- subjects: full access to your own rows only
create policy "own subjects" on public.subjects
  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- topics: your own rows, and only inside a subject that is also yours
create policy "own topics" on public.topics
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.subjects s
      where s.id = subject_id and s.user_id = (select auth.uid())
    )
  );

create policy "own interviews" on public.interviews
  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- activity log: you can add to it and read it, but not edit history
create policy "read own activity" on public.activity_log
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "add own activity" on public.activity_log
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "own plans" on public.study_plans
  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- plan tasks: must point at a plan and a topic that are both yours
create policy "own plan tasks" on public.plan_tasks
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.study_plans p
      where p.id = plan_id and p.user_id = (select auth.uid())
    )
    and exists (
      select 1 from public.topics t
      where t.id = topic_id and t.user_id = (select auth.uid())
    )
  );

-- experiences: the table itself only shows you your own posts.
-- Everyone else's posts come through experience_feed().
create policy "own experiences" on public.experiences
  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- 8. Grants: what each role may attempt at all (RLS then filters the rows)
--    anon = not signed in, authenticated = signed in
-- ---------------------------------------------------------------------------
revoke all on all tables in schema public from anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;

grant select, update (username, full_name, college) on public.profiles to authenticated;
grant select, insert, update, delete on public.subjects    to authenticated;
grant select, insert, update, delete on public.topics      to authenticated;
grant select, insert, update, delete on public.interviews  to authenticated;
grant select, insert                 on public.activity_log to authenticated;
grant select, insert, update, delete on public.study_plans to authenticated;
grant select, insert, update, delete on public.plan_tasks  to authenticated;
grant select, insert, update, delete on public.experiences to authenticated;

grant execute on function public.username_available(text) to anon, authenticated;
grant execute on function public.experience_feed()         to authenticated;
