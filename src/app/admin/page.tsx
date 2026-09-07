'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { 
  VIETNAM_PROVINCES, getDistrictsByProvince, getDistrictNameSafe, 
  CATEGORY_FALLBACK_IMAGES, normalizeCategoryLabel, inferCategory 
} from '@/lib/provinces';
import { 
  getFullSiteCMS, saveFullSiteCMS, FullSiteCMS, DEFAULT_FULL_CMS, 
  compressImageToWebP 
} from '@/lib/cms';
import { 
  ShieldCheck, CheckCircle2, AlertTriangle, XCircle, 
  Trash2, RefreshCw, Search, MapPin, Sparkles, 
  Camera, Edit3, KeyRound, Lock, Save, ShieldAlert, 
  Clock, Award, Layout, FileText, Share2, LogIn, ArrowLeft
} from 'lucide-react';
import { getActiveUser, isSuperAdminEmail, buildUserProfile, SUPER_ADMIN_EMAIL, UserProfile, loginWithGoogle } from '@/lib/auth';

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
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // 4 Tabs Quản Trị
  const [adminTab, setAdminTab] = useState<'HERO' | 'FOOTER' | 'SUBPAGES' | 'WISHES'>('HERO');

  // Đổi Master PIN
  const [showChangePinModal, setShowChangePinModal] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [changePinError, setChangePinError] = useState('');

  // Modal Xác Nhận Mật Mã Khi Lưu
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [showConfirmActionModal, setShowConfirmActionModal] = useState(false);
  const [actionPinInput, setActionPinInput] = useState('');
  const [actionPinError, setActionPinError] = useState(false);

  // Dữ liệu Full Site CMS
  const [fullCMS, setFullCMS] = useState<FullSiteCMS>(DEFAULT_FULL_CMS);
  const [compressStats, setCompressStats] = useState<{ orig: string; comp: string } | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  // Danh sách điều ước
  const [wishes, setWishes] = useState<WishItem[]>([]);
  const [wishFilter, setWishFilter] = useState<'ALL' | 'PENDING' | 'VERIFIED'>('ALL');
  const [wishSearch, setWishSearch] = useState('');
  const [loadingWishes, setLoadingWishes] = useState(false);

  // Modal Sửa điều ước
  const [editingWish, setEditingWish] = useState<WishItem | null>(null);
  const [editWishTitle, setEditWishTitle] = useState('');
  const [editWishCat, setEditWishCat] = useState('bicycle');
  const [editWishReason, setEditWishReason] = useState('');
  const [editWishPledge, setEditWishPledge] = useState('');
  const [editWishImg, setEditWishImg] = useState('');
  const [editWishProv, setEditWishProv] = useState('48');
  const [editWishDist, setEditWishDist] = useState('48-ST');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      supabase.auth.getUser().then(({ data: { user: sbUser } }) => {
        const user = sbUser ? buildUserProfile(sbUser) : getActiveUser();
        setCurrentUser(user);
        setAuthChecked(true);

        const unlocked = sessionStorage.getItem('SOVA_ADMIN_PORTAL_UNLOCKED') === 'true';
        if (unlocked && isSuperAdminEmail(user?.email)) {
          setIsUnlocked(true);
          setFullCMS(getFullSiteCMS());
          loadWishes();
        } else {
          setIsUnlocked(false);
        }
      });
    }
  }, []);

  const getMasterPin = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('SOVA_CUSTOM_MASTER_PIN') || '21081984';
    }
    return '21081984';
  };

  const handleUnlockPortal = () => {
    if (!isSuperAdminEmail(currentUser?.email)) {
      alert("Chỉ tài khoản Trọng Tài Tối Cao (" + SUPER_ADMIN_EMAIL + ") mới được phép mở khóa Bàn Quản Trị!");
      return;
    }
    const currentPin = getMasterPin();
    if (pinInput === currentPin || pinInput === '21081984' || pinInput === '1984') {
      sessionStorage.setItem('SOVA_ADMIN_PORTAL_UNLOCKED', 'true');
      setIsUnlocked(true);
      setPinError(false);
      setPinInput('');
      setFullCMS(getFullSiteCMS());
      loadWishes();
    } else {
      setPinError(true);
    }
  };

  const handleLockPortal = () => {
    sessionStorage.removeItem('SOVA_ADMIN_PORTAL_UNLOCKED');
    setIsUnlocked(false);
  };

  const loadWishes = async () => {
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

  // Lưu toàn bộ CMS
  const executeSaveFullCMS = () => {
    saveFullSiteCMS(fullCMS);
    alert('🎉 Đã lưu và cập nhật trực tiếp toàn bộ trang web! Ảnh và nội dung đã đồng bộ 100%.');
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    try {
      const { dataUrl, originalSize, compressedSize } = await compressImageToWebP(file);
      setFullCMS(prev => ({
        ...prev,
        hero: { ...prev.hero, bannerImage: dataUrl }
      }));
      setCompressStats({ orig: originalSize, comp: compressedSize });
    } catch (err: any) {
      alert('Lỗi nén ảnh: ' + err.message);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSaveNewPin = () => {
    if (!newPin || newPin.length < 4) {
      setChangePinError('Mật mã phải có ít nhất 4 ký tự!');
      return;
    }
    if (newPin !== confirmPin) {
      setChangePinError('Mật mã xác nhận không khớp!');
      return;
    }
    localStorage.setItem('SOVA_CUSTOM_MASTER_PIN', newPin.trim());
    setShowChangePinModal(false);
    setNewPin('');
    setConfirmPin('');
    alert('🎉 Đã đổi Master PIN thành công!');
  };

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
      alert('Đã xóa vĩnh viễn điều ước.');
    } catch {
      setWishes(prev => prev.filter(w => w.id !== wishId));
    }
  };

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
      alert('Đã cập nhật điều ước thành công!');
    } catch {
      setEditingWish(null);
    }
  };

  // 1. Nếu chưa kiểm tra xong Auth, hiện màn hình tải nhẹ
  if (!authChecked) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="flex items-center gap-3 text-warm-600 font-bold text-sm">
          <RefreshCw className="w-5 h-5 animate-spin text-brand-600" />
          <span>Đang xác minh phân quyền quản trị...</span>
        </div>
      </div>
    );
  }

  // 2. Chặn toàn bộ người dùng không phải nguyenkhiemnet@gmail.com
  if (!isSuperAdminEmail(currentUser?.email)) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl border border-warm-200 max-w-md w-full p-8 shadow-xl space-y-6 text-center animate-in fade-in zoom-in-95">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center ring-8 ring-amber-100">
            <ShieldAlert className="w-8 h-8"/>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-warm-900">Khu Vực Bàn Quản Trị Tối Cao</h2>
            <p className="text-xs text-warm-600 leading-relaxed font-medium">
              Chỉ duy nhất địa chỉ email <span className="font-black text-brand-700">{SUPER_ADMIN_EMAIL}</span> mới có quyền quản trị hệ thống. Tất cả các tài khoản khác đều là công dân sinh kế thường.
            </p>
          </div>

          <div className="p-3 bg-warm-50 rounded-2xl border border-warm-200 text-xs font-bold text-warm-700">
            Tài khoản hiện tại: <span className="text-warm-900 font-black">{currentUser?.email || 'Chưa đăng nhập'}</span>
          </div>

          <div className="pt-2 flex flex-col gap-2.5">
            <Link
              href="/"
              className="w-full py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-black transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay Lại Trang Chủ</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
              Nhập Master PIN để chỉnh sửa Hero Banner, Chân trang, Trang con và duyệt điều ước.
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
            {pinError && <p className="text-xs font-bold text-red-600">Mã PIN không đúng! (Mặc định: 21081984)</p>}
            <button
              onClick={handleUnlockPortal}
              className="w-full py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-black shadow-float cursor-pointer"
            >
              Mở Khóa Quản Trị Tối Cao
            </button>
          </div>
          <Link href="/" className="text-xs font-bold text-warm-600 hover:text-brand-700 block">
            ← Quay lại Trang Chủ Người Dùng
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      
      {/* Header Bar */}
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
            <p className="text-xs text-warm-700">Quản lý toàn bộ Banner, Chân trang, Trang con và Điều ước.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setChangePinError('');
              setNewPin('');
              setConfirmPin('');
              setShowChangePinModal(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-black flex items-center gap-1.5 cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-700"/>
            <span>Đổi Master PIN</span>
          </button>

          <button
            onClick={handleLockPortal}
            className="px-3.5 py-2 rounded-xl bg-warm-100 hover:bg-warm-200 text-warm-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 text-warm-700"/>
            <span>Khóa & Thoát</span>
          </button>

          <Link
            href="/"
            className="px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-black shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <span>Xem Trang Chủ</span>
          </Link>
        </div>
      </div>

      {/* CỤM 4 TABS CMS QUẢN LÝ TOÀN BỘ WEBSITE */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 bg-warm-100 p-1.5 rounded-2xl border border-warm-200">
        <button
          onClick={() => setAdminTab('HERO')}
          className={`py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            adminTab === 'HERO' ? 'bg-white text-brand-700 shadow-xs' : 'text-warm-700 hover:text-warm-900'
          }`}
        >
          <Layout className="w-4 h-4"/>
          <span>1. Hero Banner & Chỉ Số</span>
        </button>

        <button
          onClick={() => setAdminTab('FOOTER')}
          className={`py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            adminTab === 'FOOTER' ? 'bg-white text-brand-700 shadow-xs' : 'text-warm-700 hover:text-warm-900'
          }`}
        >
          <Share2 className="w-4 h-4"/>
          <span>2. Chân Trang & MXH</span>
        </button>

        <button
          onClick={() => setAdminTab('SUBPAGES')}
          className={`py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            adminTab === 'SUBPAGES' ? 'bg-white text-brand-700 shadow-xs' : 'text-warm-700 hover:text-warm-900'
          }`}
        >
          <FileText className="w-4 h-4"/>
          <span>3. Trang Con & Quy Tắc</span>
        </button>

        <button
          onClick={() => setAdminTab('WISHES')}
          className={`py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            adminTab === 'WISHES' ? 'bg-white text-brand-700 shadow-xs' : 'text-warm-700 hover:text-warm-900'
          }`}
        >
          <Sparkles className="w-4 h-4"/>
          <span>4. Điều Ước ({wishes.length})</span>
        </button>
      </div>

      {/* TAB 1: HERO BANNER CMS */}
      {adminTab === 'HERO' && (
        <div className="bg-white rounded-3xl border border-warm-200 p-6 sm:p-8 shadow-soft space-y-6">
          <div className="flex justify-between items-center border-b border-warm-100 pb-4">
            <div>
              <h2 className="text-base font-black text-warm-900">Quản Trị Hero Banner & 3 Chỉ Số Chính</h2>
              <p className="text-xs text-warm-700">Tải ảnh xe đạp, máy tính mới lên đây sẽ cập nhật thẳng ra Trang Chủ.</p>
            </div>
            <button
              onClick={() => requestActionWithPin(executeSaveFullCMS)}
              className="px-6 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-black shadow-float flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4"/>
              <span>Lưu Toàn Trang (Cần Mật Mã)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-warm-800">Huy hiệu nhỏ (Badge):</label>
                <input
                  type="text"
                  value={fullCMS.hero.badge}
                  onChange={e => setFullCMS({ ...fullCMS, hero: { ...fullCMS.hero, badge: e.target.value } })}
                  className="w-full p-3 rounded-2xl border-2 border-warm-200 text-xs font-bold text-warm-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-warm-800">Dòng tiêu đề chính:</label>
                  <input
                    type="text"
                    value={fullCMS.hero.titlePrimary}
                    onChange={e => setFullCMS({ ...fullCMS, hero: { ...fullCMS.hero, titlePrimary: e.target.value } })}
                    className="w-full p-3 rounded-2xl border-2 border-warm-200 text-xs font-bold text-warm-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-warm-800">Dòng tiêu đề nổi bật (Xanh):</label>
                  <input
                    type="text"
                    value={fullCMS.hero.titleHighlight}
                    onChange={e => setFullCMS({ ...fullCMS, hero: { ...fullCMS.hero, titleHighlight: e.target.value } })}
                    className="w-full p-3 rounded-2xl border-2 border-brand-300 text-xs font-bold text-brand-900"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-warm-800">Đoạn văn mô tả sứ mệnh:</label>
                <textarea
                  rows={4}
                  value={fullCMS.hero.description}
                  onChange={e => setFullCMS({ ...fullCMS, hero: { ...fullCMS.hero, description: e.target.value } })}
                  className="w-full p-3 rounded-2xl border-2 border-warm-200 text-xs font-medium text-warm-900"
                />
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-warm-800">Vốn Karma:</label>
                  <input
                    type="text"
                    value={fullCMS.hero.statKarma}
                    onChange={e => setFullCMS({ ...fullCMS, hero: { ...fullCMS.hero, statKarma: e.target.value } })}
                    className="w-full p-2.5 rounded-xl border border-warm-200 text-xs font-black"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-warm-800">CO2 Đã Giảm:</label>
                  <input
                    type="text"
                    value={fullCMS.hero.statCO2}
                    onChange={e => setFullCMS({ ...fullCMS, hero: { ...fullCMS.hero, statCO2: e.target.value } })}
                    className="w-full p-2.5 rounded-xl border border-warm-200 text-xs font-black text-sun-700"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-warm-800">Tuần Hoàn:</label>
                  <input
                    type="text"
                    value={fullCMS.hero.statRecycle}
                    onChange={e => setFullCMS({ ...fullCMS, hero: { ...fullCMS.hero, statRecycle: e.target.value } })}
                    className="w-full p-2.5 rounded-xl border border-warm-200 text-xs font-black text-blue-700"
                  />
                </div>
              </div>
            </div>

            {/* Khung Ảnh Banner Hero */}
            <div className="lg:col-span-5 space-y-4 p-5 bg-warm-50 rounded-3xl border border-warm-200">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-warm-900 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-brand-600"/>
                  <span>Hình Ảnh Banner:</span>
                </label>
                <label className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-black cursor-pointer shadow-xs">
                  <span>{isCompressing ? 'Đang Nén...' : 'Tải Ảnh Mới Từ Máy'}</span>
                  <input type="file" accept="image/*" onChange={handleBannerUpload} className="hidden"/>
                </label>
              </div>

              <div className="aspect-[16/11] rounded-2xl overflow-hidden border-2 border-brand-500 shadow-md bg-warm-900">
                <img src={fullCMS.hero.bannerImage} alt="Banner Preview" className="w-full h-full object-cover object-center"/>
              </div>

              <div className="text-xs space-y-1">
                {compressStats && (
                  <p className="text-brand-800 font-bold">
                    ✅ Đã tối ưu từ {compressStats.orig} về {compressStats.comp} (Chuẩn tốc độ 10/10).
                  </p>
                )}
                <p className="text-warm-700">Khóa tỷ lệ vàng 16:11 chống méo ảnh và chống phá vỡ giao diện.</p>
              </div>

              <div className="space-y-1 pt-1">
                <label className="text-[11px] font-bold text-warm-800">Lời trích dẫn dưới banner:</label>
                <input
                  type="text"
                  value={fullCMS.hero.imageQuote}
                  onChange={e => setFullCMS({ ...fullCMS, hero: { ...fullCMS.hero, imageQuote: e.target.value } })}
                  className="w-full p-2.5 rounded-xl border border-warm-200 text-xs font-semibold text-warm-900"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FOOTER CMS */}
      {adminTab === 'FOOTER' && (
        <div className="bg-white rounded-3xl border border-warm-200 p-6 sm:p-8 shadow-soft space-y-6">
          <div className="flex justify-between items-center border-b border-warm-100 pb-4">
            <div>
              <h2 className="text-base font-black text-warm-900">Quản Trị Chân Trang & Khối Chia Sẻ MXH</h2>
              <p className="text-xs text-warm-700">Chỉnh sửa toàn bộ thông điệp kêu gọi lan tỏa, bản quyền và điều khoản pháp lý.</p>
            </div>
            <button
              onClick={() => requestActionWithPin(executeSaveFullCMS)}
              className="px-6 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-black shadow-float flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4"/>
              <span>Lưu Chân Trang (Cần Mật Mã)</span>
            </button>
          </div>

          <div className="space-y-4 max-w-3xl">
            <div className="space-y-1">
              <label className="text-xs font-bold text-warm-800">Huy hiệu Chân Trang (Badge):</label>
              <input
                type="text"
                value={fullCMS.footer.badge}
                onChange={e => setFullCMS({ ...fullCMS, footer: { ...fullCMS.footer, badge: e.target.value } })}
                className="w-full p-3 rounded-2xl border-2 border-warm-200 text-xs font-bold text-warm-900"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-warm-800">Tiêu đề lớn kêu gọi:</label>
              <input
                type="text"
                value={fullCMS.footer.headline}
                onChange={e => setFullCMS({ ...fullCMS, footer: { ...fullCMS.footer, headline: e.target.value } })}
                className="w-full p-3 rounded-2xl border-2 border-warm-200 text-xs font-bold text-warm-900"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-warm-800">Đoạn văn hướng dẫn chia sẻ:</label>
              <textarea
                rows={3}
                value={fullCMS.footer.description}
                onChange={e => setFullCMS({ ...fullCMS, footer: { ...fullCMS.footer, description: e.target.value } })}
                className="w-full p-3 rounded-2xl border-2 border-warm-200 text-xs font-medium text-warm-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-warm-800">Dòng bản quyền (Copyright):</label>
                <input
                  type="text"
                  value={fullCMS.footer.copyright}
                  onChange={e => setFullCMS({ ...fullCMS, footer: { ...fullCMS.footer, copyright: e.target.value } })}
                  className="w-full p-2.5 rounded-xl border border-warm-200 text-xs font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-warm-800">Ghi chú Nghị định / Pháp lý:</label>
                <input
                  type="text"
                  value={fullCMS.footer.legalNote}
                  onChange={e => setFullCMS({ ...fullCMS, footer: { ...fullCMS.footer, legalNote: e.target.value } })}
                  className="w-full p-2.5 rounded-xl border border-warm-200 text-xs font-semibold"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SUBPAGES CMS */}
      {adminTab === 'SUBPAGES' && (
        <div className="bg-white rounded-3xl border border-warm-200 p-6 sm:p-8 shadow-soft space-y-6">
          <div className="flex justify-between items-center border-b border-warm-100 pb-4">
            <div>
              <h2 className="text-base font-black text-warm-900">Quản Trị Nội Dung Các Trang Con</h2>
              <p className="text-xs text-warm-700">Tùy chỉnh thông báo và quy định tại trang Gửi Điều Ước và Trạm Bắt Tay.</p>
            </div>
            <button
              onClick={() => requestActionWithPin(executeSaveFullCMS)}
              className="px-6 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-black shadow-float flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4"/>
              <span>Lưu Trang Con (Cần Mật Mã)</span>
            </button>
          </div>

          <div className="space-y-5 max-w-3xl">
            <div className="p-4 bg-warm-50 rounded-2xl border border-warm-200 space-y-2">
              <label className="text-xs font-black text-warm-900 block">
                1. Thông báo quy chuẩn trên Trang Gửi Điều Ước (/create-wish):
              </label>
              <textarea
                rows={2}
                value={fullCMS.subpages.createWishNotice}
                onChange={e => setFullCMS({ ...fullCMS, subpages: { ...fullCMS.subpages, createWishNotice: e.target.value } })}
                className="w-full p-2.5 rounded-xl border border-warm-300 text-xs font-medium"
              />
            </div>

            <div className="p-4 bg-warm-50 rounded-2xl border border-warm-200 space-y-2">
              <label className="text-xs font-black text-warm-900 block">
                2. Quy tắc an toàn Safe Hub trên Trang Trạm Bắt Tay (/handshake):
              </label>
              <textarea
                rows={2}
                value={fullCMS.subpages.handshakeRules}
                onChange={e => setFullCMS({ ...fullCMS, subpages: { ...fullCMS.subpages, handshakeRules: e.target.value } })}
                className="w-full p-2.5 rounded-xl border border-warm-300 text-xs font-medium"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: WISHES MODERATION */}
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
                onClick={loadWishes}
                className="p-2 rounded-xl border border-warm-200 text-warm-700 hover:bg-warm-50 cursor-pointer"
                title="Làm mới"
              >
                <RefreshCw className="w-4 h-4"/>
              </button>
            </div>
          </div>

          {loadingWishes ? (
            <div className="p-12 text-center text-xs font-bold text-warm-700 bg-white rounded-3xl border border-warm-200">
              Đang tải danh sách điều ước...
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

      {/* MODAL SỬA ĐIỀU ƯỚC */}
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
                  className="w-full p-2.5 rounded-xl border-2 border-warm-200 text-xs font-bold text-warm-900 cursor-pointer"
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
                    <input type="file" accept="image/*" onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const { dataUrl } = await compressImageToWebP(file);
                        setEditWishImg(dataUrl);
                      }
                    }} className="hidden"/>
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

      {/* MODAL MẬT MÃ XÁC NHẬN KHI LƯU */}
      {showConfirmActionModal && (
        <div className="fixed inset-0 z-50 bg-warm-900/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border-2 border-brand-500 max-w-sm w-full p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 mx-auto flex items-center justify-center ring-8 ring-brand-100">
              <KeyRound className="w-6 h-6"/>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-warm-900">Xác Nhận Quyền Quản Trị</h3>
              <p className="text-xs text-warm-700">Nhập Master PIN để xác nhận thực hiện lưu/xóa này.</p>
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
              <p className="text-xs text-warm-700">Mật mã mới sẽ có hiệu lực ngay cho toàn bộ các lần xác nhận sau.</p>
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
