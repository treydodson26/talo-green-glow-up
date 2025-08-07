-- Create a private storage bucket for CSV imports
insert into storage.buckets (id, name, public)
values ('imports', 'imports', false)
on conflict (id) do nothing;

-- RLS policies for the imports bucket
create policy "Authenticated can read imports"
  on storage.objects for select to authenticated
  using (bucket_id = 'imports');

create policy "Authenticated can upload to imports"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'imports');

create policy "Authenticated can update imports"
  on storage.objects for update to authenticated
  using (bucket_id = 'imports');

create policy "Authenticated can delete imports"
  on storage.objects for delete to authenticated
  using (bucket_id = 'imports');