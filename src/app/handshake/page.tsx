'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, ShieldCheck, QrCode, Camera, CheckCircle2, 
  Clock, MapPin, Send, MessageSquare, AlertCircle, RefreshCw, 
  Lock, Sparkles, User, UserCheck, ExternalLink, Compass
} from 'lucide-react';
import { SAFE_PUBLIC_MEETING_HUBS, maskFullName } from '@/lib/privacyShield';

export default function HandshakePage() {
  const [role, setRole] = useState<'ANGEL' | 'DREAMER'>('ANGEL');
  const [totp, setTotp] = useState('884201');
  const [countdown, setCountdown] = useState(60);
  const [scanning, setScanning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [selectedHub, setSelectedHub] = useState(SAFE_PUBLIC_MEETING_HUBS[0].id);
  
  // Tin nhắn ẩn danh trong ứng dụng (Masked In-App Chat)
  const [messages, setMessages] = useState<{ sender: string; text: string; time: string }[]>([
    { sender: 'Hệ thống SOVA', text: 'Hai bên đã khớp nối thành công. Kênh chat ẩn danh PII được mã hóa kích hoạt.', time: '09:00' },
    { sender: 'Anh Trí (Angel)', text: 'Chào em An, anh đã dán keo tản nhiệt và cài sẵn Ubuntu/VSCode cho em nhé.', time: '09:05' },
    { sender: 'Em An (Dreamer)', text: 'Dạ em cảm ơn anh Trí! Chiều nay 15h em có mặt ở sảnh Thư viện Tạ Quang Bửu ạ.', time: '09:08' }
  ]);
  const [inputMsg, setInputMsg] = useState('');

  // Đếm ngược TOTP 60 giây
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          const newTotp = Math.floor(100000 + Math.random() * 900000).toString();
          setTotp(newTotp);
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleScanSuccess = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setCompleted(true);
    }, 1500);
  };

  const handleSendMessage = () => {
    if (!inputMsg.trim()) return;
    setMessages(prev => [
      ...prev,
      {
        sender: role === 'ANGEL' ? 'Anh Trí (Angel)' : 'Em An (Dreamer)',
        text: inputMsg.trim(),
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setInputMsg('');
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      
      {/* Header điều hướng */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link 
          href="/" 
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-warm-200 bg-white text-xs font-bold text-warm-700 hover:text-brand-700 shadow-2xs transition-all w-fit"
        >
          <ArrowLeft className="w-4 h-4"/>
          <span>Quay lại Cây Nguyện Ước</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1 rounded-full text-xs font-black bg-brand-50 text-brand-700 border border-brand-200 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-brand-600"/>
            Giao Dịch 0-VND • Mật Mã Học TOTP 60s • Nghị Định 13
          </span>
        </div>
      </div>

      {/* Banner Giới Thiệu Trạm Bắt Tay */}
      <section className="bg-gradient-to-br from-brand-50 via-white to-sun-50 rounded-3xl border border-warm-200 p-6 sm:p-8 shadow-soft space-y-3">
        <div className="flex items-center gap-2 text-xs font-black text-brand-700 uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-sun-500"/>
          Trạm Bắt Tay Xác Thực & Chuyển Giao Quyền Sở Hữu
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-warm-900 tracking-tight">
          Bắt Tay QR Văn Minh (0 Đồng - Chống Con Buôn 100%)
        </h1>
        <p className="text-xs sm:text-sm text-warm-700 max-w-3xl leading-relaxed">
          Giao dịch trao tặng chỉ hoàn tất khi hai bên gặp mặt trực tiếp tại điểm hẹn an toàn, quét mã QR xoay vòng 60 giây để xác nhận tình trạng máy và kích hoạt Hộ Chiếu Vòng Đời mới.
        </p>

        {/* Bộ Chuyển Vai (Angel vs Dreamer) */}
        <div className="flex bg-warm-100 p-1 rounded-2xl w-fit border border-warm-200 mt-4">
          <button
            onClick={() => setRole('ANGEL')}
            className={`px-5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              role === 'ANGEL' ? 'bg-brand-600 text-white shadow-xs' : 'text-warm-700 hover:text-warm-900'
            }`}
          >
            Tôi Là Người Trao (Anh Trí - Phát Mã QR)
          </button>
          <button
            onClick={() => setRole('DREAMER')}
            className={`px-5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              role === 'DREAMER' ? 'bg-brand-600 text-white shadow-xs' : 'text-warm-700 hover:text-warm-900'
            }`}
          >
            Tôi Là Người Nhận (Em An - Quét Camera)
          </button>
        </div>
      </section>

      {/* MÀN HÌNH HOÀN TẤT GIAO DỊCH */}
      {completed ? (
        <div className="bg-white rounded-3xl border-2 border-brand-500 p-8 sm:p-12 shadow-float text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-brand-50 text-brand-600 mx-auto flex items-center justify-center ring-8 ring-brand-100">
            <CheckCircle2 className="w-12 h-12"/>
          </div>
          <div className="space-y-2 max-w-lg mx-auto">
            <span className="px-3 py-1 rounded-full bg-sun-100 text-sun-700 text-xs font-black uppercase">
              Bắt Tay QR Thành Công Tuyệt Đối
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-warm-900">
              Chiếc ThinkPad T480 Đã Bước Vào Vòng Đời 2!
            </h2>
            <p className="text-xs sm:text-sm text-warm-700 leading-relaxed">
              Thiết bị đã chuyển giao an toàn từ <strong>Anh Hoàng Minh Trí</strong> sang <strong>Em Nguyễn Văn An</strong>. Hộ Chiếu Số đã ghi lại sự kiện chuyển tiếp.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto text-left">
            <div className="p-4 rounded-2xl bg-brand-50 border border-brand-100">
              <span className="text-[10px] font-bold text-brand-800 uppercase block">Mã Hộ Chiếu Số</span>
              <span className="font-mono font-black text-brand-950 text-sm">SOVA-PASS-8842-VN</span>
            </div>
            <div className="p-4 rounded-2xl bg-sun-50 border border-sun-100">
              <span className="text-[10px] font-bold text-sun-800 uppercase block">CO2 Cộng Dồn</span>
              <span className="font-black text-sun-900 text-sm">-171.0 kg CO2</span>
            </div>
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100">
              <span className="text-[10px] font-bold text-blue-800 uppercase block">Vốn Xã Hội</span>
              <span className="font-black text-blue-900 text-sm">+100 ⭐ Karma</span>
            </div>
          </div>

          <div className="flex justify-center gap-3 pt-4">
            <Link 
              href="/passports/"
              className="px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-black shadow-xs transition-all flex items-center gap-2"
            >
              <Compass className="w-4 h-4"/>
              <span>Xem Cây Phả Hệ & Gửi Lưu Bút</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* CỘT TRÁI: GIAO THỨC TOTP / CAMERA QUÉT */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-white rounded-3xl border border-warm-200 p-6 sm:p-8 shadow-soft space-y-6 text-center">
              
              <div className="flex items-center justify-between border-b border-warm-100 pb-4">
                <div className="text-left">
                  <span className="text-[10px] font-black text-brand-700 uppercase tracking-wider block">Vật Phẩm Khớp Nối</span>
                  <h3 className="font-black text-warm-900 text-base">ThinkPad T480 Core i5 / 16GB</h3>
                </div>
                <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-brand-50 text-brand-700 border border-brand-200">
                  Mã: SOVA-PASS-8842-VN
                </span>
              </div>

              {role === 'ANGEL' ? (
                // PHÍA ANH TRÍ (ANGEL): PHÁT MÃ QR TOTP 60S
                <div className="space-y-4">
                  <div className="relative mx-auto w-64 h-64 bg-warm-50 rounded-3xl border-4 border-brand-500/30 p-4 flex flex-col items-center justify-center shadow-inner">
                    <div className="w-48 h-48 bg-white rounded-2xl border border-warm-200 p-3 flex items-center justify-center shadow-xs">
                      <QrCode className="w-full h-full text-warm-900"/>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-xs font-bold text-warm-700">Mã TOTP Xác Thực:</span>
                      <span className="font-mono text-xl font-black text-brand-700 tracking-widest bg-brand-50 px-3 py-1 rounded-xl border border-brand-200">
                        {totp}
                      </span>
                    </div>
                    <div className="text-[11px] text-warm-700 flex items-center justify-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-sun-600"/>
                      <span>Mã tự động xoay mới sau: <strong className="text-sun-600">{countdown}s</strong></span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-warm-50 rounded-2xl border border-warm-200 text-xs text-warm-700 text-left space-y-1">
                    <strong className="text-warm-900 block">Hướng dẫn Anh Trí:</strong>
                    <p>Đưa mã QR trên màn hình này cho Em An quét trực tiếp ngoài đời. Khi Em An quét hợp lệ, hệ thống sẽ tự động chuyển quyền sở hữu.</p>
                  </div>
                </div>
              ) : (
                // PHÍA EM AN (DREAMER): CAMERA SCANNER 1 CHẠM
                <div className="space-y-5">
                  <div className="relative mx-auto w-64 h-64 bg-slate-900 rounded-3xl border-4 border-brand-500 overflow-hidden flex flex-col items-center justify-center text-white p-4">
                    {scanning ? (
                      <div className="space-y-3 text-center animate-pulse">
                        <RefreshCw className="w-12 h-12 text-brand-400 mx-auto animate-spin"/>
                        <p className="text-xs font-bold text-brand-300">Đang giải mã TOTP bảo mật...</p>
                      </div>
                    ) : (
                      <div className="space-y-3 text-center">
                        <Camera className="w-12 h-12 text-brand-400 mx-auto"/>
                        <p className="text-xs font-medium text-warm-200">Ống kính sẵn sàng quét mã QR trên máy Anh Trí</p>
                      </div>
                    )}
                    <div className="absolute inset-x-4 top-1/2 h-0.5 bg-brand-400 animate-bounce shadow-lg"/>
                  </div>

                  <button
                    onClick={handleScanSuccess}
                    disabled={scanning}
                    className="w-full py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-black shadow-float transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Camera className="w-4 h-4"/>
                    <span>{scanning ? 'Đang Xác Thực Mật Mã...' : 'Mở Ống Kính & Quét Mã Ngay'}</span>
                  </button>

                  <div className="p-3.5 bg-sun-50 rounded-2xl border border-sun-200 text-xs text-sun-900 text-left">
                    ⚠️ <strong>Lưu ý danh dự:</strong> Chỉ quét mã sau khi đã kiểm tra thiết bị hoạt động tốt và bật nguồn thử nghiệm trước mặt Anh Trí.
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* CỘT PHẢI: KÊNH HẸN GẶP & CHAT ẨN DANH (MASKED IN-APP RENDEZVOUS) */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-white rounded-3xl border border-warm-200 p-6 sm:p-8 shadow-soft space-y-6">
              
              <div className="space-y-1 border-b border-warm-100 pb-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-warm-900 text-base flex items-center gap-2">
                    <Lock className="w-4 h-4 text-brand-600"/>
                    <span>Kênh Hẹn Gặp Ẩn Danh PII</span>
                  </h3>
                  <span className="text-[10px] font-bold text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200">
                    Bảo mật Nghị định 13
                  </span>
                </div>
                <p className="text-xs text-warm-700">
                  Hai bên chỉ nhắn tin qua hệ thống này, không cần chia sẻ số điện thoại cá nhân hay mạng xã hội.
                </p>
              </div>

              {/* Chọn điểm hẹn công cộng an toàn */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-warm-800 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-brand-600"/>
                  <span>Điểm hẹn công cộng đề xuất (&lt; 5km):</span>
                </label>
                <select
                  value={selectedHub}
                  onChange={e => setSelectedHub(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-warm-200 bg-warm-50 text-xs font-bold text-warm-900 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
                >
                  {SAFE_PUBLIC_MEETING_HUBS.map(hub => (
                    <option key={hub.id} value={hub.id}>
                      📍 {hub.name} ({hub.district}, {hub.city})
                    </option>
                  ))}
                </select>
              </div>

              {/* Khung tin nhắn */}
              <div className="space-y-3">
                <div className="h-56 overflow-y-auto p-3.5 bg-warm-50 rounded-2xl border border-warm-200 space-y-2.5">
                  {messages.map((m, idx) => (
                    <div key={idx} className="space-y-0.5 text-xs">
                      <div className="flex items-center justify-between text-[10px] text-warm-700">
                        <span className="font-bold text-brand-900">{m.sender}</span>
                        <span>{m.time}</span>
                      </div>
                      <p className="p-2.5 bg-white rounded-xl border border-warm-200 text-warm-900 shadow-2xs">
                        {m.text}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nhắn tin hẹn giờ gặp gỡ an toàn..."
                    value={inputMsg}
                    onChange={e => setInputMsg(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1 px-3.5 py-2 rounded-xl border border-warm-200 bg-white text-xs text-warm-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-2xs transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5"/>
                    <span>Gửi</span>
                  </button>
                </div>
              </div>

              <div className="p-3 bg-brand-50/60 rounded-2xl border border-brand-100 text-[11px] text-brand-950 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-600 shrink-0"/>
                <span>Mọi lịch sử tin nhắn sẽ tự động hủy vĩnh viễn sau khi Bắt Tay QR hoàn tất.</span>
              </div>

            </div>
          </div>

        </div>
      )}

    </div>
  );
}
