-- Ensure RLS is active on every public table
alter table public.profiles enable row level security;
alter table public.folders enable row level security;
alter table public.notes enable row level security;

-- 1. Profiles Policies (1:1 with auth.users)
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 2. Folders Policies (owner_id = auth.uid())
drop policy if exists "folders_select_own" on public.folders;
create policy "folders_select_own"
  on public.folders
  for select
  to authenticated
  using (auth.uid() = owner_id);

drop policy if exists "folders_insert_own" on public.folders;
create policy "folders_insert_own"
  on public.folders
  for insert
  to authenticated
  with check (auth.uid() = owner_id);

drop policy if exists "folders_update_own" on public.folders;
create policy "folders_update_own"
  on public.folders
  for update
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "folders_delete_own" on public.folders;
create policy "folders_delete_own"
  on public.folders
  for delete
  to authenticated
  using (auth.uid() = owner_id);

-- 3. Notes Policies (owner_id = auth.uid())
drop policy if exists "notes_select_own" on public.notes;
create policy "notes_select_own"
  on public.notes
  for select
  to authenticated
  using (auth.uid() = owner_id);

drop policy if exists "notes_insert_own" on public.notes;
create policy "notes_insert_own"
  on public.notes
  for insert
  to authenticated
  with check (auth.uid() = owner_id);

drop policy if exists "notes_update_own" on public.notes;
create policy "notes_update_own"
  on public.notes
  for update
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "notes_delete_own" on public.notes;
create policy "notes_delete_own"
  on public.notes
  for delete
  to authenticated
  using (auth.uid() = owner_id);

-- 4. Restrict search_notes RPC execution to authenticated users
revoke execute on function public.search_notes(text, int, uuid) from anon;
grant execute on function public.search_notes(text, int, uuid) to authenticated;