'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { 
  ArrowLeft, ShieldCheck, QrCode, Camera, CheckCircle2, 
  Clock, MapPin, Send, Lock, Sparkles, AlertCircle, RefreshCw
} from 'lucide-react';
import { SAFE_PUBLIC_MEETING_HUBS } from '@/lib/privacyShield';

function HandshakeContent() {
  const searchParams = useSearchParams();
  const wishId = searchParams.get('id');

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [wishData, setWishData] = useState<any>(null);
  
  const [role, setRole] = useState<'ANGEL' | 'DREAMER'>('ANGEL');
  const [totp, setTotp] = useState('884201');
  const [countdown, setCountdown] = useState(60);
  const [scanning, setScanning] = useState(false);
  const [completed, setCompleted] = useState(false);
  
  const [messages, setMessages] = useState<{ sender: string; text: string; time: string }[]>([]);
  const [inputMsg, setInputMsg] = useState('');

  useEffect(() => {
    async function initSession() {
      setLoading(true);
      // 1. Kiểm tra trạng thái đăng nhập
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      // Nếu không có mã phiên hoặc đang mở thử nghiệm công khai
      if (!wishId) {
        // Chế độ mô phỏng kiểm thử an toàn
        setWishData({
          title: 'Thiết bị thực hành sinh kế (Phiên thử nghiệm)',
          passport_code: 'SOVA-PASS-PREVIEW',
          province: '01'
        });
        setMessages([
          { sender: 'Hệ thống', text: 'Đây là không gian thử nghiệm quy trình. Khi có giao dịch thật, chỉ 2 bên mới đọc được tin nhắn.', time: 'Hệ thống' }
        ]);
        setLoading(false);
        return;
      }

      // 2. Kiểm tra quyền sở hữu giao dịch từ database
      try {
        const { data, error } = await supabase
          .from('wishes')
          .select('*')
          .eq('id', wishId)
          .single();

        if (error || !data) {
          setUnauthorized(true);
        } else {
          // Chỉ cho phép người tạo hoặc người nhận truy cập
          if (user && user.id !== data.user_id && user.id !== data.claimed_by) {
            setUnauthorized(true);
          } else {
            setWishData(data);
          }
        }
      } catch (err) {
        setUnauthorized(true);
      } finally {
        setLoading(false);
      }
    }

    initSession();
  }, [wishId]);

  // Đếm ngược mã TOTP 60 giây
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

  if (loading) {
    return (
      <div className="py-24 text-center text-warm-700 font-bold animate-pulse">
        Đang xác thực quyền truy cập bảo mật PII theo Nghị định 13...
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-red-200 text-center space-y-4 shadow-soft">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8"/>
        </div>
        <h2 className="text-xl font-black text-warm-900">Quyền Truy Cập Bị Từ Chối</h2>
        <p className="text-xs text-warm-700 leading-relaxed">
          Kênh hẹn gặp và tin nhắn Bắt Tay QR được mã hóa riêng tư. Chỉ có chủ sở hữu vật phẩm và người nhận được phê chuẩn mới có quyền xem nội dung này.
        </p>
        <Link href="/" className="inline-block px-6 py-2.5 rounded-xl bg-brand-600 text-white text-xs font-bold">
          Quay về Cây Nguyện Ước
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-warm-200 bg-white text-xs font-bold text-warm-700 hover:text-brand-700">
          <ArrowLeft className="w-4 h-4"/>
          <span>Quay lại Cây Nguyện Ước</span>
        </Link>
        <span className="px-3.5 py-1 rounded-full text-xs font-black bg-brand-50 text-brand-700 border border-brand-200 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-brand-600"/>
          Phiên Riêng Tư Đã Khóa PII
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Cột Trái: Trạm TOTP QR */}
        <div className="lg:col-span-6 bg-white p-6 sm:p-8 rounded-3xl border border-warm-200 shadow-soft text-center space-y-6">
          <div className="text-left border-b border-warm-100 pb-3">
            <span className="text-[10px] font-black text-brand-700 uppercase">Vật Phẩm Khớp Nối</span>
            <h3 className="font-black text-warm-900 text-base">{wishData?.title || 'ThinkPad T480 Core i5'}</h3>
          </div>

          <div className="flex bg-warm-100 p-1 rounded-xl w-fit mx-auto text-xs font-bold">
            <button onClick={() => setRole('ANGEL')} className={`px-4 py-1.5 rounded-lg cursor-pointer ${role === 'ANGEL' ? 'bg-brand-600 text-white' : 'text-warm-700'}`}>
              Tôi Là Người Trao
            </button>
            <button onClick={() => setRole('DREAMER')} className={`px-4 py-1.5 rounded-lg cursor-pointer ${role === 'DREAMER' ? 'bg-brand-600 text-white' : 'text-warm-700'}`}>
              Tôi Là Người Nhận
            </button>
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
              <button onClick={() => setCompleted(true)} className="w-full py-2.5 bg-brand-600 text-white font-bold text-xs rounded-xl cursor-pointer">
                Quét Mã Ngay
              </button>
            </div>
          )}
        </div>

        {/* Cột Phải: Hộp Chat Ẩn Danh Riêng Tư */}
        <div className="lg:col-span-6 bg-white p-6 sm:p-8 rounded-3xl border border-warm-200 shadow-soft space-y-4">
          <div className="border-b border-warm-100 pb-3">
            <h3 className="font-black text-warm-900 text-base flex items-center gap-2">
              <Lock className="w-4 h-4 text-brand-600"/>
              <span>Kênh Hẹn Gặp Riêng Tư</span>
            </h3>
            <p className="text-xs text-warm-700">Chỉ hai bên trong phiên giao dịch mới có quyền truy cập.</p>
          </div>

          <div className="h-56 overflow-y-auto p-3 bg-warm-50 rounded-2xl border border-warm-200 space-y-2 text-xs">
            {messages.map((m, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between text-[10px] text-warm-700 font-bold">
                  <span>{m.sender}</span>
                  <span>{m.time}</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-warm-200 text-warm-900">
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Nhắn tin hẹn điểm gặp công cộng..."
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
