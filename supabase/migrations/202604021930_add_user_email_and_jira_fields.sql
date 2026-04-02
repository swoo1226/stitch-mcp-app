alter table public.users
  add column if not exists email text,
  add column if not exists jira_account_id text,
  add column if not exists jira_display_name text,
  add column if not exists jira_avatar_url text,
  add column if not exists jira_connected_at timestamptz;

create unique index if not exists users_email_key
  on public.users (lower(email))
  where email is not null;

create unique index if not exists users_jira_account_id_key
  on public.users (jira_account_id)
  where jira_account_id is not null;
