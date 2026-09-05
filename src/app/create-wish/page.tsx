'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { 
  ArrowLeft, Laptop, Bike, Scissors, BookOpen, Wrench, Sparkles, 
  Camera, ShieldCheck, CheckCircle2, ChevronRight, AlertCircle, 
  MapPin, HeartHandshake, UploadCloud
} from 'lucide-react';

const CATEGORIES = [
  { id: 'laptop', label: 'Máy tính học tập', icon: Laptop, desc: 'Laptop, PC cho học sinh - sinh viên' },
  { id: 'bicycle', label: 'Xe đạp đến trường', icon: Bike, desc: 'Phương tiện đi lại cho học sinh nghèo' },
  { id: 'sewing_machine', label: 'Máy may sinh kế', icon: Scissors, desc: 'Dụng cụ may vá cho mẹ đơn thân' },
  { id: 'study_tools', label: 'Dụng cụ tri thức', icon: BookOpen, desc: 'Sách vở, bàn học, máy tính cầm tay' },
  { id: 'livelihood_tools', label: 'Công cụ mưu sinh', icon: Wrench, desc: 'Đồ nghề sửa xe, làm mộc, làm nông' },
];

const PROVINCES = [
  { code: '01', name: 'Hà Nội' },
  { code: '79', name: 'TP. Hồ Chí Minh' },
  { code: '48', name: 'Đà Nẵng' },
  { code: '03', name: 'Hà Giang' },
  { code: '31', name: 'Hải Phòng' },
  { code: '92', name: 'Cần Thơ' },
  { code: 'OTHER', name: 'Tỉnh/Thành phố khác' },
];

const PLEDGE_CHIPS = [
  'Tôi cam kết giữ gìn thiết bị cẩn thận và trao lại cho người khác khi không còn dùng đến.',
  'Tôi cam kết dùng đúng mục đích học tập/sinh kế tự lập, không bán hay cầm cố.',
  'Tôi cam kết chia sẻ kinh nghiệm và hỗ trợ cộng đồng sau khi vượt qua khó khăn.',
];

export default function CreateWishPage() {
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState('laptop');
  const [title, setTitle] = useState('');
  const [reason, setReason] = useState('');
  const [pledge, setPledge] = useState(PLEDGE_CHIPS[0]);
  const [province, setProvince] = useState('01');
  const [urgency, setUrgency] = useState('urgent');
  
  // Dignity Shield State
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isShieldProcessed, setIsShieldProcessed] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // XỬ LÝ ẢNH QUA DIGNITY SHIELD 2.5 (EXIF STRIP + RADIAL BLUR VIGNETTE)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current || document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Chuẩn hóa kích thước tối đa 800px (tiết kiệm băng thông & bóc tách metadata gốc)
        const maxDim = 800;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = w;
        canvas.height = h;

        // Vẽ ảnh thuần túy (Triệt tiêu 100% EXIF GPS)
        ctx.drawImage(img, 0, 0, w, h);

        // Thuật toán Dignity Shield Vignette: Làm mờ viền bối cảnh tư gia
        const gradient = ctx.createRadialGradient(
          w / 2, h / 2, Math.min(w, h) * 0.3,
          w / 2, h / 2, Math.max(w, h) * 0.65
        );
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(1, 'rgba(250, 250, 249, 0.85)'); // Trùng với nền warm light

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);

        // Xuất WebP nén chất lượng cao
        const processedUrl = canvas.toDataURL('image/webp', 0.85);
        setImagePreview(processedUrl);
        setIsShieldProcessed(true);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitWish = async () => {
    if (!title.trim() || !reason.trim()) {
      alert('Vui lòng điền tiêu đề và chia sẻ hoàn cảnh của bạn.');
      return;
    }
    setUploading(true);

    try {
      // 1. Lấy dreamer_id từ profile đầu tiên hoặc auth
      const { data: profiles } = await supabase.from('profiles').select('id').limit(1);
      const dreamerId = profiles?.[0]?.id || null;

      // 2. Chèn vào bảng wishes
      const newWish = {
        dreamer_id: dreamerId,
        title: title.trim(),
        category: category,
        reason: reason.trim(),
        honor_commitment: pledge.trim(),
        urgency: urgency,
        province_code: province,
        status: 'pending',
      };

      const { data, error } = await supabase.from('wishes').insert([newWish]).select();

      if (error) {
        throw error;
      }

      setSubmittedId(data?.[0]?.id || 'SOVA-WISH-SUCCESS');
      setStep(4);
    } catch (err: any) {
      console.error(err);
      alert('Không thể gửi ước nguyện: ' + (err.message || 'Lỗi kết nối Supabase'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Canvas ẩn phục vụ xử lý ảnh */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Nút quay lại & Header */}
      <div className="flex items-center justify-between">
        <Link 
          href="/" 
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-warm-200 bg-white text-xs font-bold text-warm-700 hover:text-brand-700 hover:border-brand-500 shadow-2xs transition-all"
        >
          <ArrowLeft className="w-4 h-4"/>
          <span>Quay lại Cây Nguyện Ước</span>
        </Link>
        <span className="text-xs font-semibold text-warm-700">
          Nghị định 13/2023/NĐ-CP • Dignity-First
        </span>
      </div>

      {/* BƯỚC 4: THÀNH CÔNG */}
      {step === 4 ? (
        <div className="bg-white rounded-3xl border border-warm-200 p-8 sm:p-12 text-center space-y-6 shadow-soft">
          <div className="w-16 h-16 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-10 h-10"/>
          </div>
          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-brand-50 text-brand-700 border border-brand-200">
              Đã Tiếp Nhận Thành Công
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-warm-900">
              Ước Nguyện Của Bạn Đã Được Gieo Mầm!
            </h2>
            <p className="text-xs sm:text-sm text-warm-700 max-w-md mx-auto leading-relaxed">
              Hệ thống đã lưu trữ ước nguyện kèm chứng chỉ bảo vệ danh dự. Đại sứ địa phương sẽ thẩm định và kết nối người trao tặng sớm nhất.
            </p>
          </div>

          <div className="p-4 bg-warm-50 rounded-2xl border border-warm-200 text-xs text-warm-800 font-mono">
            Mã định danh ước nguyện: {submittedId}
          </div>

          <div className="pt-2 flex justify-center gap-3">
            <Link 
              href="/"
              className="px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-soft transition-all"
            >
              Về Trang Chủ Khám Phá
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-warm-200 p-6 sm:p-10 shadow-soft space-y-8">
          
          {/* Thanh Tiến Trình 3 Bước */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-warm-700">
              <span className={step >= 1 ? 'text-brand-700' : ''}>1. Chọn Nhu Cầu</span>
              <span className={step >= 2 ? 'text-brand-700' : ''}>2. Minh Chứng Dignity Shield</span>
              <span className={step >= 3 ? 'text-brand-700' : ''}>3. Lời Ngỏ & Cam Kết</span>
            </div>
            <div className="h-1.5 w-full bg-warm-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-brand-600 rounded-full transition-all duration-300"
                style={{ width: step === 1 ? '33.3%' : step === 2 ? '66.6%' : '100%' }}
              />
            </div>
          </div>

          {/* BƯỚC 1: CHỌN NHU CẦU THIẾT BỊ */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-xl font-black text-warm-900">
                  Bạn đang cần dụng cụ nào để tiếp sức sinh kế / học tập?
                </h2>
                <p className="text-xs text-warm-700">
                  Chọn đúng nhóm dụng cụ để hệ thống phân loại đến nhà hảo tâm phù hợp.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {CATEGORIES.map(cat => {
                  const Icon = cat.icon;
                  const isSelected = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setCategory(cat.id);
                        if (!title) setTitle(cat.label);
                      }}
                      className={`p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all ${
                        isSelected 
                          ? 'border-brand-500 bg-brand-50/50 shadow-xs' 
                          : 'border-warm-200 hover:border-warm-300 bg-white'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-brand-600 text-white' : 'bg-warm-100 text-warm-700'
                      }`}>
                        <Icon className="w-5 h-5"/>
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-warm-900">{cat.label}</h4>
                        <p className="text-[11px] text-warm-700 mt-0.5">{cat.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-soft transition-all"
                >
                  <span>Tiếp Tục Bước 2</span>
                  <ChevronRight className="w-4 h-4"/>
                </button>
              </div>
            </div>
          )}

          {/* BƯỚC 2: MINH CHỨNG & DIGNITY SHIELD */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-xl font-black text-warm-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-brand-600"/>
                  <span>Hình Ảnh Minh Chứng & Bảo Vệ Danh Dự</span>
                </h2>
                <p className="text-xs text-warm-700">
                  Thuật toán Dignity Shield tự động bóc tách GPS và làm mờ bối cảnh xung quanh để bảo vệ không gian tư gia.
                </p>
              </div>

              <div className="p-6 border-2 border-dashed border-warm-200 rounded-3xl text-center space-y-4 bg-warm-50/50">
                {imagePreview ? (
                  <div className="space-y-3">
                    <div className="relative inline-block rounded-2xl overflow-hidden shadow-soft border border-warm-200 max-w-sm">
                      <img src={imagePreview} alt="Dignity Shield Preview" className="w-full h-auto object-cover"/>
                      <span className="absolute bottom-2 left-2 right-2 px-2.5 py-1 bg-white/90 backdrop-blur-xs rounded-lg text-[10px] font-bold text-brand-800 border border-brand-200 flex items-center justify-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-brand-600"/>
                        Đã Khử GPS & Phủ Mờ Bảo Vệ Nhân Phẩm
                      </span>
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs font-bold text-brand-700 hover:underline"
                      >
                        Chọn ảnh khác
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-white text-brand-600 flex items-center justify-center mx-auto shadow-2xs border border-warm-200">
                      <Camera className="w-7 h-7"/>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-warm-900">Chụp hoặc tải ảnh góc học tập / làm việc</h4>
                      <p className="text-xs text-warm-700">Định dạng JPG, PNG hoặc WebP. Hệ thống tự động khử thông tin nhạy cảm.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-5 py-2.5 rounded-xl bg-white border border-warm-200 text-xs font-bold text-warm-800 hover:border-brand-500 shadow-2xs transition-all inline-flex items-center gap-2"
                    >
                      <UploadCloud className="w-4 h-4 text-brand-600"/>
                      <span>Chọn Ảnh Từ Thiết Bị</span>
                    </button>
                  </div>
                )}
                <input 
                  ref={fileInputRef} 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                  className="hidden" 
                />
              </div>

              <div className="p-4 bg-brand-50 rounded-2xl border border-brand-100 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-brand-600 shrink-0 mt-0.5"/>
                <div className="text-xs text-brand-900 leading-relaxed">
                  <strong>Cam kết bảo mật Nghị định 13/2023/NĐ-CP:</strong> Dữ liệu ảnh sau khi xử lý chỉ được dùng làm bằng chứng đối soát vòng đời Hộ Chiếu 0Đ, không chia sẻ cho bên thứ ba vì mục đích quảng cáo.
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-5 py-2.5 rounded-xl border border-warm-200 text-xs font-bold text-warm-700 hover:bg-warm-100"
                >
                  Quay Lại
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-soft"
                >
                  <span>Tiếp Tục Bước 3</span>
                  <ChevronRight className="w-4 h-4"/>
                </button>
              </div>
            </div>
          )}

          {/* BƯỚC 3: LỜI NGỎ, CAM KẾT & ĐỊA BÀN */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-xl font-black text-warm-900">
                  Hoàn thiện thông tin & Lời cam kết danh dự
                </h2>
                <p className="text-xs text-warm-700">
                  Sự chân thành của bạn là thước đo cao nhất để các nhà hảo tâm sẵn sàng trao gửi dụng cụ.
                </p>
              </div>

              <div className="space-y-4">
                {/* Tiêu đề */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-warm-800">Tiêu đề ngắn gọn:</label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="VD: Cần laptop cũ học lập trình Web, Xe đạp cho con vào lớp 10..."
                    className="w-full px-4 py-2.5 rounded-xl border border-warm-200 bg-warm-50 text-sm text-warm-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                {/* Hoàn cảnh */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-warm-800">Chia sẻ chân thực về hoàn cảnh & mục tiêu sử dụng:</label>
                  <textarea
                    rows={3}
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder="Hãy kể về khó khăn hiện tại và dụng cụ này sẽ giúp bạn thay đổi cuộc sống như thế nào..."
                    className="w-full px-4 py-2.5 rounded-xl border border-warm-200 bg-warm-50 text-sm text-warm-900 focus:outline-none focus:ring-2 focus:ring-brand-500 leading-relaxed"
                  />
                </div>

                {/* Cam kết danh dự */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-warm-800 flex items-center gap-1.5">
                    <HeartHandshake className="w-4 h-4 text-brand-600"/>
                    <span>Chọn Lời Cam Kết Danh Dự:</span>
                  </label>
                  <div className="space-y-2">
                    {PLEDGE_CHIPS.map((chip, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setPledge(chip)}
                        className={`w-full p-3 rounded-xl border text-left text-xs font-medium transition-all ${
                          pledge === chip 
                            ? 'border-brand-500 bg-brand-50/60 text-brand-950 font-bold shadow-2xs' 
                            : 'border-warm-200 bg-white text-warm-700 hover:bg-warm-50'
                        }`}
                      >
                        "{chip}"
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tỉnh thành & Mức độ cấp thiết */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-warm-800">Tỉnh / Thành phố cư trú:</label>
                    <select
                      value={province}
                      onChange={e => setProvince(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-warm-200 bg-warm-50 text-sm font-semibold text-warm-900 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
                    >
                      {PROVINCES.map(p => (
                        <option key={p.code} value={p.code}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-warm-800">Mức độ cần thiết:</label>
                    <select
                      value={urgency}
                      onChange={e => setUrgency(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-warm-200 bg-warm-50 text-sm font-semibold text-warm-900 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
                    >
                      <option value="urgent">Cần gấp trong tháng</option>
                      <option value="normal">Bình thường</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-5 py-2.5 rounded-xl border border-warm-200 text-xs font-bold text-warm-700 hover:bg-warm-100"
                >
                  Quay Lại
                </button>
                <button
                  type="button"
                  disabled={uploading}
                  onClick={handleSubmitWish}
                  className="px-8 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-black flex items-center gap-2 shadow-soft hover:shadow-float disabled:opacity-50 transition-all"
                >
                  <Sparkles className="w-4 h-4"/>
                  <span>{uploading ? 'Đang Lưu Trữ...' : 'Gieo Mầm Ước Nguyện 0-VND'}</span>
                </button>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
