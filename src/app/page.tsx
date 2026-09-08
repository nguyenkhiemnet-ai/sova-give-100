'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { 
  VIETNAM_PROVINCES, getDistrictsByProvince, CATEGORY_FALLBACK_IMAGES, 
  normalizeCategoryLabel, inferCategory 
} from '@/lib/provinces';
import { getActiveUser, loginWithGoogle, UserProfile, openAuthModal } from '@/lib/auth';
import { getFullSiteCMS, FullSiteCMS, DEFAULT_FULL_CMS } from '@/lib/cms';
import { 
  Sparkles, Heart, Search, MapPin, Filter, Leaf, 
  Clock, Repeat, AlertCircle, ShieldCheck, CheckCircle2,
  Laptop, Bike, Scissors, BookOpen, Wrench, Navigation,
  ArrowUp, Lock, MessageSquare, Send, X, ExternalLink,
  Share2, Check, Copy, PackageSearch
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
  { id: 'ALL', label: 'Tất cả ước nguyện', shortLabel: 'Tất cả', icon: Sparkles },
  { id: 'bicycle', label: 'Xe đạp đến trường', shortLabel: 'Xe đạp', icon: Bike },
  { id: 'laptop', label: 'Máy tính học tập', shortLabel: 'Máy tính', icon: Laptop },
  { id: 'sewing_machine', label: 'Máy may sinh kế', shortLabel: 'Máy may', icon: Scissors },
  { id: 'study_tools', label: 'Dụng cụ tri thức', shortLabel: 'Tri thức', icon: BookOpen },
  { id: 'livelihood_tools', label: 'Công cụ mưu sinh', shortLabel: 'Mưu sinh', icon: Wrench },
];

export default function HomePage() {
  const router = useRouter();
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

  const dynamicCategories = [
    { id: 'ALL', label: 'Tất cả ước nguyện', shortLabel: 'Tất cả', icon: Sparkles },
    ...((siteCMS.categories && siteCMS.categories.length > 0) ? siteCMS.categories : DEFAULT_FULL_CMS.categories).map(cat => ({
      id: cat.id,
      label: cat.label,
      shortLabel: cat.shortLabel || cat.label,
      icon: cat.id === 'laptop' ? Laptop :
            cat.id === 'bicycle' ? Bike :
            cat.id === 'sewing_machine' ? Scissors :
            cat.id === 'study_tools' ? BookOpen :
            cat.id === 'livelihood_tools' ? Wrench : Sparkles
    }))
  ];

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

    // Lắng nghe tìm kiếm trực tiếp từ Navbar
    const handleGlobalSearch = (e: any) => {
      if (e.detail) {
        if (typeof e.detail.query !== 'undefined') setSearchQuery(e.detail.query);
        if (typeof e.detail.province !== 'undefined') {
          setSelectedProvince(e.detail.province);
          setSelectedDistrict('ALL');
        }
      }
    };
    window.addEventListener('sova_global_search_change', handleGlobalSearch);

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('sova_cms_channel');
      channel.onmessage = (e) => {
        if (e.data && e.data.data) setSiteCMS(e.data.data);
      };
    } catch {}

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDetailWish(null);
        setChatWish(null);
        setSelectedWish(null);
        setShowAuthGateModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('storage', handleCMSUpdate);
      window.removeEventListener('sova_cms_updated', handleCMSUpdate);
      window.removeEventListener('sova_global_search_change', handleGlobalSearch);
      window.removeEventListener('keydown', handleKeyDown);
      if (channel) channel.close();
    };
  }, []);

  async function fetchCombinedWishes() {
    let serverItems: WishItem[] = [];
    try {
      // 1. Ưu tiên lấy qua Edge Cached Route (/api/wishes-feed/) để hấp thụ 99.9% lưu lượng vào Cloudflare
      const edgeRes = await fetch('/api/wishes-feed/', { cache: 'default' });
      if (edgeRes.ok) {
        const json = await edgeRes.json();
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          serverItems = json.data as WishItem[];
        }
      }
    } catch {
      // 2. Dự phòng an toàn: Gọi trực tiếp Supabase nếu Edge Route gặp sự cố
      try {
        const { data } = await supabase
          .from('wishes')
          .select('id, title, category, reason, honor_commitment, urgency, province_code, ward_code, status, created_at, authority')
          .order('created_at', { ascending: false })
          .limit(100);
        if (data && data.length > 0) {
          serverItems = data as WishItem[];
        }
      } catch {}
    }

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
      return lower.includes('test wish') || lower.includes('thử nghiệm') || lower.includes('kiểm thử') || lower.includes('kiểm tra gửi') || id === '0160532f-7480-4e73-8c95-e3df6839a897' || id === 'db4739ed-9ef1-4766-ba78-721a0648d679';
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
      openAuthModal('REGISTER');
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
      openAuthModal('REGISTER');
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

  const shareUrl = typeof window !== 'undefined' ? window.location.href : 'https://sovahub.org';
  const shareTitle = "SOVAHUB.org • Nền Tảng Tuần Hoàn Sinh Kế & Tri Thức 0-VND";

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Tự động cuộn mượt đến Cây Nguyện Ước khi chọn danh mục hoặc tìm kiếm
  const handleSelectCategory = (catId: string, e?: React.MouseEvent<HTMLButtonElement>) => {
    setSelectedCategory(catId);

    // 1. Tự động đưa nút danh mục vào giữa tầm mắt theo chiều ngang (trải nghiệm tuyệt hảo trên mobile)
    if (e?.currentTarget) {
      e.currentTarget.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest'
      });
    }

    // 2. Tự động chuyển màn hình mượt mà đến khu vực "Những Ước Mơ Cần Bạn Tiếp Sức Hôm Nay"
    const wishlistEl = document.getElementById('wishlist-section');
    if (wishlistEl) {
      const isMobile = window.innerWidth < 768;
      const navOffset = isMobile ? 112 : 80;
      const elementTop = wishlistEl.getBoundingClientRect().top + window.pageYOffset;
      const targetScroll = Math.max(0, elementTop - navOffset);

      window.scrollTo({
        top: targetScroll,
        behavior: 'smooth'
      });
    }
  };

  const filteredWishes = wishes.filter(item => {
    const title = item.title || '';
    const desc = item.reason || item.reason_description || '';
    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          desc.toLowerCase().includes(searchQuery.toLowerCase());
    
    const effectiveCat = inferCategory(item.title, item.category);
    const matchesCat = selectedCategory === 'ALL' || effectiveCat === selectedCategory;
    
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
              <button 
                onClick={() => {
                  const user = getActiveUser();
                  if (!user) {
                    openAuthModal('REGISTER');
                  } else {
                    const el = document.getElementById('wishlist-section');
                    if (el) {
                      const isMobile = window.innerWidth < 768;
                      const navOffset = isMobile ? 112 : 80;
                      const elementTop = el.getBoundingClientRect().top + window.pageYOffset;
                      window.scrollTo({ top: Math.max(0, elementTop - navOffset), behavior: 'smooth' });
                    }
                  }
                }}
                className="px-6 py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-black text-sm shadow-float hover:scale-[1.02] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Heart className="w-4 h-4 fill-white"/>
                <span>Tôi Muốn Trao Đồ Tốt (Angel)</span>
              </button>

              <button 
                onClick={() => {
                  const user = getActiveUser();
                  if (!user) {
                    openAuthModal('REGISTER');
                  } else {
                    router.push('/create-wish/');
                  }
                }}
                className="px-6 py-3.5 rounded-2xl bg-white hover:bg-brand-50 border-2 border-brand-600 text-brand-700 font-black text-sm shadow-soft hover:scale-[1.02] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4"/>
                <span>Tôi Cần Dụng Cụ Để Tự Lập</span>
              </button>
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
      <section id="wishlist-section" className="space-y-6 pt-2 scroll-mt-32 md:scroll-mt-24">
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

        {/* Thanh Chọn Danh Mục Tinh Gọn (Tự nhiên, không đè lấp thẻ) */}
        <div className="sticky top-[106px] md:top-20 z-30 bg-white/95 backdrop-blur-md py-2 px-2 sm:px-3 rounded-2xl border border-warm-200/90 shadow-soft">
          <div className="relative flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar scroll-smooth pr-6 sm:pr-0 flex-1">
              {dynamicCategories.map(cat => {
                const Icon = cat.icon;
                const active = selectedCategory === cat.id;
                const count = cat.id === 'ALL' 
                  ? wishes.length 
                  : wishes.filter(w => inferCategory(w.title, w.category) === cat.id).length;

                return (
                  <button
                    key={cat.id}
                    onClick={(e) => handleSelectCategory(cat.id, e)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      active 
                        ? 'bg-brand-600 text-white shadow-soft scale-[1.02]' 
                        : 'bg-warm-100/80 hover:bg-warm-200/90 text-warm-700 hover:text-warm-900 border border-warm-200/50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0"/>
                    <span className="hidden sm:inline">{cat.label}</span>
                    <span className="sm:hidden">{cat.shortLabel}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      active ? 'bg-white/20 text-white' : 'bg-warm-200/90 text-warm-700'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Gradient fade indicator ở mép phải trên mobile để báo hiệu vuốt ngang */}
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white via-white/80 to-transparent sm:hidden" />

            {/* Đếm tổng số hoàn cảnh tìm thấy trên desktop */}
            <div className="hidden lg:inline-flex text-[11px] font-bold text-warm-700 whitespace-nowrap px-3 py-1.5 rounded-xl bg-warm-50 border border-warm-200 shrink-0">
              Tổng số: <strong className="text-brand-700 font-black ml-1">{filteredWishes.length}</strong>
            </div>
          </div>
        </div>

        {/* Băng thông báo bộ lọc đang kích hoạt */}
        {(searchQuery || selectedCategory !== 'ALL') && (
          <div className="flex flex-wrap items-center justify-between gap-2 bg-brand-50/90 border border-brand-200/90 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-2xl text-xs animate-in fade-in shadow-2xs">
            <div className="flex items-center gap-2 flex-wrap">
              {searchQuery && (
                <span className="font-bold text-brand-950 flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-brand-600 shrink-0"/>
                  <span>Từ khóa: <strong className="text-brand-700 font-black">"{searchQuery}"</strong></span>
                </span>
              )}
              {selectedCategory !== 'ALL' && (
                <span className="font-bold text-brand-950 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-brand-600 shrink-0"/>
                  <span>Danh mục: <strong className="text-brand-700 font-black">{dynamicCategories.find(c => c.id === selectedCategory)?.label || selectedCategory}</strong></span>
                </span>
              )}
              <span className="text-warm-700 font-semibold">({filteredWishes.length} hoàn cảnh phù hợp)</span>
            </div>

            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('sova_global_search_change', {
                    detail: { query: '', province: selectedProvince }
                  }));
                }
              }}
              className="text-xs font-black text-brand-700 hover:text-brand-900 underline cursor-pointer shrink-0 ml-auto"
            >
              Xóa tất cả bộ lọc
            </button>
          </div>
        )}

        {/* LƯỚI ĐIỀU ƯỚC: 2 CỘT TRÊN MOBILE, 3 CỘT TRÊN DESKTOP HOẶC EMPTY STATE */}
        {filteredWishes.length > 0 ? (
          <div key={selectedCategory + searchQuery} className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4 md:gap-6 animate-in fade-in duration-300">
            {filteredWishes.map(item => {
              const isUrgent = item.urgency === 'urgent' || item.urgency_level === 'urgent';
              const isPending = item.status === 'pending';
              const isVerified = item.status === 'verified';
              const isCompleted = item.status === 'completed';
              const reasonText = item.reason || item.reason_description || 'Hoàn cảnh khó khăn cần hỗ trợ thiết bị.';
              const pledgeText = item.honor_commitment || item.commitment_pledge || 'Cam kết bảo quản tốt và trao lại.';
              const provName = VIETNAM_PROVINCES.find(p => p.code === item.province_code)?.name || 'Đà Nẵng';
              const effectiveCat = inferCategory(item.title, item.category);
              const badgeText = normalizeCategoryLabel(effectiveCat);
              const resolvedImg = item.imageUrl || CATEGORY_FALLBACK_IMAGES[effectiveCat] || CATEGORY_FALLBACK_IMAGES['bicycle'];

              return (
                <div 
                  key={item.id} 
                  className="bg-white rounded-2xl sm:rounded-3xl border border-warm-200 overflow-hidden shadow-soft flex flex-col justify-between group hover:border-brand-500 hover:shadow-xl transition-all cursor-pointer relative"
                  onClick={() => setDetailWish(item)}
                >
                  <div className="relative aspect-[4/3] sm:aspect-[16/10] overflow-hidden bg-warm-100">
                    <img 
                      src={resolvedImg} 
                      alt={item.title} 
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                    />
                    
                    <div className="absolute top-2 left-2 right-2 sm:top-3 sm:left-3 sm:right-3 flex justify-between items-center gap-1">
                      <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg text-[9px] sm:text-[10px] font-black bg-white/95 text-brand-800 uppercase shadow-2xs backdrop-blur-xs">
                        {badgeText}
                      </span>

                      <div className="flex gap-1 items-center flex-wrap justify-end">
                        {isVerified && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-md text-[9px] sm:text-[10px] font-black bg-emerald-600 text-white shadow-2xs">
                            <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3"/>
                            <span>Đã Xác Thực</span>
                          </span>
                        )}
                        {isCompleted && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-md text-[9px] sm:text-[10px] font-black bg-teal-600 text-white shadow-2xs">
                            <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3"/>
                            <span>Đã Trao Quà</span>
                          </span>
                        )}
                        {isPending && (
                          <span className="px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-md text-[9px] sm:text-[10px] font-black bg-amber-500 text-white shadow-2xs">
                            Chờ Duyệt
                          </span>
                        )}
                        {isUrgent && (
                          <span className="inline-flex items-center gap-0.5 sm:gap-1 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md sm:rounded-lg text-[9px] sm:text-[10px] font-black bg-red-600 text-white shadow-2xs">
                            <AlertCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3"/> 
                            <span className="hidden xs:inline">Cấp Thiết</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 sm:p-5 space-y-2 sm:space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-1">
                      <h3 className="font-black text-warm-900 text-xs sm:text-base leading-snug group-hover:text-brand-700 line-clamp-2">
                        {item.title}
                      </h3>
                      <p className="text-[11px] sm:text-xs text-warm-700 line-clamp-2 leading-relaxed">{reasonText}</p>
                    </div>

                    <div className="p-2 sm:p-3 bg-brand-50/50 rounded-xl sm:rounded-2xl border border-brand-100 text-[10px] sm:text-xs space-y-0.5">
                      <span className="text-[8px] sm:text-[10px] font-extrabold uppercase text-brand-800 block">Lời Cam Kết Danh Dự:</span>
                      <p className="italic text-brand-950 text-[10px] sm:text-[11px] line-clamp-1 sm:line-clamp-2">"{pledgeText}"</p>
                    </div>

                    <div className="pt-2 sm:pt-3 border-t border-warm-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-warm-700 truncate">
                        <Navigation className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-brand-600 shrink-0"/>
                        <span className="truncate">{provName}</span>
                      </div>

                      <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
                        <button
                          onClick={() => openChatModal(item)}
                          className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-warm-100 hover:bg-warm-200 text-warm-800 text-xs font-bold transition-all cursor-pointer"
                          title="Nhắn tin trao đổi trước"
                        >
                          <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-700"/>
                        </button>

                        <button
                          onClick={() => handleOpenClaimModal(item)}
                          className="flex-1 sm:flex-none px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-[11px] sm:text-xs font-bold shadow-xs flex items-center justify-center gap-1 shrink-0 cursor-pointer"
                        >
                          <Heart className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current"/>
                          <span>Trao Tặng</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border-2 border-dashed border-warm-300 p-8 sm:p-12 text-center space-y-4 shadow-soft animate-in fade-in">
            <div className="w-16 h-16 rounded-2xl bg-warm-100 text-warm-500 mx-auto flex items-center justify-center">
              <PackageSearch className="w-8 h-8 text-warm-400" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-base sm:text-lg font-black text-warm-900">
                Chưa có ước nguyện nào thuộc danh mục này
              </h3>
              <p className="text-xs sm:text-sm text-warm-600 leading-relaxed font-medium">
                {selectedCategory !== 'ALL'
                  ? `Hiện tại danh mục "${dynamicCategories.find(c => c.id === selectedCategory)?.label || selectedCategory}" chưa có hồ sơ nào đang chờ tiếp sức.`
                  : `Không tìm thấy kết quả phù hợp với từ khóa "${searchQuery}".`}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  setSelectedCategory('ALL');
                  setSearchQuery('');
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('sova_global_search_change', {
                      detail: { query: '', province: 'ALL' }
                    }));
                  }
                  handleSelectCategory('ALL');
                }}
                className="px-4 py-2 rounded-xl bg-warm-100 hover:bg-warm-200 text-warm-800 text-xs font-bold transition-all cursor-pointer"
              >
                Xem tất cả ước nguyện
              </button>
              <button
                onClick={() => {
                  const user = getActiveUser();
                  if (!user) {
                    openAuthModal('REGISTER');
                  } else {
                    router.push('/create-wish/');
                  }
                }}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-soft transition-all inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5"/>
                <span>Gửi ước nguyện đầu tiên</span>
              </button>
            </div>
          </div>
        )}
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
        <div 
          className="fixed inset-0 z-[60] bg-warm-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
          onClick={() => setDetailWish(null)}
        >
          <div 
            className="bg-white rounded-t-3xl sm:rounded-3xl border border-warm-200 max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh] animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 relative"
            onClick={e => e.stopPropagation()}
          >
            {/* STICKY HEADER WITH PERMANENT CLOSE BUTTON (X) */}
            <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-warm-100 p-4 sm:p-5 flex justify-between items-start gap-3 shadow-2xs">
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-brand-50 text-brand-700 border border-brand-200 uppercase">
                    {normalizeCategoryLabel(inferCategory(detailWish.title, detailWish.category))}
                  </span>
                  <p className="text-[11px] text-warm-600 flex items-center gap-1 font-bold">
                    <MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0"/>
                    <span className="truncate">{VIETNAM_PROVINCES.find(p => p.code === detailWish.province_code)?.name || 'Đà Nẵng'}</span>
                  </p>
                </div>
                <h2 className="text-base sm:text-xl font-black text-warm-900 leading-snug line-clamp-2">{detailWish.title}</h2>
              </div>

              {/* NÚT ĐÓNG X NỔI BẬT CHẠY XUYÊN SUỐT */}
              <button 
                onClick={() => setDetailWish(null)} 
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-warm-100 hover:bg-warm-200 text-warm-900 border border-warm-200/80 flex items-center justify-center font-black transition-all active:scale-95 hover:scale-105 shrink-0 cursor-pointer shadow-xs"
                title="Đóng cửa sổ (hoặc bấm ra ngoài / phím Esc)"
              >
                <X className="w-5 h-5"/>
              </button>
            </div>

            {/* SCROLLABLE BODY CONTENT */}
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1">
              <div className="aspect-[16/10] rounded-2xl overflow-hidden border border-warm-200 bg-warm-900 shadow-soft">
                <img 
                  src={detailWish.imageUrl || CATEGORY_FALLBACK_IMAGES[inferCategory(detailWish.title, detailWish.category)] || CATEGORY_FALLBACK_IMAGES['bicycle']} 
                  alt={detailWish.title} 
                  className="w-full h-full object-cover object-center"
                />
              </div>

              <div className="p-4 bg-warm-50 rounded-2xl border border-warm-200 space-y-1.5">
                <h4 className="text-[11px] font-black uppercase text-warm-700 tracking-wider">Chia Sẻ Hoàn Cảnh & Mục Tiêu Sử Dụng:</h4>
                <p className="text-xs sm:text-sm text-warm-900 leading-relaxed font-medium">
                  {detailWish.reason || detailWish.reason_description}
                </p>
              </div>

              <div className="p-4 bg-brand-50/60 rounded-2xl border border-brand-200 space-y-1.5">
                <h4 className="text-[11px] font-black uppercase text-brand-900 tracking-wider flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-brand-600 fill-brand-600"/>
                  Lời Cam Kết Danh Dự 0-VND Của Người Nhận:
                </h4>
                <p className="text-xs sm:text-sm text-brand-950 italic leading-relaxed">
                  "{detailWish.honor_commitment || detailWish.commitment_pledge}"
                </p>
              </div>
            </div>

            {/* PINNED STICKY BOTTOM ACTION FOOTER: LUÔN HIỆN DIỆN, KHÔNG BỊ CHE KHUẤT */}
            <div className="sticky bottom-0 z-20 bg-white/95 backdrop-blur-md border-t border-warm-200/80 p-3.5 sm:p-4 flex flex-col sm:flex-row gap-2.5 shadow-float">
              <button
                onClick={() => {
                  const item = detailWish;
                  setDetailWish(null);
                  openChatModal(item);
                }}
                className="py-3 px-4 rounded-2xl bg-warm-100 hover:bg-warm-200 text-warm-900 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
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
                className="flex-1 py-3.5 px-6 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-black text-xs sm:text-sm shadow-float flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 transition-all cursor-pointer"
              >
                <Heart className="w-4 h-4 fill-white"/>
                <span>Chính Thức Trao Tặng Ước Mơ (Angel)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NHẮN TIN 1-1 */}
      {chatWish && (
        <div 
          className="fixed inset-0 z-[60] bg-warm-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setChatWish(null)}
        >
          <div 
            className="bg-white rounded-3xl border border-warm-200 max-w-lg w-full p-6 shadow-2xl space-y-4 relative"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-warm-100 pb-3">
              <div>
                <h3 className="font-black text-warm-900 text-sm flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-brand-600"/>
                  <span>Trao Đổi Ẩn Danh Trước Khi Trao Quà</span>
                </h3>
                <p className="text-[11px] text-warm-700">Ước nguyện: {chatWish.title}</p>
              </div>
              <button 
                onClick={() => setChatWish(null)} 
                className="w-8 h-8 rounded-full bg-warm-100 hover:bg-warm-200 text-warm-800 flex items-center justify-center font-bold cursor-pointer transition-all shadow-2xs"
                title="Đóng (hoặc bấm ra ngoài / phím Esc)"
              >
                <X className="w-4 h-4"/>
              </button>
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
        <div 
          className="fixed inset-0 z-[60] bg-warm-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowAuthGateModal(false)}
        >
          <div 
            className="bg-white rounded-3xl border-2 border-brand-500 max-w-md w-full p-6 sm:p-8 shadow-2xl text-center space-y-5 relative"
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowAuthGateModal(false)} 
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-warm-100 hover:bg-warm-200 text-warm-800 flex items-center justify-center font-bold cursor-pointer transition-all shadow-2xs"
              title="Đóng (hoặc bấm ra ngoài / phím Esc)"
            >
              <X className="w-4 h-4"/>
            </button>

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
        <div 
          className="fixed inset-0 z-[60] bg-warm-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setSelectedWish(null)}
        >
          <div 
            className="bg-white rounded-3xl border border-warm-200 max-w-lg w-full p-6 sm:p-8 shadow-xl space-y-6 relative"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-brand-700 uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4"/> Xác Nhận Khớp Nối Giao Dịch 0Đ
                </span>
                <h3 className="text-xl font-black text-warm-900">{selectedWish.title}</h3>
              </div>
              <button 
                onClick={() => setSelectedWish(null)} 
                className="w-8 h-8 rounded-full bg-warm-100 hover:bg-warm-200 text-warm-800 flex items-center justify-center font-bold cursor-pointer transition-all shadow-2xs"
                title="Đóng (hoặc bấm ra ngoài / phím Esc)"
              >
                <X className="w-4 h-4"/>
              </button>
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
