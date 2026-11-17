-- Applied to production on 2026-09-27 before deploying the schema-3 client.
-- See docs/releases/2026-09-27.md for verification evidence.
-- This targets the constraint created by docs/cloud-schema.sql. If the deployed
-- name differs, inspect it first; do not remove unrelated checks or RLS policies.
begin;
alter table public.user_documents drop constraint user_documents_data_check;
alter table public.user_documents add constraint user_documents_data_check check (
  jsonb_typeof(data) = 'object'
  and coalesce(data->>'version' in ('2', '3'), false)
  and octet_length(data::text) <= 10485760
);
commit;
