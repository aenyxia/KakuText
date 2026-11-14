-- Extensions
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- 1. Profiles (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (display_name is null or char_length(btrim(display_name)) between 1 and 50),
  theme text not null default 'light' check (theme in ('light', 'dark')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Folders (unique case-insensitive name per user)
create table if not exists public.folders (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 50),
  color text check (color is null or color ~ '^#[0-9a-fA-F]{6}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists folders_owner_name_uq
  on public.folders (owner_id, lower(name));

-- 3. Notes (<= 1 MB JSONB, <= 200,000 plain-text chars, weighted tsvector)
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  folder_id uuid references public.folders(id) on delete set null,
  title text not null default '' check (char_length(title) <= 200),
  content_json jsonb not null default '{"type":"doc","content":[]}'::jsonb
    check (
      jsonb_typeof(content_json) = 'object'
      and content_json->>'type' = 'doc'
      and octet_length(content_json::text) <= 1048576
    ),
  content_text text not null default '' check (char_length(content_text) <= 200000),
  pinned boolean not null default false,
  favorited boolean not null default false,
  search_tsv tsvector generated always as (
    setweight(to_tsvector('simple', title), 'A') ||
    setweight(to_tsvector('simple', content_text), 'B')
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- 4. Performance & Full-Text Search Indexes
create index if not exists notes_list_idx
  on public.notes (owner_id, pinned desc, updated_at desc)
  where deleted_at is null;

create index if not exists notes_folder_idx
  on public.notes (owner_id, folder_id)
  where deleted_at is null;

create index if not exists notes_fav_idx
  on public.notes (owner_id, updated_at desc)
  where favorited and deleted_at is null;

create index if not exists notes_search_idx
  on public.notes using gin (search_tsv);

create index if not exists notes_title_trgm_idx
  on public.notes using gin (title gin_trgm_ops);

-- 5. Automatic updated_at Trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated on public.profiles;
create trigger profiles_updated
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists folders_updated on public.folders;
create trigger folders_updated
  before update on public.folders
  for each row execute function public.set_updated_at();

drop trigger if exists notes_updated on public.notes;
create trigger notes_updated
  before update on public.notes
  for each row execute function public.set_updated_at();

-- 6. Auto-Create Profile on User Registration
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, nullif(left(split_part(coalesce(new.email, ''), '@', 1), 50), ''));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 7. Per-User Note Quota Guard (5,000 notes max)
create or replace function public.enforce_note_quota()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select count(*) from public.notes where owner_id = new.owner_id) >= 5000 then
    raise exception 'note_quota_exceeded' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists notes_quota on public.notes;
create trigger notes_quota
  before insert on public.notes
  for each row execute function public.enforce_note_quota();

-- 8. Full-Text Search RPC (SECURITY INVOKER enforces caller RLS)
create or replace function public.search_notes(
  q text,
  lim int default 20,
  folder uuid default null
)
returns table (
  id uuid,
  title text,
  snippet text,
  updated_at timestamptz,
  rank real
)
language sql
stable
security invoker
as $$
  select
    n.id,
    n.title,
    ts_headline('simple', n.content_text, query, 'MaxFragments=1,MaxWords=20,MinWords=8'),
    n.updated_at,
    ts_rank(n.search_tsv, query)
  from public.notes n, websearch_to_tsquery('simple', q) query
  where n.deleted_at is null
    and n.search_tsv @@ query
    and (folder is null or n.folder_id = folder)
  order by 5 desc, n.updated_at desc
  limit least(lim, 50);
$$;

-- 9. Enable Row-Level Security (Policies added in MOD-005)
alter table public.profiles enable row level security;
alter table public.folders enable row level security;
alter table public.notes enable row level security;