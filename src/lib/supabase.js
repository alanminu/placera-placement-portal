import { createClient } from '@supabase/supabase-js';

// Both values are safe to ship to the browser: Row Level Security in the
// database decides what each signed-in user can read or change.
const url = import.meta.env.VITE_SUPABASE_URL;
const key =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isConfigured = Boolean(url && key);
export const supabase = isConfigured ? createClient(url, key) : null;
