-- Profiles table (personal/company info)
create table if not exists profiles (
  user_id uuid primary key,
  full_name text,
  company text,
  website text,
  timezone text,
  locale text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enrichment providers credentials
create table if not exists enrichment_credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  provider text not null,  -- 'apollo' | 'lusha' | 'others'
  api_key text,
  account_id text,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists enrichment_credentials_user_idx
  on enrichment_credentials(user_id);
