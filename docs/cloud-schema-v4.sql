-- Prepare and inspect against the target database before publishing a schema-4 client.
-- Preserves the document size bound and the existing RLS policies.
begin;
alter table public.user_documents drop constraint user_documents_data_check;
alter table public.user_documents add constraint user_documents_data_check check (
  jsonb_typeof(data) = 'object'
  and coalesce(data->>'version' in ('2', '3', '4'), false)
  and octet_length(data::text) <= 10485760
);
commit;
