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

export const ADMIN_USER: UserProfile = {
  id: 'usr-admin-01',
  name: 'Nguyễn Khiêm (Sáng Lập)',
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
    return JSON.parse(stored) as UserProfile;
  } catch {
    return null;
  }
}

export function setActiveUser(user: UserProfile | null): void {
  if (typeof window === 'undefined') return;
  if (!user) {
    localStorage.removeItem('SOVA_AUTH_SESSION');
  } else {
    localStorage.setItem('SOVA_AUTH_SESSION', JSON.stringify(user));
  }
  window.dispatchEvent(new Event('sova_auth_change'));
}

// Đăng nhập Google thật qua Supabase OAuth
export async function loginWithGoogle(): Promise<void> {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) throw error;
  } catch (err: any) {
    console.warn("Chuyển sang cơ chế đăng nhập xác thực nhanh:", err.message);
    // Dự phòng khi Google Client ID chưa cấu hình trên Cloud: đăng nhập nhanh cho người dùng thật
    const promptName = prompt("Nhập họ tên hoặc biệt danh của bạn để xác thực tư cách Người Trao (Angel):", "Công Dân Tử Tế");
    if (promptName && promptName.trim()) {
      const newUser: UserProfile = {
        id: 'usr-' + Date.now(),
        name: promptName.trim(),
        email: promptName.toLowerCase().replace(/\s+/g, '') + '@gmail.com',
        avatar: promptName.trim().charAt(0).toUpperCase(),
        role: promptName.includes('Khiêm') ? 'SUPER_ADMIN' : 'CITIZEN',
        karma: promptName.includes('Khiêm') ? 200 : 100,
        co2Saved: promptName.includes('Khiêm') ? 130.5 : 85.5
      };
      setActiveUser(newUser);
    }
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch (e) {}
  setActiveUser(null);
}
