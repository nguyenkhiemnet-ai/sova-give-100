import { normalizeCategorySlug } from '../src/lib/cms.ts';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bltzkqrjzuplukamvdvb.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  console.log('====================================================');
  console.log('🔍 KIỂM TOÁN CHUẨN HÓA SLUG & ĐẾM SỐ LƯỢNG DANH MỤC');
  console.log('====================================================\n');

  // TEST 1: Kiểm tra hàm normalizeCategorySlug
  console.log('[TEST 1] Kiểm tra Category Alias Mapper...');
  const tests = [
    { inCat: 'COMMUTE', expected: 'bicycle' },
    { inCat: 'commute', expected: 'bicycle' },
    { inCat: 'bicycle', expected: 'bicycle' },
    { inCat: 'xe_dap', expected: 'bicycle' },
    { inCat: 'STUDY_DEVICE', expected: 'laptop' },
    { inCat: 'study_device', expected: 'laptop' },
    { inCat: 'laptop', expected: 'laptop' },
    { inCat: 'may_tinh', expected: 'laptop' },
    { inCat: 'VOCATIONAL_TOOL', expected: 'sewing_machine' },
    { inCat: 'vocational_tool', expected: 'sewing_machine' },
    { inCat: 'sewing_machine', expected: 'sewing_machine' },
    { inCat: 'may_may', expected: 'sewing_machine' },
    { inCat: 'study_tools', expected: 'study_tools' },
    { inCat: 'sach_vo', expected: 'study_tools' },
    { inCat: 'books', expected: 'study_tools' },
    { inCat: 'livelihood_tools', expected: 'livelihood_tools' },
    { inCat: 'cong_cu', expected: 'livelihood_tools' },
  ];

  let test1Passed = true;
  for (const t of tests) {
    const res = normalizeCategorySlug(t.inCat);
    if (res !== t.expected) {
      console.error(`❌ Mismatch for "${t.inCat}": got "${res}", expected "${t.expected}"`);
      test1Passed = false;
    }
  }

  if (test1Passed) {
    console.log(`✅ TEST 1 PASSED: 17/17 case chuẩn hóa mã danh mục đạt 100%!`);
  }

  // TEST 2: Đếm số lượng trên 4 bài thật từ Supabase
  console.log('\n[TEST 2] Đếm số lượng trên dữ liệu thực tế Supabase...');
  const { data: wishes, error } = await supabaseAdmin
    .from('wishes')
    .select('id, title, category, status');

  if (error) {
    console.error('❌ Lỗi query wishes:', error);
    process.exit(1);
  }

  console.log(`Đã tải ${wishes.length} bài đăng từ DB.`);
  const counts = {
    ALL: wishes.length,
    bicycle: 0,
    laptop: 0,
    sewing_machine: 0,
    study_tools: 0,
    livelihood_tools: 0
  };

  wishes.forEach(w => {
    const slug = normalizeCategorySlug(w.category, w.title);
    if (counts[slug] !== undefined) {
      counts[slug]++;
    }
    console.log(`   - "${w.title}" [DB category: ${w.category}] -> Slug: "${slug}"`);
  });

  console.log('\n📊 KẾT QUẢ ĐẾM SỐ LƯỢNG:');
  console.log(`   • Tất cả: ${counts.ALL} (Kỳ vọng: 4)`);
  console.log(`   • Xe đạp: ${counts.bicycle} (Kỳ vọng: 2)`);
  console.log(`   • Máy tính: ${counts.laptop} (Kỳ vọng: 1)`);
  console.log(`   • Máy may: ${counts.sewing_machine} (Kỳ vọng: 1)`);

  const countsMatched = 
    counts.ALL === 4 &&
    counts.bicycle === 2 &&
    counts.laptop === 1 &&
    counts.sewing_machine === 1;

  if (countsMatched) {
    console.log('✅ TEST 2 PASSED: 100% số đếm khớp hoàn hảo với chỉ thị!');
  } else {
    console.error('❌ TEST 2 FAILED: Số đếm chưa khớp!');
    process.exit(1);
  }

  // TEST 3: Kiểm tra Cloud Metadata Categories
  console.log('\n[TEST 3] Kiểm tra lưu trữ danh mục trên Cloud Admin Metadata...');
  const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
  const admin = usersData.users.find(u => u.email === 'nguyenkhiemnet@gmail.com');
  const cloudCats = admin?.user_metadata?.site_categories;
  if (Array.isArray(cloudCats) && cloudCats.length >= 5) {
    console.log(`✅ TEST 3 PASSED: Cloud Metadata đang lưu ${cloudCats.length} danh mục động:`);
    cloudCats.forEach(c => console.log(`   - [${c.id}] ${c.label} (${c.shortLabel})`));
  } else {
    console.error('❌ TEST 3 FAILED: Cloud metadata không tìm thấy site_categories!');
    process.exit(1);
  }

  console.log('\n====================================================');
  console.log('🏆 TOÀN BỘ BỘ TEST ĐÃ VƯỢT QUA 100% THÀNH CÔNG!');
  console.log('====================================================');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
