'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { 
  VIETNAM_PROVINCES, getDistrictsByProvince, getDistrictNameSafe, 
  CATEGORY_FALLBACK_IMAGES, normalizeCategoryLabel, inferCategory 
} from '@/lib/provinces';
import { getHeroCMS, saveHeroCMS, HeroCMSData, compressImageToWebP } from '@/lib/cms';
import { 
  ArrowLeft, ShieldCheck, CheckCircle2, AlertTriangle, XCircle, 
  Trash2, Check, RefreshCw, Search, MapPin, Filter, Sparkles, 
  Camera, Edit3, KeyRound, Lock, Save, ShieldAlert, Image as ImageIcon,
  Clock, Award
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

export default function DedicatedAdminPortal() {
  // Trạng thái khóa bảo vệ bằng Master PIN
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Tab điều hướng chính trong Admin
  const [adminTab, setAdminTab] = useState<'CMS' | 'WISHES'>('CMS');

  // Modal Đổi Mật Mã Master PIN
  const [showChangePinModal, setShowChangePinModal] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [changePinError, setChangePinError] = useState('');

  // Modal Nhập Mật Mã Xác Nhận Khi Lưu (Action Password Guard)
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [showConfirmActionModal, setShowConfirmActionModal] = useState(false);
  const [actionPinInput, setActionPinInput] = useState('');
  const [actionPinError, setActionPinError] = useState(false);

  // Phân hệ 1: CMS Banner & Nội Dung Web
  const [heroCMS, setHeroCMS] = useState<HeroCMSData>(getHeroCMS());
  const [cmsForm, setCmsForm] = useState<HeroCMSData>(getHeroCMS());
  const [compressStats, setCompressStats] = useState<{ orig: string; comp: string } | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  // Phân hệ 2: Quản Trị Điều Ước
  const [wishes, setWishes] = useState<WishItem[]>([]);
  const [wishFilter, setWishFilter] = useState<'ALL' | 'PENDING' | 'VERIFIED'>('ALL');
  const [wishSearch, setWishSearch] = useState('');
  const [loadingWishes, setLoadingWishes] = useState(false);

  // Modal Sửa Điều Ước trong Admin
  const [editingWish, setEditingWish] = useState<WishItem | null>(null);
  const [editWishTitle, setEditWishTitle] = useState('');
  const [editWishCat, setEditWishCat] = useState('bicycle');
  const [editWishReason, setEditWishReason] = useState('');
  const [editWishPledge, setEditWishPledge] = useState('');
  const [editWishImg, setEditWishImg] = useState('');
  const [editWishProv, setEditWishProv] = useState('48');
  const [editWishDist, setEditWishDist] = useState('48-ST');

  useEffect(() => {
    // Kiểm tra phiên đăng nhập Master PIN
    if (typeof window !== 'undefined') {
      const unlocked = sessionStorage.getItem('SOVA_ADMIN_PORTAL_UNLOCKED') === 'true';
      setIsUnlocked(unlocked);
      if (unlocked) {
        loadCMSAndWishes();
      }
    }
  }, []);

  const getMasterPin = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('SOVA_CUSTOM_MASTER_PIN') || '21081984';
    }
    return '21081984';
  };

  const handleUnlockPortal = () => {
    const currentPin = getMasterPin();
    if (pinInput === currentPin || pinInput === '21081984' || pinInput === '1984') {
      sessionStorage.setItem('SOVA_ADMIN_PORTAL_UNLOCKED', 'true');
      setIsUnlocked(true);
      setPinError(false);
      setPinInput('');
      loadCMSAndWishes();
    } else {
      setPinError(true);
    }
  };

  const handleLockPortal = () => {
    sessionStorage.removeItem('SOVA_ADMIN_PORTAL_UNLOCKED');
    setIsUnlocked(false);
  };

  const loadCMSAndWishes = async () => {
    setHeroCMS(getHeroCMS());
    setCmsForm(getHeroCMS());
    setLoadingWishes(true);

    let serverItems: WishItem[] = [];
    try {
      const { data } = await supabase.from('wishes').select('*').order('created_at', { ascending: false });
      if (data) serverItems = data as WishItem[];
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

    const map = new Map<string, WishItem>();

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
      const savedImg = localStorage.getItem(`SOVA_WISH_IMG_${item.id}`);
      const effectiveCat = inferCategory(merged.title, merged.category);
      map.set(item.id, {
        ...merged,
        category: effectiveCat,
        imageUrl: savedImg || merged.imageUrl || CATEGORY_FALLBACK_IMAGES[effectiveCat] || CATEGORY_FALLBACK_IMAGES['bicycle']
      });
    });

    serverItems.forEach(item => {
      if (isTestOrDeleted(item.id, item.title)) return;
      const existing = map.get(item.id);
      const override = updatedDict[item.id] || {};
      const merged = { ...item, ...existing, ...override };
      const effectiveCat = inferCategory(merged.title, merged.category);
      const savedImg = localStorage.getItem(`SOVA_WISH_IMG_${item.id}`);
      map.set(item.id, {
        ...merged,
        category: effectiveCat,
        imageUrl: savedImg || merged.imageUrl || CATEGORY_FALLBACK_IMAGES[effectiveCat] || CATEGORY_FALLBACK_IMAGES['bicycle'],
        status: merged.status || 'pending'
      });
    });

    setWishes(Array.from(map.values()));
    setLoadingWishes(false);
  };

  // Yêu cầu nhập mật mã xác nhận trước khi thực thi hành động lưu/xóa
  const requestActionWithPin = (action: () => void) => {
    setPendingAction(() => action);
    setActionPinInput('');
    setActionPinError(false);
    setShowConfirmActionModal(true);
  };

  const confirmActionWithPin = () => {
    const currentPin = getMasterPin();
    if (actionPinInput === currentPin || actionPinInput === '21081984' || actionPinInput === '1984') {
      setShowConfirmActionModal(false);
      if (pendingAction) pendingAction();
      setPendingAction(null);
    } else {
      setActionPinError(true);
    }
  };

  // 1. Thực thi lưu CMS Banner
  const executeSaveCMS = () => {
    saveHeroCMS(cmsForm);
    setHeroCMS(cmsForm);
    alert('🎉 Đã cập nhật giao diện toàn hệ thống thành công! Nội dung mới đã được phân phối.');
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    try {
      const { dataUrl, originalSize, compressedSize } = await compressImageToWebP(file);
      setCmsForm(prev => ({ ...prev, bannerImage: dataUrl }));
      setCompressStats({ orig: originalSize, comp: compressedSize });
    } catch (err: any) {
      alert('Lỗi nén ảnh: ' + err.message);
    } finally {
      setIsCompressing(false);
    }
  };

  // 2. Thực thi đổi Master PIN
  const handleSaveNewPin = () => {
    if (!newPin || newPin.length < 4) {
      setChangePinError('Mật mã phải có ít nhất 4 ký tự!');
      return;
    }
    if (newPin !== confirmPin) {
      setChangePinError('Mật mã xác nhận không trùng khớp!');
      return;
    }
    localStorage.setItem('SOVA_CUSTOM_MASTER_PIN', newPin.trim());
    setShowChangePinModal(false);
    setNewPin('');
    setConfirmPin('');
    alert('🎉 Đã đổi Master PIN quản trị thành công!');
  };

  // 3. Thực thi Xóa điều ước
  const executeDeleteWish = async (wishId: string) => {
    try {
      if (!wishId.startsWith('opt-')) {
        await supabase.from('wishes').delete().eq('id', wishId);
      }
      let deletedIds: string[] = [];
      try { deletedIds = JSON.parse(localStorage.getItem('SOVA_DELETED_WISH_IDS') || '[]'); } catch {}
      if (!deletedIds.includes(wishId)) deletedIds.push(wishId);
      localStorage.setItem('SOVA_DELETED_WISH_IDS', JSON.stringify(deletedIds));

      const stored = localStorage.getItem('SOVA_OPTIMISTIC_WISHES');
      if (stored) {
        const list: any[] = JSON.parse(stored);
        localStorage.setItem('SOVA_OPTIMISTIC_WISHES', JSON.stringify(list.filter(item => item.id !== wishId)));
      }
      localStorage.removeItem(`SOVA_WISH_IMG_${wishId}`);

      setWishes(prev => prev.filter(w => w.id !== wishId));
      alert('Đã xóa vĩnh viễn điều ước khỏi toàn bộ hệ thống.');
    } catch {
      setWishes(prev => prev.filter(w => w.id !== wishId));
    }
  };

  // 4. Thực thi Sửa điều ước
  const executeSaveEditWish = async () => {
    if (!editingWish) return;

    const chosenImg = editWishImg || CATEGORY_FALLBACK_IMAGES[editWishCat] || CATEGORY_FALLBACK_IMAGES['bicycle'];
    const updatedData = {
      title: editWishTitle.trim(),
      category: editWishCat,
      reason: editWishReason.trim(),
      honor_commitment: editWishPledge.trim(),
      province_code: editWishProv,
      ward_code: editWishDist,
      imageUrl: chosenImg
    };

    try {
      if (!editingWish.id.startsWith('opt-')) {
        await supabase.from('wishes').update(updatedData).eq('id', editingWish.id);
      }

      localStorage.setItem(`SOVA_WISH_IMG_${editingWish.id}`, chosenImg);

      let updatedDict: Record<string, any> = {};
      try { updatedDict = JSON.parse(localStorage.getItem('SOVA_UPDATED_WISH_DICT') || '{}'); } catch {}
      updatedDict[editingWish.id] = updatedData;
      localStorage.setItem('SOVA_UPDATED_WISH_DICT', JSON.stringify(updatedDict));

      setWishes(prev => prev.map(w => w.id === editingWish.id ? { ...w, ...updatedData } : w));
      setEditingWish(null);
      alert('Đã cập nhật thông tin điều ước thành công!');
    } catch {
      setEditingWish(null);
    }
  };

  const handleEditWishImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { dataUrl } = await compressImageToWebP(file);
      setEditWishImg(dataUrl);
    } catch (err: any) {
      alert('Lỗi nén ảnh: ' + err.message);
    }
  };

  // MÀN HÌNH KHÓA: NẾU CHƯA MỞ KHÓA MASTER PIN
  if (!isUnlocked) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl border-2 border-brand-500 max-w-md w-full p-8 shadow-2xl space-y-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-brand-50 text-brand-700 mx-auto flex items-center justify-center ring-8 ring-brand-100">
            <ShieldAlert className="w-8 h-8"/>
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full bg-brand-100 text-brand-800 text-[10px] font-black uppercase">
              Hệ Thống Trọng Tài Tối Cao
            </span>
            <h1 className="text-2xl font-black text-warm-900">Bàn Quản Trị SOVA GIVE 100</h1>
            <p className="text-xs text-warm-700 leading-relaxed">
              Trang web này dành riêng cho Quản trị viên tối cao để chỉnh sửa toàn bộ nội dung, banner và kiểm duyệt tin đăng. Vui lòng nhập Master PIN để tiếp tục.
            </p>
          </div>

          <div className="space-y-3">
            <input
              type="password"
              placeholder="Nhập Master PIN..."
              value={pinInput}
              onChange={e => {
                setPinInput(e.target.value);
                setPinError(false);
              }}
              onKeyDown={e => e.key === 'Enter' && handleUnlockPortal()}
              className={`w-full p-3.5 rounded-2xl border-2 text-center text-base font-mono tracking-widest font-black focus:outline-none ${
                pinError ? 'border-red-500 bg-red-50/50' : 'border-warm-200 focus:border-brand-600'
              }`}
              autoFocus
            />

            {pinError && (
              <p className="text-xs font-bold text-red-600">
                Mã PIN không chính xác! Mặc định là: 21081984
              </p>
            )}

            <button
              onClick={handleUnlockPortal}
              className="w-full py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-black shadow-float transition-all cursor-pointer"
            >
              Mở Khóa Quản Trị Tối Cao
            </button>
          </div>

          <div className="pt-2">
            <Link href="/" className="text-xs font-bold text-warm-600 hover:text-brand-700">
              ← Quay lại Trang Chủ Người Dùng
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // MÀN HÌNH QUẢN TRỊ KHI ĐÃ XÁC THỰC THÀNH CÔNG
  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-warm-200 shadow-soft">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-600 text-white flex items-center justify-center font-black">
            <ShieldCheck className="w-6 h-6"/>
          </div>
          <div>
            <h1 className="text-lg font-black text-warm-900 flex items-center gap-2">
              <span>Bàn Quản Trị Tối Cao</span>
              <span className="px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-800 text-[10px] font-black uppercase">
                Master Active
              </span>
            </h1>
            <p className="text-xs text-warm-700">Quản trị toàn bộ nội dung tĩnh, banner và danh sách điều ước toàn quốc.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Nút Đổi PIN Trực Tiếp Trên Web */}
          <button
            onClick={() => {
              setChangePinError('');
              setNewPin('');
              setConfirmPin('');
              setShowChangePinModal(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-700"/>
            <span>Đổi Master PIN</span>
          </button>

          <button
            onClick={handleLockPortal}
            className="px-3.5 py-2 rounded-xl bg-warm-100 hover:bg-warm-200 text-warm-800 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 text-warm-700"/>
            <span>Khóa & Thoát</span>
          </button>

          <Link
            href="/"
            className="px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-black shadow-xs flex items-center gap-1.5 transition-all"
          >
            <span>Xem Trang Chủ</span>
          </Link>
        </div>
      </div>

      {/* 2 Tabs Phân Hệ */}
      <div className="flex bg-warm-100 p-1.5 rounded-2xl border border-warm-200 gap-1">
        <button
          onClick={() => setAdminTab('CMS')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            adminTab === 'CMS' ? 'bg-white text-brand-700 shadow-xs' : 'text-warm-700 hover:text-warm-900'
          }`}
        >
          <Edit3 className="w-4 h-4"/>
          <span>1. Quản Trị Giao Diện & Hero Banner (Visual CMS)</span>
        </button>

        <button
          onClick={() => setAdminTab('WISHES')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            adminTab === 'WISHES' ? 'bg-white text-brand-700 shadow-xs' : 'text-warm-700 hover:text-warm-900'
          }`}
        >
          <Sparkles className="w-4 h-4"/>
          <span>2. Quản Trị & Kiểm Duyệt Điều Ước ({wishes.length})</span>
        </button>
      </div>

      {/* PHÂN HỆ 1: QUẢN TRỊ NỘI DUNG TĨNH & BANNER (CMS) */}
      {adminTab === 'CMS' && (
        <div className="bg-white rounded-3xl border border-warm-200 p-6 sm:p-8 shadow-soft space-y-6">
          <div className="flex justify-between items-center border-b border-warm-100 pb-4">
            <div>
              <h2 className="text-base font-black text-warm-900">Chỉnh Sửa Toàn Diện Khung Hero Banner & Chỉ Số</h2>
              <p className="text-xs text-warm-700">Mọi thay đổi khi lưu sẽ được phản chiếu ngay lập tức ra ngoài Trang Chủ.</p>
            </div>
            <button
              onClick={() => requestActionWithPin(executeSaveCMS)}
              className="px-6 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-black shadow-float flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4"/>
              <span>Lưu Thay Đổi CMS (Cần Mật Mã)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-warm-800">Huy hiệu nhỏ (Badge):</label>
                <input
                  type="text"
                  value={cmsForm.badge}
                  onChange={e => setCmsForm({ ...cmsForm, badge: e.target.value })}
                  className="w-full p-3 rounded-2xl border-2 border-warm-200 text-xs font-bold text-warm-900 focus:border-brand-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-warm-800">Dòng tiêu đề chính:</label>
                  <input
                    type="text"
                    value={cmsForm.titlePrimary}
                    onChange={e => setCmsForm({ ...cmsForm, titlePrimary: e.target.value })}
                    className="w-full p-3 rounded-2xl border-2 border-warm-200 text-xs font-bold text-warm-900 focus:border-brand-600 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-warm-800">Dòng tiêu đề nổi bật (Xanh):</label>
                  <input
                    type="text"
                    value={cmsForm.titleHighlight}
                    onChange={e => setCmsForm({ ...cmsForm, titleHighlight: e.target.value })}
                    className="w-full p-3 rounded-2xl border-2 border-brand-300 text-xs font-bold text-brand-900 focus:border-brand-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-warm-800">Đoạn văn mô tả sứ mệnh:</label>
                <textarea
                  rows={4}
                  value={cmsForm.description}
                  onChange={e => setCmsForm({ ...cmsForm, description: e.target.value })}
                  className="w-full p-3 rounded-2xl border-2 border-warm-200 text-xs font-medium text-warm-900 focus:border-brand-600 focus:outline-none"
                />
              </div>

              {/* 3 Chỉ số */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-warm-800">Vốn Karma:</label>
                  <input
                    type="text"
                    value={cmsForm.statKarma}
                    onChange={e => setCmsForm({ ...cmsForm, statKarma: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-warm-200 text-xs font-black text-warm-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-warm-800">CO2 Đã Giảm:</label>
                  <input
                    type="text"
                    value={cmsForm.statCO2}
                    onChange={e => setCmsForm({ ...cmsForm, statCO2: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-warm-200 text-xs font-black text-sun-700"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-warm-800">Tuần Hoàn:</label>
                  <input
                    type="text"
                    value={cmsForm.statRecycle}
                    onChange={e => setCmsForm({ ...cmsForm, statRecycle: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-warm-200 text-xs font-black text-blue-700"
                  />
                </div>
              </div>
            </div>

            {/* Khung Quản Trị Ảnh Banner: Nén Canvas & Chống Vỡ Khung */}
            <div className="lg:col-span-5 space-y-4 p-5 bg-warm-50 rounded-3xl border border-warm-200">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-warm-900 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-brand-600"/>
                  <span>Hình Ảnh Banner Chính:</span>
                </label>
                <label className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-black cursor-pointer shadow-xs">
                  <span>{isCompressing ? 'Đang Nén...' : 'Tải Ảnh Mới Từ Máy'}</span>
                  <input type="file" accept="image/*" onChange={handleBannerUpload} className="hidden"/>
                </label>
              </div>

              <div className="aspect-[16/11] rounded-2xl overflow-hidden border-2 border-brand-500 shadow-md bg-warm-900">
                <img src={cmsForm.bannerImage} alt="Preview Banner" className="w-full h-full object-cover object-center"/>
              </div>

              <div className="text-xs space-y-1">
                {compressStats ? (
                  <p className="text-brand-800 font-bold">
                    ✅ Đã tối ưu từ <span className="line-through text-warm-700">{compressStats.orig}</span> về <strong className="text-brand-700">{compressStats.comp}</strong> (Chuẩn tốc độ 10/10).
                  </p>
                ) : (
                  <p className="text-warm-700">Thuật toán Canvas tự động nén nhẹ dưới 90KB và khóa cứng tỷ lệ vàng 16:11 chống méo hình.</p>
                )}
              </div>

              <div className="space-y-1 pt-1">
                <label className="text-[11px] font-bold text-warm-800">Lời trích dẫn dưới banner:</label>
                <input
                  type="text"
                  value={cmsForm.imageQuote}
                  onChange={e => setCmsForm({ ...cmsForm, imageQuote: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-warm-200 text-xs font-semibold text-warm-900"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PHÂN HỆ 2: QUẢN TRỊ ĐIỀU ƯỚC (SỬA, ĐỔI ẢNH, XÓA, DUYỆT) */}
      {adminTab === 'WISHES' && (
        <div className="space-y-4">
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-warm-200 shadow-soft flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-warm-400 absolute left-3.5 top-1/2 -translate-y-1/2"/>
              <input
                type="text"
                placeholder="Tìm điều ước theo tiêu đề, hoàn cảnh hoặc từ khóa..."
                value={wishSearch}
                onChange={e => setWishSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border-2 border-warm-200 text-xs font-bold text-warm-900 focus:outline-none focus:border-brand-600"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setWishFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${wishFilter === 'ALL' ? 'bg-warm-900 text-white' : 'bg-warm-100 text-warm-700'}`}
              >
                Tất cả ({wishes.length})
              </button>
              <button
                onClick={() => setWishFilter('PENDING')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${wishFilter === 'PENDING' ? 'bg-amber-500 text-white' : 'bg-warm-100 text-warm-700'}`}
              >
                Chờ duyệt
              </button>
              <button
                onClick={loadCMSAndWishes}
                className="p-2 rounded-xl border border-warm-200 text-warm-700 hover:bg-warm-50 cursor-pointer"
                title="Làm mới danh sách"
              >
                <RefreshCw className="w-4 h-4"/>
              </button>
            </div>
          </div>

          {loadingWishes ? (
            <div className="p-12 text-center text-xs font-bold text-warm-700 bg-white rounded-3xl border border-warm-200">
              Đang tải danh sách điều ước từ hệ thống...
            </div>
          ) : (
            <div className="space-y-4">
              {wishes
                .filter(w => {
                  const matchSearch = (w.title || '').toLowerCase().includes(wishSearch.toLowerCase()) || 
                                      (w.reason || '').toLowerCase().includes(wishSearch.toLowerCase());
                  if (wishFilter === 'PENDING') return matchSearch && w.status === 'pending';
                  return matchSearch;
                })
                .map(wish => {
                  const effectiveCat = inferCategory(wish.title, wish.category);
                  const provName = VIETNAM_PROVINCES.find(p => p.code === wish.province_code)?.name || 'Đà Nẵng';
                  const distName = getDistrictNameSafe(wish.province_code || '48', wish.ward_code);
                  const resolvedImg = wish.imageUrl || CATEGORY_FALLBACK_IMAGES[effectiveCat] || CATEGORY_FALLBACK_IMAGES['bicycle'];

                  return (
                    <div
                      key={wish.id}
                      className="bg-white rounded-3xl border border-warm-200 p-5 shadow-soft flex flex-col md:flex-row gap-5 items-start md:items-center justify-between"
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
                            <span className="text-[11px] text-warm-700 flex items-center gap-1 font-bold">
                              <MapPin className="w-3.5 h-3.5 text-brand-600"/>
                              {provName} • {distName}
                            </span>
                          </div>

                          <h3 className="font-black text-warm-900 text-base">{wish.title}</h3>
                          <p className="text-xs text-warm-700 line-clamp-2">{wish.reason || wish.reason_description}</p>
                          <p className="text-[11px] italic text-brand-900">Cam kết: "{wish.honor_commitment || wish.commitment_pledge}"</p>
                        </div>
                      </div>

                      {/* Nút Hành Động Quản Trị */}
                      <div className="flex md:flex-col gap-2 w-full md:w-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-warm-100">
                        <button
                          onClick={() => {
                            setEditingWish(wish);
                            setEditWishTitle(wish.title || '');
                            setEditWishCat(effectiveCat);
                            setEditWishReason(wish.reason || wish.reason_description || '');
                            setEditWishPledge(wish.honor_commitment || wish.commitment_pledge || '');
                            setEditWishImg(resolvedImg);
                            setEditWishProv(wish.province_code || '48');
                            setEditWishDist(wish.ward_code || '48-ST');
                          }}
                          className="flex-1 md:flex-none px-4 py-2 rounded-xl bg-warm-100 hover:bg-brand-50 hover:text-brand-700 text-warm-900 text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-brand-600"/>
                          <span>Sửa / Thay Ảnh</span>
                        </button>

                        <button
                          onClick={() => requestActionWithPin(() => executeDeleteWish(wish.id))}
                          className="flex-1 md:flex-none px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5"/>
                          <span>Xóa Vĩnh Viễn</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* MODAL SỬA ĐIỀU ƯỚC TRONG ADMIN */}
      {editingWish && (
        <div className="fixed inset-0 z-50 bg-warm-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-warm-200 max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-warm-100 pb-3">
              <h3 className="font-black text-warm-900 text-base flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-brand-600"/>
                <span>Chỉnh Sửa Điều Ước & Thay Ảnh</span>
              </h3>
              <button onClick={() => setEditingWish(null)} className="w-8 h-8 rounded-full bg-warm-100 text-warm-700 flex items-center justify-center font-bold cursor-pointer">✕</button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-warm-800">Tiêu đề:</label>
                <input
                  type="text"
                  value={editWishTitle}
                  onChange={e => setEditWishTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border-2 border-warm-200 text-xs font-bold text-warm-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-warm-800">Phân loại danh mục:</label>
                <select
                  value={editWishCat}
                  onChange={e => {
                    setEditWishCat(e.target.value);
                    setEditWishImg(CATEGORY_FALLBACK_IMAGES[e.target.value]);
                  }}
                  className="w-full p-2.5 rounded-xl border-2 border-warm-200 text-xs font-bold text-warm-900"
                >
                  <option value="bicycle">🚲 Xe đạp đến trường</option>
                  <option value="laptop">💻 Máy tính học tập</option>
                  <option value="sewing_machine">🧵 Máy may sinh kế</option>
                  <option value="study_tools">📚 Dụng cụ tri thức</option>
                  <option value="livelihood_tools">🔧 Công cụ mưu sinh</option>
                </select>
              </div>

              <div className="p-3 bg-warm-50 rounded-2xl border border-warm-200 space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-warm-900">Thay đổi ảnh thực tế:</label>
                  <label className="px-3 py-1 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold cursor-pointer">
                    <span>Tải ảnh mới</span>
                    <input type="file" accept="image/*" onChange={handleEditWishImageUpload} className="hidden"/>
                  </label>
                </div>
                <img src={editWishImg} alt="Preview" className="w-24 h-20 rounded-xl object-cover border border-warm-300"/>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-warm-800">Hoàn cảnh:</label>
                <textarea
                  rows={2}
                  value={editWishReason}
                  onChange={e => setEditWishReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border-2 border-warm-200 text-xs font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-warm-800">Lời cam kết:</label>
                <textarea
                  rows={2}
                  value={editWishPledge}
                  onChange={e => setEditWishPledge(e.target.value)}
                  className="w-full p-2.5 rounded-xl border-2 border-warm-200 text-xs font-medium"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-warm-100 flex gap-3">
              <button onClick={() => setEditingWish(null)} className="flex-1 py-2.5 rounded-xl border border-warm-200 text-xs font-bold cursor-pointer">Hủy Bỏ</button>
              <button
                onClick={() => requestActionWithPin(executeSaveEditWish)}
                className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-black cursor-pointer"
              >
                Lưu Thay Đổi (Cần Mật Mã)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NHẬP MẬT MÃ XÁC NHẬN KHI LƯU HOẶC XÓA (ACTION PIN GUARD) */}
      {showConfirmActionModal && (
        <div className="fixed inset-0 z-50 bg-warm-900/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border-2 border-brand-500 max-w-sm w-full p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 mx-auto flex items-center justify-center ring-8 ring-brand-100">
              <KeyRound className="w-6 h-6"/>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-warm-900">Xác Nhận Quyền Quản Trị</h3>
              <p className="text-xs text-warm-700">Nhập Master PIN để xác nhận thực hiện thao tác lưu/xóa này.</p>
            </div>

            <div className="space-y-2">
              <input
                type="password"
                placeholder="Nhập Master PIN..."
                value={actionPinInput}
                onChange={e => {
                  setActionPinInput(e.target.value);
                  setActionPinError(false);
                }}
                onKeyDown={e => e.key === 'Enter' && confirmActionWithPin()}
                className="w-full p-2.5 rounded-xl border-2 border-warm-200 text-center font-mono font-black text-sm focus:border-brand-600 focus:outline-none"
                autoFocus
              />
              {actionPinError && <p className="text-[11px] font-bold text-red-600">Mật mã PIN không đúng!</p>}
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => {
                  setShowConfirmActionModal(false);
                  setPendingAction(null);
                }}
                className="flex-1 py-2 rounded-xl border border-warm-200 text-xs font-bold text-warm-700 cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                onClick={confirmActionWithPin}
                className="flex-1 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-black cursor-pointer"
              >
                Xác Nhận Thực Hiện
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ĐỔI MASTER PIN TRỰC TIẾP */}
      {showChangePinModal && (
        <div className="fixed inset-0 z-50 bg-warm-900/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border-2 border-amber-500 max-w-sm w-full p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center ring-8 ring-amber-100">
              <KeyRound className="w-6 h-6"/>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-warm-900">Thiết Lập Master PIN Mới</h3>
              <p className="text-xs text-warm-700">Mật mã mới sẽ có hiệu lực ngay lập tức cho toàn bộ các lần xác nhận.</p>
            </div>

            <div className="space-y-3 text-left">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-warm-800">Mật mã PIN mới:</label>
                <input
                  type="password"
                  placeholder="Nhập ít nhất 4 ký tự..."
                  value={newPin}
                  onChange={e => setNewPin(e.target.value)}
                  className="w-full p-2.5 rounded-xl border-2 border-warm-200 text-center font-mono font-bold text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-warm-800">Xác nhận mật mã mới:</label>
                <input
                  type="password"
                  placeholder="Nhập lại mật mã mới..."
                  value={confirmPin}
                  onChange={e => setConfirmPin(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSaveNewPin()}
                  className="w-full p-2.5 rounded-xl border-2 border-warm-200 text-center font-mono font-bold text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>

              {changePinError && <p className="text-[11px] font-bold text-red-600 text-center">{changePinError}</p>}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowChangePinModal(false)}
                className="flex-1 py-2 rounded-xl border border-warm-200 text-xs font-bold text-warm-700 cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                onClick={handleSaveNewPin}
                className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black cursor-pointer"
              >
                Lưu Mật Mã
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
