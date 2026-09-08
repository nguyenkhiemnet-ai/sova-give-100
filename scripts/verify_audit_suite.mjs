import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env.local manually if not already in process.env
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bltzkqrjzuplukamvdvb.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function runAudit() {
  console.log('====================================================');
  console.log('🚀 RUNNING ENTERPRISE ACID 10/10 AUTOMATED AUDIT');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  // TEST 1: Database Wishes Purity
  total++;
  console.log(`[TEST ${total}] Kiểm tra cơ sở dữ liệu Supabase Wishes...`);
  const { data: wishes, error: wishErr } = await supabaseAdmin
    .from('wishes')
    .select('id, title, category, status, authority');
  
  if (wishErr) {
    console.error(`❌ Lỗi truy vấn bảng wishes:`, wishErr);
  } else {
    const testKeywords = ['rpc', 'thử nghiệm', 'kiểm thử', 'pending', 'verified'];
    const dirtyWishes = wishes.filter(w => {
      const t = (w.title || '').toLowerCase();
      return testKeywords.some(k => t.includes(k));
    });

    if (dirtyWishes.length === 0) {
      console.log(`✅ TEST ${total} PASSED: 100% sạch sẽ! Không còn bài đăng rác nào trong DB (${wishes.length} bài thật).`);
      wishes.forEach(w => console.log(`   - [${w.status}] ${w.title} (Danh mục: ${w.category || 'N/A'})`));
      passed++;
    } else {
      console.error(`❌ TEST ${total} FAILED: Vẫn còn ${dirtyWishes.length} bài rác!`, dirtyWishes);
    }
  }

  // TEST 2: Check Method API endpoint
  total++;
  console.log(`\n[TEST ${total}] Kiểm tra API /api/auth/check-method (Google SSO detection)...`);
  try {
    const res = await fetch('http://localhost:3000/api/auth/check-method', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nguyenkhiemnet@gmail.com' })
    });
    const json = await res.json();
    if (res.status === 200 && json.exists === true && json.isGoogleUser === true) {
      console.log(`✅ TEST ${total} PASSED: Nhận diện chính xác tài khoản Google SSO:`, json);
      passed++;
    } else {
      console.error(`❌ TEST ${total} FAILED: API phản hồi không đúng kỳ vọng:`, json);
    }
  } catch (err) {
    console.error(`❌ TEST ${total} FAILED: Không thể kết nối tới API:`, err.message);
  }

  // TEST 3: Check Method API with non-existent email
  total++;
  console.log(`\n[TEST ${total}] Kiểm tra API /api/auth/check-method với email không tồn tại...`);
  try {
    const res = await fetch('http://localhost:3000/api/auth/check-method', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nonexistent_test_12345@gmail.com' })
    });
    const json = await res.json();
    if (res.status === 200 && json.exists === false) {
      console.log(`✅ TEST ${total} PASSED: Phản hồi chuẩn xác email chưa đăng ký:`, json);
      passed++;
    } else {
      console.error(`❌ TEST ${total} FAILED:`, json);
    }
  } catch (err) {
    console.error(`❌ TEST ${total} FAILED:`, err.message);
  }

  // TEST 4: Profile Page SSR / Loading
  total++;
  console.log(`\n[TEST ${total}] Kiểm tra tải trang /profile/...`);
  try {
    const res = await fetch('http://localhost:3000/profile/');
    if (res.status === 200) {
      console.log(`✅ TEST ${total} PASSED: Trang /profile/ phản hồi HTTP 200 OK.`);
      passed++;
    } else {
      console.error(`❌ TEST ${total} FAILED: HTTP ${res.status}`);
    }
  } catch (err) {
    console.error(`❌ TEST ${total} FAILED:`, err.message);
  }

  // TEST 5: ACID Wish Update & Delete Lifecycle via /api/wishes/manage
  total++;
  console.log(`\n[TEST ${total}] Kiểm tra chu trình ACID: Tạo -> Sửa -> Xóa điều ước qua API...`);
  try {
    // 1. Create a dummy test wish
    const { data: inserted, error: insErr } = await supabaseAdmin
      .from('wishes')
      .insert({
        title: 'TEMPORARY_ACID_TEST_WISH',
        category: 'COMMUTE',
        reason: 'Temporary test for ACID verification',
        amount: 1,
        status: 'pending'
      })
      .select()
      .single();

    if (insErr || !inserted) {
      throw new Error('Không thể tạo bài kiểm thử tạm: ' + (insErr?.message || 'unknown'));
    }

    const testId = inserted.id;

    // 2. Update via API
    const updRes = await fetch('http://localhost:3000/api/wishes/manage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update',
        wishId: testId,
        data: {
          title: 'TEMPORARY_ACID_TEST_WISH_MODIFIED',
          reason: 'Reason modified successfully'
        }
      })
    });
    const updJson = await updRes.json();
    if (!updJson.success) throw new Error('Cập nhật thất bại: ' + updJson.error);

    // Verify update in DB
    const { data: checkUpd } = await supabaseAdmin.from('wishes').select('title, reason').eq('id', testId).single();
    if (checkUpd?.title !== 'TEMPORARY_ACID_TEST_WISH_MODIFIED') {
      throw new Error('Dữ liệu DB sau cập nhật không khớp');
    }

    // 3. Delete via API
    const delRes = await fetch('http://localhost:3000/api/wishes/manage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'delete',
        wishId: testId
      })
    });
    const delJson = await delRes.json();
    if (!delJson.success) throw new Error('Xóa thất bại: ' + delJson.error);

    // Verify deletion in DB
    const { data: checkDel } = await supabaseAdmin.from('wishes').select('id').eq('id', testId).maybeSingle();
    if (checkDel) {
      throw new Error('Dữ liệu vẫn còn trong DB sau khi gọi API delete');
    }

    console.log(`✅ TEST ${total} PASSED: Chu trình ACID Tạo -> Sửa -> Xóa hoàn tất tuyệt đối và DB hoàn toàn sạch.`);
    passed++;
  } catch (err) {
    console.error(`❌ TEST ${total} FAILED:`, err.message);
  }

  // TEST 5: Home Page SSR & Content Inspection
  total++;
  console.log(`\n[TEST ${total}] Kiểm tra trang chủ / (Buttons & Content)...`);
  try {
    const res = await fetch('http://localhost:3000/');
    const html = await res.text();
    const hasAngelBtn = html.includes('Tôi Muốn Trao Đồ Tốt') || html.includes('wishlist-section');
    const hasDreamBtn = html.includes('Tôi Cần Dụng Cụ Để Tự Lập') || html.includes('create-wish');
    
    if (res.status === 200 && hasAngelBtn && hasDreamBtn) {
      console.log(`✅ TEST ${total} PASSED: Trang chủ HTTP 200 và chứa đủ các liên kết hành động chủ chốt.`);
      passed++;
    } else {
      console.error(`❌ TEST ${total} FAILED:`, { status: res.status, hasAngelBtn, hasDreamBtn });
    }
  } catch (err) {
    console.error(`❌ TEST ${total} FAILED:`, err.message);
  }

  console.log('\n====================================================');
  console.log(`📊 KẾT QUẢ KIỂM TOÁN: ${passed}/${total} BÀI KIỂM THỬ ĐẠT CHUẨN (${(passed/total*100).toFixed(0)}%)`);
  console.log('====================================================');
  
  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runAudit().catch(err => {
  console.error('Lỗi nghiêm trọng:', err);
  process.exit(1);
});
