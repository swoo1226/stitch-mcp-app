import { createBrowserClient } from "@supabase/ssr";

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);


export const DEFAULT_TEAM_ID = "0daa2ad2-cb5d-4d4e-a95f-00ca141f0062";
