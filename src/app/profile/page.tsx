'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, User, Award, Leaf, Clock, 
  HeartHandshake, Compass, ShieldCheck, CheckCircle2, 
  Download, Printer, Share2, QrCode, Lock, ExternalLink, X, Sparkles
} from 'lucide-react';

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<'DONATIONS' | 'WISHES'>('DONATIONS');
  const [showCertModal, setShowCertModal] = useState(false);

  const myDonations = [
    {
      id: 'd-1',
      title: 'Laptop ThinkPad T480 Core i5 / 16GB RAM',
      recipientName: 'Em Lê Thu Hằng (Sinh viên năm 1)',
      location: 'Thái Nguyên',
      co2Saved: '85.5 kg CO2',
      date: '05/09/2026',
      passportCode: 'SOVA-PASS-8842-VN',
    },
    {
      id: 'd-2',
      title: 'Bộ máy tính bàn văn phòng Core i3 học trực tuyến',
      recipientName: 'Em Hoàng Văn Bình (Học sinh lớp 9)',
      location: 'Ba Đình, Hà Nội',
      co2Saved: '45.0 kg CO2',
      date: '12/08/2026',
      passportCode: 'SOVA-PASS-7301-VN',
    }
  ];

  const myWishes = [
    {
      id: 'w-1',
      title: 'Máy tính xách tay phục vụ học tập CNTT',
      category: 'laptop',
      status: 'VERIFIED',
      createdDate: '01/09/2026',
    }
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      
      {/* Header điều hướng */}
      <div className="flex items-center justify-between">
        <Link 
          href="/" 
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-warm-200 bg-white text-xs font-bold text-warm-700 hover:text-brand-700 shadow-2xs transition-all"
        >
          <ArrowLeft className="w-4 h-4"/>
          <span>Quay lại Cây Nguyện Ước</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/"
            className="px-3.5 py-1 rounded-full text-xs font-black bg-sun-100 text-sun-800 border border-sun-200 flex items-center gap-1.5 hover:bg-sun-200 transition-all"
          >
            <ShieldCheck className="w-4 h-4 text-sun-600"/>
            <span>Vào Bàn Quản Trị Tối Cao</span>
            <ExternalLink className="w-3 h-3"/>
          </Link>
        </div>
      </div>

      {/* Thẻ Thành Tựu Cá Nhân */}
      <section className="bg-gradient-to-br from-brand-50 via-white to-sun-50 rounded-3xl border border-warm-200 p-6 sm:p-10 shadow-soft space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-3xl bg-brand-600 text-white font-black text-3xl flex items-center justify-center shadow-lg ring-4 ring-white">
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
                Mã định danh công dân số: <strong className="font-mono text-warm-900">SOVA-ID-2108-1984</strong>
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-brand-700 font-semibold pt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-600"/>
                <span>Xác minh định danh số & Trọng tài kinh tế tuần hoàn</span>
              </div>
            </div>
          </div>

          {/* Nút Xem Chứng Chỉ Xanh Thật */}
          <button 
            onClick={() => setShowCertModal(true)}
            className="px-5 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-black shadow-float transition-all flex items-center gap-2 hover:scale-[1.02] cursor-pointer"
          >
            <Award className="w-4 h-4"/>
            <span>Mở Bằng Khen Chứng Chỉ Xanh</span>
          </button>
        </div>

        {/* 3 Chỉ số */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-warm-200">
          <div className="bg-white p-4 rounded-2xl border border-warm-200 shadow-2xs">
            <span className="text-[11px] font-bold text-warm-700 uppercase">Vốn Xã Hội (Karma)</span>
            <div className="text-2xl font-black text-warm-900 mt-1">200 ⭐</div>
            <span className="text-[10px] text-brand-600 font-medium">Top 5% công dân tích cực</span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-warm-200 shadow-2xs">
            <span className="text-[11px] font-bold text-warm-700 uppercase">CO2 Đã Cắt Giảm</span>
            <div className="text-2xl font-black text-sun-600 mt-1">130.5 kg</div>
            <span className="text-[10px] text-warm-700 font-medium">Tương đương 6.5 cây xanh</span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-warm-200 shadow-2xs">
            <span className="text-[11px] font-bold text-warm-700 uppercase">Vật Phẩm Trao Tặng</span>
            <div className="text-2xl font-black text-blue-900 mt-1">2 Thiết Bị</div>
            <span className="text-[10px] text-blue-600 font-medium">Đang phụng sự vòng đời mới</span>
          </div>
        </div>
      </section>

      {/* Tabs Quản Lý */}
      <div className="flex border-b border-warm-200 gap-4">
        <button
          onClick={() => setActiveTab('DONATIONS')}
          className={`pb-3 text-sm font-black transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
            activeTab === 'DONATIONS' ? 'border-brand-600 text-brand-700' : 'border-transparent text-warm-700'
          }`}
        >
          <HeartHandshake className="w-4 h-4"/>
          <span>Hiện Vật Tôi Đã Trao Tặng ({myDonations.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('WISHES')}
          className={`pb-3 text-sm font-black transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
            activeTab === 'WISHES' ? 'border-brand-600 text-brand-700' : 'border-transparent text-warm-700'
          }`}
        >
          <Sparkles className="w-4 h-4"/>
          <span>Ước Nguyện Của Tôi ({myWishes.length})</span>
        </button>
      </div>

      {/* Danh Sách Trao Tặng */}
      {activeTab === 'DONATIONS' && (
        <div className="space-y-4">
          {myDonations.map(don => (
            <div key={don.id} className="bg-white rounded-3xl border border-warm-200 p-6 shadow-soft flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-black text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-lg border border-brand-200">
                    {don.passportCode}
                  </span>
                  <span className="text-xs text-warm-700">• Trao ngày {don.date}</span>
                </div>
                <h4 className="text-base font-black text-warm-900">{don.title}</h4>
                <p className="text-xs text-warm-700">Người nhận: <strong>{don.recipientName}</strong> ({don.location})</p>
              </div>
              <Link 
                href="/passports/"
                className="px-4 py-2 rounded-xl bg-warm-50 hover:bg-brand-50 border border-warm-200 text-xs font-bold text-brand-700 transition-all flex items-center gap-1.5"
              >
                <Compass className="w-3.5 h-3.5"/>
                <span>Xem Hộ Chiếu Số</span>
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* MODAL BẰNG KHEN CHỨNG CHỈ CÔNG DÂN XANH TUẦN HOÀN 6 SAO */}
      {showCertModal && (
        <div className="fixed inset-0 z-50 bg-warm-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border-4 border-sun-500/40 max-w-2xl w-full p-6 sm:p-10 shadow-2xl relative space-y-6 animate-in zoom-in-95">
            
            <button 
              onClick={() => setShowCertModal(false)}
              className="absolute top-5 right-5 w-9 h-9 rounded-full bg-warm-100 hover:bg-warm-200 text-warm-700 flex items-center justify-center font-bold cursor-pointer"
            >
              <X className="w-5 h-5"/>
            </button>

            {/* Khung Bằng Khen Sang Trọng */}
            <div className="border-2 border-sun-400/60 rounded-2xl p-6 sm:p-8 bg-gradient-to-b from-sun-50/40 via-white to-brand-50/30 text-center space-y-5 relative overflow-hidden">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-800">
                  CỘNG HÒA KINH TẾ TUẦN HOÀN 0-VND • SOVA GIVE 100
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-warm-900 uppercase tracking-tight">
                  CHỨNG NHẬN CÔNG DÂN XANH TỬ TẾ
                </h2>
                <p className="text-xs italic text-warm-700">Vinh danh sự cống hiến vì một xã hội không rác thải và giàu lòng trắc ẩn</p>
              </div>

              <div className="space-y-1 py-2">
                <span className="text-xs text-warm-700 block">Trân trọng trao tặng:</span>
                <div className="text-2xl sm:text-3xl font-black text-brand-700">NGUYỄN KHIÊM</div>
                <div className="font-mono text-xs font-bold text-warm-700">Mã định danh: SOVA-ID-2108-1984</div>
              </div>

              {/* Bảng Thành Tựu Được Niêm Phong */}
              <div className="grid grid-cols-3 gap-3 p-4 bg-white/90 rounded-2xl border border-warm-200 text-center">
                <div>
                  <span className="text-[10px] font-bold text-warm-700 block">VẬT PHẨM</span>
                  <span className="text-lg font-black text-blue-900">2 Thiết Bị</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-warm-700 block">CO2 CẮT GIẢM</span>
                  <span className="text-lg font-black text-sun-600">130.5 kg</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-warm-700 block">DANH HIỆU</span>
                  <span className="text-xs font-black text-brand-700 block mt-1">Sứ Giả 6⭐</span>
                </div>
              </div>

              {/* Chữ Ký Số & Con Dấu */}
              <div className="flex justify-between items-end pt-4 text-left text-xs">
                <div className="space-y-1">
                  <QrCode className="w-12 h-12 text-warm-900"/>
                  <span className="text-[9px] font-mono text-warm-700 block">Mã kiểm toán: SHA256:8842-VN</span>
                </div>
                <div className="text-center space-y-1">
                  <div className="w-16 h-16 rounded-full border-2 border-red-500 bg-red-50 text-red-600 flex items-center justify-center font-black text-[9px] uppercase mx-auto rotate-[-12deg] shadow-xs">
                    SOVA BẢO CHỨNG
                  </div>
                  <span className="text-[10px] font-black text-warm-900 block">Trọng Tài Tối Cao</span>
                  <span className="text-[10px] text-warm-700">Nguyễn Khiêm (21/08/1984)</span>
                </div>
              </div>

            </div>

            {/* Các Nút Hành Động In & Tải */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 rounded-xl border border-warm-200 bg-warm-50 hover:bg-warm-100 text-xs font-bold text-warm-900 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4"/>
                <span>In Bằng Khen</span>
              </button>
              <button
                onClick={() => {
                  alert('Đã tải hình ảnh Chứng Chỉ Xanh về máy để lưu trữ hoặc chia sẻ lên Facebook/LinkedIn!');
                }}
                className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-black shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4"/>
                <span>Tải Bản Lưu Trữ Số</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
