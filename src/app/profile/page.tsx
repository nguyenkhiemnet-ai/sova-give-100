'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, User, Award, Sparkles, Leaf, Clock, 
  HeartHandshake, Compass, ShieldCheck, CheckCircle2, 
  ExternalLink, FileText, Download, Laptop, Bike, Scissors,
  AlertCircle, ChevronRight, Share2, Tag
} from 'lucide-react';

interface MyWish {
  id: string;
  title: string;
  category: string;
  status: 'PENDING' | 'VERIFIED' | 'CLAIMED' | 'FULFILLED';
  urgency: string;
  createdDate: string;
  passportCode?: string;
}

interface MyDonation {
  id: string;
  title: string;
  category: string;
  recipientName: string;
  location: string;
  co2Saved: string;
  date: string;
  passportCode: string;
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<'WISHES' | 'DONATIONS'>('DONATIONS');

  // Dữ liệu mẫu minh họa đạt chuẩn
  const [myWishes] = useState<MyWish[]>([
    {
      id: 'w-1',
      title: 'Máy tính xách tay phục vụ học tập CNTT',
      category: 'laptop',
      status: 'VERIFIED',
      urgency: 'Cấp thiết',
      createdDate: '01/09/2026',
    }
  ]);

  const [myDonations] = useState<MyDonation[]>([
    {
      id: 'd-1',
      title: 'Laptop ThinkPad T480 Core i5 / 16GB RAM',
      category: 'laptop',
      recipientName: 'Em Lê Thu Hằng (Sinh viên năm 1)',
      location: 'Thái Nguyên',
      co2Saved: '85.5 kg CO2',
      date: '05/09/2026',
      passportCode: 'SOVA-PASS-8842-VN',
    },
    {
      id: 'd-2',
      title: 'Bộ máy tính bàn văn phòng Core i3 học trực tuyến',
      category: 'laptop',
      recipientName: 'Em Hoàng Văn Bình (Học sinh lớp 9)',
      location: 'Ba Đình, Hà Nội',
      co2Saved: '45.0 kg CO2',
      date: '12/08/2026',
      passportCode: 'SOVA-PASS-7301-VN',
    }
  ]);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      
      {/* Header & Nút Quay Lại */}
      <div className="flex items-center justify-between">
        <Link 
          href="/" 
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-warm-200 bg-white text-xs font-bold text-warm-700 hover:text-brand-700 hover:border-brand-500 shadow-2xs transition-all"
        >
          <ArrowLeft className="w-4 h-4"/>
          <span>Quay lại Cây Nguyện Ước</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand-50 text-brand-700 border border-brand-200 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-brand-600"/>
            Bảo Mật Danh Tính • Nghị Định 13/2023/NĐ-CP
          </span>
        </div>
      </div>

      {/* 1. KHỐI THẺ THÀNH TỰU CÔNG DÂN TỬ TẾ (KINDNESS LEDGER) */}
      <section className="bg-gradient-to-br from-brand-50 via-white to-sun-50 rounded-3xl border border-warm-200 p-6 sm:p-10 shadow-soft relative overflow-hidden space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          
          {/* Avatar & Thông tin */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-brand-500 to-brand-700 text-white font-black text-3xl flex items-center justify-center shadow-lg shadow-brand-500/20 ring-4 ring-white">
              K
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-warm-900">Nguyễn Khiêm</h1>
                <span className="px-2.5 py-0.5 rounded-lg bg-sun-100 text-sun-700 border border-sun-200 text-[11px] font-black uppercase flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-sun-600"/>
                  Sứ Giả Tuần Hoàn 6⭐
                </span>
              </div>
              <p className="text-xs text-warm-700">
                Mã định danh công dân: <span className="font-mono font-bold text-warm-900">SOVA-ID-2108-1984</span>
              </p>
              <div className="flex items-center gap-2 text-[11px] text-brand-700 font-semibold pt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-600"/>
                <span>Đã xác minh qua Google One-Tap & Trọng tài số</span>
              </div>
            </div>
          </div>

          {/* Nút hành động */}
          <div className="flex gap-2">
            <button 
              onClick={() => alert('Đã tạo bản sao chứng chỉ số tuần hoàn thành công!')}
              className="px-4 py-2.5 rounded-xl bg-white border border-warm-200 hover:border-brand-500 text-xs font-bold text-warm-900 shadow-2xs hover:bg-brand-50 transition-all flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-brand-600"/>
              <span>Chứng Chỉ Xanh</span>
            </button>
          </div>
        </div>

        {/* Bảng 3 Chỉ Số Thành Tựu Cá Nhân */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-warm-200/80">
          <div className="bg-white/90 backdrop-blur-sm p-4 rounded-2xl border border-warm-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-warm-700 uppercase">Vốn Xã Hội (Karma)</span>
              <Award className="w-4 h-4 text-sun-500"/>
            </div>
            <div className="text-2xl font-black text-warm-900 mt-1">200 ⭐</div>
            <span className="text-[10px] text-brand-600 font-medium">Top 5% người trao tặng tích cực</span>
          </div>

          <div className="bg-white/90 backdrop-blur-sm p-4 rounded-2xl border border-warm-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-warm-700 uppercase">CO2 Đã Cắt Giảm</span>
              <Leaf className="w-4 h-4 text-brand-600"/>
            </div>
            <div className="text-2xl font-black text-brand-700 mt-1">130.5 kg</div>
            <span className="text-[10px] text-warm-700 font-medium">Tương đương 6.5 cây xanh lớn</span>
          </div>

          <div className="bg-white/90 backdrop-blur-sm p-4 rounded-2xl border border-warm-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-warm-700 uppercase">Vật Phẩm Trao Tặng</span>
              <HeartHandshake className="w-4 h-4 text-blue-600"/>
            </div>
            <div className="text-2xl font-black text-blue-900 mt-1">2 Thiết Bị</div>
            <span className="text-[10px] text-blue-600 font-medium">Đang phụng sự vòng đời mới</span>
          </div>
        </div>
      </section>

      {/* 2. THANH ĐIỀU HƯỚNG TABS SONG SONG */}
      <div className="flex border-b border-warm-200 gap-4">
        <button
          onClick={() => setActiveTab('DONATIONS')}
          className={`pb-3 text-sm font-black transition-all flex items-center gap-2 border-b-2 ${
            activeTab === 'DONATIONS'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-warm-700 hover:text-warm-900'
          }`}
        >
          <HeartHandshake className="w-4 h-4"/>
          <span>Hiện Vật Tôi Đã Trao Tặng ({myDonations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('WISHES')}
          className={`pb-3 text-sm font-black transition-all flex items-center gap-2 border-b-2 ${
            activeTab === 'WISHES'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-warm-700 hover:text-warm-900'
          }`}
        >
          <Sparkles className="w-4 h-4"/>
          <span>Ước Nguyện Tôi Đã Gửi ({myWishes.length})</span>
        </button>
      </div>

      {/* 3. NỘI DUNG TỪNG TAB */}
      {activeTab === 'DONATIONS' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-black text-warm-900">
              Danh Sách Thiết Bị Đang Sống Vòng Đời Mới
            </h3>
            <span className="text-xs text-warm-700">100% Giao dịch xác thực Bắt Tay QR</span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {myDonations.map(don => (
              <div 
                key={don.id}
                className="bg-white rounded-3xl border border-warm-200 p-6 shadow-soft hover:shadow-md transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-brand-700 bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-200">
                      {don.passportCode}
                    </span>
                    <span className="text-xs text-warm-700 font-semibold">• Trao ngày {don.date}</span>
                  </div>
                  <h4 className="text-base font-black text-warm-900">{don.title}</h4>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-warm-700">
                    <span className="flex items-center gap-1 font-bold text-warm-900">
                      <User className="w-3.5 h-3.5 text-brand-600"/>
                      {don.recipientName}
                    </span>
                    <span>•</span>
                    <span>{don.location}</span>
                    <span>•</span>
                    <span className="text-sun-600 font-bold flex items-center gap-1">
                      <Leaf className="w-3.5 h-3.5"/>
                      -{don.co2Saved}
                    </span>
                  </div>
                </div>

                <Link
                  href="/passports/"
                  className="px-4 py-2.5 rounded-xl bg-warm-50 hover:bg-brand-50 border border-warm-200 hover:border-brand-300 text-xs font-bold text-brand-700 flex items-center gap-1.5 transition-all shadow-2xs shrink-0"
                >
                  <Compass className="w-3.5 h-3.5"/>
                  <span>Xem Hành Trình Hộ Chiếu</span>
                  <ExternalLink className="w-3 h-3"/>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'WISHES' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-black text-warm-900">
              Tiến Độ Thẩm Định Ước Nguyện Của Bạn
            </h3>
            <Link 
              href="/create-wish/"
              className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1"
            >
              + Gửi thêm ước nguyện
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {myWishes.map(wish => (
              <div 
                key={wish.id}
                className="bg-white rounded-3xl border border-warm-200 p-6 shadow-soft space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold uppercase bg-brand-50 text-brand-700 border border-brand-200">
                        {wish.category}
                      </span>
                      <span className="text-xs text-warm-700">Ngày gửi: {wish.createdDate}</span>
                    </div>
                    <h4 className="text-base font-black text-warm-900">{wish.title}</h4>
                  </div>
                  
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-brand-50 text-brand-700 border border-brand-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-600"/>
                    Đã Thẩm Định Hợp Lệ
                  </span>
                </div>

                <div className="p-4 bg-warm-50 rounded-2xl border border-warm-200 text-xs text-warm-700 space-y-1">
                  <span className="font-bold text-warm-900">Trạng thái hồ sơ:</span>
                  <p>Hồ sơ đã được Đại sứ địa phương thẩm định hoàn cảnh. Hệ thống đang đề xuất đến các nhà hảo tâm trong khu vực Hà Nội.</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
