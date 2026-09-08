const SUPABASE_URL = 'https://bltzkqrjzuplukamvdvb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsdHprcXJqenVwbHVrYW12ZHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODU3NjY4NCwiZXhwIjoyMTA0MTUyNjg0fQ.LBEvwI1hUrDuWClz2dNInC9f0w7BA_ZyVsxm0oYkL0M';

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const email = (body.email || '').trim().toLowerCase();
    
    if (!email) {
      return new Response(JSON.stringify({ success: false, error: 'Thiếu email' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const envKey = context.env?.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_SERVICE_ROLE_KEY;
    const envUrl = context.env?.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL;

    const res = await fetch(`${envUrl}/auth/v1/admin/users`, {
      headers: {
        apikey: envKey,
        Authorization: `Bearer ${envKey}`
      }
    });

    if (!res.ok) {
      const err = await res.text();
      return new Response(JSON.stringify({ success: false, error: err }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const data = await res.json();
    const user = data.users?.find(u => (u.email || '').toLowerCase() === email);

    if (!user) {
      return new Response(JSON.stringify({ success: true, exists: false, isGoogleUser: false }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const providers = user.app_metadata?.providers || [user.app_metadata?.provider];
    const isGoogle = Array.isArray(providers) 
      ? providers.includes('google')
      : user.app_metadata?.provider === 'google';
    const hasPassword = Boolean(user.encrypted_password);

    return new Response(JSON.stringify({
      success: true,
      exists: true,
      isGoogleUser: isGoogle || !hasPassword,
      hasPassword
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}
