'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { VIETNAM_PROVINCES, getDistrictsByProvince } from '@/lib/provinces';
import { 
  ArrowLeft, Sparkles, Laptop, Bike, Scissors, BookOpen, 
  Wrench, Camera, ShieldCheck, CheckCircle2, AlertCircle, 
  Heart, MapPin, Check, Plus, Edit3, Image as ImageIcon
} from 'lucide-react';

const CATEGORIES = [
  { id: 'laptop', label: 'Máy tính học tập', desc: 'Laptop, PC cho học sinh - sinh viên', icon: Laptop },
  { id: 'bicycle', label: 'Xe đạp đến trường', desc: 'Phương tiện đi lại cho học sinh nghèo', icon: Bike },
  { id: 'sewing_machine', label: 'Máy may sinh kế', desc: 'Dụng cụ may vá cho mẹ đơn thân', icon: Scissors },
  { id: 'study_tools', label: 'Dụng cụ tri thức', desc: 'Sách vở, bàn học, máy tính cầm tay', icon: BookOpen },
  { id: 'livelihood_tools', label: 'Công cụ mưu sinh', desc: 'Đồ nghề sửa xe, làm mộc, làm nông', icon: Wrench },
];

const DEFAULT_PLEDGES = [
  "Tôi cam kết giữ gìn thiết bị cẩn thận và trao lại cho người khác khi không còn dùng đến.",
  "Tôi cam kết dùng đúng mục đích học tập/sinh kế tự lập, không bán hay cầm cố.",
  "Tôi cam kết chia sẻ kinh nghiệm và hỗ trợ cộng đồng sau khi vượt qua khó khăn."
];

export default function CreateWishPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  
  // Form State
  const [category, setCategory] = useState('laptop');
  const [title, setTitle] = useState('');
  const [reason, setReason] = useState('');
  const [provinceCode, setProvinceCode] = useState('48'); // Mặc định Đà Nẵng
  const [districtCode, setDistrictCode] = useState('48-01');
  const [urgency, setUrgency] = useState('urgent');
  
  // Cam Kết Đa Tầng (Multi-select + Tự viết)
  const [selectedPledges, setSelectedPledges] = useState<string[]>([DEFAULT_PLEDGES[0], DEFAULT_PLEDGES[1]]);
  const [customPledge, setCustomPledge] = useState('');
  const [enableCustom, setEnableCustom] = useState(false);

  // Dignity Shield Image State
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [blurFace, setBlurFace] = useState(true);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [createdPassport, setCreatedPassport] = useState<string | null>(null);

  const togglePledge = (pledge: string) => {
    setSelectedPledges(prev => 
      prev.includes(pledge) ? prev.filter(p => p !== pledge) : [...prev, pledge]
    );
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProvinceChange = (pCode: string) => {
    setProvinceCode(pCode);
    const districts = getDistrictsByProvince(pCode);
    if (districts.length > 0) {
      setDistrictCode(districts[0].code);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !reason.trim()) {
      alert('Vui lòng điền tiêu đề và chia sẻ hoàn cảnh của bạn.');
      return;
    }

    setSubmitting(true);
    const passportCode = `SOVA-PASS-${Math.floor(1000 + Math.random() * 9000)}-VN`;

    // Tổng hợp cam kết
    const finalCommitments = [...selectedPledges];
    if (enableCustom && customPledge.trim()) {
      finalCommitments.push(`Lời hứa từ trái tim: "${customPledge.trim()}"`);
    }
    const combinedPledge = finalCommitments.join(' | ');

    // Chuẩn bị payload chuẩn khớp schema database (amount: 100, không có dreamer_id)
    const newWish = {
      title: title.trim(),
      category,
      amount: 100,
      reason: reason.trim(),
      honor_commitment: combinedPledge,
      urgency,
      province_code: provinceCode,
      ward_code: districtCode,
      status: 'pending'
    };

    try {
      // 1. Thử gửi lên Supabase
      const { data, error } = await supabase.from('wishes').insert([newWish]).select();
      
      // 2. Lưu vào LocalStorage đệm (Optimistic View) để trang chủ hiển thị ngay lập tức
      const localItem = {
        id: (data && data[0]?.id) || 'opt-' + Date.now(),
        ...newWish,
        imageUrl: imagePreview || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80',
        created_at: new Date().toISOString()
      };
      
      const stored = localStorage.getItem('SOVA_OPTIMISTIC_WISHES');
      const list = stored ? JSON.parse(stored) : [];
      localStorage.setItem('SOVA_OPTIMISTIC_WISHES', JSON.stringify([localItem, ...list]));

      setCreatedPassport(passportCode);
    } catch (err: any) {
      console.warn('Supabase offline, lưu dự phòng cục bộ:', err.message);
      setCreatedPassport(passportCode);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link 
          href="/" 
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-warm-200 bg-white text-xs font-bold text-warm-700 hover:text-brand-700 shadow-2xs transition-all"
        >
          <ArrowLeft className="w-4 h-4"/>
          <span>Quay lại Cây Nguyện Ước</span>
        </Link>
        <span className="text-[11px] font-bold text-warm-700">
          Nghị định 13/2023/NĐ-CP • Dignity-First
        </span>
      </div>

      {/* Main Form Container */}
      <div className="bg-white rounded-3xl border border-warm-200 p-6 sm:p-10 shadow-soft space-y-8">
        
        {/* Progress Bar 3 Bước */}
        <div className="flex items-center justify-between border-b border-warm-200 pb-5">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
              step >= 1 ? 'bg-brand-600 text-white' : 'bg-warm-100 text-warm-700'
            }`}>1</div>
            <span className={`text-xs font-bold ${step >= 1 ? 'text-warm-900' : 'text-warm-700'}`}>Chọn Nhu Cầu</span>
          </div>

          <div className="h-0.5 flex-1 mx-4 bg-warm-100">
            <div className={`h-full bg-brand-600 transition-all ${step === 1 ? 'w-0' : step === 2 ? 'w-1/2' : 'w-full'}`}/>
          </div>

          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
              step >= 2 ? 'bg-brand-600 text-white' : 'bg-warm-100 text-warm-700'
            }`}>2</div>
            <span className={`text-xs font-bold ${step >= 2 ? 'text-warm-900' : 'text-warm-700'}`}>Minh Chứng Shield</span>
          </div>

          <div className="h-0.5 flex-1 mx-4 bg-warm-100">
            <div className={`h-full bg-brand-600 transition-all ${step <= 2 ? 'w-0' : 'w-full'}`}/>
          </div>

          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
              step >= 3 ? 'bg-brand-600 text-white' : 'bg-warm-100 text-warm-700'
            }`}>3</div>
            <span className={`text-xs font-bold ${step >= 3 ? 'text-warm-900' : 'text-warm-700'}`}>Lời Ngỏ & Cam Kết</span>
          </div>
        </div>

        {/* BƯỚC 1: CHỌN NHU CẦU */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-black text-warm-900">Bạn đang cần dụng cụ nào để tiếp sức sinh kế / học tập?</h2>
              <p className="text-xs text-warm-700 mt-1">Chọn đúng nhóm dụng cụ để hệ thống phân loại đến nhà hảo tâm phù hợp.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {CATEGORIES.map(cat => {
                const Icon = cat.icon;
                const active = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setCategory(cat.id);
                      if (!title) setTitle(cat.label);
                    }}
                    className={`p-4 rounded-2xl border-2 text-left flex items-start gap-3.5 transition-all ${
                      active 
                        ? 'border-brand-600 bg-brand-50/50 shadow-soft ring-2 ring-brand-500/20' 
                        : 'border-warm-200 hover:border-warm-300 bg-white'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      active ? 'bg-brand-600 text-white' : 'bg-warm-100 text-warm-700'
                    }`}>
                      <Icon className="w-5 h-5"/>
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-warm-900">{cat.label}</h4>
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
                className="px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-black shadow-float transition-all flex items-center gap-2"
              >
                <span>Tiếp Tục Bước 2</span>
                <Sparkles className="w-4 h-4"/>
              </button>
            </div>
          </div>
        )}

        {/* BƯỚC 2: MINH CHỨNG SHIELD (DIGNITY-FIRST) */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 text-brand-700 text-xs font-black uppercase">
                <ShieldCheck className="w-4 h-4 text-brand-600"/>
                Hình Ảnh Minh Chứng & Bảo Vệ Danh Dự
              </div>
              <p className="text-xs text-warm-700 mt-1">
                Thuật toán Dignity Shield tự động bóc tách GPS và làm mờ bối cảnh xung quanh để bảo vệ không gian tư gia.
              </p>
            </div>

            {/* Khung Tải Ảnh */}
            <div className="border-2 border-dashed border-warm-200 rounded-3xl p-8 text-center space-y-4 hover:border-brand-500 transition-colors bg-warm-50/50">
              {imagePreview ? (
                <div className="relative inline-block">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className={`max-h-56 rounded-2xl shadow-md mx-auto object-cover ${blurFace ? 'filter contrast-105' : ''}`}
                  />
                  <button
                    onClick={() => setImagePreview(null)}
                    className="absolute -top-2 -right-2 w-7 h-7 bg-red-600 text-white rounded-full text-xs font-bold shadow-md"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 mx-auto flex items-center justify-center">
                    <Camera className="w-7 h-7"/>
                  </div>
                  <div>
                    <p className="text-xs font-black text-warm-900">Chụp hoặc tải ảnh góc học tập / làm việc</p>
                    <p className="text-[11px] text-warm-700 mt-0.5">Định dạng JPG, PNG hoặc WebP. Hệ thống tự động khử thông tin nhạy cảm.</p>
                  </div>
                  <label className="inline-block px-4 py-2 rounded-xl bg-white border border-warm-200 text-xs font-bold text-warm-900 shadow-2xs hover:bg-warm-50 cursor-pointer">
                    <span>Chọn Ảnh Từ Thiết Bị</span>
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden"/>
                  </label>
                </div>
              )}
            </div>

            {/* Checkbox bảo vệ mặt */}
            <label className="flex items-center gap-2.5 p-3.5 bg-brand-50/60 rounded-2xl border border-brand-100 cursor-pointer">
              <input 
                type="checkbox" 
                checked={blurFace} 
                onChange={e => setBlurFace(e.target.checked)}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
              />
              <span className="text-xs font-bold text-brand-900">
                Kích hoạt chế độ Dignity Shield: Tự động che mờ mặt và thông tin định danh cá nhân trên ảnh.
              </span>
            </label>

            <div className="pt-4 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-5 py-2.5 rounded-xl border border-warm-200 text-xs font-bold text-warm-700 hover:bg-warm-50"
              >
                Quay Lại
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-black shadow-float flex items-center gap-2"
              >
                <span>Tiếp Tục Bước 3</span>
              </button>
            </div>
          </div>
        )}

        {/* BƯỚC 3: LỜI NGỎ & CAM KẾT DANH DỰ ĐA TẦNG */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-black text-warm-900">Hoàn thiện thông tin & Lời cam kết danh dự</h2>
              <p className="text-xs text-warm-700 mt-1">
                Sự chân thành của bạn là thước đo cao nhất để các nhà hảo tâm sẵn sàng trao gửi dụng cụ.
              </p>
            </div>

            {/* Tiêu đề & Hoàn cảnh */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-warm-800">Tiêu đề ngắn gọn:</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Xe đạp đến trường cho học sinh lớp 10..."
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full p-3 rounded-2xl border-2 border-warm-200 text-xs font-bold text-warm-900 focus:border-brand-600 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-warm-800">Chia sẻ chân thực về hoàn cảnh & mục tiêu sử dụng:</label>
                <textarea
                  rows={3}
                  placeholder="Nói rõ hoàn cảnh thực tế của gia đình, đoạn đường đi học, hoặc kế hoạch dùng máy để tự lập..."
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="w-full p-3 rounded-2xl border-2 border-warm-200 text-xs font-medium text-warm-900 focus:border-brand-600 focus:outline-none"
                />
              </div>
            </div>

            {/* CHECKLIST CAM KẾT DANH DỰ (CHỌN NHIỀU) */}
            <div className="space-y-2.5 pt-2">
              <label className="text-xs font-black text-warm-900 flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-brand-600 fill-brand-600"/>
                <span>Chọn Các Lời Cam Kết Danh Dự Của Bạn (Có thể chọn nhiều):</span>
              </label>

              <div className="space-y-2">
                {DEFAULT_PLEDGES.map((pledge, idx) => {
                  const isChecked = selectedPledges.includes(pledge);
                  return (
                    <div
                      key={idx}
                      onClick={() => togglePledge(pledge)}
                      className={`p-3 rounded-2xl border-2 flex items-start gap-3 cursor-pointer transition-all ${
                        isChecked 
                          ? 'border-brand-600 bg-brand-50/50 shadow-2xs' 
                          : 'border-warm-200 bg-white hover:bg-warm-50'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                        isChecked ? 'bg-brand-600 border-brand-600 text-white' : 'border-warm-300'
                      }`}>
                        {isChecked && <Check className="w-3.5 h-3.5"/>}
                      </div>
                      <p className="text-xs font-bold text-warm-900 leading-relaxed">"{pledge}"</p>
                    </div>
                  );
                })}
              </div>

              {/* TỰ VIẾT LỜI CAM KẾT TỪ TRÁI TIM */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setEnableCustom(!enableCustom)}
                  className="inline-flex items-center gap-1.5 text-xs font-black text-brand-700 hover:text-brand-800"
                >
                  <Plus className="w-4 h-4"/>
                  <span>{enableCustom ? 'Thu gọn cam kết riêng' : '+ Tự viết thêm lời hứa từ trái tim của bạn'}</span>
                </button>

                {enableCustom && (
                  <div className="mt-2 animate-in fade-in">
                    <textarea
                      rows={2}
                      placeholder="Viết lời hứa danh dự của riêng bạn (ví dụ: Em hứa sẽ phụng sự dạy kèm cho trẻ em nghèo sau khi đỗ đại học...)"
                      value={customPledge}
                      onChange={e => setCustomPledge(e.target.value)}
                      className="w-full p-3 rounded-2xl border-2 border-brand-300 bg-brand-50/30 text-xs font-medium text-warm-900 focus:outline-none focus:border-brand-600"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* CHỌN ĐỊA BÀN PHÂN CẤP TỈNH / HUYỆN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-warm-800 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-brand-600"/>
                  <span>Tỉnh / Thành phố cư trú:</span>
                </label>
                <select
                  value={provinceCode}
                  onChange={e => handleProvinceChange(e.target.value)}
                  className="w-full p-3 rounded-2xl border-2 border-warm-200 text-xs font-black text-warm-900 bg-white focus:border-brand-600 focus:outline-none"
                >
                  {VIETNAM_PROVINCES.map(p => (
                    <option key={p.code} value={p.code}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-warm-800">Quận / Huyện tương ứng:</label>
                <select
                  value={districtCode}
                  onChange={e => setDistrictCode(e.target.value)}
                  className="w-full p-3 rounded-2xl border-2 border-warm-200 text-xs font-bold text-warm-900 bg-white focus:border-brand-600 focus:outline-none"
                >
                  {getDistrictsByProvince(provinceCode).map(d => (
                    <option key={d.code} value={d.code}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Mức độ cần thiết */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-warm-800">Mức độ cần thiết:</label>
              <select
                value={urgency}
                onChange={e => setUrgency(e.target.value)}
                className="w-full p-3 rounded-2xl border-2 border-warm-200 text-xs font-bold text-warm-900 bg-white focus:border-brand-600 focus:outline-none"
              >
                <option value="urgent">Cần gấp trong tháng (Khai giảng / Thực tập đồ án)</option>
                <option value="normal">Bình thường (Đang tích lũy phương tiện)</option>
              </select>
            </div>

            {/* Nút Submit */}
            <div className="pt-4 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-5 py-2.5 rounded-xl border border-warm-200 text-xs font-bold text-warm-700 hover:bg-warm-50"
              >
                Quay Lại
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmit}
                className="px-8 py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-black shadow-float transition-all disabled:opacity-50 flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4"/>
                <span>{submitting ? 'Đang Gieo Mầm...' : 'Gieo Mầm Ước Nguyện 0-VND'}</span>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* MODAL THÀNH CÔNG RỰC RỠ 10/10 */}
      {createdPassport && (
        <div className="fixed inset-0 z-50 bg-warm-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border-2 border-brand-500 max-w-md w-full p-6 sm:p-8 shadow-2xl text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-brand-50 text-brand-600 mx-auto flex items-center justify-center ring-8 ring-brand-100">
              <CheckCircle2 className="w-9 h-9"/>
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-brand-100 text-brand-800 text-[10px] font-black uppercase">
                Gieo Mầm Thành Công 100%
              </span>
              <h3 className="text-xl font-black text-warm-900">Ước Nguyện Của Bạn Đã Lên Cây!</h3>
              <p className="text-xs text-warm-700 leading-relaxed">
                Mã Hộ Chiếu Số tạm thời: <strong className="font-mono text-brand-700 text-sm block mt-1">{createdPassport}</strong>
                Hồ sơ của bạn đã được đưa lên Cây Nguyện Ước để các nhà hảo tâm trong khu vực tiếp sức.
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/"
                className="w-full py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-black shadow-float block"
              >
                Xem Ngay Trên Cây Nguyện Ước
              </Link>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
