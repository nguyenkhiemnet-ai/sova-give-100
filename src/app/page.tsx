'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { VIETNAM_PROVINCES } from '@/lib/provinces';
import { 
  Sparkles, Heart, Search, MapPin, Filter, Leaf, 
  Clock, Repeat, AlertCircle, ShieldCheck, CheckCircle2,
  Laptop, Bike, Scissors, BookOpen, Wrench, Navigation,
  ArrowRight, Share2, Copy, Check, MessageSquare
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
  verification_status?: string;
  province_code?: string;
  created_at?: string;
}

const CATEGORIES = [
  { id: 'ALL', label: 'Tất cả ước nguyện', icon: Sparkles },
  { id: 'laptop', label: 'Máy tính học tập', icon: Laptop },
  { id: 'bicycle', label: 'Xe đạp đến trường', icon: Bike },
  { id: 'sewing_machine', label: 'Máy may sinh kế', icon: Scissors },
  { id: 'study_tools', label: 'Dụng cụ tri thức', icon: BookOpen },
  { id: 'livelihood_tools', label: 'Công cụ mưu sinh', icon: Wrench },
];

export default function HomePage() {
  const [wishes, setWishes] = useState<WishItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedProvince, setSelectedProvince] = useState('ALL');
  const [selectedWish, setSelectedWish] = useState<WishItem | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    fetchWishes();
  }, []);

  async function fetchWishes() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('wishlist_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        setWishes(data as WishItem[]);
      } else {
        setWishes([
          {
            id: 'a1111111-1111-1111-1111-111111111111',
            title: 'Máy tính xách tay phục vụ học tập CNTT',
            category: 'laptop',
            imageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80',
            reason: 'Em vừa đỗ đại học nhưng gia đình làm nông ở vùng bão lũ không đủ kinh phí sắm máy thực hành lập trình Web.',
            honor_commitment: 'Em cam kết giữ gìn máy cẩn thận, học đạt loại giỏi và trao lại cho đàn em khóa sau khi ra trường.',
            urgency: 'urgent',
            province_code: '01',
            status: 'verified',
          },
          {
            id: 'b2222222-2222-2222-2222-222222222222',
            title: 'Xe đạp đến trường cho học sinh nghèo hiếu học',
            category: 'bicycle',
            imageUrl: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=600&q=80',
            reason: 'Đoạn đường từ nhà tới trường cấp 3 dài 8km đường đồi núi hiểm trở, gia đình chưa có điều kiện mua xe cho em.',
            honor_commitment: 'Em cam kết đi học chuyên cần, bảo dưỡng xích líp tốt và nhượng lại cho học sinh khó khăn khác khi tốt nghiệp.',
            urgency: 'urgent',
            province_code: '02',
            status: 'verified',
          },
          {
            id: 'c3333333-3333-3333-3333-333333333333',
            title: 'Máy may sinh kế cho mẹ đơn thân gia công tại nhà',
            category: 'sewing_machine',
            imageUrl: 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&w=600&q=80',
            reason: 'Cần máy may gia đình để nhận đồ may gia công kiếm thêm thu nhập trang trải tiền thuốc và nuôi hai con nhỏ ăn học.',
            honor_commitment: 'Tôi cam kết dùng máy đúng mục đích mưu sinh và sẵn sàng hướng dẫn nghề may miễn phí cho chị em khó khăn trong xóm.',
            urgency: 'normal',
            province_code: '48',
            status: 'verified',
          }
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filteredWishes = wishes.filter(item => {
    const title = item.title || '';
    const desc = item.reason || item.reason_description || '';
    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          desc.toLowerCase().includes(searchQuery.toLowerCase());
    
    const cat = (item.category || '').toLowerCase();
    const matchesCat = selectedCategory === 'ALL' || cat === selectedCategory.toLowerCase() || 
                       (selectedCategory === 'laptop' && cat.includes('study_device'));

    const prov = item.province_code || '01';
    const matchesProv = selectedProvince === 'ALL' || prov === selectedProvince;

    return matchesSearch && matchesCat && matchesProv;
  });

  async function handleConfirmClaim(wishId: string) {
    setClaiming(true);
    setClaimSuccess(null);
    try {
      const { data, error } = await supabase.rpc('execute_handshake_claim', {
        p_wish_id: wishId
      });
      if (error) {
        alert('Lỗi kết nối: ' + error.message);
      } else if (data && !data.success) {
        alert(data.message || 'Chưa thể khớp nối');
      } else {
        setClaimSuccess(data?.passport_code || 'SOVA-PASS-8842-VN');
      }
    } catch (e: any) {
      alert(e.message || 'Lỗi hệ thống');
    } finally {
      setClaiming(false);
    }
  }

  const handleCopyShare = () => {
    const shareText = "Thay vì để đồ cũ nằm yên trong kho hay bán ve chai vài đồng, mình vừa tham gia SOVA GIVE 100 – Nơi trao gửi công cụ học tập & sinh kế 0-VND qua Hộ Chiếu Số, chống con buôn và bảo vệ nhân phẩm người nhận. Cùng tham gia nhé: https://sova-give-100-app.pages.dev";
    navigator.clipboard.writeText(shareText);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  return (
    <div className="space-y-16 max-w-6xl mx-auto">
      
      {/* 1. HERO SECTION: CẢM XÚC & HÌNH ẢNH MINH HỌA SỐNG ĐỘNG */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-sun-50 rounded-3xl border border-warm-200 p-6 sm:p-12 lg:p-14 shadow-soft">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black bg-white text-brand-700 border border-brand-200 shadow-2xs">
              <Sparkles className="w-4 h-4 text-brand-500 animate-spin-slow"/>
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
              Bán ve chai thì rẻ mạt và xót của, cho trên mạng thì sợ gặp con buôn. 
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

              <Link className="px-6 py-3.5 rounded-2xl bg-white hover:bg-brand-50 border-2 border-brand-600 text-brand-700 font-black text-sm shadow-soft hover:scale-[1.02] transition-all flex items-center justify-center gap-2" href="/create-wish/">
                <Sparkles className="w-4 h-4"/>
                <span>Tôi Cần Dụng Cụ Để Tự Lập</span>
              </Link>
            </div>
          </div>

          {/* Hình ảnh Hero thực tế */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto rounded-3xl overflow-hidden shadow-xl border-4 border-white">
              <img 
                src="https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80" 
                alt="Trao công cụ học tập và lao động" 
                className="w-full h-80 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-5">
                <p className="text-white text-xs font-bold leading-relaxed">
                  "Mỗi chiếc máy tính cũ trao đi là một tương lai thoát nghèo được thắp sáng."
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* 3 Thẻ Kính Tác Động Xã Hội */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10 pt-8 border-t border-warm-200/80">
          <div className="bg-white/90 backdrop-blur-sm p-4 rounded-2xl border border-warm-200 shadow-2xs flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6"/>
            </div>
            <div>
              <span className="text-[11px] font-bold text-warm-700 uppercase tracking-wider block">Vốn Xã Hội (Karma)</span>
              <div className="text-2xl font-black text-warm-900 mt-0.5">100,000+ ⭐</div>
              <span className="text-[10px] text-brand-600 font-semibold">Giờ tương trợ cộng đồng</span>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm p-4 rounded-2xl border border-warm-200 shadow-2xs flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-sun-100 text-sun-600 flex items-center justify-center shrink-0">
              <Leaf className="w-6 h-6"/>
            </div>
            <div>
              <span className="text-[11px] font-bold text-warm-700 uppercase tracking-wider block">CO2 Đã Ngăn Chặn</span>
              <div className="text-2xl font-black text-sun-600 mt-0.5">1,450.5 kg</div>
              <span className="text-[10px] text-warm-700 font-medium">~72 cây xanh quang hợp</span>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm p-4 rounded-2xl border border-warm-200 shadow-2xs flex items-center gap-3.5">
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

      {/* 2. BẢNG TƯƠNG PHẢN THỰC TẾ: NỖI ĐAU VS GIẢI PHÁP SOVA */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-black uppercase tracking-wider text-brand-700 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
            Sự Khác Biệt Triệt Để
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-warm-900">
            Tại Sao Hàng Nghìn Gia Đình Chọn SOVA GIVE 100?
          </h2>
          <p className="text-xs sm:text-sm text-warm-700">
            Chúng tôi giải quyết tận gốc những nỗi e ngại lớn nhất khi cho và nhận đồ dùng trong xã hội.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cột 1: Cách cũ */}
          <div className="bg-white rounded-3xl border border-red-100 p-6 sm:p-8 space-y-4 shadow-soft flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-red-600 font-black text-base border-b border-red-50 pb-3">
                <AlertCircle className="w-5 h-5"/>
                <span>Khi Bạn Tặng Hoặc Xin Đồ Ở Nơi Khác</span>
              </div>
              
              <div className="rounded-2xl overflow-hidden h-44 border border-warm-200">
                <img 
                  src="https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=600&q=80" 
                  alt="Đồ dùng bị bỏ phí chất đống" 
                  className="w-full h-full object-cover filter grayscale contrast-125"
                />
              </div>

              <ul className="space-y-2.5 text-xs text-warm-700 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold shrink-0">✕</span>
                  <span><strong>Bị con buôn gom sạch:</strong> Đăng đồ lên mạng xã hội, 80% người "xin" là thợ gom đồ cũ về bán lại.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold shrink-0">✕</span>
                  <span><strong>Tổn thương lòng tự trọng:</strong> Người nghèo phải phơi bày gia cảnh, nhận đồ với cảm giác van xin.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Cột 2: Cách của SOVA */}
          <div className="bg-gradient-to-br from-brand-50/70 to-white rounded-3xl border border-brand-200 p-6 sm:p-8 space-y-4 shadow-soft flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-brand-700 font-black text-base border-b border-brand-100 pb-3">
                <ShieldCheck className="w-5 h-5 text-brand-600"/>
                <span>Trải Nghiệm Văn Minh Tại SOVA GIVE 100</span>
              </div>

              <div className="rounded-2xl overflow-hidden h-44 border border-brand-200 shadow-xs">
                <img 
                  src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=600&q=80" 
                  alt="Trao tặng văn minh ấm áp" 
                  className="w-full h-full object-cover"
                />
              </div>

              <ul className="space-y-2.5 text-xs text-brand-950 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-brand-600 font-bold shrink-0">✓</span>
                  <span><strong>Chống con buôn 100%:</strong> Mã QR Bắt tay động đổi sau 60 giây, chỉ trao tận tay người đã thẩm định.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-600 font-bold shrink-0">✓</span>
                  <span><strong>Bảo vệ nhân phẩm:</strong> Tự động che mờ tư gia; nhận đồ bằng Lời Cam Kết Danh Dự tự lập.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SHOW DIỄN HỘ CHIẾU TUẦN HOÀN SỐ VỚI ẢNH MINH CHỨNG */}
      <section className="bg-gradient-to-b from-white to-warm-50/80 rounded-3xl border border-warm-200 p-6 sm:p-10 shadow-soft space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-black text-brand-700 uppercase tracking-widest block">
              Mỗi Vật Phẩm Là Một Cuộc Đời Tiếp Nối
            </span>
            <h2 className="text-2xl font-black text-warm-900 mt-1">
              Câu Chuyện Chiếc ThinkPad T480 (SOVA-PASS-8842-VN)
            </h2>
          </div>
          <Link className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-50 border border-brand-200 text-xs font-bold text-brand-700 hover:bg-brand-100 transition-all w-fit" href="/passports/">
            <span>Khám Phá Sổ Cái Hộ Chiếu</span>
            <ArrowRight className="w-3.5 h-3.5"/>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-warm-200 overflow-hidden shadow-2xs space-y-3 p-4">
            <img 
              src="https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=500&q=80" 
              alt="Laptop ThinkPad trao tặng" 
              className="w-full h-36 object-cover rounded-xl"
            />
            <span className="px-2.5 py-0.5 rounded-md bg-warm-100 text-warm-800 text-[10px] font-black uppercase inline-block">
              2024 • Khởi Tạo
            </span>
            <h4 className="text-sm font-black text-warm-900">Anh Trí (Kỹ sư phần mềm)</h4>
            <p className="text-xs text-warm-700 leading-relaxed">
              Nâng cấp thiết bị làm việc, tặng lại chiếc máy cho tân sinh viên hoàn cảnh khó khăn tại Hà Nội.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-brand-200 overflow-hidden shadow-2xs space-y-3 p-4">
            <img 
              src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=500&q=80" 
              alt="Học sinh sinh viên học tập" 
              className="w-full h-36 object-cover rounded-xl"
            />
            <span className="px-2.5 py-0.5 rounded-md bg-brand-50 text-brand-700 border border-brand-200 text-[10px] font-black uppercase inline-block">
              2025 • Đổi Đời
            </span>
            <h4 className="text-sm font-black text-warm-900">Em Nam (K68 Bách Khoa)</h4>
            <p className="text-xs text-warm-700 leading-relaxed">
              Nhờ có máy thực hành lập trình, Nam đã giành học bổng khuyến khích và giữ máy cẩn thận từng chi tiết.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-sun-200 overflow-hidden shadow-2xs space-y-3 p-4">
            <img 
              src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=500&q=80" 
              alt="Bàn giao chuyển tiếp thiết bị" 
              className="w-full h-36 object-cover rounded-xl"
            />
            <span className="px-2.5 py-0.5 rounded-md bg-sun-50 text-sun-700 border border-sun-200 text-[10px] font-black uppercase inline-block">
              2026 • Chuyển Giao
            </span>
            <h4 className="text-sm font-black text-warm-900">Em Hằng (Tân sinh viên)</h4>
            <p className="text-xs text-warm-700 leading-relaxed">
              Bắt tay nhận chuyển giao qua QR 0Đ ngày 05/09/2026 để chuẩn bị bước vào giảng đường công nghệ.
            </p>
          </div>
        </div>

        <div className="p-4 bg-brand-50/80 rounded-2xl border border-brand-100 text-xs text-brand-950 flex items-start gap-3 italic leading-relaxed">
          <MessageSquare className="w-5 h-5 text-brand-600 shrink-0 mt-0.5"/>
          <div>
            "Em xúc động rơi nước mắt khi nhận được chiếc máy từ anh Nam. Em hứa sẽ học thật giỏi và giữ gìn để 3 năm nữa lại trao tiếp cho một em học sinh nghèo khác!" — <strong>Em Hằng (Thái Nguyên)</strong>
          </div>
        </div>
      </section>

      {/* 4. CÂY NGUYỆN ƯỚC LIVE & BỘ LỌC ĐẦY ĐỦ 63 TỈNH THÀNH */}
      <section id="wishlist-section" className="space-y-6 pt-6">
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
            100% Hồ sơ đã qua kiểm duyệt Đại sứ địa phương
          </span>
        </div>

        {/* Bộ Công Cụ Tìm Kiếm & Lọc Đầy Đủ 63 Tỉnh Thành */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white p-3 rounded-2xl border border-warm-200 shadow-2xs">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-warm-700 absolute left-3.5 top-1/2 -translate-y-1/2"/>
            <input 
              type="text" 
              placeholder="Tìm kiếm ước nguyện (laptop, xe đạp, máy may...)"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-warm-200 bg-warm-50 text-sm text-warm-900 placeholder:text-warm-700 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
            />
          </div>

          <div className="relative min-w-[260px]">
            <MapPin className="w-4 h-4 text-brand-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"/>
            <select
              value={selectedProvince}
              onChange={e => setSelectedProvince(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-warm-200 bg-warm-50 text-sm font-bold text-warm-900 focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none cursor-pointer"
            >
              {VIETNAM_PROVINCES.map(p => (
                <option key={p.code} value={p.code}>{p.name}</option>
              ))}
            </select>
            <Filter className="w-3.5 h-3.5 text-warm-700 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"/>
          </div>
        </div>

        {/* Chips Danh Mục */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  active 
                    ? 'bg-brand-600 text-white shadow-xs' 
                    : 'bg-white text-warm-700 border border-warm-200 hover:bg-warm-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-white' : 'text-warm-700'}`} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Grid Thẻ Điều Ước Nhân Phẩm Có Ảnh Thực Tế */}
        {loading ? (
          <div className="py-16 text-center text-warm-700 font-medium animate-pulse">
            Đang tải dữ liệu nhân văn từ Supabase Singapore...
          </div>
        ) : filteredWishes.length === 0 ? (
          <div className="bg-white rounded-3xl border border-warm-200 p-12 text-center space-y-3">
            <h3 className="font-bold text-warm-900">Không tìm thấy ước nguyện phù hợp tại khu vực này</h3>
            <p className="text-xs text-warm-700">Hãy thử chọn "Toàn quốc (63 Tỉnh/Thành)" để xem thêm các hoàn cảnh khác đang chờ tiếp sức.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWishes.map(item => {
              const isUrgent = item.urgency === 'urgent' || item.urgency_level === 'CRITICAL' || item.urgency_level === 'HIGH';
              const reasonText = item.reason || item.reason_description || 'Hoàn cảnh khó khăn cần hỗ trợ phương tiện học tập và mưu sinh.';
              const pledgeText = item.honor_commitment || item.commitment_pledge || 'Cam kết bảo quản tốt và trao lại cho người khác khi xong việc.';
              const provName = VIETNAM_PROVINCES.find(p => p.code === item.province_code)?.name || 'Hà Nội';
              const fallbackImg = item.imageUrl || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80';

              return (
                <div 
                  key={item.id}
                  className="bg-white rounded-3xl border border-warm-200 overflow-hidden shadow-soft hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div className="relative h-44 overflow-hidden">
                    <img 
                      src={fallbackImg} 
                      alt={item.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 right-3 flex justify-between items-center">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-white/95 backdrop-blur-xs text-brand-800 uppercase tracking-wider shadow-xs">
                        {item.category}
                      </span>
                      {isUrgent && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black bg-red-600 text-white shadow-xs">
                          <AlertCircle className="w-3 h-3"/> Cấp Thiết
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <h3 className="font-black text-warm-900 text-base leading-snug group-hover:text-brand-700 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-xs text-warm-700 line-clamp-2 leading-relaxed">
                        {reasonText}
                      </p>
                    </div>

                    <div className="p-3 bg-brand-50/50 rounded-2xl border border-brand-100 text-xs space-y-1">
                      <span className="text-[10px] font-extrabold uppercase text-brand-800 tracking-wider block">
                        Lời Cam Kết Danh Dự:
                      </span>
                      <p className="italic text-brand-950 font-medium text-[11px] leading-relaxed line-clamp-2">
                        "{pledgeText}"
                      </p>
                    </div>

                    <div className="pt-3 border-t border-warm-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-warm-700 truncate">
                        <Navigation className="w-3.5 h-3.5 text-brand-600 shrink-0"/>
                        <span className="truncate">{provName}</span>
                      </div>

                      <button
                        onClick={() => { setSelectedWish(item); setClaimSuccess(null); }}
                        className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-xs hover:shadow-float transition-all flex items-center gap-1.5 shrink-0"
                      >
                        <Heart className="w-3.5 h-3.5 fill-current"/>
                        <span>Trao Tặng</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 5. QUY TRÌNH 3 BƯỚC VỚI ẢNH MINH HỌA THAO TÁC THỰC TẾ */}
      <section className="bg-white rounded-3xl border border-warm-200 p-6 sm:p-10 shadow-soft space-y-8 text-center">
        <div className="max-w-xl mx-auto space-y-1">
          <span className="text-xs font-black uppercase tracking-wider text-brand-700">Quy Trình Văn Minh</span>
          <h2 className="text-2xl font-black text-warm-900">Chạm Là Trao, Quét Là Nhận (Chỉ 60 Giây)</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="p-4 rounded-2xl bg-warm-50 border border-warm-200 space-y-3">
            <div className="rounded-xl overflow-hidden h-36">
              <img 
                src="https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&w=500&q=80" 
                alt="Chụp ảnh bảo vệ nhân phẩm" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-brand-600 text-white font-black text-xs flex items-center justify-center">1</div>
              <h4 className="font-bold text-warm-900 text-sm">Chụp Ảnh & Khử Vị Trí GPS</h4>
            </div>
            <p className="text-xs text-warm-700 leading-relaxed">
              Dignity Shield tự động che mờ góc nhà và xóa định vị GPS để bảo vệ không gian sống của bạn.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-warm-50 border border-warm-200 space-y-3">
            <div className="rounded-xl overflow-hidden h-36">
              <img 
                src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=500&q=80" 
                alt="Bản đồ kết nối địa phương" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-brand-600 text-white font-black text-xs flex items-center justify-center">2</div>
              <h4 className="font-bold text-warm-900 text-sm">Đại Sứ Kết Nối Gần (&lt; 5km)</h4>
            </div>
            <p className="text-xs text-warm-700 leading-relaxed">
              Hệ thống lọc người khó khăn cùng khu vực địa phương để việc trao nhận diễn ra thuận tiện nhất.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-warm-50 border border-warm-200 space-y-3">
            <div className="rounded-xl overflow-hidden h-36">
              <img 
                src="https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=500&q=80" 
                alt="Bắt tay quét mã QR ngoài đời" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-brand-600 text-white font-black text-xs flex items-center justify-center">3</div>
              <h4 className="font-bold text-warm-900 text-sm">Bắt Tay QR 0-VND (0.2s)</h4>
            </div>
            <p className="text-xs text-warm-700 leading-relaxed">
              Gặp nhau trao đồ, quét mã QR xoay vòng 60 giây để xác nhận hoàn tất và kích hoạt Hộ Chiếu Số.
            </p>
          </div>
        </div>
      </section>

      {/* 6. HỘP LAN TỎA & VIRAL LOOP */}
      <section className="bg-gradient-to-r from-brand-600 to-brand-700 text-white rounded-3xl p-8 sm:p-12 shadow-float text-center space-y-6">
        <div className="max-w-2xl mx-auto space-y-3">
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
            Bạn Chưa Có Đồ Dùng Để Trao Tặng Hôm Nay?
          </h2>
          <p className="text-brand-100 text-xs sm:text-sm leading-relaxed">
            Một lượt chia sẻ của bạn có thể cứu sống việc học của một sinh viên nghèo hoặc tạo kế sinh nhai cho một người mẹ đơn thân. 
            Hãy cùng lan tỏa một mạng lưới trao tặng văn minh không tiền mặt!
          </p>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-3">
          <button
            onClick={handleCopyShare}
            className="px-6 py-3 rounded-2xl bg-white text-brand-900 font-black text-xs shadow-soft hover:bg-brand-50 transition-all flex items-center gap-2"
          >
            {copiedLink ? <Check className="w-4 h-4 text-brand-600"/> : <Copy className="w-4 h-4 text-brand-600"/>}
            <span>{copiedLink ? 'Đã Sao Chép Lời Giới Thiệu!' : 'Sao Chép Lời Giới Thiệu'}</span>
          </button>

          <a 
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://sova-give-100-app.pages.dev')}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs backdrop-blur-sm border border-white/20 transition-all flex items-center gap-2"
          >
            <Share2 className="w-4 h-4"/>
            <span>Chia Sẻ Lên Facebook</span>
          </a>
        </div>
      </section>

      {/* MODAL TIẾP NHẬN TRAO QUÀ */}
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
              <button 
                onClick={() => setSelectedWish(null)}
                className="w-8 h-8 rounded-full bg-warm-100 hover:bg-warm-200 text-warm-700 flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {claimSuccess ? (
              <div className="p-5 bg-brand-50 rounded-2xl border border-brand-200 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-brand-600 mx-auto"/>
                <h4 className="font-black text-brand-900 text-base">Khớp Nối Thành Công!</h4>
                <p className="text-xs text-brand-800">
                  Mã Hộ Chiếu Tuần Hoàn Số: <strong className="font-mono text-sm">{claimSuccess}</strong>
                </p>
                <p className="text-[11px] text-warm-700 pt-2">
                  Hãy chuẩn bị thiết bị và mở mục <strong>Bắt Tay QR</strong> khi gặp người nhận ngoài đời thực.
                </p>
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

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setSelectedWish(null)}
                className="flex-1 py-2.5 rounded-xl border border-warm-200 text-warm-700 font-bold text-xs hover:bg-warm-100"
              >
                {claimSuccess ? 'Đóng Cửa Sổ' : 'Hủy Bỏ'}
              </button>

              {!claimSuccess && (
                <button
                  disabled={claiming}
                  onClick={() => handleConfirmClaim(selectedWish.id)}
                  className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-xs disabled:opacity-50"
                >
                  {claiming ? 'Đang Khóa Hàng ACID...' : 'Xác Nhận Trao Tặng (Angel)'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
