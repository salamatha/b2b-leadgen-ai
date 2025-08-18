create extension if not exists pgcrypto;

-- Users
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  name text,
  created_at timestamptz default now()
);

-- LinkedIn sessions (Playwright storageState)
create table if not exists linkedin_sessions (
  user_id uuid primary key references users(id) on delete cascade,
  storage_state jsonb not null,
  updated_at timestamptz default now()
);

-- Leads (scraped results)
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  source_type text check (source_type in ('people','jobs','companies','posts','unknown')) default 'unknown',
  name text,
  title text,
  company text,
  location text,
  linkedin_url text,
  email text,
  phone text,
  created_at timestamptz default now()
);
