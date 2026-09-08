'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, PlusCircle, QrCode, Compass, UserCheck } from 'lucide-react';

export default function MobileBottomNav() {
  const pathname = usePathname();

  // Ẩn thanh điều hướng chung trên mobile tại trang /create-wish để nhường chỗ hoàn toàn cho Floating Action Dock
  if (pathname === '/create-wish' || pathname === '/create-wish/') {
    return null;
  }

  const isHome = pathname === '/' || pathname === '';
  const isPassports = pathname?.startsWith('/passports');
  const isHandshake = pathname?.startsWith('/handshake');
  const isProfile = pathname?.startsWith('/profile');

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-warm-200 px-2 py-1 shadow-lg">
      <div className="flex items-center justify-around">
        <Link className={`flex flex-col items-center py-1 px-3 ${isHome ? 'text-brand-700 font-bold' : 'text-warm-700 hover:text-brand-600'}`} href="/">
          <Sparkles className="w-5 h-5"/>
          <span className="text-[10px] mt-0.5">Cây Ước</span>
        </Link>
        <Link className={`flex flex-col items-center py-1 px-3 ${isPassports ? 'text-brand-700 font-bold' : 'text-warm-700 hover:text-brand-600'}`} href="/passports/">
          <Compass className="w-5 h-5"/>
          <span className="text-[10px] font-semibold mt-0.5">Hộ Chiếu</span>
        </Link>
        
        <Link className="flex flex-col items-center -mt-5" href="/create-wish/">
          <span className="w-12 h-12 rounded-full bg-gradient-to-tr from-brand-600 to-brand-500 text-white flex items-center justify-center shadow-lg shadow-brand-500/30">
            <PlusCircle className="w-7 h-7"/>
          </span>
          <span className="text-[10px] font-bold text-brand-700 mt-0.5">Gửi Ước</span>
        </Link>

        <Link className={`flex flex-col items-center py-1 px-3 ${isHandshake ? 'text-brand-700 font-bold' : 'text-warm-700 hover:text-brand-600'}`} href="/handshake/">
          <QrCode className="w-5 h-5"/>
          <span className="text-[10px] font-semibold mt-0.5">Bắt Tay</span>
        </Link>
        <Link className={`flex flex-col items-center py-1 px-3 ${isProfile ? 'text-brand-700 font-bold' : 'text-warm-700 hover:text-brand-600'}`} href="/profile/">
          <UserCheck className="w-5 h-5"/>
          <span className="text-[10px] font-semibold mt-0.5">Cá Nhân</span>
        </Link>
      </div>
    </div>
  );
}
