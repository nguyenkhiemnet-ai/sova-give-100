'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  Sparkles, Heart, Search, MapPin, Filter, Leaf, 
  Clock, Repeat, AlertCircle, ShieldCheck, CheckCircle2,
  Laptop, Bike, Scissors, BookOpen, Wrench, Navigation
} from 'lucide-react';

interface WishItem {
  id: string;
  title: string;
  category: string;
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

const PROVINCES = [
  { code: 'ALL', name: 'Toàn quốc (63 Tỉnh/Thành)' },
  { code: '01', name: 'Hà Nội' },
  { code: '79', name: 'TP. Hồ Chí Minh' },
  { code: '48', name: 'Đà Nẵng' },
  { code: '03', name: 'Hà Giang' },
  { code: '31', name: 'Hải Phòng' },
  { code: '92', name: 'Cần Thơ' },
];

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
        // Fallback hạt giống tử tế chuẩn hóa
        setWishes([
          {
            id: 'a1111111-1111-1111-1111-111111111111',
            title: 'Máy tính xách tay phục vụ học tập CNTT',
            category: 'laptop',
            reason: 'Sinh viên năm nhất hoàn cảnh khó khăn tại vùng bão lũ, cần máy tính để thực hành lập trình Web.',
            honor_commitment: 'Cam kết bảo quản tốt, đạt học lực khá giỏi và trao lại cho đàn em khóa sau khi tốt nghiệp.',
            urgency: 'urgent',
            province_code: '01',
            status: 'verified',
          },
          {
            id: 'b2222222-2222-2222-2222-222222222222',
            title: 'Xe đạp đến trường cho học sinh nghèo hiếu học',
            category: 'bicycle',
            reason: 'Đoạn đường từ nhà tới trường cấp 3 dài 8km đường đồi núi hiểm trở, gia đình chưa có điều kiện mua xe.',
            honor_commitment: 'Cam kết giữ gìn xe cẩn thận, chăm chỉ đến lớp và nhượng lại cho học sinh khó khăn khác khi ra trường.',
            urgency: 'urgent',
            province_code: '03',
            status: 'verified',
          },
          {
            id: 'c3333333-3333-3333-3333-333333333333',
            title: 'Máy may sinh kế cho mẹ đơn thân gia công tại nhà',
            category: 'sewing_machine',
            reason: 'Cần máy may để nhận hàng may gia công tại nhà kiếm thêm thu nhập trang trải thuốc men và nuôi hai con ăn học.',
            honor_commitment: 'Cam kết sử dụng đúng mục đích sinh kế, giữ gìn máy bền đẹp và truyền nghề miễn phí cho phụ nữ trong xóm.',
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
        setClaimSuccess(data?.passport_code || 'SOVA-2026-CONFIRMED');
      }
    } catch (e: any) {
      alert(e.message || 'Lỗi hệ thống');
    } finally {
      setClaiming(false);
    }
  }

  return (
    <div className="space-y-10">
      
      {/* 1. HERO SECTION TRUYỀN CẢM HỨNG */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-sun-50 rounded-3xl border border-warm-200 p-6 sm:p-12 shadow-soft">
        <div className="max-w-3xl space-y-4">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-white text-brand-700 border border-brand-200 shadow-2xs">
            <Sparkles className="w-4 h-4 text-brand-500 animate-spin-slow"/>
            Kinh Tế Tuần Hoàn 0-VND • Trao Cơ Hội Đổi Đời
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-warm-900 tracking-tight leading-tight">
            Trao Dụng Cụ Lao Động,<br className="hidden sm:inline"/> Tiếp Sức Ước Mơ Tự Lập
          </h1>
          <p className="text-warm-700 text-sm sm:text-base leading-relaxed max-w-2xl">
            Mỗi món đồ cũ trao đi là một tương lai được thắp sáng. Không tiền mặt, không thương mại hóa, 
            mọi giao dịch được bảo chứng bằng lòng tin và Hộ chiếu tuần hoàn số.
          </p>
        </div>

        {/* 2. BẢNG 3 CHỈ SỐ TÁC ĐỘNG XÃ HỘI (GLASS CARDS) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-8 border-t border-warm-200/80">
          <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-warm-200 shadow-2xs flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6"/>
            </div>
            <div>
              <span className="text-[11px] font-bold text-warm-700 uppercase tracking-wider block">Vốn Xã Hội (Karma)</span>
              <div className="text-2xl font-black text-warm-900 mt-0.5">100,000+ ⭐</div>
              <span className="text-[10px] text-brand-600 font-medium">Giờ tương trợ cộng đồng</span>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-warm-200 shadow-2xs flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-sun-100 text-sun-600 flex items-center justify-center shrink-0">
              <Leaf className="w-6 h-6"/>
            </div>
            <div>
              <span className="text-[11px] font-bold text-warm-700 uppercase tracking-wider block">CO2 Đã Cắt Giảm</span>
              <div className="text-2xl font-black text-sun-600 mt-0.5">1,450.5 kg</div>
              <span className="text-[10px] text-warm-700 font-medium">~72 cây xanh quang hợp</span>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-warm-200 shadow-2xs flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Repeat className="w-6 h-6"/>
            </div>
            <div>
              <span className="text-[11px] font-bold text-warm-700 uppercase tracking-wider block">Tuần Hoàn Thực Tế</span>
              <div className="text-2xl font-black text-blue-900 mt-0.5">100% 0Đ</div>
              <span className="text-[10px] text-blue-600 font-medium">Bảo chứng Hộ chiếu số</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. BỘ CÔNG CỤ TÌM KIẾM & BỘ LỌC ĐỊA LÝ THÔNG MINH */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white p-3 rounded-2xl border border-warm-200 shadow-2xs">
          
          {/* Tìm kiếm */}
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

          {/* Lọc Địa Lý Tỉnh Thành */}
          <div className="relative min-w-[200px]">
            <MapPin className="w-4 h-4 text-brand-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"/>
            <select
              value={selectedProvince}
              onChange={e => setSelectedProvince(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-warm-200 bg-warm-50 text-sm font-semibold text-warm-900 focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none cursor-pointer"
            >
              {PROVINCES.map(p => (
                <option key={p.code} value={p.code}>{p.name}</option>
              ))}
            </select>
            <Filter className="w-3.5 h-3.5 text-warm-700 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"/>
          </div>
        </div>

        {/* Danh Mục Quick Chips */}
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
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-white' : 'text-warm-700'}`}/>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 4. DANH SÁCH THẺ ĐIỀU ƯỚC NHÂN PHẨM (DIGNITY CARDS GRID) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-warm-900 flex items-center gap-2">
            <Heart className="w-5 h-5 text-brand-600 fill-brand-600"/>
            <span>Ước Nguyện Đang Cần Tiếp Nối</span>
            <span className="text-xs px-2 py-0.5 rounded-md bg-warm-200 text-warm-700 font-bold ml-1">
              {filteredWishes.length}
            </span>
          </h2>
        </div>

        {loading ? (
          <div className="py-16 text-center text-warm-700 font-medium animate-pulse">
            Đang tải dữ liệu nhân văn từ Supabase Singapore...
          </div>
        ) : filteredWishes.length === 0 ? (
          <div className="bg-white rounded-3xl border border-warm-200 p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-warm-100 text-warm-700 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6"/>
            </div>
            <h3 className="font-bold text-warm-900">Không tìm thấy ước nguyện phù hợp</h3>
            <p className="text-xs text-warm-700 max-w-md mx-auto">
              Hãy thử chọn khu vực khác hoặc tìm kiếm với từ khóa ngắn hơn.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWishes.map(item => {
              const isUrgent = item.urgency === 'urgent' || item.urgency_level === 'CRITICAL' || item.urgency_level === 'HIGH';
              const reasonText = item.reason || item.reason_description || 'Hoàn cảnh cần hỗ trợ dụng cụ học tập và mưu sinh.';
              const pledgeText = item.honor_commitment || item.commitment_pledge || 'Cam kết bảo quản tốt và chuyển giao thế hệ sau.';
              const provName = PROVINCES.find(p => p.code === item.province_code)?.name || 'Hà Nội';

              return (
                <div 
                  key={item.id}
                  className="bg-white rounded-3xl border border-warm-200 p-6 shadow-soft hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-3">
                    {/* Badges */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-brand-50 text-brand-700 uppercase tracking-wider">
                        {item.category}
                      </span>
                      {isUrgent && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-red-50 text-red-600 border border-red-200">
                          <AlertCircle className="w-3 h-3"/> Cấp Thiết
                        </span>
                      )}
                    </div>

                    {/* Tiêu đề & Hoàn cảnh */}
                    <h3 className="font-black text-warm-900 text-lg leading-snug group-hover:text-brand-700 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-warm-700 line-clamp-3 leading-relaxed">
                      {reasonText}
                    </p>

                    {/* Cam kết danh dự in nghiêng */}
                    <div className="p-3.5 bg-brand-50/50 rounded-2xl border border-brand-100 text-xs space-y-1">
                      <span className="text-[10px] font-extrabold uppercase text-brand-800 tracking-wider block">
                        Lời Cam Kết Danh Dự:
                      </span>
                      <p className="italic text-brand-950 font-medium leading-relaxed">
                        "{pledgeText}"
                      </p>
                    </div>
                  </div>

                  {/* Vị trí & Nút Trao Tặng */}
                  <div className="pt-3 border-t border-warm-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-warm-700">
                      <Navigation className="w-3.5 h-3.5 text-brand-600"/>
                      <span>{provName}</span>
                    </div>

                    <button
                      onClick={() => { setSelectedWish(item); setClaimSuccess(null); }}
                      className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-xs hover:shadow-float transition-all flex items-center gap-1.5"
                    >
                      <Heart className="w-3.5 h-3.5 fill-current"/>
                      <span>Trao Tặng Ngay</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 5. MODAL TIẾP NHẬN TRAO QUÀ (ANGEL MODAL) */}
      {selectedWish && (
        <div className="fixed inset-0 z-50 bg-warm-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-warm-200 max-w-lg w-full p-6 sm:p-8 shadow-xl space-y-6">
            
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-brand-700 uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4"/> Xác Nhận Khớp Nối Giao Dịch 0Đ
                </span>
                <h3 className="text-xl font-black text-warm-900">
                  {selectedWish.title}
                </h3>
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
                  <p><strong>Lý do xin nhận:</strong> {selectedWish.reason || selectedWish.reason_description}</p>
                  <p><strong>Cam kết bảo quản:</strong> "{selectedWish.honor_commitment || selectedWish.commitment_pledge}"</p>
                </div>
                <div className="p-3 bg-sun-50 rounded-xl border border-sun-100 text-sun-700">
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
