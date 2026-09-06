'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  HeartHandshake, Sparkles, User, LogOut, ShieldCheck, 
  ChevronDown, Award, Lock, ExternalLink
} from 'lucide-react';
import { getActiveUser, setActiveUser, ADMIN_USER, SAMPLE_CITIZEN, UserProfile } from '@/lib/auth';

export default function Navbar() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUser(getActiveUser());
    const handleAuth = () => setUser(getActiveUser());
    window.addEventListener('sova_auth_change', handleAuth);

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('sova_auth_change', handleAuth);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-warm-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-10 h-10 rounded-2xl bg-brand-600 flex items-center justify-center text-white shadow-soft group-hover:scale-105 transition-transform">
            <HeartHandshake className="w-6 h-6"/>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-base text-warm-900 tracking-tight">SOVA GIVE 100</span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                0-VND
              </span>
            </div>
            <p className="text-[10px] text-warm-700 font-semibold">Mạng Lưới Tuần Hoàn Sinh Kế</p>
          </div>
        </Link>

        {/* Menu Điều Hướng */}
        <nav className="hidden md:flex items-center gap-1 text-xs font-bold text-warm-700">
          <Link href="/" className="px-3.5 py-2 rounded-xl hover:bg-warm-100 hover:text-brand-700 transition-all">
            Cây Nguyện Ước
          </Link>
          <Link href="/passports/" className="px-3.5 py-2 rounded-xl hover:bg-warm-100 hover:text-brand-700 transition-all">
            Hộ Chiếu Vật Phẩm
          </Link>
          <Link href="/handshake/" className="px-3.5 py-2 rounded-xl hover:bg-warm-100 hover:text-brand-700 transition-all">
            Bắt Tay QR
          </Link>
        </nav>

        {/* Cụm Tài Khoản */}
        <div className="flex items-center gap-2.5">
          <Link 
            href="/create-wish/"
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-black shadow-xs transition-all"
          >
            <Sparkles className="w-3.5 h-3.5"/>
            <span>Gửi Ước Nguyện</span>
          </Link>

          {!user ? (
            <button
              onClick={() => setLoginModalOpen(true)}
              className="px-4 py-2 rounded-xl border-2 border-warm-200 bg-white hover:bg-brand-50 hover:border-brand-500 text-xs font-black text-warm-900 shadow-2xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Đăng Nhập</span>
            </button>
          ) : (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 p-1.5 pr-3 rounded-2xl border border-warm-200 bg-white hover:bg-brand-50 transition-all shadow-2xs cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-brand-600 text-white font-black text-sm flex items-center justify-center">
                  {user.avatar}
                </div>
                <div className="text-left hidden sm:block">
                  <span className="text-xs font-black text-warm-900 block leading-tight">{user.name}</span>
                  <span className="text-[10px] font-bold text-sun-600 flex items-center gap-0.5">
                    {user.karma} ⭐ Karma
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-warm-700"/>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-3xl border border-warm-200 shadow-xl p-2.5 space-y-1 text-xs font-bold text-warm-700 animate-in fade-in zoom-in-95 z-50">
                  <div className="p-3 bg-brand-50/60 rounded-2xl border border-brand-100 mb-1.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-700 block">
                      {user.role === 'SUPER_ADMIN' ? 'Trọng Tài Tối Cao' : 'Công Dân Xác Minh'}
                    </span>
                    <p className="text-sm font-black text-warm-900">{user.name}</p>
                    <span className="text-[11px] font-bold text-sun-600">{user.karma} ⭐ Vốn Xã Hội</span>
                  </div>

                  <Link 
                    href="/profile/"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-warm-100 hover:text-brand-700 transition-colors"
                  >
                    <User className="w-4 h-4 text-brand-600"/>
                    <span>Hồ Sơ Cá Nhân & Chứng Chỉ</span>
                  </Link>

                  {user.role === 'SUPER_ADMIN' && (
                    <Link 
                      href="/admin/"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-sun-50/80 text-sun-900 hover:bg-sun-100 transition-colors"
                    >
                      <ShieldCheck className="w-4 h-4 text-sun-600"/>
                      <span className="font-black">Bàn Quản Trị Tối Cao</span>
                    </Link>
                  )}

                  <div className="border-t border-warm-100 my-1"/>

                  <button
                    onClick={() => {
                      setActiveUser(null);
                      setDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 transition-colors text-left cursor-pointer"
                  >
                    <LogOut className="w-4 h-4"/>
                    <span>Đăng Xuất (Về Khách Vãng Lai)</span>
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Modal Chọn Tài Khoản Đăng Nhập 1 Chạm */}
      {loginModalOpen && (
        <div className="fixed inset-0 z-50 bg-warm-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-warm-200 max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 mx-auto flex items-center justify-center border border-brand-200">
                <Lock className="w-6 h-6"/>
              </div>
              <h3 className="text-lg font-black text-warm-900">Đăng Nhập 1 Chạm</h3>
              <p className="text-xs text-warm-700">Chọn định danh để trải nghiệm đa vai trò</p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  setActiveUser(ADMIN_USER);
                  setLoginModalOpen(false);
                }}
                className="w-full p-3 rounded-2xl border-2 border-sun-300 hover:border-sun-500 bg-sun-50/50 flex items-center gap-3 transition-all text-left cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-sun-500 text-white font-black flex items-center justify-center shrink-0">
                  K
                </div>
                <div>
                  <span className="text-xs font-black text-warm-900 block">Nguyễn Khiêm (Trọng Tài Tối Cao)</span>
                  <span className="text-[10px] text-sun-700 font-bold">Toàn quyền duyệt, xóa & quản trị 100%</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setActiveUser(SAMPLE_CITIZEN);
                  setLoginModalOpen(false);
                }}
                className="w-full p-3 rounded-2xl border border-warm-200 hover:border-brand-500 bg-white flex items-center gap-3 transition-all text-left cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-brand-600 text-white font-black flex items-center justify-center shrink-0">
                  A
                </div>
                <div>
                  <span className="text-xs font-black text-warm-900 block">Nguyễn Văn An (Người Nhận)</span>
                  <span className="text-[10px] text-warm-700 font-medium">Quyền tự sửa & rút ước nguyện</span>
                </div>
              </button>
            </div>

            <button
              onClick={() => setLoginModalOpen(false)}
              className="w-full py-2.5 rounded-xl border border-warm-200 text-xs font-bold text-warm-700 hover:bg-warm-100 transition-all cursor-pointer"
            >
              Hủy Bỏ
            </button>
          </div>
        </div>
      )}

    </header>
  );
}
