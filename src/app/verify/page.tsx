'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Search, ShieldCheck, AlertTriangle, CheckCircle2, 
  QrCode, FileText, Lock, Building2, ExternalLink
} from 'lucide-react';

export default function VerifyPage() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<any>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Cơ sở dữ liệu mẫu các serial đã đăng ký Hộ Chiếu Số
  const registeredDevices: Record<string, any> = {
    'PF1XXXXX': {
      passportCode: 'SOVA-PASS-8842-VN',
      serial: 'PF1XXXXX',
      title: 'Laptop ThinkPad T480 Core i5 / 16GB RAM',
      status: 'EDUCATION_CIRCULATION',
      assignedTo: 'Em Nguyễn V. A. (K69 ĐHBK Hà Nội)',
      donor: 'Anh Hoàng Minh Trí (Kỹ sư)',
      registeredDate: '05/09/2026',
      legalNotice: 'TÀI SẢN KINH TẾ TUẦN HOÀN GIÁO DỤC 0-VND. Nghiêm cấm mọi hành vi mua bán, cầm cố, tháo dỡ linh kiện theo Bộ luật Dân sự và Thỏa thuận Danh dự số SOVA-2026.'
    },
    'SOVA-PASS-8842-VN': {
      passportCode: 'SOVA-PASS-8842-VN',
      serial: 'PF1XXXXX',
      title: 'Laptop ThinkPad T480 Core i5 / 16GB RAM',
      status: 'EDUCATION_CIRCULATION',
      assignedTo: 'Em Nguyễn V. A. (K69 ĐHBK Hà Nội)',
      donor: 'Anh Hoàng Minh Trí (Kỹ sư)',
      registeredDate: '05/09/2026',
      legalNotice: 'TÀI SẢN KINH TẾ TUẦN HOÀN GIÁO DỤC 0-VND. Nghiêm cấm mọi hành vi mua bán, cầm cố, tháo dỡ linh kiện theo Bộ luật Dân sự và Thỏa thuận Danh dự số SOVA-2026.'
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setHasSearched(true);
    const cleanKey = query.trim().toUpperCase();
    setResult(registeredDevices[cleanKey] || null);
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link 
          href="/" 
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-warm-200 bg-white text-xs font-bold text-warm-700 hover:text-brand-700 shadow-2xs transition-all"
        >
          <ArrowLeft className="w-4 h-4"/>
          <span>Quay lại Trang Chủ</span>
        </Link>
        <span className="px-3 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-200 text-xs font-black flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-brand-600"/>
          Cổng Tra Cứu Chống Cầm Đồ Toàn Quốc
        </span>
      </div>

      {/* Banner */}
      <section className="bg-gradient-to-br from-brand-50 via-white to-sun-50 rounded-3xl border border-warm-200 p-6 sm:p-10 shadow-soft text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-brand-600 text-white mx-auto flex items-center justify-center shadow-md">
          <Lock className="w-7 h-7"/>
        </div>
        <div className="space-y-2 max-w-xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-black text-warm-900 tracking-tight">
            Tra Cứu Nguồn Gốc Thiết Bị Tuần Hoàn
          </h1>
          <p className="text-xs sm:text-sm text-warm-700 leading-relaxed">
            Dành cho tiệm cầm đồ, cửa hàng máy tính và phụ huynh kiểm tra tính pháp lý. Mọi thiết bị gắn tem SOVA đều được định danh số bất biến.
          </p>
        </div>

        {/* Thanh Tra Cứu */}
        <form onSubmit={handleSearch} className="max-w-xl mx-auto flex gap-2 pt-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-warm-700 absolute left-3.5 top-1/2 -translate-y-1/2"/>
            <input 
              type="text" 
              placeholder="Nhập Serial máy (ví dụ: PF1XXXXX) hoặc Mã Hộ Chiếu..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-warm-200 bg-white text-xs font-bold text-warm-900 focus:outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-500/20 transition-all shadow-inner"
            />
          </div>
          <button 
            type="submit" 
            className="px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-black shadow-xs transition-all shrink-0 cursor-pointer"
          >
            Tra Cứu
          </button>
        </form>
      </section>

      {/* Kết Quả Tra Cứu */}
      {hasSearched && (
        <div className="space-y-4 animate-in fade-in zoom-in-95">
          {result ? (
            <div className="bg-white rounded-3xl border-2 border-red-500 p-6 sm:p-8 shadow-xl space-y-6">
              
              <div className="flex items-center gap-3 p-4 bg-red-50 rounded-2xl border border-red-200 text-red-700">
                <AlertTriangle className="w-8 h-8 shrink-0 text-red-600"/>
                <div>
                  <h3 className="font-black text-sm uppercase tracking-wider">CẢNH BÁO PHÁP LÝ DÀNH CHO TIỆM CẦM ĐỒ</h3>
                  <p className="text-xs font-semibold text-red-800 mt-0.5">{result.legalNotice}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-warm-50 rounded-2xl border border-warm-200 space-y-1">
                  <span className="text-[10px] font-bold text-warm-700 uppercase">Tên Thiết Bị</span>
                  <p className="font-black text-warm-900 text-sm">{result.title}</p>
                </div>

                <div className="p-4 bg-warm-50 rounded-2xl border border-warm-200 space-y-1">
                  <span className="text-[10px] font-bold text-warm-700 uppercase">Mã Hộ Chiếu Tuần Hoàn</span>
                  <p className="font-mono font-black text-brand-700 text-sm">{result.passportCode}</p>
                </div>

                <div className="p-4 bg-warm-50 rounded-2xl border border-warm-200 space-y-1">
                  <span className="text-[10px] font-bold text-warm-700 uppercase">Người Đang Quản Dụng Hợp Pháp</span>
                  <p className="font-bold text-warm-900">{result.assignedTo}</p>
                </div>

                <div className="p-4 bg-warm-50 rounded-2xl border border-warm-200 space-y-1">
                  <span className="text-[10px] font-bold text-warm-700 uppercase">Tình Trạng Quản Lý</span>
                  <span className="inline-block px-2.5 py-0.5 rounded-md bg-brand-50 text-brand-700 border border-brand-200 text-[11px] font-black uppercase">
                    Đang Trong Vòng Đời Giáo Dục 0-VND
                  </span>
                </div>
              </div>

              <div className="pt-2 text-center text-xs text-warm-700 border-t border-warm-100">
                Nếu bạn phát hiện thiết bị này đang bị rao bán hoặc cầm cố, vui lòng liên hệ Trọng tài: <strong>nguyenkhiem.net@gmail.com</strong>
              </div>

            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-warm-200 p-8 text-center space-y-2 shadow-soft">
              <CheckCircle2 className="w-10 h-10 text-warm-700 mx-auto"/>
              <h3 className="font-black text-warm-900 text-base">Không Tìm Thấy Hồ Sơ Đăng Ký</h3>
              <p className="text-xs text-warm-700 max-w-md mx-auto">
                Số Serial hoặc mã số "{query}" hiện chưa được đăng ký trong mạng lưới tuần hoàn giáo dục SOVA GIVE 100.
              </p>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
