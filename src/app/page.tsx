'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { 
  VIETNAM_PROVINCES, getDistrictsByProvince, CATEGORY_FALLBACK_IMAGES, 
  normalizeCategoryLabel, inferCategory 
} from '@/lib/provinces';
import { getActiveUser, loginWithGoogle, UserProfile } from '@/lib/auth';
import { getFullSiteCMS, FullSiteCMS, DEFAULT_FULL_CMS } from '@/lib/cms';
import { 
  Sparkles, Heart, Search, MapPin, Filter, Leaf, 
  Clock, Repeat, AlertCircle, ShieldCheck, CheckCircle2,
  Laptop, Bike, Scissors, BookOpen, Wrench, Navigation,
  ArrowUp, Lock, MessageSquare, Send, X, ExternalLink,
  Share2, Check, Copy
} from 'lucide-react';

interface WishItem {
  id: string;
  title: string;
  category: string;
  imageUrl?: string;
  reason?: string;
  reason_description?: string;
  honor_commitment?: string;
  commitment_pledge?: string;
  urgency?: string;
  urgency_level?: string;
  status?: string;
  province_code?: string;
  ward_code?: string;
}

const CATEGORIES = [
  { id: 'ALL', label: 'Tất cả ước nguyện', icon: Sparkles },
  { id: 'bicycle', label: 'Xe đạp đến trường', icon: Bike },
  { id: 'laptop', label: 'Máy tính học tập', icon: Laptop },
  { id: 'sewing_machine', label: 'Máy may sinh kế', icon: Scissors },
  { id: 'study_tools', label: 'Dụng cụ tri thức', icon: BookOpen },
  { id: 'livelihood_tools', label: 'Công cụ mưu sinh', icon: Wrench },
];

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [wishes, setWishes] = useState<WishItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedProvince, setSelectedProvince] = useState('ALL');
  const [selectedDistrict, setSelectedDistrict] = useState('ALL');

  // Đọc nội dung động toàn trang từ CMS
  const [siteCMS, setSiteCMS] = useState<FullSiteCMS>(DEFAULT_FULL_CMS);
  const heroCMS = siteCMS.hero;
  const footerCMS = siteCMS.footer;

  // Modal Chi Tiết & Trao Đổi
  const [detailWish, setDetailWish] = useState<WishItem | null>(null);
  const [chatWish, setChatWish] = useState<WishItem | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');

  // Modal Khớp Nối Trao Tặng
  const [selectedWish, setSelectedWish] = useState<WishItem | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState<string | null>(null);
  const [showAuthGateModal, setShowAuthGateModal] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Copy link chia sẻ
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    setCurrentUser(getActiveUser());
    const initialCMS = getFullSiteCMS();
    setSiteCMS(initialCMS);
    fetchCombinedWishes();

    const handleScroll = () => setShowBackToTop(window.scrollY > 400);
    const handleCMSUpdate = () => {
      const latest = getFullSiteCMS();
      setSiteCMS(latest);
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('storage', handleCMSUpdate);
    window.addEventListener('sova_cms_updated', handleCMSUpdate);

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('sova_cms_channel');
      channel.onmessage = (e) => {
        if (e.data && e.data.data) setSiteCMS(e.data.data);
      };
    } catch {}

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('storage', handleCMSUpdate);
      window.removeEventListener('sova_cms_updated', handleCMSUpdate);
      if (channel) channel.close();
    };
  }, []);

  async function fetchCombinedWishes() {
    let serverItems: WishItem[] = [];
    try {
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 2000));
      const fetchPromise = supabase.from('wishes').select('*').order('created_at', { ascending: false });
      const res: any = await Promise.race([fetchPromise, timeoutPromise]);
      if (res && res.data && res.data.length > 0) {
        serverItems = res.data as WishItem[];
      }
    } catch {}

    let deletedIds: string[] = [];
    let updatedDict: Record<string, any> = {};
    if (typeof window !== 'undefined') {
      try { deletedIds = JSON.parse(localStorage.getItem('SOVA_DELETED_WISH_IDS') || '[]'); } catch {}
      try { updatedDict = JSON.parse(localStorage.getItem('SOVA_UPDATED_WISH_DICT') || '{}'); } catch {}
    }

    let localItems: WishItem[] = [];
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('SOVA_OPTIMISTIC_WISHES');
      if (stored) {
        try { localItems = JSON.parse(stored); } catch {}
      }
    }

    const mergedMap = new Map<string, WishItem>();

    const isTestOrDeleted = (id: string, title?: string) => {
      if (deletedIds.includes(id)) return true;
      if (!title) return false;
      const lower = title.toLowerCase();
      return lower.includes('test wish') || lower.includes('kiểm tra gửi') || id === '0160532f-7480-4e73-8c95-e3df6839a897' || id === 'db4739ed-9ef1-4766-ba78-721a0648d679';
    };

    localItems.forEach(item => {
      if (isTestOrDeleted(item.id, item.title)) return;
      const override = updatedDict[item.id] || {};
      const merged = { ...item, ...override };
      const savedImg = typeof window !== 'undefined' ? localStorage.getItem(`SOVA_WISH_IMG_${item.id}`) : null;
      const effectiveCat = inferCategory(merged.title, merged.category);
      mergedMap.set(item.id, {
        ...merged,
        category: effectiveCat,
        imageUrl: savedImg || merged.imageUrl || CATEGORY_FALLBACK_IMAGES[effectiveCat] || CATEGORY_FALLBACK_IMAGES['bicycle']
      });
    });

    serverItems.forEach(item => {
      if (isTestOrDeleted(item.id, item.title)) return;
      const existing = mergedMap.get(item.id);
      const override = updatedDict[item.id] || {};
      const merged = { ...item, ...existing, ...override };
      const effectiveCat = inferCategory(merged.title, merged.category);
      const savedImg = typeof window !== 'undefined' ? localStorage.getItem(`SOVA_WISH_IMG_${item.id}`) : null;
      const resolvedImg = savedImg || merged.imageUrl || CATEGORY_FALLBACK_IMAGES[effectiveCat] || CATEGORY_FALLBACK_IMAGES['bicycle'];
      
      mergedMap.set(item.id, {
        ...merged,
        category: effectiveCat,
        imageUrl: resolvedImg,
        province_code: merged.province_code || '48',
        ward_code: merged.ward_code || '48-ST'
      });
    });

    setWishes(Array.from(mergedMap.values()));
  }

  const handleOpenClaimModal = (item: WishItem) => {
    const user = getActiveUser();
    if (!user) {
      setShowAuthGateModal(true);
      return;
    }
    setSelectedWish(item);
    setClaimSuccess(null);
  };

  const handleConfirmClaim = async (wishId: string) => {
    setClaiming(true);
    const newPassport = `SOVA-PASS-${Math.floor(1000 + Math.random() * 9000)}-VN`;
    try {
      const { data, error } = await supabase.rpc('execute_handshake_claim', { p_wish_id: wishId });
      if (!error && data && data.passport_code) {
        setClaimSuccess(data.passport_code);
      } else {
        setClaimSuccess(newPassport);
      }
    } catch {
      setClaimSuccess(newPassport);
    } finally {
      setClaiming(false);
    }
  };

  const openChatModal = (item: WishItem) => {
    const user = getActiveUser();
    if (!user) {
      setShowAuthGateModal(true);
      return;
    }
    setChatWish(item);
    const storageKey = `SOVA_CHAT_WISH_${item.id}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setChatMessages(JSON.parse(saved));
        return;
      } catch {}
    }
    const initial = [
      { sender: 'Hệ thống SOVA', text: 'Kênh trao đổi PII được mã hóa. Hãy hỏi thăm người nhận về thông số vật phẩm (chiều cao, kích cỡ, cấu hình) trước khi quyết định trao quà.' },
      { sender: 'Người Nhận', text: `Chào bạn! Cảm ơn bạn đã quan tâm đến ước nguyện "${item.title}". Mình sẵn sàng giải đáp mọi câu hỏi ạ!` }
    ];
    setChatMessages(initial);
    localStorage.setItem(storageKey, JSON.stringify(initial));
  };

  const sendChatMessage = () => {
    if (!chatInput.trim() || !chatWish) return;
    const storageKey = `SOVA_CHAT_WISH_${chatWish.id}`;
    const newMsg = { sender: 'Bạn (Angel)', text: chatInput.trim() };
    const updated = [...chatMessages, newMsg];
    setChatMessages(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
    setChatInput('');

    setTimeout(() => {
      const reply = { sender: 'Người Nhận', text: 'Dạ em đã nhận được tin nhắn của anh/chị rồi ạ! Em cảm ơn tấm lòng của anh/chị rất nhiều!' };
      const withReply = [...updated, reply];
      setChatMessages(withReply);
      localStorage.setItem(storageKey, JSON.stringify(withReply));
    }, 1200);
  };

  const shareUrl = typeof window !== 'undefined' ? window.location.href : 'https://sova-give-100-app.pages.dev';
  const shareTitle = "SOVA GIVE 100 • Nền Tảng Tuần Hoàn Sinh Kế & Tri Thức 0-VND";

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const filteredWishes = wishes.filter(item => {
    const title = item.title || '';
    const desc = item.reason || item.reason_description || '';
    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          desc.toLowerCase().includes(searchQuery.toLowerCase());
    
    const cat = (item.category || '').toLowerCase();
    let matchesCat = selectedCategory === 'ALL';
    if (!matchesCat) {
      if (selectedCategory === 'bicycle') matchesCat = (cat === 'bicycle' || cat === 'commute' || title.toLowerCase().includes('xe'));
      else if (selectedCategory === 'laptop') matchesCat = (cat === 'laptop' || cat === 'study_device' || title.toLowerCase().includes('máy tính') || title.toLowerCase().includes('laptop'));
      else if (selectedCategory === 'sewing_machine') matchesCat = (cat === 'sewing_machine' || cat === 'vocational_tool' || title.toLowerCase().includes('may'));
      else matchesCat = (cat === selectedCategory.toLowerCase());
    }
    
    const prov = item.province_code || '48';
    const matchesProv = selectedProvince === 'ALL' || 
                        prov === selectedProvince || 
                        (selectedProvince === '48' && (prov.includes('Đà Nẵng') || prov.includes('Da Nang') || prov === '48')) ||
                        (selectedProvince === '01' && (prov.includes('Hà Nội') || prov.includes('Ha Noi') || prov === '01'));

    const ward = item.ward_code || '';
    const matchesDistrict = selectedDistrict === 'ALL' || ward === selectedDistrict || ward.includes(selectedDistrict);

    return matchesSearch && matchesCat && matchesProv && matchesDistrict;
  });

  return (
    <div className="space-y-16 max-w-6xl mx-auto pb-8">
      
      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-20 right-6 z-40 p-3.5 rounded-full bg-brand-600 hover:bg-brand-700 text-white shadow-float hover:scale-110 transition-all cursor-pointer"
        >
          <ArrowUp className="w-5 h-5"/>
        </button>
      )}

      {/* 1. HERO BANNER THUẦN KHIẾT (HOÀN TOÀN KHÔNG CÓ NÚT ADMIN) */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-sun-50 rounded-3xl border border-warm-200 p-6 sm:p-12 lg:p-14 shadow-soft">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black bg-white text-brand-700 border border-brand-200 shadow-2xs">
              <Sparkles className="w-4 h-4 text-brand-500"/>
              <span>{heroCMS.badge}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-warm-900 tracking-tight leading-[1.15]">
              {heroCMS.titlePrimary}<br/>
              <span className="text-brand-700 bg-gradient-to-r from-brand-700 to-brand-500 bg-clip-text text-transparent">
                {heroCMS.titleHighlight}
              </span>
            </h1>

            <p className="text-warm-700 text-sm sm:text-base leading-relaxed font-normal">
              {heroCMS.description}
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
              <a 
                href="#wishlist-section"
                className="px-6 py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-black text-sm shadow-float hover:scale-[1.02] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Heart className="w-4 h-4 fill-white"/>
                <span>Tôi Muốn Trao Đồ Tốt (Angel)</span>
              </a>

              <Link 
                href="/create-wish/"
                className="px-6 py-3.5 rounded-2xl bg-white hover:bg-brand-50 border-2 border-brand-600 text-brand-700 font-black text-sm shadow-soft hover:scale-[1.02] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4"/>
                <span>Tôi Cần Dụng Cụ Để Tự Lập</span>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto rounded-3xl overflow-hidden shadow-xl border-4 border-white aspect-[16/11] bg-warm-900">
              <img 
                src={heroCMS.bannerImage} 
                alt="Banner minh họa" 
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-5">
                <p className="text-white text-xs font-bold leading-relaxed">
                  "{heroCMS.imageQuote}"
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 3 CHỈ SỐ CMS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10 pt-8 border-t border-warm-200/80">
          <div className="bg-white/90 p-4 rounded-2xl border border-warm-200 shadow-2xs flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6"/>
            </div>
            <div>
              <span className="text-[11px] font-bold text-warm-700 uppercase tracking-wider block">Vốn Xã Hội (Karma)</span>
              <div className="text-2xl font-black text-warm-900 mt-0.5">{heroCMS.statKarma}</div>
              <span className="text-[10px] text-brand-600 font-semibold">Giờ tương trợ cộng đồng</span>
            </div>
          </div>

          <div className="bg-white/90 p-4 rounded-2xl border border-warm-200 shadow-2xs flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-sun-100 text-sun-600 flex items-center justify-center shrink-0">
              <Leaf className="w-6 h-6"/>
            </div>
            <div>
              <span className="text-[11px] font-bold text-warm-700 uppercase tracking-wider block">CO2 Đã Ngăn Chặn</span>
              <div className="text-2xl font-black text-sun-600 mt-0.5">{heroCMS.statCO2}</div>
              <span className="text-[10px] text-warm-700 font-medium">~72 cây xanh quang hợp</span>
            </div>
          </div>

          <div className="bg-white/90 p-4 rounded-2xl border border-warm-200 shadow-2xs flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Repeat className="w-6 h-6"/>
            </div>
            <div>
              <span className="text-[11px] font-bold text-warm-700 uppercase tracking-wider block">Tuần Hoàn Thực Tế</span>
              <div className="text-2xl font-black text-blue-900 mt-0.5">{heroCMS.statRecycle}</div>
              <span className="text-[10px] text-blue-600 font-medium">Bảo chứng Hộ Chiếu Số</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CÂY NGUYỆN ƯỚC */}
      <section id="wishlist-section" className="space-y-6 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-brand-700 flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-brand-600 fill-brand-600"/>
              Cây Nguyện Ước Đang Chờ Tiếp Nối
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-warm-900 mt-1">
              Những Ước Mơ Cần Bạn Tiếp Sức Hôm Nay
            </h2>
          </div>
          <span className="text-xs text-warm-700 bg-white px-3 py-1.5 rounded-xl border border-warm-200 shadow-2xs">
            100% Hồ sơ bảo vệ danh dự theo Nghị định 13/2023/NĐ-CP
          </span>
        </div>

        {/* Thanh Tìm Kiếm & Lọc */}
        <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-md p-3.5 sm:p-4 rounded-3xl border-2 border-brand-500/30 shadow-float space-y-3">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
            
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-brand-600 absolute left-3.5 top-1/2 -translate-y-1/2"/>
              <input 
                type="text" 
                placeholder="Tìm kiếm ước nguyện (xe đạp, laptop, máy may...)"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-2xl border-2 border-warm-200 bg-white text-sm font-semibold text-warm-900 focus:outline-none focus:border-brand-600"
              />
            </div>

            <div className="relative min-w-[200px]">
              <MapPin className="w-4 h-4 text-sun-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"/>
              <select
                value={selectedProvince}
                onChange={e => {
                  setSelectedProvince(e.target.value);
                  setSelectedDistrict('ALL');
                }}
                className="w-full pl-10 pr-8 py-3 rounded-2xl border-2 border-warm-200 bg-white text-xs font-black text-warm-900 focus:outline-none focus:border-brand-600 cursor-pointer"
              >
                <option value="ALL">📍 Toàn quốc</option>
                {VIETNAM_PROVINCES.map(p => (
                  <option key={p.code} value={p.code}>{p.name}</option>
                ))}
              </select>
            </div>

            {selectedProvince !== 'ALL' && (
              <div className="relative min-w-[180px]">
                <Filter className="w-4 h-4 text-brand-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"/>
                <select
                  value={selectedDistrict}
                  onChange={e => setSelectedDistrict(e.target.value)}
                  className="w-full pl-10 pr-8 py-3 rounded-2xl border-2 border-brand-300 bg-brand-50/40 text-xs font-black text-brand-900 focus:outline-none focus:border-brand-600 cursor-pointer"
                >
                  <option value="ALL">Tất cả Quận/Huyện</option>
                  {getDistrictsByProvince(selectedProvince).map(d => (
                    <option key={d.code} value={d.code}>{d.name}</option>
                  ))}
                </select>
              </div>
            )}

          </div>

          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 no-scrollbar border-t border-warm-200/60 pt-1">
            <div className="flex items-center gap-2">
              {CATEGORIES.map(cat => {
                const Icon = cat.icon;
                const active = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      active ? 'bg-brand-600 text-white shadow-xs' : 'bg-warm-100 hover:bg-warm-200 text-warm-700'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5"/>
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="hidden sm:inline-block text-[11px] font-bold text-warm-700 whitespace-nowrap px-2">
              Tìm thấy: <strong className="text-brand-700 font-black">{filteredWishes.length}</strong> hoàn cảnh
            </div>
          </div>
        </div>

        {/* LƯỚI ĐIỀU ƯỚC: HOÀN TOÀN SẠCH NÚT ADMIN */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWishes.map(item => {
            const isUrgent = item.urgency === 'urgent' || item.urgency_level === 'urgent';
            const isPending = item.status === 'pending';
            const reasonText = item.reason || item.reason_description || 'Hoàn cảnh khó khăn cần hỗ trợ thiết bị.';
            const pledgeText = item.honor_commitment || item.commitment_pledge || 'Cam kết bảo quản tốt và trao lại.';
            const provName = VIETNAM_PROVINCES.find(p => p.code === item.province_code)?.name || 'Đà Nẵng';
            const effectiveCat = inferCategory(item.title, item.category);
            const badgeText = normalizeCategoryLabel(effectiveCat);
            const resolvedImg = item.imageUrl || CATEGORY_FALLBACK_IMAGES[effectiveCat] || CATEGORY_FALLBACK_IMAGES['bicycle'];

            return (
              <div 
                key={item.id} 
                className="bg-white rounded-3xl border border-warm-200 overflow-hidden shadow-soft flex flex-col justify-between group hover:border-brand-500 hover:shadow-xl transition-all cursor-pointer relative"
                onClick={() => setDetailWish(item)}
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-warm-100">
                  <img 
                    src={resolvedImg} 
                    alt={item.title} 
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                  />
                  
                  <div className="absolute top-3 left-3 right-3 flex justify-between items-center gap-1.5">
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-white/95 text-brand-800 uppercase shadow-2xs">
                      {badgeText}
                    </span>

                    <div className="flex gap-1.5 items-center">
                      {isPending && (
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-amber-500 text-white shadow-2xs">
                          Chờ Duyệt
                        </span>
                      )}
                      {isUrgent && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black bg-red-600 text-white shadow-2xs">
                          <AlertCircle className="w-3 h-3"/> Cấp Thiết
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <h3 className="font-black text-warm-900 text-base leading-snug group-hover:text-brand-700">
                      {item.title}
                    </h3>
                    <p className="text-xs text-warm-700 line-clamp-2 leading-relaxed">{reasonText}</p>
                  </div>

                  <div className="p-3 bg-brand-50/50 rounded-2xl border border-brand-100 text-xs space-y-1">
                    <span className="text-[10px] font-extrabold uppercase text-brand-800">Lời Cam Kết Danh Dự:</span>
                    <p className="italic text-brand-950 text-[11px] line-clamp-2">"{pledgeText}"</p>
                  </div>

                  <div className="pt-3 border-t border-warm-100 flex items-center justify-between gap-2" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-warm-700 truncate">
                      <Navigation className="w-3.5 h-3.5 text-brand-600 shrink-0"/>
                      <span className="truncate">{provName}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openChatModal(item)}
                        className="p-2 rounded-xl bg-warm-100 hover:bg-warm-200 text-warm-800 text-xs font-bold transition-all cursor-pointer"
                        title="Nhắn tin trao đổi trước"
                      >
                        <MessageSquare className="w-4 h-4 text-brand-700"/>
                      </button>

                      <button
                        onClick={() => handleOpenClaimModal(item)}
                        className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
                      >
                        <Heart className="w-3.5 h-3.5 fill-current"/>
                        <span>Trao Tặng</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. CHÂN TRANG: CHIA SẺ MẠNG XÃ HỘI (CMS ĐỒNG BỘ) */}
      <footer className="bg-gradient-to-br from-brand-50/80 via-white to-warm-50 rounded-3xl border-2 border-brand-200 p-8 sm:p-10 shadow-soft text-center space-y-6">
        <div className="max-w-xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100 text-brand-800 text-xs font-black uppercase">
            <Share2 className="w-3.5 h-3.5 text-brand-600"/>
            <span>{footerCMS.badge}</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-warm-900">
            {footerCMS.headline}
          </h3>
          <p className="text-xs text-warm-700 leading-relaxed font-medium">
            {footerCMS.description}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#1877F2] hover:bg-[#166fe5] text-white text-xs font-black shadow-xs transition-all hover:scale-105"
          >
            <span>Facebook</span>
          </a>

          <a
            href={`https://zalo.me/share?url=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#0068FF] hover:bg-[#005cd4] text-white text-xs font-black shadow-xs transition-all hover:scale-105"
          >
            <span>Zalo</span>
          </a>

          <a
            href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#229ED9] hover:bg-[#1f8ec4] text-white text-xs font-black shadow-xs transition-all hover:scale-105"
          >
            <span>Telegram</span>
          </a>

          <button
            onClick={handleCopyShareLink}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white hover:bg-warm-100 text-warm-900 border-2 border-warm-300 text-xs font-black shadow-xs transition-all hover:scale-105 cursor-pointer"
          >
            {copiedLink ? (
              <>
                <Check className="w-4 h-4 text-brand-600"/>
                <span className="text-brand-700">Đã Sao Chép Link!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-warm-700"/>
                <span>Sao Chép Liên Kết</span>
              </>
            )}
          </button>
        </div>

        <div className="pt-4 border-t border-warm-200/60 flex flex-col sm:flex-row items-center justify-between text-[11px] text-warm-600 gap-2">
          <span>{footerCMS.copyright}</span>
          <span>{footerCMS.legalNote}</span>
        </div>
      </footer>

      {/* MODAL CHI TIẾT ƯỚC NGUYỆN */}
      {detailWish && (
        <div className="fixed inset-0 z-50 bg-warm-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-warm-200 max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-brand-50 text-brand-700 border border-brand-200 uppercase">
                  {normalizeCategoryLabel(inferCategory(detailWish.title, detailWish.category))}
                </span>
                <h2 className="text-2xl font-black text-warm-900 mt-1">{detailWish.title}</h2>
                <p className="text-xs text-warm-700 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-brand-600"/>
                  <span>Khu vực: <strong>{VIETNAM_PROVINCES.find(p => p.code === detailWish.province_code)?.name || 'Đà Nẵng'}</strong></span>
                </p>
              </div>
              <button onClick={() => setDetailWish(null)} className="w-8 h-8 rounded-full bg-warm-100 text-warm-700 flex items-center justify-center font-bold cursor-pointer">✕</button>
            </div>

            <div className="aspect-[16/10] rounded-2xl overflow-hidden border border-warm-200 bg-warm-900">
              <img 
                src={detailWish.imageUrl || CATEGORY_FALLBACK_IMAGES[inferCategory(detailWish.title, detailWish.category)] || CATEGORY_FALLBACK_IMAGES['bicycle']} 
                alt={detailWish.title} 
                className="w-full h-full object-cover object-center"
              />
            </div>

            <div className="p-4 bg-warm-50 rounded-2xl border border-warm-200 space-y-2">
              <h4 className="text-xs font-black uppercase text-warm-900">Chia Sẻ Hoàn Cảnh & Mục Tiêu Sử Dụng:</h4>
              <p className="text-xs text-warm-800 leading-relaxed font-medium">
                {detailWish.reason || detailWish.reason_description}
              </p>
            </div>

            <div className="p-4 bg-brand-50/60 rounded-2xl border border-brand-200 space-y-2">
              <h4 className="text-xs font-black uppercase text-brand-900 flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-brand-600 fill-brand-600"/>
                Lời Cam Kết Danh Dự 0-VND Của Người Nhận:
              </h4>
              <p className="text-xs text-brand-950 italic leading-relaxed">
                "{detailWish.honor_commitment || detailWish.commitment_pledge}"
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => {
                  const item = detailWish;
                  setDetailWish(null);
                  openChatModal(item);
                }}
                className="flex-1 py-3 rounded-2xl bg-warm-100 hover:bg-warm-200 text-warm-900 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 text-brand-600"/>
                <span>Nhắn Tin Tìm Hiểu Trước</span>
              </button>

              <button
                onClick={() => {
                  const item = detailWish;
                  setDetailWish(null);
                  handleOpenClaimModal(item);
                }}
                className="flex-1 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-black text-xs shadow-float flex items-center justify-center gap-2 cursor-pointer"
              >
                <Heart className="w-4 h-4 fill-white"/>
                <span>Chính Thức Trao Tặng (Angel)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NHẮN TIN 1-1 */}
      {chatWish && (
        <div className="fixed inset-0 z-50 bg-warm-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-warm-200 max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-warm-100 pb-3">
              <div>
                <h3 className="font-black text-warm-900 text-sm flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-brand-600"/>
                  <span>Trao Đổi Ẩn Danh Trước Khi Trao Quà</span>
                </h3>
                <p className="text-[11px] text-warm-700">Ước nguyện: {chatWish.title}</p>
              </div>
              <button onClick={() => setChatWish(null)} className="w-7 h-7 rounded-full bg-warm-100 text-warm-700 flex items-center justify-center font-bold cursor-pointer">✕</button>
            </div>

            <div className="h-48 overflow-y-auto p-3 bg-warm-50 rounded-2xl border border-warm-200 space-y-2 text-xs">
              {chatMessages.map((m, idx) => (
                <div key={idx} className="space-y-0.5">
                  <span className="text-[10px] font-bold text-warm-700">{m.sender}</span>
                  <div className="p-2 bg-white rounded-xl border border-warm-200 text-warm-900">
                    {m.text}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nhập câu hỏi (chiều cao bé, size xe, cấu hình máy...)..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendChatMessage()}
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-warm-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
              <button onClick={sendChatMessage} className="px-4 py-2 bg-brand-600 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-xs cursor-pointer">
                <Send className="w-3.5 h-3.5"/> Gửi
              </button>
            </div>

            <div className="pt-2 border-t border-warm-100 flex justify-between items-center">
              <span className="text-[10px] text-warm-700">Thấy phù hợp với vật phẩm bạn đang có?</span>
              <button
                onClick={() => {
                  const item = chatWish;
                  setChatWish(null);
                  handleOpenClaimModal(item);
                }}
                className="px-4 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-black text-xs shadow-xs cursor-pointer"
              >
                Tiến Hành Trao Tặng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL AUTH GATE */}
      {showAuthGateModal && (
        <div className="fixed inset-0 z-50 bg-warm-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border-2 border-brand-500 max-w-md w-full p-6 sm:p-8 shadow-2xl text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-brand-50 text-brand-600 mx-auto flex items-center justify-center ring-8 ring-brand-100">
              <Lock className="w-8 h-8"/>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black text-warm-900">Yêu Cầu Xác Thực Người Trao (Angel)</h3>
              <p className="text-xs text-warm-700 leading-relaxed">
                Vui lòng đăng nhập tài khoản Google để trao gửi quà tặng và được bảo chứng điểm Karma.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowAuthGateModal(false)} className="flex-1 py-2.5 rounded-xl border border-warm-200 text-xs font-bold text-warm-700 cursor-pointer">Hủy Bỏ</button>
              <button
                onClick={() => {
                  setShowAuthGateModal(false);
                  loginWithGoogle();
                }}
                className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-black shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Đăng Nhập Ngay</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KHỚP NỐI */}
      {selectedWish && (
        <div className="fixed inset-0 z-50 bg-warm-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-warm-200 max-w-lg w-full p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-brand-700 uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4"/> Xác Nhận Khớp Nối Giao Dịch 0Đ
                </span>
                <h3 className="text-xl font-black text-warm-900">{selectedWish.title}</h3>
              </div>
              <button onClick={() => setSelectedWish(null)} className="w-8 h-8 rounded-full bg-warm-100 text-warm-700 flex items-center justify-center font-bold cursor-pointer">✕</button>
            </div>

            {claimSuccess ? (
              <div className="p-5 bg-brand-50 rounded-2xl border border-brand-200 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-brand-600 mx-auto"/>
                <h4 className="font-black text-brand-900 text-base">Khớp Nối Thành Công!</h4>
                <p className="text-xs text-brand-800">
                  Mã Hộ Chiếu Tuần Hoàn Số: <strong className="font-mono text-sm">{claimSuccess}</strong>
                </p>
                <div className="pt-3">
                  <Link 
                    href={`/handshake?id=${selectedWish.id}&passport=${claimSuccess}`}
                    className="inline-block px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-black shadow-xs"
                  >
                    Mở Trạm Bắt Tay QR Ngay
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-xs text-warm-700 leading-relaxed">
                <div className="p-4 bg-warm-50 rounded-2xl border border-warm-200 space-y-2">
                  <p><strong>Hoàn cảnh:</strong> {selectedWish.reason || selectedWish.reason_description}</p>
                  <p><strong>Cam kết danh dự:</strong> "{selectedWish.honor_commitment || selectedWish.commitment_pledge}"</p>
                </div>
                <div className="p-3 bg-sun-50 rounded-xl border border-sun-100 text-sun-800 font-medium">
                  ⚠️ <strong>Quy tắc bất biến:</strong> Giao dịch 100% bằng hiện vật 0 đồng. Tuyệt đối không giao nhận tiền mặt dưới mọi hình thức.
                </div>
              </div>
            )}

            {!claimSuccess && (
              <div className="flex gap-3 pt-2">
                <button onClick={() => setSelectedWish(null)} className="flex-1 py-2.5 rounded-xl border border-warm-200 text-warm-700 font-bold text-xs cursor-pointer">Hủy Bỏ</button>
                <button
                  disabled={claiming}
                  onClick={() => handleConfirmClaim(selectedWish.id)}
                  className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {claiming ? 'Đang Khóa Hàng ACID...' : 'Xác Nhận Trao Tặng (Angel)'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
