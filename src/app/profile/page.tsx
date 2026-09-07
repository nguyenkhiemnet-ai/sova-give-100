'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { 
  VIETNAM_PROVINCES, getDistrictsByProvince, getDistrictNameSafe, 
  CATEGORY_FALLBACK_IMAGES, normalizeCategoryLabel, inferCategory 
} from '@/lib/provinces';
import { getActiveUser, ADMIN_USER, UserProfile } from '@/lib/auth';
import { 
  ArrowLeft, Award, Clock, BookOpen, ShieldCheck, 
  CheckCircle2, AlertCircle, Edit3, Trash2, Heart, 
  MapPin, X, Save, Plus, Sparkles, Filter, Camera, AlertTriangle
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
  status?: string;
  province_code?: string;
  ward_code?: string;
  created_at?: string;
}

export default function ProfilePage() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'MY_WISHES' | 'TIMEBANK' | 'RELAY'>('MY_WISHES');
  const [showCertModal, setShowCertModal] = useState(false);

  const [myWishes, setMyWishes] = useState<WishItem[]>([]);
  const [loadingWishes, setLoadingWishes] = useState(true);

  // Modal Sửa Điều Ước
  const [editingWish, setEditingWish] = useState<WishItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('bicycle');
  const [editReason, setEditReason] = useState('');
  const [editPledge, setEditPledge] = useState('');
  const [editProvince, setEditProvince] = useState('48');
  const [editDistrict, setEditDistrict] = useState('48-ST');
  const [editImageUrl, setEditImageUrl] = useState<string>('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Modal Xác Nhận Xóa In-App
  const [deletingWish, setDeletingWish] = useState<WishItem | null>(null);
  const [deletingProcess, setDeletingProcess] = useState(false);

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

    let deletedIds: string[] = [];
    let updatedDict: Record<string, Partial<WishItem>> = {};
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

    const map = new Map<string, WishItem>();

    const isTestOrDeleted = (id: string, title?: string) => {
      if (deletedIds.includes(id)) return true;
      if (!title) return false;
      const lower = title.toLowerCase();
      return lower.includes('test wish') || lower.includes('kiểm tra gửi') || id === '0160532f-7480-4e73-8c95-e3df6839a897' || id === 'db4739ed-9ef1-4766-ba78-721a0648d679';
    };

    // 1. Nạp từ local (bỏ tin đã xóa)
    localItems.forEach(item => {
      if (isTestOrDeleted(item.id, item.title)) return;
      const savedImg = localStorage.getItem(`SOVA_WISH_IMG_${item.id}`);
      const override = updatedDict[item.id] || {};
      const merged = { ...item, ...override };
      const effectiveCat = inferCategory(merged.title, merged.category);
      map.set(item.id, {
        ...merged,
        category: effectiveCat,
        imageUrl: savedImg || merged.imageUrl || CATEGORY_FALLBACK_IMAGES[effectiveCat] || CATEGORY_FALLBACK_IMAGES['bicycle']
      });
    });

    // 2. Nạp từ server (bỏ tin đã xóa)
    serverItems.forEach(item => {
      if (isTestOrDeleted(item.id, item.title)) return;
      const existing = map.get(item.id);
      const savedImg = localStorage.getItem(`SOVA_WISH_IMG_${item.id}`);
      const override = updatedDict[item.id] || {};
      const merged = { ...item, ...existing, ...override };
      const effectiveCat = inferCategory(merged.title, merged.category);
      
      map.set(item.id, {
        ...merged,
        category: effectiveCat,
        imageUrl: savedImg || merged.imageUrl || CATEGORY_FALLBACK_IMAGES[effectiveCat] || CATEGORY_FALLBACK_IMAGES['bicycle']
      });
    });

    setMyWishes(Array.from(map.values()));
    setLoadingWishes(false);
  }

  const handleOpenEdit = (wish: WishItem) => {
    const effectiveCat = inferCategory(wish.title, wish.category);
    setEditingWish(wish);
    setEditTitle(wish.title || '');
    setEditCategory(effectiveCat);
    setEditReason(wish.reason || wish.reason_description || '');
    setEditPledge(wish.honor_commitment || wish.commitment_pledge || '');
    setEditProvince(wish.province_code || '48');
    setEditDistrict(wish.ward_code || '48-ST');
    setEditImageUrl(wish.imageUrl || CATEGORY_FALLBACK_IMAGES[effectiveCat] || CATEGORY_FALLBACK_IMAGES['bicycle']);
  };

  const handleTitleChangeInEdit = (val: string) => {
    setEditTitle(val);
    const inferred = inferCategory(val, editCategory);
    setEditCategory(inferred);
    if (!editImageUrl || Object.values(CATEGORY_FALLBACK_IMAGES).includes(editImageUrl)) {
      setEditImageUrl(CATEGORY_FALLBACK_IMAGES[inferred]);
    }
  };

  // Nén ảnh bằng Canvas khi tải ảnh mới từ máy
  const handleEditImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 600;
          let w = img.width;
          let h = img.height;
          if (w > h && w > maxDim) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else if (h > maxDim) {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, w, h);
          const compressed = canvas.toDataURL('image/jpeg', 0.8);
          setEditImageUrl(compressed);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingWish) return;
    setSavingEdit(true);

    const chosenImg = editImageUrl || CATEGORY_FALLBACK_IMAGES[editCategory] || CATEGORY_FALLBACK_IMAGES['bicycle'];

    const updatedData: Partial<WishItem> = {
      title: editTitle.trim(),
      category: editCategory,
      reason: editReason.trim(),
      honor_commitment: editPledge.trim(),
      province_code: editProvince,
      ward_code: editDistrict,
      imageUrl: chosenImg
    };

    try {
      // 1. Cập nhật Supabase
      if (!editingWish.id.startsWith('opt-')) {
        await supabase
          .from('wishes')
          .update(updatedData)
          .eq('id', editingWish.id);
      }

      // 2. Lưu ảnh độc lập
      localStorage.setItem(`SOVA_WISH_IMG_${editingWish.id}`, chosenImg);

      // 3. Ghi đè vào từ điển cập nhật bền vững
      let updatedDict: Record<string, Partial<WishItem>> = {};
      try { updatedDict = JSON.parse(localStorage.getItem('SOVA_UPDATED_WISH_DICT') || '{}'); } catch {}
      updatedDict[editingWish.id] = updatedData;
      localStorage.setItem('SOVA_UPDATED_WISH_DICT', JSON.stringify(updatedDict));

      // 4. Cập nhật LocalStorage
      const stored = localStorage.getItem('SOVA_OPTIMISTIC_WISHES');
      if (stored) {
        const list: WishItem[] = JSON.parse(stored);
        const updatedList = list.map(item => 
          item.id === editingWish.id ? { ...item, ...updatedData } : item
        );
        localStorage.setItem('SOVA_OPTIMISTIC_WISHES', JSON.stringify(updatedList));
      }

      // 5. Cập nhật state
      setMyWishes(prev => prev.map(item => 
        item.id === editingWish.id ? { ...item, ...updatedData } : item
      ));

      setEditingWish(null);
    } catch {
      setEditingWish(null);
    } finally {
      setSavingEdit(false);
    }
  };

  // Xác nhận Xóa Vĩnh Viễn bằng Custom Modal (Không dùng window.confirm)
  const confirmExecuteDelete = async () => {
    if (!deletingWish) return;
    setDeletingProcess(true);
    const wishId = deletingWish.id;

    try {
      // 1. Gửi lệnh xóa lên Supabase
      if (!wishId.startsWith('opt-')) {
        await supabase.from('wishes').delete().eq('id', wishId);
      }

      // 2. Thêm vào danh sách ID đã xóa vĩnh viễn (Chặn 100% server kéo về lại)
      let deletedIds: string[] = [];
      try { deletedIds = JSON.parse(localStorage.getItem('SOVA_DELETED_WISH_IDS') || '[]'); } catch {}
      if (!deletedIds.includes(wishId)) deletedIds.push(wishId);
      localStorage.setItem('SOVA_DELETED_WISH_IDS', JSON.stringify(deletedIds));

      // 3. Dọn sạch trong LocalStorage
      const stored = localStorage.getItem('SOVA_OPTIMISTIC_WISHES');
      if (stored) {
        const list: WishItem[] = JSON.parse(stored);
        localStorage.setItem('SOVA_OPTIMISTIC_WISHES', JSON.stringify(list.filter(item => item.id !== wishId)));
      }
      localStorage.removeItem(`SOVA_WISH_IMG_${wishId}`);

      // 4. Xóa ngay lập tức khỏi UI
      setMyWishes(prev => prev.filter(item => item.id !== wishId));
      setDeletingWish(null);
    } catch {
      setMyWishes(prev => prev.filter(item => item.id !== wishId));
      setDeletingWish(null);
    } finally {
      setDeletingProcess(false);
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

      {/* Tabs */}
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

      {/* TAB 1: DANH SÁCH TIN ĐÃ ĐĂNG */}
      {activeTab === 'MY_WISHES' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-black text-warm-900">Quản Lý Tin Đăng & Ước Nguyện Đã Gieo</h3>
              <p className="text-xs text-warm-700">Xem trạng thái duyệt, chỉnh sửa ảnh/phân loại hoặc thu hồi tin đăng bất kỳ lúc nào.</p>
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
                Hãy gieo một mầm ước nguyện để các nhà hảo tâm cùng chung tay tiếp sức.
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
                const provName = VIETNAM_PROVINCES.find(p => p.code === wish.province_code)?.name || 'Hà Nội';
                const distName = getDistrictNameSafe(wish.province_code || '01', wish.ward_code);
                const effectiveCat = inferCategory(wish.title, wish.category);
                const resolvedImg = wish.imageUrl || CATEGORY_FALLBACK_IMAGES[effectiveCat] || CATEGORY_FALLBACK_IMAGES['bicycle'];
                const isPending = wish.status === 'pending';

                return (
                  <div 
                    key={wish.id}
                    className="bg-white rounded-3xl border border-warm-200 p-5 sm:p-6 shadow-soft flex flex-col md:flex-row gap-5 items-start md:items-center justify-between"
                  >
                    <div className="flex flex-col sm:flex-row items-start gap-4 flex-1">
                      <img 
                        src={resolvedImg} 
                        alt={wish.title} 
                        className="w-full sm:w-28 h-28 rounded-2xl object-cover border border-warm-200 shrink-0"
                      />
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black bg-brand-50 text-brand-700 border border-brand-200 uppercase">
                            {normalizeCategoryLabel(effectiveCat)}
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

                    <div className="flex md:flex-col gap-2 w-full md:w-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-warm-100">
                      <button
                        onClick={() => handleOpenEdit(wish)}
                        className="flex-1 md:flex-none px-4 py-2 rounded-xl bg-warm-100 hover:bg-brand-50 hover:text-brand-700 text-warm-900 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-brand-600"/>
                        <span>Sửa Thông Tin</span>
                      </button>

                      <button
                        onClick={() => setDeletingWish(wish)}
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

      {/* TAB 2 & 3 */}
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
              <div className="h-full bg-brand-600 rounded-full" style={{ width: '60%' }}/>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'RELAY' && (
        <div className="bg-white rounded-3xl border border-warm-200 p-6 sm:p-8 shadow-soft space-y-6">
          <div className="space-y-1">
            <span className="text-xs font-black uppercase text-sun-700">Giao Thức Truyền Lửa Tốt Nghiệp</span>
            <h3 className="text-lg font-black text-warm-900">Bàn Giao Trọn Gói Tri Thức Cho Khóa Dưới</h3>
            <p className="text-xs text-warm-700">
              Chuyển giao lại chiếc máy kèm kho tài nguyên học tập để một đàn em khác được bước tiếp.
            </p>
          </div>
        </div>
      )}

      {/* MODAL SỬA ĐIỀU ƯỚC: CÓ THÊM MỤC THAY ĐỔI ẢNH */}
      {editingWish && (
        <div className="fixed inset-0 z-50 bg-warm-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-warm-200 max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-warm-100 pb-3">
              <h3 className="font-black text-warm-900 text-base flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-brand-600"/>
                <span>Chỉnh Sửa Toàn Diện Ước Nguyện</span>
              </h3>
              <button onClick={() => setEditingWish(null)} className="w-8 h-8 rounded-full bg-warm-100 text-warm-700 flex items-center justify-center font-bold">✕</button>
            </div>

            <div className="space-y-4">
              
              {/* Tiêu đề */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-warm-800">Tiêu đề tin đăng:</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={e => handleTitleChangeInEdit(e.target.value)}
                  className="w-full p-3 rounded-2xl border-2 border-warm-200 text-xs font-bold text-warm-900 focus:border-brand-600 focus:outline-none"
                />
              </div>

              {/* Phân loại thiết bị */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-warm-800 flex items-center justify-between">
                  <span>Phân loại thiết bị / công cụ:</span>
                  <span className="text-[10px] text-brand-700 font-normal">Tự nhận diện khi gõ tiêu đề</span>
                </label>
                <select
                  value={editCategory}
                  onChange={e => {
                    setEditCategory(e.target.value);
                    setEditImageUrl(CATEGORY_FALLBACK_IMAGES[e.target.value]);
                  }}
                  className="w-full p-3 rounded-2xl border-2 border-brand-500 bg-brand-50/40 text-xs font-black text-brand-900 focus:outline-none"
                >
                  <option value="bicycle">🚲 Xe đạp đến trường (Bicycle)</option>
                  <option value="laptop">💻 Máy tính học tập (Laptop / PC)</option>
                  <option value="sewing_machine">🧵 Máy may sinh kế (Sewing Machine)</option>
                  <option value="study_tools">📚 Dụng cụ tri thức (Sách vở, bàn ghế)</option>
                  <option value="livelihood_tools">🔧 Công cụ mưu sinh (Đồ nghề sửa chữa)</option>
                </select>
              </div>

              {/* MỤC THAY ĐỔI ẢNH MINH CHỨNG */}
              <div className="space-y-2 p-3.5 bg-warm-50 rounded-2xl border border-warm-200">
                <label className="text-xs font-bold text-warm-900 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-brand-600"/>
                    Hình ảnh minh chứng hiện tại:
                  </span>
                  <label className="px-3 py-1 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-[11px] font-bold cursor-pointer shadow-xs">
                    <span>Tải ảnh mới từ máy</span>
                    <input type="file" accept="image/*" onChange={handleEditImageUpload} className="hidden"/>
                  </label>
                </label>

                <div className="flex items-center gap-3">
                  <img 
                    src={editImageUrl || CATEGORY_FALLBACK_IMAGES[editCategory]} 
                    alt="Preview" 
                    className="w-20 h-20 rounded-xl object-cover border-2 border-brand-400 shrink-0 shadow-sm"
                  />
                  <div className="text-[11px] text-warm-700 space-y-1">
                    <p className="font-semibold text-warm-900">Bấm nút "Tải ảnh mới từ máy" để thay ảnh thực tế.</p>
                    <p>Hệ thống tự động nén nhẹ dưới 80KB để tải trang nhanh nhất.</p>
                  </div>
                </div>
              </div>

              {/* Hoàn cảnh */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-warm-800">Hoàn cảnh & Mục tiêu sử dụng:</label>
                <textarea
                  rows={3}
                  value={editReason}
                  onChange={e => setEditReason(e.target.value)}
                  className="w-full p-3 rounded-2xl border-2 border-warm-200 text-xs font-medium text-warm-900 focus:border-brand-600 focus:outline-none"
                />
              </div>

              {/* Cam kết */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-warm-800">Lời cam kết danh dự:</label>
                <textarea
                  rows={2}
                  value={editPledge}
                  onChange={e => setEditPledge(e.target.value)}
                  className="w-full p-3 rounded-2xl border-2 border-warm-200 text-xs font-medium text-warm-900 focus:border-brand-600 focus:outline-none"
                />
              </div>

              {/* Tỉnh / Huyện */}
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

      {/* MODAL XÁC NHẬN XÓA TIN CHUYÊN NGHIỆP (KHÔNG BỊ CHẶN BỞI WINDOW.CONFIRM) */}
      {deletingWish && (
        <div className="fixed inset-0 z-50 bg-warm-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border-2 border-red-500 max-w-md w-full p-6 sm:p-8 shadow-2xl text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 mx-auto flex items-center justify-center ring-8 ring-red-100">
              <AlertTriangle className="w-8 h-8"/>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black text-warm-900">Xác Nhận Xóa Vĩnh Viễn?</h3>
              <p className="text-xs text-warm-700 leading-relaxed">
                Bạn đang xóa điều ước: <strong className="text-warm-900 block mt-1">"{deletingWish.title}"</strong>
                Hồ sơ này sẽ được gỡ bỏ hoàn toàn khỏi Cây Nguyện Ước và danh sách cá nhân của bạn.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeletingWish(null)}
                className="flex-1 py-2.5 rounded-xl border border-warm-200 text-xs font-bold text-warm-700 hover:bg-warm-100"
              >
                Giữ Lại
              </button>
              <button
                disabled={deletingProcess}
                onClick={confirmExecuteDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black shadow-xs flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4"/>
                <span>{deletingProcess ? 'Đang Xóa...' : 'Xóa Vĩnh Viễn'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bằng khen chứng chỉ */}
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
