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
  id: 'usr-admin-khiem',
  name: 'Nguyễn Khiêm',
  email: 'nguyenkhiem.net@gmail.com',
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

export async function loginWithGoogle(): Promise<void> {
  const redirectTarget = typeof window !== 'undefined' && window.location.origin.includes('pages.dev')
    ? 'https://sova-give-100-app.pages.dev'
    : (typeof window !== 'undefined' ? window.location.origin : 'https://sova-give-100-app.pages.dev');

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectTarget
    }
  });

  if (error) {
    console.error("Lỗi Google OAuth:", error.message);
    alert("Không thể khởi tạo đăng nhập: " + error.message);
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch (e) {}
  setActiveUser(null);
}

export const logout = logoutUser;
