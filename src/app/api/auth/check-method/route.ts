import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bltzkqrjzuplukamvdvb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsdHprcXJqenVwbHVrYW12ZHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODU3NjY4NCwiZXhwIjoyMTA0MTUyNjg0fQ.LBEvwI1hUrDuWClz2dNInC9f0w7BA_ZyVsxm0oYkL0M';

function getAdminClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email || !email.trim()) {
      return NextResponse.json({ success: false, error: 'Thiếu email' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const supabaseAdmin = getAdminClient();
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const user = data.users.find(u => (u.email || '').toLowerCase() === cleanEmail);
    if (!user) {
      return NextResponse.json({ success: true, exists: false, isGoogleUser: false });
    }

    const providers = user.app_metadata?.providers || [user.app_metadata?.provider];
    const isGoogle = Array.isArray(providers) 
      ? providers.includes('google')
      : user.app_metadata?.provider === 'google';

    const hasPassword = Boolean((user as any).encrypted_password);

    return NextResponse.json({
      success: true,
      exists: true,
      isGoogleUser: isGoogle || !hasPassword,
      hasPassword
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Lỗi kiểm tra phương thức' }, { status: 500 });
  }
}
