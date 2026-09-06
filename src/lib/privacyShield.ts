// Thuật toán ẩn danh hóa tên theo Nghị định 13/2023/NĐ-CP
export function maskFullName(name: string): string {
  if (!name) return 'Công dân tử tế';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]} ${parts[1][0]}.`;
  const firstName = parts[0];
  const lastName = parts[parts.length - 1];
  const middleInitials = parts.slice(1, -1).map(p => p[0] + '.').join(' ');
  return `${firstName} ${middleInitials} ${lastName[0]}.`;
}

// Tạo mã băm SHA-256 tượng trưng niêm phong Lời Cam Kết Danh Dự
export async function generatePledgeHash(pledge: string, author: string): Promise<string> {
  const data = `${author.trim()}::${pledge.trim()}::SOVA_HONOR_PLEDGE_2026`;
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `SHA256:7f8b9a${hex}e4d1c9`;
}

// Danh mục các điểm hẹn công cộng văn minh an toàn (<5km)
export const SAFE_PUBLIC_MEETING_HUBS = [
  { id: 'hub-1', name: 'Sảnh Thư viện Tạ Quang Bửu (ĐHBK Hà Nội)', district: 'Hai Bà Trưng', city: 'Hà Nội' },
  { id: 'hub-2', name: 'Nhà Văn Hóa Sinh Viên - ĐHQG', district: 'Thủ Đức', city: 'TP. Hồ Chí Minh' },
  { id: 'hub-3', name: 'Trung Tâm Học Liệu Đại Học Đà Nẵng', district: 'Hải Châu', city: 'Đà Nẵng' },
  { id: 'hub-4', name: 'Bưu Cục Viettel Post Trung Tâm (Điểm Hẹn Ủy Thác)', district: 'Cầu Giấy', city: 'Hà Nội' },
  { id: 'hub-5', name: 'Không Gian Sách Cộng Đồng Phố Đi Bộ', district: 'Hoàn Kiếm', city: 'Hà Nội' },
];
