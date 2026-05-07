import { createClient } from '@supabase/supabase-js';

export const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: false,
    },
  }
);

// supabaseAdmin uses the service role key which bypasses Row Level Security (RLS).
// Required for server-side operations like webhook handlers where there is no
// authenticated user session. NEVER expose this client or key to the browser.
//
// If queries are silently failing with auth errors, the most likely cause is that
// SUPABASE_SERVICE_ROLE_KEY is missing from your deployment environment variables.
// Add it in: Vercel → Project → Settings → Environment Variables
// Get the value from: Supabase Dashboard → Project Settings → API → service_role key
// supabaseAdmin uses the service role key which bypasses Row Level Security (RLS).
// Required for server-side operations like webhook handlers where there is no
// authenticated user session. NEVER expose this client or key to the browser.
//
// The explicit Authorization header in global.headers ensures Supabase always
// identifies the JWT role as service_role, even if the client was cached or
// initialized before the env var was available.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        // Explicitly bypass RLS by setting the service_role JWT on every request
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    },
  }
);