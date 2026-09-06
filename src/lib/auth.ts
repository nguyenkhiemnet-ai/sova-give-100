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

export const SAMPLE_CITIZEN: UserProfile = {
  id: 'usr-an-k69',
  name: 'Nguyễn Văn An',
  email: 'an.k69.cntt@student.edu.vn',
  avatar: 'A',
  role: 'CITIZEN',
  karma: 100,
  co2Saved: 85.5
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
