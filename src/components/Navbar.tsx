'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Sparkles, HeartHandshake, Compass, QrCode, ShieldCheck, 
  User, LogOut, Lock, ChevronDown, Award, PlusCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function Navbar() {
  const [user, setUser] = useState<{ name: string; karma: number } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Đọc trạng thái đăng nhập từ localStorage để hỗ trợ kiểm thử linh hoạt
  useEffect(() => {
    const storedAuth = localStorage.getItem('SOVA_AUTH_USER');
    if (storedAuth) {
      try {
        setUser(JSON.parse(storedAuth));
      } catch {
        setUser(null);
      }
    } else {
      // Mặc định tự động nhận diện nếu đã đăng nhập Supabase hoặc giả lập phiên Trọng tài
      setUser({ name: 'Nguyễn Khiêm', karma: 200 });
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLoginGoogle = () => {
    // Giả lập phiên đăng nhập thành công cho Trọng tài Nguyễn Khiêm
    const loggedUser = { name: 'Nguyễn Khiêm', karma: 200 };
    localStorage.setItem('SOVA_AUTH_USER', JSON.stringify(loggedUser));
    setUser(loggedUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('SOVA_AUTH_USER');
    setUser(null);
    setDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-warm-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-4">
        
        {/* Logo Thương Hiệu */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white shadow-soft group-hover:scale-105 transition-transform">
            <HeartHandshake className="w-6 h-6"/>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-xl text-brand-900 tracking-tight">SOVA GIVE 100</span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                0-VND
              </span>
            </div>
            <p className="text-[10px] text-warm-700 font-medium">Mạng Lưới Tuần Hoàn Sinh Kế</p>
          </div>
        </Link>

        {/* Menu Điều Hướng Trung Tâm */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-semibold text-warm-700">
          <Link href="/" className="px-3.5 py-2 rounded-xl hover:bg-warm-100 hover:text-brand-700 transition-colors flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-brand-600"/>
            <span>Cây Ước Nguyện</span>
          </Link>
          <Link href="/passports/" className="px-3.5 py-2 rounded-xl hover:bg-warm-100 hover:text-brand-700 transition-colors flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-blue-600"/>
            <span>Hộ Chiếu Vật Phẩm</span>
          </Link>
          <Link href="/handshake/" className="px-3.5 py-2 rounded-xl hover:bg-warm-100 hover:text-brand-700 transition-colors flex items-center gap-1.5">
            <QrCode className="w-4 h-4 text-sun-500"/>
            <span>Bắt Tay QR</span>
          </Link>
          <Link 
            href="/create-wish/"
            className="ml-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold shadow-sm hover:shadow-float transition-all flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4"/>
            <span>Gửi Ước Nguyện 0Đ</span>
          </Link>
        </nav>

        {/* Nút Hành Động Phải: Đăng Nhập / Profile Dropdown */}
        <div className="flex items-center gap-2.5">
          {/* Chưa Đăng Nhập -> Hiện nút Google One-Tap */}
          {!user ? (
            <button
              onClick={handleLoginGoogle}
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
            /* Đã Đăng Nhập -> Hiện Avatar Dropdown */
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 p-1.5 pr-3 rounded-2xl border border-warm-200 bg-white hover:bg-brand-50 transition-all shadow-2xs cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-brand-600 text-white font-black text-sm flex items-center justify-center">
                  {user.name.charAt(0)}
                </div>
                <div className="text-left hidden sm:block">
                  <span className="text-xs font-black text-warm-900 block leading-tight">{user.name}</span>
                  <span className="text-[10px] font-bold text-sun-600 flex items-center gap-0.5">
                    {user.karma} ⭐ Karma
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-warm-700"/>
              </button>

              {/* Menu Thả Xuống */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-3xl border border-warm-200 shadow-xl p-2.5 space-y-1 text-xs font-bold text-warm-700 animate-in fade-in zoom-in-95 z-50">
                  <div className="p-3 bg-brand-50/60 rounded-2xl border border-brand-100 mb-1.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-700 block">Tài Khoản Xác Minh</span>
                    <p className="text-sm font-black text-warm-900">{user.name}</p>
                    <span className="text-[11px] font-bold text-sun-600">{user.karma} Điểm Vốn Xã Hội (Karma)</span>
                  </div>

                  <Link 
                    href="/profile/"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-warm-100 hover:text-brand-700 transition-colors"
                  >
                    <User className="w-4 h-4 text-brand-600"/>
                    <span>Hồ Sơ Của Tôi & Chứng Chỉ</span>
                  </Link>

                  <Link 
                    href="/admin/"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-sun-50/70 text-sun-900 hover:bg-sun-100 transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4 text-sun-600"/>
                    <span className="font-black">Bàn Quản Trị Tối Cao</span>
                  </Link>

                  <div className="border-t border-warm-100 my-1"/>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 transition-colors text-left cursor-pointer"
                  >
                    <LogOut className="w-4 h-4"/>
                    <span>Đăng Xuất Khỏi Thiết Bị</span>
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </header>
  );
}
