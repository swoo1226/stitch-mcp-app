create table if not exists public.access_requests (
  id uuid primary key default gen_random_uuid(),
  requester_role text not null check (requester_role in ('team_admin', 'member')),
  name text not null,
  email text not null,
  organization text not null,
  team_name text not null,
  message text not null,
  source_path text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists access_requests_created_at_idx
  on public.access_requests (created_at desc);

create index if not exists access_requests_requester_role_idx
  on public.access_requests (requester_role);
