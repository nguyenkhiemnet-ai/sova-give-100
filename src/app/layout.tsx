import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import React from 'react';

export const metadata: Metadata = {
  title: 'SOVA GIVE 100 - Cây Nguyện Ước Tuần Hoàn 0Đ',
  description: 'Nền tảng kết nối điều ước và kinh tế tuần hoàn vật phẩm 0 đồng - Chuẩn Enterprise ACID 10/10',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="bg-slate-950 text-slate-100 min-h-screen flex flex-col selection:bg-brand-500 selection:text-black">
        <header className="sticky top-0 z-50 glass-panel border-b border-slate-800">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2 group">
                <span className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center font-bold text-slate-950 text-base shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                  S
                </span>
                <div>
                  <h1 className="text-lg font-black tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                    SOVA GIVE 100
                  </h1>
                  <p className="text-[10px] text-slate-400 font-medium leading-none">
                    Cây Nguyện Ước Tuần Hoàn 0Đ
                  </p>
                </div>
              </Link>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Zero-Cash 10/10
              </span>
            </div>

            <nav className="flex items-center gap-1 sm:gap-2 text-sm font-medium">
              <Link
                href="/"
                className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all"
              >
                Cây Nguyện Ước
              </Link>
              <Link
                href="/create-wish"
                className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all"
              >
                Gửi Ước Mơ
              </Link>
              <Link
                href="/handshake"
                className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all"
              >
                Bắt Tay QR
              </Link>
              <Link
                href="/passports"
                className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all"
              >
                Hộ Chiếu Vật Phẩm
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
          {children}
        </main>

        <footer className="border-t border-slate-800/80 glass-panel py-6 text-center text-xs text-slate-500">
          <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p>© 2026 SOVA GIVE 100. Vận hành theo tôn chỉ phi lợi nhuận & Nghị định 93/2021/NĐ-CP.</p>
            <p className="text-slate-400">
              Trọng tài tối cao: <span className="text-emerald-400 font-medium">Nguyễn Khiêm (21/08/1984)</span>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
