'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

interface CircularItem {
  id: string;
  passport_code: string;
  item_name: string;
  item_description: string;
  item_condition: string;
  estimated_carbon_value_kg: number;
  status: string;
}

const DEMO_ITEMS: CircularItem[] = [
  {
    id: 'pass-1',
    passport_code: 'SOVA-PASS-8842-VN',
    item_name: 'Laptop ThinkPad T480 Core i5',
    item_description: 'Đã phục vụ 1 sinh viên Đại học Bách Khoa tốt nghiệp loại ưu. Đã nâng cấp SSD 256GB.',
    item_condition: 'GOOD',
    estimated_carbon_value_kg: 85.5,
    status: 'DELIVERED',
  },
  {
    id: 'pass-2',
    passport_code: 'SOVA-PASS-9102-VN',
    item_name: 'Xe đạp Thống Nhất 24 inch',
    item_description: 'Đã hoàn tất kiểm tra phanh xích, gắn giỏ xe mới. Đang phục vụ học sinh nghèo hiếu học.',
    item_condition: 'GOOD',
    estimated_carbon_value_kg: 32.0,
    status: 'DELIVERED',
  },
  {
    id: 'pass-3',
    passport_code: 'SOVA-PASS-1049-VN',
    item_name: 'Bộ máy khoan đa năng kèm phụ kiện',
    item_description: 'Dụng cụ sửa chữa gia dụng cho thợ điện nước khởi nghiệp tại Đà Nẵng.',
    item_condition: 'LIKE_NEW',
    estimated_carbon_value_kg: 18.2,
    status: 'AVAILABLE',
  },
];

export default function PassportsPage() {
  const [items, setItems] = useState<CircularItem[]>(DEMO_ITEMS);

  useEffect(() => {
    async function fetchItems() {
      try {
        const { data, error } = await supabase
          .from('circular_items')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          setItems(data as CircularItem[]);
        }
      } catch {
        // Fallback to demo items
      }
    }
    fetchItems();
  }, []);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <Link href="/" className="text-xs text-slate-400 hover:text-emerald-400 mb-2 inline-block">
          ← Quay lại Cây Nguyện Ước
        </Link>
        <h2 className="text-2xl sm:text-3xl font-black text-white">
          Hộ Chiếu Vật Phẩm Tuần Hoàn (Circular Passports)
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Mỗi hiện vật có một mã hộ chiếu duy nhất chống bán ra tiệm cầm đồ và theo dõi lượng CO2 giảm thải qua từng vòng đời trao tặng.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map(item => (
          <div
            key={item.id}
            className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4 hover:border-cyan-500/40 transition-all"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  {item.passport_code}
                </span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {item.status}
                </span>
              </div>

              <h3 className="text-base font-bold text-white">
                {item.item_name}
              </h3>

              <p className="text-xs text-slate-300 leading-relaxed">
                {item.item_description}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <div className="text-slate-400">
                Tình trạng: <span className="text-white font-medium">{item.item_condition}</span>
              </div>
              <div className="text-emerald-400 font-bold">
                -{item.estimated_carbon_value_kg} kg CO2
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
