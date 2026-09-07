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

// Danh bạ các Safe Hub công cộng 0-VND (Xóa sổ thuế cà phê 100%)
export const SAFE_PUBLIC_MEETING_HUBS = [
  { 
    id: 'hub-bk-hn', 
    name: 'Sảnh Thư viện Tạ Quang Bửu (ĐHBK Hà Nội)', 
    district: 'Hai Bà Trưng', 
    city: 'Hà Nội',
    note: 'Có ghế ngồi đàng hoàng, bảo vệ 24/7, không mất tiền nước'
  },
  { 
    id: 'hub-nvh-hcm', 
    name: 'Nhà Văn Hóa Sinh Viên - ĐHQG TP.HCM', 
    district: 'Thủ Đức', 
    city: 'TP. Hồ Chí Minh',
    note: 'Khu vực tự học công cộng miễn phí, an ninh tuyệt đối'
  },
  { 
    id: 'hub-hl-dn', 
    name: 'Trung Tâm Học Liệu Đại Học Đà Nẵng', 
    district: 'Hải Châu', 
    city: 'Đà Nẵng',
    note: 'Không gian mở văn minh cho sinh viên'
  },
  { 
    id: 'hub-vt-cg', 
    name: 'Điểm Hẹn Gửi Đồ Ủy Thác Bưu Cục Viettel Post', 
    district: 'Cầu Giấy', 
    city: 'Hà Nội',
    note: 'Dành cho người trao muốn gửi máy lại quầy, sinh viên tự đến nhận'
  }
];

// Dữ liệu mẫu Timebanking (Phụng sự xã hội đổi thiết bị)
export interface TimebankRecord {
  hoursCompleted: number;
  totalRequired: number;
  tasks: string[];
}
