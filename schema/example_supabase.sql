-- Example table if you move sessions to a real DB (Supabase/Postgres)
create table if not exists linkedin_sessions (
  user_id text primary key,
  storage_state jsonb not null,
  updated_at timestamp with time zone default now()
);
