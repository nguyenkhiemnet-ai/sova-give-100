'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Sparkles, Search, MapPin, HeartHandshake, ShieldCheck, 
  User, LogOut, ChevronDown, ExternalLink
} from 'lucide-react';
import { getActiveUser, setActiveUser, loginWithGoogle, logout, UserProfile } from '@/lib/auth';
import { VIETNAM_PROVINCES } from '@/lib/provinces';
import { supabase } from '@/lib/supabaseClient';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('ALL');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Kiểm tra session từ Supabase Auth
    supabase.auth.getUser().then(({ data: { user: sbUser } }) => {
      if (sbUser) {
        const profile: UserProfile = {
          id: sbUser.id,
          name: sbUser.user_metadata?.full_name || sbUser.email?.split('@')[0] || 'Công Dân Tử Tế',
          email: sbUser.email || '',
          avatar: (sbUser.user_metadata?.full_name || 'U').charAt(0).toUpperCase(),
          role: sbUser.email?.includes('nguyenkhiem') ? 'SUPER_ADMIN' : 'CITIZEN',
          karma: 100,
          co2Saved: 85.5
        };
        setActiveUser(profile);
        setCurrentUser(profile);
      } else {
        setCurrentUser(getActiveUser());
      }
    });

    const handleAuthChange = () => setCurrentUser(getActiveUser());
    window.addEventListener('sova_auth_change', handleAuthChange);

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('sova_auth_change', handleAuthChange);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Phát tín hiệu tìm kiếm toàn cục đến Trang Chủ
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sova_global_search_change', {
        detail: { query: val, province: selectedProvince }
      }));
    }
  };

  const handleProvinceChange = (prov: string) => {
    setSelectedProvince(prov);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sova_global_search_change', {
        detail: { query: searchQuery, province: prov }
      }));
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-warm-200/80 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        
        {/* LOGO BÊN TRÁI */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-10 h-10 rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-soft group-hover:scale-105 transition-transform">
            <HeartHandshake className="w-5 h-5"/>
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-1.5">
              <span className="font-black text-warm-900 text-base tracking-tight leading-none">SOVA GIVE 100</span>
              <span className="px-1.5 py-0.5 rounded-md bg-brand-50 text-brand-700 text-[10px] font-black border border-brand-200 leading-none">0-VND</span>
            </div>
            <span className="text-[10px] text-warm-600 font-semibold block mt-0.5">Mạng Lưới Tuần Hoàn Sinh Kế</span>
          </div>
        </Link>

        {/* KHU VỰC TÌM KIẾM TRUNG TÂM (ĐÃ THAY THẾ 4 MENU CŨ) */}
        <div className="flex-1 max-w-xl mx-2">
          <div className="flex items-center bg-warm-50/80 hover:bg-white focus-within:bg-white border-2 border-warm-200 focus-within:border-brand-500 rounded-2xl shadow-2xs transition-all overflow-hidden p-1">
            
            {/* Ô nhập tìm kiếm */}
            <div className="flex items-center flex-1 px-2.5">
              <Search className="w-4 h-4 text-brand-600 shrink-0 mr-2"/>
              <input
                type="text"
                placeholder="Tìm kiếm ước nguyện (xe đạp, laptop, máy may...)"
                value={searchQuery}
                onChange={e => handleSearchChange(e.target.value)}
                className="w-full bg-transparent text-xs font-bold text-warm-900 focus:outline-none placeholder:text-warm-500"
              />
            </div>

            {/* Vạch ngăn cách */}
            <div className="h-5 w-0.5 bg-warm-200 hidden md:block shrink-0"/>

            {/* Dropdown Tỉnh/Thành thu nhỏ */}
            <div className="hidden md:flex items-center shrink-0 pr-1 pl-2">
              <MapPin className="w-3.5 h-3.5 text-sun-600 mr-1 shrink-0"/>
              <select
                value={selectedProvince}
                onChange={e => handleProvinceChange(e.target.value)}
                className="bg-transparent text-xs font-black text-warm-900 focus:outline-none cursor-pointer pr-2"
              >
                <option value="ALL">Toàn quốc</option>
                {VIETNAM_PROVINCES.map(p => (
                  <option key={p.code} value={p.code}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* CỤM NÚT BÊN PHẢI: GỬI ƯỚC NGUYỆN & USER MENU */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/create-wish/"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 sm:px-4 sm:py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-black shadow-xs hover:scale-105 transition-all shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5"/>
            <span className="hidden sm:inline">Gửi Ước Nguyện</span>
          </Link>

          {/* User Menu */}
          {currentUser ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 pr-3 rounded-2xl border border-warm-200 bg-white hover:bg-warm-50 transition-all shadow-2xs"
              >
                <div className="w-8 h-8 rounded-xl bg-brand-600 text-white text-xs font-black flex items-center justify-center">
                  {currentUser.avatar || 'K'}
                </div>
                <div className="text-left hidden lg:block">
                  <span className="text-xs font-black text-warm-900 block leading-tight truncate max-w-[110px]">{currentUser.name}</span>
                  <span className="text-[10px] text-brand-700 font-bold leading-tight">{currentUser.karma} Karma</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-warm-700"/>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-60 bg-white rounded-3xl border border-warm-200 shadow-xl p-2.5 z-50 animate-in fade-in space-y-1">
                  <div className="p-3 bg-brand-50/60 rounded-2xl border border-brand-100 mb-1.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-700 block">
                      {currentUser.role === 'SUPER_ADMIN' ? 'Trọng Tài Tối Cao' : 'Người Dùng Đã Xác Minh'}
                    </span>
                    <p className="text-sm font-black text-warm-900">{currentUser.name}</p>
                    <span className="text-[11px] font-bold text-sun-600">{currentUser.karma} ⭐ Vốn Xã Hội</span>
                  </div>

                  <Link
                    href="/profile/"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-warm-800 hover:bg-warm-100 hover:text-brand-700 transition-colors"
                  >
                    <User className="w-4 h-4 text-brand-600"/>
                    <span>Hồ Sơ & Ước Nguyện Của Tôi</span>
                  </Link>

                  <Link
                    href="/passports/"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-warm-800 hover:bg-warm-100 hover:text-brand-700 transition-colors"
                  >
                    <Sparkles className="w-4 h-4 text-brand-600"/>
                    <span>Hộ Chiếu Vật Phẩm</span>
                  </Link>

                  <Link
                    href="/handshake/"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-warm-800 hover:bg-warm-100 hover:text-brand-700 transition-colors"
                  >
                    <HeartHandshake className="w-4 h-4 text-brand-600"/>
                    <span>Trạm Bắt Tay QR</span>
                  </Link>

                  <Link
                    href="/admin/"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-amber-900 bg-amber-50/80 hover:bg-amber-100 transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-600"/>
                    <span>Bàn Quản Trị Tối Cao</span>
                  </Link>

                  <div className="border-t border-warm-100 my-1"/>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                      setCurrentUser(null);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 text-left transition-colors"
                  >
                    <LogOut className="w-4 h-4"/>
                    <span>Đăng Xuất Khỏi Thiết Bị</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={loginWithGoogle}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-warm-200 bg-white hover:bg-warm-50 text-xs font-bold text-warm-800 transition-all shadow-2xs cursor-pointer"
            >
              <span>Đăng Nhập Google</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
