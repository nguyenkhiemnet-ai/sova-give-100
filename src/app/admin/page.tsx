'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, ShieldCheck, CheckCircle2, Award, 
  Clock, Activity, FileText, Check, Lock, ChevronRight,
  AlertCircle, UserCheck, Star
} from 'lucide-react';
import { maskFullName } from '@/lib/privacyShield';

interface WishReview {
  id: string;
  dreamerRealName: string;
  maskedName: string;
  title: string;
  category: string;
  story: string;
  pledge: string;
  pledgeHash: string;
  location: string;
  status: 'PENDING' | 'VERIFIED';
  rubricScore: number;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'QUEUE' | 'RUBRIC' | 'AUDIT'>('QUEUE');
  const [wishes, setWishes] = useState<WishReview[]>([
    {
      id: 'wish-an-k69',
      dreamerRealName: 'Nguyễn Văn An',
      maskedName: 'Nguyễn V. A.',
      title: 'Laptop ThinkPad T480 thực hành CNTT',
      category: 'laptop',
      story: 'Tân sinh viên K69 ĐHBK Hà Nội, gia đình thuần nông tại Hà Tĩnh, không đủ chi phí mua laptop thực hành đồ án lập trình C++/Web.',
      pledge: 'Em cam kết giữ gìn máy cẩn thận, học đạt loại giỏi và trao lại cho đàn em khóa sau khi tốt nghiệp ra trường.',
      pledgeHash: 'SHA256:7f8b9ae4d1c98842',
      location: 'Cầu Giấy, Hà Nội (Gốc: Hà Tĩnh)',
      status: 'PENDING',
      rubricScore: 95
    }
  ]);

  const [selectedWish, setSelectedWish] = useState<WishReview | null>(null);

  // Bộ 5 Tiêu Chí Chấm Điểm Rubric Khách Quan Của Đại Sứ
  const [rubricScores, setRubricScores] = useState({
    circumstance: 20, // Tối đa 20 điểm: Hoàn cảnh thực chất có giấy tờ xác minh
    livelihoodFeasibility: 20, // Tối đa 20 điểm: Tính khả thi phục vụ học tập/mưu sinh
    honorCommitment: 20, // Tối đa 20 điểm: Lời cam kết danh dự rõ ràng, có trách nhiệm
    geoLocality: 20, // Tối đa 20 điểm: Khả năng gặp gỡ trao nhận trực tiếp bán kính < 5km
    credentialIntegrity: 20 // Tối đa 20 điểm: Giấy báo nhập học / thẻ sinh viên hợp lệ
  });

  const totalScore = rubricScores.circumstance + 
                     rubricScores.livelihoodFeasibility + 
                     rubricScores.honorCommitment + 
                     rubricScores.geoLocality + 
                     rubricScores.credentialIntegrity;

  const handleApproveWish = (id: string) => {
    setWishes(prev => prev.map(w => w.id === id ? { ...w, status: 'VERIFIED', rubricScore: totalScore } : w));
    setSelectedWish(null);
    alert(`Đã phê duyệt hồ sơ với điểm Rubric ${totalScore}/100! Điều ước đã xuất bản công khai lên Cây Nguyện Ước.`);
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
          <span className="px-3.5 py-1 rounded-full text-xs font-black bg-brand-50 text-brand-700 border border-brand-200 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-brand-600"/>
            Trọng Tài Tối Cao: Nguyễn Khiêm (21/08/1984)
          </span>
        </div>
      </div>

      {/* Banner */}
      <section className="bg-gradient-to-br from-brand-50 via-white to-warm-100 rounded-3xl border border-warm-200 p-6 sm:p-8 shadow-soft space-y-3">
        <div className="flex items-center gap-2 text-xs font-black text-brand-700 uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4"/>
          Bàn Thẩm Định Đại Sứ Theo Thước Đo Rubric 5 Tiêu Chí
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-warm-900 tracking-tight">
          Hệ Thống Phê Duyệt Khách Quan & Kiểm Toán Bất Biến
        </h1>
        <p className="text-xs sm:text-sm text-warm-700 max-w-3xl leading-relaxed">
          Đại sứ địa phương đánh giá hoàn cảnh dựa trên Thước đo Rubric chuẩn hóa 100 điểm, niêm phong mã băm SHA-256 lời cam kết danh dự trước khi đưa lên Cây Nguyện Ước.
        </p>
      </section>

      {/* Danh sách hồ sơ chờ thẩm định */}
      <div className="space-y-4">
        <h3 className="text-base font-black text-warm-900 flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-brand-600"/>
          <span>Hàng Đợi Thẩm Định Hoàn Cảnh</span>
        </h3>

        <div className="grid grid-cols-1 gap-4">
          {wishes.map(wish => (
            <div 
              key={wish.id}
              className="bg-white rounded-3xl border border-warm-200 p-6 shadow-soft space-y-4"
            >
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-brand-700 bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-200">
                      Tầng 3 (Admin): {wish.dreamerRealName}
                    </span>
                    <span className="text-xs text-warm-700 font-bold">
                      • Hiển thị công khai Tầng 1: <strong className="text-warm-900">{wish.maskedName}</strong>
                    </span>
                  </div>
                  <h4 className="text-base font-black text-warm-900">{wish.title}</h4>
                </div>

                <span className={`px-3 py-1 rounded-full text-xs font-black ${
                  wish.status === 'PENDING' 
                    ? 'bg-sun-50 text-sun-700 border border-sun-200' 
                    : 'bg-brand-50 text-brand-700 border border-brand-200'
                }`}>
                  {wish.status === 'PENDING' ? 'Chờ Chấm Điểm Rubric' : `Đã Duyệt (${wish.rubricScore}/100đ)`}
                </span>
              </div>

              <div className="p-4 bg-warm-50 rounded-2xl border border-warm-200 text-xs text-warm-700 space-y-2">
                <p><strong>Hoàn cảnh:</strong> {wish.story}</p>
                <p className="italic text-brand-950"><strong>Cam kết danh dự:</strong> "{wish.pledge}"</p>
                <div className="font-mono text-[10px] text-warm-700 bg-white p-2 rounded-lg border border-warm-200 inline-block">
                  Mã băm niêm phong: {wish.pledgeHash}
                </div>
              </div>

              {wish.status === 'PENDING' && (
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setSelectedWish(wish)}
                    className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-black shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Award className="w-4 h-4"/>
                    <span>Mở Bảng Chấm Điểm Rubric & Phê Duyệt</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* MODAL BẢNG CHẤM ĐIỂM RUBRIC 5 TIÊU CHÍ */}
      {selectedWish && (
        <div className="fixed inset-0 z-50 bg-warm-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-warm-200 max-w-xl w-full p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex justify-between items-start border-b border-warm-100 pb-4">
              <div className="space-y-1">
                <span className="text-xs font-black text-brand-700 uppercase">Thước Đo Rubric Đại Sứ</span>
                <h3 className="text-lg font-black text-warm-900">
                  Thẩm Định Hồ Sơ: {selectedWish.dreamerRealName}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedWish(null)}
                className="w-8 h-8 rounded-full bg-warm-100 text-warm-700 flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* 5 Tiêu chí Rubric */}
            <div className="space-y-4 text-xs">
              <div className="flex justify-between items-center p-3 bg-warm-50 rounded-xl border border-warm-200">
                <div>
                  <span className="font-bold text-warm-900 block">1. Hoàn cảnh thực chất & minh chứng</span>
                  <span className="text-warm-700 text-[11px]">Gia đình thuần nông vùng bão lũ Hà Tĩnh</span>
                </div>
                <span className="font-mono font-black text-brand-700">20 / 20đ</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-warm-50 rounded-xl border border-warm-200">
                <div>
                  <span className="font-bold text-warm-900 block">2. Tính khả thi sinh kế / học tập</span>
                  <span className="text-warm-700 text-[11px]">Tân sinh viên K69 CNTT cần máy làm đồ án kỳ 1</span>
                </div>
                <span className="font-mono font-black text-brand-700">20 / 20đ</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-warm-50 rounded-xl border border-warm-200">
                <div>
                  <span className="font-bold text-warm-900 block">3. Lời cam kết danh dự hoàn nguyên</span>
                  <span className="text-warm-700 text-[11px]">Cam kết đạt loại giỏi & trao lại cho khóa sau</span>
                </div>
                <span className="font-mono font-black text-brand-700">20 / 20đ</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-warm-50 rounded-xl border border-warm-200">
                <div>
                  <span className="font-bold text-warm-900 block">4. Khả năng gặp gỡ trực tiếp (&lt; 5km)</span>
                  <span className="text-warm-700 text-[11px]">Cùng địa bàn Hà Nội, hẹn tại Thư viện Tạ Quang Bửu</span>
                </div>
                <span className="font-mono font-black text-brand-700">20 / 20đ</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-warm-50 rounded-xl border border-warm-200">
                <div>
                  <span className="font-bold text-warm-900 block">5. Tính toàn vẹn của giấy báo nhập học</span>
                  <span className="text-warm-700 text-[11px]">Đã đối chiếu mã số sinh viên hợp lệ</span>
                </div>
                <span className="font-mono font-black text-brand-700">15 / 20đ</span>
              </div>
            </div>

            {/* Tổng điểm */}
            <div className="p-4 bg-brand-50 rounded-2xl border border-brand-200 flex items-center justify-between">
              <span className="font-bold text-brand-900 text-xs">Tổng Điểm Thẩm Định Rubric:</span>
              <span className="text-xl font-black text-brand-700">95 / 100 Điểm (Đạt Chuẩn 6⭐)</span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedWish(null)}
                className="px-4 py-2.5 rounded-xl border border-warm-200 text-xs font-bold text-warm-700 cursor-pointer"
              >
                Đóng
              </button>
              <button
                onClick={() => handleApproveWish(selectedWish.id)}
                className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-black shadow-xs cursor-pointer"
              >
                Ký Duyệt & Xuất Bản Lên Cây Nguyện Ước
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
