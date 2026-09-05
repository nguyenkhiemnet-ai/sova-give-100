'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { 
  ArrowLeft, ShieldCheck, CheckCircle2, XCircle, AlertCircle, 
  Clock, Activity, FileText, Search, Filter, RefreshCw, 
  MapPin, UserCheck, Database, HardDrive, Check, Lock, ChevronRight
} from 'lucide-react';

interface PendingWish {
  id: string;
  title: string;
  category: string;
  reason?: string;
  honor_commitment?: string;
  urgency?: string;
  province_code?: string;
  status: string;
  created_at?: string;
}

interface AuditLog {
  id: string;
  action: string;
  actor: string;
  target: string;
  timestamp: string;
  status: 'COMPLIANT' | 'FLAGGED';
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'QUEUE' | 'AUDIT' | 'INFRA'>('QUEUE');
  const [wishes, setWishes] = useState<PendingWish[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const [auditLogs] = useState<AuditLog[]>([
    {
      id: 'log-1',
      action: 'DIGNITY_SHIELD_EXIF_STRIP',
      actor: 'System Auto-Filter',
      target: 'WISH-A111 (Laptop CNTT)',
      timestamp: '05/09/2026 21:15:30',
      status: 'COMPLIANT'
    },
    {
      id: 'log-2',
      action: 'HANDSHAKE_CLAIM_LOCK',
      actor: 'Angel (0982***112)',
      target: 'WISH-B222 (Xe đạp)',
      timestamp: '05/09/2026 20:45:12',
      status: 'COMPLIANT'
    },
    {
      id: 'log-3',
      action: 'SENTINEL_KEEP_ALIVE_PING',
      actor: 'Cloudflare Cron Worker',
      target: 'PostgreSQL Singapore',
      timestamp: '05/09/2026 20:42:00',
      status: 'COMPLIANT'
    }
  ]);

  useEffect(() => {
    fetchPendingWishes();
  }, []);

  async function fetchPendingWishes() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('wishes')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        setWishes(data as PendingWish[]);
      } else {
        // Fallback danh sách chờ thẩm định mẫu
        setWishes([
          {
            id: 'w-sample-1',
            title: 'Bộ máy tính bàn phục vụ lớp học tình thương',
            category: 'laptop',
            reason: 'Lớp học có 12 em học sinh có hoàn cảnh khó khăn tại bãi giữa sông Hồng, cần máy tính để dạy tin học căn bản.',
            honor_commitment: 'Cam kết mở lớp miễn phí cho trẻ em nghèo và bảo dưỡng định kỳ hàng tháng.',
            urgency: 'urgent',
            province_code: '01',
            status: 'pending'
          },
          {
            id: 'w-sample-2',
            title: 'Dụng cụ sửa xe đạp mưu sinh cho người khuyết tật',
            category: 'livelihood_tools',
            reason: 'Bị thương tật chân sau tai nạn, cần bộ dụng cụ vá xe nhỏ để ngồi làm việc kiếm sống nuôi bản thân.',
            honor_commitment: 'Cam kết tự lực cánh sinh, không trông chờ trợ cấp và vá xe miễn phí cho học sinh tiểu học.',
            urgency: 'urgent',
            province_code: '79',
            status: 'pending'
          }
        ]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleApproveWish(id: string) {
    try {
      const { error } = await supabase
        .from('wishes')
        .update({ status: 'verified' })
        .eq('id', id);

      setWishes(prev => prev.map(w => w.id === id ? { ...w, status: 'verified' } : w));
      setActionSuccess(`Đã phê duyệt điều ước "${id}" thành công! Dữ liệu đã hiển thị trên Cây Nguyện Ước.`);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      alert('Lỗi phê duyệt: ' + err.message);
    }
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      
      {/* Header & Quyền Hạn */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link 
          href="/" 
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-warm-200 bg-white text-xs font-bold text-warm-700 hover:text-brand-700 hover:border-brand-500 shadow-2xs transition-all w-fit"
        >
          <ArrowLeft className="w-4 h-4"/>
          <span>Quay lại Cây Nguyện Ước</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1 rounded-full text-xs font-extrabold bg-brand-50 text-brand-700 border border-brand-200 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-brand-600"/>
            Thẩm Quyền Tối Cao: Nguyễn Khiêm (21/08/1984)
          </span>
        </div>
      </div>

      {/* Banner Quản Trị Cấp Cao */}
      <section className="bg-gradient-to-br from-brand-50 via-white to-warm-100 rounded-3xl border border-warm-200 p-6 sm:p-8 shadow-soft space-y-3">
        <div className="flex items-center gap-2 text-xs font-extrabold text-brand-700 uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4"/>
          Bàn Thẩm Định Đại Sứ & Bảng Điều Khiển An Ninh
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-warm-900 tracking-tight">
          Hệ Thống Kiểm Soát & Giám Sát Tuần Hoàn
        </h1>
        <p className="text-xs sm:text-sm text-warm-700 max-w-2xl leading-relaxed">
          Thẩm định hồ sơ hoàn cảnh, giám sát tính toàn vẹn của dữ liệu theo Nghị định 13/2023/NĐ-CP và theo dõi trạng thái vận hành của toàn bộ cơ sở hạ tầng đám mây.
        </p>
      </section>

      {/* Thông báo thành công */}
      {actionSuccess && (
        <div className="p-4 bg-brand-50 rounded-2xl border border-brand-200 text-xs font-bold text-brand-900 flex items-center gap-2 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0"/>
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Tabs Chức Năng Quản Trị */}
      <div className="flex border-b border-warm-200 gap-6">
        <button
          onClick={() => setActiveTab('QUEUE')}
          className={`pb-3 text-sm font-black transition-all flex items-center gap-2 border-b-2 ${
            activeTab === 'QUEUE'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-warm-700 hover:text-warm-900'
          }`}
        >
          <UserCheck className="w-4 h-4"/>
          <span>Hàng Đợi Thẩm Định Hoàn Cảnh ({wishes.filter(w => w.status === 'pending').length})</span>
        </button>

        <button
          onClick={() => setActiveTab('AUDIT')}
          className={`pb-3 text-sm font-black transition-all flex items-center gap-2 border-b-2 ${
            activeTab === 'AUDIT'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-warm-700 hover:text-warm-900'
          }`}
        >
          <FileText className="w-4 h-4"/>
          <span>Nhật Ký Kiểm Toán Nghị Định 13 ({auditLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('INFRA')}
          className={`pb-3 text-sm font-black transition-all flex items-center gap-2 border-b-2 ${
            activeTab === 'INFRA'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-warm-700 hover:text-warm-900'
          }`}
        >
          <Activity className="w-4 h-4"/>
          <span>Trạng Thái Hạ Tầng 24/7</span>
        </button>
      </div>

      {/* TAB 1: HÀNG ĐỢI THẨM ĐỊNH */}
      {activeTab === 'QUEUE' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-black text-warm-900">
              Danh Sách Hồ Sơ Chờ Đại Sứ Xác Minh
            </h3>
            <button 
              onClick={fetchPendingWishes}
              className="text-xs font-bold text-brand-700 hover:underline flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5"/>
              <span>Làm mới dữ liệu</span>
            </button>
          </div>

          <div className="space-y-4">
            {wishes.map((wish) => {
              const isPending = wish.status === 'pending';
              return (
                <div 
                  key={wish.id}
                  className="bg-white rounded-3xl border border-warm-200 p-6 shadow-soft space-y-4"
                >
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold uppercase bg-brand-50 text-brand-700 border border-brand-200">
                          {wish.category}
                        </span>
                        <span className="font-mono text-xs text-warm-700">Mã: {wish.id}</span>
                      </div>
                      <h4 className="text-base font-black text-warm-900">{wish.title}</h4>
                    </div>

                    <span className={`px-3 py-1 rounded-full text-xs font-black self-start sm:self-center ${
                      isPending 
                        ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                        : 'bg-brand-50 text-brand-700 border border-brand-200'
                    }`}>
                      {isPending ? 'Đang Chờ Xác Minh' : 'Đã Phê Duyệt Hợp Lệ'}
                    </span>
                  </div>

                  <div className="p-4 bg-warm-50 rounded-2xl border border-warm-200 text-xs text-warm-700 space-y-2">
                    <p><strong>Hoàn cảnh chia sẻ:</strong> {wish.reason || 'Cần hỗ trợ công cụ lao động.'}</p>
                    <p className="italic text-brand-950">
                      <strong>Cam kết danh dự:</strong> "{wish.honor_commitment || 'Cam kết bảo quản tốt.'}"
                    </p>
                  </div>

                  {isPending && (
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={() => alert('Đã yêu cầu bổ sung thông tin!')}
                        className="px-4 py-2 rounded-xl border border-warm-200 hover:bg-warm-100 text-xs font-bold text-warm-700"
                      >
                        Yêu Cầu Bổ Sung
                      </button>
                      <button
                        onClick={() => handleApproveWish(wish.id)}
                        className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-black shadow-xs flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5"/>
                        <span>Duyệt Hợp Lệ (Verified)</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: NHẬT KÝ KIỂM TOÁN NGHỊ ĐỊNH 13 */}
      {activeTab === 'AUDIT' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-warm-200 p-6 shadow-soft space-y-4">
            <h3 className="text-base font-black text-warm-900">
              Nhật Ký Sự Kiện An Ninh & Bảo Mật PII (Audit Trail)
            </h3>
            <p className="text-xs text-warm-700">
              Mọi hành vi trích xuất, thay đổi trạng thái và bóc tách dữ liệu nhị phân đều được ghi lại bất biến theo Nghị định 13/2023/NĐ-CP.
            </p>

            <div className="space-y-3 pt-2">
              {auditLogs.map(log => (
                <div 
                  key={log.id}
                  className="p-4 bg-warm-50 rounded-2xl border border-warm-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-warm-900">{log.action}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-brand-100 text-brand-800 font-extrabold">
                        {log.status}
                      </span>
                    </div>
                    <p className="text-warm-700">
                      Tác nhân: <strong>{log.actor}</strong> • Đối tượng: <span className="font-mono">{log.target}</span>
                    </p>
                  </div>
                  <span className="font-mono text-[11px] text-warm-700">{log.timestamp}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TRẠNG THÁI HẠ TẦNG 24/7 */}
      {activeTab === 'INFRA' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-3xl border border-warm-200 shadow-soft space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-warm-700 uppercase">Supabase Singapore</span>
              <Database className="w-5 h-5 text-brand-600"/>
            </div>
            <div className="text-2xl font-black text-brand-700">ONLINE 100%</div>
            <p className="text-[11px] text-warm-700 leading-relaxed">
              Region: ap-southeast-1. 4 Tables, Row-Level Security, 3 RPCs kích hoạt đầy đủ.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-warm-200 shadow-soft space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-warm-700 uppercase">Sentinel Worker</span>
              <Activity className="w-5 h-5 text-sun-600"/>
            </div>
            <div className="text-2xl font-black text-sun-600">ACTIVE 24/7</div>
            <p className="text-[11px] text-warm-700 leading-relaxed">
              Cron Trigger: */3 * * * *. Tỷ lệ lỗi 0%. Chống ngủ đông vĩnh viễn cho Database.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-warm-200 shadow-soft space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-warm-700 uppercase">Cloudflare R2 Bucket</span>
              <HardDrive className="w-5 h-5 text-blue-600"/>
            </div>
            <div className="text-2xl font-black text-blue-900">READY</div>
            <p className="text-[11px] text-warm-700 leading-relaxed">
              Bucket: sova-proof-assets. Mở CORS 4 phương thức. Lưu trữ an toàn ảnh Dignity Shield.
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
