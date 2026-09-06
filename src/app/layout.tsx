import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { Sparkles, PlusCircle, QrCode, Compass, UserCheck, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'SOVA GIVE 100 - Cây Nguyện Ước Tuần Hoàn 0-VND',
  description: 'Nền tảng tuần hoàn công cụ sinh kế tử tế đạt chuẩn Enterprise ACID 10/10',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="scroll-smooth">
      <body className="min-h-screen flex flex-col bg-warm-50 text-warm-900 selection:bg-brand-100 selection:text-brand-900 pb-20 md:pb-0">
        
        {/* DYNAMIC NAVBAR */}
        <Navbar />

        {/* NỘI DUNG CHÍNH */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>

        {/* FOOTER */}
        <footer className="hidden md:block border-t border-warm-200 bg-white py-8 text-center text-xs text-warm-700">
          <div className="max-w-7xl mx-auto px-4 space-y-2">
            <div className="flex justify-center items-center gap-2 text-brand-700 font-bold">
              <ShieldCheck className="w-4 h-4"/>
              <span>Enterprise ACID 10/10 • Tuân thủ Nghị định 13/2023/NĐ-CP • Phi Thương Mại 0-VND</span>
            </div>
            <p className="text-warm-700">Bản quyền vận hành: <strong className="text-warm-900">Nguyễn Khiêm (21/08/1984)</strong></p>
          </div>
        </footer>

        {/* MOBILE BOTTOM APP BAR */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-warm-200 px-2 py-1 shadow-lg">
          <div className="flex items-center justify-around">
            <Link className="flex flex-col items-center py-1 px-3 text-brand-700" href="/">
              <Sparkles className="w-5 h-5"/>
              <span className="text-[10px] font-bold mt-0.5">Cây Ước</span>
            </Link>
            <Link className="flex flex-col items-center py-1 px-3 text-warm-700 hover:text-brand-600" href="/passports/">
              <Compass className="w-5 h-5"/>
              <span className="text-[10px] font-semibold mt-0.5">Hộ Chiếu</span>
            </Link>
            
            <Link className="flex flex-col items-center -mt-5" href="/create-wish/">
              <span className="w-12 h-12 rounded-full bg-gradient-to-tr from-brand-600 to-brand-500 text-white flex items-center justify-center shadow-lg shadow-brand-500/30">
                <PlusCircle className="w-7 h-7"/>
              </span>
              <span className="text-[10px] font-bold text-brand-700 mt-0.5">Gửi Ước</span>
            </Link>

            <Link className="flex flex-col items-center py-1 px-3 text-warm-700 hover:text-brand-600" href="/handshake/">
              <QrCode className="w-5 h-5"/>
              <span className="text-[10px] font-semibold mt-0.5">Bắt Tay</span>
            </Link>
            <Link className="flex flex-col items-center py-1 px-3 text-warm-700 hover:text-brand-600" href="/profile/">
              <UserCheck className="w-5 h-5"/>
              <span className="text-[10px] font-semibold mt-0.5">Cá Nhân</span>
            </Link>
          </div>
        </div>

      </body>
    </html>
  );
}
