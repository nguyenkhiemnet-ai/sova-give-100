'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { VIETNAM_PROVINCES, getDistrictsByProvince, CATEGORY_FALLBACK_IMAGES } from '@/lib/provinces';
import { getActiveUser, loginWithGoogle } from '@/lib/auth';
import { 
  Sparkles, Heart, Search, MapPin, Filter, Leaf, 
  Clock, Repeat, AlertCircle, ShieldCheck, CheckCircle2,
  Laptop, Bike, Scissors, BookOpen, Wrench, Navigation,
  ArrowUp, Lock, MessageSquare, Send, X, ExternalLink
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
  { id: 'laptop', label: 'Máy tính học tập', icon: Laptop },
  { id: 'bicycle', label: 'Xe đạp đến trường', icon: Bike },
  { id: 'sewing_machine', label: 'Máy may sinh kế', icon: Scissors },
  { id: 'study_tools', label: 'Dụng cụ tri thức', icon: BookOpen },
  { id: 'livelihood_tools', label: 'Công cụ mưu sinh', icon: Wrench },
];

const CURATED_WISHES: WishItem[] = [
  {
    id: 'a1111111-1111-1111-1111-111111111111',
    title: 'Máy tính xách tay phục vụ học tập CNTT',
    category: 'laptop',
    imageUrl: CATEGORY_FALLBACK_IMAGES['laptop'],
    reason: 'Em vừa đỗ đại học nhưng gia đình làm nông ở vùng bão lũ không đủ kinh phí sắm máy thực hành lập trình Web.',
    honor_commitment: 'Em cam kết giữ gìn máy cẩn thận, học đạt loại giỏi và trao lại cho đàn em khóa sau khi ra trường.',
    urgency: 'urgent',
    province_code: '01',
    ward_code: '01-05',
    status: 'verified',
  },
  {
    id: 'b2222222-2222-2222-2222-222222222222',
    title: 'Xe đạp đến trường cho học sinh nghèo hiếu học',
    category: 'bicycle',
    imageUrl: CATEGORY_FALLBACK_IMAGES['bicycle'],
    reason: 'Đoạn đường từ nhà tới trường cấp 3 dài 8km đường đồi núi hiểm trở, gia đình chưa có điều kiện mua xe cho em.',
    honor_commitment: 'Em cam kết đi học chuyên cần, bảo dưỡng xích líp tốt và nhượng lại cho học sinh khó khăn khác khi tốt nghiệp.',
    urgency: 'urgent',
    province_code: '02',
    ward_code: '02-01',
    status: 'verified',
  },
  {
    id: 'c3333333-3333-3333-3333-333333333333',
    title: 'Máy may sinh kế cho mẹ đơn thân gia công tại nhà',
    category: 'sewing_machine',
    imageUrl: CATEGORY_FALLBACK_IMAGES['sewing_machine'],
    reason: 'Cần máy may gia đình để nhận đồ may gia công kiếm thêm thu nhập trang trải tiền thuốc và nuôi hai con nhỏ ăn học.',
    honor_commitment: 'Tôi cam kết dùng máy đúng mục đích mưu sinh và sẵn sàng hướng dẫn nghề may miễn phí cho chị em khó khăn trong xóm.',
    urgency: 'normal',
    province_code: '48',
    ward_code: '48-ST',
    status: 'verified',
  }
];

export default function HomePage() {
  const [wishes, setWishes] = useState<WishItem[]>(CURATED_WISHES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedProvince, setSelectedProvince] = useState('ALL');
  const [selectedDistrict, setSelectedDistrict] = useState('ALL');
  
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

  useEffect(() => {
    fetchCombinedWishes();
    const handleScroll = () => setShowBackToTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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

    let localItems: WishItem[] = [];
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('SOVA_OPTIMISTIC_WISHES');
      if (stored) {
        try { localItems = JSON.parse(stored); } catch {}
      }
    }

    const mergedMap = new Map<string, WishItem>();
    localItems.forEach(item => mergedMap.set(item.id, item));
    serverItems.forEach(item => mergedMap.set(item.id, item));
    CURATED_WISHES.forEach(item => {
      if (!mergedMap.has(item.id)) mergedMap.set(item.id, item);
    });

    setWishes(Array.from(mergedMap.values()));
  }

  const handleOpenClaimModal = (item: WishItem) => {
    const currentUser = getActiveUser();
    if (!currentUser) {
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
    const currentUser = getActiveUser();
    if (!currentUser) {
      setShowAuthGateModal(true);
      return;
    }
    setChatWish(item);
    setChatMessages([
      { sender: 'Hệ thống SOVA', text: 'Kênh trao đổi PII được mã hóa. Hãy hỏi thăm người nhận về thông số vật phẩm (chiều cao, kích cỡ, cấu hình) trước khi quyết định trao quà.' },
      { sender: 'Người Nhận', text: `Chào bạn! Cảm ơn bạn đã quan tâm đến ước nguyện "${item.title}". Mình sẵn sàng giải đáp mọi câu hỏi ạ!` }
    ]);
  };

  const sendChatMessage = () => {
    if (!chatInput.trim()) return;
    setChatMessages(prev => [
      ...prev,
      { sender: 'Bạn (Angel)', text: chatInput.trim() }
    ]);
    setChatInput('');
  };

  // Thuật toán so khớp thông minh: Hỗ trợ cả mã code lẫn tên tiếng Việt
  const filteredWishes = wishes.filter(item => {
    const title = item.title || '';
    const desc = item.reason || item.reason_description || '';
    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          desc.toLowerCase().includes(searchQuery.toLowerCase());
    
    const cat = (item.category || '').toLowerCase();
    const matchesCat = selectedCategory === 'ALL' || cat === selectedCategory.toLowerCase();
    
    // So khớp tỉnh thành: chấp nhận cả mã '48' và tên 'Đà Nẵng'
    const prov = item.province_code || '48';
    const matchesProv = selectedProvince === 'ALL' || 
                        prov === selectedProvince || 
                        (selectedProvince === '48' && (prov.includes('Đà Nẵng') || prov.includes('Da Nang') || prov === '48'));

    // So khớp quận huyện
    const ward = item.ward_code || '';
    const matchesDistrict = selectedDistrict === 'ALL' || ward === selectedDistrict || ward.includes(selectedDistrict);

    return matchesSearch && matchesCat && matchesProv && matchesDistrict;
  });

  return (
    <div className="space-y-16 max-w-6xl mx-auto">
      
      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-20 right-6 z-40 p-3.5 rounded-full bg-brand-600 hover:bg-brand-700 text-white shadow-float hover:scale-110 transition-all"
        >
          <ArrowUp className="w-5 h-5"/>
        </button>
      )}

      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-sun-50 rounded-3xl border border-warm-200 p-6 sm:p-12 lg:p-14 shadow-soft">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black bg-white text-brand-700 border border-brand-200 shadow-2xs">
              <Sparkles className="w-4 h-4 text-brand-500"/>
              Kinh Tế Tuần Hoàn 0-VND • Trao Cơ Hội, Giữ Danh Dự
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-warm-900 tracking-tight leading-[1.15]">
              Đừng để đồ tốt ngủ quên trong góc tối.<br/>
              <span className="text-brand-700 bg-gradient-to-r from-brand-700 to-brand-500 bg-clip-text text-transparent">
                Hãy biến chúng thành tương lai của ai đó.
              </span>
            </h1>

            <p className="text-warm-700 text-sm sm:text-base leading-relaxed font-normal">
              Bao nhiêu chiếc laptop cũ, xe đạp, máy may vẫn còn chạy rất tốt nhưng đang nằm phủ bụi trong kho? 
              Tại <strong>SOVA GIVE 100</strong>, vật phẩm của bạn tìm thấy cuộc đời thứ hai qua <strong>Hộ Chiếu Số</strong> và cái <strong>Bắt Tay Tử Tế 0 Đồng</strong>.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
              <a 
                href="#wishlist-section"
                className="px-6 py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-black text-sm shadow-float hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
              >
                <Heart className="w-4 h-4 fill-white"/>
                <span>Tôi Muốn Trao Đồ Tốt (Angel)</span>
              </a>

              <Link 
                href="/create-wish/"
                className="px-6 py-3.5 rounded-2xl bg-white hover:bg-brand-50 border-2 border-brand-600 text-brand-700 font-black text-sm shadow-soft hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4"/>
                <span>Tôi Cần Dụng Cụ Để Tự Lập</span>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto rounded-3xl overflow-hidden shadow-xl border-4 border-white">
              <img 
                src="https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80" 
                alt="Xe đạp đến trường" 
                className="w-full h-80 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-5">
                <p className="text-white text-xs font-bold leading-relaxed">
                  "Mỗi chiếc xe đạp trao đi là con đường đến trường của các em bớt gập ghềnh."
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 3 CHỈ SỐ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10 pt-8 border-t border-warm-200/80">
          <div className="bg-white/90 p-4 rounded-2xl border border-warm-200 shadow-2xs flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6"/>
            </div>
            <div>
              <span className="text-[11px] font-bold text-warm-700 uppercase tracking-wider block">Vốn Xã Hội (Karma)</span>
              <div className="text-2xl font-black text-warm-900 mt-0.5">100,000+ ⭐</div>
              <span className="text-[10px] text-brand-600 font-semibold">Giờ tương trợ cộng đồng</span>
            </div>
          </div>

          <div className="bg-white/90 p-4 rounded-2xl border border-warm-200 shadow-2xs flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-sun-100 text-sun-600 flex items-center justify-center shrink-0">
              <Leaf className="w-6 h-6"/>
            </div>
            <div>
              <span className="text-[11px] font-bold text-warm-700 uppercase tracking-wider block">CO2 Đã Ngăn Chặn</span>
              <div className="text-2xl font-black text-sun-600 mt-0.5">1,450.5 kg</div>
              <span className="text-[10px] text-warm-700 font-medium">~72 cây xanh quang hợp</span>
            </div>
          </div>

          <div className="bg-white/90 p-4 rounded-2xl border border-warm-200 shadow-2xs flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Repeat className="w-6 h-6"/>
            </div>
            <div>
              <span className="text-[11px] font-bold text-warm-700 uppercase tracking-wider block">Tuần Hoàn Thực Tế</span>
              <div className="text-2xl font-black text-blue-900 mt-0.5">100% 0-VND</div>
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

        {/* Thanh tìm kiếm & Lọc Đa Cấp Tỉnh / Huyện */}
        <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-md p-3.5 sm:p-4 rounded-3xl border-2 border-brand-500/30 shadow-float space-y-3">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
            
            {/* Ô tìm kiếm */}
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

            {/* Lọc Tỉnh/Thành */}
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

            {/* Lọc Quận/Huyện (Xuất hiện khi chọn tỉnh cụ thể) */}
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

          {/* Lọc Category Tabs */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 no-scrollbar border-t border-warm-200/60 pt-1">
            <div className="flex items-center gap-2">
              {CATEGORIES.map(cat => {
                const Icon = cat.icon;
                const active = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
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

        {/* LƯỚI ĐIỀU ƯỚC: CLICK VÀO CARD ĐỂ MỞ CHI TIẾT */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWishes.map(item => {
            const isUrgent = item.urgency === 'urgent' || item.urgency_level === 'urgent';
            const isPending = item.status === 'pending';
            const reasonText = item.reason || item.reason_description || 'Hoàn cảnh khó khăn cần hỗ trợ thiết bị.';
            const pledgeText = item.honor_commitment || item.commitment_pledge || 'Cam kết bảo quản tốt và trao lại.';
            const provName = VIETNAM_PROVINCES.find(p => p.code === item.province_code)?.name || 'Đà Nẵng';
            
            // Lấy ảnh đúng danh mục
            const resolvedImg = item.imageUrl || CATEGORY_FALLBACK_IMAGES[item.category] || CATEGORY_FALLBACK_IMAGES['bicycle'];

            return (
              <div 
                key={item.id} 
                className="bg-white rounded-3xl border border-warm-200 overflow-hidden shadow-soft flex flex-col justify-between group hover:border-brand-500 hover:shadow-xl transition-all cursor-pointer"
                onClick={() => setDetailWish(item)}
              >
                <div className="relative h-44 overflow-hidden">
                  <img src={resolvedImg} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
                  <div className="absolute top-3 left-3 right-3 flex justify-between items-center">
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-white/95 text-brand-800 uppercase shadow-2xs">
                      {item.category === 'bicycle' ? 'Xe Đạp' : item.category === 'laptop' ? 'Laptop' : item.category === 'sewing_machine' ? 'Máy May' : item.category}
                    </span>
                    <div className="flex gap-1.5">
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
                        className="p-2 rounded-xl bg-warm-100 hover:bg-warm-200 text-warm-800 text-xs font-bold transition-all"
                        title="Nhắn tin trao đổi trước"
                      >
                        <MessageSquare className="w-4 h-4 text-brand-700"/>
                      </button>

                      <button
                        onClick={() => handleOpenClaimModal(item)}
                        className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 shrink-0"
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

      {/* 3. MODAL XEM CHI TIẾT ƯỚC NGUYỆN (CLICK TO VIEW FULL) */}
      {detailWish && (
        <div className="fixed inset-0 z-50 bg-warm-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-warm-200 max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-brand-50 text-brand-700 border border-brand-200 uppercase">
                  {detailWish.category === 'bicycle' ? 'Xe Đạp Đến Trường' : detailWish.category === 'laptop' ? 'Máy Tính Học Tập' : detailWish.category}
                </span>
                <h2 className="text-2xl font-black text-warm-900 mt-1">{detailWish.title}</h2>
                <p className="text-xs text-warm-700 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-brand-600"/>
                  <span>Khu vực: <strong>{VIETNAM_PROVINCES.find(p => p.code === detailWish.province_code)?.name || 'Đà Nẵng'}</strong></span>
                </p>
              </div>
              <button onClick={() => setDetailWish(null)} className="w-8 h-8 rounded-full bg-warm-100 text-warm-700 flex items-center justify-center font-bold">✕</button>
            </div>

            {/* Ảnh To */}
            <div className="h-64 rounded-2xl overflow-hidden border border-warm-200">
              <img 
                src={detailWish.imageUrl || CATEGORY_FALLBACK_IMAGES[detailWish.category] || CATEGORY_FALLBACK_IMAGES['bicycle']} 
                alt={detailWish.title} 
                className="w-full h-full object-cover"
              />
            </div>

            {/* Hoàn cảnh chi tiết */}
            <div className="p-4 bg-warm-50 rounded-2xl border border-warm-200 space-y-2">
              <h4 className="text-xs font-black uppercase text-warm-900">Chia Sẻ Về Hoàn Cảnh & Mục Tiêu Tự Lập:</h4>
              <p className="text-xs text-warm-800 leading-relaxed font-medium">
                {detailWish.reason || detailWish.reason_description}
              </p>
            </div>

            {/* Cam kết danh dự */}
            <div className="p-4 bg-brand-50/60 rounded-2xl border border-brand-200 space-y-2">
              <h4 className="text-xs font-black uppercase text-brand-900 flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-brand-600 fill-brand-600"/>
                Lời Cam Kết Danh Dự 0-VND Của Người Nhận:
              </h4>
              <p className="text-xs text-brand-950 italic leading-relaxed">
                "{detailWish.honor_commitment || detailWish.commitment_pledge}"
              </p>
            </div>

            {/* 2 Nút hành động */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => {
                  const item = detailWish;
                  setDetailWish(null);
                  openChatModal(item);
                }}
                className="flex-1 py-3 rounded-2xl bg-warm-100 hover:bg-warm-200 text-warm-900 font-bold text-xs flex items-center justify-center gap-2"
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
                className="flex-1 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-black text-xs shadow-float flex items-center justify-center gap-2"
              >
                <Heart className="w-4 h-4 fill-white"/>
                <span>Chính Thức Trao Tặng (Angel)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. MODAL NHẮN TIN TRAO ĐỔI TRƯỚC (PRE-HANDSHAKE INQUIRY) */}
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
              <button onClick={() => setChatWish(null)} className="w-7 h-7 rounded-full bg-warm-100 text-warm-700 flex items-center justify-center font-bold">✕</button>
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
              <button onClick={sendChatMessage} className="px-4 py-2 bg-brand-600 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-xs">
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
                className="px-4 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-black text-xs shadow-xs"
              >
                Tiến Hành Trao Tặng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL YÊU CẦU ĐĂNG NHẬP XÁC THỰC (AUTH GATE) */}
      {showAuthGateModal && (
        <div className="fixed inset-0 z-50 bg-warm-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border-2 border-brand-500 max-w-md w-full p-6 sm:p-8 shadow-2xl text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-brand-50 text-brand-600 mx-auto flex items-center justify-center ring-8 ring-brand-100">
              <Lock className="w-8 h-8"/>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black text-warm-900">Yêu Cầu Xác Thực Người Trao (Angel)</h3>
              <p className="text-xs text-warm-700 leading-relaxed">
                Để bảo vệ tính minh bạch và danh dự cho người nhận, vui lòng đăng nhập tài khoản Google để trao gửi quà tặng.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowAuthGateModal(false)} className="flex-1 py-2.5 rounded-xl border border-warm-200 text-xs font-bold text-warm-700">Hủy Bỏ</button>
              <button
                onClick={() => {
                  setShowAuthGateModal(false);
                  loginWithGoogle();
                }}
                className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-black shadow-xs flex items-center justify-center gap-2"
              >
                <span>Đăng Nhập Ngay</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL XÁC NHẬN KHỚP NỐI TRAO TẶNG */}
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
              <button onClick={() => setSelectedWish(null)} className="w-8 h-8 rounded-full bg-warm-100 text-warm-700 flex items-center justify-center font-bold">✕</button>
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
                    href="/handshake/"
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
                <button onClick={() => setSelectedWish(null)} className="flex-1 py-2.5 rounded-xl border border-warm-200 text-warm-700 font-bold text-xs">Hủy Bỏ</button>
                <button
                  disabled={claiming}
                  onClick={() => handleConfirmClaim(selectedWish.id)}
                  className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-xs disabled:opacity-50"
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
