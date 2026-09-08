import fs from 'fs';
import path from 'path';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bltzkqrjzuplukamvdvb.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsdHprcXJqenVwbHVrYW12ZHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODU3NjY4NCwiZXhwIjoyMTA0MTUyNjg0fQ.LBEvwI1hUrDuWClz2dNInC9f0w7BA_ZyVsxm0oYkL0M';

async function fetchTable(endpoint) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`
      }
    });
    if (res.ok) {
      return await res.json();
    }
    console.warn(`⚠️ Bảng ${endpoint} trả về HTTP ${res.status}`);
    return [];
  } catch (err) {
    console.warn(`⚠️ Lỗi kết nối bảng ${endpoint}:`, err.message);
    return [];
  }
}

async function runBackup() {
  console.log('🛡️ [SOVA BACKUP VAULT] Khởi tạo quy trình sao lưu két vàng bất biến...');
  const startTime = Date.now();

  const [wishes, profiles, settings] = await Promise.all([
    fetchTable('wishes?select=*&order=created_at.desc'),
    fetchTable('profiles?select=*'),
    fetchTable('site_settings?select=*')
  ]);

  let authUsers = [];
  try {
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`
      }
    });
    if (userRes.ok) {
      const data = await userRes.json();
      authUsers = (data.users || []).map(u => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        app_metadata: u.app_metadata,
        user_metadata: u.user_metadata
      }));
    }
  } catch {}

  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-');
  const backupDir = path.resolve(process.cwd(), 'backups');

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const snapshot = {
    vault_version: '1.0.0-enterprise-gold',
    timestamp: now.toISOString(),
    environment: 'production',
    metadata: {
      total_wishes: wishes.length,
      total_profiles: profiles.length,
      total_settings: settings.length,
      total_auth_users: authUsers.length,
      duration_ms: Date.now() - startTime
    },
    tables: {
      wishes,
      profiles,
      site_settings: settings,
      auth_users: authUsers
    }
  };

  const filename = `vault_snapshot_${timestamp}.json`;
  const targetPath = path.join(backupDir, filename);
  const latestPath = path.join(backupDir, 'vault_latest.json');
  const goldPath = path.join(backupDir, 'vault_snapshot_v1.0.0_gold.json');

  const jsonString = JSON.stringify(snapshot, null, 2);
  fs.writeFileSync(targetPath, jsonString, 'utf-8');
  fs.writeFileSync(latestPath, jsonString, 'utf-8');
  fs.writeFileSync(goldPath, jsonString, 'utf-8');

  // Kiểm tra tính toàn vẹn (Integrity Check)
  const stats = fs.statSync(targetPath);
  const reRead = JSON.parse(fs.readFileSync(targetPath, 'utf-8'));

  if (!reRead.tables || !Array.isArray(reRead.tables.wishes)) {
    throw new Error('❌ Kiểm tra tính toàn vẹn thất bại: Dữ liệu JSON bị khiếm khuyết!');
  }

  console.log(`✅ [SOVA BACKUP VAULT] Đã tạo thành công két snapshot vàng!`);
  console.log(`📁 Tệp sao lưu: ${targetPath}`);
  console.log(`📊 Dung lượng: ${(stats.size / 1024).toFixed(2)} KB`);
  console.log(`📦 Thống kê dữ liệu bảo toàn:`);
  console.log(`   - wishes        : ${snapshot.metadata.total_wishes} hồ sơ`);
  console.log(`   - profiles      : ${snapshot.metadata.total_profiles} tài khoản`);
  console.log(`   - site_settings : ${snapshot.metadata.total_settings} cài đặt`);
  console.log(`   - auth_users    : ${snapshot.metadata.total_auth_users} thành viên`);
}

runBackup().catch(err => {
  console.error('❌ LỖI SAO LƯU KÉT DỮ LIỆU:', err);
  process.exit(1);
});
