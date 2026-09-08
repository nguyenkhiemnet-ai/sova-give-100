import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// URL và Service Role Key bảo mật cấp tối cao
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bltzkqrjzuplukamvdvb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsdHprcXJqenVwbHVrYW12ZHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODU3NjY4NCwiZXhwIjoyMTA0MTUyNjg0fQ.LBEvwI1hUrDuWClz2dNInC9f0w7BA_ZyVsxm0oYkL0M';

const SUPER_ADMIN_EMAIL = 'nguyenkhiemnet@gmail.com';

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
    const { action = 'generate-recovery-link', targetEmail, targetUserId, newPassword, adminEmail } = body;

    // 1. Kiểm tra quyền bảo mật: Chỉ tài khoản Admin tối cao mới được phép thực thi
    const authHeader = request.headers.get('authorization');
    let isAuthorized = false;

    // Kiểm tra trực tiếp adminEmail gửi lên
    if (adminEmail && adminEmail.trim().toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
      isAuthorized = true;
    }

    // Nếu có Bearer token, xác thực chéo với Supabase Auth
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '').trim();
      const supabaseAdmin = getAdminClient();
      const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
      if (!authErr && user?.email && user.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: 'Truy cập bị từ chối. Chỉ Ban Quản Trị Tối Cao (nguyenkhiemnet@gmail.com) mới có quyền thực thi thao tác này.' },
        { status: 403 }
      );
    }

    const supabaseAdmin = getAdminClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sovahub.org';

    // 2. Thao tác A: Tạo link khôi phục mật khẩu trực tiếp (Bypass SMTP 100%)
    if (action === 'generate-recovery-link') {
      if (!targetEmail || !targetEmail.trim()) {
        return NextResponse.json({ success: false, error: 'Vui lòng cung cấp email thành viên cần cấp link.' }, { status: 400 });
      }

      const cleanEmail = targetEmail.trim().toLowerCase();

      const { data, error } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: cleanEmail,
        options: {
          redirectTo: `${siteUrl}/`
        }
      });

      if (error) {
        return NextResponse.json({ success: false, error: error.message || 'Không thể tạo liên kết khôi phục.' }, { status: 400 });
      }

      let actionLink = data.properties?.action_link || '';

      // Đảm bảo param redirect_to trỏ chính xác về sovahub.org
      if (actionLink) {
        try {
          const urlObj = new URL(actionLink);
          urlObj.searchParams.set('redirect_to', `${siteUrl}/`);
          actionLink = urlObj.toString();
        } catch (e) {
          console.warn("Lỗi chuẩn hóa action_link:", e);
        }
      }

      return NextResponse.json({
        success: true,
        actionLink,
        email: cleanEmail,
        message: `Đã sinh thành công link đặt lại mật khẩu cho ${cleanEmail}!`
      });
    }

    // 3. Thao tác B: Đặt trực tiếp mật khẩu mới (Cấp tốc hỗ trợ thành viên)
    if (action === 'update-password') {
      if (!newPassword || newPassword.length < 6) {
        return NextResponse.json({ success: false, error: 'Mật khẩu mới phải có tối thiểu 6 ký tự.' }, { status: 400 });
      }

      let resolvedUserId = targetUserId;

      // Nếu không có userId nhưng có email, tìm kiếm user trong Supabase
      if (!resolvedUserId && targetEmail) {
        const cleanEmail = targetEmail.trim().toLowerCase();
        const { data: usersData, error: listErr } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
        if (!listErr && usersData?.users) {
          const matched = usersData.users.find(u => u.email?.toLowerCase() === cleanEmail);
          if (matched) {
            resolvedUserId = matched.id;
          }
        }

        // Nếu vẫn không tìm thấy qua listUsers, tra cứu qua bảng profiles
        if (!resolvedUserId) {
          const { data: profile } = await supabaseAdmin.from('profiles').select('id').eq('email', cleanEmail).maybeSingle();
          if (profile?.id) {
            resolvedUserId = profile.id;
          }
        }
      }

      if (!resolvedUserId) {
        return NextResponse.json({ success: false, error: 'Không tìm thấy ID tài khoản người dùng tương ứng.' }, { status: 404 });
      }

      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(resolvedUserId, {
        password: newPassword
      });

      if (error) {
        return NextResponse.json({ success: false, error: error.message || 'Không thể cập nhật mật khẩu trực tiếp.' }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        userId: resolvedUserId,
        email: data.user?.email || targetEmail,
        message: 'Đã cập nhật mật khẩu mới thành công cho thành viên!'
      });
    }

    return NextResponse.json({ success: false, error: 'Hành động không hợp lệ.' }, { status: 400 });
  } catch (err: any) {
    console.error("Lỗi API auth-ops:", err);
    return NextResponse.json({ success: false, error: err.message || 'Lỗi hệ thống máy chủ.' }, { status: 500 });
  }
}
