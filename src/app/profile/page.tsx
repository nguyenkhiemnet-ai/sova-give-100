'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { VIETNAM_PROVINCES, getDistrictsByProvince, CATEGORY_FALLBACK_IMAGES, normalizeCategoryLabel } from '@/lib/provinces';
import { getActiveUser, ADMIN_USER, UserProfile } from '@/lib/auth';
import { 
  ArrowLeft, Award, Clock, BookOpen, ShieldCheck, 
  CheckCircle2, AlertCircle, Edit3, Trash2, Heart, 
  MapPin, X, Save, Plus, ExternalLink, Sparkles
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
  created_at?: string;
}

export default function ProfilePage() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'MY_WISHES' | 'TIMEBANK' | 'RELAY'>('MY_WISHES');
  const [showCertModal, setShowCertModal] = useState(false);

  // Danh sách điều ước của tôi
  const [myWishes, setMyWishes] = useState<WishItem[]>([]);
  const [loadingWishes, setLoadingWishes] = useState(true);

  // Modal Chỉnh Sửa Điều Ước
  const [editingWish, setEditingWish] = useState<WishItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editReason, setEditReason] = useState('');
  const [editPledge, setEditPledge] = useState('');
  const [editProvince, setEditProvince] = useState('48');
  const [editDistrict, setEditDistrict] = useState('48-ST');
  const [savingEdit, setSavingEdit] = useState(false);

  // Tiến độ Giờ Công (Timebanking)
  const [timebank] = useState({
    hoursDone: 6,
    hoursRequired: 10,
    tasks: [
      { name: 'Dạy kèm Toán cấp 2 cho con em xóm trọ nghèo (2 buổi)', hours: 4 },
      { name: 'Hỗ trợ dọn dẹp và phân loại sách tại Thư viện trường', hours: 2 }
    ]
  });

  useEffect(() => {
    const user = getActiveUser();
    setCurrentUser(user || ADMIN_USER);
    loadMyWishes();
  }, []);

  // Tải danh sách điều ước tôi đã gửi
  async function loadMyWishes() {
    setLoadingWishes(true);
    let serverItems: WishItem[] = [];

    try {
      const { data } = await supabase
        .from('wishes')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) serverItems = data as WishItem[];
    } catch {}

    let localItems: WishItem[] = [];
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('SOVA_OPTIMISTIC_WISHES');
      if (stored) {
        try { localItems = JSON.parse(stored); } catch {}
      }
    }

    // Kết hợp và gán ảnh chuẩn
    const map = new Map<string, WishItem>();
    localItems.forEach(item => {
      const savedImg = localStorage.getItem(`SOVA_WISH_IMG_${item.id}`);
      map.set(item.id, {
        ...item,
        imageUrl: savedImg || item.imageUrl || CATEGORY_FALLBACK_IMAGES[item.category] || CATEGORY_FALLBACK_IMAGES['bicycle']
      });
    });

    serverItems.forEach(item => {
      const existing = map.get(item.id);
      const savedImg = localStorage.getItem(`SOVA_WISH_IMG_${item.id}`);
      map.set(item.id, {
        ...item,
        imageUrl: savedImg || existing?.imageUrl || item.imageUrl || CATEGORY_FALLBACK_IMAGES[item.category] || CATEGORY_FALLBACK_IMAGES['bicycle']
      });
    });

    setMyWishes(Array.from(map.values()));
    setLoadingWishes(false);
  }

  // Mở modal Sửa
  const handleOpenEdit = (wish: WishItem) => {
    setEditingWish(wish);
    setEditTitle(wish.title || '');
    setEditReason(wish.reason || wish.reason_description || '');
    setEditPledge(wish.honor_commitment || wish.commitment_pledge || '');
    setEditProvince(wish.province_code || '48');
    setEditDistrict(wish.ward_code || '48-ST');
  };

  // Lưu chỉnh sửa lên Supabase & LocalStorage
  const handleSaveEdit = async () => {
    if (!editingWish) return;
    setSavingEdit(true);

    const updatedData = {
      title: editTitle.trim(),
      reason: editReason.trim(),
      honor_commitment: editPledge.trim(),
      province_code: editProvince,
      ward_code: editDistrict,
      updated_at: new Date().toISOString()
    };

    try {
      // 1. Cập nhật trên Supabase nếu ID hợp lệ
      if (!editingWish.id.startsWith('opt-')) {
        await supabase
          .from('wishes')
          .update(updatedData)
          .eq('id', editingWish.id);
      }

      // 2. Cập nhật trên LocalStorage
      const stored = localStorage.getItem('SOVA_OPTIMISTIC_WISHES');
      if (stored) {
        const list: WishItem[] = JSON.parse(stored);
        const updatedList = list.map(item => 
          item.id === editingWish.id ? { ...item, ...updatedData } : item
        );
        localStorage.setItem('SOVA_OPTIMISTIC_WISHES', JSON.stringify(updatedList));
      }

      // 3. Cập nhật state nội bộ
      setMyWishes(prev => prev.map(item => 
        item.id === editingWish.id ? { ...item, ...updatedData } : item
      ));

      alert('Cập nhật thông tin điều ước thành công!');
      setEditingWish(null);
    } catch (err: any) {
      alert('Không thể lưu cập nhật: ' + err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  // Xóa / Thu hồi điều ước
  const handleDeleteWish = async (wishId: string) => {
    if (!confirm('Bạn có chắc chắn muốn thu hồi điều ước này khỏi Cây Nguyện Ước không?')) return;

    try {
      if (!wishId.startsWith('opt-')) {
        await supabase.from('wishes').delete().eq('id', wishId);
      }

      // Xóa khỏi LocalStorage
      const stored = localStorage.getItem('SOVA_OPTIMISTIC_WISHES');
      if (stored) {
        const list: WishItem[] = JSON.parse(stored);
        const filtered = list.filter(item => item.id !== wishId);
        localStorage.setItem('SOVA_OPTIMISTIC_WISHES', JSON.stringify(filtered));
      }
      localStorage.removeItem(`SOVA_WISH_IMG_${wishId}`);

      setMyWishes(prev => prev.filter(item => item.id !== wishId));
      alert('Đã thu hồi điều ước thành công.');
    } catch (err: any) {
      alert('Lỗi khi xóa: ' + err.message);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link 
          href="/" 
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-warm-200 bg-white text-xs font-bold text-warm-700 hover:text-brand-700 shadow-2xs transition-all"
        >
          <ArrowLeft className="w-4 h-4"/>
          <span>Quay lại Cây Nguyện Ước</span>
        </Link>
        <Link 
          href="/create-wish/"
          className="px-4 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-black shadow-xs flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4"/>
          <span>Gieo Thêm Ước Nguyện</span>
        </Link>
      </div>

      {/* Profile Card */}
      <section className="bg-gradient-to-br from-brand-50 via-white to-sun-50 rounded-3xl border border-warm-200 p-6 sm:p-8 shadow-soft space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-3xl bg-brand-600 text-white font-black text-3xl flex items-center justify-center shadow-lg ring-4 ring-white">
              {currentUser?.avatar || 'K'}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-warm-900">{currentUser?.name || 'NGUYEN KHIEM NET'}</h1>
                <span className="px-2.5 py-0.5 rounded-lg bg-sun-100 text-sun-700 border border-sun-200 text-[11px] font-black uppercase flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-sun-600"/>
                  Công Dân Danh Dự 6⭐
                </span>
              </div>
              <p className="text-xs text-warm-700">Mã định danh: <strong className="font-mono text-warm-900">SOVA-ID-2108-1984</strong></p>
              <div className="flex items-center gap-1.5 text-[11px] text-brand-700 font-semibold pt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-600"/>
                <span>Xác thực định danh sinh viên qua cổng đào tạo trường</span>
              </div>
            </div>
          </div>

          <button 
            onClick={() => setShowCertModal(true)}
            className="px-5 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-black shadow-float transition-all flex items-center gap-2"
          >
            <Award className="w-4 h-4"/>
            <span>Mở Bằng Khen Chứng Chỉ Xanh</span>
          </button>
        </div>

        {/* 3 Chỉ số */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-warm-200">
          <div className="bg-white p-4 rounded-2xl border border-warm-200 shadow-2xs">
            <span className="text-[11px] font-bold text-warm-700 uppercase">Vốn Xã Hội (Karma)</span>
            <div className="text-2xl font-black text-warm-900 mt-1">{currentUser?.karma || 100} ⭐</div>
            <span className="text-[10px] text-brand-600 font-medium">Được bảo chứng trên sổ cái</span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-warm-200 shadow-2xs">
            <span className="text-[11px] font-bold text-warm-700 uppercase">CO2 Đã Cắt Giảm</span>
            <div className="text-2xl font-black text-sun-600 mt-1">{currentUser?.co2Saved || 85.5} kg</div>
            <span className="text-[10px] text-warm-700 font-medium">~6.5 cây xanh quang hợp</span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-warm-200 shadow-2xs">
            <span className="text-[11px] font-bold text-warm-700 uppercase">Giờ Phụng Sự Xã Hội</span>
            <div className="text-2xl font-black text-blue-900 mt-1">6 / 10 Giờ</div>
            <span className="text-[10px] text-blue-600 font-medium">Đổi thiết bị bằng tri thức</span>
          </div>
        </div>
      </section>

      {/* 3 Tabs Điều Hướng */}
      <div className="flex border-b border-warm-200 gap-2 sm:gap-6 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setActiveTab('MY_WISHES')}
          className={`pb-3 text-sm font-black transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === 'MY_WISHES' ? 'border-brand-600 text-brand-700' : 'border-transparent text-warm-700 hover:text-warm-900'
          }`}
        >
          <Sparkles className="w-4 h-4"/>
          <span>Ước Nguyện Tôi Đã Đăng ({myWishes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('TIMEBANK')}
          className={`pb-3 text-sm font-black transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === 'TIMEBANK' ? 'border-brand-600 text-brand-700' : 'border-transparent text-warm-700 hover:text-warm-900'
          }`}
        >
          <Clock className="w-4 h-4"/>
          <span>Hợp Đồng Đổi Giờ Công (Timebanking)</span>
        </button>

        <button
          onClick={() => setActiveTab('RELAY')}
          className={`pb-3 text-sm font-black transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === 'RELAY' ? 'border-brand-600 text-brand-700' : 'border-transparent text-warm-700 hover:text-warm-900'
          }`}
        >
          <BookOpen className="w-4 h-4"/>
          <span>Tiếp Sức Khóa Dưới (Senior Relay)</span>
        </button>
      </div>

      {/* TAB 1: DANH SÁCH ƯỚC NGUYỆN CỦA TÔI (CÓ NÚT SỬA & XÓA) */}
      {activeTab === 'MY_WISHES' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-black text-warm-900">Quản Lý Tin Đăng & Ước Nguyện Đã Gieo</h3>
              <p className="text-xs text-warm-700">Xem trạng thái duyệt, chỉnh sửa chi tiết hoặc thu hồi tin đăng bất kỳ lúc nào.</p>
            </div>
          </div>

          {loadingWishes ? (
            <div className="p-8 text-center text-xs font-bold text-warm-700 bg-white rounded-3xl border border-warm-200">
              Đang tải danh sách tin của bạn...
            </div>
          ) : myWishes.length === 0 ? (
            <div className="bg-white rounded-3xl border border-warm-200 p-8 text-center space-y-3 shadow-soft">
              <Sparkles className="w-10 h-10 text-warm-400 mx-auto"/>
              <h4 className="font-black text-warm-900 text-base">Bạn chưa đăng ước nguyện nào</h4>
              <p className="text-xs text-warm-700 max-w-md mx-auto">
                Hãy gieo một mầm ước nguyện (xe đạp, laptop, máy may...) để các nhà hảo tâm cùng chung tay tiếp sức.
              </p>
              <Link 
                href="/create-wish/"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-black shadow-xs"
              >
                <Plus className="w-4 h-4"/>
                <span>Gửi Ước Nguyện Ngay</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {myWishes.map(wish => {
                const provName = VIETNAM_PROVINCES.find(p => p.code === wish.province_code)?.name || 'Đà Nẵng';
                const distName = getDistrictsByProvince(wish.province_code || '48').find(d => d.code === wish.ward_code)?.name || 'Quận Sơn Trà';
                const resolvedImg = wish.imageUrl || CATEGORY_FALLBACK_IMAGES[wish.category] || CATEGORY_FALLBACK_IMAGES['bicycle'];
                const isPending = wish.status === 'pending';

                return (
                  <div 
                    key={wish.id}
                    className="bg-white rounded-3xl border border-warm-200 p-5 sm:p-6 shadow-soft flex flex-col md:flex-row gap-5 items-start md:items-center justify-between"
                  >
                    {/* Ảnh & Thông tin */}
                    <div className="flex flex-col sm:flex-row items-start gap-4 flex-1">
                      <img 
                        src={resolvedImg} 
                        alt={wish.title} 
                        className="w-full sm:w-28 h-28 rounded-2xl object-cover border border-warm-200 shrink-0"
                      />
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black bg-brand-50 text-brand-700 border border-brand-200 uppercase">
                            {normalizeCategoryLabel(wish.category)}
                          </span>
                          {isPending ? (
                            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200">
                              ⏳ Chờ Duyệt Cộng Đồng
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black bg-green-100 text-green-800 border border-green-200">
                              ✅ Đã Lên Cây Nguyện Ước
                            </span>
                          )}
                          <span className="text-[11px] text-warm-700 flex items-center gap-1 font-bold">
                            <MapPin className="w-3.5 h-3.5 text-brand-600"/>
                            {provName} • {distName}
                          </span>
                        </div>

                        <h4 className="font-black text-warm-900 text-base leading-snug">{wish.title}</h4>
                        <p className="text-xs text-warm-700 line-clamp-2 leading-relaxed">
                          {wish.reason || wish.reason_description}
                        </p>
                        <p className="text-[11px] italic text-brand-900 line-clamp-1">
                          Cam kết: "{wish.honor_commitment || wish.commitment_pledge}"
                        </p>
                      </div>
                    </div>

                    {/* 2 Nút thao tác: Sửa & Xóa */}
                    <div className="flex md:flex-col gap-2 w-full md:w-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-warm-100">
                      <button
                        onClick={() => handleOpenEdit(wish)}
                        className="flex-1 md:flex-none px-4 py-2 rounded-xl bg-warm-100 hover:bg-brand-50 hover:text-brand-700 text-warm-900 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-brand-600"/>
                        <span>Sửa Thông Tin</span>
                      </button>

                      <button
                        onClick={() => handleDeleteWish(wish.id)}
                        className="flex-1 md:flex-none px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                      >
                        <Trash2 className="w-3.5 h-3.5"/>
                        <span>Xóa Tin Đăng</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TIMEBANKING */}
      {activeTab === 'TIMEBANK' && (
        <div className="bg-white rounded-3xl border border-warm-200 p-6 sm:p-8 shadow-soft space-y-6">
          <div className="space-y-1">
            <span className="text-xs font-black uppercase text-brand-700">Chứng Chỉ Phụng Sự Xã Hội</span>
            <h3 className="text-lg font-black text-warm-900">Thanh Tiến Độ Trả Nợ Xã Hội Bằng Tri Thức</h3>
            <p className="text-xs text-warm-700">
              Nhận thiết bị 0-VND không phải là mang ơn, mà là cam kết cống hiến 10 giờ tương trợ cộng đồng để giữ vững nhân phẩm.
            </p>
          </div>

          <div className="space-y-2 p-4 bg-warm-50 rounded-2xl border border-warm-200">
            <div className="flex justify-between text-xs font-black">
              <span>Tiến độ hoàn thành:</span>
              <span className="text-brand-700">{timebank.hoursDone} / {timebank.hoursRequired} Giờ (60%)</span>
            </div>
            <div className="w-full h-3 bg-warm-200 rounded-full overflow-hidden">
              <div className="h-full bg-brand-600 rounded-full transition-all duration-500" style={{ width: '60%' }}/>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-black text-warm-900 uppercase">Nhật Ký Tương Trợ Đã Được Xác Minh:</h4>
            {timebank.tasks.map((t, idx) => (
              <div key={idx} className="p-3 bg-white rounded-xl border border-warm-200 flex justify-between items-center text-xs">
                <span className="font-bold text-warm-900">{t.name}</span>
                <span className="font-black text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md border border-brand-200">
                  +{t.hours} Giờ
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: SENIOR RELAY */}
      {activeTab === 'RELAY' && (
        <div className="bg-white rounded-3xl border border-warm-200 p-6 sm:p-8 shadow-soft space-y-6">
          <div className="space-y-1">
            <span className="text-xs font-black uppercase text-sun-700">Giao Thức Truyền Lửa Tốt Nghiệp</span>
            <h3 className="text-lg font-black text-warm-900">Bàn Giao Trọn Gói Tri Thức Cho Khóa Dưới</h3>
            <p className="text-xs text-warm-700">
              Khi bạn chuẩn bị tốt nghiệp và đi làm, hãy chuyển giao lại chiếc máy kèm kho tài nguyên học tập để một đàn em khác được bước tiếp.
            </p>
          </div>

          <div className="p-4 bg-brand-50 rounded-2xl border border-brand-200 space-y-3">
            <h4 className="font-black text-brand-900 text-xs uppercase">Gói Tri Thức Đi Kèm Chiếc ThinkPad T480:</h4>
            <ul className="text-xs text-brand-950 space-y-1.5 list-disc list-inside font-medium">
              <li>Trọn bộ Slide & Giáo trình môn Cấu Trúc Dữ Liệu & Giải Thuật (Điểm A)</li>
              <li>Kho Code mẫu Đồ án Lập trình Web Fullstack React + Node.js</li>
              <li>Tài liệu luyện thi chứng chỉ Tiếng Anh B1 nội bộ Đại học Bách Khoa</li>
              <li>Thư ngỏ chia sẻ kinh nghiệm vượt qua kỳ thi thực tập doanh nghiệp</li>
            </ul>
          </div>
        </div>
      )}

      {/* MODAL SỬA ĐIỀU ƯỚC 1-CHẠM */}
      {editingWish && (
        <div className="fixed inset-0 z-50 bg-warm-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-warm-200 max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-warm-100 pb-3">
              <h3 className="font-black text-warm-900 text-base flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-brand-600"/>
                <span>Chỉnh Sửa Thông Tin Ước Nguyện</span>
              </h3>
              <button onClick={() => setEditingWish(null)} className="w-8 h-8 rounded-full bg-warm-100 text-warm-700 flex items-center justify-center font-bold">✕</button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-warm-800">Tiêu đề tin đăng:</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full p-3 rounded-2xl border-2 border-warm-200 text-xs font-bold text-warm-900 focus:border-brand-600 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-warm-800">Hoàn cảnh & Mục tiêu sử dụng:</label>
                <textarea
                  rows={3}
                  value={editReason}
                  onChange={e => setEditReason(e.target.value)}
                  className="w-full p-3 rounded-2xl border-2 border-warm-200 text-xs font-medium text-warm-900 focus:border-brand-600 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-warm-800">Lời cam kết danh dự:</label>
                <textarea
                  rows={2}
                  value={editPledge}
                  onChange={e => setEditPledge(e.target.value)}
                  className="w-full p-3 rounded-2xl border-2 border-warm-200 text-xs font-medium text-warm-900 focus:border-brand-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-warm-800">Tỉnh / Thành phố:</label>
                  <select
                    value={editProvince}
                    onChange={e => {
                      setEditProvince(e.target.value);
                      const d = getDistrictsByProvince(e.target.value);
                      if (d.length > 0) setEditDistrict(d[0].code);
                    }}
                    className="w-full p-2.5 rounded-xl border-2 border-warm-200 text-xs font-bold text-warm-900 focus:border-brand-600 focus:outline-none"
                  >
                    {VIETNAM_PROVINCES.map(p => (
                      <option key={p.code} value={p.code}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-warm-800">Quận / Huyện:</label>
                  <select
                    value={editDistrict}
                    onChange={e => setEditDistrict(e.target.value)}
                    className="w-full p-2.5 rounded-xl border-2 border-warm-200 text-xs font-bold text-warm-900 focus:border-brand-600 focus:outline-none"
                  >
                    {getDistrictsByProvince(editProvince).map(d => (
                      <option key={d.code} value={d.code}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-warm-100 flex gap-3">
              <button 
                onClick={() => setEditingWish(null)} 
                className="flex-1 py-2.5 rounded-xl border border-warm-200 text-warm-700 font-bold text-xs"
              >
                Hủy Bỏ
              </button>
              <button
                disabled={savingEdit}
                onClick={handleSaveEdit}
                className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-black text-xs shadow-xs flex items-center justify-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5"/>
                <span>{savingEdit ? 'Đang Lưu...' : 'Lưu Thay Đổi'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL BẰNG KHEN CHỨNG CHỈ XANH */}
      {showCertModal && (
        <div className="fixed inset-0 z-50 bg-warm-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border-4 border-sun-500/40 max-w-2xl w-full p-6 sm:p-10 shadow-2xl relative space-y-6">
            <button onClick={() => setShowCertModal(false)} className="absolute top-5 right-5 w-9 h-9 rounded-full bg-warm-100 text-warm-700 flex items-center justify-center font-bold">
              <X className="w-5 h-5"/>
            </button>
            <div className="border-2 border-sun-400/60 rounded-2xl p-6 sm:p-8 bg-gradient-to-b from-sun-50/40 via-white to-brand-50/30 text-center space-y-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-brand-800 block">
                HỆ SINH THÁI TUẦN HOÀN GIÁO DỤC 0-VND • SOVA GIVE 100
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-warm-900 uppercase">CHỨNG CHỈ CÔNG DÂN DANH DỰ</h2>
              <div className="text-2xl font-black text-brand-700 uppercase">{currentUser?.name || 'NGUYEN KHIEM NET'}</div>
              <p className="font-mono text-xs text-warm-700">Mã định danh: SOVA-ID-2108-1984</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
