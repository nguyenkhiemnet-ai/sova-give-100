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
    const { action, wishId, data } = body;

    const envKey = context.env?.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_SERVICE_ROLE_KEY;
    const envUrl = context.env?.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL;

    if (action === 'test') {
      return new Response(JSON.stringify({ success: true, message: 'Cloudflare Pages API endpoint active 100%' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    if (!wishId) {
      return new Response(JSON.stringify({ success: false, error: 'Thiếu wishId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    if (action === 'delete') {
      const res = await fetch(`${envUrl}/rest/v1/wishes?id=eq.${wishId}`, {
        method: 'DELETE',
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

      return new Response(JSON.stringify({ success: true, message: 'Đã xóa điều ước thành công' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    if (action === 'update') {
      const allowedKeys = ['title', 'category', 'reason', 'honor_commitment', 'urgency', 'province_code', 'ward_code', 'status'];
      const sanitizedData = {
        updated_at: new Date().toISOString()
      };

      if (data && typeof data === 'object') {
        for (const key of allowedKeys) {
          if (typeof data[key] !== 'undefined') {
            sanitizedData[key] = data[key];
          }
        }
      }

      const res = await fetch(`${envUrl}/rest/v1/wishes?id=eq.${wishId}`, {
        method: 'PATCH',
        headers: {
          apikey: envKey,
          Authorization: `Bearer ${envKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(sanitizedData)
      });

      if (!res.ok) {
        const err = await res.text();
        return new Response(JSON.stringify({ success: false, error: err }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      return new Response(JSON.stringify({ success: true, message: 'Đã cập nhật điều ước thành công' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    return new Response(JSON.stringify({ success: false, error: 'Thao tác không hợp lệ' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}
