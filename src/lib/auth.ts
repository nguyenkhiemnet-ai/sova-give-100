import { supabase } from './supabaseClient';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'SUPER_ADMIN' | 'AMBASSADOR' | 'CITIZEN';
  karma: number;
  co2Saved: number;
}

// EMAIL DUY NHẤT ĐƯỢC PHÉP LÀM BAN QUẢN TRỊ TỐI CAO
export const SUPER_ADMIN_EMAIL = 'nguyenkhiemnet@gmail.com';

export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
}

export function buildUserProfile(sbUser: { id: string; email?: string; user_metadata?: { full_name?: string } }): UserProfile {
  const isSuperAdmin = isSuperAdminEmail(sbUser.email);
  return {
    id: sbUser.id,
    name: sbUser.user_metadata?.full_name || sbUser.email?.split('@')[0] || (isSuperAdmin ? 'Nguyễn Khiêm' : 'Công Dân Tử Tế'),
    email: sbUser.email || '',
    avatar: (sbUser.user_metadata?.full_name || (isSuperAdmin ? 'K' : 'U')).charAt(0).toUpperCase(),
    role: isSuperAdmin ? 'SUPER_ADMIN' : 'CITIZEN',
    karma: isSuperAdmin ? 200 : 100,
    co2Saved: isSuperAdmin ? 130.5 : 85.5
  };
}

export const ADMIN_USER: UserProfile = {
  id: 'usr-admin-khiem',
  name: 'Nguyễn Khiêm',
  email: 'nguyenkhiemnet@gmail.com',
  avatar: 'K',
  role: 'SUPER_ADMIN',
  karma: 200,
  co2Saved: 130.5
};

export function getActiveUser(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem('SOVA_AUTH_SESSION');
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored) as UserProfile;
    // Kiểm tra an toàn: Nếu role là SUPER_ADMIN nhưng email không phải nguyenkhiemnet@gmail.com thì hạ cấp ngay về CITIZEN
    if (parsed.role === 'SUPER_ADMIN' && !isSuperAdminEmail(parsed.email)) {
      parsed.role = 'CITIZEN';
      localStorage.setItem('SOVA_AUTH_SESSION', JSON.stringify(parsed));
    }
    return parsed;
  } catch {
    return null;
  }
}

export function setActiveUser(user: UserProfile | null): void {
  if (typeof window === 'undefined') return;
  if (!user) {
    localStorage.removeItem('SOVA_AUTH_SESSION');
  } else {
    // Luôn bảo đảm chỉ nguyenkhiemnet@gmail.com mới mang vai trò SUPER_ADMIN
    if (user.role === 'SUPER_ADMIN' && !isSuperAdminEmail(user.email)) {
      user.role = 'CITIZEN';
    }
    localStorage.setItem('SOVA_AUTH_SESSION', JSON.stringify(user));
  }
  window.dispatchEvent(new Event('sova_auth_change'));
}

export async function loginWithGoogle(): Promise<void> {
  const redirectTarget = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? window.location.origin
    : 'https://sovahub.org';

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectTarget
    }
  });

  if (error) {
    console.error("Lỗi Google OAuth:", error.message);
    alert("Không thể khởi tạo đăng nhập Google: " + error.message);
  }
}

export async function loginWithEmail(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data.user) {
      const profile = buildUserProfile(data.user);
      setActiveUser(profile);
      return { success: true };
    }

    return { success: false, error: 'Không thể nhận diện tài khoản.' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Lỗi đăng nhập không xác định.' };
  }
}

export async function signUpWithEmail(email: string, password: string, fullName: string): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    const redirectTarget = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? window.location.origin
      : 'https://sovahub.org';

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: password,
      options: {
        data: {
          full_name: fullName.trim()
        },
        emailRedirectTo: redirectTarget
      }
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data.user && data.session) {
      const profile = buildUserProfile(data.user);
      setActiveUser(profile);
      return { success: true, message: 'Đăng ký thành công và đã tự động đăng nhập!' };
    }

    return { 
      success: true, 
      message: 'Tài khoản đã tạo! Vui lòng kiểm tra hộp thư email để bấm xác nhận (nếu Supabase bật email confirmation).' 
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Lỗi đăng ký không xác định.' };
  }
}

export async function resetPassword(email: string): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    const redirectTarget = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? window.location.origin
      : 'https://sovahub.org';

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: redirectTarget
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { 
      success: true, 
      message: 'Liên kết khôi phục mật khẩu đã được gửi đến email của bạn. Vui lòng kiểm tra hòm thư!' 
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Lỗi khôi phục mật khẩu.' };
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch (e) {}
  setActiveUser(null);
}

export const logout = logoutUser;
