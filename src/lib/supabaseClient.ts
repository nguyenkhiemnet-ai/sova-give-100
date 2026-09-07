import { createClient } from '@supabase/supabase-js';

// Khai báo trực tiếp URL và Anon Key thực tế để Cloudflare Pages build luôn chính xác 100%
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bltzkqrjzuplukamvdvb.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsdHprcXJqenVwbHVrYW12ZHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1NzY2ODQsImV4cCI6MjEwNDE1MjY4NH0.8Pn6lIHxNZvasNiO87Ze9nHc1JHfB7LeC5XWs2jxuKQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
