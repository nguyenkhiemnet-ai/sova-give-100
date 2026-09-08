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
    const body = await request.json();
    const { action, wishId, data } = body;

    if (action === 'test') {
      return NextResponse.json({ success: true, message: 'Local API endpoint active 100%' });
    }

    if (!wishId) {
      return NextResponse.json({ success: false, error: 'Thiếu wishId' }, { status: 400 });
    }

    const supabaseAdmin = getAdminClient();

    if (action === 'delete') {
      const { error } = await supabaseAdmin
        .from('wishes')
        .delete()
        .eq('id', wishId);

      if (error) {
        console.error('Lỗi xóa wish qua admin API:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Đã xóa điều ước thành công' });
    }

    if (action === 'update') {
      const allowedKeys = ['title', 'category', 'reason', 'honor_commitment', 'urgency', 'province_code', 'ward_code', 'status', 'updated_at'];
      const sanitizedData: Record<string, any> = {
        updated_at: new Date().toISOString()
      };

      if (data && typeof data === 'object') {
        for (const key of allowedKeys) {
          if (typeof data[key] !== 'undefined') {
            sanitizedData[key] = data[key];
          }
        }
      }

      const { error } = await supabaseAdmin
        .from('wishes')
        .update(sanitizedData)
        .eq('id', wishId);

      if (error) {
        console.error('Lỗi cập nhật wish qua admin API:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Đã cập nhật điều ước thành công' });
    }

    return NextResponse.json({ success: false, error: 'Thao tác không hợp lệ' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Lỗi server' }, { status: 500 });
  }
}
