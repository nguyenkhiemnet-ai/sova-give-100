export interface District {
  code: string;
  name: string;
}

export interface Province {
  code: string;
  name: string;
  districts: District[];
}

export const VIETNAM_PROVINCES: Province[] = [
  {
    code: '01',
    name: 'Hà Nội',
    districts: [
      { code: '01-01', name: 'Quận Ba Đình' },
      { code: '01-02', name: 'Quận Hoàn Kiếm' },
      { code: '01-03', name: 'Quận Hai Bà Trưng' },
      { code: '01-04', name: 'Quận Đống Đa' },
      { code: '01-05', name: 'Quận Cầu Giấy' },
      { code: '01-06', name: 'Quận Thanh Xuân' },
      { code: '01-07', name: 'Quận Hoàng Mai' },
      { code: '01-08', name: 'Quận Long Biên' },
      { code: '01-09', name: 'Quận Nam Từ Liêm' },
      { code: '01-10', name: 'Quận Bắc Từ Liêm' },
      { code: '01-11', name: 'Quận Hà Đông' },
      { code: '01-12', name: 'Thị xã Sơn Tây' },
      { code: '01-13', name: 'Huyện Đông Anh' },
      { code: '01-14', name: 'Huyện Gia Lâm' }
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
      { code: '79-10', name: 'Quận 10' },
      { code: '79-BT', name: 'Quận Bình Thạnh' },
      { code: '79-GV', name: 'Quận Gò Vấp' },
      { code: '79-TB', name: 'Quận Tân Bình' },
      { code: '79-TD', name: 'TP. Thủ Đức' },
      { code: '79-BC', name: 'Huyện Bình Chánh' },
      { code: '79-HM', name: 'Huyện Hóc Môn' }
    ]
  },
  {
    code: '48',
    name: 'Đà Nẵng',
    districts: [
      { code: '48-01', name: 'Quận Hải Châu' },
      { code: '48-02', name: 'Quận Thanh Khê' },
      { code: '48-03', name: 'Quận Sơn Trà' },
      { code: '48-04', name: 'Quận Ngũ Hành Sơn' },
      { code: '48-05', name: 'Quận Liên Chiểu' },
      { code: '48-06', name: 'Quận Cẩm Lệ' },
      { code: '48-07', name: 'Huyện Hòa Vang' }
    ]
  },
  {
    code: '02',
    name: 'Hà Giang',
    districts: [
      { code: '02-01', name: 'TP. Hà Giang' },
      { code: '02-02', name: 'Huyện Đồng Văn' },
      { code: '02-03', name: 'Huyện Mèo Vạc' },
      { code: '02-04', name: 'Huyện Yên Minh' },
      { code: '02-05', name: 'Huyện Quản Bạ' },
      { code: '02-06', name: 'Huyện Vị Xuyên' },
      { code: '02-07', name: 'Huyện Bắc Mê' },
      { code: '02-08', name: 'Huyện Hoàng Su Phì' }
    ]
  },
  {
    code: '31',
    name: 'Hải Phòng',
    districts: [
      { code: '31-01', name: 'Quận Hồng Bàng' },
      { code: '31-02', name: 'Quận Ngô Quyền' },
      { code: '31-03', name: 'Quận Lê Chân' },
      { code: '31-04', name: 'Quận Hải An' },
      { code: '31-05', name: 'Huyện Thủy Nguyên' }
    ]
  },
  {
    code: '92',
    name: 'Cần Thơ',
    districts: [
      { code: '92-01', name: 'Quận Ninh Kiều' },
      { code: '92-02', name: 'Quận Bình Thủy' },
      { code: '92-03', name: 'Quận Cái Răng' },
      { code: '92-04', name: 'Quận Ô Môn' }
    ]
  },
  {
    code: '46',
    name: 'Thừa Thiên Huế',
    districts: [
      { code: '46-01', name: 'TP. Huế' },
      { code: '46-02', name: 'Thị xã Hương Thủy' },
      { code: '46-03', name: 'Huyện Phú Vang' }
    ]
  },
  {
    code: '74',
    name: 'Bình Dương',
    districts: [
      { code: '74-01', name: 'TP. Thủ Dầu Một' },
      { code: '74-02', name: 'TP. Thuận An' },
      { code: '74-03', name: 'TP. Dĩ An' }
    ]
  },
  {
    code: '75',
    name: 'Đồng Nai',
    districts: [
      { code: '75-01', name: 'TP. Biên Hòa' },
      { code: '75-02', name: 'TP. Long Khánh' },
      { code: '75-03', name: 'Huyện Long Thành' }
    ]
  },
  {
    code: '68',
    name: 'Lâm Đồng',
    districts: [
      { code: '68-01', name: 'TP. Đà Lạt' },
      { code: '68-02', name: 'TP. Bảo Lộc' },
      { code: '68-03', name: 'Huyện Đức Trọng' }
    ]
  },
  {
    code: '99',
    name: 'Tỉnh/Thành phố khác',
    districts: [
      { code: '99-01', name: 'Khu vực Trung tâm' },
      { code: '99-02', name: 'Khu vực Ngoại vi / Huyện lân cận' }
    ]
  }
];

export function getDistrictsByProvince(provinceCode: string): District[] {
  const p = VIETNAM_PROVINCES.find(prov => prov.code === provinceCode);
  return p ? p.districts : [{ code: '00', name: 'Toàn bộ địa bàn' }];
}
