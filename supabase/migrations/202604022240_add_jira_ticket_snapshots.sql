create table if not exists public.jira_member_ticket_snapshots (
  user_id uuid primary key references public.users(id) on delete cascade,
  team_id uuid references public.teams(id) on delete cascade,
  open_ticket_count integer not null default 0,
  tickets jsonb not null default '[]'::jsonb,
  synced_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists jira_member_ticket_snapshots_team_id_idx
  on public.jira_member_ticket_snapshots (team_id);

create index if not exists jira_member_ticket_snapshots_expires_at_idx
  on public.jira_member_ticket_snapshots (expires_at);

