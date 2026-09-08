import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export const revalidate = 30; // ISR: 30 giây tái tạo 1 lần tại Cloudflare Edge

export async function GET() {
  try {
    // 1. Chỉ chọn các trường cần thiết phục vụ Feed để tối ưu hóa Egress (< 5KB payload)
    const { data, error } = await supabase
      .from('wishes')
      .select('id, title, category, reason, honor_commitment, urgency, province_code, ward_code, status, created_at, authority')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.warn('Lỗi truy vấn wishes feed từ Supabase:', error.message);
      return NextResponse.json({ success: false, data: [] }, {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=60',
          'Content-Type': 'application/json'
        }
      });
    }

    const isTestWish = (w: any) => {
      const title = (w.title || '').toLowerCase();
      return title.includes('thử nghiệm') || title.includes('test wish') || title.includes('kiểm thử') || title.includes('kiểm tra gửi') || w.id === '0160532f-7480-4e73-8c95-e3df6839a897' || w.id === 'db4739ed-9ef1-4766-ba78-721a0648d679';
    };

    const cleanData = (data || []).filter(item => !isTestWish(item));

    // 2. Trả về payload kèm Edge CDN Caching Headers
    // s-maxage=30: Cloudflare Edge lưu cache 30s
    // stale-while-revalidate=300: Phục vụ ngay dữ liệu đệm cũ trong khi tái tạo nền
    return NextResponse.json({ success: true, data: cleanData }, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=300, max-age=10',
        'CDN-Cache-Control': 'max-age=30',
        'Cloudflare-CDN-Cache-Control': 'max-age=30',
        'Content-Type': 'application/json'
      }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Lỗi tải feed' }, { status: 500 });
  }
}
