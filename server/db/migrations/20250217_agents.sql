-- Create agents table
create table if not exists agents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  type text not null,
  query text not null,
  created_at timestamp default now()
);
