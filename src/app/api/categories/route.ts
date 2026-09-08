import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bltzkqrjzuplukamvdvb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsdHprcXJqenVwbHVrYW12ZHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODU3NjY4NCwiZXhwIjoyMTA0MTUyNjg0fQ.LBEvwI1hUrDuWClz2dNInC9f0w7BA_ZyVsxm0oYkL0M';

function getAdminClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

const DEFAULT_CATEGORIES = [
  { id: 'bicycle', label: 'Xe đạp đến trường', shortLabel: 'Xe đạp', iconName: 'Bike', desc: 'Phương tiện đi lại cho học sinh nghèo' },
  { id: 'laptop', label: 'Máy tính học tập', shortLabel: 'Máy tính', iconName: 'Laptop', desc: 'Laptop, PC cho học sinh - sinh viên' },
  { id: 'sewing_machine', label: 'Máy may sinh kế', shortLabel: 'Máy may', iconName: 'Scissors', desc: 'Dụng cụ may vá cho mẹ đơn thân' },
  { id: 'study_tools', label: 'Dụng cụ tri thức', shortLabel: 'Sách & Dụng cụ', iconName: 'BookOpen', desc: 'Sách vở, bàn học, máy tính cầm tay' },
  { id: 'livelihood_tools', label: 'Công cụ mưu sinh', shortLabel: 'Nghề mưu sinh', iconName: 'Wrench', desc: 'Đồ nghề sửa xe, làm mộc, làm nông' }
];

export async function GET() {
  try {
    const supabaseAdmin = getAdminClient();

    const cacheHeaders = {
      'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400',
      'CDN-Cache-Control': 'max-age=300, stale-while-revalidate=86400',
      'Cloudflare-CDN-Cache-Control': 'max-age=300, stale-while-revalidate=86400'
    };

    // 1. Thử lấy từ bảng site_settings
    try {
      const { data, error } = await supabaseAdmin
        .from('site_settings')
        .select('value')
        .eq('key', 'site_categories')
        .maybeSingle();

      if (!error && data && Array.isArray(data.value) && data.value.length > 0) {
        return NextResponse.json({ success: true, categories: data.value }, { headers: cacheHeaders });
      }
    } catch {}

    // 2. Thử lấy từ user_metadata của super admin
    try {
      const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
      const admin = usersData?.users?.find(u => u.email === 'nguyenkhiemnet@gmail.com');
      if (admin?.user_metadata?.site_categories && Array.isArray(admin.user_metadata.site_categories)) {
        return NextResponse.json({ success: true, categories: admin.user_metadata.site_categories }, { headers: cacheHeaders });
      }
    } catch {}

    return NextResponse.json({ success: true, categories: DEFAULT_CATEGORIES }, { headers: cacheHeaders });
  } catch (err: any) {
    return NextResponse.json({ success: true, categories: DEFAULT_CATEGORIES }, {
      headers: { 'Cache-Control': 'public, max-age=60, s-maxage=300' }
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { categories } = body;

    if (!categories || !Array.isArray(categories)) {
      return NextResponse.json({ success: false, error: 'Danh mục không hợp lệ' }, { status: 400 });
    }

    const supabaseAdmin = getAdminClient();

    // 1. Lưu vào bảng site_settings nếu có
    try {
      await supabaseAdmin.from('site_settings').upsert({
        key: 'site_categories',
        value: categories,
        updated_at: new Date().toISOString()
      });
    } catch {}

    // 2. Lưu bền vững vào user_metadata của super admin
    try {
      const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
      const admin = usersData?.users?.find(u => u.email === 'nguyenkhiemnet@gmail.com');
      if (admin) {
        await supabaseAdmin.auth.admin.updateUserById(admin.id, {
          user_metadata: { ...admin.user_metadata, site_categories: categories }
        });
      }
    } catch {}

    return NextResponse.json({ success: true, categories, message: 'Đồng bộ danh mục lên Cloud thành công' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Lỗi lưu danh mục' }, { status: 500 });
  }
}
