import { createClient } from "@supabase/supabase-js";

// These come from Vercel's Environment Variables (VITE_-prefixed vars are safe
// to expose to the browser — this is the public "anon" key, not a secret).
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
