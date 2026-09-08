const SUPABASE_URL = 'https://bltzkqrjzuplukamvdvb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsdHprcXJqenVwbHVrYW12ZHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODU3NjY4NCwiZXhwIjoyMTA0MTUyNjg0fQ.LBEvwI1hUrDuWClz2dNInC9f0w7BA_ZyVsxm0oYkL0M';

const DEFAULT_CATEGORIES = [
  { id: 'bicycle', label: 'Xe đạp đến trường', shortLabel: 'Xe đạp', iconName: 'Bike', desc: 'Phương tiện đi lại cho học sinh nghèo' },
  { id: 'laptop', label: 'Máy tính học tập', shortLabel: 'Máy tính', iconName: 'Laptop', desc: 'Laptop, PC cho học sinh - sinh viên' },
  { id: 'sewing_machine', label: 'Máy may sinh kế', shortLabel: 'Máy may', iconName: 'Scissors', desc: 'Dụng cụ may vá cho mẹ đơn thân' },
  { id: 'study_tools', label: 'Dụng cụ tri thức', shortLabel: 'Sách & Dụng cụ', iconName: 'BookOpen', desc: 'Sách vở, bàn học, máy tính cầm tay' },
  { id: 'livelihood_tools', label: 'Công cụ mưu sinh', shortLabel: 'Nghề mưu sinh', iconName: 'Wrench', desc: 'Đồ nghề sửa xe, làm mộc, làm nông' }
];

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function onRequestGet(context) {
  try {
    const envKey = context.env?.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_SERVICE_ROLE_KEY;
    const envUrl = context.env?.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL;

    // 1. Thử lấy từ bảng site_settings
    try {
      const sbRes = await fetch(`${envUrl}/rest/v1/site_settings?key=eq.site_categories&select=value`, {
        headers: { apikey: envKey, Authorization: `Bearer ${envKey}` }
      });
      if (sbRes.ok) {
        const rows = await sbRes.json();
        if (Array.isArray(rows) && rows.length > 0 && Array.isArray(rows[0].value) && rows[0].value.length > 0) {
          return new Response(JSON.stringify({ success: true, categories: rows[0].value }), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Cache-Control': 'public, max-age=60, s-maxage=300'
            }
          });
        }
      }
    } catch {}

    // 2. Thử lấy từ user_metadata của super admin
    try {
      const usersRes = await fetch(`${envUrl}/auth/v1/admin/users`, {
        headers: { apikey: envKey, Authorization: `Bearer ${envKey}` }
      });
      if (usersRes.ok) {
        const data = await usersRes.json();
        const admin = data.users?.find(u => u.email === 'nguyenkhiemnet@gmail.com');
        if (admin?.user_metadata?.site_categories && Array.isArray(admin.user_metadata.site_categories)) {
          return new Response(JSON.stringify({ success: true, categories: admin.user_metadata.site_categories }), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Cache-Control': 'public, max-age=60, s-maxage=300'
            }
          });
        }
      }
    } catch {}

    return new Response(JSON.stringify({ success: true, categories: DEFAULT_CATEGORIES }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=60, s-maxage=300'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: true, categories: DEFAULT_CATEGORIES }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=60, s-maxage=300'
      }
    });
  }
}

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const { categories } = body;

    if (!categories || !Array.isArray(categories)) {
      return new Response(JSON.stringify({ success: false, error: 'Danh mục không hợp lệ' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const envKey = context.env?.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_SERVICE_ROLE_KEY;
    const envUrl = context.env?.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL;

    // 1. Thử lưu vào bảng site_settings
    try {
      await fetch(`${envUrl}/rest/v1/site_settings`, {
        method: 'POST',
        headers: {
          apikey: envKey,
          Authorization: `Bearer ${envKey}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          key: 'site_categories',
          value: categories,
          updated_at: new Date().toISOString()
        })
      });
    } catch {}

    // 2. Lưu bền vững vào user_metadata của super admin
    try {
      const usersRes = await fetch(`${envUrl}/auth/v1/admin/users`, {
        headers: { apikey: envKey, Authorization: `Bearer ${envKey}` }
      });
      if (usersRes.ok) {
        const data = await usersRes.json();
        const admin = data.users?.find(u => u.email === 'nguyenkhiemnet@gmail.com');
        if (admin) {
          await fetch(`${envUrl}/auth/v1/admin/users/${admin.id}`, {
            method: 'PUT',
            headers: {
              apikey: envKey,
              Authorization: `Bearer ${envKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              user_metadata: { ...admin.user_metadata, site_categories: categories }
            })
          });
        }
      }
    } catch {}

    return new Response(JSON.stringify({ success: true, categories, message: 'Đồng bộ danh mục Cloudflare Pages thành công' }), {
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
