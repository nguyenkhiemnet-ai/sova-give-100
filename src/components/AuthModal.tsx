'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Mail, Lock, User, Eye, EyeOff, KeyRound, 
  ArrowRight, Sparkles, CheckCircle2, AlertCircle, RefreshCw 
} from 'lucide-react';
import { loginWithGoogle, loginWithEmail, signUpWithEmail, resetPassword } from '@/lib/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'LOGIN' | 'REGISTER';
}

export default function AuthModal({ isOpen, onClose, defaultTab = 'LOGIN' }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<'LOGIN' | 'REGISTER' | 'FORGOT'>(defaultTab);
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // States
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const modalRef = useRef<HTMLDivElement>(null);

  // Khôi phục email đã ghi nhớ
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedEmail = localStorage.getItem('SOVA_SAVED_EMAIL');
      if (savedEmail) {
        setEmail(savedEmail);
      }
    }
  }, []);

  // Reset states when opened
  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
      setErrorMessage('');
      setSuccessMessage('');
    }
  }, [isOpen, defaultTab]);

  // Đóng modal khi nhấn ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Vui lòng điền đầy đủ email và mật khẩu.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    if (rememberMe) {
      localStorage.setItem('SOVA_SAVED_EMAIL', email.trim());
    } else {
      localStorage.removeItem('SOVA_SAVED_EMAIL');
    }

    const res = await loginWithEmail(email, password);
    setLoading(false);

    if (res.success) {
      setSuccessMessage('Đăng nhập thành công!');
      setTimeout(() => {
        onClose();
      }, 500);
    } else {
      setErrorMessage(res.error || 'Email hoặc mật khẩu không chính xác.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) {
      setErrorMessage('Vui lòng điền đầy đủ họ tên, email và mật khẩu.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Mật khẩu cần tối thiểu 6 ký tự.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    const res = await signUpWithEmail(email, password, fullName);
    setLoading(false);

    if (res.success) {
      setSuccessMessage(res.message || 'Đăng ký thành công!');
      setTimeout(() => {
        onClose();
      }, 1000);
    } else {
      setErrorMessage(res.error || 'Không thể tạo tài khoản.');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMessage('Vui lòng nhập địa chỉ email của bạn.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    const res = await resetPassword(email);
    setLoading(false);

    if (res.success) {
      setSuccessMessage(res.message || 'Đã gửi liên kết khôi phục mật khẩu vào email của bạn.');
    } else {
      setErrorMessage(res.error || 'Không thể gửi email khôi phục.');
    }
  };

  return (
    <div 
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-warm-900/60 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div 
        ref={modalRef}
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-warm-200 overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Nút đóng X nổi bật */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-warm-100 hover:bg-warm-200 text-warm-600 hover:text-warm-900 flex items-center justify-center transition-colors cursor-pointer"
          title="Đóng (Esc)"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Modal */}
        <div className="pt-7 pb-4 px-6 text-center border-b border-warm-100 bg-gradient-to-b from-brand-50/50 to-transparent">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-600 text-white shadow-soft mb-3">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-warm-900 tracking-tight">
            {activeTab === 'LOGIN' && 'Đăng Nhập SOVAHUB'}
            {activeTab === 'REGISTER' && 'Tạo Tài Khoản Mới'}
            {activeTab === 'FORGOT' && 'Khôi Phục Mật Khẩu'}
          </h2>
          <p className="text-xs text-warm-500 font-medium mt-1">
            {activeTab === 'LOGIN' && 'Mạng Lưới Trao Cơ Hội & Giữ Danh Dự 0-VND'}
            {activeTab === 'REGISTER' && 'Tham gia cộng đồng tuần hoàn sinh kế tử tế'}
            {activeTab === 'FORGOT' && 'Nhập email để nhận liên kết đặt lại mật khẩu an toàn'}
          </p>
        </div>

        {/* Tab Switcher (Chỉ hiện khi LOGIN hoặc REGISTER) */}
        {activeTab !== 'FORGOT' && (
          <div className="flex border-b border-warm-100 px-6 pt-2 bg-warm-50/50">
            <button
              type="button"
              onClick={() => { setActiveTab('LOGIN'); setErrorMessage(''); }}
              className={`flex-1 pb-3 text-xs font-black transition-all border-b-2 cursor-pointer ${
                activeTab === 'LOGIN' 
                  ? 'border-brand-600 text-brand-700' 
                  : 'border-transparent text-warm-500 hover:text-warm-800'
              }`}
            >
              Đăng Nhập
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('REGISTER'); setErrorMessage(''); }}
              className={`flex-1 pb-3 text-xs font-black transition-all border-b-2 cursor-pointer ${
                activeTab === 'REGISTER' 
                  ? 'border-brand-600 text-brand-700' 
                  : 'border-transparent text-warm-500 hover:text-warm-800'
              }`}
            >
              Đăng Ký Tài Khoản
            </button>
          </div>
        )}

        {/* Nội dung Form */}
        <div className="p-6 space-y-4">
          {/* Thông báo lỗi / Thành công */}
          {errorMessage && (
            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-green-50 border border-green-200 text-green-700 text-xs font-bold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-green-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* TAB 1: ĐĂNG NHẬP */}
          {activeTab === 'LOGIN' && (
            <form onSubmit={handleLogin} autoComplete="on" className="space-y-4">
              <div>
                <label className="block text-xs font-black text-warm-800 mb-1">
                  Địa Chỉ Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-400" />
                  <input
                    type="email"
                    name="email"
                    autoComplete="username"
                    required
                    placeholder="nguyenvana@gmail.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-warm-50/80 border border-warm-200 rounded-2xl text-xs font-bold text-warm-900 focus:outline-none focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-black text-warm-800">
                    Mật Khẩu
                  </label>
                  <button
                    type="button"
                    onClick={() => { setActiveTab('FORGOT'); setErrorMessage(''); }}
                    className="text-[11px] font-bold text-brand-600 hover:text-brand-800 hover:underline cursor-pointer"
                  >
                    Quên mật khẩu?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    autoComplete="current-password"
                    required
                    placeholder="Nhập mật khẩu..."
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-warm-50/80 border border-warm-200 rounded-2xl text-xs font-bold text-warm-900 focus:outline-none focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-warm-400 hover:text-warm-700 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Tùy chọn ghi nhớ mật khẩu */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-600 border-warm-300 focus:ring-brand-500 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-warm-700">Tự ghi nhớ đăng nhập</span>
                </label>
              </div>

              {/* Nút Submit Đăng nhập */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-black text-xs shadow-soft flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang xác thực...</span>
                  </>
                ) : (
                  <>
                    <span>Đăng Nhập Ngay</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 2: ĐĂNG KÝ */}
          {activeTab === 'REGISTER' && (
            <form onSubmit={handleRegister} autoComplete="on" className="space-y-4">
              <div>
                <label className="block text-xs font-black text-warm-800 mb-1">
                  Họ và Tên
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-400" />
                  <input
                    type="text"
                    name="name"
                    autoComplete="name"
                    required
                    placeholder="Nguyễn Văn A"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-warm-50/80 border border-warm-200 rounded-2xl text-xs font-bold text-warm-900 focus:outline-none focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-warm-800 mb-1">
                  Địa Chỉ Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-400" />
                  <input
                    type="email"
                    name="email"
                    autoComplete="username"
                    required
                    placeholder="nguyenvana@gmail.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-warm-50/80 border border-warm-200 rounded-2xl text-xs font-bold text-warm-900 focus:outline-none focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-warm-800 mb-1">
                  Mật Khẩu (Tối thiểu 6 ký tự)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    autoComplete="new-password"
                    required
                    placeholder="Tạo mật khẩu an toàn..."
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-warm-50/80 border border-warm-200 rounded-2xl text-xs font-bold text-warm-900 focus:outline-none focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-warm-400 hover:text-warm-700 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-black text-xs shadow-soft flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang khởi tạo tài khoản...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Hoàn Tất Đăng Ký</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 3: KHÔI PHỤC MẬT KHẨU */}
          {activeTab === 'FORGOT' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-warm-800 mb-1">
                  Nhập Email Đã Đăng Ký
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-400" />
                  <input
                    type="email"
                    required
                    placeholder="nguyenvana@gmail.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-warm-50/80 border border-warm-200 rounded-2xl text-xs font-bold text-warm-900 focus:outline-none focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-black text-xs shadow-soft flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang gửi liên kết...</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    <span>Gửi Liên Kết Đặt Lại Mật Khẩu</span>
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setActiveTab('LOGIN'); setErrorMessage(''); }}
                  className="text-xs font-bold text-brand-600 hover:text-brand-800 hover:underline cursor-pointer"
                >
                  ← Quay lại Đăng Nhập
                </button>
              </div>
            </form>
          )}

          {/* Phân cách HOẶC */}
          {activeTab !== 'FORGOT' && (
            <>
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-warm-200"></div>
                <span className="flex-shrink mx-3 text-[11px] font-bold text-warm-400 uppercase">Hoặc</span>
                <div className="flex-grow border-t border-warm-200"></div>
              </div>

              {/* Nút Đăng nhập 1 chạm Google */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  loginWithGoogle();
                }}
                className="w-full py-2.5 px-4 rounded-2xl border-2 border-warm-200 hover:border-brand-500 hover:bg-brand-50/60 text-xs font-black text-warm-800 flex items-center justify-center gap-2.5 transition-all shadow-2xs cursor-pointer group"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Đăng nhập 1 chạm với Google</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
