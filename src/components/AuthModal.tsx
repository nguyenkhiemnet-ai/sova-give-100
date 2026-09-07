'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Mail, Lock, User, Eye, EyeOff, KeyRound, 
  ArrowRight, CheckCircle2, AlertCircle, RefreshCw 
} from 'lucide-react';
import { loginWithGoogle, loginWithEmail, signUpWithEmail, resetPassword } from '@/lib/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'LOGIN' | 'REGISTER';
}

export default function AuthModal({ isOpen, onClose, defaultTab = 'LOGIN' }: AuthModalProps) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'LOGIN' | 'REGISTER' | 'FORGOT'>(defaultTab);
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  if (!isOpen || !mounted) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage('Vui lòng nhập địa chỉ email của bạn.');
      return;
    }
    if (!password) {
      setErrorMessage('Vui lòng nhập mật khẩu tài khoản.');
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

    const res = await loginWithEmail(email.trim(), password);
    setLoading(false);

    if (res.success) {
      setSuccessMessage('Đăng nhập thành công! Đang chuyển hướng...');
      setTimeout(() => {
        onClose();
      }, 500);
    } else {
      setErrorMessage(res.error || 'Email hoặc mật khẩu không chính xác.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMessage('Vui lòng nhập họ và tên của bạn.');
      return;
    }
    if (!email.trim()) {
      setErrorMessage('Vui lòng nhập địa chỉ email.');
      return;
    }
    if (!password) {
      setErrorMessage('Vui lòng tạo mật khẩu bảo vệ.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Mật khẩu cần tối thiểu 6 ký tự.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    const res = await signUpWithEmail(email.trim(), password, fullName.trim());
    setLoading(false);

    if (res.success) {
      setSuccessMessage(res.message || 'Đăng ký thành công! Chào mừng bạn gia nhập SOVAHUB.');
      setTimeout(() => {
        onClose();
      }, 900);
    } else {
      setErrorMessage(res.error || 'Không thể tạo tài khoản, vui lòng thử lại.');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage('Vui lòng nhập địa chỉ email để khôi phục.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    const res = await resetPassword(email.trim());
    setLoading(false);

    if (res.success) {
      setSuccessMessage(res.message || 'Đã gửi liên kết khôi phục mật khẩu vào email của bạn.');
    } else {
      setErrorMessage(res.error || 'Không thể gửi email khôi phục.');
    }
  };

  return createPortal(
    <div 
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-warm-950/50 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div 
        ref={modalRef}
        className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl border border-warm-100 overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Nút đóng X tối giản */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-10 w-8 h-8 rounded-full text-warm-400 hover:text-warm-700 hover:bg-warm-100 flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Đóng"
          title="Đóng (Esc)"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header tinh gọn, nhẹ nhàng */}
        <div className="pt-6 pb-2 px-6 text-center">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 mb-2.5">
            <KeyRound className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-warm-900 tracking-tight">
            {activeTab === 'LOGIN' && 'Đăng Nhập'}
            {activeTab === 'REGISTER' && 'Tạo Tài Khoản Mới'}
            {activeTab === 'FORGOT' && 'Khôi Phục Mật Khẩu'}
          </h2>
          <p className="text-xs text-warm-500 mt-0.5">
            {activeTab === 'LOGIN' && 'Mạng lưới trao cơ hội & tuần hoàn tử tế'}
            {activeTab === 'REGISTER' && 'Gia nhập cộng đồng cho & nhận văn minh'}
            {activeTab === 'FORGOT' && 'Nhập email để nhận liên kết đặt lại mật khẩu'}
          </p>
        </div>

        {/* Nội dung Form - noValidate triệt tiêu popup đen của browser */}
        <div className="px-6 py-4 space-y-4">
          {/* Thông báo lỗi / Thành công tinh gọn */}
          {errorMessage && (
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-medium animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <span className="leading-snug">{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-medium animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
              <span className="leading-snug">{successMessage}</span>
            </div>
          )}

          {/* TAB 1: ĐĂNG NHẬP */}
          {activeTab === 'LOGIN' && (
            <form onSubmit={handleLogin} noValidate autoComplete="on" className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-warm-700 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-400 pointer-events-none" />
                  <input
                    type="email"
                    name="email"
                    autoComplete="username"
                    placeholder="nguyenvana@gmail.com"
                    value={email}
                    onChange={e => { setEmail(e.target.value); if (errorMessage) setErrorMessage(''); }}
                    className="w-full pl-9 pr-3 py-2 bg-warm-50/60 border border-warm-200 rounded-xl text-xs font-medium text-warm-900 placeholder:text-warm-400 focus:outline-none focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/15 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-warm-700 mb-1">
                  Mật Khẩu
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-400 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    autoComplete="current-password"
                    placeholder="Nhập mật khẩu..."
                    value={password}
                    onChange={e => { setPassword(e.target.value); if (errorMessage) setErrorMessage(''); }}
                    className="w-full pl-9 pr-9 py-2 bg-warm-50/60 border border-warm-200 rounded-xl text-xs font-medium text-warm-900 placeholder:text-warm-400 focus:outline-none focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/15 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-warm-400 hover:text-warm-600 p-1 cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Hàng Tiện Ích: Ghi nhớ (trái) + Quên mật khẩu (phải) trên cùng 1 dòng hài hòa */}
              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-1.5 cursor-pointer select-none text-xs text-warm-600">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded accent-emerald-600 text-emerald-600 border-warm-300 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span>Ghi nhớ</span>
                </label>
                <button
                  type="button"
                  onClick={() => { setActiveTab('FORGOT'); setErrorMessage(''); }}
                  className="text-xs font-medium text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                >
                  Quên mật khẩu?
                </button>
              </div>

              {/* Nút Đăng Nhập Chính */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 mt-1 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang kiểm tra...</span>
                  </>
                ) : (
                  <>
                    <span>Đăng Nhập</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 2: ĐĂNG KÝ */}
          {activeTab === 'REGISTER' && (
            <form onSubmit={handleRegister} noValidate autoComplete="on" className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-warm-700 mb-1">
                  Họ và Tên
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-400 pointer-events-none" />
                  <input
                    type="text"
                    name="name"
                    autoComplete="name"
                    placeholder="Nguyễn Văn A"
                    value={fullName}
                    onChange={e => { setFullName(e.target.value); if (errorMessage) setErrorMessage(''); }}
                    className="w-full pl-9 pr-3 py-2 bg-warm-50/60 border border-warm-200 rounded-xl text-xs font-medium text-warm-900 placeholder:text-warm-400 focus:outline-none focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/15 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-warm-700 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-400 pointer-events-none" />
                  <input
                    type="email"
                    name="email"
                    autoComplete="username"
                    placeholder="nguyenvana@gmail.com"
                    value={email}
                    onChange={e => { setEmail(e.target.value); if (errorMessage) setErrorMessage(''); }}
                    className="w-full pl-9 pr-3 py-2 bg-warm-50/60 border border-warm-200 rounded-xl text-xs font-medium text-warm-900 placeholder:text-warm-400 focus:outline-none focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/15 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-warm-700 mb-1">
                  Mật Khẩu (từ 6 ký tự)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-400 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    autoComplete="new-password"
                    placeholder="Mật khẩu của bạn..."
                    value={password}
                    onChange={e => { setPassword(e.target.value); if (errorMessage) setErrorMessage(''); }}
                    className="w-full pl-9 pr-9 py-2 bg-warm-50/60 border border-warm-200 rounded-xl text-xs font-medium text-warm-900 placeholder:text-warm-400 focus:outline-none focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/15 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-warm-400 hover:text-warm-600 p-1 cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 mt-1 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang tạo tài khoản...</span>
                  </>
                ) : (
                  <>
                    <span>Đăng Ký Miễn Phí</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 3: KHÔI PHỤC MẬT KHẨU */}
          {activeTab === 'FORGOT' && (
            <form onSubmit={handleForgotPassword} noValidate className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-warm-700 mb-1">
                  Email Tài Khoản
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-400 pointer-events-none" />
                  <input
                    type="email"
                    placeholder="nguyenvana@gmail.com"
                    value={email}
                    onChange={e => { setEmail(e.target.value); if (errorMessage) setErrorMessage(''); }}
                    className="w-full pl-9 pr-3 py-2 bg-warm-50/60 border border-warm-200 rounded-xl text-xs font-medium text-warm-900 placeholder:text-warm-400 focus:outline-none focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/15 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang gửi liên kết...</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-3.5 h-3.5" />
                    <span>Gửi Liên Kết Khôi Phục</span>
                  </>
                )}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => { setActiveTab('LOGIN'); setErrorMessage(''); }}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                >
                  ← Quay lại Đăng Nhập
                </button>
              </div>
            </form>
          )}

          {/* Dòng phân cách & Tùy chọn Google tinh tế (chỉ hiện khi chưa ở FORGOT) */}
          {activeTab !== 'FORGOT' && (
            <div className="pt-2">
              <div className="relative flex items-center justify-center py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-warm-200" />
                </div>
                <span className="relative bg-white px-2 text-[11px] text-warm-400 font-medium">hoặc</span>
              </div>

              {/* Nút Đăng nhập Google tối giản, tinh tế */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  loginWithGoogle();
                }}
                className="w-full py-2 px-3 rounded-xl border border-warm-200 hover:border-warm-300 hover:bg-warm-50 text-xs font-medium text-warm-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Tiếp tục với Google</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer chuyển đổi Đăng nhập / Đăng ký dạng văn bản nhẹ nhàng thay vì Tab nặng nề */}
        {activeTab !== 'FORGOT' && (
          <div className="py-3 px-6 bg-warm-50/50 border-t border-warm-100 text-center text-xs text-warm-500">
            {activeTab === 'LOGIN' ? (
              <span>
                Chưa có tài khoản?{' '}
                <button
                  type="button"
                  onClick={() => { setActiveTab('REGISTER'); setErrorMessage(''); }}
                  className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                >
                  Đăng ký miễn phí
                </button>
              </span>
            ) : (
              <span>
                Đã có tài khoản?{' '}
                <button
                  type="button"
                  onClick={() => { setActiveTab('LOGIN'); setErrorMessage(''); }}
                  className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                >
                  Đăng nhập ngay
                </button>
              </span>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

