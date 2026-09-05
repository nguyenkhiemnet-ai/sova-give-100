'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Compass, ShieldCheck, Heart, Leaf, 
  Clock, Share2, Sparkles, CheckCircle2, MessageSquare, 
  Send, User, Award, Laptop, Bike, Scissors, Wrench
} from 'lucide-react';

interface TimelineEvent {
  year: string;
  stage: string;
  actor: string;
  location: string;
  story: string;
}

interface PassportItem {
  id: string;
  code: string;
  title: string;
  category: string;
  cycleCount: number;
  co2Saved: string;
  condition: string;
  status: 'ACTIVE' | 'TRANSFERRED' | 'AVAILABLE';
  lineage: TimelineEvent[];
  guestbook: { author: string; role: string; date: string; message: string }[];
}

const INITIAL_PASSPORTS: PassportItem[] = [
  {
    id: 'pass-1',
    code: 'SOVA-PASS-8842-VN',
    title: 'Laptop ThinkPad T480 Core i5 / 16GB SSD',
    category: 'laptop',
    cycleCount: 2,
    co2Saved: '85.5 kg CO2',
    condition: 'Hoạt động hoàn hảo • Pin 3.5h',
    status: 'ACTIVE',
    lineage: [
      {
        year: '2024',
        stage: 'Vòng Đời 1 (Khởi Tạo)',
        actor: 'Anh Nguyễn Minh Trí (Kỹ sư phần mềm)',
        location: 'Cầu Giấy, Hà Nội',
        story: 'Trao tặng máy tính khi nâng cấp thiết bị làm việc, mong muốn tiếp sức cho tân sinh viên khó khăn.'
      },
      {
        year: '2025',
        stage: 'Vòng Đời 1 (Thành Tựu)',
        actor: 'Em Trần Đức Nam (Sinh viên K68 ĐHBK Hà Nội)',
        location: 'Hà Nội',
        story: 'Đã hoàn thành xuất sắc đồ án kỳ 3 và nhận học bổng khuyến khích học tập nhờ có máy thực hành.'
      },
      {
        year: '2026',
        stage: 'Vòng Đời 2 (Tiếp Nối)',
        actor: 'Em Lê Thu Hằng (Sinh viên năm 1 CNTT)',
        location: 'Thái Nguyên',
        story: 'Đã nhận bàn giao chuyển tiếp qua Trạm Bắt Tay QR 0Đ ngày 05/09/2026 để bắt đầu năm học mới.'
      }
    ],
    guestbook: [
      {
        author: 'Em Trần Đức Nam',
        role: 'Người nhận vòng đời 1',
        date: '02/09/2026',
        message: 'Em đã giữ gìn máy rất cẩn thận, dán keo tản nhiệt mới trước khi trao lại cho em Hằng. Chiếc máy này thực sự đã cứu vớt việc học của em!'
      },
      {
        author: 'Em Lê Thu Hằng',
        role: 'Người nhận vòng đời 2',
        date: '05/09/2026',
        message: 'Em xúc động rơi nước mắt khi nhận được máy. Em hứa sẽ học thật giỏi và giữ máy bền đẹp để trao tiếp cho khóa sau!'
      }
    ]
  },
  {
    id: 'pass-2',
    code: 'SOVA-PASS-9182-VN',
    title: 'Xe Đạp Thống Nhất Khung Thép 24 inch',
    category: 'bicycle',
    cycleCount: 2,
    co2Saved: '32.0 kg CO2',
    condition: 'Đã bảo dưỡng phanh xích • Lốp mới',
    status: 'ACTIVE',
    lineage: [
      {
        year: '2025',
        stage: 'Vòng Đời 1 (Khởi Tạo)',
        actor: 'Chị Hoàng Lan Phương',
        location: 'Ba Đình, Hà Nội',
        story: 'Quyên tặng xe đạp của con gái sau khi cháu chuyển sang đi xe buýt đến trường.'
      },
      {
        year: '2026',
        stage: 'Vòng Đời 2 (Tiếp Nối)',
        actor: 'Em Vàng A Dơ (Học sinh lớp 10)',
        location: 'Hà Giang',
        story: 'Giúp rút ngắn 8km đường đèo đến trường nội trú vùng cao mỗi ngày.'
      }
    ],
    guestbook: [
      {
        author: 'Thầy Hoàng Văn Hải (Hiệu phó)',
        role: 'Đại sứ xác minh địa bàn',
        date: '15/08/2026',
        message: 'Chiếc xe giúp em Dơ không còn phải dậy từ 4h sáng đi bộ băng đèo. Tỷ lệ chuyên cần của em đã đạt 100%.'
      }
    ]
  },
  {
    id: 'pass-3',
    code: 'SOVA-PASS-1049-VN',
    title: 'Máy May Đa Năng Brother Gia Đình 14 Mũi',
    category: 'sewing_machine',
    cycleCount: 1,
    co2Saved: '18.2 kg CO2',
    condition: 'Đầy đủ phụ kiện chân vịt • Mô-tơ êm',
    status: 'AVAILABLE',
    lineage: [
      {
        year: '2026',
        stage: 'Vòng Đời 1 (Khởi Tạo)',
        actor: 'Cô Đỗ Thị Mai (Thợ may về hưu)',
        location: 'Hải Châu, Đà Nẵng',
        story: 'Trao tặng máy may gia đình cho phụ nữ đơn thân có nhu cầu sửa quần áo kiếm sống tại nhà.'
      }
    ],
    guestbook: [
      {
        author: 'Cô Đỗ Thị Mai',
        role: 'Người trao tặng',
        date: '01/09/2026',
        message: 'Cô đã tra dầu máy kỹ càng. Ai nhận máy cô sẵn sàng hướng dẫn cách xỏ chỉ và may vá cơ bản qua Zalo.'
      }
    ]
  }
];

export default function PassportsPage() {
  const [passports, setPassports] = useState<PassportItem[]>(INITIAL_PASSPORTS);
  const [filter, setFilter] = useState('ALL');
  const [selectedPassport, setSelectedPassport] = useState<PassportItem | null>(null);
  const [newComment, setNewComment] = useState('');
  const [authorName, setAuthorName] = useState('');

  const filteredList = passports.filter(p => {
    if (filter === 'ALL') return true;
    return p.category === filter;
  });

  const handleAddComment = () => {
    if (!newComment.trim() || !authorName.trim() || !selectedPassport) {
      alert('Vui lòng nhập họ tên và lời lưu bút tri ân.');
      return;
    }

    const updatedPassport = {
      ...selectedPassport,
      guestbook: [
        ...selectedPassport.guestbook,
        {
          author: authorName.trim(),
          role: 'Công dân tử tế',
          date: 'Hôm nay',
          message: newComment.trim()
        }
      ]
    };

    setPassports(prev => prev.map(p => p.id === selectedPassport.id ? updatedPassport : p));
    setSelectedPassport(updatedPassport);
    setNewComment('');
    setAuthorName('');
  };

  return (
    <div className="space-y-10 max-w-6xl mx-auto">
      
      {/* Header & Nút Quay Lại */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link 
          href="/" 
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-warm-200 bg-white text-xs font-bold text-warm-700 hover:text-brand-700 hover:border-brand-500 shadow-2xs transition-all w-fit"
        >
          <ArrowLeft className="w-4 h-4"/>
          <span>Quay lại Cây Nguyện Ước</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand-50 text-brand-700 border border-brand-200 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-brand-600"/>
            Sổ Cái Minh Bạch Vĩnh Cửu • Chống Cầm Cố
          </span>
        </div>
      </div>

      {/* Hero Giới Thiệu Hộ Chiếu */}
      <section className="bg-gradient-to-br from-brand-50 via-white to-warm-100 rounded-3xl border border-warm-200 p-6 sm:p-10 shadow-soft space-y-3">
        <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-brand-700 uppercase tracking-wider">
          <Compass className="w-4 h-4"/>
          Hộ Chiếu Vật Phẩm Tuần Hoàn (Circular Passports)
        </span>
        <h1 className="text-2xl sm:text-4xl font-black text-warm-900 tracking-tight">
          Mỗi Vật Phẩm Là Một Câu Chuyện Sống Động
        </h1>
        <p className="text-xs sm:text-sm text-warm-700 max-w-2xl leading-relaxed">
          Không đơn thuần là đồ dùng cũ, mỗi vật phẩm tại SOVA GIVE 100 mang một Hộ chiếu số ghi nhận hành trình chuyển giao qua các thế hệ, số kg CO2 đã cứu vớt và những mảnh đời đã được nâng bước.
        </p>
      </section>

      {/* Bộ Lọc Danh Mục */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: 'ALL', label: 'Tất cả hộ chiếu' },
          { id: 'laptop', label: 'Máy tính học tập' },
          { id: 'bicycle', label: 'Xe đạp đến trường' },
          { id: 'sewing_machine', label: 'Máy may sinh kế' },
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => setFilter(cat.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              filter === cat.id 
                ? 'bg-brand-600 text-white shadow-xs' 
                : 'bg-white text-warm-700 border border-warm-200 hover:bg-warm-100'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Danh Sách Hộ Chiếu Dạng Card Sang Trọng (Passport Books) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredList.map(pass => (
          <div 
            key={pass.id}
            className="bg-gradient-to-b from-white to-warm-50/50 rounded-3xl border border-warm-200 p-6 shadow-soft hover:shadow-md transition-all flex flex-col justify-between space-y-5 relative overflow-hidden group"
          >
            {/* Viền vạch hộ chiếu vàng kim */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-600 via-sun-500 to-brand-600"/>

            <div className="space-y-4">
              {/* Header Passport */}
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-700 block">
                    Circular Digital Passport
                  </span>
                  <div className="font-mono text-xs font-black text-warm-900 bg-warm-100 px-2.5 py-1 rounded-lg border border-warm-200 inline-block">
                    {pass.code}
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-brand-50 text-brand-700 border border-brand-200">
                  Vòng Đời {pass.cycleCount}
                </span>
              </div>

              {/* Tên vật phẩm */}
              <h3 className="text-base font-black text-warm-900 leading-snug group-hover:text-brand-700 transition-colors">
                {pass.title}
              </h3>

              {/* Trạng thái & Tác động */}
              <div className="grid grid-cols-2 gap-2 p-3 bg-white rounded-2xl border border-warm-200 text-xs">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-warm-700 block">CO2 Cắt Giảm</span>
                  <span className="font-black text-sun-600 flex items-center gap-1">
                    <Leaf className="w-3.5 h-3.5"/> {pass.co2Saved}
                  </span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-warm-700 block">Tình Trạng</span>
                  <span className="font-bold text-warm-800 text-[11px] truncate block">
                    {pass.condition}
                  </span>
                </div>
              </div>

              {/* Tóm tắt chặng đường mới nhất */}
              <div className="p-3 bg-warm-50 rounded-2xl border border-warm-200 text-xs space-y-1">
                <span className="text-[10px] font-extrabold text-brand-800 uppercase block">
                  Chặng Đang Phục Vụ ({pass.lineage[pass.lineage.length - 1].year}):
                </span>
                <p className="text-[11px] text-warm-700 italic line-clamp-2">
                  "{pass.lineage[pass.lineage.length - 1].story}"
                </p>
              </div>
            </div>

            {/* Nút Mở Modal Phả Hệ & Lưu Bút */}
            <button
              onClick={() => setSelectedPassport(pass)}
              className="w-full py-2.5 rounded-xl bg-white border border-warm-200 hover:border-brand-500 text-brand-700 text-xs font-bold shadow-2xs hover:bg-brand-50 transition-all flex items-center justify-center gap-2"
            >
              <Compass className="w-4 h-4"/>
              <span>Xem Cây Phả Hệ & Lưu Bút ({pass.guestbook.length})</span>
            </button>
          </div>
        ))}
      </div>

      {/* MODAL CÂY PHẢ HỆ VÒNG ĐỜI & LƯU BÚT TRI ÂN */}
      {selectedPassport && (
        <div className="fixed inset-0 z-50 bg-warm-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-warm-200 max-w-2xl w-full p-6 sm:p-8 shadow-xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-warm-200 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-black text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md border border-brand-200">
                    {selectedPassport.code}
                  </span>
                  <span className="text-xs font-extrabold text-warm-700">
                    • Vòng đời thứ {selectedPassport.cycleCount}
                  </span>
                </div>
                <h3 className="text-xl font-black text-warm-900">
                  {selectedPassport.title}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedPassport(null)}
                className="w-8 h-8 rounded-full bg-warm-100 hover:bg-warm-200 text-warm-700 flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* 1. CÂY PHẢ HỆ VÒNG ĐỜI (LINEAGE TIMELINE) */}
            <div className="space-y-4">
              <h4 className="text-sm font-black text-warm-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-600"/>
                <span>Hành Trình Chuyển Tiếp Qua Các Thế Hệ (Lineage Tree)</span>
              </h4>

              <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-brand-200">
                {selectedPassport.lineage.map((item, idx) => (
                  <div key={idx} className="relative space-y-1">
                    {/* Chấm tròn mốc */}
                    <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-brand-600 border-2 border-white shadow-2xs"/>
                    
                    <div className="flex items-center justify-between text-xs font-bold text-warm-800">
                      <span className="text-brand-700 font-extrabold">{item.year} • {item.stage}</span>
                      <span className="text-warm-700 text-[11px]">{item.location}</span>
                    </div>
                    <div className="text-xs font-black text-warm-900">{item.actor}</div>
                    <p className="text-xs text-warm-700 leading-relaxed bg-warm-50 p-3 rounded-xl border border-warm-200">
                      {item.story}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. SỔ LƯU BÚT TRI ÂN (GRATITUDE GUESTBOOK) */}
            <div className="space-y-4 pt-4 border-t border-warm-200">
              <h4 className="text-sm font-black text-warm-900 flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-500 fill-red-500"/>
                <span>Sổ Lưu Bút Tri Ân Của Các Thế Hệ Người Dùng</span>
              </h4>

              {/* Danh sách lưu bút */}
              <div className="space-y-3">
                {selectedPassport.guestbook.map((gb, i) => (
                  <div key={i} className="p-3.5 bg-brand-50/60 rounded-2xl border border-brand-100 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-brand-900 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-brand-600"/>
                        {gb.author}
                        <span className="text-[10px] font-medium text-brand-700">({gb.role})</span>
                      </span>
                      <span className="text-[10px] text-warm-700">{gb.date}</span>
                    </div>
                    <p className="text-xs text-brand-950 italic leading-relaxed">
                      "{gb.message}"
                    </p>
                  </div>
                ))}
              </div>

              {/* Form gửi lời cảm ơn */}
              <div className="p-4 bg-warm-50 rounded-2xl border border-warm-200 space-y-3">
                <span className="text-xs font-bold text-warm-800 block">
                  Để lại lời tri ân hoặc cập nhật tình trạng thiết bị:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input 
                    type="text" 
                    placeholder="Họ và tên của bạn..."
                    value={authorName}
                    onChange={e => setAuthorName(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-warm-200 bg-white text-xs text-warm-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <input 
                    type="text" 
                    placeholder="Viết lời tri ân hoặc lời chúc..."
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    className="sm:col-span-2 px-3 py-2 rounded-xl border border-warm-200 bg-white text-xs text-warm-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddComment}
                    className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5"/>
                    <span>Gửi Lưu Bút</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedPassport(null)}
                className="px-6 py-2.5 rounded-xl border border-warm-200 hover:bg-warm-100 text-xs font-bold text-warm-700"
              >
                Đóng Cửa Sổ
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
