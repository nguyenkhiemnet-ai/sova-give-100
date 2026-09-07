'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { 
  ArrowLeft, ShieldCheck, QrCode, Camera, CheckCircle2, 
  Clock, MapPin, Send, Lock, Sparkles, AlertCircle, Wrench, 
  RotateCcw, Compass, UserCheck
} from 'lucide-react';
import { SAFE_PUBLIC_MEETING_HUBS } from '@/lib/privacyShield';
import { getFullSiteCMS, DEFAULT_FULL_CMS } from '@/lib/cms';

function HandshakeContent() {
  const searchParams = useSearchParams();
  const wishId = searchParams.get('id');
  const paramPassport = searchParams.get('passport');

  const [role, setRole] = useState<'ANGEL' | 'DREAMER'>('ANGEL');
  const [totp, setTotp] = useState('884201');
  const [countdown, setCountdown] = useState(60);
  const [selectedHub, setSelectedHub] = useState(SAFE_PUBLIC_MEETING_HUBS[0].id);
  const [inGracePeriod, setInGracePeriod] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [passportCode, setPassportCode] = useState(paramPassport || 'SOVA-PASS-8842-VN');
  const [wishDetails, setWishDetails] = useState<{ title: string; category?: string; imageUrl?: string } | null>(null);
  const [handshakeRules, setHandshakeRules] = useState(DEFAULT_FULL_CMS.subpages.handshakeRules);

  useEffect(() => {
    setHandshakeRules(getFullSiteCMS().subpages.handshakeRules);
  }, []);

  useEffect(() => {
    if (paramPassport) setPassportCode(paramPassport);
    if (!wishId) return;

    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('SOVA_OPTIMISTIC_WISHES');
      if (stored) {
        try {
          const list = JSON.parse(stored);
          const found = list.find((item: any) => item.id === wishId);
          if (found) {
            const savedImg = localStorage.getItem(`SOVA_WISH_IMG_${found.id}`);
            setWishDetails({
              title: found.title,
              category: found.category,
              imageUrl: savedImg || found.imageUrl
            });
            return;
          }
        } catch {}
      }
    }

    (async () => {
      try {
        const { data } = await supabase.from('wishes').select('*').eq('id', wishId).single();
        if (data) {
          const savedImg = typeof window !== 'undefined' ? localStorage.getItem(`SOVA_WISH_IMG_${data.id}`) : null;
          setWishDetails({
            title: data.title,
            category: data.category,
            imageUrl: savedImg || data.image_url
          });
        }
      } catch {}
    })();
  }, [wishId, paramPassport]);
  
  // Tin nhắn hẹn gặp PII
  const [messages, setMessages] = useState([
    { sender: 'Hệ thống SOVA', text: 'Kênh hẹn gặp PII kích hoạt. Hãy chọn Safe Hub miễn phí dưới đây để gặp mặt không mất tiền nước.', time: '08:30' },
    { sender: 'Anh Trí (Angel)', text: 'Chào em, chiều nay 16h30 tan làm anh mang máy qua Sảnh Thư viện Tạ Quang Bửu nhé!', time: '08:35' },
    { sender: 'Em An (Dreamer)', text: 'Dạ vâng anh, em ngồi ở bàn tự học tầng 1 đợi anh ạ. Em cảm ơn anh!', time: '08:40' }
  ]);
  const [inputMsg, setInputMsg] = useState('');

  // Đếm ngược TOTP
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setTotp(Math.floor(100000 + Math.random() * 900000).toString());
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSendMessage = () => {
    if (!inputMsg.trim()) return;
    setMessages(prev => [
      ...prev,
      {
        sender: role === 'ANGEL' ? 'Người Trao' : 'Người Nhận',
        text: inputMsg.trim(),
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setInputMsg('');
  };

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
            <Lock className="w-3 h-3 text-sun-600"/>
            <span>Cổng Tra Cứu Chống Cầm Đồ</span>
          </Link>
        </div>
      </div>

      {/* Banner */}
      <section className="bg-gradient-to-br from-brand-50 via-white to-sun-50 rounded-3xl border border-warm-200 p-6 sm:p-8 shadow-soft space-y-3">
        <div className="flex items-center gap-2 text-xs font-black text-brand-700 uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-sun-500"/>
          Trạm Bắt Tay An Toàn 0 Đồng & Bảo Chứng Kỹ Thuật 72 Giờ
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-warm-900 tracking-tight">
          Bắt Tay QR Văn Minh Tại Điểm Hẹn Miễn Phí
        </h1>
        <p className="text-xs sm:text-sm text-warm-700 max-w-3xl leading-relaxed">
          {handshakeRules}
        </p>

        {/* Chuyển vai */}
        <div className="flex bg-warm-100 p-1 rounded-2xl w-fit border border-warm-200 mt-2">
          <button
            onClick={() => setRole('ANGEL')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              role === 'ANGEL' ? 'bg-brand-600 text-white shadow-xs' : 'text-warm-700 hover:text-warm-900'
            }`}
          >
            Người Trao (Phát QR TOTP 60s)
          </button>
          <button
            onClick={() => setRole('DREAMER')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              role === 'DREAMER' ? 'bg-brand-600 text-white shadow-xs' : 'text-warm-700 hover:text-warm-900'
            }`}
          >
            Người Nhận (Quét Camera 1 Chạm)
          </button>
        </div>
      </section>

      {/* Màn hình Trạng thái 72h Grace Period */}
      {inGracePeriod ? (
        <div className="bg-white rounded-3xl border-2 border-sun-500 p-6 sm:p-10 shadow-xl space-y-6 text-center">
          <div className="w-16 h-16 rounded-full bg-sun-50 text-sun-600 mx-auto flex items-center justify-center ring-8 ring-sun-100">
            <Clock className="w-8 h-8"/>
          </div>
          <div className="space-y-2 max-w-lg mx-auto">
            <span className="px-3 py-1 rounded-full bg-sun-100 text-sun-800 text-xs font-black uppercase">
              Đang Trong 72 Giờ Bảo Chứng Kỹ Thuật
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-warm-900">
              Thiết Bị Đang Được Sinh Viên Kiểm Tra Thực Tế
            </h2>
            <p className="text-xs text-warm-700 leading-relaxed">
              Bạn có 72 giờ mang máy về phòng trọ để cài phần mềm và học tập. Nếu máy bị lỗi phần cứng nặng, bạn có quyền hoàn trả văn minh mà không bị trừ điểm danh dự.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
            <button
              onClick={() => {
                alert('Đã kết nối bạn với Biệt Đội Bác Sĩ IT 0-VND (Khoa CNTT) để hỗ trợ cài Win/vệ sinh máy miễn phí!');
              }}
              className="px-5 py-2.5 rounded-xl bg-warm-100 hover:bg-warm-200 text-warm-900 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Wrench className="w-4 h-4 text-brand-600"/>
              <span>Nhờ Bác Sĩ IT Hỗ Trợ 0-VND</span>
            </button>

            <button
              onClick={() => {
                setInGracePeriod(false);
                setCompleted(true);
              }}
              className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-black shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4"/>
              <span>Xác Nhận Máy Hoạt Động Tốt (Chốt Hộ Chiếu)</span>
            </button>
          </div>
        </div>
      ) : completed ? (
        <div className="bg-white rounded-3xl border-2 border-brand-500 p-8 text-center space-y-4 shadow-float">
          <CheckCircle2 className="w-14 h-14 text-brand-600 mx-auto"/>
          <h2 className="text-2xl font-black text-warm-900">Bàn Giao Hoàn Tất & Kích Hoạt Vòng Đời 2!</h2>
          <p className="text-xs text-warm-700 max-w-md mx-auto">
            Hộ Chiếu Số <strong className="font-mono text-brand-700">{passportCode}</strong> đã chính thức ghi nhận quyền sử dụng danh dự cho sinh viên.
          </p>
          <div className="pt-2">
            <Link href="/profile/" className="px-6 py-2.5 rounded-xl bg-brand-600 text-white text-xs font-black inline-block">
              Vào Hồ Sơ Cá Nhân & Xem Tiến Độ Trả Giờ Công
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Cột Trái: Trạm TOTP QR */}
          <div className="lg:col-span-6 bg-white p-6 sm:p-8 rounded-3xl border border-warm-200 shadow-soft text-center space-y-6">
            <div className="text-left border-b border-warm-100 pb-3 flex items-center gap-3">
              {wishDetails?.imageUrl && (
                <img 
                  src={wishDetails.imageUrl} 
                  alt={wishDetails.title} 
                  className="w-12 h-12 rounded-xl object-cover border border-warm-200 shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-black text-brand-700 uppercase block">Thiết Bị Khớp Nối</span>
                <h3 className="font-black text-warm-900 text-base truncate">
                  {wishDetails?.title || 'ThinkPad T480 Core i5 / 16GB'}
                </h3>
              </div>
            </div>

            {role === 'ANGEL' ? (
              <div className="space-y-3">
                <div className="w-48 h-48 mx-auto bg-white border-2 border-brand-500/40 rounded-2xl p-3 flex items-center justify-center shadow-inner">
                  <QrCode className="w-full h-full text-warm-900"/>
                </div>
                <div className="font-mono text-2xl font-black text-brand-700 tracking-widest bg-brand-50 py-1 rounded-xl border border-brand-200">
                  {totp}
                </div>
                <p className="text-[11px] text-warm-700">Mã đổi sau: <strong className="text-sun-600">{countdown}s</strong></p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-48 h-48 mx-auto bg-slate-900 rounded-2xl flex flex-col items-center justify-center text-white p-4">
                  <Camera className="w-10 h-10 text-brand-400 mb-2"/>
                  <span className="text-[11px] text-warm-200">Ống kính sẵn sàng</span>
                </div>
                <button 
                  onClick={() => setInGracePeriod(true)}
                  className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  Quét Mã & Kích Hoạt 72 Giờ Dùng Thử
                </button>
              </div>
            )}
          </div>

          {/* Cột Phải: Hộp Chat & Danh Bạ Safe Hubs */}
          <div className="lg:col-span-6 bg-white p-6 sm:p-8 rounded-3xl border border-warm-200 shadow-soft space-y-4">
            <div className="border-b border-warm-100 pb-3">
              <h3 className="font-black text-warm-900 text-base flex items-center gap-2">
                <Lock className="w-4 h-4 text-brand-600"/>
                <span>Kênh Hẹn Gặp Miễn Phí (Zero-Cost Safe Hub)</span>
              </h3>
              <p className="text-xs text-warm-700">Chỉ hẹn ở điểm công cộng an toàn, không tốn tiền nước.</p>
            </div>

            {/* Chọn Safe Hub */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-warm-800 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-brand-600"/>
                <span>Điểm hẹn công cộng miễn phí:</span>
              </label>
              <select
                value={selectedHub}
                onChange={e => setSelectedHub(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-warm-200 bg-warm-50 text-xs font-bold text-warm-900 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
              >
                {SAFE_PUBLIC_MEETING_HUBS.map(hub => (
                  <option key={hub.id} value={hub.id}>
                    📍 {hub.name} ({hub.district})
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-brand-700 font-medium italic">
                {SAFE_PUBLIC_MEETING_HUBS.find(h => h.id === selectedHub)?.note}
              </p>
            </div>

            {/* Khung chat */}
            <div className="h-44 overflow-y-auto p-3 bg-warm-50 rounded-2xl border border-warm-200 space-y-2 text-xs">
              {messages.map((m, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between text-[10px] text-warm-700 font-bold">
                    <span>{m.sender}</span>
                    <span>{m.time}</span>
                  </div>
                  <div className="p-2 bg-white rounded-xl border border-warm-200 text-warm-900">
                    {m.text}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nhắn tin hẹn giờ gặp..."
                value={inputMsg}
                onChange={e => setInputMsg(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 px-3 py-2 rounded-xl border border-warm-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
              <button onClick={handleSendMessage} className="px-4 py-2 bg-brand-600 text-white font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer">
                <Send className="w-3.5 h-3.5"/> Gửi
              </button>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}

export default function HandshakePage() {
  return (
    <Suspense fallback={<div className="py-24 text-center text-xs font-bold text-warm-700">Đang khởi tạo kênh bảo mật...</div>}>
      <HandshakeContent />
    </Suspense>
  );
}
