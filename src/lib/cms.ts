import { supabase } from './supabaseClient';

export interface HeroCMSData {
  badge: string;
  titlePrimary: string;
  titleHighlight: string;
  description: string;
  bannerImage: string;
  imageQuote: string;
  statKarma: string;
  statCO2: string;
  statRecycle: string;
}

export interface FooterCMSData {
  badge: string;
  headline: string;
  description: string;
  copyright: string;
  legalNote: string;
}

export interface SubpagesCMSData {
  createWishNotice: string;
  handshakeRules: string;
}

export interface BroadcastBannerData {
  enabled: boolean;
  text: string;
  type: 'info' | 'alert' | 'success';
  linkText?: string;
  linkUrl?: string;
}

export interface DynamicCategoryItem {
  id: string;
  label: string;
  shortLabel: string;
  iconName?: string;
  desc?: string;
}

export interface FullSiteCMS {
  hero: HeroCMSData;
  footer: FooterCMSData;
  subpages: SubpagesCMSData;
  broadcast: BroadcastBannerData;
  categories: DynamicCategoryItem[];
}

export const DEFAULT_FULL_CMS: FullSiteCMS = {
  hero: {
    badge: "Kinh Tế Tuần Hoàn 0-VND • Trao Cơ Hội, Giữ Danh Dự",
    titlePrimary: "Đừng để đồ tốt ngủ quên trong góc tối.",
    titleHighlight: "Hãy biến chúng thành tương lai của ai đó.",
    description: "Bao nhiêu chiếc laptop cũ, xe đạp, máy may vẫn còn chạy rất tốt nhưng đang nằm phủ bụi trong kho? Tại SOVAHUB.org, vật phẩm của bạn tìm thấy cuộc đời thứ hai qua Hộ Chiếu Số và cái Bắt Tay Tử Tế 0 Đồng.",
    bannerImage: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=1200&q=80",
    imageQuote: "Mỗi chiếc xe đạp trao đi là con đường đến trường của các em bớt gập ghềnh.",
    statKarma: "100,000+ ⭐",
    statCO2: "1,450.5 kg",
    statRecycle: "100% 0-VND"
  },
  footer: {
    badge: "Lan Tỏa Tinh Thần 0-VND Đến Cộng Đồng",
    headline: "Một Lần Chia Sẻ • Một Tương Lai Được Thắp Sáng",
    description: "Hãy gửi đường link SOVAHUB.org tới bạn bè hoặc các hội đồng hương để những chiếc xe đạp, máy tính cũ tìm đúng người cần nhất.",
    copyright: "© 2026 SOVAHUB.org • Hệ Thống Tuần Hoàn Sinh Kế Phi Thương Mại",
    legalNote: "Bảo mật danh dự công dân theo Nghị định 13/2023/NĐ-CP"
  },
  subpages: {
    createWishNotice: "Hồ sơ của bạn được bảo vệ danh dự theo Nghị định 13/2023/NĐ-CP. Tuyệt đối không giao dịch tiền mặt.",
    handshakeRules: "Quy tắc trạm an toàn: Giao dịch 100% bằng hiện vật 0 đồng tại Safe Hub. Nghiêm cấm nhận tiền bồi dưỡng."
  },
  broadcast: {
    enabled: true,
    text: "🔥 CHỦ TRƯƠNG 0-VND TOÀN QUỐC: Nghiêm cấm nhận hoặc đưa tiền mặt dưới mọi hình thức khi tiếp sức sinh kế!",
    type: "info",
    linkText: "Xem Quy Chuẩn",
    linkUrl: "/handshake/"
  },
  categories: [
    { id: 'bicycle', label: 'Xe đạp đến trường', shortLabel: 'Xe đạp', iconName: 'Bike', desc: 'Phương tiện đi lại cho học sinh nghèo' },
    { id: 'laptop', label: 'Máy tính học tập', shortLabel: 'Máy tính', iconName: 'Laptop', desc: 'Laptop, PC cho học sinh - sinh viên' },
    { id: 'sewing_machine', label: 'Máy may sinh kế', shortLabel: 'Máy may', iconName: 'Scissors', desc: 'Dụng cụ may vá cho mẹ đơn thân' },
    { id: 'study_tools', label: 'Dụng cụ tri thức', shortLabel: 'Sách & Dụng cụ', iconName: 'BookOpen', desc: 'Sách vở, bàn học, máy tính cầm tay' },
    { id: 'livelihood_tools', label: 'Công cụ mưu sinh', shortLabel: 'Nghề mưu sinh', iconName: 'Wrench', desc: 'Đồ nghề sửa xe, làm mộc, làm nông' }
  ]
};

// Cờ kiểm soát fetch nền từ Supabase Cloud
let isCloudFetching = false;

export async function fetchFullSiteCMSFromCloud(): Promise<FullSiteCMS | null> {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'cms_full_config')
      .maybeSingle();

    if (!error && data && data.value) {
      const cloudCMS = data.value as FullSiteCMS;
      if (typeof window !== 'undefined') {
        localStorage.setItem('SOVA_FULL_SITE_CMS', JSON.stringify(cloudCMS));
        localStorage.setItem('SOVA_LIVE_CMS_HERO', JSON.stringify(cloudCMS.hero));
        window.dispatchEvent(new Event('sova_cms_updated'));
      }
      return cloudCMS;
    }
  } catch (e) {
    console.warn('Lỗi đọc Cloud CMS từ Supabase:', e);
  }
  return null;
}

export function getFullSiteCMS(): FullSiteCMS {
  if (typeof window === 'undefined') return DEFAULT_FULL_CMS;

  // Kích hoạt fetch nền đồng bộ từ Supabase nếu chưa fetch
  if (!isCloudFetching) {
    isCloudFetching = true;
    fetchFullSiteCMSFromCloud().catch(() => {});
  }

  try {
    const stored = localStorage.getItem('SOVA_FULL_SITE_CMS');
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...DEFAULT_FULL_CMS,
        ...parsed,
        hero: { ...DEFAULT_FULL_CMS.hero, ...(parsed.hero || {}) },
        footer: { ...DEFAULT_FULL_CMS.footer, ...(parsed.footer || {}) },
        subpages: { ...DEFAULT_FULL_CMS.subpages, ...(parsed.subpages || {}) },
        broadcast: { ...DEFAULT_FULL_CMS.broadcast, ...(parsed.broadcast || {}) },
        categories: parsed.categories && Array.isArray(parsed.categories) && parsed.categories.length > 0 
          ? parsed.categories 
          : DEFAULT_FULL_CMS.categories
      };
    }
  } catch {}
  return DEFAULT_FULL_CMS;
}

export function saveFullSiteCMS(data: FullSiteCMS): void {
  if (typeof window === 'undefined') return;
  
  // 1. Lưu LocalStorage & Phát sự kiện toàn máy
  localStorage.setItem('SOVA_FULL_SITE_CMS', JSON.stringify(data));
  localStorage.setItem('SOVA_LIVE_CMS_HERO', JSON.stringify(data.hero));
  
  try {
    const channel = new BroadcastChannel('sova_cms_channel');
    channel.postMessage({ type: 'CMS_UPDATED', data });
  } catch {}
  window.dispatchEvent(new Event('storage'));
  window.dispatchEvent(new Event('sova_cms_updated'));

  // 2. Đồng bộ phân tán lên Supabase Cloud site_settings
  (async () => {
    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert({
          key: 'cms_full_config',
          value: data,
          updated_at: new Date().toISOString()
        });
      if (error) {
        console.warn('Cảnh báo lưu CMS lên Supabase Cloud:', error.message);
      } else {
        console.log('✅ Đã đồng bộ Cloud CMS lên Supabase thành công!');
      }
    } catch (err) {
      console.warn('Lỗi mạng khi lưu Cloud CMS:', err);
    }
  })();
}

// Giữ tương thích ngược với các trang cũ nếu còn gọi getHeroCMS / saveHeroCMS
export function getHeroCMS(): HeroCMSData {
  return getFullSiteCMS().hero;
}

export function saveHeroCMS(data: HeroCMSData): void {
  const current = getFullSiteCMS();
  saveFullSiteCMS({ ...current, hero: data });
}

// Bộ nén Canvas Client-side chuẩn tốc độ cao
export async function compressImageToWebP(file: File): Promise<{ dataUrl: string; originalSize: string; compressedSize: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const maxDim = 1200;
        let w = img.width;
        let h = img.height;

        if (w > h && w > maxDim) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else if (h > maxDim) {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({
            dataUrl: e.target?.result as string,
            originalSize: (file.size / (1024 * 1024)).toFixed(2) + " MB",
            compressedSize: (file.size / 1024).toFixed(1) + " KB"
          });
          return;
        }

        ctx.drawImage(img, 0, 0, w, h);
        const compressed = canvas.toDataURL('image/jpeg', 0.82);

        const stringLength = compressed.length - 'data:image/jpeg;base64,'.length;
        const sizeInBytes = 4 * Math.ceil(stringLength / 3) * 0.5624896334383687;
        const compKb = (sizeInBytes / 1024).toFixed(1) + " KB";
        const origMb = (file.size / (1024 * 1024)).toFixed(2) + " MB";

        resolve({ dataUrl: compressed, originalSize: origMb, compressedSize: compKb });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}
