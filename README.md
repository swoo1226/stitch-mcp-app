# Stitch-MCP Web App

This is a premium Next.js application integrated with the **Model Context Protocol (MCP)**, designed for the **Google Stitch** ecosystem.

## Features
- **Premium UI**: Glassmorphism, gradients, and modern typography.
- **MCP Server**: Integrated server exposing application context and theme tokens.
- **Stitch-Ready**: Optimized for the AI-native design workflow.

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Web App
```bash
npm run dev
```
The app will be available at [http://localhost:3000](http://localhost:3000).

### Database Migration
If you are using Supabase, apply the SQL files in `supabase/migrations/` before testing new data features.
The Jira groundwork migration adds `users.email` and Jira profile columns such as `jira_account_id`.

### Jira User Backfill
After applying the Jira migration, you can backfill existing team members with Jira profile data:

```bash
npm run jira:backfill-users -- --dry-run
```

Persisting the result requires `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`.
Without it, the script only supports `--dry-run`.

For the current seeded team members, a manual SQL backfill is also available in `supabase/manual_backfill_jira_users.sql`.

### Jira Ticket Snapshots
For team-member open ticket summaries, apply the snapshot migration in `supabase/migrations/202604022240_add_jira_ticket_snapshots.sql`.
If `SUPABASE_SERVICE_ROLE_KEY` is configured, the admin Jira API stores a 10-minute snapshot in Supabase and reuses it on subsequent requests.
In environments with a corporate TLS proxy, set `JIRA_INSECURE_TLS=1` in `.env.local` so the Jira server fetch can bypass certificate-chain validation.

### Teams Alerts And Cron
- `TEAMS_WEBHOOK_URL`: Teams workflow webhook for combined risk alerts
- `TEAMS_INSECURE_TLS=1`: optional, only if the local environment requires TLS bypass
- `CRON_SECRET`: optional bearer token for Vercel cron calls
- `KR_HOLIDAYS`: optional comma-separated `YYYY-MM-DD` additions or overrides for Korean holidays

The Vercel cron runs on weekdays in the production deployment only, and the server route skips weekends and Korean public holidays before sending.

### 3. Connect to Stitch (MCP)
To use this app's context in Stitch, add the following MCP server configuration:

**Command:**
```bash
node scripts/mcp-server.js
```

**Transport:** `stdio`

## Available Tools
- `get_app_info`: Returns general information about the application.
- `get_theme_tokens`: Returns the CSS theme tokens (colors, fonts, etc.) for design consistency.
