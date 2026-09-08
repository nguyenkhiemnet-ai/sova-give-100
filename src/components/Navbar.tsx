'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Sparkles, Search, MapPin, HeartHandshake, ShieldCheck, 
  User, LogOut, ChevronDown, ExternalLink, X, KeyRound
} from 'lucide-react';
import { getActiveUser, setActiveUser, loginWithGoogle, logout, UserProfile, buildUserProfile, isSuperAdminEmail } from '@/lib/auth';
import { VIETNAM_PROVINCES } from '@/lib/provinces';
import { supabase } from '@/lib/supabaseClient';
import AuthModal from '@/components/AuthModal';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('ALL');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'LOGIN' | 'REGISTER' | 'FORGOT' | 'UPDATE_PASSWORD'>('LOGIN');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Lắng nghe sự kiện mở Auth Modal từ bất kỳ nút nào trên website
    const handleOpenAuth = (e: any) => {
      const tab = e?.detail?.tab || 'REGISTER';
      setAuthModalTab(tab);
      setShowAuthModal(true);
    };
    window.addEventListener('sova_open_auth', handleOpenAuth);

    // Kiểm tra nếu URL có chứa token recovery đặt lại mật khẩu
    if (typeof window !== 'undefined') {
      const hash = window.location.hash || '';
      const search = window.location.search || '';
      if (hash.includes('type=recovery') || search.includes('type=recovery')) {
        setAuthModalTab('UPDATE_PASSWORD');
        setShowAuthModal(true);
      }
    }

    // 1. Đồng bộ session tức thì khi Supabase nhận OAuth Token hoặc Recovery Token
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setAuthModalTab('UPDATE_PASSWORD');
        setShowAuthModal(true);
      }

      if (session?.user) {
        const profile = buildUserProfile(session.user);
        setActiveUser(profile);
        setCurrentUser(profile);

        // Dọn dẹp URL hash #access_token khi không ở luồng PASSWORD_RECOVERY
        if (typeof window !== 'undefined' && window.location.hash.includes('access_token') && event !== 'PASSWORD_RECOVERY') {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      }
    });

    // 2. Kiểm tra session hiện hành từ Supabase Auth
    supabase.auth.getUser().then(({ data: { user: sbUser } }) => {
      if (sbUser) {
        const profile = buildUserProfile(sbUser);
        setActiveUser(profile);
        setCurrentUser(profile);
      } else {
        setCurrentUser(getActiveUser());
      }
    });

    const handleAuthChange = () => setCurrentUser(getActiveUser());
    window.addEventListener('sova_auth_change', handleAuthChange);

    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        mobileDropdownRef.current && !mobileDropdownRef.current.contains(e.target as Node)
      ) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('sova_auth_change', handleAuthChange);
      window.removeEventListener('sova_open_auth', handleOpenAuth);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Cuộn trang mượt mà đến Cây Nguyện Ước với độ lệch trừ thanh Header chuẩn xác
  const scrollToWishlist = () => {
    if (pathname !== '/') {
      router.push('/#wishlist-section');
      return;
    }
    const el = document.getElementById('wishlist-section');
    if (el) {
      const isMobile = window.innerWidth < 768;
      const navOffset = isMobile ? 112 : 80;
      const elementTop = el.getBoundingClientRect().top + window.pageYOffset;
      const targetScroll = Math.max(0, elementTop - navOffset);

      if (Math.abs(window.pageYOffset - targetScroll) > 40) {
        window.scrollTo({
          top: targetScroll,
          behavior: 'smooth'
        });
      }
    }
  };

  const handleSearchFocus = () => {
    scrollToWishlist();
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sova_global_search_change', {
        detail: { query: val, province: selectedProvince }
      }));
    }
    scrollToWishlist();
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sova_global_search_change', {
        detail: { query: '', province: selectedProvince }
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
    handleSearchFocus();
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-warm-200/90 shadow-soft">
      {/* ==================== 1. BẢN DESKTOP & TABLET (>= 768px): 1 HÀNG SANG TRỌNG ==================== */}
      <div className="hidden md:flex max-w-7xl mx-auto px-4 sm:px-6 h-18 items-center justify-between gap-4">
        
        {/* LOGO BÊN TRÁI */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-10 h-10 rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-soft group-hover:scale-105 transition-transform">
            <HeartHandshake className="w-5 h-5"/>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-warm-900 text-base tracking-tight leading-none">SOVAHUB.org</span>
              <span className="px-1.5 py-0.5 rounded-md bg-brand-50 text-brand-700 text-[10px] font-black border border-brand-200 leading-none">0-VND</span>
            </div>
            <span className="text-[10px] text-warm-600 font-semibold block mt-0.5">Mạng Lưới Tuần Hoàn Sinh Kế</span>
          </div>
        </Link>

        {/* THANH TÌM KIẾM NỔI BẬT TRUNG TÂM */}
        <div className="flex-1 max-w-2xl mx-2">
          <div className="flex items-center bg-white border-2 border-brand-500 hover:border-brand-600 focus-within:border-brand-600 focus-within:ring-4 focus-within:ring-brand-500/15 rounded-2xl shadow-soft transition-all overflow-hidden p-1 gap-1">
            
            {/* Ô nhập tìm kiếm */}
            <div className="flex items-center flex-1 px-3">
              <Search className="w-4 h-4 text-brand-600 shrink-0 mr-2.5"/>
              <input
                type="text"
                placeholder="Tìm kiếm ước nguyện (xe đạp, laptop, máy may...)"
                value={searchQuery}
                onFocus={handleSearchFocus}
                onClick={handleSearchFocus}
                onChange={e => handleSearchChange(e.target.value)}
                className="w-full bg-transparent text-xs sm:text-sm font-bold text-warm-900 focus:outline-none placeholder:text-warm-400 placeholder:font-normal"
              />
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="p-1 rounded-lg hover:bg-warm-100 text-warm-400 hover:text-warm-700 transition-colors mr-1 cursor-pointer"
                  title="Xóa tìm kiếm"
                >
                  <X className="w-3.5 h-3.5"/>
                </button>
              )}
            </div>

            {/* Vạch ngăn cách */}
            <div className="h-6 w-px bg-warm-200 shrink-0"/>

            {/* Dropdown Tỉnh/Thành */}
            <div className="flex items-center shrink-0 px-2">
              <MapPin className="w-3.5 h-3.5 text-sun-600 mr-1.5 shrink-0"/>
              <select
                value={selectedProvince}
                onChange={e => handleProvinceChange(e.target.value)}
                className="bg-transparent text-xs font-black text-warm-800 focus:outline-none cursor-pointer pr-1"
              >
                <option value="ALL">Toàn quốc</option>
                {VIETNAM_PROVINCES.map(p => (
                  <option key={p.code} value={p.code}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Nút Tìm Kiếm Nổi Bật */}
            <button
              onClick={() => {
                handleSearchChange(searchQuery);
                handleSearchFocus();
              }}
              className="h-9 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-xs hover:scale-[1.02] transition-all shrink-0 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5"/>
              <span>Tìm</span>
            </button>
          </div>
        </div>

        {/* CỤM NÚT BÊN PHẢI */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => {
              if (!currentUser) {
                setAuthModalTab('REGISTER');
                setShowAuthModal(true);
              } else {
                router.push('/create-wish/');
              }
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-black shadow-xs hover:scale-105 transition-all shrink-0 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5"/>
            <span>Gửi Ước Nguyện</span>
          </button>

          {/* User Menu Desktop */}
          {currentUser ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 pr-3 rounded-2xl border border-warm-200 bg-white hover:bg-warm-50 transition-all shadow-2xs cursor-pointer"
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
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-warm-800 hover:bg-warm-100 hover:text-brand-700 transition-colors"
                  >
                    <User className="w-4 h-4 text-brand-600"/>
                    <span>Hồ Sơ & Ước Nguyện Của Tôi</span>
                  </Link>

                  <Link
                    href="/passports/"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-warm-800 hover:bg-warm-100 hover:text-brand-700 transition-colors"
                  >
                    <Sparkles className="w-4 h-4 text-brand-600"/>
                    <span>Hộ Chiếu Vật Phẩm</span>
                  </Link>

                  <Link
                    href="/handshake/"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-warm-800 hover:bg-warm-100 hover:text-brand-700 transition-colors"
                  >
                    <HeartHandshake className="w-4 h-4 text-brand-600"/>
                    <span>Trạm Bắt Tay QR</span>
                  </Link>

                  {currentUser.role === 'SUPER_ADMIN' && (
                    <Link
                      href="/admin/"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-amber-900 bg-amber-50/80 hover:bg-amber-100 transition-colors"
                    >
                      <ShieldCheck className="w-4 h-4 text-amber-600"/>
                      <span>Bàn Quản Trị Tối Cao</span>
                    </Link>
                  )}

                  <div className="border-t border-warm-100 my-1"/>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                      setCurrentUser(null);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 text-left transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4"/>
                    <span>Đăng Xuất Khỏi Thiết Bị</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => {
                setAuthModalTab('LOGIN');
                setShowAuthModal(true);
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl border-2 border-warm-200 bg-white hover:bg-brand-50 hover:border-brand-500 text-xs font-black text-warm-900 transition-all shadow-2xs cursor-pointer group"
            >
              <div className="w-5 h-5 rounded-full bg-brand-50 flex items-center justify-center text-brand-700">
                <User className="w-3.5 h-3.5" />
              </div>
              <span>Đăng Nhập</span>
            </button>
          )}
        </div>

      </div>

      {/* ==================== 2. BẢN MOBILE (< 768px): 2 TẦNG CHUYÊN NGHIỆP NHƯ SHOPEE/TIKI ==================== */}
      <div className="md:hidden">
        {/* TẦNG 1: THƯƠNG HIỆU & CỤM TÁC VỤ */}
        <div className="flex items-center justify-between px-3.5 h-13 border-b border-warm-100/90">
          {/* Logo & Tên Brand */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-soft">
              <HeartHandshake className="w-4 h-4"/>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-warm-900 text-sm tracking-tight">SOVAHUB.org</span>
              <span className="px-1.5 py-0.5 rounded-md bg-brand-50 text-brand-700 text-[10px] font-black border border-brand-200 leading-none">0-VND</span>
            </div>
          </Link>

          {/* Cụm Tác Vụ Phải: Đăng Nhập / Profile Tinh Tế */}
          <div className="flex items-center gap-2">
            {currentUser ? (
              <div className="relative" ref={mobileDropdownRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-1.5 p-1 pr-2.5 rounded-xl border border-warm-200 bg-white hover:bg-warm-50 shadow-2xs"
                >
                  <div className="w-7 h-7 rounded-lg bg-brand-600 text-white text-xs font-black flex items-center justify-center shadow-2xs">
                    {currentUser.avatar || 'K'}
                  </div>
                  <span className="text-[11px] font-black text-warm-900 truncate max-w-[80px]">{currentUser.name.split(' ').pop()}</span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-60 bg-white rounded-3xl border border-warm-200 shadow-xl p-2.5 z-50 animate-in fade-in space-y-1">
                    <div className="p-3 bg-brand-50/60 rounded-2xl border border-brand-100 mb-1">
                      <p className="text-xs font-black text-warm-900">{currentUser.name}</p>
                      <span className="text-[10px] font-bold text-sun-600">{currentUser.karma} ⭐ Karma</span>
                    </div>

                    <Link
                      href="/profile/"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-warm-800 hover:bg-warm-100"
                    >
                      <User className="w-4 h-4 text-brand-600"/>
                      <span>Hồ Sơ Của Tôi</span>
                    </Link>

                    {currentUser.role === 'SUPER_ADMIN' && (
                      <Link
                        href="/admin/"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-amber-900 bg-amber-50"
                      >
                        <ShieldCheck className="w-4 h-4 text-amber-600"/>
                        <span>Bàn Quản Trị</span>
                      </Link>
                    )}

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                        setCurrentUser(null);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 text-left"
                    >
                      <LogOut className="w-4 h-4"/>
                      <span>Đăng Xuất</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => {
                  setAuthModalTab('LOGIN');
                  setShowAuthModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-warm-200 bg-white active:bg-warm-50 text-xs font-black text-warm-900 shadow-2xs cursor-pointer"
              >
                <User className="w-3.5 h-3.5 text-brand-600" />
                <span>Đăng nhập</span>
              </button>
            )}
          </div>
        </div>

        {/* TẦNG 2: THANH TÌM KIẾM TOÀN CHIỀU RỘNG (100% FULL-WIDTH) CÓ CHỌN TỈNH/THÀNH */}
        <div className="p-2.5 bg-white/95">
          <div className="flex items-center bg-white border-2 border-brand-500/80 focus-within:border-brand-600 focus-within:ring-3 focus-within:ring-brand-500/15 rounded-2xl shadow-soft p-1 gap-1 w-full">
            
            {/* Input tìm kiếm */}
            <div className="flex items-center flex-1 pl-2">
              <Search className="w-4 h-4 text-brand-600 shrink-0 mr-1.5"/>
              <input
                type="text"
                placeholder="Tìm xe đạp, laptop, máy may..."
                value={searchQuery}
                onFocus={handleSearchFocus}
                onClick={handleSearchFocus}
                onChange={e => handleSearchChange(e.target.value)}
                className="w-full bg-transparent text-xs font-bold text-warm-900 focus:outline-none placeholder:text-warm-400"
              />
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="p-1 text-warm-400 hover:text-warm-700 active:scale-90"
                >
                  <X className="w-3.5 h-3.5"/>
                </button>
              )}
            </div>

            {/* Dropdown Tỉnh/Thành thu gọn trên mobile */}
            <div className="flex items-center shrink-0 pr-1 pl-1.5 border-l border-warm-200">
              <MapPin className="w-3 h-3 text-sun-600 mr-0.5 shrink-0"/>
              <select
                value={selectedProvince}
                onChange={e => handleProvinceChange(e.target.value)}
                className="bg-transparent text-[11px] font-black text-warm-800 focus:outline-none cursor-pointer max-w-[82px] truncate"
              >
                <option value="ALL">Toàn quốc</option>
                {VIETNAM_PROVINCES.map(p => (
                  <option key={p.code} value={p.code}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Nút Tìm Kiếm Xanh */}
            <button
              onClick={() => {
                handleSearchChange(searchQuery);
                handleSearchFocus();
              }}
              className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center shrink-0 shadow-xs active:scale-95 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5"/>
            </button>
          </div>
        </div>
      </div>

      {/* MODAL ĐĂNG NHẬP / ĐĂNG KÝ / KHÔI PHỤC MẬT KHẨU HIỆN ĐẠI */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        defaultTab={authModalTab}
      />
    </header>
  );
}
