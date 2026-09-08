import type { Metadata, Viewport } from 'next';
import './globals.css';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import BroadcastBanner from '@/components/BroadcastBanner';
import MobileBottomNav from '@/components/MobileBottomNav';
import { Sparkles, PlusCircle, QrCode, Compass, UserCheck, ShieldCheck } from 'lucide-react';

export const viewport: Viewport = {
  themeColor: '#0b1120',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://sovahub.org'),
  title: 'SOVA GIVE 100 - Cây Nguyện Ước Tuần Hoàn 0-VND',
  description: 'Nền tảng tuần hoàn công cụ sinh kế tử tế đạt chuẩn Enterprise ACID 10/10',
  alternates: {
    canonical: 'https://sovahub.org',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SOVAHUB',
  },
  icons: {
    icon: '/logo.svg',
    apple: '/logo.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://bltzkqrjzuplukamvdvb.supabase.co" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://bltzkqrjzuplukamvdvb.supabase.co" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && window.location.hostname.includes('pages.dev')) {
                window.location.replace('https://sovahub.org' + window.location.pathname + window.location.search + (window.location.hash || ''));
              }
            `,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-warm-50 text-warm-900 selection:bg-brand-100 selection:text-brand-900 pb-28 md:pb-0">
        
        {/* GLOBAL BROADCAST BANNER */}
        <BroadcastBanner />

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
            <p className="text-warm-700">
              Hotline hỗ trợ: <a href="tel:0912661558" className="font-bold text-brand-700 hover:underline">0912.661.558</a> • Zalo: <a href="https://zalo.me/0912661558" target="_blank" rel="noopener noreferrer" className="font-bold text-blue-600 hover:underline">0912661558</a>
            </p>
            <p className="text-warm-700">Bản quyền vận hành: <strong className="text-warm-900">Nguyễn Khiêm (21/08/1984)</strong></p>
          </div>
        </footer>

        {/* MOBILE BOTTOM APP BAR */}
        <MobileBottomNav />

      </body>
    </html>
  );
}
