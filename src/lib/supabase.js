import { createClient } from '@supabase/supabase-js';

// Publishable (anon) key is safe in the browser. Security comes from RLS policies in supabase/schema.sql.
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);
