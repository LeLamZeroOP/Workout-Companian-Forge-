-- DRAFT ONLY: not applied or verified against a live Supabase project.
-- When CLI access is approved, create a CLI-named migration and copy this SQL into it.
create table public.user_documents (
  user_id uuid primary key references auth.users(id) on delete cascade,
  revision bigint not null default 0 check (revision >= 0),
  data jsonb not null check (
    jsonb_typeof(data) = 'object'
    and coalesce(data->>'version' in ('2', '3'), false)
    and octet_length(data::text) <= 10485760
  ),
  recent_mutation_ids text[] not null default '{}' check (coalesce(array_length(recent_mutation_ids, 1), 0) <= 100),
  updated_at timestamptz not null default now()
);

alter table public.user_documents enable row level security;

create policy user_documents_select on public.user_documents
  for select to authenticated using ((select auth.uid()) = user_id);

create policy user_documents_insert on public.user_documents
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy user_documents_update on public.user_documents
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

revoke all on public.user_documents from anon;
grant select, insert, update on public.user_documents to authenticated;
