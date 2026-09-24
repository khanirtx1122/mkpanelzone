import { createClient } from '@supabase/supabase-js';

/**
 * These are the *publishable* project URL and anon key. They are designed to
 * live in the browser bundle — access is governed by storage bucket policies,
 * not by secrecy. The service-role key is never referenced here (spec §51/§64).
 */
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uvqsbebblbgjpktdoplk.supabase.co';
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_o_5bhxpFRLbFgA6bhaXB0g_JKAnKTNp';

// Create a single supabase client for interacting with your database
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

