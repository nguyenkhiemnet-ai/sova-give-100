'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, AlertTriangle, CheckCircle2, ChevronRight, X } from 'lucide-react';
import { getFullSiteCMS, BroadcastBannerData } from '@/lib/cms';

export default function BroadcastBanner() {
  const [banner, setBanner] = useState<BroadcastBannerData | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const syncBanner = () => {
    try {
      const cms = getFullSiteCMS();
      if (cms?.broadcast) {
        setBanner(cms.broadcast);
      }
    } catch {}
  };

  useEffect(() => {
    syncBanner();

    const handleUpdate = () => syncBanner();
    window.addEventListener('sova_cms_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('sova_cms_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  if (!banner || !banner.enabled || dismissed) return null;

  const bgStyles = {
    info: 'bg-gradient-to-r from-brand-900 via-brand-800 to-emerald-900 text-white border-b border-brand-700/60',
    alert: 'bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 text-white border-b border-amber-500/60',
    success: 'bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-800 text-white border-b border-emerald-600/60'
  };

  const currentBg = bgStyles[banner.type] || bgStyles.info;

  return (
    <div className={`relative z-50 py-2 px-3 sm:px-6 text-xs font-semibold shadow-xs transition-all animate-in fade-in slide-in-from-top-2 ${currentBg}`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="shrink-0 p-1 rounded-full bg-white/15 text-white">
            {banner.type === 'alert' ? (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-200" />
            ) : banner.type === 'success' ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-brand-200" />
            )}
          </span>
          <p className="truncate text-[11px] sm:text-xs leading-tight font-medium text-white/95">
            {banner.text}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {banner.linkText && banner.linkUrl && (
            <Link
              href={banner.linkUrl}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 hover:bg-white/30 text-white text-[10px] sm:text-[11px] font-black transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
            >
              <span>{banner.linkText}</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          )}

          <button
            onClick={() => setDismissed(true)}
            className="p-1 rounded-full hover:bg-white/20 text-white/70 hover:text-white transition-colors cursor-pointer"
            title="Đóng thông báo này"
            aria-label="Đóng"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
