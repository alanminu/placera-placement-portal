-- Checks that the security rules in schema.sql really hold.
-- Run on a throwaway local database (never on your live project):
--   psql -d placera_test -f supabase/tests/local_auth_stub.sql
--   psql -d placera_test -f supabase/schema.sql
--   psql -d placera_test -v ON_ERROR_STOP=1 -f supabase/tests/rls_test.sql
-- It prints "ALL RLS TESTS PASSED" at the end, or stops at the first failure.

-- Two accounts. The trigger should create a profile for each.
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'asha@test.dev',  '{"username":"Asha","full_name":"Asha"}'),
  ('00000000-0000-0000-0000-00000000000b', 'bilal@test.dev', '{"username":"bilal","full_name":"Bilal"}');

do $$ begin
  assert (select count(*) from public.profiles) = 2, 'trigger should create profiles';
  assert exists (select 1 from public.profiles where username = 'asha'), 'username is lowercased';
end $$;

-- helper: act as a signed-in user, or as a visitor who is not signed in
create function pg_temp.act_as(uid text) returns void language plpgsql as $$
begin
  if uid is null then
    perform set_config('request.jwt.claims', '', false);
    set role anon;
  else
    perform set_config('request.jwt.claims', json_build_object('sub', uid)::text, false);
    set role authenticated;
  end if;
end $$;

-- helper: the statement must be rejected by the database
create function pg_temp.must_fail(sql text, label text) returns void language plpgsql as $$
begin
  begin
    execute sql;
  exception when others then
    return;
  end;
  raise exception 'SHOULD HAVE FAILED: %', label;
end $$;

-- ---- Asha adds her data ----------------------------------------------------
select pg_temp.act_as('00000000-0000-0000-0000-00000000000a');
insert into public.subjects (name) values ('DBMS');
insert into public.topics (subject_id, name)
  select id, 'Normalization' from public.subjects;
insert into public.interviews (company) values ('PayPal');
insert into public.activity_log (kind, day) values ('topic_completed', current_date);
insert into public.study_plans (title, start_on, target_date)
  values ('PayPal prep', current_date, current_date + 7);
insert into public.plan_tasks (plan_id, topic_id, due_on)
  select p.id, t.id, current_date from public.study_plans p, public.topics t;
insert into public.experiences (company, questions, is_anonymous)
  values ('PayPal', 'Two sum, then LRU cache', true);
insert into public.experiences (company, questions, is_anonymous)
  values ('Zoho', 'SQL joins', false);

do $$ begin
  assert (select count(*) from public.subjects) = 1, 'asha sees her subject';
  assert (select user_id from public.subjects) = '00000000-0000-0000-0000-00000000000a',
    'user_id defaults to the signed-in user';
end $$;

-- ---- Bilal must not see or touch any of it ---------------------------------
reset role;
select pg_temp.act_as('00000000-0000-0000-0000-00000000000b');

do $$
declare n int;
begin
  assert (select count(*) from public.subjects) = 0,     'bilal cannot read subjects';
  assert (select count(*) from public.topics) = 0,       'bilal cannot read topics';
  assert (select count(*) from public.interviews) = 0,   'bilal cannot read interviews';
  assert (select count(*) from public.activity_log) = 0, 'bilal cannot read activity';
  assert (select count(*) from public.study_plans) = 0,  'bilal cannot read plans';
  assert (select count(*) from public.plan_tasks) = 0,   'bilal cannot read plan tasks';
  assert (select count(*) from public.experiences) = 0,  'bilal cannot read the experiences table directly';
  assert (select count(*) from public.profiles) = 1,     'bilal sees only his own profile';

  update public.topics set completed = true;
  get diagnostics n = row_count;
  assert n = 0, 'bilal cannot update asha''s topics';

  delete from public.subjects;
  get diagnostics n = row_count;
  assert n = 0, 'bilal cannot delete asha''s subjects';

  delete from public.experiences;
  get diagnostics n = row_count;
  assert n = 0, 'bilal cannot delete asha''s posts';

  update public.profiles set full_name = 'hacked' where username = 'asha';
  get diagnostics n = row_count;
  assert n = 0, 'bilal cannot edit asha''s profile';
end $$;

-- writes that pretend to be Asha, or attach to her rows, are rejected
select pg_temp.must_fail(
  $q$insert into public.subjects (user_id, name) values ('00000000-0000-0000-0000-00000000000a', 'x')$q$,
  'insert a subject as another user');
select pg_temp.must_fail(
  $q$insert into public.topics (subject_id, name) select 1, 'sneaky'$q$,
  'add a topic to another user''s subject');
select pg_temp.must_fail(
  $q$insert into public.experiences (user_id, company, questions) values ('00000000-0000-0000-0000-00000000000a', 'x', 'y')$q$,
  'post to the wall as another user');
select pg_temp.must_fail(
  $q$update public.activity_log set day = current_date$q$,
  'edit the activity log');
select pg_temp.must_fail(
  $q$update public.profiles set id = '00000000-0000-0000-0000-00000000000a'$q$,
  'change a profile id');
select pg_temp.must_fail(
  $q$insert into public.interviews (company, status) values ('x', 'hired')$q$,
  'use an unknown interview status');

-- the wall: Bilal sees both posts, but the anonymous one has no author
do $$ begin
  assert (select count(*) from public.experience_feed()) = 2, 'feed shows all posts';
  assert (select author from public.experience_feed() where company = 'PayPal') is null,
    'anonymous post hides the author';
  assert (select author from public.experience_feed() where company = 'Zoho') = 'asha',
    'named post shows the username';
  assert (select bool_or(is_mine) from public.experience_feed()) = false,
    'none of the posts are bilal''s';
  assert public.username_available('ASHA') = false, 'taken username (any case)';
  assert public.username_available('newperson') = true, 'free username';
end $$;

-- ---- Visitors who are not signed in get nothing ----------------------------
reset role;
select pg_temp.act_as(null);
select pg_temp.must_fail('select * from public.subjects', 'anon reads subjects');
select pg_temp.must_fail('select * from public.profiles', 'anon reads profiles');
select pg_temp.must_fail('select * from public.experience_feed()', 'anon reads the wall');
do $$ begin
  assert public.username_available('asha') = false, 'anon can check usernames';
end $$;

-- ---- Deleting an account removes all of its data ---------------------------
reset role;
delete from auth.users where id = '00000000-0000-0000-0000-00000000000a';
do $$ begin
  assert (select count(*) from public.subjects) = 0
     and (select count(*) from public.topics) = 0
     and (select count(*) from public.plan_tasks) = 0
     and (select count(*) from public.experiences) = 0
     and (select count(*) from public.profiles) = 1, 'cascade delete';
end $$;

-- a second account cannot take an existing username
select pg_temp.must_fail(
  $q$insert into auth.users (email, raw_user_meta_data) values ('c@test.dev', '{"username":"bilal"}')$q$,
  'duplicate username');

select 'ALL RLS TESTS PASSED' as result;
