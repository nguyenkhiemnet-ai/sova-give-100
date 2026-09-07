import { createClient } from '@supabase/supabase-js';

// Khóa cứng trực tiếp URL và Key thực tế để triệt tiêu 100% nguy cơ bị biến môi trường đệm ghi đè
export const SUPABASE_URL = 'https://bltzkqrjzuplukamvdvb.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsdHprcXJqenVwbHVrYW12ZHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1NzY2ODQsImV4cCI6MjEwNDE1MjY4NH0.8Pn6lIHxNZvasNiO87Ze9nHc1JHfB7LeC5XWs2jxuKQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
