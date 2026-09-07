'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Award, Leaf, HeartHandshake, Compass, 
  ShieldCheck, CheckCircle2, Download, Printer, QrCode, 
  ExternalLink, X, BookOpen, Clock, Heart, Sparkles
} from 'lucide-react';
import { getActiveUser, ADMIN_USER, UserProfile } from '@/lib/auth';

export default function ProfilePage() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'TIMEBANK' | 'RELAY' | 'CERT'>('TIMEBANK');
  const [showCertModal, setShowCertModal] = useState(false);

  // Tiến độ Trả Nợ Xã Hội Bằng Giờ Công (Timebanking)
  const [timebank, setTimebank] = useState({
    hoursDone: 6,
    hoursRequired: 10,
    tasks: [
      { name: 'Dạy kèm Toán cấp 2 cho con em xóm trọ nghèo (2 buổi)', hours: 4, verified: true },
      { name: 'Hỗ trợ dọn dẹp và phân loại sách tại Thư viện trường', hours: 2, verified: true }
    ]
  });

  useEffect(() => {
    const user = getActiveUser();
    setCurrentUser(user || ADMIN_USER);
  }, []);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-warm-200 bg-white text-xs font-bold text-warm-700 hover:text-brand-700 shadow-2xs transition-all">
          <ArrowLeft className="w-4 h-4"/>
          <span>Quay lại Cây Nguyện Ước</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/verify/" className="px-3 py-1 rounded-full text-xs font-black bg-sun-50 text-sun-800 border border-sun-200 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-sun-600"/>
            <span>Cổng Tra Cứu Chống Cầm Đồ</span>
          </Link>
        </div>
      </div>

      {/* Thẻ Thành Tựu Cá Nhân */}
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
            className="px-5 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-black shadow-float transition-all flex items-center gap-2 cursor-pointer hover:scale-[1.02]"
          >
            <Award className="w-4 h-4"/>
            <span>Mở Bằng Khen Chứng Chỉ Xanh</span>
          </button>
        </div>

        {/* 3 Chỉ số */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-warm-200">
          <div className="bg-white p-4 rounded-2xl border border-warm-200 shadow-2xs">
            <span className="text-[11px] font-bold text-warm-700 uppercase">Vốn Xã Hội (Karma)</span>
            <div className="text-2xl font-black text-warm-900 mt-1">{currentUser?.karma || 200} ⭐</div>
            <span className="text-[10px] text-brand-600 font-medium">Được bảo chứng trên sổ cái</span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-warm-200 shadow-2xs">
            <span className="text-[11px] font-bold text-warm-700 uppercase">CO2 Đã Cắt Giảm</span>
            <div className="text-2xl font-black text-sun-600 mt-1">{currentUser?.co2Saved || 130.5} kg</div>
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
      <div className="flex border-b border-warm-200 gap-4">
        <button
          onClick={() => setActiveTab('TIMEBANK')}
          className={`pb-3 text-sm font-black transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
            activeTab === 'TIMEBANK' ? 'border-brand-600 text-brand-700' : 'border-transparent text-warm-700'
          }`}
        >
          <Clock className="w-4 h-4"/>
          <span>Hợp Đồng Đổi Giờ Công (Timebanking)</span>
        </button>

        <button
          onClick={() => setActiveTab('RELAY')}
          className={`pb-3 text-sm font-black transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
            activeTab === 'RELAY' ? 'border-brand-600 text-brand-700' : 'border-transparent text-warm-700'
          }`}
        >
          <BookOpen className="w-4 h-4"/>
          <span>Tiếp Sức Khóa Dưới (Senior Relay)</span>
        </button>
      </div>

      {/* Tab 1: Timebanking */}
      {activeTab === 'TIMEBANK' && (
        <div className="bg-white rounded-3xl border border-warm-200 p-6 sm:p-8 shadow-soft space-y-6">
          <div className="space-y-1">
            <span className="text-xs font-black uppercase text-brand-700">Chứng Chỉ Phụng Sự Xã Hội</span>
            <h3 className="text-lg font-black text-warm-900">Thanh Tiến Độ Trả Nợ Xã Hội Bằng Tri Thức</h3>
            <p className="text-xs text-warm-700">
              Nhận thiết bị 0-VND không phải là mang ơn, mà là cam kết cống hiến 10 giờ tương trợ cộng đồng để giữ vững nhân phẩm.
            </p>
          </div>

          {/* Thanh Tiến Độ */}
          <div className="space-y-2 p-4 bg-warm-50 rounded-2xl border border-warm-200">
            <div className="flex justify-between text-xs font-black">
              <span>Tiến độ hoàn thành:</span>
              <span className="text-brand-700">{timebank.hoursDone} / {timebank.hoursRequired} Giờ (60%)</span>
            </div>
            <div className="w-full h-3 bg-warm-200 rounded-full overflow-hidden">
              <div className="h-full bg-brand-600 rounded-full transition-all duration-500" style={{ width: '60%' }}/>
            </div>
          </div>

          {/* Lịch Sử Công Việc */}
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

      {/* Tab 2: Senior Relay */}
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

      {/* MODAL BẰNG KHEN CHỨNG CHỈ XANH */}
      {showCertModal && (
        <div className="fixed inset-0 z-50 bg-warm-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border-4 border-sun-500/40 max-w-2xl w-full p-6 sm:p-10 shadow-2xl relative space-y-6">
            <button onClick={() => setShowCertModal(false)} className="absolute top-5 right-5 w-9 h-9 rounded-full bg-warm-100 text-warm-700 flex items-center justify-center font-bold cursor-pointer">
              <X className="w-5 h-5"/>
            </button>

            <div className="border-2 border-sun-400/60 rounded-2xl p-6 sm:p-8 bg-gradient-to-b from-sun-50/40 via-white to-brand-50/30 text-center space-y-5">
              <span className="text-[10px] font-black uppercase tracking-widest text-brand-800 block">
                HỆ SINH THÁI TUẦN HOÀN GIÁO DỤC 0-VND • SOVA GIVE 100
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-warm-900 uppercase">CHỨNG CHỈ CÔNG DÂN DANH DỰ</h2>
              <div className="text-2xl font-black text-brand-700 uppercase">{currentUser?.name || 'Nguyễn Khiêm'}</div>
              <p className="font-mono text-xs text-warm-700">SOVA-ID-2108-1984</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
