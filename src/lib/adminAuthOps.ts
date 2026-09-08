import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL } from './supabaseClient';
import { SUPER_ADMIN_EMAIL, isSuperAdminEmail } from './auth';

// Khóa bảo mật Service Role chuẩn của Supabase dự án bltzkqrjzuplukamvdvb
export const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsdHprcXJqenVwbHVrYW12ZHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODU3NjY4NCwiZXhwIjoyMTA0MTUyNjg0fQ.LBEvwI1hUrDuWClz2dNInC9f0w7BA_ZyVsxm0oYkL0M';

export function getAdminClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

/**
 * Sinh liên kết khôi phục mật khẩu trực tiếp (Bypass SMTP 100%)
 * Hoạt động trơn tru trên cả Cloudflare Pages (Static Export) lẫn Local Dev
 */
export async function adminGenerateRecoveryLink(
  targetEmail: string,
  adminEmail?: string | null
): Promise<{ success: boolean; actionLink?: string; error?: string; message?: string }> {
  try {
    // 1. Kiểm tra quyền Admin Tối Cao
    if (!adminEmail || !isSuperAdminEmail(adminEmail)) {
      return {
        success: false,
        error: 'Chỉ Ban Quản Trị Tối Cao (nguyenkhiemnet@gmail.com) mới có quyền thực thi.'
      };
    }

    if (!targetEmail || !targetEmail.trim()) {
      return { success: false, error: 'Vui lòng cung cấp email thành viên.' };
    }

    const cleanEmail = targetEmail.trim().toLowerCase();
    const adminClient = getAdminClient();
    const siteUrl = 'https://sovahub.org';

    // 2. Kiểm tra xem tài khoản đã tồn tại trong auth.users chưa
    const { data: usersData, error: listErr } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
    if (listErr) {
      console.warn("Lỗi listUsers:", listErr);
    }

    const existingAuthUser = (usersData?.users || []).find(u => (u.email || '').toLowerCase() === cleanEmail);

    // Nếu chưa có trong auth.users, tự động tạo tài khoản auth mới với email_confirm: true
    if (!existingAuthUser) {
      console.log(`User ${cleanEmail} chưa có trong auth.users, đang tự động khởi tạo...`);
      const { error: createErr } = await adminClient.auth.admin.createUser({
        email: cleanEmail,
        email_confirm: true,
        user_metadata: { source: 'admin_auto_provision' }
      });
      if (createErr && !createErr.message.includes('already registered')) {
        console.warn("Lỗi auto provision auth user:", createErr);
      }
    }

    // 3. Sinh Link Khôi Phục Mật Khẩu
    const { data: linkData, error: linkErr } = await adminClient.auth.admin.generateLink({
      type: 'recovery',
      email: cleanEmail,
      options: {
        redirectTo: `${siteUrl}/`
      }
    });

    if (linkErr) {
      return { success: false, error: linkErr.message || 'Không thể tạo liên kết khôi phục.' };
    }

    let actionLink = linkData.properties?.action_link || '';

    // Chuẩn hóa redirect_to trỏ chuẩn về https://sovahub.org/
    if (actionLink) {
      try {
        const urlObj = new URL(actionLink);
        urlObj.searchParams.set('redirect_to', `${siteUrl}/`);
        actionLink = urlObj.toString();
      } catch (e) {
        console.warn("Lỗi chuẩn hóa action_link:", e);
      }
    }

    return {
      success: true,
      actionLink,
      message: `Đã sinh thành công link đặt lại mật khẩu cho ${cleanEmail}!`
    };
  } catch (err: any) {
    console.error("Lỗi adminGenerateRecoveryLink:", err);
    return { success: false, error: err.message || 'Lỗi kết nối khi sinh link khôi phục.' };
  }
}

/**
 * Đặt trực tiếp mật khẩu mới cho thành viên (Hỗ trợ cấp tốc không qua email)
 */
export async function adminDirectUpdatePassword(
  targetEmail: string,
  newPassword: string,
  adminEmail?: string | null
): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    // 1. Kiểm tra quyền Admin Tối Cao
    if (!adminEmail || !isSuperAdminEmail(adminEmail)) {
      return {
        success: false,
        error: 'Chỉ Ban Quản Trị Tối Cao (nguyenkhiemnet@gmail.com) mới có quyền thực thi.'
      };
    }

    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'Mật khẩu mới cần tối thiểu 6 ký tự.' };
    }

    const cleanEmail = targetEmail.trim().toLowerCase();
    const adminClient = getAdminClient();

    // 2. Tra cứu ID thực tế trong bảng auth.users
    const { data: usersData, error: listErr } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
    if (listErr) {
      return { success: false, error: `Lỗi tra cứu auth.users: ${listErr.message}` };
    }

    let authUser = (usersData?.users || []).find(u => (u.email || '').toLowerCase() === cleanEmail);

    // Nếu chưa tồn tại trong auth.users, tạo mới ngay với mật khẩu này
    if (!authUser) {
      const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
        email: cleanEmail,
        password: newPassword,
        email_confirm: true,
        user_metadata: { source: 'admin_direct_password' }
      });

      if (createErr) {
        return { success: false, error: createErr.message || 'Không thể khởi tạo tài khoản mới.' };
      }

      return {
        success: true,
        message: `Đã khởi tạo và đặt mật khẩu mới thành công cho ${cleanEmail}!`
      };
    }

    // 3. Nếu đã tồn tại trong auth.users, cập nhật mật khẩu qua ID thực tế
    const { error: updateErr } = await adminClient.auth.admin.updateUserById(authUser.id, {
      password: newPassword
    });

    if (updateErr) {
      return { success: false, error: updateErr.message || 'Không thể cập nhật mật khẩu.' };
    }

    return {
      success: true,
      message: `Đã đặt lại mật khẩu mới thành công cho ${cleanEmail}!`
    };
  } catch (err: any) {
    console.error("Lỗi adminDirectUpdatePassword:", err);
    return { success: false, error: err.message || 'Lỗi kết nối khi cập nhật mật khẩu.' };
  }
}
