const SUPABASE_URL = 'https://bltzkqrjzuplukamvdvb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsdHprcXJqenVwbHVrYW12ZHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODU3NjY4NCwiZXhwIjoyMTA0MTUyNjg0fQ.LBEvwI1hUrDuWClz2dNInC9f0w7BA_ZyVsxm0oYkL0M';

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function onRequestGet(context) {
  const envKey = context.env?.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_SERVICE_ROLE_KEY;
  const envUrl = context.env?.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL;

  const edgeHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=30, s-maxage=120, stale-while-revalidate=600',
    'CDN-Cache-Control': 'max-age=120, stale-while-revalidate=600',
    'Cloudflare-CDN-Cache-Control': 'max-age=120, stale-while-revalidate=600'
  };

  try {
    const sbRes = await fetch(`${envUrl}/rest/v1/wishes?select=id,title,category,reason,honor_commitment,urgency,province_code,ward_code,status,created_at,authority&status=neq.archived&order=created_at.desc&limit=100`, {
      headers: {
        apikey: envKey,
        Authorization: `Bearer ${envKey}`
      }
    });

    if (!sbRes.ok) {
      return new Response(JSON.stringify({ success: false, data: [] }), {
        status: 200,
        headers: edgeHeaders
      });
    }

    const items = await sbRes.json();
    const isTestWish = (w) => {
      const title = (w.title || '').toLowerCase();
      return title.includes('thử nghiệm') || 
             title.includes('test wish') || 
             title.includes('kiểm thử') || 
             title.includes('kiểm tra gửi') || 
             w.id === '0160532f-7480-4e73-8c95-e3df6839a897' || 
             w.id === 'db4739ed-9ef1-4766-ba78-721a0648d679';
    };

    const cleanData = Array.isArray(items) ? items.filter(item => !isTestWish(item) && item.status !== 'archived' && !item.is_deleted) : [];

    return new Response(JSON.stringify({ success: true, data: cleanData }), {
      status: 200,
      headers: edgeHeaders
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, data: [], error: err.message }), {
      status: 200,
      headers: edgeHeaders
    });
  }
}
