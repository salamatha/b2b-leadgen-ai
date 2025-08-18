
-- Run these in your Supabase SQL editor
create extension if not exists pgcrypto;

create table public.leads (
  id uuid default gen_random_uuid() primary key,
  user_id uuid,
  name text,
  title text,
  company text,
  domain text,
  email text,
  phone text,
  linkedin_url text,
  post_or_job_content text,
  company_details jsonb,
  source text,
  created_at timestamptz default now()
);

create table public.enrichment_jobs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid,
  agent_id uuid,
  lead_id uuid,
  search_url text,
  status text default 'pending',
  result jsonb,
  attempts int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.api_connections (
  id uuid default gen_random_uuid() primary key,
  user_id uuid,
  provider text,
  config jsonb,
  created_at timestamptz default now()
);

create table public.agents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid,
  name text,
  description text,
  type text,
  config jsonb,
  created_at timestamptz default now()
);
