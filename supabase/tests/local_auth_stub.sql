-- Only for testing schema.sql on a plain local PostgreSQL.
-- A real Supabase project already has all of this, so never run it there.
create role anon nologin;
create role authenticated nologin;
create schema auth;
create table auth.users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  encrypted_password text,
  raw_user_meta_data jsonb not null default '{}'
);
create function auth.uid() returns uuid language sql stable as $$
  select (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')::uuid
$$ ;
alter function auth.uid() set search_path = '';
grant usage on schema auth to anon, authenticated;
grant usage on schema public to anon, authenticated;
