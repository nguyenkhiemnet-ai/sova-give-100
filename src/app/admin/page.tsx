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
  compressImageToWebP, DynamicCategoryItem 
} from '@/lib/cms';
import { 
  ShieldCheck, CheckCircle2, AlertTriangle, XCircle, 
  Trash2, RefreshCw, Search, MapPin, Sparkles, 
  Camera, Edit3, KeyRound, Lock, Save, ShieldAlert, 
  Clock, Award, Layout, FileText, Share2, LogIn, ArrowLeft,
  Users, Mail, Tag, Database, Compass, Bell, Download, FileSpreadsheet, Plus, Check,
  Copy, ExternalLink, X
} from 'lucide-react';
import { 
  getActiveUser, isSuperAdminEmail, buildUserProfile, 
  SUPER_ADMIN_EMAIL, UserProfile, loginWithGoogle,
  getAllProfiles, resetPassword
} from '@/lib/auth';

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

  // 8 Phân Hệ Quản Trị Tối Cao
  const [adminTab, setAdminTab] = useState<'HERO' | 'FOOTER' | 'SUBPAGES' | 'WISHES' | 'USERS' | 'CATEGORIES' | 'PASSPORTS' | 'SYSTEM'>('HERO');

  // Quản lý Danh mục động (Categories)
  const [newCatId, setNewCatId] = useState('');
  const [newCatLabel, setNewCatLabel] = useState('');
  const [newCatShort, setNewCatShort] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  const handleAddCategory = () => {
    if (!newCatId.trim() || !newCatLabel.trim()) {
      alert('Vui lòng điền mã ID và tên danh mục!');
      return;
    }
    const cleanId = newCatId.trim().toLowerCase().replace(/\s+/g, '_');
    const existing = fullCMS.categories || DEFAULT_FULL_CMS.categories;
    if (existing.some(c => c.id === cleanId)) {
      alert('Mã danh mục này đã tồn tại!');
      return;
    }
    const newCategory: DynamicCategoryItem = {
      id: cleanId,
      label: newCatLabel.trim(),
      shortLabel: newCatShort.trim() || newCatLabel.trim(),
      desc: newCatDesc.trim() || `Tài trợ ${newCatLabel.trim()} 0-VND`,
      iconName: 'Tag'
    };
    const updatedCategories = [...existing, newCategory];
    setFullCMS(prev => ({ ...prev, categories: updatedCategories }));
    setNewCatId('');
    setNewCatLabel('');
    setNewCatShort('');
    setNewCatDesc('');
    alert('Đã thêm danh mục mới vào danh sách. Hãy bấm "Lưu Toàn Trang (Cần Mật Mã)" để áp dụng!');
  };

  const handleDeleteCategory = (catId: string) => {
    const existing = fullCMS.categories || DEFAULT_FULL_CMS.categories;
    if (existing.length <= 1) {
      alert('Hệ thống cần ít nhất 1 danh mục hoạt động!');
      return;
    }
    const updatedCategories = existing.filter(c => c.id !== catId);
    setFullCMS(prev => ({ ...prev, categories: updatedCategories }));
  };

  // Quản lý Sổ cái Hộ chiếu & Bắt tay (Passports)
  const [passportsList, setPassportsList] = useState<any[]>([]);
  const [passportFilter, setPassportFilter] = useState<'ALL' | 'ACTIVE' | 'TRANSFERRED'>('ALL');
  const [passportSearch, setPassportSearch] = useState('');

  const loadPassports = () => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('SOVA_PASSPORTS_LEDGER');
      if (stored) {
        setPassportsList(JSON.parse(stored));
        return;
      }
    } catch {}

    const defaults = [
      { code: 'SOVA-PASS-8842-VN', title: 'Laptop ThinkPad T480 Core i5 / 16GB SSD', category: 'laptop', cycleCount: 2, status: 'ACTIVE', actor: 'Lê Thu Hằng', created_at: '2026-03-01' },
      { code: 'SOVA-PASS-4921-VN', title: 'Xe đạp cào cào Asama 26 inch', category: 'bicycle', cycleCount: 1, status: 'ACTIVE', actor: 'Trần Văn Tuấn', created_at: '2026-02-15' },
      { code: 'SOVA-PASS-3118-VN', title: 'Máy may công nghiệp Juki điện tử', category: 'sewing_machine', cycleCount: 3, status: 'TRANSFERRED', actor: 'Chị Nguyễn Thị Mai', created_at: '2026-01-20' },
      { code: 'SOVA-PASS-7729-VN', title: 'Bộ đồ nghề cơ khí sửa xe máy lưu động', category: 'livelihood_tools', cycleCount: 1, status: 'ACTIVE', actor: 'Nguyễn Quốc Cường', created_at: '2026-03-05' }
    ];
    setPassportsList(defaults);
    localStorage.setItem('SOVA_PASSPORTS_LEDGER', JSON.stringify(defaults));
  };

  const handleUpdatePassportStatus = (code: string, newStatus: string) => {
    const updated = passportsList.map(p => p.code === code ? { ...p, status: newStatus } : p);
    setPassportsList(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('SOVA_PASSPORTS_LEDGER', JSON.stringify(updated));
    }
  };

  // Sao lưu & Xuất dữ liệu
  const [backupNotice, setBackupNotice] = useState('');

  const exportFullBackupJSON = () => {
    const backupData = {
      version: 'SOVA-ENTERPRISE-10.0',
      exported_at: new Date().toISOString(),
      admin_operator: 'Nguyenkhiemnet@gmail.com',
      cms: fullCMS,
      users: users,
      wishes: wishes,
      passports: passportsList
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SOVA_BACKUP_FULL_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setBackupNotice('Đã xuất file sao lưu toàn bộ hệ thống JSON thành công!');
    setTimeout(() => setBackupNotice(''), 4000);
  };

  const exportUsersCSV = () => {
    let csv = 'ID,Ho_Va_Ten,Email,Vai_Tro,Karma,CO2_Giam_kg,Ngay_Dang_Ky\n';
    users.forEach(u => {
      const name = `"${(u.full_name || '').replace(/"/g, '""')}"`;
      const email = `"${(u.email || '').replace(/"/g, '""')}"`;
      const role = u.role || 'USER';
      const karma = u.karma || 100;
      const co2 = u.co2_saved || 0;
      const date = u.created_at || '';
      csv += `${u.id},${name},${email},${role},${karma},${co2},${date}\n`;
    });

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SOVA_USERS_LIST_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setBackupNotice('Đã xuất danh sách thành viên CSV thành công!');
    setTimeout(() => setBackupNotice(''), 4000);
  };

  const purgeClientCache = () => {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem('SOVA_ADMIN_PORTAL_UNLOCKED');
    localStorage.removeItem('SOVA_OPTIMISTIC_WISHES');
    localStorage.removeItem('SOVA_DELETED_WISHES');
    setBackupNotice('Đã dọn sạch toàn bộ cache tạm thời trên máy. Dữ liệu Supabase được bảo toàn nguyên vẹn.');
    setTimeout(() => setBackupNotice(''), 4000);
  };

  // Quản lý thành viên (Users)
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'ALL' | 'SUPER_ADMIN' | 'USER'>('ALL');
  const [resetMessage, setResetMessage] = useState<{ [email: string]: string }>({});
  const [resetCooldowns, setResetCooldowns] = useState<Record<string, number>>({});

  useEffect(() => {
    const hasActive = Object.values(resetCooldowns).some(c => c > 0);
    if (!hasActive) return;
    const timer = setInterval(() => {
      setResetCooldowns(prev => {
        const updated = { ...prev };
        let changed = false;
        Object.keys(updated).forEach(k => {
          if (updated[k] > 0) {
            updated[k] -= 1;
            changed = true;
          }
        });
        return changed ? updated : prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [resetCooldowns]);

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const data = await getAllProfiles();
      setUsers(data);
    } catch (e) {
      console.error("Lỗi tải thành viên:", e);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Hệ thống thông báo Toast Ban Quản Trị
  const [adminToast, setAdminToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showAdminToast = (message: string, type: 'success' | 'error' = 'success') => {
    setAdminToast({ message, type });
    setTimeout(() => {
      setAdminToast(null);
    }, 5000);
  };

  // Trạng thái sinh Link Khôi Phục Trực Tiếp (Bypass SMTP)
  const [generatingLinks, setGeneratingLinks] = useState<{ [email: string]: boolean }>({});
  const [copiedLinks, setCopiedLinks] = useState<{ [email: string]: string }>({});

  // Modal đặt trực tiếp mật khẩu mới cho thành viên
  const [directPasswordModal, setDirectPasswordModal] = useState<{
    isOpen: boolean;
    user: any;
    password: string;
    loading: boolean;
    error: string;
    success: string;
  }>({
    isOpen: false,
    user: null,
    password: '',
    loading: false,
    error: '',
    success: ''
  });

  const handleGetDirectResetLink = async (userEmail: string) => {
    if (!userEmail) return;
    setGeneratingLinks(prev => ({ ...prev, [userEmail]: true }));
    try {
      const res = await fetch('/api/admin/auth-ops/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-recovery-link',
          targetEmail: userEmail,
          adminEmail: currentUser?.email || 'nguyenkhiemnet@gmail.com'
        })
      });
      const data = await res.json();
      if (data.success && data.actionLink) {
        setCopiedLinks(prev => ({ ...prev, [userEmail]: data.actionLink }));
        try {
          if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(data.actionLink);
          } else {
            const textArea = document.createElement('textarea');
            textArea.value = data.actionLink;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
          }
        } catch (clipErr) {
          console.warn("Lỗi ghi clipboard:", clipErr);
        }
        showAdminToast("Đã sao chép Link Đặt Lại Mật Khẩu! Hãy gửi link này cho thành viên qua Zalo/Tin nhắn", 'success');
      } else {
        showAdminToast(data.error || "Không thể tạo link khôi phục.", 'error');
      }
    } catch (err: any) {
      showAdminToast("Lỗi kết nối khi sinh link khôi phục.", 'error');
    } finally {
      setGeneratingLinks(prev => ({ ...prev, [userEmail]: false }));
    }
  };

  const handleDirectUpdatePassword = async () => {
    if (!directPasswordModal.user || !directPasswordModal.password) {
      setDirectPasswordModal(prev => ({ ...prev, error: 'Vui lòng nhập mật khẩu mới.' }));
      return;
    }
    if (directPasswordModal.password.length < 6) {
      setDirectPasswordModal(prev => ({ ...prev, error: 'Mật khẩu cần tối thiểu 6 ký tự.' }));
      return;
    }
    setDirectPasswordModal(prev => ({ ...prev, loading: true, error: '', success: '' }));
    try {
      const res = await fetch('/api/admin/auth-ops/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-password',
          targetEmail: directPasswordModal.user.email,
          targetUserId: directPasswordModal.user.id,
          newPassword: directPasswordModal.password,
          adminEmail: currentUser?.email || 'nguyenkhiemnet@gmail.com'
        })
      });
      const data = await res.json();
      if (data.success) {
        setDirectPasswordModal(prev => ({
          ...prev,
          loading: false,
          success: '🎉 Đã cập nhật mật khẩu mới thành công!',
          password: ''
        }));
        showAdminToast(`Đã đổi mật khẩu cho ${directPasswordModal.user.email} thành công!`, 'success');
        setTimeout(() => {
          setDirectPasswordModal(prev => ({ ...prev, isOpen: false, success: '', user: null }));
        }, 1500);
      } else {
        setDirectPasswordModal(prev => ({ ...prev, loading: false, error: data.error || 'Lỗi cập nhật mật khẩu.' }));
      }
    } catch (e: any) {
      setDirectPasswordModal(prev => ({ ...prev, loading: false, error: 'Lỗi kết nối máy chủ.' }));
    }
  };

  const handleSendResetPassword = async (userEmail: string) => {
    if ((resetCooldowns[userEmail] || 0) > 0) return;
    setResetMessage(prev => ({ ...prev, [userEmail]: 'Đang gửi...' }));
    setResetCooldowns(prev => ({ ...prev, [userEmail]: 60 }));
    const res = await resetPassword(userEmail);
    if (res.success) {
      setResetMessage(prev => ({ ...prev, [userEmail]: 'Đã gửi email khôi phục thành công! (Kiểm tra cả Inbox & Spam)' }));
    } else {
      let errText = res.error || '';
      if (errText.toLowerCase().includes('security purposes') || errText.toLowerCase().includes('rate limit') || errText.toLowerCase().includes('over_email_send_rate_limit')) {
        errText = 'Hệ thống bảo vệ chống spam: Vui lòng đợi 60 giây trước khi yêu cầu gửi lại.';
      }
      setResetMessage(prev => ({ ...prev, [userEmail]: `Lỗi: ${errText}` }));
    }
  };

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
          loadUsers();
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
      loadUsers();
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

      {/* CỤM 8 PHÂN HỆ QUẢN TRỊ TỐI CAO */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 bg-warm-100 p-2 rounded-2xl border border-warm-200">
        <button
          onClick={() => setAdminTab('HERO')}
          className={`py-2.5 px-2 rounded-xl text-[11px] font-black transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
            adminTab === 'HERO' ? 'bg-white text-brand-700 shadow-xs' : 'text-warm-700 hover:text-warm-900'
          }`}
        >
          <Layout className="w-4 h-4"/>
          <span>1. Hero Banner</span>
        </button>

        <button
          onClick={() => setAdminTab('FOOTER')}
          className={`py-2.5 px-2 rounded-xl text-[11px] font-black transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
            adminTab === 'FOOTER' ? 'bg-white text-brand-700 shadow-xs' : 'text-warm-700 hover:text-warm-900'
          }`}
        >
          <Share2 className="w-4 h-4"/>
          <span>2. Chân Trang</span>
        </button>

        <button
          onClick={() => setAdminTab('SUBPAGES')}
          className={`py-2.5 px-2 rounded-xl text-[11px] font-black transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
            adminTab === 'SUBPAGES' ? 'bg-white text-brand-700 shadow-xs' : 'text-warm-700 hover:text-warm-900'
          }`}
        >
          <Bell className="w-4 h-4"/>
          <span>3. Bản Tin Khẩn</span>
        </button>

        <button
          onClick={() => setAdminTab('WISHES')}
          className={`py-2.5 px-2 rounded-xl text-[11px] font-black transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
            adminTab === 'WISHES' ? 'bg-white text-brand-700 shadow-xs' : 'text-warm-700 hover:text-warm-900'
          }`}
        >
          <Sparkles className="w-4 h-4"/>
          <span>4. Điều Ước ({wishes.length})</span>
        </button>

        <button
          onClick={() => {
            setAdminTab('USERS');
            loadUsers();
          }}
          className={`py-2.5 px-2 rounded-xl text-[11px] font-black transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
            adminTab === 'USERS' ? 'bg-white text-brand-700 shadow-xs' : 'text-warm-700 hover:text-warm-900'
          }`}
        >
          <Users className="w-4 h-4"/>
          <span>5. Thành Viên ({users.length})</span>
        </button>

        <button
          onClick={() => setAdminTab('CATEGORIES')}
          className={`py-2.5 px-2 rounded-xl text-[11px] font-black transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
            adminTab === 'CATEGORIES' ? 'bg-white text-brand-700 shadow-xs' : 'text-warm-700 hover:text-warm-900'
          }`}
        >
          <Tag className="w-4 h-4"/>
          <span>6. Danh Mục ({fullCMS.categories?.length || 5})</span>
        </button>

        <button
          onClick={() => {
            setAdminTab('PASSPORTS');
            loadPassports();
          }}
          className={`py-2.5 px-2 rounded-xl text-[11px] font-black transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
            adminTab === 'PASSPORTS' ? 'bg-white text-brand-700 shadow-xs' : 'text-warm-700 hover:text-warm-900'
          }`}
        >
          <Compass className="w-4 h-4"/>
          <span>7. Sổ Hộ Chiếu</span>
        </button>

        <button
          onClick={() => setAdminTab('SYSTEM')}
          className={`py-2.5 px-2 rounded-xl text-[11px] font-black transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
            adminTab === 'SYSTEM' ? 'bg-white text-brand-700 shadow-xs' : 'text-warm-700 hover:text-warm-900'
          }`}
        >
          <Database className="w-4 h-4"/>
          <span>8. Sao Lưu Data</span>
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

      {/* TAB 3: SUBPAGES & BROADCAST CMS */}
      {adminTab === 'SUBPAGES' && (
        <div className="bg-white rounded-3xl border border-warm-200 p-6 sm:p-8 shadow-soft space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-warm-100 pb-4">
            <div>
              <h2 className="text-base font-black text-warm-900">Bản Tin Khẩn Cấp Toàn Dân & Quy Định Trang Con</h2>
              <p className="text-xs text-warm-700">Kiểm soát dải thông báo khẩn cấp (Broadcast Banner) chạy dọc trên đầu trang web và quy định các trang con.</p>
            </div>
            <button
              onClick={() => requestActionWithPin(executeSaveFullCMS)}
              className="px-6 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-black shadow-float flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <Save className="w-4 h-4"/>
              <span>Lưu Cấu Hình (Cần Mật Mã)</span>
            </button>
          </div>

          {/* KHỐI 1: BẢN TIN KHẨN CẤP TOÀN DÂN (BROADCAST BANNER) */}
          <div className="p-5 bg-gradient-to-br from-amber-500/10 via-brand-500/5 to-transparent rounded-3xl border-2 border-brand-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-brand-600 shrink-0" />
                <h3 className="font-black text-warm-900 text-sm">1. Bản Tin Khẩn Cấp Toàn Hệ Thống (Broadcast Banner)</h3>
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none bg-white px-3 py-1.5 rounded-xl border border-warm-200">
                <input
                  type="checkbox"
                  checked={fullCMS.broadcast?.enabled ?? true}
                  onChange={e => setFullCMS({
                    ...fullCMS,
                    broadcast: { ...(fullCMS.broadcast || DEFAULT_FULL_CMS.broadcast), enabled: e.target.checked }
                  })}
                  className="w-4 h-4 accent-brand-600 rounded cursor-pointer"
                />
                <span className="text-xs font-black text-brand-800">
                  {fullCMS.broadcast?.enabled ? '🟢 Đang Kích Hoạt' : '⚪ Đã Tắt'}
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-warm-800">Cấp độ thông báo:</label>
                <select
                  value={fullCMS.broadcast?.type || 'info'}
                  onChange={e => setFullCMS({
                    ...fullCMS,
                    broadcast: { ...(fullCMS.broadcast || DEFAULT_FULL_CMS.broadcast), type: e.target.value as any }
                  })}
                  className="w-full p-2.5 rounded-xl border border-warm-300 text-xs font-bold text-warm-900 bg-white"
                >
                  <option value="info">🔵 Thông Tin (Màu Xanh Biển)</option>
                  <option value="alert">🟠 Cảnh Báo Khẩn (Màu Cam / Hổ Phách)</option>
                  <option value="success">🟢 Tin Vui / Thành Công (Màu Xanh Ngọc)</option>
                </select>
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-bold text-warm-800">Nội dung thông điệp khẩn cấp:</label>
                <input
                  type="text"
                  value={fullCMS.broadcast?.text || ''}
                  onChange={e => setFullCMS({
                    ...fullCMS,
                    broadcast: { ...(fullCMS.broadcast || DEFAULT_FULL_CMS.broadcast), text: e.target.value }
                  })}
                  placeholder="Ví dụ: 📢 Chiến dịch Trạm Bắt Tay 0-VND mùa tựu trường đang mở..."
                  className="w-full p-2.5 rounded-xl border border-warm-300 text-xs font-bold text-warm-900 bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-warm-800">Chữ trên nút liên kết (Tùy chọn):</label>
                <input
                  type="text"
                  value={fullCMS.broadcast?.linkText || ''}
                  onChange={e => setFullCMS({
                    ...fullCMS,
                    broadcast: { ...(fullCMS.broadcast || DEFAULT_FULL_CMS.broadcast), linkText: e.target.value }
                  })}
                  placeholder="Ví dụ: Đăng ký nhận xe ngay →"
                  className="w-full p-2.5 rounded-xl border border-warm-300 text-xs font-medium bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-warm-800">Đường dẫn liên kết (URL):</label>
                <input
                  type="text"
                  value={fullCMS.broadcast?.linkUrl || ''}
                  onChange={e => setFullCMS({
                    ...fullCMS,
                    broadcast: { ...(fullCMS.broadcast || DEFAULT_FULL_CMS.broadcast), linkUrl: e.target.value }
                  })}
                  placeholder="Ví dụ: /create-wish hoặc /handshake"
                  className="w-full p-2.5 rounded-xl border border-warm-300 text-xs font-medium bg-white"
                />
              </div>
            </div>
          </div>

          {/* KHỐI 2: NỘI DUNG TRANG CON */}
          <div className="space-y-4">
            <h3 className="font-black text-warm-900 text-sm">2. Quy Định và Thông Báo Các Trang Con</h3>

            <div className="p-4 bg-warm-50 rounded-2xl border border-warm-200 space-y-2">
              <label className="text-xs font-black text-warm-900 block">
                Thông báo quy chuẩn trên Trang Gửi Điều Ước (/create-wish):
              </label>
              <textarea
                rows={2}
                value={fullCMS.subpages.createWishNotice}
                onChange={e => setFullCMS({ ...fullCMS, subpages: { ...fullCMS.subpages, createWishNotice: e.target.value } })}
                className="w-full p-2.5 rounded-xl border border-warm-300 text-xs font-medium bg-white"
              />
            </div>

            <div className="p-4 bg-warm-50 rounded-2xl border border-warm-200 space-y-2">
              <label className="text-xs font-black text-warm-900 block">
                Quy tắc an toàn Safe Hub trên Trang Trạm Bắt Tay (/handshake):
              </label>
              <textarea
                rows={2}
                value={fullCMS.subpages.handshakeRules}
                onChange={e => setFullCMS({ ...fullCMS, subpages: { ...fullCMS.subpages, handshakeRules: e.target.value } })}
                className="w-full p-2.5 rounded-xl border border-warm-300 text-xs font-medium bg-white"
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

      {/* TAB 5: QUẢN LÝ THÀNH VIÊN & KHÁCH HÀNG ĐĂNG KÝ */}
      {adminTab === 'USERS' && (
        <div className="bg-white rounded-3xl border border-warm-200 p-6 sm:p-8 shadow-soft space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-warm-100 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-warm-900">Quản Lý Khách Hàng / Thành Viên Đăng Ký</h2>
                <span className="px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 text-xs font-black border border-brand-200">
                  {users.length} tài khoản
                </span>
              </div>
              <p className="text-xs text-warm-700 mt-0.5">
                Dữ liệu khách hàng đăng ký 0-VND. Bạn có quyền kiểm soát, xem trạng thái và gửi liên kết đặt lại mật khẩu trực tiếp.
              </p>
            </div>
            
            <button
              onClick={loadUsers}
              disabled={loadingUsers}
              className="px-4 py-2 rounded-xl bg-warm-100 hover:bg-warm-200 text-warm-900 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingUsers ? 'animate-spin' : ''}`}/>
              <span>Làm Mới Danh Sách</span>
            </button>
          </div>

          {/* THANH TÌM KIẾM & BỘ LỌC THÀNH VIÊN */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-warm-400 absolute left-3.5 top-1/2 -translate-y-1/2"/>
              <input
                type="text"
                placeholder="Tìm theo email hoặc họ tên thành viên..."
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border-2 border-warm-200 text-xs font-bold text-warm-900 focus:outline-none focus:border-brand-600 placeholder:font-normal placeholder:text-warm-400"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setUserRoleFilter('ALL')}
                className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                  userRoleFilter === 'ALL' ? 'bg-brand-600 text-white' : 'bg-warm-100 text-warm-700 hover:bg-warm-200'
                }`}
              >
                Tất cả ({users.length})
              </button>
              <button
                onClick={() => setUserRoleFilter('SUPER_ADMIN')}
                className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                  userRoleFilter === 'SUPER_ADMIN' ? 'bg-amber-600 text-white' : 'bg-warm-100 text-warm-700 hover:bg-warm-200'
                }`}
              >
                Quản Trị Tối Cao
              </button>
              <button
                onClick={() => setUserRoleFilter('USER')}
                className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                  userRoleFilter === 'USER' ? 'bg-brand-600 text-white' : 'bg-warm-100 text-warm-700 hover:bg-warm-200'
                }`}
              >
                Thành Viên Thường
              </button>
            </div>
          </div>

          {/* BẢNG DANH SÁCH THÀNH VIÊN */}
          <div className="overflow-x-auto border border-warm-200 rounded-2xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-warm-50 border-b border-warm-200 text-warm-700 font-black">
                  <th className="py-3 px-4">Thành Viên</th>
                  <th className="py-3 px-4">Email Liên Hệ</th>
                  <th className="py-3 px-4">Vai Trò</th>
                  <th className="py-3 px-4">Vốn Xã Hội</th>
                  <th className="py-3 px-4">Ngày Đăng Ký</th>
                  <th className="py-3 px-4 text-right">Tác Vụ Quản Trị</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-100">
                {loadingUsers ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-warm-500 font-medium">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-brand-600"/>
                      Đang đồng bộ danh sách khách hàng từ Supabase...
                    </td>
                  </tr>
                ) : (() => {
                  const filtered = users.filter(u => {
                    const matchSearch = !userSearch || 
                      (u.email || '').toLowerCase().includes(userSearch.toLowerCase()) || 
                      (u.full_name || '').toLowerCase().includes(userSearch.toLowerCase());
                    const matchRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
                    return matchSearch && matchRole;
                  });

                  if (filtered.length === 0) {
                    return (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-warm-500 font-medium">
                          Không tìm thấy thành viên nào phù hợp với bộ lọc.
                        </td>
                      </tr>
                    );
                  }

                  return filtered.map((u: any) => {
                    const isSuper = isSuperAdminEmail(u.email) || u.role === 'SUPER_ADMIN';
                    const initial = (u.full_name || u.email || 'U').charAt(0).toUpperCase();
                    const regDate = u.created_at ? new Date(u.created_at).toLocaleDateString('vi-VN', {
                      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    }) : 'Vừa xong';

                    return (
                      <tr key={u.id} className="hover:bg-warm-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-xl text-white font-black text-xs flex items-center justify-center shadow-2xs ${
                              isSuper ? 'bg-amber-600' : 'bg-brand-600'
                            }`}>
                              {initial}
                            </div>
                            <div>
                              <p className="font-black text-warm-900 leading-tight">{u.full_name || 'Khách Hàng 0-VND'}</p>
                              <p className="text-[10px] text-warm-500">ID: {u.id?.slice(0, 8)}...</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 font-mono font-medium text-warm-900">
                          {u.email}
                        </td>

                        <td className="py-3 px-4">
                          {isSuper ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-black text-[10px] border border-amber-300">
                              <ShieldCheck className="w-3 h-3 text-amber-700"/>
                              <span>Trọng Tài Tối Cao</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-50 text-brand-800 font-black text-[10px] border border-brand-200">
                              <CheckCircle2 className="w-3 h-3 text-brand-600"/>
                              <span>Người Dùng</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <div className="space-y-0.5">
                            <span className="font-black text-sun-600 block">{u.karma || 100} ⭐ Karma</span>
                            <span className="text-[10px] text-warm-600 block">{u.co2_saved || 0} kg CO₂</span>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-warm-600 font-medium">
                          {regDate}
                        </td>

                        <td className="py-3 px-4 text-right">
                          {(() => {
                            const isGenerating = generatingLinks[u.email] || false;
                            const copiedUrl = copiedLinks[u.email];
                            const cooldown = resetCooldowns[u.email] || 0;
                            const isSending = resetMessage[u.email] === 'Đang gửi...';

                            return (
                              <div className="flex flex-col items-end gap-1.5">
                                <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                  {/* 1. NÚT CHÍNH: 📋 LẤY LINK RESET TRỰC TIẾP (Bypass SMTP 100%, Copy vào clipboard tức thì) */}
                                  <button
                                    disabled={isGenerating}
                                    onClick={() => handleGetDirectResetLink(u.email)}
                                    className={`px-3 py-1.5 rounded-xl text-[11px] font-black border transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 ${
                                      copiedUrl 
                                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500' 
                                        : 'bg-emerald-700 hover:bg-emerald-800 text-white border-emerald-600'
                                    } disabled:opacity-50`}
                                    title="Sinh link khôi phục mật khẩu trực tiếp qua Admin API và tự động sao chép vào clipboard để gửi Zalo/Tin nhắn"
                                  >
                                    {isGenerating ? (
                                      <>
                                        <RefreshCw className="w-3 h-3 animate-spin" />
                                        <span>Đang tạo...</span>
                                      </>
                                    ) : copiedUrl ? (
                                      <>
                                        <Check className="w-3.5 h-3.5 text-emerald-200" />
                                        <span>📋 Đã Chép Link</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3.5 h-3.5" />
                                        <span>📋 Lấy Link Reset</span>
                                      </>
                                    )}
                                  </button>

                                  {/* 2. NÚT BỔ SUNG: Đặt trực tiếp mật khẩu mới (Cấp cứu khẩn cấp) */}
                                  <button
                                    onClick={() => setDirectPasswordModal({
                                      isOpen: true,
                                      user: u,
                                      password: '',
                                      loading: false,
                                      error: '',
                                      success: ''
                                    })}
                                    className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold border border-warm-200 bg-warm-100 hover:bg-warm-200 text-warm-700 hover:text-warm-900 transition-all flex items-center gap-1 cursor-pointer"
                                    title="Đặt trực tiếp mật khẩu mới cho thành viên này (không cần qua email)"
                                  >
                                    <KeyRound className="w-3 h-3 text-warm-500" />
                                    <span>Đổi MK</span>
                                  </button>

                                  {/* 3. Nút phụ: Gửi qua email (nếu khách vẫn muốn nhận email tự động) */}
                                  <button
                                    disabled={cooldown > 0 || isSending}
                                    onClick={() => handleSendResetPassword(u.email)}
                                    className={`p-1.5 rounded-xl text-[11px] font-bold border transition-all flex items-center ${
                                      cooldown > 0 || isSending
                                        ? 'bg-warm-50 text-warm-300 border-warm-100 cursor-not-allowed'
                                        : 'bg-warm-50 hover:bg-warm-100 text-warm-500 hover:text-warm-700 border-warm-200 cursor-pointer'
                                    }`}
                                    title={cooldown > 0 ? `Chờ ${cooldown}s` : "Gửi email reset"}
                                  >
                                    <Mail className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                {copiedUrl && (
                                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                    ✓ Đã copy link vào clipboard
                                  </span>
                                )}

                                {resetMessage[u.email] && (
                                  <p className={`text-[10px] font-bold ${
                                    resetMessage[u.email].includes('thành công') ? 'text-emerald-600' : 'text-warm-600'
                                  }`}>
                                    {resetMessage[u.email]}
                                  </p>
                                )}
                              </div>
                            );
                          })()}
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: DYNAMIC CATEGORIES */}
      {adminTab === 'CATEGORIES' && (
        <div className="bg-white rounded-3xl border border-warm-200 p-6 sm:p-8 shadow-soft space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-warm-100 pb-4">
            <div>
              <h2 className="text-base font-black text-warm-900 flex items-center gap-2">
                <Tag className="w-5 h-5 text-brand-600"/>
                <span>Quản Lý Phân Loại Danh Mục Động</span>
              </h2>
              <p className="text-xs text-warm-700">Thêm, bớt và chỉnh sửa các danh mục vật phẩm hiển thị trên trang chủ và bộ lọc toàn sàn.</p>
            </div>
            <button
              onClick={() => requestActionWithPin(executeSaveFullCMS)}
              className="px-6 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-black shadow-float flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <Save className="w-4 h-4"/>
              <span>Lưu Danh Mục (Cần Mật Mã)</span>
            </button>
          </div>

          {/* Form Thêm Danh Mục Mới */}
          <div className="p-5 bg-warm-50 rounded-3xl border border-warm-200 space-y-4">
            <h3 className="text-xs font-black text-warm-900 uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-brand-600" />
              <span>Thêm Danh Mục Vật Phẩm Mới</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-warm-800">Mã Danh Mục (Slug ID):</label>
                <input
                  type="text"
                  placeholder="vidu: books, medical..."
                  value={newCatId}
                  onChange={e => setNewCatId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-warm-300 text-xs font-bold text-warm-900 bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-warm-800">Tên Đầy Đủ (Hiển thị):</label>
                <input
                  type="text"
                  placeholder="Sách Giáo Khoa & Tri Thức"
                  value={newCatLabel}
                  onChange={e => setNewCatLabel(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-warm-300 text-xs font-bold text-warm-900 bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-warm-800">Tên Ngắn Gọn (Nút lọc):</label>
                <input
                  type="text"
                  placeholder="Sách giáo khoa"
                  value={newCatShort}
                  onChange={e => setNewCatShort(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-warm-300 text-xs font-bold text-warm-900 bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-warm-800">Mô Tả Sinh Kế 0-VND:</label>
                <input
                  type="text"
                  placeholder="Sách học tập cho học sinh nghèo"
                  value={newCatDesc}
                  onChange={e => setNewCatDesc(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-warm-300 text-xs font-medium text-warm-900 bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleAddCategory}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-black shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm Vào Danh Sách</span>
              </button>
            </div>
          </div>

          {/* Danh Sách Danh Mục Hiện Tại */}
          <div className="overflow-x-auto rounded-2xl border border-warm-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-warm-100/75 border-b border-warm-200 text-warm-700 font-black">
                  <th className="py-3 px-4">Mã ID</th>
                  <th className="py-3 px-4">Tên Hiển Thị</th>
                  <th className="py-3 px-4">Tên Nút Bấm</th>
                  <th className="py-3 px-4">Mô Tả</th>
                  <th className="py-3 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-100">
                {(fullCMS.categories || DEFAULT_FULL_CMS.categories).map(cat => (
                  <tr key={cat.id} className="hover:bg-warm-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-brand-700">
                      {cat.id}
                    </td>
                    <td className="py-3 px-4 font-black text-warm-900">
                      {cat.label}
                    </td>
                    <td className="py-3 px-4 font-bold text-warm-700">
                      {cat.shortLabel}
                    </td>
                    <td className="py-3 px-4 text-warm-600 font-medium">
                      {cat.desc || '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-bold text-[11px] transition-colors cursor-pointer"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 7: PASSPORTS LEDGER */}
      {adminTab === 'PASSPORTS' && (
        <div className="bg-white rounded-3xl border border-warm-200 p-6 sm:p-8 shadow-soft space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-warm-100 pb-4">
            <div>
              <h2 className="text-base font-black text-warm-900 flex items-center gap-2">
                <Compass className="w-5 h-5 text-brand-600"/>
                <span>Sổ Hộ Chiếu Sinh Kế & Nhật Ký Luân Chuyển 0-VND</span>
              </h2>
              <p className="text-xs text-warm-700">Theo dõi toàn bộ vòng đời thiết bị, số lần tuần hoàn trao tặng và người đang bảo hộ.</p>
            </div>
            <button
              onClick={loadPassports}
              className="px-4 py-2 rounded-xl border border-warm-200 hover:bg-warm-50 text-warm-800 text-xs font-black flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <RefreshCw className="w-4 h-4"/>
              <span>Làm Mới Sổ Cái</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-warm-400 absolute left-3.5 top-1/2 -translate-y-1/2"/>
              <input
                type="text"
                placeholder="Tìm hộ chiếu theo mã, tên thiết bị hoặc người nắm giữ..."
                value={passportSearch}
                onChange={e => setPassportSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border-2 border-warm-200 text-xs font-bold text-warm-900 focus:outline-none focus:border-brand-600"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setPassportFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${passportFilter === 'ALL' ? 'bg-warm-900 text-white' : 'bg-warm-100 text-warm-700'}`}
              >
                Tất cả ({passportsList.length})
              </button>
              <button
                onClick={() => setPassportFilter('ACTIVE')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${passportFilter === 'ACTIVE' ? 'bg-emerald-600 text-white' : 'bg-warm-100 text-warm-700'}`}
              >
                Đang dùng
              </button>
              <button
                onClick={() => setPassportFilter('TRANSFERRED')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${passportFilter === 'TRANSFERRED' ? 'bg-blue-600 text-white' : 'bg-warm-100 text-warm-700'}`}
              >
                Đã luân chuyển
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-warm-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-warm-100/75 border-b border-warm-200 text-warm-700 font-black">
                  <th className="py-3 px-4">Mã Hộ Chiếu</th>
                  <th className="py-3 px-4">Vật Phẩm / Thiết Bị</th>
                  <th className="py-3 px-4">Vòng Tuần Hoàn</th>
                  <th className="py-3 px-4">Người Bảo Hộ Hiện Tại</th>
                  <th className="py-3 px-4">Trạng Thái</th>
                  <th className="py-3 px-4 text-right">Chuyển Giao 0-VND</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-100">
                {passportsList
                  .filter(p => {
                    const matchText = (p.code || '').toLowerCase().includes(passportSearch.toLowerCase()) ||
                                      (p.title || '').toLowerCase().includes(passportSearch.toLowerCase()) ||
                                      (p.actor || '').toLowerCase().includes(passportSearch.toLowerCase());
                    if (passportFilter === 'ACTIVE') return matchText && p.status === 'ACTIVE';
                    if (passportFilter === 'TRANSFERRED') return matchText && p.status === 'TRANSFERRED';
                    return matchText;
                  })
                  .map(p => (
                    <tr key={p.code} className="hover:bg-warm-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-black text-brand-700">
                        {p.code}
                      </td>
                      <td className="py-3 px-4 font-black text-warm-900">
                        {p.title}
                      </td>
                      <td className="py-3 px-4 font-bold text-amber-700">
                        🔄 Vòng {p.cycleCount}
                      </td>
                      <td className="py-3 px-4 text-warm-800 font-bold">
                        {p.actor}
                      </td>
                      <td className="py-3 px-4">
                        {p.status === 'ACTIVE' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-black text-[10px] border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600"/>
                            <span>Đang Phục Vụ</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 font-black text-[10px] border border-blue-200">
                            <Award className="w-3 h-3 text-blue-600"/>
                            <span>Đã Trao Chuyền</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleUpdatePassportStatus(p.code, p.status === 'ACTIVE' ? 'TRANSFERRED' : 'ACTIVE')}
                          className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition-colors cursor-pointer ${
                            p.status === 'ACTIVE' 
                              ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200' 
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {p.status === 'ACTIVE' ? 'Kích Hoạt Luân Chuyển' : 'Đặt Đang Dùng'}
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 8: SYSTEM BACKUP & DATA AUDIT */}
      {adminTab === 'SYSTEM' && (
        <div className="bg-white rounded-3xl border border-warm-200 p-6 sm:p-8 shadow-soft space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-warm-100 pb-4">
            <div>
              <h2 className="text-base font-black text-warm-900 flex items-center gap-2">
                <Database className="w-5 h-5 text-brand-600"/>
                <span>Trung Tâm Sao Lưu & Bảo Mật Dữ Liệu Tối Cao</span>
              </h2>
              <p className="text-xs text-warm-700">Xuất dữ liệu dự phòng 1 chạm cho quản trị viên và làm sạch cache máy trạm.</p>
            </div>
          </div>

          {backupNotice && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-black flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{backupNotice}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1: Full JSON Backup */}
            <div className="p-6 rounded-3xl border-2 border-brand-200 bg-brand-50/30 space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-700 flex items-center justify-center font-black">
                  <Download className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-black text-warm-900">1. Sao Lưu Toàn Bộ Hệ Thống (JSON)</h3>
                <p className="text-xs text-warm-600 leading-relaxed font-medium">
                  Tải về bản snapshot đầy đủ gồm CMS, thành viên, điều ước và sổ hộ chiếu. Phục hồi tức thì mọi lúc.
                </p>
              </div>
              <button
                onClick={exportFullBackupJSON}
                className="w-full py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-black shadow-float flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Tải Bản Sao Lưu JSON</span>
              </button>
            </div>

            {/* Card 2: Export CSV Users */}
            <div className="p-6 rounded-3xl border-2 border-emerald-200 bg-emerald-50/30 space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-black text-warm-900">2. Xuất Danh Sách Thành Viên (CSV)</h3>
                <p className="text-xs text-warm-600 leading-relaxed font-medium">
                  Xuất file Excel / Google Sheets chuẩn UTF-8 chứa đầy đủ thông tin: Họ tên, Email, Karma, CO2 và ngày đăng ký.
                </p>
              </div>
              <button
                onClick={exportUsersCSV}
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-float flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Xuất File CSV Thành Viên</span>
              </button>
            </div>

            {/* Card 3: Cache purge */}
            <div className="p-6 rounded-3xl border-2 border-amber-200 bg-amber-50/30 space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-black">
                  <RefreshCw className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-black text-warm-900">3. Làm Sạch Bộ Nhớ Đệm Trình Duyệt</h3>
                <p className="text-xs text-warm-600 leading-relaxed font-medium">
                  Giải phóng dữ liệu đệm cục bộ của máy hiện tại. Toàn bộ dữ liệu gốc lưu trên Supabase luôn an toàn 100%.
                </p>
              </div>
              <button
                onClick={purgeClientCache}
                className="w-full py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black shadow-float flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Dọn Sạch Cache Cục Bộ</span>
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

      {/* TOAST THÔNG BÁO XANH BÀN QUẢN TRỊ */}
      {adminToast && (
        <div className="fixed bottom-6 right-6 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border transition-all animate-in slide-in-from-bottom-5 duration-200 bg-emerald-900/95 text-white border-emerald-500 backdrop-blur-md max-w-md">
          {adminToast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <p className="text-xs font-bold leading-relaxed flex-1">{adminToast.message}</p>
          <button 
            onClick={() => setAdminToast(null)} 
            className="p-1 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800/50 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* MODAL ĐẶT TRỰC TIẾP MẬT KHẨU KHẨN CẤP */}
      {directPasswordModal.isOpen && directPasswordModal.user && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-warm-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-warm-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-warm-900 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-emerald-600" />
                <span>Đặt Trực Tiếp Mật Khẩu</span>
              </h3>
              <button
                onClick={() => setDirectPasswordModal(prev => ({ ...prev, isOpen: false }))}
                className="p-1 text-warm-400 hover:text-warm-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-warm-50 border border-warm-200 text-xs">
              <div className="text-warm-500 font-medium">Thành viên:</div>
              <div className="font-black text-warm-900">{directPasswordModal.user.full_name || 'Khách hàng'}</div>
              <div className="font-bold text-emerald-700 break-all">{directPasswordModal.user.email}</div>
            </div>

            {directPasswordModal.error && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {directPasswordModal.error}
              </div>
            )}

            {directPasswordModal.success && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                {directPasswordModal.success}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-warm-700 mb-1">
                Mật khẩu mới (tối thiểu 6 ký tự):
              </label>
              <input
                type="text"
                placeholder="Nhập mật khẩu mới..."
                value={directPasswordModal.password}
                onChange={e => setDirectPasswordModal(prev => ({ ...prev, password: e.target.value, error: '' }))}
                className="w-full px-3 py-2 border border-warm-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDirectPasswordModal(prev => ({ ...prev, isOpen: false }))}
                className="flex-1 py-2 px-3 rounded-xl border border-warm-200 text-warm-700 text-xs font-bold hover:bg-warm-50 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={directPasswordModal.loading}
                onClick={handleDirectUpdatePassword}
                className="flex-1 py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-black shadow-xs cursor-pointer"
              >
                {directPasswordModal.loading ? 'Đang cập nhật...' : 'Xác Nhận Đổi'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
