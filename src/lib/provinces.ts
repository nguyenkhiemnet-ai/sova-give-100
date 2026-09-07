export interface District {
  code: string;
  name: string;
}

export interface Province {
  code: string;
  name: string;
  districts: District[];
}

export const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  bicycle: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80',
  commute: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80',
  laptop: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80',
  study_device: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80',
  sewing_machine: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=800&q=80',
  vocational_tool: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=800&q=80',
  study_tools: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80',
  livelihood_tools: 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=800&q=80',
};

// Tự động nhận diện danh mục thông minh theo tiêu đề
export function inferCategory(title: string, currentCategory?: string): string {
  const t = (title || '').toLowerCase();
  if (t.includes('xe đạp') || t.includes('xe dap') || t.includes('xe ') || t.includes('bike')) return 'bicycle';
  if (t.includes('máy may') || t.includes('may may') || t.includes('khâu')) return 'sewing_machine';
  if (t.includes('máy tính') || t.includes('laptop') || t.includes('pc') || t.includes('máy')) return 'laptop';
  
  const c = (currentCategory || '').toLowerCase();
  if (c === 'commute') return 'bicycle';
  if (c === 'study_device') return 'laptop';
  if (c === 'vocational_tool') return 'sewing_machine';
  return currentCategory || 'bicycle';
}

export function normalizeCategoryLabel(cat: string): string {
  const c = (cat || '').toLowerCase();
  if (c === 'bicycle' || c === 'commute') return 'Xe Đạp';
  if (c === 'laptop' || c === 'study_device') return 'Máy Tính';
  if (c === 'sewing_machine' || c === 'vocational_tool') return 'Máy May';
  if (c === 'study_tools') return 'Tri Thức';
  if (c === 'livelihood_tools') return 'Mưu Sinh';
  return 'Dụng Cụ';
}

export const VIETNAM_PROVINCES: Province[] = [
  {
    code: '48',
    name: 'Đà Nẵng',
    districts: [
      { code: '48-ST', name: 'Quận Sơn Trà' },
      { code: '48-HC', name: 'Quận Hải Châu' },
      { code: '48-TK', name: 'Quận Thanh Khê' },
      { code: '48-NHS', name: 'Quận Ngũ Hành Sơn' },
      { code: '48-LC', name: 'Quận Liên Chiểu' },
      { code: '48-CL', name: 'Quận Cẩm Lệ' },
      { code: '48-HV', name: 'Huyện Hòa Vang' }
    ]
  },
  {
    code: '01',
    name: 'Hà Nội',
    districts: [
      { code: '01-03', name: 'Quận Hai Bà Trưng' },
      { code: '01-01', name: 'Quận Ba Đình' },
      { code: '01-02', name: 'Quận Hoàn Kiếm' },
      { code: '01-04', name: 'Quận Đống Đa' },
      { code: '01-05', name: 'Quận Cầu Giấy' },
      { code: '01-06', name: 'Quận Thanh Xuân' },
      { code: '01-07', name: 'Quận Hoàng Mai' },
      { code: '01-08', name: 'Quận Long Biên' },
      { code: '01-11', name: 'Quận Hà Đông' }
    ]
  },
  {
    code: '79',
    name: 'TP. Hồ Chí Minh',
    districts: [
      { code: '79-01', name: 'Quận 1' },
      { code: '79-03', name: 'Quận 3' },
      { code: '79-05', name: 'Quận 5' },
      { code: '79-07', name: 'Quận 7' },
      { code: '79-BT', name: 'Quận Bình Thạnh' },
      { code: '79-TD', name: 'TP. Thủ Đức' }
    ]
  },
  {
    code: '02',
    name: 'Hà Giang',
    districts: [
      { code: '02-01', name: 'TP. Hà Giang' },
      { code: '02-02', name: 'Huyện Đồng Văn' },
      { code: '02-03', name: 'Huyện Mèo Vạc' }
    ]
  },
  {
    code: '31',
    name: 'Hải Phòng',
    districts: [
      { code: '31-01', name: 'Quận Hồng Bàng' },
      { code: '31-02', name: 'Quận Ngô Quyền' },
      { code: '31-03', name: 'Quận Lê Chân' }
    ]
  },
  {
    code: '92',
    name: 'Cần Thơ',
    districts: [
      { code: '92-01', name: 'Quận Ninh Kiều' },
      { code: '92-02', name: 'Quận Bình Thủy' }
    ]
  },
  {
    code: '99',
    name: 'Tỉnh/Thành phố khác',
    districts: [
      { code: '99-01', name: 'Khu vực Trung tâm' },
      { code: '99-02', name: 'Khu vực Ngoại vi' }
    ]
  }
];

export function getDistrictsByProvince(provinceCode: string): District[] {
  const p = VIETNAM_PROVINCES.find(prov => prov.code === provinceCode);
  return p ? p.districts : [{ code: 'ALL', name: 'Toàn bộ Quận/Huyện' }];
}

export function getDistrictNameSafe(provCode: string, wardCode?: string): string {
  if (!wardCode) return 'Khu vực Trung tâm';
  const inProv = getDistrictsByProvince(provCode).find(d => d.code === wardCode);
  if (inProv) return inProv.name;
  for (const p of VIETNAM_PROVINCES) {
    const found = p.districts.find(d => d.code === wardCode);
    if (found) return found.name;
  }
  return 'Khu vực Trung tâm';
}
