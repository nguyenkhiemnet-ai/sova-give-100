'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Award, Leaf, HeartHandshake, Compass, 
  ShieldCheck, CheckCircle2, Download, Printer, QrCode, 
  ExternalLink, X, Edit3, Trash2, AlertCircle, Save, Sparkles
} from 'lucide-react';
import { getActiveUser, ADMIN_USER, UserProfile } from '@/lib/auth';
import { VIETNAM_PROVINCES } from '@/lib/provinces';

interface UserWish {
  id: string;
  title: string;
  category: string;
  status: 'PENDING' | 'VERIFIED' | 'CLAIMED';
  reason: string;
  pledge: string;
  provinceCode: string;
  createdDate: string;
}

export default function ProfilePage() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'DONATIONS' | 'WISHES'>('WISHES');
  const [showCertModal, setShowCertModal] = useState(false);

  // Danh sách ước nguyện cá nhân có thể sửa đổi theo quy chế
  const [userWishes, setUserWishes] = useState<UserWish[]>([
    {
      id: 'wish-an-01',
      title: 'Máy tính xách tay phục vụ học tập CNTT K69',
      category: 'laptop',
      status: 'PENDING',
      reason: 'Gia đình làm nông ở vùng lũ, cần máy để học thực hành lập trình C++ và cấu trúc dữ liệu.',
      pledge: 'Em cam kết dùng máy đúng mục đích, học tập đạt loại giỏi và trao lại cho khóa sau.',
      provinceCode: '01',
      createdDate: '01/09/2026'
    }
  ]);

  // State Modal Sửa Ước Nguyện
  const [editingWish, setEditingWish] = useState<UserWish | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editReason, setEditReason] = useState('');
  const [editProvince, setEditProvince] = useState('01');

  useEffect(() => {
    const user = getActiveUser();
    setCurrentUser(user || ADMIN_USER);
  }, []);

  const handleOpenEdit = (w: UserWish) => {
    setEditingWish(w);
    setEditTitle(w.title);
    setEditReason(w.reason);
    setEditProvince(w.provinceCode);
  };

  const handleSaveEdit = () => {
    if (!editingWish) return;
    setUserWishes(prev => prev.map(w => w.id === editingWish.id ? {
      ...w,
      title: editTitle.trim(),
      reason: editReason.trim(),
      provinceCode: editProvince
    } : w));
    setEditingWish(null);
    alert('Đã cập nhật ước nguyện thành công!');
  };

  const handleDeleteWish = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn rút lại ước nguyện này khỏi hệ thống?')) {
      setUserWishes(prev => prev.filter(w => w.id !== id));
      alert('Đã rút lại ước nguyện thành công.');
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      
      {/* Điều Hướng */}
      <div className="flex items-center justify-between">
        <Link 
          href="/" 
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-warm-200 bg-white text-xs font-bold text-warm-700 hover:text-brand-700 shadow-2xs transition-all"
        >
          <ArrowLeft className="w-4 h-4"/>
          <span>Quay lại Cây Nguyện Ước</span>
        </Link>
        {currentUser?.role === 'SUPER_ADMIN' && (
          <Link
            href="/admin/"
            className="px-3.5 py-1 rounded-full text-xs font-black bg-sun-100 text-sun-800 border border-sun-200 flex items-center gap-1.5 hover:bg-sun-200 transition-all"
          >
            <ShieldCheck className="w-4 h-4 text-sun-600"/>
            <span>Vào Bàn Quản Trị Tối Cao</span>
            <ExternalLink className="w-3 h-3"/>
          </Link>
        )}
      </div>

      {/* Thẻ Cá Nhân */}
      <section className="bg-gradient-to-br from-brand-50 via-white to-sun-50 rounded-3xl border border-warm-200 p-6 sm:p-8 shadow-soft space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-3xl bg-brand-600 text-white font-black text-3xl flex items-center justify-center shadow-lg ring-4 ring-white">
              {currentUser?.avatar || 'K'}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-warm-900">{currentUser?.name || 'Nguyễn Khiêm'}</h1>
                <span className="px-2.5 py-0.5 rounded-lg bg-sun-100 text-sun-700 border border-sun-200 text-[11px] font-black uppercase flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-sun-600"/>
                  Sứ Giả Tuần Hoàn 6⭐
                </span>
              </div>
              <p className="text-xs text-warm-700">
                Mã định danh công dân: <strong className="font-mono text-warm-900">SOVA-ID-2108-1984</strong>
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-brand-700 font-semibold pt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-600"/>
                <span>Xác minh định danh số theo Nghị định 13/2023/NĐ-CP</span>
              </div>
            </div>
          </div>

          <button 
            onClick={() => setShowCertModal(true)}
            className="px-5 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-black shadow-float transition-all flex items-center gap-2 cursor-pointer hover:scale-[1.02]"
          >
            <Award className="w-4 h-4"/>
            <span>Mở Bằng Khen Chứng Chỉ Xanh</span>
          </button>
        </div>

        {/* Chỉ số */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-warm-200">
          <div className="bg-white p-4 rounded-2xl border border-warm-200 shadow-2xs">
            <span className="text-[11px] font-bold text-warm-700 uppercase">Vốn Xã Hội (Karma)</span>
            <div className="text-2xl font-black text-warm-900 mt-1">{currentUser?.karma || 200} ⭐</div>
            <span className="text-[10px] text-brand-600 font-medium">Bảo chứng trên sổ cái số</span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-warm-200 shadow-2xs">
            <span className="text-[11px] font-bold text-warm-700 uppercase">CO2 Đã Cắt Giảm</span>
            <div className="text-2xl font-black text-sun-600 mt-1">{currentUser?.co2Saved || 130.5} kg</div>
            <span className="text-[10px] text-warm-700 font-medium">~6.5 cây xanh quang hợp</span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-warm-200 shadow-2xs">
            <span className="text-[11px] font-bold text-warm-700 uppercase">Phẩm Hạng Tuần Hoàn</span>
            <div className="text-2xl font-black text-blue-900 mt-1">Cấp Độ 6⭐</div>
            <span className="text-[10px] text-blue-600 font-medium">Miễn trừ 100% tiền mặt</span>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="flex border-b border-warm-200 gap-4">
        <button
          onClick={() => setActiveTab('WISHES')}
          className={`pb-3 text-sm font-black transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
            activeTab === 'WISHES' ? 'border-brand-600 text-brand-700' : 'border-transparent text-warm-700'
          }`}
        >
          <Sparkles className="w-4 h-4"/>
          <span>Ước Nguyện Của Tôi ({userWishes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('DONATIONS')}
          className={`pb-3 text-sm font-black transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
            activeTab === 'DONATIONS' ? 'border-brand-600 text-brand-700' : 'border-transparent text-warm-700'
          }`}
        >
          <HeartHandshake className="w-4 h-4"/>
          <span>Hiện Vật Đã Trao (2)</span>
        </button>
      </div>

      {/* Nội dung Tab Ước Nguyện */}
      {activeTab === 'WISHES' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-black text-warm-900">Quản Lý & Phân Quyền Sửa Ước Nguyện</h3>
            <span className="text-xs text-warm-700">Chỉ sửa được khi chưa khớp nối Bắt Tay QR</span>
          </div>

          {userWishes.map(wish => (
            <div key={wish.id} className="bg-white rounded-3xl border border-warm-200 p-6 shadow-soft space-y-4">
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase bg-brand-50 text-brand-700 border border-brand-200">
                      {wish.category}
                    </span>
                    <span className="text-xs text-warm-700 font-semibold">• Ngày tạo: {wish.createdDate}</span>
                  </div>
                  <h4 className="text-base font-black text-warm-900">{wish.title}</h4>
                </div>

                <span className="px-3 py-1 rounded-full text-xs font-black bg-sun-50 text-sun-700 border border-sun-200 shrink-0">
                  {wish.status === 'PENDING' ? 'Đang Chờ Thẩm Định' : 'Đã Lên Cây Nguyện Ước'}
                </span>
              </div>

              <div className="p-4 bg-warm-50 rounded-2xl border border-warm-200 text-xs text-warm-700 space-y-1.5">
                <p><strong>Lý do hoàn cảnh:</strong> {wish.reason}</p>
                <p className="italic text-brand-950"><strong>Cam kết danh dự (Đã niêm phong):</strong> "{wish.pledge}"</p>
                <p><strong>Khu vực:</strong> {VIETNAM_PROVINCES.find(p => p.code === wish.provinceCode)?.name || 'Hà Nội'}</p>
              </div>

              {/* Thanh Quyền Hạn Thao Tác Của Người Dùng */}
              <div className="flex justify-end gap-2 pt-2 border-t border-warm-100">
                <button
                  onClick={() => handleDeleteWish(wish.id)}
                  className="px-4 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5"/>
                  <span>Rút Lại Ước Nguyện</span>
                </button>

                <button
                  onClick={() => handleOpenEdit(wish)}
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-black shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5"/>
                  <span>Sửa Thông Tin</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Nội dung Tab Đã Trao */}
      {activeTab === 'DONATIONS' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-warm-200 p-6 shadow-soft flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-lg border border-brand-200">
                  SOVA-PASS-8842-VN
                </span>
                <span className="text-xs text-warm-700">• Trao ngày 05/09/2026</span>
              </div>
              <h4 className="text-base font-black text-warm-900">Laptop ThinkPad T480 Core i5 / 16GB RAM</h4>
              <p className="text-xs text-warm-700">Người nhận: <strong>Em Lê Thu Hằng (Sinh viên năm 1)</strong> (Thái Nguyên)</p>
            </div>
            <Link 
              href="/passports/"
              className="px-4 py-2 rounded-xl bg-warm-50 hover:bg-brand-50 border border-warm-200 text-xs font-bold text-brand-700 transition-all flex items-center gap-1.5"
            >
              <Compass className="w-3.5 h-3.5"/>
              <span>Xem Hộ Chiếu Số</span>
            </Link>
          </div>

          <div className="bg-white rounded-3xl border border-warm-200 p-6 shadow-soft flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-lg border border-brand-200">
                  SOVA-PASS-7301-VN
                </span>
                <span className="text-xs text-warm-700">• Trao ngày 12/08/2026</span>
              </div>
              <h4 className="text-base font-black text-warm-900">Bộ máy tính bàn văn phòng Core i3 học trực tuyến</h4>
              <p className="text-xs text-warm-700">Người nhận: <strong>Em Hoàng Văn Bình (Lớp 9)</strong> (Ba Đình, Hà Nội)</p>
            </div>
            <Link 
              href="/passports/"
              className="px-4 py-2 rounded-xl bg-warm-50 hover:bg-brand-50 border border-warm-200 text-xs font-bold text-brand-700 transition-all flex items-center gap-1.5"
            >
              <Compass className="w-3.5 h-3.5"/>
              <span>Xem Hộ Chiếu Số</span>
            </Link>
          </div>
        </div>
      )}

      {/* MODAL SỬA ƯỚC NGUYỆN */}
      {editingWish && (
        <div className="fixed inset-0 z-50 bg-warm-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-warm-200 max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-warm-100 pb-3">
              <h3 className="font-black text-warm-900 text-base">Cập Nhật Thông Tin Ước Nguyện</h3>
              <button onClick={() => setEditingWish(null)} className="w-8 h-8 rounded-full bg-warm-100 text-warm-700 flex items-center justify-center font-bold cursor-pointer">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-warm-900">Tiêu đề thiết bị cần nhận:</label>
                <input 
                  type="text" 
                  value={editTitle} 
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-warm-200 text-xs focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-warm-900">Hoàn cảnh & mục đích sử dụng:</label>
                <textarea 
                  rows={3}
                  value={editReason} 
                  onChange={e => setEditReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-warm-200 text-xs focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-warm-900">Địa bàn sinh sống:</label>
                <select 
                  value={editProvince} 
                  onChange={e => setEditProvince(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-warm-200 text-xs font-bold text-warm-900 cursor-pointer"
                >
                  {VIETNAM_PROVINCES.map(p => (
                    <option key={p.code} value={p.code}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-sun-50 rounded-xl border border-sun-200 text-sun-900 text-[11px] leading-relaxed">
                ⚠️ <strong>Quy chế:</strong> Lời Cam Kết Danh Dự đã được niêm phong bằng mã băm SHA-256 trên sổ cái và không thể tự ý sửa đổi sau khi tạo.
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setEditingWish(null)} className="px-4 py-2 rounded-xl border border-warm-200 text-xs font-bold text-warm-700 cursor-pointer">Hủy</button>
              <button onClick={handleSaveEdit} className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-black shadow-xs flex items-center gap-1.5 cursor-pointer">
                <Save className="w-3.5 h-3.5"/> Lưu Thay Đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL BẰNG KHEN CHỨNG CHỈ XANH */}
      {showCertModal && (
        <div className="fixed inset-0 z-50 bg-warm-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border-4 border-sun-500/40 max-w-2xl w-full p-6 sm:p-10 shadow-2xl relative space-y-6">
            <button 
              onClick={() => setShowCertModal(false)}
              className="absolute top-5 right-5 w-9 h-9 rounded-full bg-warm-100 text-warm-700 flex items-center justify-center font-bold hover:bg-warm-200 cursor-pointer"
            >
              <X className="w-5 h-5"/>
            </button>

            <div className="border-2 border-sun-400/60 rounded-2xl p-6 sm:p-8 bg-gradient-to-b from-sun-50/40 via-white to-brand-50/30 text-center space-y-5">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-800">
                  HỆ SINH THÁI TUẦN HOÀN 0-VND • SOVA GIVE 100
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-warm-900 uppercase tracking-tight">
                  CHỨNG CHỈ CÔNG DÂN XANH TỬ TẾ
                </h2>
                <p className="text-xs italic text-warm-700">Tôn vinh hành động trao sinh kế & cắt giảm khí thải carbon cho Trái Đất</p>
              </div>

              <div className="space-y-1 py-2">
                <span className="text-xs text-warm-700 block">Chứng nhận trao tặng công dân:</span>
                <div className="text-2xl sm:text-3xl font-black text-brand-700 uppercase">{currentUser?.name || 'Nguyễn Khiêm'}</div>
                <div className="font-mono text-xs font-bold text-warm-700">Mã định danh: SOVA-ID-2108-1984</div>
              </div>

              <div className="grid grid-cols-3 gap-3 p-4 bg-white/90 rounded-2xl border border-warm-200 text-center">
                <div>
                  <span className="text-[10px] font-bold text-warm-700 block">VỐN XÃ HỘI</span>
                  <span className="text-lg font-black text-warm-900">{currentUser?.karma || 200} ⭐</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-warm-700 block">CO2 CẮT GIẢM</span>
                  <span className="text-lg font-black text-sun-600">{currentUser?.co2Saved || 130.5} kg</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-warm-700 block">DANH HIỆU</span>
                  <span className="text-xs font-black text-brand-700 block mt-1">Sứ Giả 6⭐</span>
                </div>
              </div>

              <div className="flex justify-between items-end pt-4 text-left text-xs">
                <div className="space-y-1">
                  <QrCode className="w-12 h-12 text-warm-900"/>
                  <span className="text-[9px] font-mono text-warm-700 block">Mã băm: SHA256:8842-CERT-VN</span>
                </div>
                <div className="text-center space-y-1">
                  <div className="w-16 h-16 rounded-full border-2 border-red-500 bg-red-50 text-red-600 flex items-center justify-center font-black text-[9px] uppercase mx-auto rotate-[-12deg]">
                    SOVA BẢO CHỨNG
                  </div>
                  <span className="text-[10px] font-black text-warm-900 block">Trọng Tài Tối Cao</span>
                  <span className="text-[10px] text-warm-700">Nguyễn Khiêm (21/08/1984)</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 rounded-xl border border-warm-200 bg-warm-50 hover:bg-warm-100 text-xs font-bold text-warm-900 flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4"/> In Bằng Khen
              </button>
              <button
                onClick={() => alert('Đã tạo bản lưu trữ số cho Chứng Chỉ Xanh!')}
                className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-black shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4"/> Tải Bản Số
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
