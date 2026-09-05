'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

interface WishItem {
  id: string;
  title: string;
  category: string;
  urgency_level: string;
  reason_description: string;
  commitment_pledge: string;
  province_code: string;
  verification_status: string;
}

const CATEGORIES = [
  { id: 'ALL', label: 'Tất cả nguyện ước' },
  { id: 'STUDY_DEVICE', label: 'Thiết bị học tập' },
  { id: 'COMMUTE', label: 'Phương tiện đi lại' },
  { id: 'VOCATIONAL_TOOL', label: 'Công cụ nghề nghiệp' },
  { id: 'MENTORSHIP', label: 'Cố vấn tri thức' },
];

const INITIAL_DEMO_WISHES: WishItem[] = [
  {
    id: 'demo-1',
    title: 'Laptop cũ cho tân sinh viên khó khăn ngành CNTT',
    category: 'STUDY_DEVICE',
    urgency_level: 'HIGH',
    reason_description: 'Em vừa đỗ đại học nhưng gia đình làm nông không đủ kinh phí trang trải mua máy tính phục vụ học lập trình cơ bản.',
    commitment_pledge: 'Cam kết bảo quản tốt, học tập đạt loại giỏi và trao lại cho thế hệ sau khi ra trường đi làm.',
    province_code: 'Hà Nội (01)',
    verification_status: 'VERIFIED',
  },
  {
    id: 'demo-2',
    title: 'Xe đạp cũ đi học 7km cho học sinh cấp 2',
    category: 'COMMUTE',
    urgency_level: 'CRITICAL',
    reason_description: 'Hàng ngày em phải đi bộ gần 2 tiếng tới trường điểm xã, mùa mưa lũ gặp nhiều khó khăn.',
    commitment_pledge: 'Em cam kết đi học chuyên cần và bảo dưỡng xe cẩn thận.',
    province_code: 'Hà Giang (03)',
    verification_status: 'VERIFIED',
  },
  {
    id: 'demo-3',
    title: 'Máy may cầm tay cho mẹ đơn thân khởi nghiệp may vá',
    category: 'VOCATIONAL_TOOL',
    urgency_level: 'NORMAL',
    reason_description: 'Muốn nhận máy may để nhận gia công sửa quần áo tại nhà vừa kiếm thêm thu nhập vừa chăm sóc con nhỏ.',
    commitment_pledge: 'Cam kết may miễn phí quần áo cho trẻ em mồ côi trong xóm.',
    province_code: 'Đà Nẵng (48)',
    verification_status: 'VERIFIED',
  },
];

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [wishes, setWishes] = useState<WishItem[]>(INITIAL_DEMO_WISHES);

  useEffect(() => {
    async function fetchWishes() {
      try {
        const { data, error } = await supabase
          .from('wishlist_items')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          setWishes(data as WishItem[]);
        }
      } catch {
        // Fallback to initial seeds
      }
    }
    fetchWishes();
  }, []);

  const filteredWishes = selectedCategory === 'ALL'
    ? wishes
    : wishes.filter(w => w.category === selectedCategory);

  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <div className="text-center space-y-4 max-w-3xl mx-auto pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Kinh Tế Tuần Hoàn 0 Đồng - Không Thương Mại Hóa
        </div>
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
          Cây Nguyện Ước <span className="text-emerald-400">SOVA GIVE 100</span>
        </h2>
        <p className="text-base sm:text-lg text-slate-400 leading-relaxed">
          Nơi hiện thực hóa các điều ước học tập & mưu sinh thiết thực. 
          Giao dịch 100% bằng sự tử tế, bắt tay xác thực qua QR và hộ chiếu vật phẩm tuần hoàn.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link
            href="/create-wish"
            className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all hover:scale-105"
          >
            + Gửi Nguyện Ước 0Đ
          </Link>
          <Link
            href="/handshake"
            className="px-6 py-3 rounded-xl glass-panel hover:bg-slate-800 text-slate-200 font-semibold text-sm transition-all"
          >
            Quét Mã Bắt Tay QR
          </Link>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-5 rounded-2xl border-l-4 border-emerald-500">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Vốn Xã Hội (Karma)</div>
          <div className="text-3xl font-black text-white mt-1">100,000+</div>
          <div className="text-xs text-emerald-400 mt-1">Điểm tử tế luân chuyển cộng đồng</div>
        </div>
        <div className="glass-panel p-5 rounded-2xl border-l-4 border-cyan-500">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">CO2 Giảm Thải</div>
          <div className="text-3xl font-black text-white mt-1">1,450.5 kg</div>
          <div className="text-xs text-cyan-400 mt-1">Tiết kiệm nhờ tái tuần hoàn hiện vật</div>
        </div>
        <div className="glass-panel p-5 rounded-2xl border-l-4 border-amber-500">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nguyện Ước Đã Trao</div>
          <div className="text-3xl font-black text-white mt-1">100%</div>
          <div className="text-xs text-amber-400 mt-1">Xác thực bắt tay QR 0Đ an toàn</div>
        </div>
      </div>

      {/* 3-Tier Filter */}
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-800 pb-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <span>Danh Sách Ước Nguyện Cần Trợ Lực</span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
              {filteredWishes.length}
            </span>
          </h3>

          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`text-xs px-3.5 py-1.5 rounded-full font-medium transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                    : 'glass-panel text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Wish Feed Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWishes.map(item => (
            <div
              key={item.id}
              className="glass-panel rounded-2xl p-6 flex flex-col justify-between hover:border-emerald-500/40 transition-all group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                    {item.category}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      item.urgency_level === 'CRITICAL'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : item.urgency_level === 'HIGH'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {item.urgency_level}
                  </span>
                </div>

                <h4 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-2">
                  {item.title}
                </h4>

                <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                  {item.reason_description}
                </p>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-400 italic">
                  &ldquo;{item.commitment_pledge}&rdquo;
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">
                  {item.province_code}
                </span>
                <Link
                  href={`/handshake?wish_id=${item.id}`}
                  className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                >
                  Trao tặng ngay →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
