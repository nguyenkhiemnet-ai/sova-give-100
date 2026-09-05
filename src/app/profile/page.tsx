export default function ProfilePage() {
  return (
    <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-warm-200 p-8 shadow-soft space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-brand-100 text-brand-700 font-black text-2xl flex items-center justify-center">K</div>
        <div>
          <h1 className="text-2xl font-black text-warm-900">Hồ Sơ Công Dân Tử Tế</h1>
          <p className="text-sm text-warm-700">Trọng tài phê duyệt: Nguyễn Khiêm (21/08/1984)</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-brand-50 border border-brand-100">
          <span className="text-xs font-bold text-brand-700 uppercase">Vốn Xã Hội (Karma)</span>
          <p className="text-3xl font-black text-brand-900 mt-1">100 ⭐</p>
        </div>
        <div className="p-4 rounded-2xl bg-sun-50 border border-sun-100">
          <span className="text-xs font-bold text-sun-600 uppercase">CO2 Đã Giảm Thiểu</span>
          <p className="text-3xl font-black text-sun-600 mt-1">12.5 kg</p>
        </div>
      </div>
    </div>
  );
}
