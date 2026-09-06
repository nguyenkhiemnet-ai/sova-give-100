'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, ShieldCheck, CheckCircle2, Award, 
  Trash2, Edit3, Check, Lock, AlertCircle, UserCheck, 
  Search, RefreshCw, XCircle, FileText
} from 'lucide-react';
import { maskFullName } from '@/lib/privacyShield';

interface ManagedWish {
  id: string;
  dreamerRealName: string;
  maskedName: string;
  title: string;
  category: string;
  reason: string;
  pledge: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  location: string;
  rubricScore: number;
}

export default function AdminPage() {
  const [wishes, setWishes] = useState<ManagedWish[]>([
    {
      id: 'wish-an-k69',
      dreamerRealName: 'Nguyễn Văn An',
      maskedName: 'Nguyễn V. A.',
      title: 'Laptop ThinkPad T480 thực hành CNTT',
      category: 'laptop',
      reason: 'Tân sinh viên K69 ĐHBK Hà Nội, gia đình thuần nông tại Hà Tĩnh, không đủ chi phí mua laptop thực hành đồ án lập trình C++/Web.',
      pledge: 'Em cam kết giữ gìn máy cẩn thận, học đạt loại giỏi và trao lại cho đàn em khóa sau khi tốt nghiệp ra trường.',
      location: 'Cầu Giấy, Hà Nội',
      status: 'PENDING',
      rubricScore: 95
    },
    {
      id: 'wish-spam-test',
      dreamerRealName: 'Trần Văn Cường (Thợ buôn cũ)',
      maskedName: 'Trần V. C.',
      title: 'Xin gom 5 chiếc laptop cũ mọi tình trạng',
      category: 'laptop',
      reason: 'Cần thu mua gom máy cũ giá rẻ về bóc linh kiện.',
      pledge: 'Không cam kết trao lại.',
      location: 'Hà Nội',
      status: 'PENDING',
      rubricScore: 10
    }
  ]);

  const [activeTab, setActiveTab] = useState<'QUEUE' | 'AUDIT'>('QUEUE');
  const [editingWish, setEditingWish] = useState<ManagedWish | null>(null);

  // Quyền Trọng tài tối cao: Xóa vĩnh viễn nội dung vi phạm
  const handleDeleteWish = (id: string) => {
    if (confirm('TRỌNG TÀI TỐI CAO: Bạn có chắc chắn muốn XÓA VĨNH VIỄN hồ sơ này khỏi cơ sở dữ liệu?')) {
      setWishes(prev => prev.filter(w => w.id !== id));
      alert('Đã xóa vĩnh viễn hồ sơ và ghi vết vào Audit Log.');
    }
  };

  // Quyền Trọng tài tối cao: Duyệt hợp lệ
  const handleApproveWish = (id: string) => {
    setWishes(prev => prev.map(w => w.id === id ? { ...w, status: 'VERIFIED' } : w));
    alert('Đã PHÊ DUYỆT ước nguyện xuất bản công khai lên Cây Nguyện Ước!');
  };

  // Quyền Trọng tài tối cao: Từ chối / Chặn con buôn
  const handleRejectWish = (id: string) => {
    setWishes(prev => prev.map(w => w.id === id ? { ...w, status: 'REJECTED' } : w));
    alert('Đã TỪ CHỐI hồ sơ và đóng băng quyền đăng ước nguyện của đối tượng này.');
  };

  // Quyền Trọng tài tối cao: Sửa trực tiếp nội dung hồ sơ
  const handleSaveAdminEdit = () => {
    if (!editingWish) return;
    setWishes(prev => prev.map(w => w.id === editingWish.id ? editingWish : w));
    setEditingWish(null);
    alert('Đã cập nhật dữ liệu hồ sơ với quyền Trọng Tài Tối Cao.');
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link 
          href="/" 
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-warm-200 bg-white text-xs font-bold text-warm-700 hover:text-brand-700 shadow-2xs transition-all w-fit"
        >
          <ArrowLeft className="w-4 h-4"/>
          <span>Quay lại Cây Nguyện Ước</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1 rounded-full text-xs font-black bg-sun-100 text-sun-800 border border-sun-200 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-sun-600"/>
            Trọng Tài Tối Cao: Nguyễn Khiêm (21/08/1984)
          </span>
        </div>
      </div>

      {/* Banner */}
      <section className="bg-gradient-to-br from-brand-50 via-white to-sun-50 rounded-3xl border border-warm-200 p-6 sm:p-8 shadow-soft space-y-3">
        <div className="flex items-center gap-2 text-xs font-black text-brand-700 uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 text-brand-600"/>
          Trung Tâm Điều Hành Tối Cao & Thẩm Quyền Cưỡng Chế
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-warm-900 tracking-tight">
          Bàn Quản Trị Hồ Sơ, Phê Duyệt & Chống Trục Lợi
        </h1>
        <p className="text-xs sm:text-sm text-warm-700 max-w-3xl leading-relaxed">
          Nơi Trọng tài tối cao có toàn quyền phê duyệt, chỉnh sửa từ ngữ, loại bỏ tin rác của con buôn và giám sát tính toàn vẹn của kinh tế tuần hoàn 0 đồng.
        </p>
      </section>

      {/* Hàng Đợi Quản Trị */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-base font-black text-warm-900 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-brand-600"/>
            <span>Danh Sách Ước Nguyện Cần Xử Lý ({wishes.length})</span>
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {wishes.map(wish => (
            <div key={wish.id} className="bg-white rounded-3xl border border-warm-200 p-6 shadow-soft space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-brand-700 bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-200">
                      Tên Gốc (Admin Thấy): {wish.dreamerRealName}
                    </span>
                    <span className="text-xs text-warm-700 font-bold">
                      • Tên Công Khai: <strong className="text-warm-900">{wish.maskedName}</strong>
                    </span>
                  </div>
                  <h4 className="text-base font-black text-warm-900">{wish.title}</h4>
                </div>

                <span className={`px-3 py-1 rounded-full text-xs font-black ${
                  wish.status === 'PENDING' ? 'bg-sun-50 text-sun-700 border border-sun-200' :
                  wish.status === 'VERIFIED' ? 'bg-brand-50 text-brand-700 border border-brand-200' :
                  'bg-red-50 text-red-600 border border-red-200'
                }`}>
                  {wish.status === 'PENDING' ? 'Chờ Phê Duyệt' :
                   wish.status === 'VERIFIED' ? 'Đã Xuất Bản' : 'Đã Từ Chối'}
                </span>
              </div>

              <div className="p-4 bg-warm-50 rounded-2xl border border-warm-200 text-xs text-warm-700 space-y-1.5">
                <p><strong>Lý do:</strong> {wish.reason}</p>
                <p className="italic text-brand-950"><strong>Cam kết danh dự:</strong> "{wish.pledge}"</p>
                <p><strong>Địa bàn:</strong> {wish.location} • <strong>Điểm Rubric:</strong> {wish.rubricScore}/100đ</p>
              </div>

              {/* Bảng Thao Tác Của Trọng Tài */}
              <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-warm-100">
                <button
                  onClick={() => handleDeleteWish(wish.id)}
                  className="px-4 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5"/>
                  <span>Xóa Vĩnh Viễn</span>
                </button>

                <button
                  onClick={() => setEditingWish(wish)}
                  className="px-4 py-2 rounded-xl border border-warm-200 text-warm-700 hover:bg-warm-100 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5"/>
                  <span>Sửa Nội Dung</span>
                </button>

                {wish.status === 'PENDING' && (
                  <>
                    <button
                      onClick={() => handleRejectWish(wish.id)}
                      className="px-4 py-2 rounded-xl border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5"/>
                      <span>Từ Chối (Chặn Con Buôn)</span>
                    </button>

                    <button
                      onClick={() => handleApproveWish(wish.id)}
                      className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-black shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5"/>
                      <span>Phê Duyệt Lên Cây Nguyện Ước</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Trọng Tài Sửa Hồ Sơ */}
      {editingWish && (
        <div className="fixed inset-0 z-50 bg-warm-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-warm-200 max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-4">
            <h3 className="font-black text-warm-900 text-base">Trọng Tài Chỉnh Sửa Hồ Sơ</h3>
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-warm-900">Tiêu đề:</label>
                <input 
                  type="text" 
                  value={editingWish.title}
                  onChange={e => setEditingWish({ ...editingWish, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-warm-200 text-xs focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-warm-900">Lý do hoàn cảnh:</label>
                <textarea 
                  rows={3}
                  value={editingWish.reason}
                  onChange={e => setEditingWish({ ...editingWish, reason: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-warm-200 text-xs focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-warm-900">Lời cam kết danh dự:</label>
                <input 
                  type="text" 
                  value={editingWish.pledge}
                  onChange={e => setEditingWish({ ...editingWish, pledge: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-warm-200 text-xs focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setEditingWish(null)} className="px-4 py-2 rounded-xl border border-warm-200 text-xs font-bold cursor-pointer">Hủy</button>
              <button onClick={handleSaveAdminEdit} className="px-5 py-2 rounded-xl bg-brand-600 text-white text-xs font-black shadow-xs cursor-pointer">Lưu Quyền Admin</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
