import fs from 'fs';
import path from 'path';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bltzkqrjzuplukamvdvb.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsdHprcXJqenVwbHVrYW12ZHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODU3NjY4NCwiZXhwIjoyMTA0MTUyNjg0fQ.LBEvwI1hUrDuWClz2dNInC9f0w7BA_ZyVsxm0oYkL0M';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sovahub.org';

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passCount++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    failCount++;
  }
}

async function runGate() {
  console.log('================================================================');
  console.log('🔒 [SOVA ANTI-REGRESSION GATE] BẮT ĐẦU KIỂM TOÁN LÁ CHẮN AN TOÀN');
  console.log('================================================================');

  // 1. CHECK DATA INTEGRITY
  console.log('\n[GATE 1] KIỂM TRA TÍNH TOÀN VẸN CƠ SỞ DỮ LIỆU THỰC TẾ:');
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/wishes?select=id,title,status&order=created_at.desc`, {
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` }
    });
    const wishes = await res.json();

    const activeWishes = Array.isArray(wishes) ? wishes.filter(w => w.status !== 'archived') : [];
    const trashWishes = activeWishes.filter(w => {
      const t = (w.title || '').toLowerCase();
      return t.includes('thử nghiệm') || t.includes('test wish') || t.includes('kiểm thử');
    });

    assert(activeWishes.length >= 4, `Cơ sở dữ liệu lưu giữ đúng tối thiểu 4 bài thật (hiện có: ${activeWishes.length})`);
    assert(trashWishes.length === 0, `Không còn bài đăng thử nghiệm rác nào hiển thị công khai (rác tìm thấy: ${trashWishes.length})`);
  } catch (err) {
    assert(false, `Lỗi kết nối kiểm tra dữ liệu Supabase: ${err.message}`);
  }

  // 2. CHECK IDENTITY (HOTLINE & ZALO CHUẨN MỚI)
  console.log('\n[GATE 2] KIỂM TRA ĐỊNH DANH LIÊN HỆ BẢO MẬT:');
  try {
    const pageContent = fs.readFileSync(path.resolve(process.cwd(), 'src/app/page.tsx'), 'utf-8');
    const hasNewPhone = pageContent.includes('0912.661.558');
    const hasNewZalo = pageContent.includes('https://zalo.me/0912661558');
    const hasOldPhone = pageContent.includes('0908210884') || pageContent.includes('0908.210.884');

    assert(hasNewPhone, 'Hotline hiển thị chuẩn mới: 0912.661.558');
    assert(hasNewZalo, 'Đường dẫn Zalo chuẩn mới: https://zalo.me/0912661558');
    assert(!hasOldPhone, 'Tuyệt đối KHÔNG còn tồn tại số điện thoại cũ 0908210884');
  } catch (err) {
    assert(false, `Lỗi đọc mã nguồn kiểm tra hotline: ${err.message}`);
  }

  // 3. CHECK ENDPOINTS AVAILABILITY (PRODUCTION & LOCAL)
  console.log('\n[GATE 3] KIỂM TRA ĐỐI ỨNG API ENDPOINTS:');
  const endpoints = [
    { url: `${SITE_URL}/api/wishes-feed`, method: 'GET', name: 'Feed Điều Ước' },
    { url: `${SITE_URL}/api/categories`, method: 'GET', name: 'Danh Mục CMS' },
    { 
      url: `${SITE_URL}/api/auth/check-method`, 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nguyenkhiemnet@gmail.com' }),
      name: 'Nhận Diện Google SSO' 
    }
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep.url, {
        method: ep.method,
        headers: ep.headers,
        body: ep.body
      });
      assert(res.status === 200, `API [${ep.name}] phản hồi HTTP 200 (${ep.url})`);
    } catch (err) {
      assert(false, `API [${ep.name}] gặp lỗi kết nối: ${err.message}`);
    }
  }

  // 4. CHECK PWA & EDGE CACHING MANIFEST
  console.log('\n[GATE 4] KIỂM TRA PWA & CẤU HÌNH LÁ CHẮN BIÊN:');
  try {
    const manifestPath = path.resolve(process.cwd(), 'public/manifest.json');
    const headersPath = path.resolve(process.cwd(), 'public/_headers');

    const manifestExists = fs.existsSync(manifestPath);
    assert(manifestExists, 'Tệp public/manifest.json tồn tại');

    if (manifestExists) {
      const m = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      assert(m.name === 'SOVA GIVE 100', `Manifest name: "${m.name}" chuẩn xác`);
      assert(m.short_name === 'SOVAHUB', `Manifest short_name: "${m.short_name}" chuẩn xác`);
      assert(Array.isArray(m.icons) && m.icons.length > 0, 'Manifest có khai báo icon PWA');
    }

    const headersExists = fs.existsSync(headersPath);
    assert(headersExists, 'Tệp public/_headers cấu hình Cloudflare Edge RAM Cache tồn tại');
  } catch (err) {
    assert(false, `Lỗi kiểm tra tệp PWA / _headers: ${err.message}`);
  }

  // 5. CHECK CANONICAL DOMAIN ENFORCEMENT
  console.log('\n[GATE 5] KIỂM TRA KHÓA CHẶT TÊN MIỀN THƯƠNG HIỆU CANONICAL:');
  try {
    const redirectsPath = path.resolve(process.cwd(), 'public/_redirects');
    const redirectsExists = fs.existsSync(redirectsPath);
    assert(redirectsExists, 'Tệp public/_redirects tồn tại');
    if (redirectsExists) {
      const redirectsContent = fs.readFileSync(redirectsPath, 'utf-8');
      assert(redirectsContent.includes('https://sovahub.org/:splat 301!'), 'Quy tắc 301! chuyển hướng tên miền pages.dev về sovahub.org chính xác');
    }

    const authContent = fs.readFileSync(path.resolve(process.cwd(), 'src/lib/auth.ts'), 'utf-8');
    assert(authContent.includes('getCanonicalSiteUrl'), 'Hàm getCanonicalSiteUrl khóa cứng domain chuẩn trong auth.ts');

    const layoutContent = fs.readFileSync(path.resolve(process.cwd(), 'src/app/layout.tsx'), 'utf-8');
    assert(layoutContent.includes('window.location.replace(\'https://sovahub.org\''), 'Script chuyển hướng tức thì Client-side có mặt tại layout.tsx');
  } catch (err) {
    assert(false, `Lỗi kiểm tra cấu hình canonical domain: ${err.message}`);
  }

  // TỔNG KẾT
  console.log('\n================================================================');
  console.log(`📊 TỔNG KẾT KIỂM TOÁN: ${passCount} PASSED • ${failCount} FAILED`);
  console.log('================================================================');

  if (failCount > 0) {
    console.error('🚨 LÁ CHẮN BẢO VỆ PHÁT HIỆN LỖI! DỪNG NGAY TIẾN TRÌNH RELEASE!');
    process.exit(1);
  } else {
    console.log('🎉 TẤT CẢ CÁC TIÊU CHÍ ĐỀU VƯỢT QUA 100%! HỆ THỐNG AN TOÀN ĐỂ KHÓA VÀNG!');
  }
}

runGate().catch(err => {
  console.error('❌ LỖI HỆ THỐNG LÁ CHẮN:', err);
  process.exit(1);
});
